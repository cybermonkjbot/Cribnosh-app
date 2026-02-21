"use client";

import { api } from "@/convex/_generated/api";
import { useFoodCreatorAuth } from "@/lib/food-creator-auth";
import { useMutation } from "convex/react";
import { ArrowLeft, Bold, BookOpen, Check, Heading1, Image as ImageIcon, Italic, Link as LinkIcon, List, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateStoryPage() {
    const { sessionToken, foodCreator } = useFoodCreatorAuth();
    const createStory = useMutation(api.mutations.stories.createStory);
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessionToken || !foodCreator) return;

        setIsSubmitting(true);
        try {
            await createStory({
                title,
                content,
                tags: [],
                status: "published",
                sessionToken,
            });
            router.push("/food-creator/content");
        } catch (error) {
            console.error("Failed to create story:", error);
            alert("Failed to create story: " + (error as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#02120A] text-white p-8">
            {/* Header */}
            <div className="mb-8 max-w-4xl">
                <Link
                    href="/food-creator/content"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Content
                </Link>
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-[#4ADE80]/20 flex items-center justify-center text-[#4ADE80]">
                        <BookOpen className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Create New Story</h1>
                        <p className="mt-1 text-gray-400">Share your journey, tips, and behind-the-scenes moments</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-4xl">
                <div className="rounded-2xl bg-white/5 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md">
                    {/* Title Input */}
                    <div className="p-8 border-b border-white/10 bg-white/[0.02]">
                        <input
                            type="text"
                            placeholder="Give your story a title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full text-4xl font-bold text-white placeholder-gray-600 border-none outline-none bg-transparent"
                            autoFocus
                        />
                    </div>

                    {/* Toolbar */}
                    <div className="flex items-center gap-1 px-4 py-2 bg-white/5 border-b border-white/10 overflow-x-auto">
                        <button type="button" className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all" title="Bold">
                            <Bold className="h-5 w-5" />
                        </button>
                        <button type="button" className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all" title="Italic">
                            <Italic className="h-5 w-5" />
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-2" />
                        <button type="button" className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all" title="Heading">
                            <Heading1 className="h-5 w-5" />
                        </button>
                        <button type="button" className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all" title="List">
                            <List className="h-5 w-5" />
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-2" />
                        <button type="button" className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all" title="Link">
                            <LinkIcon className="h-5 w-5" />
                        </button>
                        <button type="button" className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all" title="Image">
                            <ImageIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Editor Area */}
                    <div className="p-8 min-h-[500px] bg-transparent">
                        <textarea
                            placeholder="Tell your story..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-full min-h-[500px] resize-none border-none outline-none text-xl text-gray-300 bg-transparent leading-relaxed placeholder-gray-700"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-white/5 p-6 border-t border-white/10 flex justify-end gap-4">
                        <button
                            type="button"
                            className="px-6 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all flex items-center gap-2"
                        >
                            <Save className="h-5 w-5" />
                            Save Draft
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !title || !content}
                            className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#4ADE80] to-[#0B9E58] text-[#02120A] font-bold hover:shadow-[0_0_20px_rgba(74,222,128,0.3)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {isSubmitting ? (
                                <div className="h-5 w-5 border-2 border-[#02120A] border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    Publish Story
                                    <Check className="h-5 w-5 transition-transform group-hover:scale-125" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
