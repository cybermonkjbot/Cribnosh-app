"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";

interface Filter {
    _id: Id<"filters">;
    name: string;
    code: string;
    iconStorageId: Id<"_storage">;
    isActive: boolean;
    iconUrl: string | null;
}

export default function CameraFiltersPage() {
    const filters = useQuery(api.filters.list);
    const generateUploadUrl = useMutation(api.filters.generateUploadUrl);
    const createFilter = useMutation(api.filters.create);
    const updateFilter = useMutation(api.filters.update);
    const removeFilter = useMutation(api.filters.remove);

    const [isCreating, setIsCreating] = useState(false);
    const [newFilterName, setNewFilterName] = useState("");
    const [newFilterCode, setNewFilterCode] = useState("");
    const [saturation, setSaturation] = useState(0);
    const [temperature, setTemperature] = useState(0);
    const [vignette, setVignette] = useState(0);
    const [contrast, setContrast] = useState(0);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFilterName || !selectedImage) return;

        setIsSubmitting(true);
        try {
            // 1. Get upload URL
            const postUrl = await generateUploadUrl();

            // 2. Upload file
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": selectedImage.type },
                body: selectedImage,
            });

            if (!result.ok) throw new Error("Upload failed");
            const { storageId } = await result.json();

            // 3. Create filter
            await createFilter({
                name: newFilterName,
                code: newFilterCode || newFilterName.toLowerCase().replace(/\s+/g, '-'),
                iconStorageId: storageId as Id<"_storage">,
                isActive: true,
            });

            // Reset
            setNewFilterName("");
            setNewFilterCode("");
            setSelectedImage(null);
            setImagePreview(null);
            setIsCreating(false);
        } catch (error) {
            console.error("Failed to create filter:", error);
            alert("Failed to create filter");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (id: Id<"filters">, currentStatus: boolean) => {
        await updateFilter({ id, isActive: !currentStatus });
    };

    const handleDelete = async (id: Id<"filters">) => {
        if (confirm("Are you sure you want to delete this filter?")) {
            await removeFilter({ id });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-asgard text-gray-900">Camera Filters</h1>
                    <p className="text-gray-500 font-satoshi">Manage filters and effects for the camera</p>
                </div>
                <Button onClick={() => setIsCreating(true)} className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white">
                    <Plus className="w-5 h-5 mr-2" />
                    Add Filter
                </Button>
            </div>

            <AnimatePresence>
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                            <h3 className="font-bold text-lg mb-4">New Filter</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Filter Name</Label>
                                        <Input
                                            id="name"
                                            value={newFilterName}
                                            onChange={(e) => setNewFilterName(e.target.value)}
                                            placeholder="e.g. Vivid Warm"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="code">Code (optional)</Label>
                                        <Input
                                            id="code"
                                            value={newFilterCode}
                                            onChange={(e) => setNewFilterCode(e.target.value)}
                                            placeholder="e.g. vivid-warm"
                                            className="font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Visual Parameters */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <Label>Saturation</Label>
                                                <span className="text-xs text-gray-500">{saturation.toFixed(2)}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="-1" max="1" step="0.1"
                                                value={saturation}
                                                onChange={(e) => setSaturation(parseFloat(e.target.value))}
                                                className="w-full"
                                            />
                                            <p className="text-xs text-gray-500">Makes colors pop (-1 to 1)</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <Label>Temperature</Label>
                                                <span className="text-xs text-gray-500">{temperature.toFixed(2)}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="-1" max="1" step="0.1"
                                                value={temperature}
                                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                                className="w-full"
                                            />
                                            <p className="text-xs text-gray-500">Cool (-1) to Warm (1)</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <Label>Contrast</Label>
                                                <span className="text-xs text-gray-500">{contrast.toFixed(2)}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="-1" max="1" step="0.1"
                                                value={contrast}
                                                onChange={(e) => setContrast(parseFloat(e.target.value))}
                                                className="w-full"
                                            />
                                            <p className="text-xs text-gray-500">Soft (-1) to Crunchy (1)</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <Label>Vignette</Label>
                                                <span className="text-xs text-gray-500">{vignette.toFixed(2)}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0" max="1" step="0.1"
                                                value={vignette}
                                                onChange={(e) => setVignette(parseFloat(e.target.value))}
                                                className="w-full"
                                            />
                                            <p className="text-xs text-gray-500">Darken corners (0 to 1)</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Icon</Label>
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#F23E2E] overflow-hidden bg-gray-50"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Upload className="w-6 h-6 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleImageSelect}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-sm"
                                            >
                                                Choose Image
                                            </Button>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Recommended: 100x100px PNG transparent
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || !newFilterName || !selectedImage}
                                        className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Create Filter
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!filters ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : filters.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl border border-gray-200 border-dashed">
                    <p className="text-gray-500 font-satoshi">No filters found. Create one to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filters.map((filter: Filter) => (
                        <div key={filter._id} className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0 overflow-hidden flex items-center justify-center">
                                {filter.iconUrl ? (
                                    <img src={filter.iconUrl} alt={filter.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl">?</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 truncate">{filter.name}</h3>
                                <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{filter.code}</code>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-medium ${filter.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                        {filter.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    <Switch
                                        checked={filter.isActive}
                                        onCheckedChange={() => handleToggleActive(filter._id, filter.isActive)}
                                    />
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                    onClick={() => handleDelete(filter._id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
