'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Mail, 
  Zap, 
  Palette, 
  Truck, 
  BarChart3, 
  Shield, 
  Download, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause
} from 'lucide-react';

interface EmailConfigDashboardProps {
  className?: string;
}

export function EmailConfigDashboard({ className }: EmailConfigDashboardProps) {
  const [activeTab, setActiveTab] = useState('templates');
  const [configs, setConfigs] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load configurations
  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/email-config');
      const data = await response.json();
      setConfigs(data.configs);
    } catch (err) {
      setError('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (category: string, configId: string, config: any) => {
    try {
      const response = await fetch('/api/admin/email-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, configId, config }),
      });

      if (response.ok) {
        setSuccess('Configuration saved successfully');
        loadConfigurations();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save configuration');
      }
    } catch (err) {
      setError('Failed to save configuration');
    }
  };

  const handleExportConfig = async (category: string) => {
    try {
      const response = await fetch(`/api/admin/email-config/export?category=${category}&format=json`);
      const blob = await response.blob();
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const response = await fetch('/api/admin/email-config/import', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSuccess('Configuration imported successfully');
        loadConfigurations();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to import configuration');
      }
    } catch (err) {
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
          <Button variant="outline" onClick={() => loadConfigurations()}>
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
              <Button>
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
                      <Button size="sm" variant="outline">
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
