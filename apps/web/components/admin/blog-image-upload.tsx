"use client";

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, X } from 'lucide-react';

interface BlogImageUploadProps {
  onImageUploaded: (url: string) => void;
  onCancel?: () => void;
  existingUrl?: string;
}

export function BlogImageUpload({ onImageUploaded, onCancel, existingUrl }: BlogImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(existingUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const generateUploadUrl = useMutation(api.mutations.documents.generateUploadUrl);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // 1. Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // 2. Upload file to Convex storage
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: await file.arrayBuffer(),
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await uploadResponse.json();
      if (!result.storageId) {
        throw new Error('No storageId in upload response');
      }

      // 3. Return the Convex file URL
      const fileUrl = `/api/files/${result.storageId}`;
      onImageUploaded(fileUrl);
    } catch (err) {
      console.error('Image upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="space-y-4">
      {preview && (
        <div className="relative w-full h-48 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!preview && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white hover:border-gray-400 transition-colors duration-200">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-600 mb-2">Select an image to upload</p>
          <p className="text-xs text-gray-500 mb-4">Max size: 5MB</p>
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload">
            <Button type="button" variant="outline" asChild>
              <span>Choose File</span>
            </Button>
          </label>
        </div>
      )}

      {file && !preview && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-600">{file.name}</p>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

