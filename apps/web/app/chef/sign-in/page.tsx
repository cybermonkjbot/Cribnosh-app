"use client";

import { api } from "@/convex/_generated/api";
import { useChefAuth } from "@/lib/chef-auth";
import { useAction } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CribNoshLogo } from "@/components/ui/CribNoshLogo";

export default function ChefSignInPage() {
    const { isAuthenticated, isLoading } = useChefAuth();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auth actions
    const chefLogin = useAction(api.actions.chefs.chefLogin);
    const { login } = useChefAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const result = await chefLogin({
                email,
                password,
                userAgent: window.navigator.userAgent,
            });

            if (result.success && result.sessionToken) {
                // Store session and redirect
                await login(result.sessionToken, result.user);
                router.push("/chef/dashboard");
            } else {
                setError(result.error || "Login failed");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push("/chef/dashboard");
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#02120A]">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#4ADE80] border-t-transparent mx-auto"></div>
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden bg-[#02120A]">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage: "url('/assets/images/signin-background.jpg')",
                    filter: "brightness(0.3)"
                }}
            />

            <div className="w-full max-w-md z-10">
                {/* Logo Section */}
                <div className="flex justify-center mb-8">
                    <CribNoshLogo size={200} variant="white" />
                </div>

                <div className="bg-[#02120A]/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">Food Creator Sign In</h1>
                        <p className="text-gray-400">Access your professional kitchen dashboard</p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm font-medium">
                                {error}
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="block text-sm font-bold text-gray-200 mb-1.5">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-[#4ADE80] focus:border-transparent outline-none transition-all bg-white/5 text-white placeholder:text-gray-500"
                                placeholder="food.creator@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-bold text-gray-200 mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-[#4ADE80] focus:border-transparent outline-none transition-all bg-white/5 text-white placeholder:text-gray-500"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#FF3B30] hover:bg-[#ff554a] text-white font-bold py-3.5 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Signing In..." : "Sign In"}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-700"></span>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-[#02120A]/80 backdrop-blur-sm px-3 py-1 rounded-full text-gray-400 font-medium border border-gray-700">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => window.alert("Google login requires configuration")}
                            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-3 px-6 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all shadow-sm hover:shadow"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Google
                        </button>

                        <button
                            type="button"
                            onClick={() => window.alert("Apple login requires configuration")}
                            className="w-full flex items-center justify-center gap-3 bg-black text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-800 transition-all shadow-sm hover:shadow border border-gray-700"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path
                                    d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.02 3.65-1.02 1.54.05 2.66.77 3.37 1.64-3.32 1.66-2.73 5.43.68 6.78-.54 1.56-1.28 3.08-2.78 4.83zM12.03 7.25c-.25-2.6 2.09-4.8 4.22-5.02.32 2.8-2.62 5.14-4.22 5.02z"
                                />
                            </svg>
                            Apple
                        </button>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-400">
                            Don't have an account?{" "}
                            <a href="/cooking/apply" className="text-[#FF6B35] hover:text-[#ff855e] font-bold">
                                Sign up as a food creator
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
