import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useState } from "react";

interface UploadResult {
    storageId: string;
    url: string;
}

export function useFileUpload() {
    const generateUploadUrl = useMutation(api.mutations.documents.generateUploadUrl);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const upload = async (file: File): Promise<UploadResult> => {
        setIsUploading(true);
        setError(null);

        try {
            // 1. Generate Upload URL
            const postUrl = await generateUploadUrl();

            // 2. Upload File
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) {
                throw new Error(`Upload failed: ${result.statusText}`);
            }

            const { storageId } = await result.json();

            if (!storageId) {
                throw new Error("No storageId received from upload");
            }

            return {
                storageId,
                url: `/api/files/${storageId}`,
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : "Upload failed";
            setError(message);
            throw err;
        } finally {
            setIsUploading(false);
        }
    };

    return {
        upload,
        isUploading,
        error,
    };
}
