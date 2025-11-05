"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { InputField } from "@/components/ui/input-field";
import { useMediaQuery } from "@/hooks/use-media-query";

type FormData = {
  kitchenDetails: {
    kitchenName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    kitchenType: string;
    postcode: string;
    equipmentDetails: string;
  };
};

interface KitchenDetailsFormProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function KitchenDetailsForm({
  formData,
  updateFormData,
  formErrors,
  setFormErrors,
}: KitchenDetailsFormProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleChange = (field: keyof FormData['kitchenDetails']) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateFormData({
      kitchenDetails: {
        ...formData.kitchenDetails,
        [field]: e.target.value
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <InputField
          label="Kitchen Name"
          value={formData.kitchenDetails.kitchenName}
          onChange={handleChange('kitchenName')}
          placeholder="Enter your kitchen's name (optional)"
        />

        <InputField
          label="Street Address"
          value={formData.kitchenDetails.address}
          onChange={handleChange('address')}
          placeholder="Enter your kitchen's street address (optional)"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="City"
            value={formData.kitchenDetails.city}
            onChange={handleChange('city')}
            placeholder="City (optional)"
          />
          <InputField
            label="State/Region"
            value={formData.kitchenDetails.state}
            onChange={handleChange('state')}
            placeholder="State or Region (optional)"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Postal Code"
            value={formData.kitchenDetails.postcode}
            onChange={handleChange('postcode')}
            placeholder="Postal Code (optional)"
          />
          <InputField
            label="ZIP Code"
            value={formData.kitchenDetails.zipCode}
            onChange={handleChange('zipCode')}
            placeholder="ZIP Code (optional)"
          />
        </div>

        <InputField
          label="Kitchen Type"
          value={formData.kitchenDetails.kitchenType}
          onChange={handleChange('kitchenType')}
          placeholder="e.g., Home kitchen, Commercial kitchen, Food truck (optional)"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Equipment Details
          </label>
          <textarea
            value={formData.kitchenDetails.equipmentDetails}
            onChange={handleChange('equipmentDetails')}
            placeholder="Describe your kitchen equipment and setup (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff3b30] focus:border-transparent"
            rows={3}
          />
        </div>


      </div>
    </div>
  );
} 