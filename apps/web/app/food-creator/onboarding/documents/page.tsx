"use client";

import { api } from "@/convex/_generated/api";
import { useChefAuth } from "@/lib/chef-auth";
import { useMutation } from "convex/react";
import { AlertCircle, ArrowLeft, CheckCircle2, FileText, UploadCloud, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function DocumentsPage() {
    const { sessionToken, chef } = useChefAuth();
    const generateUploadUrl = useMutation(api.mutations.documents.generateUploadUrl);
    const uploadDocument = useMutation(api.mutations.chefDocuments.uploadDocument);

    const [documents, setDocuments] = useState([
        { id: "id_proof", name: "Government ID", status: "pending", required: true },
        { id: "hygiene", name: "Food Hygiene Certificate", status: "missing", required: true },
        { id: "insurance", name: "Liability Insurance", status: "verified", required: true },
        { id: "kitchen", name: "Kitchen Photos", status: "missing", required: true },
    ]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
        const file = e.target.files?.[0];
        if (!file || !chef || !sessionToken) return;

        try {
            // 1. Get upload URL
            const postUrl = await generateUploadUrl();

            // 2. Upload file
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();

            // 3. Save document record
            await uploadDocument({
                chefId: chef._id,
                documentType: "other", // Simplification: in real app, map docType to enum
                documentName: file.name,
                fileName: file.name,
                fileStorageId: storageId,
                fileUrl: "", // Convex storage URL is handled internally or via getUrl
                fileSize: file.size,
                mimeType: file.type,
                isRequired: true,
                sessionToken,
            });

            // Update local state (optimistic)
            setDocuments(docs => docs.map(d =>
                d.id === docType ? { ...d, status: "pending" } : d
            ));

            alert("Document uploaded successfully!");

        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload document");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "verified": return "text-green-600 bg-green-100";
            case "pending": return "text-yellow-600 bg-yellow-100";
            case "rejected": return "text-red-600 bg-red-100";
            default: return "text-gray-600 bg-gray-100";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "verified": return <CheckCircle2 className="h-5 w-5" />;
            case "pending": return <AlertCircle className="h-5 w-5" />;
            case "rejected": return <XCircle className="h-5 w-5" />;
            default: return <UploadCloud className="h-5 w-5" />;
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/chef/onboarding"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Onboarding
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Document Upload</h1>
                <p className="mt-1 text-gray-600">Please provide the required documentation for verification</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload List */}
                <div className="space-y-4">
                    {documents.map((doc) => (
                        <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        {doc.name}
                                        {doc.required && <span className="ml-2 text-xs text-red-500 font-normal">*Required</span>}
                                    </h3>
                                    <p className="text-sm text-gray-500 capitalize">{doc.status}</p>
                                </div>
                            </div>

                            <button
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${doc.status === 'verified'
                                    ? 'bg-green-50 text-green-700 cursor-default'
                                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                                    }`}
                            >
                                {getStatusIcon(doc.status)}
                                {doc.status === 'verified' ? 'Verified' : 'Upload'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Upload Area */}
                <div className="rounded-xl bg-white/80 backdrop-blur-sm p-8 shadow-md border border-white/20 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                        <UploadCloud className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Document</h3>
                    <p className="text-gray-600 mb-6">Select a document from the list and upload your file (PDF, JPG, PNG)</p>

                    <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-orange-400 transition-colors cursor-pointer bg-gray-50/50">
                        <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                                // For now, we'll default to the first missing document or let user select type
                                // ideally we'd have state tracking which doc type is being uploaded
                                const docType = documents.find(d => d.status === 'missing')?.id || 'other';
                                handleFileUpload(e, docType);
                            }}
                        />
                        <p className="text-gray-700 font-medium">Click to browse or drag file here</p>
                        <p className="text-sm text-gray-500 mt-2">Maximum file size: 5MB</p>
                    </label>
                </div>
            </div>
        </div>
    );
}
