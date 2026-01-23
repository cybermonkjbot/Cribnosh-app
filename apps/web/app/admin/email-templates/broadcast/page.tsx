"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import JSZip from "jszip";
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Code,
    Eye,
    Loader2,
    Mail,
    Search,
    Send,
    Upload,
    X
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Helper to construct Storage URL
const getStorageUrl = (storageId: string) => {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
    return `${convexUrl.replace(/\/$/, "")}/api/storage/${storageId}`;
};

type Step = "upload" | "preview" | "audience" | "confirm" | "sending" | "result";

export default function BroadcastEmailPage() {
    const [step, setStep] = useState<Step>("upload");
    const [uploading, setUploading] = useState(false);
    const [htmlContent, setHtmlContent] = useState("");
    const [subject, setSubject] = useState("");
    const [imagesExtracted, setImagesExtracted] = useState(0);

    // Audience State
    const [audienceType, setAudienceType] = useState<"all" | "roles" | "individuals" | "waitlist" | "waitlist_pending">("all");
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [selectedIndividuals, setSelectedIndividuals] = useState<{ id: string, name: string, email: string }[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Sending State
    const [isSending, setIsSending] = useState(false);
    const [sendResult, setSendResult] = useState<{ sent: number, failed: number, errors: string[] } | null>(null);

    // Convex
    const generateUploadUrl = useMutation(api.mutations.emailTemplates.requestUploadUrl);
    const audienceData = useQuery(api.queries.broadcast.getAudienceSelectionData);
    const searchResults = useQuery(api.queries.broadcast.searchRecipients, { query: searchQuery });
    const getEmails = useQuery(api.queries.broadcast.getRecipientEmails, {
        type: audienceType,
        values: audienceType === "roles" ? selectedRoles : audienceType === "individuals" ? selectedIndividuals.map(i => i.id) : undefined
    });
    const sendBroadcastAction = useAction(api.actions.broadcast.sendBroadcast);

    // ZIP Upload Logic
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

            let uploadedCount = 0;
            for (const img of images) {
                const postUrl = await generateUploadUrl();
                const blob = await img.async("blob");
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": blob.type },
                    body: blob,
                });

                if (result.ok) {
                    const { storageId } = await result.json();
                    const publicUrl = getStorageUrl(storageId);
                    const filename = img.name.split('/').pop();
                    if (filename) {
                        const escapedName = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const regex = new RegExp(`src=["'][^"']*${escapedName}["']`, 'g');
                        html = html.replace(regex, `src="${publicUrl}"`);
                        uploadedCount++;
                    }
                }
            }

            setHtmlContent(html);
            setImagesExtracted(uploadedCount);
            toast.success(`Extracted HTML and ${uploadedCount} images`);
            setStep("preview");

        } catch (error) {
            toast.error("Import failed: " + (error as any).message);
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleSend = async () => {
        if (!subject) {
            toast.error("Please enter a subject line");
            return;
        }
        if (!getEmails || getEmails.length === 0) {
            toast.error("No recipients found for selection");
            return;
        }

        setIsSending(true);
        setStep("sending");

        try {
            const result = await sendBroadcastAction({
                subject,
                html: htmlContent,
                recipientEmails: getEmails
            });

            setSendResult({
                sent: result.sent,
                failed: result.failed,
                errors: result.errors
            });
            setStep("result");
        } catch (error) {
            toast.error("Failed to send broadcast");
            console.error(error);
            setStep("confirm");
        } finally {
            setIsSending(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case "upload":
                return (
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>Step 1: Upload Canva Template</CardTitle>
                            <CardDescription>
                                Upload the .zip file exported from Canva. We will automatically extract the HTML and host the images for you.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-lg bg-slate-50">
                            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                            <div className="text-center mb-6">
                                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                <p className="text-xs text-muted-foreground">ZIP file containing index.html and images folder</p>
                            </div>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".zip"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleZipUpload}
                                    disabled={uploading}
                                />
                                <Button disabled={uploading}>
                                    {uploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                    Select ZIP File
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );

            case "preview":
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Step 2: Preview Content</CardTitle>
                                    <CardDescription>Verify the design of your email.</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setStep("upload")}>
                                        <ChevronLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                    <Button onClick={() => setStep("audience")}>
                                        Next <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="subject">Subject Line</Label>
                                        <Input
                                            id="subject"
                                            placeholder="Exciting News from CribNosh!"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                        />
                                    </div>
                                    <Tabs defaultValue="preview">
                                        <TabsList>
                                            <TabsTrigger value="preview"><Eye className="w-4 h-4 mr-2" /> Preview</TabsTrigger>
                                            <TabsTrigger value="code"><Code className="w-4 h-4 mr-2" /> HTML</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="preview" className="border rounded-md bg-white mt-4 h-[500px]">
                                            <iframe
                                                title="Email Preview"
                                                srcDoc={htmlContent}
                                                className="w-full h-full border-0"
                                            />
                                        </TabsContent>
                                        <TabsContent value="code" className="border rounded-md bg-slate-950 text-slate-50 p-4 mt-4 h-[500px] overflow-auto">
                                            <pre className="text-xs whitespace-pre-wrap">{htmlContent}</pre>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Import Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-sm font-medium">Images Extracted</span>
                                    <Badge variant="secondary">{imagesExtracted}</Badge>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-sm font-medium">HTML Length</span>
                                    <span className="text-xs text-muted-foreground">{htmlContent.length} chars</span>
                                </div>
                                <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                                    <p className="text-xs text-amber-800">
                                        <strong>Tip:</strong> Canva often uses large images. We've hosted them on our CDN to ensure they load quickly.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case "audience":
                return (
                    <Card className="max-w-3xl mx-auto">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Step 3: Select Audience</CardTitle>
                                <CardDescription>Who should receive this email?</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setStep("preview")}>
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                                <Button onClick={() => setStep("confirm")} disabled={audienceType === "roles" && selectedRoles.length === 0 || audienceType === "individuals" && selectedIndividuals.length === 0}>
                                    Next <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup value={audienceType} onValueChange={(v: any) => setAudienceType(v)} className="space-y-6">
                                <div className="flex items-start space-x-3 border p-4 rounded-lg cursor-pointer hover:bg-slate-50">
                                    <RadioGroupItem value="all" id="all" className="mt-1" />
                                    <Label htmlFor="all" className="flex-1 cursor-pointer">
                                        <div className="font-semibold">All Active Users</div>
                                        <div className="text-sm text-muted-foreground">Send to every registered user in the system ({audienceData?.totalUsers || "..."})</div>
                                    </Label>
                                </div>

                                <div className="flex items-start space-x-3 border p-4 rounded-lg cursor-pointer hover:bg-slate-50">
                                    <RadioGroupItem value="roles" id="roles" className="mt-1" />
                                    <div className="flex-1">
                                        <Label htmlFor="roles" className="font-semibold cursor-pointer">Group by User Types (Roles)</Label>
                                        <div className="text-sm text-muted-foreground mb-4">Select specific categories of users</div>
                                        {audienceType === "roles" && (
                                            <div className="grid grid-cols-2 gap-3 mt-4">
                                                {audienceData?.roles.map((role: string) => (
                                                    <div key={role} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`role-${role}`}
                                                            checked={selectedRoles.includes(role)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) setSelectedRoles([...selectedRoles, role]);
                                                                else setSelectedRoles(selectedRoles.filter(r => r !== role));
                                                            }}
                                                        />
                                                        <Label htmlFor={`role-${role}`} className="capitalize">{role}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3 border p-4 rounded-lg cursor-pointer hover:bg-slate-50">
                                    <RadioGroupItem value="individuals" id="individuals" className="mt-1" />
                                    <div className="flex-1">
                                        <Label htmlFor="individuals" className="font-semibold cursor-pointer">Specific Individuals</Label>
                                        <div className="text-sm text-muted-foreground mb-4">Search and add specific users</div>
                                        {audienceType === "individuals" && (
                                            <div className="space-y-4 mt-4">
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            placeholder="Search name or email..."
                                                            className="pl-9"
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                {searchQuery && searchResults && searchResults.length > 0 && (
                                                    <div className="border rounded-md divide-y max-h-40 overflow-auto bg-white">
                                                        {searchResults.map((user: any) => (
                                                            <div
                                                                key={user.id}
                                                                className="p-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                                                                onClick={() => {
                                                                    if (!selectedIndividuals.find(i => i.id === user.id)) {
                                                                        setSelectedIndividuals([...selectedIndividuals, user]);
                                                                    }
                                                                    setSearchQuery("");
                                                                }}
                                                            >
                                                                <div className="text-sm">
                                                                    <div className="font-medium">{user.name}</div>
                                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                                </div>
                                                                <Button size="sm" variant="ghost">Add</Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap gap-2">
                                                    {selectedIndividuals.map((user: any) => (
                                                        <Badge key={user.id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                                                            {user.name}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-4 w-4 p-0 hover:bg-transparent"
                                                                onClick={() => setSelectedIndividuals(selectedIndividuals.filter((i: any) => i.id !== user.id))}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3 border p-4 rounded-lg cursor-pointer hover:bg-slate-50">
                                    <RadioGroupItem value="waitlist" id="waitlist" className="mt-1" />
                                    <Label htmlFor="waitlist" className="flex-1 cursor-pointer">
                                        <div className="font-semibold">All Waitlist</div>
                                        <div className="text-sm text-muted-foreground">Send to everyone on the waitlist ({audienceData?.totalWaitlist || "..."})</div>
                                    </Label>
                                </div>

                                <div className="flex items-start space-x-3 border p-4 rounded-lg cursor-pointer hover:bg-slate-50">
                                    <RadioGroupItem value="waitlist_pending" id="waitlist_pending" className="mt-1" />
                                    <Label htmlFor="waitlist_pending" className="flex-1 cursor-pointer">
                                        <div className="font-semibold">Waitlist (Pending Onboarding)</div>
                                        <div className="text-sm text-muted-foreground">Send only to waitlisters who haven't finished onboarding ({audienceData?.totalPendingWaitlist || "..."})</div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </CardContent>
                    </Card>
                );

            case "confirm":
                return (
                    <Card className="max-w-2xl mx-auto shadow-lg border-2 border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                                Final Confirmation
                            </CardTitle>
                            <CardDescription>Please review everything before firing the campaign.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject Line</div>
                                    <div className="font-medium">{subject}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Audience</div>
                                    <div className="font-medium capitalize">
                                        {audienceType === "all" ? "All Users" :
                                            audienceType === "roles" ? `Roles: ${selectedRoles.join(", ")}` :
                                                audienceType === "individuals" ? `${selectedIndividuals.length} Selected Individuals` :
                                                    audienceType === "waitlist" ? "Full Waitlist" :
                                                        "Waitlist (Pending)"}
                                    </div>
                                </div>
                                <div className="space-y-1 border-t pt-4">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recipient Count</div>
                                    <div className="text-2xl font-bold">{getEmails?.length || 0}</div>
                                </div>
                                <div className="space-y-1 border-t pt-4">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campaign ID</div>
                                    <div className="text-sm font-mono text-muted-foreground">BRD-{Math.floor(Date.now() / 1000)}</div>
                                </div>
                            </div>

                            <div className="bg-red-50 p-4 rounded-md border border-red-200">
                                <p className="text-sm text-red-800">
                                    <strong>Important:</strong> Once you click "Send Broadcast", emails will be queued for delivery. This action cannot be undone.
                                </p>
                            </div>
                        </CardContent>
                        <div className="p-6 bg-slate-50 border-t flex justify-between">
                            <Button variant="ghost" onClick={() => setStep("audience")}>Edit Audience</Button>
                            <Button size="lg" className="px-10" onClick={handleSend} disabled={isSending}>
                                <Send className="mr-2 h-4 w-4" /> Send Broadcast
                            </Button>
                        </div>
                    </Card>
                );

            case "sending":
                return (
                    <Card className="max-w-xl mx-auto py-10">
                        <CardContent className="flex flex-col items-center justify-center space-y-6">
                            <div className="relative">
                                <div className="h-24 w-24 rounded-full border-4 border-slate-100 border-t-primary animate-spin" />
                                <Mail className="absolute inset-0 m-auto h-8 w-8 text-primary" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-semibold">Sending Emails...</h3>
                                <p className="text-muted-foreground">We are delivering your message to {getEmails?.length} recipients.</p>
                            </div>
                            <Progress value={33} className="w-full" />
                            <p className="text-xs text-muted-foreground animate-pulse">Communicating with Resend API...</p>
                        </CardContent>
                    </Card>
                );

            case "result":
                return (
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-center">Broadcast Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8 py-6">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <div className="text-3xl font-bold">{sendResult?.sent}</div>
                                    <div className="text-sm text-green-600 font-medium">Delivered</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <div className="text-3xl font-bold">{sendResult?.failed}</div>
                                    <div className="text-sm text-red-600 font-medium">Failed</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <div className="text-3xl font-bold">{Math.round((sendResult?.sent || 0) / (getEmails?.length || 1) * 100)}%</div>
                                    <div className="text-sm text-muted-foreground font-medium">Success Rate</div>
                                </div>
                            </div>

                            {sendResult?.errors && sendResult.errors.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-red-700">Errors encountered:</h4>
                                    <div className="bg-red-50 p-3 rounded border border-red-100 max-h-32 overflow-auto">
                                        {sendResult.errors.map((err, i) => (
                                            <div key={i} className="text-xs text-red-800">{err}</div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-center">
                                <Button onClick={() => {
                                    setStep("upload");
                                    setHtmlContent("");
                                    setSubject("");
                                    setSendResult(null);
                                }}>
                                    Start New Campaign
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
        }
    };

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-primary/10 rounded-full">
                    <Mail className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Canva Email Broadcast</h1>
                    <p className="text-muted-foreground">Upload your Canva design and send to your users in minutes.</p>
                </div>
            </div>

            {/* Stepper indicator */}
            <div className="flex justify-center mb-10">
                <div className="flex items-center w-full max-w-2xl">
                    {(["upload", "preview", "audience", "confirm"] as Step[]).map((s, i) => (
                        <div key={s} className="flex items-center flex-1 last:flex-none">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                                ${step === s ? 'bg-primary text-white ring-4 ring-primary/20' :
                                    (["preview", "audience", "confirm"].indexOf(step) >= i ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500')}
                            `}>
                                {i + 1}
                            </div>
                            {i < 3 && (
                                <div className={`h-1 flex-1 mx-2 rounded ${(["preview", "audience", "confirm"].indexOf(step) > i ? 'bg-green-500' : 'bg-slate-200')}`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {renderStep()}
        </div>
    );
}
