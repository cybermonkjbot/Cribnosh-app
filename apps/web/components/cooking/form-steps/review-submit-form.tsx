"use client";

import React from "react";
import { AlertCircle, Check } from "lucide-react";

type FormData = {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
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
  culinaryBackground: {
    experience: string;
    specialties: string[];
    certifications: string[];
    cuisineTypes: string[];
  };
  menuItems: Array<{
    id: string;
    name: string;
    description: string;
    price: string;
    dietaryTags: string[];
  }>;
  photos: {
    kitchen: string[];
    dishes: string[];
  };
};

type ReviewSubmitFormProps = {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onSubmit: () => void;
};

export function ReviewSubmitForm({
  formData,
  formErrors,
  onSubmit
}: ReviewSubmitFormProps) {
  const validateForm = () => {
    // All validation should have been done in previous steps
    // This is just a final review
    return true;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">Review Your Application</h3>
        <p className="text-gray-600">
          Please review all the information below before submitting your kitchen application.
        </p>
      </div>

      {/* Personal Information */}
      <section className="bg-white p-6 rounded-xl border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Name</p>
            <p className="mt-1">{formData.personalInfo.firstName} {formData.personalInfo.lastName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="mt-1">{formData.personalInfo.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Phone</p>
            <p className="mt-1">{formData.personalInfo.phone}</p>
          </div>
        </div>
      </section>

      {/* Kitchen Details */}
      <section className="bg-white p-6 rounded-xl border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Kitchen Details</h4>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Kitchen Name</p>
            <p className="mt-1">{formData.kitchenDetails.kitchenName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Kitchen Type</p>
            <p className="mt-1">{formData.kitchenDetails.kitchenType}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Address</p>
            <p className="mt-1">
              {formData.kitchenDetails.address}<br />
              {formData.kitchenDetails.city}, {formData.kitchenDetails.state} {formData.kitchenDetails.zipCode}
            </p>
          </div>
        </div>
      </section>

      {/* Culinary Background */}
      <section className="bg-white p-6 rounded-xl border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Culinary Background</h4>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Experience</p>
            <p className="mt-1">{formData.culinaryBackground.experience}</p>
          </div>
          {formData.culinaryBackground.specialties.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500">Specialties</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {formData.culinaryBackground.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}
          {formData.culinaryBackground.cuisineTypes.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500">Cuisine Types</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {formData.culinaryBackground.cuisineTypes.map((cuisine, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {cuisine}
                  </span>
                ))}
              </div>
            </div>
          )}
          {formData.culinaryBackground.certifications.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500">Certifications</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {formData.culinaryBackground.certifications.map((cert, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Menu Items */}
      <section className="bg-white p-6 rounded-xl border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Menu Items</h4>
        <div className="space-y-4">
          {formData.menuItems.map((item, index) => (
            <div
              key={item.id}
              className="p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex justify-between">
                <div>
                  <h5 className="font-medium text-gray-900">{item.name}</h5>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  <p className="text-[#ff3b30] font-medium mt-2">${item.price}</p>
                </div>
                {item.dietaryTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.dietaryTags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Photos */}
      <section className="bg-white p-6 rounded-xl border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Photos</h4>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">Kitchen Photos</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {formData.photos.kitchen.map((photo, index) => (
                <div
                  key={index}
                  className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                >
                  <img
                    src={photo}
                    alt={`Kitchen photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">Dish Photos</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {formData.photos.dishes.map((photo, index) => (
                <div
                  key={index}
                  className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                >
                  <img
                    src={photo}
                    alt={`Dish photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSubmit}
          className="px-6 py-3 bg-[#ff3b30] text-white rounded-lg hover:bg-[#ff5e54] transition-colors flex items-center gap-2"
        >
          <Check className="w-5 h-5" />
          Submit Application
        </button>
      </div>

      {/* Form Errors */}
      {Object.keys(formErrors).length > 0 && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center text-red-700 mb-2">
            <AlertCircle className="w-5 h-5 mr-2" />
            <h5 className="font-medium">Please fix the following errors:</h5>
          </div>
          <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
            {Object.entries(formErrors).map(([key, error]) => (
              <li key={key}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}