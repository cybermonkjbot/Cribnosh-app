"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { MasonryBackground } from "@/components/ui/masonry-background";
import { api } from "@/convex/_generated/api";
import { useAction, useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function WaitlistOnboardingPage() {
    const params = useParams();
    const token = params.token as string;
    const router = useRouter();

    const waitlistEntry = useQuery(api.queries.waitlist.getByToken, { token });
    const submitOnboarding = useAction(api.mutations.waitlist.submitWaitlistOnboarding);

    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [creatorType, setCreatorType] = useState<string | null>(null);
    const [needsFbaAssistance, setNeedsFbaAssistance] = useState<boolean | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [error, setError] = useState<string | null>(null);

    // Pre-fill name if available when data loads
    useEffect(() => {
        if (waitlistEntry?.name && !name) {
            setName(waitlistEntry.name);
        }
    }, [waitlistEntry, name]);

    const handleSubmit = async () => {
        if (!creatorType || needsFbaAssistance === null || !name || !username) return;

        setIsSubmitting(true);
        setError(null);
        try {
            const result = await submitOnboarding({
                token,
                name,
                username,
                creatorType,
                needsFbaAssistance,
            });

            if (result.success) {
                setStep(5);
            } else {
                setError(result.error || "Something went wrong. Please try again.");
            }
        } catch (error) {
            console.error("Failed to submit onboarding", error);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (waitlistEntry === undefined) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
                <MasonryBackground className="z-0" />
                <div className="relative z-20 animate-pulse font-satoshi text-gray-400">Loading...</div>
            </div>
        );
    }

    if (waitlistEntry === null) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
                <MasonryBackground className="z-0" />
                <div className="relative z-20 p-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
                    <h1 className="text-2xl font-asgard text-red-500 mb-2">Invalid Link</h1>
                    <p className="font-satoshi text-gray-600">This onboarding link is invalid or expired.</p>
                </div>
            </div>
        );
    }

    // If already completed, show success or redirect
    if (waitlistEntry.onboardingCompletedAt) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
                <MasonryBackground className="z-0" />
                <div className="relative z-20 p-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl max-w-md text-center border border-white/20">
                    <h1 className="text-3xl font-asgard text-green-600 mb-4">You're All Set!</h1>
                    <p className="font-satoshi text-gray-600 mb-6">
                        You have already completed your onboarding. We'll be in touch soon!
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition z-30 relative"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
            <MasonryBackground className="z-0" />

            <GlassCard className="relative z-20 w-full max-w-2xl bg-white/90 p-8 sm:p-12 shadow-2xl border border-white/20 backdrop-blur-xl">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl font-satoshi text-center border border-red-100">
                        {error}
                    </div>
                )}
                <AnimatePresence mode="wait">
                    {/* Step 1: Name */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center">
                                <h1 className="font-asgard text-3xl sm:text-4xl mb-4 text-gray-900">
                                    What should we call you?
                                </h1>
                                <p className="font-satoshi text-xl text-gray-600">
                                    Let's get to know each other.
                                </p>
                            </div>

                            <div className="max-w-md mx-auto space-y-6">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your Name"
                                    className="w-full p-4 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-gray-900 focus:bg-white transition-all outline-none font-satoshi text-lg"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && name.trim()) setStep(2);
                                    }}
                                />
                                <button
                                    onClick={() => { if (name.trim()) setStep(2); }}
                                    disabled={!name.trim()}
                                    className="w-full py-4 bg-gray-900 text-white rounded-xl font-satoshi text-lg hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Continue
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Username */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center">
                                <h1 className="font-asgard text-3xl sm:text-4xl mb-4 text-gray-900">
                                    Choose your username
                                </h1>
                                <p className="font-satoshi text-xl text-gray-600">
                                    This will be your unique food creator handle.
                                </p>
                            </div>

                            <div className="max-w-md mx-auto space-y-6">
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-satoshi text-lg">@</span>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                                        placeholder="username"
                                        className="w-full p-4 pl-10 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-gray-900 focus:bg-white transition-all outline-none font-satoshi text-lg"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && username.trim()) setStep(3);
                                        }}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="px-6 py-4 text-gray-400 hover:text-gray-900 font-satoshi transition"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => { if (username.trim()) setStep(3); }}
                                        disabled={!username.trim()}
                                        className="flex-1 py-4 bg-gray-900 text-white rounded-xl font-satoshi text-lg hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Continue
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Creator Type (Formerly Step 1) */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center">
                                <h1 className="font-asgard text-3xl sm:text-4xl mb-4 text-gray-900">
                                    Welcome, {name}!
                                </h1>
                                <p className="font-satoshi text-xl text-gray-600">
                                    How do you want to use Cribnosh?
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => { setCreatorType('taste_creator'); setStep(4); }}
                                    className="group p-6 rounded-xl border-2 border-gray-100 hover:border-[#ff3b30] hover:bg-red-50/50 transition-all duration-300 text-left bg-white"
                                >
                                    <h3 className="font-asgard text-xl mb-2 group-hover:text-[#ff3b30] transition-colors">Food Creator</h3>
                                    <p className="font-satoshi text-sm text-gray-500">
                                        I cook and serve my taste with the world.
                                    </p>
                                </button>

                                <button
                                    onClick={() => { setCreatorType('content_creator'); setStep(4); }}
                                    className="group p-6 rounded-xl border-2 border-gray-100 hover:border-[#ff3b30] hover:bg-red-50/50 transition-all duration-300 text-left bg-white"
                                >
                                    <h3 className="font-asgard text-xl mb-2 group-hover:text-[#ff3b30] transition-colors">Food Content Creator</h3>
                                    <p className="font-satoshi text-sm text-gray-500">
                                        I just make food content.
                                    </p>
                                </button>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => { setCreatorType('both'); setStep(4); }}
                                    className="w-full p-4 rounded-xl border-2 border-gray-100 hover:border-[#ff3b30] hover:bg-red-50/50 transition-all duration-300 text-center font-satoshi text-gray-600 hover:text-[#ff3b30] bg-white"
                                >
                                    I do both!
                                </button>
                                <button
                                    onClick={() => setStep(2)}
                                    className="text-sm text-gray-400 hover:text-gray-600 py-2 transition"
                                >
                                    Back
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: FBA (Formerly Step 2) */}
                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center">
                                <h2 className="font-asgard text-3xl mb-4 text-gray-900">
                                    One last thing...
                                </h2>
                                <p className="font-satoshi text-xl text-gray-600">
                                    Do you need assistance with FBA (Food Business Administration, etc.)?
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 max-w-md mx-auto">
                                <button
                                    onClick={() => { setNeedsFbaAssistance(true); handleSubmit(); }}
                                    disabled={isSubmitting}
                                    className="p-4 rounded-xl bg-gray-900 text-white font-satoshi text-lg hover:bg-gray-800 transition shadow-lg disabled:opacity-70"
                                >
                                    {isSubmitting ? "Saving..." : "Yes, I need assistance"}
                                </button>
                                <button
                                    onClick={() => { setNeedsFbaAssistance(false); handleSubmit(); }}
                                    disabled={isSubmitting}
                                    className="p-4 rounded-xl bg-white border border-gray-200 text-gray-900 font-satoshi text-lg hover:bg-gray-50 transition disabled:opacity-70"
                                >
                                    {isSubmitting ? "Saving..." : "No, I'm good"}
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={isSubmitting}
                                    className="block mx-auto text-sm text-gray-400 hover:text-gray-600 transition"
                                >
                                    Back
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 5: Success (Formerly Step 3) */}
                    {step === 5 && (
                        <motion.div
                            key="step5"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6"
                        >
                            <h2 className="font-asgard text-4xl text-gray-900">
                                You're in!
                            </h2>
                            <p className="font-satoshi text-xl text-gray-600 max-w-lg mx-auto">
                                Thanks for completing your profile, {name}. We'll be in touch soon!
                            </p>
                            <button
                                onClick={() => router.push('/')}
                                className="mt-8 px-8 py-3 bg-[#ff3b30] text-white rounded-full font-satoshi text-lg hover:bg-[#ff5e54] transition shadow-lg relative z-30"
                            >
                                Back to Home
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </GlassCard>
        </main>
    );
}
