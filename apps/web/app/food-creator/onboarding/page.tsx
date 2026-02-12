"use client";

import { api } from "@/convex/_generated/api";
import { useChefAuth } from "@/lib/chef-auth";
import { useQuery } from "convex/react";
import { ArrowRight, Banknote, CheckCircle2, Circle, FileText, GraduationCap } from "lucide-react";
import Link from "next/link";

export default function OnboardingPage() {
    const { chef, sessionToken, isBasicOnboardingComplete, isOnboardingComplete } = useChefAuth();

    // Fetch document summary
    const docSummary = useQuery(
        api.queries.chefDocuments.getSummary,
        chef?._id && sessionToken ? { chefId: chef._id, sessionToken } : "skip"
    );

    // Fetch bank accounts
    const bankAccounts = useQuery(
        api.queries.chefBankAccounts.getByChefId,
        chef?._id && sessionToken ? { chefId: chef._id, sessionToken } : "skip"
    );

    const steps = [
        {
            id: "profile",
            title: "Complete Profile & Kitchen",
            description: "Set up your personal details and kitchen profile",
            icon: FileText,
            isCompleted: isBasicOnboardingComplete,
            href: "/food-creator/profile",
            cta: "Edit Profile"
        },
        {
            id: "documents",
            title: "Upload Documents",
            description: "Submit your ID, health permit, and other required documents",
            icon: FileText,
            isCompleted: docSummary?.allRequiredVerified || false,
            href: "/food-creator/onboarding/documents",
            cta: docSummary?.total === 0 ? "Upload Documents" : "Check Status"
        },
        {
            id: "course",
            title: "Compliance Training",
            description: "Complete the 13-module food safety and hygiene course",
            icon: GraduationCap,
            isCompleted: isOnboardingComplete,
            href: "/food-creator/onboarding/course",
            cta: "Continue Course"
        },
        {
            id: "bank",
            title: "Bank Account",
            description: "Connect your bank account to receive payouts",
            icon: Banknote,
            isCompleted: (bankAccounts?.length || 0) > 0,
            href: "/food-creator/earnings/bank-accounts",
            cta: "Add Bank Details"
        }
    ];

    const completedSteps = steps.filter(s => s.isCompleted).length;
    const progress = (completedSteps / steps.length) * 100;

    return (
        <div className="min-h-screen bg-[#02120A] text-white p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Food Creator Onboarding</h1>
                <p className="mt-1 text-gray-400">Complete these steps to activate your kitchen and start receiving orders</p>
            </div>

            {/* Progress Card */}
            <div className="mb-8 rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#4ADE80]/20 flex items-center justify-center text-[#4ADE80]">
                            <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="block text-sm font-semibold text-gray-400">Total Progress</span>
                            <span className="text-2xl font-bold text-white">{Math.round(progress)}% Complete</span>
                        </div>
                    </div>
                </div>
                <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden border border-white/10">
                    <div
                        className="h-full bg-gradient-to-r from-[#4ADE80] to-[#0B9E58] transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(74,222,128,0.5)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {steps.map((step) => (
                    <div
                        key={step.id}
                        className={`relative rounded-2xl p-6 border transition-all duration-300 group ${step.isCompleted
                            ? 'bg-[#4ADE80]/5 border-[#4ADE80]/30 shadow-[0_4px_20px_rgba(74,222,128,0.1)]'
                            : 'bg-white/5 border-white/10 hover:border-[#FF6B35]/50 hover:shadow-[0_4px_20px_rgba(255,107,53,0.1)]'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl transition-colors ${step.isCompleted ? 'bg-[#4ADE80]/20 text-[#4ADE80]' : 'bg-white/5 text-gray-400 group-hover:text-[#FF6B35]'
                                }`}>
                                <step.icon className="h-6 w-6" />
                            </div>
                            {step.isCompleted ? (
                                <div className="h-8 w-8 rounded-full bg-[#4ADE80] flex items-center justify-center shadow-[0_0_10px_rgba(74,222,128,0.5)]">
                                    <CheckCircle2 className="h-5 w-5 text-[#02120A]" />
                                </div>
                            ) : (
                                <Circle className="h-6 w-6 text-white/10" />
                            )}
                        </div>

                        <h3 className={`text-xl font-bold mb-2 transition-colors ${step.isCompleted ? 'text-[#4ADE80]' : 'text-white'}`}>
                            {step.title}
                        </h3>
                        <p className="text-gray-400 mb-8 text-sm line-clamp-2 min-h-[2.5rem]">
                            {step.description}
                        </p>

                        <Link
                            href={step.href}
                            className={`inline-flex items-center gap-2 font-bold text-sm px-4 py-2 rounded-lg transition-all ${step.isCompleted
                                ? 'bg-[#4ADE80]/10 text-[#4ADE80] hover:bg-[#4ADE80]/20'
                                : 'bg-white/5 text-white hover:bg-white/10'
                                }`}
                        >
                            {step.isCompleted ? 'View Details' : step.cta}
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
