"use client";

import { MasonryBackground } from "@/components/ui/masonry-background";
import { api } from "@/convex/_generated/api";
import { useConvex } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WaitlistManualOnboardingPage() {
    const router = useRouter();
    const convex = useConvex();

    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // Use mutation to ensure a token exists (generates one if missing)
            const token = await convex.mutation(api.mutations.waitlist.ensureWaitlistToken, {
                email: email.trim().toLowerCase()
            });

            if (!token) {
                setError("This email is not on our waitlist. Please sign up first!");
                return;
            }

            // Redirect to the token page
            router.push(`/waitlist/onboarding/${token}`);
        } catch (err) {
            console.error("Error looking up waitlist entry:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
            <MasonryBackground className="z-0" />

            <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="relative z-10 w-full max-w-md bg-white/70 backdrop-blur-lg rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
            >
                <div className="text-center mb-8">
                    <h1 className="font-asgard text-3xl mb-4 text-gray-900">
                        Continue Onboarding
                    </h1>
                    <p className="font-satoshi text-gray-600">
                        Enter your email to find your unique onboarding link.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block font-satoshi text-gray-800 font-semibold text-base mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full p-3 rounded-lg shadow-md bg-white focus:bg-white border-2 transition-colors duration-200 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 placeholder-gray-400 font-medium text-base outline-none border-gray-300"
                            required
                        />
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-satoshi font-semibold"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isSubmitting}
                        className="w-full px-6 py-3 bg-[#ff3b30] text-white rounded-lg font-satoshi hover:bg-[#ff5e54] transition-all duration-300 group relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <span className="relative z-10 flex items-center justify-center">
                            {isSubmitting ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Continue"
                            )}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.button>

                    <button
                        type="button"
                        onClick={() => router.push('/')}
                        className="w-full py-2 text-gray-400 hover:text-gray-900 font-satoshi text-sm transition"
                    >
                        Back to Home
                    </button>
                </form>
            </motion.div>
        </main>
    );
}
