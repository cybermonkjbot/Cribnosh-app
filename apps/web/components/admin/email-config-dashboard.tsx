'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  CheckCircle,
  Download,
  Edit,
  Eye,
  Mail,
  Palette,
  Pause,
  Play,
  Plus,
  Settings,
  Shield,
  Truck,
  XCircle,
  Zap
} from 'lucide-react';
import { useState } from 'react';

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from 'next/navigation';

interface EmailConfigDashboardProps {
  className?: string;
}

export function EmailConfigDashboard({ className }: EmailConfigDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('templates');
  const data = useQuery(api.email_configs.getConfigs);
  const saveConfig = useMutation(api.email_configs.saveConfig);
  const importConfigs = useMutation(api.email_configs.importConfigs);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const configs = data?.configs || {};
  const loading = data === undefined;

  // No need for separate loading state or useEffect for loading

  const handleSaveConfig = async (category: string, configId: string, config: any) => {
    try {
      await saveConfig({ category, configId, config });
      setSuccess('Configuration saved successfully');
    } catch (err) {
      setError('Failed to save configuration');
    }
  };

  const handleExportConfig = (category: string) => {
    try {
      const configData = configs[category] || [];
      const jsonString = JSON.stringify(configData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email-${category}-config.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export configuration');
    }
  };

  const handleImportConfig = async (category: string, file: File) => {
    try {
      const text = await file.text();
      let importedData;
      try {
        importedData = JSON.parse(text);
      } catch (e) {
        setError('Invalid JSON file');
        return;
      }

      if (!Array.isArray(importedData)) {
        // Try to handle single object if necessary, but API expects array
        importedData = [importedData];
      }

      const result = await importConfigs({ category, configs: importedData });
      if (result.success) {
        setSuccess(`Successfully imported ${result.count} configurations`);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to import configuration');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Configuration</h1>
          <p className="text-muted-foreground">
            Manage email templates, automation, branding, and delivery settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { }}>
            <Settings className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Delivery
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Compliance
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Email Templates</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExportConfig('templates')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => router.push('/admin/email-config/template/new')}>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {configs.templates?.map((template: any) => (
              <Card key={template.templateId}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {template.name}
                  </CardTitle>
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {template.subject}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/admin/email-config/template/${template.templateId}`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Play className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Email Automation</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExportConfig('automations')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Automation
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {configs.automations?.map((automation: any) => (
              <Card key={automation.automationId}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {automation.name}
                  </CardTitle>
                  <Badge variant={automation.isActive ? 'default' : 'secondary'}>
                    {automation.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {automation.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        {automation.isActive ? (
                          <Pause className="h-4 w-4 mr-1" />
                        ) : (
                          <Play className="h-4 w-4 mr-1" />
                        )}
                        {automation.isActive ? 'Pause' : 'Start'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Email Branding</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExportConfig('branding')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Brand
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {configs.branding?.map((brand: any) => (
              <Card key={brand.brandId}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {brand.name}
                  </CardTitle>
                  <Badge variant={brand.isDefault ? 'default' : 'secondary'}>
                    {brand.isDefault ? 'Default' : 'Custom'}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-8 h-8 rounded-full border"
                        style={{ backgroundColor: brand.colors.primary }}
                      />
                      <div
                        className="w-8 h-8 rounded-full border"
                        style={{ backgroundColor: brand.colors.secondary }}
                      />
                      <div
                        className="w-8 h-8 rounded-full border"
                        style={{ backgroundColor: brand.colors.accent }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {!brand.isDefault && (
                        <Button size="sm" variant="outline">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Set Default
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Delivery Tab */}
        <TabsContent value="delivery" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Email Delivery</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExportConfig('delivery')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Provider
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {configs.delivery?.map((delivery: any) => (
              <Card key={delivery.provider}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {delivery.provider.toUpperCase()}
                  </CardTitle>
                  <Badge variant="default">
                    Active
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      From: {delivery.fromEmail}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Rate Limit: {delivery.rateLimits.requestsPerMinute}/min
                    </p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Stats
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Email Analytics</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExportConfig('analytics')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Dashboard
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {configs.analytics?.map((analytics: any) => (
              <Card key={analytics.configId}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Analytics Config
                  </CardTitle>
                  <Badge variant={analytics.trackingEnabled ? 'default' : 'secondary'}>
                    {analytics.trackingEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${analytics.openTracking ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm">Open Tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${analytics.clickTracking ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm">Click Tracking</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        View Dashboard
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Email Compliance</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExportConfig('compliance')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Policy
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {configs.compliance?.map((compliance: any) => (
              <Card key={compliance.configId}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Compliance Policy
                  </CardTitle>
                  <Badge variant="default">
                    Active
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${compliance.gdprCompliant ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm">GDPR</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${compliance.ccpaCompliant ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm">CCPA</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${compliance.canSpamCompliant ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm">CAN-SPAM</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Shield className="h-4 w-4 mr-1" />
                        Audit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EmailConfigDashboard;
