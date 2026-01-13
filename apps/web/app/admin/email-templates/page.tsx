"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { RotateCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function EmailTemplatesPage() {
    const templates = useQuery(api.queries.emailConfig.list);
    const seedTemplates = useMutation(api.mutations.seedTemplates.seedEmailTemplates);

    const handleSeed = async () => {
        try {
            await seedTemplates({ force: false });
            toast.success("Templates seeded successfully");
        } catch (error) {
            toast.error("Failed to seed templates");
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
                    {/* Manual creation button if needed, but we focus on system types mostly */}
                    {/* <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Template
                    </Button> */}
                </div>
            </div>

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
                                            {formatDistanceToNow(template.updatedAt, { addSuffix: true })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/email-templates/${template._id}`}>
                                                    Edit
                                                </Link>
                                            </Button>
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
