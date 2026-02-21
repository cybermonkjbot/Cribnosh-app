"use client";

import { useFoodCreatorAuth } from "@/lib/food-creator-auth";
import { Camera } from "lucide-react";
import { useState } from "react";

export default function ProfilePage() {
    const { foodCreator } = useFoodCreatorAuth();
    const [formData, setFormData] = useState({
        name: foodCreator?.name || "",
        email: foodCreator?.email || "",
        bio: foodCreator?.bio || "",
        phone: foodCreator?.phone || "",
        specialties: foodCreator?.specialties || [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement profile update
        console.log("Updating profile:", formData);
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Food Creator Profile</h1>
                <p className="mt-1 text-gray-600">Manage your personal information</p>
            </div>

            <div className="max-w-3xl">
                {/* Profile Picture */}
                <div className="mb-8 rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h2>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white text-3xl font-bold">
                                {foodCreator?.name?.charAt(0) || "C"}
                            </div>
                            <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all border border-gray-200">
                                <Camera className="h-4 w-4 text-gray-600" />
                            </button>
                        </div>
                        <div>
                            <button className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-all shadow-md">
                                Change Photo
                            </button>
                            <p className="text-sm text-gray-600 mt-2">JPG, PNG up to 5MB</p>
                        </div>
                    </div>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-secondary focus:border-transparent outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-secondary focus:border-transparent outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-secondary focus:border-transparent outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                                        Bio
                                    </label>
                                    <textarea
                                        id="bio"
                                        rows={4}
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-secondary focus:border-transparent outline-none transition resize-none"
                                        placeholder="Tell customers about yourself and your cooking style..."
                                    />
                                    <p className="text-sm text-gray-600 mt-1">Max 500 characters</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                            >
                                Save Changes
                            </button>
                            <button
                                type="button"
                                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
