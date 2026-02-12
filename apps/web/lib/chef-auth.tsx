"use client";

import { api } from "@/convex/_generated/api";
import { clearAuthToken, getAuthToken, setAuthToken } from "@/lib/auth-client";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

interface ChefAuthContextType {
    chef: any | null;
    user: any | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isBasicOnboardingComplete: boolean;
    isOnboardingComplete: boolean;
    sessionToken: string | null;
    login: (token: string, user: any) => Promise<void>;
    refreshChef: () => Promise<void>;
    logout: () => Promise<void>;
}

const ChefAuthContext = createContext<ChefAuthContextType | undefined>(undefined);

interface ChefAuthProviderProps {
    children: ReactNode;
}

export function ChefAuthProvider({ children }: ChefAuthProviderProps) {
    const [sessionToken, setSessionToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Load session token from auth-client on mount
    useEffect(() => {
        const loadToken = () => {
            try {
                const token = getAuthToken();
                setSessionToken(token);
            } catch (error) {
                console.error("Error loading session token:", error);
                setSessionToken(null);
            } finally {
                setIsLoading(false);
            }
        };
        loadToken();
    }, []);

    // Get user from session token
    const userQueryResult = useQuery(
        api.queries.users.getUserBySessionToken,
        sessionToken ? { sessionToken } : "skip"
    );

    const user = userQueryResult;

    // Get chef profile if user has chef role
    const chefQueryResult = useQuery(
        api.queries.chefs.getByUserId,
        user && user !== null && user.roles?.includes("chef") && user._id && sessionToken
            ? { userId: user._id, sessionToken: sessionToken }
            : "skip"
    );

    const chef = chefQueryResult;

    // Check if basic onboarding is complete (profile setup)
    const isBasicOnboardingComplete =
        useQuery(
            api.queries.chefs.isBasicOnboardingComplete,
            chef?._id && sessionToken ? { chefId: chef._id, sessionToken } : "skip"
        ) ?? false;

    // Check if onboarding is complete (compliance course completed)
    const isOnboardingComplete =
        useQuery(
            api.queries.chefCourses.isOnboardingComplete,
            chef?._id && sessionToken ? { chefId: chef._id, sessionToken } : "skip"
        ) ?? false;

    // Check if user is authenticated as a chef
    const isAuthenticated = !!user && !!sessionToken && user.roles?.includes("chef");

    // Handle invalid session token
    useEffect(() => {
        if (user === null && sessionToken) {
            console.warn("ChefAuth: User query returned null - session token is invalid or expired");
            setIsLoading(false);
            const clearToken = () => {
                try {
                    clearAuthToken();
                    setSessionToken(null);
                } catch (error) {
                    console.error("Error clearing session token:", error);
                }
            };
            clearToken();
        }
    }, [user, sessionToken]);

    // Determine if we're still loading
    const isQueryLoading = sessionToken !== null && user === undefined;

    // Safety timeout for query loading
    useEffect(() => {
        if (isQueryLoading && sessionToken) {
            const timeout = setTimeout(() => {
                console.warn("ChefAuth: Query loading timeout - stopping loading");
                setIsLoading(false);
            }, 10000); // 10 second timeout

            return () => clearTimeout(timeout);
        }
    }, [isQueryLoading, sessionToken]);

    const login = useCallback(
        async (token: string, userData: any) => {
            try {
                // Store session token using auth-client
                setAuthToken(token);
                // Update state to trigger re-fetch
                setSessionToken(token);
            } catch (error) {
                console.error("Error during login:", error);
                throw error;
            }
        },
        []
    );

    const refreshChef = useCallback(async () => {
        // Force refetch by updating session token state
        const token = getAuthToken();
        setSessionToken(token);
    }, []);

    const logout = useCallback(async () => {
        try {
            const token = getAuthToken();
            if (token) {
                // Call Convex mutation to delete session
                await convex.mutation(api.mutations.sessions.deleteSessionByToken, {
                    sessionToken: token,
                });
            }
        } catch (error) {
            console.error("Logout error in ChefAuth:", error);
        } finally {
            // Clear session token using auth-clientRegardless of error
            clearAuthToken();
            setSessionToken(null);
            router.push("/chef/sign-in");
        }
    }, [convex, router]);


    const contextValue: ChefAuthContextType = {
        chef: chef || null,
        user: user || null,
        isLoading: isLoading || isQueryLoading,
        isAuthenticated: !!isAuthenticated,
        isBasicOnboardingComplete: isBasicOnboardingComplete === true,
        isOnboardingComplete: isOnboardingComplete === true,
        sessionToken,
        login,
        refreshChef,
        logout,
    };

    return <ChefAuthContext.Provider value={contextValue}>{children}</ChefAuthContext.Provider>;
}

export function useChefAuth(): ChefAuthContextType {
    const context = useContext(ChefAuthContext);
    if (context === undefined) {
        throw new Error("useChefAuth must be used within a ChefAuthProvider");
    }
    return context;
}
