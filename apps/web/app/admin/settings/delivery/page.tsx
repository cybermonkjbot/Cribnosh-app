"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { api } from '@/convex/_generated/api';
import { useAction, useMutation, useQuery } from 'convex/react';
import { CheckCircle, Loader2, Map, Save, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function DeliverySettingsPage() {
    const { user } = useAdminUser();
    const [isLoading, setIsLoading] = useState(false);

    // Settings state
    const [stuartApiKey, setStuartApiKey] = useState('');
    const [stuartEnv, setStuartEnv] = useState('sandbox');
    const [autoDispatch, setAutoDispatch] = useState(false);
    const [fallbackEnabled, setFallbackEnabled] = useState(false);

    // Coverage test state
    const [testAddress, setTestAddress] = useState('');
    const [isTestingCoverage, setIsTestingCoverage] = useState(false);
    const [testResult, setTestResult] = useState<{ valid: boolean; error?: string; skipped?: boolean } | null>(null);

    // Queries, Mutations and Actions
    const rawSettings = useQuery((api as any)["mutations/deliveryAdmin"].getDeliverySettings) as any;
    const saveSettings = useMutation((api as any)["mutations/deliveryAdmin"].saveDeliverySettings);
    const validateAddressAction = useAction(api.actions.stuart.validateDeliveryAddress);

    const handleTestCoverage = async () => {
        if (!testAddress) return;
        setIsTestingCoverage(true);
        setTestResult(null);
        try {
            const result = await validateAddressAction({ address: testAddress });
            setTestResult(result);
        } catch (error) {
            console.error('Coverage test failed:', error);
            setTestResult({ valid: false, error: 'Connection to validation service failed' });
        } finally {
            setIsTestingCoverage(false);
        }
    };

    // Load settings when data is available
    useEffect(() => {
        if (rawSettings) {
            setStuartApiKey(rawSettings.stuart_api_key || '');
            setStuartEnv(rawSettings.stuart_env || 'sandbox');
            setAutoDispatch(rawSettings.auto_dispatch || false);
            setFallbackEnabled(rawSettings.fallback_enabled || false);
        }
    }, [rawSettings]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await saveSettings({
                stuart_api_key: stuartApiKey,
                stuart_env: stuartEnv,
                auto_dispatch: autoDispatch,
                fallback_enabled: fallbackEnabled,
            });
            toast.success('Delivery settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setIsLoading(false);
        }
    };

    if (rawSettings === undefined) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto py-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-asgard text-gray-900">Delivery Configuration</h1>
                <p className="text-gray-600 mt-2">Manage Stuart integration and automated dispatch settings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Stuart API Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Stuart API Integration</CardTitle>
                        <CardDescription>Configure connection to Stuart delivery service</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="api-key">API Key</Label>
                            <Input
                                id="api-key"
                                type="password"
                                placeholder="Enter Stuart API Key"
                                value={stuartApiKey}
                                onChange={(e) => setStuartApiKey(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Found in Stuart Dashboard &gt; API</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="environment">Environment</Label>
                            <Select value={stuartEnv} onValueChange={setStuartEnv}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Environment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                                    <SelectItem value="production">Production (Live)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Dispatch Logic Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Dispatch Logic</CardTitle>
                        <CardDescription>Control how orders are assigned to drivers</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label className="text-base">Auto-Dispatch</Label>
                                <div className="text-sm text-muted-foreground">
                                    Automatically assign orders to available drivers
                                </div>
                            </div>
                            <Switch
                                checked={autoDispatch}
                                onCheckedChange={setAutoDispatch}
                            />
                        </div>

                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label className="text-base text-red-600">Stuart Fallback</Label>
                                <div className="text-sm text-muted-foreground">
                                    If internal drivers are unavailable, auto-create Stuart job
                                </div>
                            </div>
                            <Switch
                                checked={fallbackEnabled}
                                onCheckedChange={setFallbackEnabled}
                            />
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm text-yellow-800">
                            <strong>Note:</strong> Enabling fallback will incur costs on your Stuart account immediately when internal drivers are busy.
                        </div>

                    </CardContent>
                </Card>
            </div>

            {/* Coverage Test Utility */}
            <Card>
                <CardHeader>
                    <CardTitle>Stuart Coverage Test</CardTitle>
                    <CardDescription>Manually verify if an address is covered by Stuart delivery</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="test-address">Full Address</Label>
                            <Input
                                id="test-address"
                                placeholder="e.g. 10 Downing St, London SW1A 2AA, UK"
                                value={testAddress}
                                onChange={(e) => setTestAddress(e.target.value)}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                onClick={handleTestCoverage}
                                disabled={isTestingCoverage || !testAddress}
                            >
                                {isTestingCoverage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Map className="w-4 h-4 mr-2" />}
                                Check Coverage
                            </Button>
                        </div>
                    </div>

                    {testResult && (
                        <div className={`p-4 rounded-md border ${testResult.valid ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            <div className="flex items-center gap-2 font-semibold">
                                {testResult.valid ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                {testResult.valid ? 'Address Covered' : 'Outside Coverage Area'}
                            </div>
                            {testResult.error && <p className="mt-1 text-sm">{testResult.error}</p>}
                            {testResult.skipped && <p className="mt-1 text-sm italic">Validation skipped because Stuart is not fully configured.</p>}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button size="lg" onClick={handleSave} disabled={isLoading} className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                </Button>
            </div>

        </div>
    );
}
