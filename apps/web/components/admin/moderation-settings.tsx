"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, Save, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

interface ModerationSettingsProps {
    sessionToken?: string;
}

export function ModerationSettings({ sessionToken }: ModerationSettingsProps) {
    const { toast } = useToast();
    const settings = useQuery(api.moderation.getModerationSettings, { sessionToken });
    const updateSettings = useMutation(api.moderation.updateModerationSettings);

    const [keywords, setKeywords] = useState("");
    const [threshold, setThreshold] = useState(3);
    const [autoSuspend, setAutoSuspend] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (settings) {
            setKeywords(settings.prohibitedKeywords.join(", "));
            setThreshold(settings.violationThreshold);
            setAutoSuspend(settings.autoSuspendEnabled);
        }
    }, [settings]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSettings({
                sessionToken,
                config: {
                    prohibitedKeywords: keywords.split(",").map(k => k.trim()).filter(k => k !== ""),
                    violationThreshold: Number(threshold),
                    autoSuspendEnabled: autoSuspend,
                }
            });
            toast({
                title: "Settings Saved",
                description: "Moderation configuration updated successfully",
                variant: "success",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update settings",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (!settings) return null;

    return (
        <div className="space-y-6">
            <Card className="p-6 border-none shadow-sm bg-white/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                    <ShieldCheck className="w-6 h-6 text-primary-600" />
                    <div>
                        <h2 className="text-xl font-bold font-asgard text-gray-900">Automation Controls</h2>
                        <p className="text-sm text-gray-600 font-satoshi">Configure how the system automatically flags and handles violations.</p>
                    </div>
                </div>

                <div className="grid gap-8">
                    {/* Keywords Section */}
                    <div className="space-y-3">
                        <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Prohibited Keywords</Label>
                        <Textarea
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            placeholder="scam, fraud, illegal, violence..."
                            className="min-h-[120px] bg-white/80"
                        />
                        <p className="text-xs text-gray-500 italic">Separate keywords with commas. Content containing these words will be automatically flagged for review.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-8">
                        {/* Threshold Section */}
                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Violation Threshold</Label>
                            <Input
                                type="number"
                                value={threshold}
                                onChange={(e) => setThreshold(Number(e.target.value))}
                                className="bg-white/80"
                            />
                            <p className="text-xs text-gray-500 italic">Number of resolved violations before a creator is automatically flagged or suspended.</p>
                        </div>

                        {/* Auto-Suspend Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Auto-Suspension</Label>
                                <Switch
                                    checked={autoSuspend}
                                    onCheckedChange={setAutoSuspend}
                                />
                            </div>
                            <p className="text-xs text-gray-500 italic">If enabled, creators will be automatically suspended instead of just flagged when reaching the threshold.</p>
                            {autoSuspend && (
                                <div className="bg-red-50 p-3 rounded-lg flex items-start gap-2 border border-red-100">
                                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                                    <p className="text-xs text-red-800 font-medium">Warning: Automatic suspension prevents creators from logging in immediately.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-primary-600 hover:bg-primary-700 text-white min-w-[140px]"
                        >
                            {isSaving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Settings</>}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
