"use client";

import { api } from "@/convex/_generated/api";
import { useChefAuth } from "@/lib/chef-auth";
import { useMutation } from "convex/react";
import { ArrowLeft, Check, Film, UploadCloud, Video, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function UploadVideoPage() {
    const { sessionToken, chef } = useChefAuth();
    const generateUploadUrl = useMutation(api.mutations.files.generateUploadUrl);
    const createVideoPost = useMutation(api.mutations.videoPosts.createVideoPost);
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(file);
            setVideoPreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveFile = () => {
        if (videoPreview) URL.revokeObjectURL(videoPreview);
        setVideoFile(null);
        setVideoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessionToken || !chef || !videoFile) return;

        setIsSubmitting(true);
        try {
            // 1. Generate upload URL
            const uploadUrl = await generateUploadUrl();

            // 2. Upload video file
            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": videoFile.type },
                body: videoFile,
            });

            if (!result.ok) throw new Error("Video upload failed");

            const { storageId } = await result.json();

            // 3. Create video post in Convex
            await createVideoPost({
                title,
                description,
                videoStorageId: storageId,
                chefId: chef._id,
                channelId: "general", // Default or select channel
                status: "processing", // Let backend handle processing
                sessionToken,
            });

            router.push("/food-creator/content");
        } catch (error) {
            console.error("Failed to upload video:", error);
            alert("Failed to upload video: " + (error as Error).message);
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
                    <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <Video className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Upload Video</h1>
                        <p className="mt-1 text-gray-400">Share cooking demonstrations and promotional videos</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-4xl">
                <div className="space-y-8">

                    {/* Upload Area */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-md shadow-xl text-center">
                        <div className="mx-auto w-20 h-20 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 text-purple-400 ring-1 ring-purple-500/30">
                            <Film className="h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Select Video File</h3>
                        <p className="text-gray-400 mb-8 max-w-md mx-auto">Upload your culinary masterpieces to inspire the CribNosh community</p>

                        {!videoFile ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-white/10 rounded-2xl p-12 hover:border-purple-500/50 transition-all cursor-pointer bg-white/5 group"
                            >
                                <input
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                                <UploadCloud className="h-12 w-12 text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                                <p className="text-white font-bold text-lg">Choose a file to upload</p>
                                <p className="text-sm text-gray-500 mt-2">MP4, MOV up to 500MB</p>
                            </div>
                        ) : (
                            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-white/10 group">
                                <video
                                    src={videoPreview!}
                                    className="w-full h-full object-contain"
                                    controls
                                />
                                <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="absolute top-4 right-4 p-2 bg-black/60 rounded-xl text-white hover:bg-black/80 transition-colors z-10"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                                    <span className="text-xs font-bold text-white tracking-wider uppercase">Preview</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-md shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="h-6 w-1 bg-purple-500 rounded-full"></span>
                            Video Details
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="title" className="block text-sm font-semibold text-gray-300 mb-2">Title *</label>
                                <input
                                    type="text"
                                    id="title"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-[#02120A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                    placeholder="e.g., How to chop onions like a pro"
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-semibold text-gray-300 mb-2">Description *</label>
                                <textarea
                                    id="description"
                                    required
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-[#02120A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition resize-none"
                                    placeholder="Describe what's in your video..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4 pb-20">
                        <button
                            type="submit"
                            disabled={isSubmitting || !videoFile}
                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-8 rounded-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {isSubmitting ? (
                                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    Upload Video
                                    <Check className="h-5 w-5 transition-transform group-hover:scale-125" />
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-8 py-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
