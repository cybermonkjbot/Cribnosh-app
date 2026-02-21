"use client";

import type { FormData } from '@/app/become-a-food-creator/apply/client-page';
import { useMediaQuery } from "@/hooks/use-media-query";
import { AlertCircle, Plus, X } from "lucide-react";
import React, { useState } from "react";

type CulinaryBackgroundFormProps = {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
};

const cuisineOptions = [
  "American", "Italian", "Chinese", "Japanese", "Mexican",
  "Indian", "Thai", "Mediterranean", "French", "Greek",
  "Korean", "Vietnamese", "Middle Eastern", "Caribbean",
  "African", "Spanish", "Brazilian", "Fusion"
];

const experienceOptions = [
  { id: "less-than-1", label: "Less than 1 year" },
  { id: "1-3", label: "1-3 years" },
  { id: "3-5", label: "3-5 years" },
  { id: "5-10", label: "5-10 years" },
  { id: "10+", label: "10+ years" },
  { id: "professional", label: "Professional food creator experience" }
];

export function CulinaryBackgroundForm({
  formData,
  updateFormData,
  formErrors,
  setFormErrors,
}: CulinaryBackgroundFormProps) {
  const [newSpecialty, setNewSpecialty] = useState("");
  const isMobile = useMediaQuery('(max-width: 768px)');

  const validateField = (name: string, value: any) => {
    const error = "";

    switch (name) {
      case "experience":
        // Experience is now optional
        break;
      case "cuisineTypes":
        // Cuisine types are now optional
        break;
      default:
        break;
    }

    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));

    return !error;
  };

  const handleExperienceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    updateFormData({
      culinaryBackground: {
        ...formData.culinaryBackground,
        experience: value
      }
    });
    validateField("experience", value);
  };

  const handleCuisineChange = (cuisine: string) => {
    const updatedCuisines = formData.culinaryBackground.cuisineTypes.includes(cuisine)
      ? formData.culinaryBackground.cuisineTypes.filter((c: string) => c !== cuisine)
      : [...formData.culinaryBackground.cuisineTypes, cuisine];

    updateFormData({
      culinaryBackground: {
        ...formData.culinaryBackground,
        cuisineTypes: updatedCuisines
      }
    });
    validateField("cuisineTypes", updatedCuisines);
  };

  const handleSpecialtyAdd = () => {
    if (newSpecialty.trim()) {
      updateFormData({
        culinaryBackground: {
          ...formData.culinaryBackground,
          specialties: [...formData.culinaryBackground.specialties, newSpecialty.trim()]
        }
      });
      setNewSpecialty("");
    }
  };

  const handleSpecialtyRemove = (specialty: string) => {
    updateFormData({
      culinaryBackground: {
        ...formData.culinaryBackground,
        specialties: formData.culinaryBackground.specialties.filter((s: string) => s !== specialty)
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years of Experience
          </label>
          <select
            value={formData.culinaryBackground.experience}
            onChange={handleExperienceChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 focus:ring-2 focus:ring-[#ff3b30]/50"
          >
            <option value="">Select experience level</option>
            {experienceOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          {formErrors.experience && (
            <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {formErrors.experience}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cuisine Types
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {cuisineOptions.map(cuisine => (
              <button
                key={cuisine}
                onClick={() => handleCuisineChange(cuisine)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${formData.culinaryBackground.cuisineTypes.includes(cuisine)
                    ? 'bg-[#ff3b30] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                `}
              >
                {cuisine}
              </button>
            ))}
          </div>
          {formErrors.cuisineTypes && (
            <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {formErrors.cuisineTypes}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specialties
          </label>
          <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              placeholder="Add a specialty"
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 focus:ring-2 focus:ring-[#ff3b30]/50"
            />
            <button
              onClick={handleSpecialtyAdd}
              disabled={!newSpecialty.trim()}
              className={`
                ${isMobile ? 'w-full' : 'px-4'} py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2
                ${newSpecialty.trim()
                  ? 'bg-[#ff3b30] text-white hover:bg-[#ff5e54]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
              `}
            >
              <Plus className="w-4 h-4" />
              Add Specialty
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {formData.culinaryBackground.specialties.map((specialty: string, index: number) => (
              <span
                key={index}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium flex items-center gap-2"
              >
                {specialty}
                <button
                  onClick={() => handleSpecialtyRemove(specialty)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Availability Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Availability (select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {['Weekdays', 'Weekends', 'Mornings', 'Afternoons', 'Evenings'].map(option => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  const current = (formData as any).availability || [];
                  const updated = current.includes(option)
                    ? current.filter((a: string) => a !== option)
                    : [...current, option];
                  updateFormData({ availability: updated });
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${((formData as any).availability || []).includes(option) ? 'bg-[#ff3b30] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Business Registration Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Registration Number
          </label>
          <input
            type="text"
            value={(formData as any).businessRegistration || ''}
            onChange={e => updateFormData({ businessRegistration: e.target.value })}
            placeholder="Enter your business registration number"
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 focus:ring-2 focus:ring-[#ff3b30]/50"
          />
        </div>

        {/* Insurance Field */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!(formData as any).hasInsurance}
            onChange={e => updateFormData({ hasInsurance: e.target.checked })}
            id="hasInsurance"
            className="h-4 w-4 text-[#ff3b30] border-gray-300 rounded focus:ring-[#ff3b30]/50"
          />
          <label htmlFor="hasInsurance" className="text-sm text-gray-700">
            I have valid business insurance
          </label>
        </div>
      </div>

    </div>
  );
} 