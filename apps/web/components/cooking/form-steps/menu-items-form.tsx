"use client";

import React, { useState } from "react";
import { AlertCircle, X, Plus, Trash2 } from "lucide-react";
import { InputField } from "@/components/ui/input-field";
import { useMediaQuery } from "@/hooks/use-media-query";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  dietaryTags: string[];
};

type FormData = {
  menuItems: MenuItem[];
};

interface MenuItemsFormProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function MenuItemsForm({
  formData,
  updateFormData,
  formErrors,
  setFormErrors,
}: MenuItemsFormProps) {
  const [newItem, setNewItem] = useState<MenuItem>({
    id: '',
    name: '',
    description: '',
    price: '',
    dietaryTags: []
  });
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleNewItemChange = (field: keyof Omit<MenuItem, 'id' | 'dietaryTags'>) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setNewItem(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleNewItemDietaryTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
    setNewItem(prev => ({
      ...prev,
      dietaryTags: tags
    }));
  };

  const handleExistingItemChange = (id: string, field: keyof Omit<MenuItem, 'id' | 'dietaryTags'>) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    updateFormData({
      menuItems: formData.menuItems.map(item =>
        item.id === id ? { ...item, [field]: e.target.value } : item
      )
    });
  };

  const handleExistingItemDietaryTagsChange = (id: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
    updateFormData({
      menuItems: formData.menuItems.map(item =>
        item.id === id ? { ...item, dietaryTags: tags } : item
      )
    });
  };

  const addMenuItem = () => {
    if (isNewItemValid()) {
      updateFormData({
        menuItems: [...formData.menuItems, { ...newItem, id: Date.now().toString() }]
      });
      setNewItem({
        id: '',
        name: '',
        description: '',
        price: '',
        dietaryTags: []
      });
    }
  };

  const removeMenuItem = (id: string) => {
    updateFormData({
      menuItems: formData.menuItems.filter(item => item.id !== id)
    });
  };

  const isNewItemValid = () => {
    return (
      newItem.name.trim() !== '' &&
      newItem.description.trim() !== '' &&
      newItem.price.trim() !== ''
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">Menu Items</h3>
        <p className="text-gray-600 mb-4">
          Add some of your signature dishes to showcase your culinary style.
        </p>
      </div>

      <div className="space-y-4">
        {formData.menuItems.map((item) => (
          <div key={item.id} className="p-4 border border-gray-200 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Menu Item</h3>
              <button
                onClick={() => removeMenuItem(item.id)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <InputField
              label="Item Name"
              value={item.name}
              onChange={handleExistingItemChange(item.id, 'name')}
              placeholder="e.g., Homemade Lasagna"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={item.description}
                onChange={handleExistingItemChange(item.id, 'description')}
                placeholder="Describe your dish, including key ingredients and preparation method"
                className="w-full h-24 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#ff3b30]/50"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Price"
                value={item.price}
                onChange={handleExistingItemChange(item.id, 'price')}
                placeholder="£0.00"
                required
              />
              <InputField
                label="Dietary Tags"
                value={item.dietaryTags.join(', ')}
                onChange={handleExistingItemDietaryTagsChange(item.id)}
                placeholder="e.g., Vegetarian, Gluten-free"
              />
            </div>
          </div>
        ))}

        <div className="p-4 border border-gray-200 rounded-lg space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Add New Menu Item</h3>

          <InputField
            label="Item Name"
            value={newItem.name}
            onChange={handleNewItemChange('name')}
            placeholder="e.g., Homemade Lasagna"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={newItem.description}
              onChange={handleNewItemChange('description')}
              placeholder="Describe your dish, including key ingredients and preparation method"
              className="w-full h-24 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#ff3b30]/50"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Price"
              value={newItem.price}
              onChange={handleNewItemChange('price')}
              placeholder="£0.00"
              required
            />
            <InputField
              label="Dietary Tags"
              value={newItem.dietaryTags.join(', ')}
              onChange={handleNewItemDietaryTagsChange}
              placeholder="e.g., Vegetarian, Gluten-free"
            />
          </div>

          <button
            onClick={addMenuItem}
            disabled={!isNewItemValid()}
            className={`
              w-full mt-4 px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2
              ${isNewItemValid()
                ? 'bg-[#ff3b30] text-white hover:bg-[#ff5e54]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
            `}
          >
            <Plus className="w-4 h-4" />
            Add Menu Item
          </button>
        </div>
      </div>
      
    </div>
  );
} 