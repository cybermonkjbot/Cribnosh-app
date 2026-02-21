"use client";

import { api } from "@/convex/_generated/api";
import { useFoodCreatorAuth } from "@/lib/food-creator-auth";
import { useMutation } from "convex/react";
import { ArrowLeft, Check, ChefHat, Plus, UploadCloud, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const CUISINES = [
    "West African", "East African", "North African", "South African",
    "Jamaican", "Trinidadian", "Guyanese", "Chinese", "Indian",
    "Japanese", "Thai", "Italian", "French", "British", "Spanish",
    "American", "Middle Eastern", "Latin American", "Fusion"
];

const DIETARY_OPTIONS = [
    "Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher",
    "Dairy-Free", "Nut-Free", "Low Carb", "Keto", "Paleo"
];

export default function CreateRecipePage() {
    const { sessionToken, foodCreator } = useFoodCreatorAuth();
    const createRecipe = useMutation(api.mutations.recipes.createRecipe);
    const generateUploadUrl = useMutation(api.mutations.files.generateUploadUrl);
    const router = useRouter();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        cuisine: "",
        difficulty: "intermediate",
        prepTime: "",
        cookTime: "",
        servings: "",
    });

    const [ingredients, setIngredients] = useState([{ name: "", quantity: "", unit: "" }]);
    const [instructions, setInstructions] = useState([{ step: 1, text: "" }]);
    const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddIngredient = () => {
        setIngredients([...ingredients, { name: "", quantity: "", unit: "" }]);
    };

    const handleRemoveIngredient = (index: number) => {
        const newIngredients = [...ingredients];
        newIngredients.splice(index, 1);
        setIngredients(newIngredients);
    };

    const handleAddInstruction = () => {
        setInstructions([...instructions, { step: instructions.length + 1, text: "" }]);
    };

    const handleDietaryToggle = (option: string) => {
        setSelectedDietary(prev =>
            prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]
        );
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setImageFiles(prev => [...prev, ...files].slice(0, 10));

            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews].slice(0, 10));
        }
    };

    const handleRemoveImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        URL.revokeObjectURL(imagePreviews[index]);
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessionToken || !foodCreator) return;

        setIsSubmitting(true);
        try {
            let featuredImageUrl = "";

            // Upload images (for now just the first one as featured image)
            if (imageFiles.length > 0) {
                const uploadUrl = await generateUploadUrl();
                const result = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": imageFiles[0].type },
                    body: imageFiles[0],
                });
                const { storageId } = await result.json();
                featuredImageUrl = storageId; // Mutation handles storageId or URL
            }

            await createRecipe({
                title: formData.title,
                description: formData.description,
                ingredients: ingredients.map(i => ({
                    name: i.name,
                    amount: i.quantity,
                    unit: i.unit
                })),
                instructions: instructions.map(i => i.text),
                prepTime: formData.prepTime ? Number(formData.prepTime) : 0,
                cookTime: formData.cookTime ? Number(formData.cookTime) : 0,
                servings: formData.servings ? Number(formData.servings) : 1,
                difficulty: formData.difficulty as "easy" | "medium" | "hard",
                cuisine: formData.cuisine,
                dietary: selectedDietary,
                author: foodCreator.name,
                status: "published",
                featuredImage: featuredImageUrl,
                sessionToken,
            });

            router.push("/food-creator/content");
        } catch (error) {
            console.error("Failed to create recipe:", error);
            alert("Failed to create recipe: " + (error as Error).message);
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
                    <div className="h-12 w-12 rounded-xl bg-[#FF6B35]/20 flex items-center justify-center text-[#FF6B35]">
                        <ChefHat className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Create New Recipe</h1>
                        <p className="mt-1 text-gray-400">Share your culinary skills with the world</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-4xl">
                <div className="space-y-8">

                    {/* Basic Info */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-md shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="h-6 w-1 bg-[#FF6B35] rounded-full"></span>
                            Basic Information
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="title" className="block text-sm font-semibold text-gray-300 mb-2">Recipe Title *</label>
                                <input
                                    type="text"
                                    id="title"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-[#02120A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition"
                                    placeholder="e.g., Authentic Jollof Rice"
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-semibold text-gray-300 mb-2">Description *</label>
                                <textarea
                                    id="description"
                                    required
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-[#02120A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition resize-none"
                                    placeholder="Tell the story behind this recipe..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="cuisine" className="block text-sm font-semibold text-gray-300 mb-2">Cuisine Type</label>
                                    <select
                                        id="cuisine"
                                        value={formData.cuisine}
                                        onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                                        className="w-full bg-[#02120A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition"
                                    >
                                        <option value="">Select Cuisine</option>
                                        {CUISINES.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="difficulty" className="block text-sm font-semibold text-gray-300 mb-2">Difficulty</label>
                                    <select
                                        id="difficulty"
                                        value={formData.difficulty}
                                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                        className="w-full bg-[#02120A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition"
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label htmlFor="prepTime" className="block text-sm font-semibold text-gray-300 mb-2">Prep Time (mins)</label>
                                    <input
                                        type="number"
                                        id="prepTime"
                                        min="0"
                                        value={formData.prepTime}
                                        onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                                        className="w-full bg-[#02120A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="cookTime" className="block text-sm font-semibold text-gray-300 mb-2">Cook Time (mins)</label>
                                    <input
                                        type="number"
                                        id="cookTime"
                                        min="0"
                                        value={formData.cookTime}
                                        onChange={(e) => setFormData({ ...formData, cookTime: e.target.value })}
                                        className="w-full bg-[#02120A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="servings" className="block text-sm font-semibold text-gray-300 mb-2">Servings</label>
                                    <input
                                        type="number"
                                        id="servings"
                                        min="1"
                                        value={formData.servings}
                                        onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                                        className="w-full bg-[#02120A] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dietary Selection */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-md shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="h-6 w-1 bg-[#FF6B35] rounded-full"></span>
                            Dietary Preferences
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {DIETARY_OPTIONS.map(option => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => handleDietaryToggle(option)}
                                    className={`px-4 py-2 rounded-full border transition-all flex items-center gap-2 ${selectedDietary.includes(option)
                                        ? "bg-[#FF6B35]/20 border-[#FF6B35] text-[#FF6B35]"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:border-gray-500"
                                        }`}
                                >
                                    {selectedDietary.includes(option) && <Check className="h-4 w-4" />}
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ingredients */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-md shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="h-6 w-1 bg-[#FF6B35] rounded-full"></span>
                            Ingredients
                        </h2>
                        <div className="space-y-4">
                            {ingredients.map((ingredient, index) => (
                                <div key={index} className="flex gap-4 items-start animate-in fade-in slide-in-from-left-2 transition-all">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Ingredient name (e.g. Basmati Rice)"
                                            value={ingredient.name}
                                            onChange={(e) => {
                                                const newIngredients = [...ingredients];
                                                newIngredients[index].name = e.target.value;
                                                setIngredients(newIngredients);
                                            }}
                                            className="w-full bg-[#02120A] border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-[#FF6B35] outline-none"
                                        />
                                    </div>
                                    <div className="w-24">
                                        <input
                                            type="text"
                                            placeholder="Qty"
                                            value={ingredient.quantity}
                                            onChange={(e) => {
                                                const newIngredients = [...ingredients];
                                                newIngredients[index].quantity = e.target.value;
                                                setIngredients(newIngredients);
                                            }}
                                            className="w-full bg-[#02120A] border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-[#FF6B35] outline-none"
                                        />
                                    </div>
                                    <div className="w-24">
                                        <input
                                            type="text"
                                            placeholder="Unit"
                                            value={ingredient.unit}
                                            onChange={(e) => {
                                                const newIngredients = [...ingredients];
                                                newIngredients[index].unit = e.target.value;
                                                setIngredients(newIngredients);
                                            }}
                                            className="w-full bg-[#02120A] border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-[#FF6B35] outline-none"
                                        />
                                    </div>
                                    {ingredients.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveIngredient(index)}
                                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddIngredient}
                                className="mt-4 flex items-center gap-2 text-sm font-bold text-[#FF6B35] hover:text-[#ff8555] transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Add Ingredient
                            </button>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-md shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="h-6 w-1 bg-[#FF6B35] rounded-full"></span>
                            Instructions
                        </h2>
                        <div className="space-y-6">
                            {instructions.map((instruction, index) => (
                                <div key={instruction.step} className="flex gap-4 group">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FF6B35]/20 text-[#FF6B35] flex items-center justify-center font-bold text-sm mt-1 transition-transform group-hover:scale-110">
                                        {instruction.step}
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            rows={2}
                                            placeholder={`Describe step ${instruction.step}...`}
                                            value={instruction.text}
                                            onChange={(e) => {
                                                const newInstructions = [...instructions];
                                                newInstructions[index].text = e.target.value;
                                                setInstructions(newInstructions);
                                            }}
                                            className="w-full bg-[#02120A] border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-[#FF6B35] outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddInstruction}
                                className="flex items-center gap-2 text-sm font-bold text-[#FF6B35] hover:text-[#ff8555] transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Add Step
                            </button>
                        </div>
                    </div>

                    {/* Media */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-md shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="h-6 w-1 bg-[#FF6B35] rounded-full"></span>
                            Photos
                        </h2>

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center hover:border-[#FF6B35]/50 transition-all cursor-pointer bg-white/5 group"
                        >
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                            />
                            <UploadCloud className="h-10 w-10 text-[#FF6B35] mx-auto mb-4 group-hover:scale-110 transition-transform" />
                            <p className="text-white font-bold text-lg">Click to upload photos</p>
                            <p className="text-sm text-gray-500 mt-2">Up to 10 photos, max 5MB each. First photo will be featured.</p>
                        </div>

                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                                        <img src={preview} alt={`Upload ${index}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }}
                                            className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-black/80 text-white transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        {index === 0 && (
                                            <div className="absolute bottom-0 inset-x-0 bg-orange-500/80 text-white text-[10px] font-bold py-1 text-center">
                                                FEATURED
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4 pb-20">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-gradient-to-r from-[#FF3B30] to-[#FF6B35] text-white font-bold py-4 px-8 rounded-xl hover:shadow-[0_0_20px_rgba(255,107,53,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {isSubmitting ? (
                                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    Publish Recipe
                                    <Check className="h-5 w-5 transition-transform group-hover:scale-125" />
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            className="px-8 py-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                        >
                            Save as Draft
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
