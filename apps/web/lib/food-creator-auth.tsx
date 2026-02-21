"use client";

import { api } from "@/convex/_generated/api";
import { clearAuthToken, getAuthToken, setAuthToken } from "@/lib/auth-client";
import { useConvex, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

interface FoodCreatorAuthContextType {
    foodCreator: any | null;
    user: any | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isBasicOnboardingComplete: boolean;
    isOnboardingComplete: boolean;
    sessionToken: string | null;
    login: (token: string, user: any) => Promise<void>;
    refreshFoodCreator: () => Promise<void>;
    logout: () => Promise<void>;
}

const FoodCreatorAuthContext = createContext<FoodCreatorAuthContextType | undefined>(undefined);

interface FoodCreatorAuthProviderProps {
    children: ReactNode;
}

export function FoodCreatorAuthProvider({ children }: FoodCreatorAuthProviderProps) {
    const convex = useConvex();
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

    // Get foodCreator profile if user has foodCreator role
    const foodCreatorQueryResult = useQuery(
        api.queries.foodCreators.getByUserId,
        user && user !== null && user.roles?.includes("foodCreator") && user._id && sessionToken
            ? { userId: user._id, sessionToken: sessionToken }
            : "skip"
    );

    const foodCreator = foodCreatorQueryResult;

    // Check if basic onboarding is complete (profile setup)
    const isBasicOnboardingComplete =
        useQuery(
            api.queries.foodCreators.isBasicOnboardingComplete,
            foodCreator?._id && sessionToken ? { foodCreatorId: foodCreator._id, sessionToken } : "skip"
        ) ?? false;

    // Check if onboarding is complete (compliance course completed)
    const isOnboardingComplete =
        useQuery(
            api.queries.foodCreatorCourses.isOnboardingComplete,
            foodCreator?._id && sessionToken ? { foodCreatorId: foodCreator._id, sessionToken } : "skip"
        ) ?? false;

    // Check if user is authenticated as a foodCreator
    const isAuthenticated = !!user && !!sessionToken && user.roles?.includes("foodCreator");

    // Handle invalid session token
    useEffect(() => {
        if (user === null && sessionToken) {
            console.warn("FoodCreatorAuth: User query returned null - session token is invalid or expired");
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
                console.warn("FoodCreatorAuth: Query loading timeout - stopping loading");
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

    const refreshFoodCreator = useCallback(async () => {
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
            console.error("Logout error in FoodCreatorAuth:", error);
        } finally {
            // Clear session token using auth-clientRegardless of error
            clearAuthToken();
            setSessionToken(null);
            router.push("/food-creator/sign-in");
        }
    }, [convex, router]);


    const contextValue: FoodCreatorAuthContextType = {
        foodCreator: foodCreator || null,
        user: user || null,
        isLoading: isLoading || isQueryLoading,
        isAuthenticated: !!isAuthenticated,
        isBasicOnboardingComplete: isBasicOnboardingComplete === true,
        isOnboardingComplete: isOnboardingComplete === true,
        sessionToken,
        login,
        refreshFoodCreator,
        logout,
    };

    return <FoodCreatorAuthContext.Provider value={contextValue}>{children}</FoodCreatorAuthContext.Provider>;
}

export function useFoodCreatorAuth(): FoodCreatorAuthContextType {
    const context = useContext(FoodCreatorAuthContext);
    if (context === undefined) {
        throw new Error("useFoodCreatorAuth must be used within a FoodCreatorAuthProvider");
    }
    return context;
}
