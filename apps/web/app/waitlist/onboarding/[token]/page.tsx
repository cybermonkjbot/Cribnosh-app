"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { MasonryBackground } from "@/components/ui/masonry-background";
import { api } from "@/convex/_generated/api";
import { useAction, useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function WaitlistOnboardingPage() {
    const params = useParams();
    const token = params.token as string;
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [creatorType, setCreatorType] = useState<string | null>(null);
    const [needsFbaAssistance, setNeedsFbaAssistance] = useState<boolean | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const waitlistEntry = useQuery(api.queries.waitlist.getByToken, { token });
    const submitOnboarding = useAction(api.mutations.waitlist.submitWaitlistOnboarding);

    const handleSubmit = async () => {
        if (!creatorType || needsFbaAssistance === null) return;

        setIsSubmitting(true);
        try {
            await submitOnboarding({
                token,
                creatorType,
                needsFbaAssistance,
            });
            setStep(3);
        } catch (error) {
            console.error("Failed to submit onboarding", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (waitlistEntry === undefined) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
                <MasonryBackground className="z-0" />
                <div className="relative z-10 animate-pulse">Loading...</div>
            </div>
        );
    }

    if (waitlistEntry === null) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
                <MasonryBackground className="z-0" />
                <div className="relative z-10 p-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl">
                    <h1 className="text-2xl font-asgard text-red-500 mb-2">Invalid Link</h1>
                    <p className="font-satoshi text-gray-600">This onboarding link is invalid or expired.</p>
                </div>
            </div>
        );
    }

    // If already completed, show success or redirect
    if (waitlistEntry.onboardingCompletedAt) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
                <MasonryBackground className="z-0" />
                <div className="relative z-10 p-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl max-w-md text-center">
                    <h1 className="text-3xl font-asgard text-green-600 mb-4">You're All Set!</h1>
                    <p className="font-satoshi text-gray-600 mb-6">
                        You have already completed your onboarding. We'll be in touch soon!
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition"
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

            <GlassCard className="relative z-10 w-full max-w-2xl bg-white/80 p-8 sm:p-12">
                <AnimatePresence mode="wait">
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
                                    Welcome, {waitlistEntry.name || 'Friend'}!
                                </h1>
                                <p className="font-satoshi text-xl text-gray-600">
                                    How do you want to use Cribnosh?
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => { setCreatorType('taste_creator'); setStep(2); }}
                                    className="group p-6 rounded-xl border-2 border-gray-100 hover:border-[#ff3b30] hover:bg-red-50/50 transition-all duration-300 text-left"
                                >
                                    <div className="text-2xl mb-3">👨‍🍳</div>
                                    <h3 className="font-asgard text-xl mb-2 group-hover:text-[#ff3b30] transition-colors">Taste Creator</h3>
                                    <p className="font-satoshi text-sm text-gray-500">
                                        I cook and serve my taste with the world.
                                    </p>
                                </button>

                                <button
                                    onClick={() => { setCreatorType('content_creator'); setStep(2); }}
                                    className="group p-6 rounded-xl border-2 border-gray-100 hover:border-[#ff3b30] hover:bg-red-50/50 transition-all duration-300 text-left"
                                >
                                    <div className="text-2xl mb-3">📸</div>
                                    <h3 className="font-asgard text-xl mb-2 group-hover:text-[#ff3b30] transition-colors">Food Content Creator</h3>
                                    <p className="font-satoshi text-sm text-gray-500">
                                        I just make food content.
                                    </p>
                                </button>
                            </div>
                            <button
                                onClick={() => { setCreatorType('both'); setStep(2); }}
                                className="w-full mt-4 p-4 rounded-xl border-2 border-gray-100 hover:border-[#ff3b30] hover:bg-red-50/50 transition-all duration-300 text-center font-satoshi text-gray-600 hover:text-[#ff3b30]"
                            >
                                I do both!
                            </button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
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
                                    className="p-4 rounded-xl bg-gray-900 text-white font-satoshi text-lg hover:bg-gray-800 transition shadow-lg"
                                >
                                    Yes, I need assistance
                                </button>
                                <button
                                    onClick={() => { setNeedsFbaAssistance(false); handleSubmit(); }}
                                    className="p-4 rounded-xl bg-white border border-gray-200 text-gray-900 font-satoshi text-lg hover:bg-gray-50 transition"
                                >
                                    No, I'm good
                                </button>
                            </div>

                            <button
                                onClick={() => setStep(1)}
                                className="block mx-auto text-sm text-gray-400 hover:text-gray-600 transition"
                            >
                                Back
                            </button>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6"
                        >
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-4xl">🎉</span>
                            </div>
                            <h2 className="font-asgard text-4xl text-gray-900">
                                You're in!
                            </h2>
                            <p className="font-satoshi text-xl text-gray-600 max-w-lg mx-auto">
                                Thanks for completing your profile. We've sent you a welcome email with details about your beta access.
                            </p>
                            <button
                                onClick={() => router.push('/')}
                                className="mt-8 px-8 py-3 bg-[#ff3b30] text-white rounded-full font-satoshi text-lg hover:bg-[#ff5e54] transition shadow-lg"
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
