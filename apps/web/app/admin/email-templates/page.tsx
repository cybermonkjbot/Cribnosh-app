"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { PlusCircle, RotateCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

function CreateTemplateModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const createTemplate = useMutation(api.mutations.emailTemplates.createTemplate);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        subject: "",
        description: "",
        htmlContent: "<html><body><p>New template content...</p></body></html>",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createTemplate(formData);
            toast.success("Template created successfully");
            onOpenChange(false);
            setFormData({
                name: "",
                subject: "",
                description: "",
                htmlContent: "<html><body><p>New template content...</p></body></html>",
            });
        } catch (error) {
            toast.error("Failed to create template");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create New Template</DialogTitle>
                    <DialogDescription>
                        Create a new email template. You can customize the content later.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="subject" className="text-right">Subject</Label>
                            <Input
                                id="subject"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Template"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function EmailTemplatesPage() {
    const templates = useQuery(api.queries.emailConfig.list);
    const seedTemplates = useMutation(api.mutations.seedTemplates.seedEmailTemplates);
    const deleteTemplate = useMutation(api.mutations.emailTemplates.deleteTemplate);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleSeed = async () => {
        try {
            await seedTemplates({ force: false });
            toast.success("Templates seeded successfully");
        } catch (error) {
            toast.error("Failed to seed templates");
            console.error(error);
        }
    };

    const handleDelete = async (id: any) => {
        if (!confirm("Are you sure you want to delete this template?")) return;
        try {
            await deleteTemplate({ id });
            toast.success("Template deleted successfully");
        } catch (error) {
            toast.error("Failed to delete template");
            console.error(error);
        }
    };

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Email Templates</h1>
                    <p className="text-muted-foreground">Manage and edit system email templates.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSeed}>
                        <RotateCw className="mr-2 h-4 w-4" />
                        Seed Defaults
                    </Button>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Template
                    </Button>
                </div>
            </div>

            <CreateTemplateModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />

            <Card>
                <CardHeader>
                    <CardTitle>Templates</CardTitle>
                    <CardDescription>
                        List of all available email templates.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!templates ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : templates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                        No templates found. Try seeding defaults.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                templates.map((template: Doc<"emailTemplates">) => (
                                    <TableRow key={template._id}>
                                        <TableCell className="font-medium">
                                            {template.name}
                                            {template.isSystem && (
                                                <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                                    System
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>{template.emailType || "Custom"}</TableCell>
                                        <TableCell>
                                            {formatDistanceToNow(template.updatedAt ?? Date.now(), { addSuffix: true })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/email-templates/${template._id}`}>
                                                        Edit
                                                    </Link>
                                                </Button>
                                                {!template.isSystem && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(template._id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
