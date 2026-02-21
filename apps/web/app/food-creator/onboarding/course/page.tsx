"use client";

import { ArrowLeft, CheckCircle2, Lock, PlayCircle } from "lucide-react";
import Link from "next/link";

export default function CoursePage() {
    const modules = Array.from({ length: 13 }, (_, i) => ({
        id: i + 1,
        title: `Module ${i + 1}: ${[
            "Introduction to Food Safety",
            "Personal Hygiene",
            "Food Hazards",
            "Temperature Control",
            "Food Storage",
            "Food Preparation",
            "Cleaning and Disinfection",
            "Pest Control",
            "Waste Management",
            "Allergen Management",
            "HACCP Principles",
            "Food Safety Management",
            "Final Assessment"
        ][i]}`,
        duration: "15 min",
        status: i < 3 ? "completed" : i === 3 ? "in_progress" : "locked"
    }));

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/food-creator/onboarding"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Onboarding
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Food Safety & Hygiene Course</h1>
                        <p className="mt-1 text-gray-400">Complete all 13 modules to earn your certificate</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-semibold text-gray-400 mb-1">Course Progress</div>
                        <div className="flex items-center gap-3">
                            <div className="w-32 h-2 rounded-full bg-gray-800">
                                <div className="h-full w-[25%] rounded-full bg-[#4ADE80]" />
                            </div>
                            <span className="font-bold text-[#4ADE80]">25%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modules List */}
            <div className="space-y-4 max-w-4xl">
                {modules.map((module) => (
                    <Link
                        key={module.id}
                        href={module.status !== 'locked' ? `/food-creator/onboarding/course/${module.id}` : '#'}
                        className={`block rounded-xl border p-4 transition-all ${module.status === 'locked'
                            ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                            : 'bg-white/5 border-white/10 shadow-lg hover:bg-white/10 hover:border-[#4ADE80] backdrop-blur-sm'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${module.status === 'completed' ? 'bg-[#4ADE80]/20 text-[#4ADE80]' :
                                    module.status === 'in_progress' ? 'bg-[#FF6B35]/20 text-[#FF6B35]' :
                                        'bg-white/10 text-gray-400'
                                    }`}>
                                    {module.id}
                                </div>
                                <div>
                                    <h3 className={`font-semibold ${module.status === 'locked' ? 'text-gray-500' : 'text-white'
                                        }`}>
                                        {module.title}
                                    </h3>
                                    <p className="text-sm text-gray-400">{module.duration}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {module.status === 'completed' && (
                                    <span className="flex items-center gap-1 text-sm font-medium text-[#4ADE80]">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Completed
                                    </span>
                                )}
                                {module.status === 'in_progress' && (
                                    <span className="flex items-center gap-1 text-sm font-medium text-[#FF6B35]">
                                        <PlayCircle className="h-4 w-4" />
                                        Continue
                                    </span>
                                )}
                                {module.status === 'locked' && (
                                    <Lock className="h-5 w-5 text-gray-600" />
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
