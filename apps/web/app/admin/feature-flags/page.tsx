"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

export default function FeatureFlagsPage() {
    const featureFlags = useQuery(api.featureFlags.get);
    const updateFlag = useMutation(api.featureFlags.updateFlag);
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

    const handleToggle = async (id: any, newValue: boolean, label: string) => {
        try {
            setUpdatingIds((prev) => new Set(prev).add(id));
            await updateFlag({ id, value: newValue });
            toast.success(`${label} is now ${newValue ? "enabled" : "disabled"}`);
        } catch (error) {
            toast.error("Failed to update feature flag");
            console.error(error);
        } finally {
            setUpdatingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    if (featureFlags === undefined) {
        return <FeatureFlagsSkeleton />;
    }

    // Group flags by their 'group' property
    const groupedFlags = featureFlags.reduce((acc, flag) => {
        const group = flag.group || "other";
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(flag);
        return acc;
    }, {} as Record<string, typeof featureFlags>);

    return (
        <div className="container py-10 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Feature Flags</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage visibility of sections on Home Screen and Mobile App.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="web_home" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="web_home">Web Home</TabsTrigger>
                    <TabsTrigger value="mobile_home">Mobile Home</TabsTrigger>
                    <TabsTrigger value="system">System</TabsTrigger>
                </TabsList>

                {Object.entries(groupedFlags).map(([group, flags]) => (
                    <TabsContent key={group} value={group} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {flags.map((flag) => (
                                <Card key={flag._id} className={!flag.value ? "opacity-75 bg-muted/20" : ""}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {flag.label}
                                        </CardTitle>
                                        <Switch
                                            checked={flag.value}
                                            onCheckedChange={(val) => handleToggle(flag._id, val, flag.label)}
                                            disabled={updatingIds.has(flag._id)}
                                        />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xs text-muted-foreground mb-4">
                                            {flag.description}
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <Badge variant={flag.value ? "default" : "secondary"}>
                                                {flag.value ? "Enabled" : "Disabled"}
                                            </Badge>
                                            <span className="text-muted-foreground font-mono text-[10px]">
                                                {flag.key}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                ))}
                {/* Handle groups that might not be in the tabs explicitly if needed, 
            or just rely on the dynamic listing if strictly following group names */}
            </Tabs>
        </div>
    );
}

function FeatureFlagsSkeleton() {
    return (
        <div className="container py-10 space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-10 w-[250px]" />
                <Skeleton className="h-4 w-[400px]" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-6 w-10" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-full mt-2" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
