"use client";

import React, { useState, useCallback } from "react";
import { AlertCircle, Upload, X, Image as ImageIcon } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useMediaQuery } from "@/hooks/use-media-query";

type FormData = {
  photos: {
    kitchen: string[];
    dishes: string[];
  };
};

type UploadPhotosFormProps = {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
};

export function UploadPhotosForm({
  formData,
  updateFormData,
  formErrors,
  setFormErrors,
}: UploadPhotosFormProps) {
  const [activeSection, setActiveSection] = useState<"kitchen" | "dishes">("kitchen");
  const isMobile = useMediaQuery('(max-width: 768px)');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // In a real app, you would upload these files to a storage service
    // and get back URLs. For now, we'll create object URLs
    const newPhotos = acceptedFiles.map(file => URL.createObjectURL(file));
    
    updateFormData({
      photos: {
        ...formData.photos,
        [activeSection]: [...formData.photos[activeSection], ...newPhotos]
      }
    });

    // Clear any errors
    if (formErrors.photos) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.photos;
        return newErrors;
      });
    }
  }, [activeSection, formData.photos, updateFormData, formErrors, setFormErrors]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".heic"]
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5
  });

  const removePhoto = (section: "kitchen" | "dishes", index: number) => {
    const updatedPhotos = [...formData.photos[section]];
    updatedPhotos.splice(index, 1);
    
    updateFormData({
      photos: {
        ...formData.photos,
        [section]: updatedPhotos
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">Upload Photos</h3>
        <p className="text-gray-600 mb-4">
          Share photos of your kitchen space and your signature dishes. This helps build trust with potential customers.
        </p>
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveSection("kitchen")}
          className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px ${
            activeSection === "kitchen"
              ? "border-[#ff3b30] text-[#ff3b30]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Kitchen Photos
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("dishes")}
          className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px ${
            activeSection === "dishes"
              ? "border-[#ff3b30] text-[#ff3b30]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Dish Photos
        </button>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-[#ff3b30] bg-red-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-3">
          <div className="flex justify-center">
            <Upload className={`w-10 h-10 ${isDragActive ? "text-[#ff3b30]" : "text-gray-400"}`} />
          </div>
          <div>
            <p className="text-base font-medium text-gray-700">
              {isDragActive ? "Drop your photos here" : "Drag & drop photos here"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to select files
            </p>
          </div>
          <p className="text-xs text-gray-400">
            Maximum 5 photos, up to 10MB each (JPEG, PNG)
          </p>
        </div>
      </div>

      {/* Preview Grid */}
      {formData.photos[activeSection].length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {formData.photos[activeSection].map((photo, index) => (
            <div
              key={index}
              className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group"
            >
              <img
                src={photo}
                alt={`${activeSection} photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(activeSection, index)}
                className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {formData.photos[activeSection].length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">
            No {activeSection === "kitchen" ? "kitchen" : "dish"} photos uploaded yet
          </p>
        </div>
      )}

      {/* Error Message */}
      {formErrors.photos && (
        <div className="mt-2 flex items-center text-red-500 text-sm">
          <AlertCircle className="w-4 h-4 mr-1" />
          <span>{formErrors.photos}</span>
        </div>
      )}

      
    </div>
  );
} 