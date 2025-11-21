"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import { isImageUrl, validateImageUrl } from '@/lib/utils/embed-utils';
import { useMutation } from 'convex/react';
import { CheckCircle2, Link as LinkIcon, Loader2, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  const [imageUrl, setImageUrl] = useState('');
  const [validatingUrl, setValidatingUrl] = useState(false);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  
  const generateUploadUrl = useMutation(api.mutations.documents.generateUploadUrl);

  // Update preview when existingUrl changes
  useEffect(() => {
    if (existingUrl && !file) {
      setPreview(existingUrl);
    } else if (!existingUrl && !file) {
      setPreview(null);
    }
  }, [existingUrl, file]);

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
      // Use arrayBuffer for direct upload (Convex storage expects raw file data)
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
      // Reset state after successful upload
      setFile(null);
      setPreview(null);
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
    setImageUrl('');
    setError(null);
    setMode('upload');
    if (onCancel) {
      onCancel();
    }
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    setError(null);
    
    // Auto-validate if it looks like an image URL
    if (url && isImageUrl(url)) {
      setPreview(url);
    } else if (url) {
      setPreview(null);
    }
  };

  const handleEmbedFromUrl = async () => {
    if (!imageUrl.trim()) {
      setError('Please enter an image URL');
      return;
    }

    setValidatingUrl(true);
    setError(null);

    try {
      const validation = await validateImageUrl(imageUrl.trim());
      
      if (!validation.valid) {
        setError(validation.error || 'Invalid image URL');
        setValidatingUrl(false);
        return;
      }

      // URL is valid, use it
      onImageUploaded(imageUrl.trim());
      // Reset state after successful embed
      setImageUrl('');
      setPreview(null);
    } catch (err) {
      console.error('URL validation error:', err);
      setError('Failed to validate image URL. Please try again.');
    } finally {
      setValidatingUrl(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <Button
          type="button"
          variant={mode === 'upload' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            setMode('upload');
            setImageUrl('');
            setPreview(null);
            setError(null);
          }}
          className="flex-1"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
        <Button
          type="button"
          variant={mode === 'url' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            setMode('url');
            setFile(null);
            setError(null);
          }}
          className="flex-1"
        >
          <LinkIcon className="w-4 h-4 mr-2" />
          From URL
        </Button>
      </div>

      {/* Upload Mode */}
      {mode === 'upload' && (
        <>
          {preview && (
            <div className="relative w-full h-48 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
                type="button"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
              {/* Show upload button only when a new file is selected (not for existing URLs) */}
              {file && !uploading && (
                <div className="absolute bottom-2 left-2 right-2 z-10">
                  <Button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
              )}
              {/* Show "Use Existing" button when preview is from existingUrl and no new file selected */}
              {existingUrl && preview === existingUrl && !file && !uploading && (
                <div className="absolute bottom-2 left-2 right-2 z-10">
                  <Button
                    type="button"
                    onClick={() => onImageUploaded(existingUrl)}
                    className="w-full bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Use This Image
                  </Button>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-[#F23E2E]" />
                    <span className="text-sm font-medium">Uploading...</span>
                  </div>
                </div>
              )}
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
        </>
      )}

      {/* URL Mode */}
      {mode === 'url' && (
        <>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Image URL</label>
              <Input
                type="url"
                value={imageUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a direct link to an image (jpg, png, gif, webp, svg)
              </p>
            </div>

            {preview && (
              <div className="relative w-full h-48 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={() => {
                    setPreview(null);
                    setError('Failed to load image preview');
                  }}
                />
                <button
                  onClick={() => {
                    setPreview(null);
                    setImageUrl('');
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <Button
              type="button"
              onClick={handleEmbedFromUrl}
              disabled={!imageUrl.trim() || validatingUrl}
              className="w-full bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
            >
              {validatingUrl ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Embed Image
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

