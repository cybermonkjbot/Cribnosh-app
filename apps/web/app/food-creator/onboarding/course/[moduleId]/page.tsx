"use client";

import { api } from "@/convex/_generated/api";
import { useChefAuth } from "@/lib/chef-auth";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function ModulePage() {
    const params = useParams();
    const router = useRouter();
    const moduleNumber = Number(params.moduleId);
    const { chef, sessionToken } = useChefAuth();

    // Fetch course enrollment
    const enrollment = useQuery(
        api.queries.chefCourses.getByChefAndCourse,
        chef && sessionToken ? {
            chefId: chef._id,
            courseId: "compliance-course-v1",
            sessionToken
        } : "skip"
    );

    // Find current module summary from enrollment
    const moduleSummary = enrollment?.progress?.find((m: any) => m.moduleNumber === moduleNumber);

    // Fetch full module content
    const moduleContent = useQuery(
        api.queries.courseModules.getModuleContent,
        moduleSummary && sessionToken ? {
            courseId: "compliance-course-v1",
            moduleId: moduleSummary.moduleId,
            sessionToken
        } : "skip"
    );

    const updateProgress = useMutation(api.mutations.chefCourses.updateModuleProgress);
    const [activeTab, setActiveTab] = useState<'content' | 'quiz'>('content');
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isCompleted = moduleSummary?.completed;

    const handleQuizSubmit = async () => {
        if (!moduleSummary || !moduleContent || !chef || !sessionToken || !moduleContent.quiz) return;

        setIsSubmitting(true);
        try {
            const questions = moduleContent.quiz.questions;
            let correctCount = 0;

            questions.forEach((q: any) => {
                if (selectedAnswers[q.questionId] === q.correctAnswer) {
                    correctCount++;
                }
            });

            const percentage = (correctCount / questions.length) * 100;
            const passed = percentage >= (moduleContent.quiz.passingScore || 80);

            await updateProgress({
                chefId: chef._id,
                courseId: "compliance-course-v1",
                moduleId: moduleSummary.moduleId,
                moduleName: moduleSummary.moduleName,
                moduleNumber: moduleSummary.moduleNumber,
                completed: passed,
                quizScore: percentage,
                timeSpent: 300,
                sessionToken
            });

            if (passed) {
                alert(`Quiz Passed! Score: ${percentage}%`);
                router.push('/chef/onboarding/course');
            } else {
                alert(`Quiz Failed. Score: ${percentage}%. Required: ${moduleContent.quiz.passingScore}%. Please try again.`);
                setSelectedAnswers({});
            }

        } catch (error) {
            console.error("Failed to submit quiz:", error);
            alert("Failed to submit quiz");
        } finally {
            setIsSubmitting(false);
        }
    };

    if ((!enrollment || !moduleContent) && chef) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#02120A]">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#4ADE80] border-t-transparent mx-auto"></div>
                    <p className="text-gray-400">Loading module data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[#02120A] text-white">
            {/* Sidebar/Navigation */}
            <div className="w-80 bg-[#02120A] border-r border-white/10 overflow-y-auto hidden lg:block">
                <div className="p-6 border-b border-white/10">
                    <Link href="/chef/onboarding/course" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Course
                    </Link>
                    <h2 className="mt-4 text-xl font-bold text-white">Compliance Course</h2>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
                        <div
                            className="h-full rounded-full bg-[#4ADE80] transition-all duration-500"
                            style={{
                                width: `${enrollment ? (enrollment.progress.filter((m: any) => m.completed).length / enrollment.progress.length) * 100 : 0}%`
                            }}
                        />
                    </div>
                </div>
                <div className="p-4 space-y-2">
                    {enrollment?.progress.map((m: any) => (
                        <div
                            key={m.moduleId}
                            onClick={() => router.push(`/chef/onboarding/course/${m.moduleNumber}`)}
                            className={`p-3 rounded-lg text-sm font-medium cursor-pointer flex justify-between items-center transition-all ${m.moduleNumber === moduleNumber
                                ? 'bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/50'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span>Module {m.moduleNumber}: {m.moduleName}</span>
                            {m.completed && <CheckCircle className="h-4 w-4 text-[#4ADE80]" />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto p-8 lg:p-12">

                    {/* Module Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-[#FF6B35] tracking-wide uppercase">Module {moduleNumber}</span>
                            {isCompleted && <span className="px-2 py-0.5 rounded-full bg-[#4ADE80]/20 text-[#4ADE80] text-xs font-semibold border border-[#4ADE80]/30">Completed</span>}
                        </div>
                        <h1 className="text-3xl font-bold text-white mt-2">{moduleContent?.moduleName}</h1>
                        <p className="text-gray-400 mt-2 text-lg">{moduleContent?.description}</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-white/10 mb-8">
                        <button
                            onClick={() => setActiveTab('content')}
                            className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'content'
                                ? 'border-[#FF6B35] text-[#FF6B35]'
                                : 'border-transparent text-gray-400 hover:text-white'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                Learning Material
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('quiz')}
                            className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'quiz'
                                ? 'border-[#FF6B35] text-[#FF6B35]'
                                : 'border-transparent text-gray-400 hover:text-white'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <HelpCircle className="h-4 w-4" />
                                Module Quiz
                            </span>
                        </button>
                    </div>

                    {activeTab === 'content' ? (
                        <div className="prose prose-invert max-w-none">
                            {moduleContent?.videos && moduleContent.videos.length > 0 && (
                                <div className="aspect-video bg-black border border-white/10 rounded-xl mb-8 overflow-hidden">
                                    <video
                                        src={moduleContent.videos[0].videoUrl}
                                        controls
                                        className="w-full h-full"
                                        poster={moduleContent.videos[0].thumbnailUrl}
                                    />
                                </div>
                            )}

                            {moduleContent?.content.map((item: any) => (
                                <div key={item.order} className="mb-8">
                                    <h3 className="text-white">{item.title}</h3>
                                    <div
                                        className="text-gray-400"
                                        dangerouslySetInnerHTML={{ __html: item.data.html || item.data.text }}
                                    />
                                </div>
                            ))}

                            <div className="mt-12 flex justify-end">
                                <button
                                    onClick={() => setActiveTab('quiz')}
                                    className="bg-[#FF3B30] hover:bg-[#ff554a] text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:-translate-y-0.5"
                                >
                                    Take Quiz
                                    <ArrowRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {moduleContent?.quiz?.questions.map((q: any) => (
                                <div key={q.questionId} className="bg-white/5 p-6 rounded-xl border border-white/10 shadow-sm">
                                    <h3 className="font-semibold text-white mb-4">{q.order}. {q.question}</h3>
                                    <div className="space-y-3">
                                        {q.type === 'multiple_choice' ? (
                                            q.options.map((opt: string, i: number) => (
                                                <label key={i} className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-colors group">
                                                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${selectedAnswers[q.questionId] === opt ? "border-[#FF6B35]" : "border-gray-500 group-hover:border-gray-400"}`}>
                                                        {selectedAnswers[q.questionId] === opt && <div className="h-2 w-2 rounded-full bg-[#FF6B35]" />}
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        name={q.questionId}
                                                        className="hidden"
                                                        checked={selectedAnswers[q.questionId] === opt}
                                                        onChange={() => setSelectedAnswers({ ...selectedAnswers, [q.questionId]: opt })}
                                                        disabled={isCompleted}
                                                    />
                                                    <span className="text-gray-300 group-hover:text-white transition-colors">{opt}</span>
                                                </label>
                                            ))
                                        ) : q.type === 'true_false' ? (
                                            [true, false].map((val) => (
                                                <label key={val.toString()} className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-colors group">
                                                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${selectedAnswers[q.questionId] === val ? "border-[#FF6B35]" : "border-gray-500 group-hover:border-gray-400"}`}>
                                                        {selectedAnswers[q.questionId] === val && <div className="h-2 w-2 rounded-full bg-[#FF6B35]" />}
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        name={q.questionId}
                                                        className="hidden"
                                                        checked={selectedAnswers[q.questionId] === val}
                                                        onChange={() => setSelectedAnswers({ ...selectedAnswers, [q.questionId]: val })}
                                                        disabled={isCompleted}
                                                    />
                                                    <span className="text-gray-300 group-hover:text-white transition-colors">{val ? 'True' : 'False'}</span>
                                                </label>
                                            ))
                                        ) : null}
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setActiveTab('content')}
                                    className="px-6 py-3 rounded-lg border border-white/10 text-gray-300 font-semibold hover:bg-white/5 hover:text-white transition-all"
                                >
                                    Review Content
                                </button>
                                {!isCompleted ? (
                                    <button
                                        className="bg-[#FF3B30] text-white font-semibold py-3 px-8 rounded-lg hover:bg-[#ff554a] transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                                        onClick={handleQuizSubmit}
                                        disabled={isSubmitting || Object.keys(selectedAnswers).length < (moduleContent?.quiz?.questions.length || 0)}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Answers'}
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 text-[#4ADE80] font-bold bg-[#4ADE80]/10 px-6 py-3 rounded-lg border border-[#4ADE80]/20">
                                        <CheckCircle className="h-5 w-5" />
                                        Completed (Score: {moduleSummary.quizScore}%)
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
