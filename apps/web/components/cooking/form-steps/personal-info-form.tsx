"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { InputField } from "@/components/ui/input-field";
import { useMediaQuery } from "@/hooks/use-media-query";

type FormData = {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
};

interface PersonalInfoFormProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function PersonalInfoForm({
  formData,
  updateFormData,
  formErrors,
  setFormErrors,
}: PersonalInfoFormProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleChange = (field: keyof FormData['personalInfo']) => (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({
      personalInfo: {
        ...formData.personalInfo,
        [field]: e.target.value
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="First Name"
            value={formData.personalInfo.firstName}
            onChange={handleChange('firstName')}
            placeholder="Enter your first name"
            required
          />
          <InputField
            label="Last Name"
            value={formData.personalInfo.lastName}
            onChange={handleChange('lastName')}
            placeholder="Enter your last name"
            required
          />
        </div>

        <InputField
          label="Email"
          type="email"
          value={formData.personalInfo.email}
          onChange={handleChange('email')}
          placeholder="your.email@cribnosh.co.uk"
          required
        />

        <InputField
          label="Phone Number"
          type="tel"
          value={formData.personalInfo.phone}
          onChange={handleChange('phone')}
          placeholder="+44 or 0 followed by your number"
          required
        />

        <div className="text-sm text-gray-500 space-y-1">
          <p>* Phone number must be a valid UK number starting with +44 or 0</p>
        </div>
      </div>
    </div>
  );
} 