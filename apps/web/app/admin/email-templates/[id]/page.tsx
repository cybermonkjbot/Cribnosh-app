"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import JSZip from "jszip";
import { Code as CodeIcon, Image as ImageIcon, Loader2, Play, Save, Upload } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Helper to construct Storage URL
const getStorageUrl = (storageId: string) => {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
    return `${convexUrl.replace(/\/$/, "")}/api/storage/${storageId}`;
};

export default function EditEmailTemplatePage() {
    const params = useParams();
    const router = useRouter();
    const templateId = params.id as Id<"emailTemplates">;

    const template = useQuery(api.queries.emailConfig.get, { id: templateId });
    const updateTemplate = useMutation(api.mutations.emailTemplates.update);
    const generateUploadUrl = useMutation(api.mutations.emailTemplates.requestUploadUrl);

    // State
    const [htmlContent, setHtmlContent] = useState("");
    const [name, setName] = useState("");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState("code");

    // Load initial data
    useEffect(() => {
        if (template) {
            setHtmlContent(template.htmlContent || "");
            setName(template.name);
            setSubject(template.subject || "");
            setDescription(template.description || "");
        }
    }, [template]);

    // Save handler
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateTemplate({
                id: templateId,
                name,
                subject,
                description,
                htmlContent
            });
            setIsDirty(false);
            toast.success("Template saved");
        } catch (error) {
            toast.error("Failed to save");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    // Import ZIP handler
    const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const zip = new JSZip();
            const contents = await zip.loadAsync(file);

            // Find HTML file
            const htmlFile = Object.values(contents.files).find(f => f.name.endsWith(".html"));
            if (!htmlFile) {
                throw new Error("No .html file found in ZIP");
            }

            let html = await htmlFile.async("string");

            // Process Images
            const images = Object.values(contents.files).filter(f =>
                !f.dir && (f.name.endsWith(".png") || f.name.endsWith(".jpg") || f.name.endsWith(".jpeg") || f.name.endsWith(".gif"))
            );

            const uploadedAssets = [];

            for (const img of images) {
                // Get upload URL
                const postUrl = await generateUploadUrl();

                // Convert to blob
                const blob = await img.async("blob");

                // Upload
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": blob.type },
                    body: blob,
                });

                if (!result.ok) throw new Error(`Failed to upload ${img.name}`);

                const { storageId } = await result.json();
                const publicUrl = getStorageUrl(storageId);

                // Replace in HTML
                // Pattern: src="images/filename.png" or src="./images/filename.png"
                // We use a flexible regex to catch the filename
                const filename = img.name.split('/').pop(); // handle folders inside zip
                if (filename) {
                    // Escape special chars in filename for regex
                    const escapedName = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    // Regex to match src="...filename"
                    const regex = new RegExp(`src=["'][^"']*${escapedName}["']`, 'g');
                    html = html.replace(regex, `src="${publicUrl}"`);
                }
            }

            setHtmlContent(html);
            setIsDirty(true);
            toast.success(`Imported HTML and ${images.length} images`);

        } catch (error) {
            toast.error("Import failed: " + (error as any).message);
            console.error(error);
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = "";
        }
    };

    if (!template) {
        return <div className="p-10 text-center">Loading...</div>;
    }

    return (
        <div className="container mx-auto py-6 h-[calc(100vh-80px)] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>← Back</Button>
                    <div>
                        <h1 className="text-2xl font-bold">{template.name}</h1>
                        <p className="text-sm text-muted-foreground">{template.emailType || "Custom Template"}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <input
                            type="file"
                            accept=".zip"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleZipUpload}
                            disabled={uploading}
                        />
                        <Button variant="outline" disabled={uploading}>
                            {uploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                            Import Canva ZIP
                        </Button>
                    </div>

                    <Button onClick={handleSave} disabled={!isDirty || isSaving}>
                        {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Editor/Preview Column */}
                <div className="lg:col-span-2 flex flex-col min-h-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                        <div className="flex justify-between items-center mb-2">
                            <TabsList>
                                <TabsTrigger value="code"><CodeIcon className="w-4 h-4 mr-2" /> Code</TabsTrigger>
                                <TabsTrigger value="preview"><Play className="w-4 h-4 mr-2" /> Preview</TabsTrigger>
                            </TabsList>
                            <span className="text-xs text-muted-foreground">
                                {htmlContent.length} chars
                            </span>
                        </div>

                        <TabsContent value="code" className="flex-1 min-h-0 border rounded-md overflow-hidden relative">
                            <Textarea
                                className="w-full h-full font-mono text-sm resize-none border-0 p-4 focus-visible:ring-0"
                                value={htmlContent}
                                onChange={(e) => {
                                    setHtmlContent(e.target.value);
                                    setIsDirty(true);
                                }}
                                spellCheck={false}
                            />
                        </TabsContent>
                        <TabsContent value="preview" className="flex-1 min-h-0 border rounded-md bg-white">
                            <iframe
                                title="preview"
                                srcDoc={htmlContent}
                                className="w-full h-full border-0"
                                sandbox="allow-same-origin"
                            />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar Column */}
                <div className="flex flex-col gap-6 overflow-y-auto pr-2">
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div>
                                <Label>Template Name</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setIsDirty(true);
                                    }}
                                />
                            </div>
                            <div>
                                <Label>Subject Line</Label>
                                <Input
                                    value={subject}
                                    onChange={(e) => {
                                        setSubject(e.target.value);
                                        setIsDirty(true);
                                    }}
                                />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => {
                                        setDescription(e.target.value);
                                        setIsDirty(true);
                                    }}
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <h3 className="font-semibold mb-2 flex items-center">
                                <ImageIcon className="w-4 h-4 mr-2" />
                                Detected Images
                            </h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                Images found in the HTML source.
                            </p>
                            <div className="space-y-2">
                                {/* Simple regex to find images for display */}
                                {Array.from(htmlContent.matchAll(/src=["']([^"']+)["']/g)).map((match, i) => {
                                    const src = match[1];
                                    if (src.length > 100 && src.startsWith('data:')) return null; // Skip data URIs
                                    return (
                                        <div key={i} className="flex items-center gap-2 text-xs border p-2 rounded truncate">
                                            <div className="w-8 h-8 bg-slate-100 shrink-0 rounded overflow-hidden">
                                                <img src={src} className="w-full h-full object-cover" alt="" onError={(e) => e.currentTarget.style.display = 'none'} />
                                            </div>
                                            <div className="truncate flex-1" title={src}>{src}</div>
                                        </div>
                                    )
                                }).filter(Boolean)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <h3 className="font-semibold mb-2">Variables</h3>
                            <p className="text-xs text-muted-foreground mb-2">
                                Available variables for <strong>{template.emailType}</strong>:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {/* We could fetch these from EMAIL_TYPES if we had them available on client, 
                                    or store them in DB. For now, hardcoding based on backend map or passing from server would be ideal.
                                    Let's assume we can infer or they are known. 
                                */}
                                {["{{userName}}", "{{actionUrl}}", "{{companyAddress}}", "{{year}}"].map(v => (
                                    <code key={v} className="bg-slate-100 px-2 py-1 rounded text-xs cursor-pointer hover:bg-slate-200" onClick={() => {
                                        navigator.clipboard.writeText(v);
                                        toast.success("Copied " + v);
                                    }}>
                                        {v}
                                    </code>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
