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
  Save, 
  Eye, 
  Send, 
  Settings, 
  Palette, 
  Clock, 
  Target, 
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2
} from 'lucide-react';

interface EmailTemplateEditorProps {
  templateId?: string;
  onSave?: (config: any) => void;
  onCancel?: () => void;
  className?: string;
}

export function EmailTemplateEditor({ 
  templateId, 
  onSave, 
  onCancel, 
  className 
}: EmailTemplateEditorProps) {
  const [config, setConfig] = useState({
    templateId: templateId || '',
    name: '',
    isActive: true,
    subject: '',
    previewText: '',
    senderName: 'CribNosh',
    senderEmail: 'noreply@cribnosh.com',
    replyToEmail: 'support@cribnosh.com',
    customFields: {} as Record<string, any>,
    styling: {
      primaryColor: 'var(--color-bg-accent)',
      secondaryColor: '#1A1A1A',
      accent: '#FFD700',
      fontFamily: 'Satoshi',
      logoUrl: 'https://cribnosh.com/logo.svg',
      footerText: 'CribNosh – Personalized Dining, Every Time.',
    },
    scheduling: {
      timezone: 'UTC',
      sendTime: '09:00',
      frequency: 'immediate' as const,
    },
    targeting: {
      audience: 'all' as const,
      segmentId: '',
      customFilters: [],
      excludeFilters: [],
    },
    testing: {
      testEmails: [] as string[],
      testData: {} as Record<string, any>,
      previewMode: false,
    },
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validation, setValidation] = useState<any>(null);

  // Load template configuration
  useEffect(() => {
    if (templateId) {
      loadTemplateConfig();
    }
  }, [templateId]);

  const loadTemplateConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/email-config?category=templates&id=${templateId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.config) {
        setConfig(data.config);
      } else {
        setError('Template configuration not found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load template configuration';
      setError(errorMessage);
      console.error('Error loading template config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate configuration
      const validationResponse = await fetch('/api/admin/email-config/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'templates', config }),
      });

      if (!validationResponse.ok) {
        const errorData = await validationResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Validation request failed: ${validationResponse.status}`);
      }

      const validationData = await validationResponse.json();
      setValidation(validationData);

      if (!validationData.valid) {
        const errors = Array.isArray(validationData.errors) 
          ? validationData.errors.join(', ') 
          : 'Validation failed';
        setError(`Validation failed: ${errors}`);
        return;
      }

      // Save configuration
      const response = await fetch('/api/admin/email-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          category: 'templates', 
          configId: config.templateId, 
          config 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save: ${response.status} ${response.statusText}`);
      }

      setSuccess('Template configuration saved successfully');
      if (onSave) onSave(config);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save configuration';
      setError(errorMessage);
      console.error('Error saving template config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!config.testing.testEmails || config.testing.testEmails.length === 0) {
        setError('Please add at least one test email address');
        return;
      }

      // Send test email via API
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: config.testing.testEmails[0],
          subject: config.subject || 'Test Email',
          html: config.previewText || config.subject || 'Test email content',
          from: config.senderEmail || 'noreply@cribnosh.com',
          replyTo: config.replyToEmail,
          tags: [
            { name: 'template_id', value: config.templateId },
            { name: 'test_email', value: 'true' }
          ]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to send test email: ${response.status}`);
      }

      setSuccess(`Test email sent successfully to ${config.testing.testEmails[0]}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send test email';
      setError(errorMessage);
      console.error('Error sending test email:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    // Implement template preview
    window.open(`/admin/email-preview/${config.templateId}`, '_blank');
  };

  const addCustomField = () => {
    const newKey = `field_${Date.now()}`;
    setConfig(prev => ({
      ...prev,
      customFields: { ...prev.customFields, [newKey]: '' }
    }));
  };

  const updateCustomField = (key: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      customFields: { ...prev.customFields, [key]: value }
    }));
  };

  const removeCustomField = (key: string) => {
    const newFields = { ...config.customFields };
    delete newFields[key];
    setConfig(prev => ({
      ...prev,
      customFields: newFields
    }));
  };

  const addTestEmail = () => {
    const email = prompt('Enter test email address:');
    if (email && email.includes('@')) {
      setConfig(prev => ({
        ...prev,
        testing: {
          ...prev.testing,
          testEmails: [...prev.testing.testEmails, email]
        }
      }));
    }
  };

  const removeTestEmail = (email: string) => {
    setConfig(prev => ({
      ...prev,
      testing: {
        ...prev.testing,
        testEmails: prev.testing.testEmails.filter(e => e !== email)
      }
    }));
  };

  if (loading && templateId) {
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
          <h1 className="text-3xl font-bold">
            {templateId ? 'Edit Template' : 'Create Template'}
          </h1>
          <p className="text-muted-foreground">
            Configure email template settings and behavior
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={handleTest}>
            <Send className="h-4 w-4 mr-2" />
            Test
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
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
      {validation && !validation.valid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Validation failed: {validation.errors.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="styling">Styling</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="targeting">Targeting</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Basic Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Configure the basic template settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="templateId">Template ID</Label>
                  <Input
                    id="templateId"
                    value={config.templateId}
                    onChange={(e) => setConfig(prev => ({ ...prev, templateId: e.target.value }))}
                    placeholder="e.g., welcome-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Welcome Email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={config.subject}
                  onChange={(e) => setConfig(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g., Welcome to CribNosh!"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previewText">Preview Text</Label>
                <Input
                  id="previewText"
                  value={config.previewText}
                  onChange={(e) => setConfig(prev => ({ ...prev, previewText: e.target.value }))}
                  placeholder="e.g., Your personalized dining experience starts here"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="senderName">Sender Name</Label>
                  <Input
                    id="senderName"
                    value={config.senderName}
                    onChange={(e) => setConfig(prev => ({ ...prev, senderName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderEmail">Sender Email</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    value={config.senderEmail}
                    onChange={(e) => setConfig(prev => ({ ...prev, senderEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="replyToEmail">Reply-To Email</Label>
                  <Input
                    id="replyToEmail"
                    type="email"
                    value={config.replyToEmail}
                    onChange={(e) => setConfig(prev => ({ ...prev, replyToEmail: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={config.isActive}
                  onChange={(e) => setConfig(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive">Template is active</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Styling Tab */}
        <TabsContent value="styling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Styling Configuration</CardTitle>
              <CardDescription>
                Customize the visual appearance of the email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={config.styling.primaryColor}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        styling: { ...prev.styling, primaryColor: e.target.value }
                      }))}
                    />
                    <Input
                      value={config.styling.primaryColor}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        styling: { ...prev.styling, primaryColor: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={config.styling.secondaryColor}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        styling: { ...prev.styling, secondaryColor: e.target.value }
                      }))}
                    />
                    <Input
                      value={config.styling.secondaryColor}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        styling: { ...prev.styling, secondaryColor: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accent">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent"
                      type="color"
                      value={config.styling.accent}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        styling: { ...prev.styling, accent: e.target.value }
                      }))}
                    />
                    <Input
                      value={config.styling.accent}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        styling: { ...prev.styling, accent: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <Select
                    value={config.styling.fontFamily}
                    onValueChange={(value) => setConfig(prev => ({ 
                      ...prev, 
                      styling: { ...prev.styling, fontFamily: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Satoshi">Satoshi</SelectItem>
                      <SelectItem value="Asgard">Asgard</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={config.styling.logoUrl}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      styling: { ...prev.styling, logoUrl: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerText">Footer Text</Label>
                <textarea
                  id="footerText"
                  value={config.styling.footerText}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    styling: { ...prev.styling, footerText: e.target.value }
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduling Tab */}
        <TabsContent value="scheduling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduling Configuration</CardTitle>
              <CardDescription>
                Configure when and how often emails are sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={config.scheduling.frequency}
                    onValueChange={(value) => setConfig(prev => ({ 
                      ...prev, 
                      scheduling: { ...prev.scheduling, frequency: value as any }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="recurring">Recurring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={config.scheduling.timezone}
                    onValueChange={(value) => setConfig(prev => ({ 
                      ...prev, 
                      scheduling: { ...prev.scheduling, timezone: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {config.scheduling.frequency !== 'immediate' && (
                <div className="space-y-2">
                  <Label htmlFor="sendTime">Send Time</Label>
                  <Input
                    id="sendTime"
                    type="time"
                    value={config.scheduling.sendTime}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      scheduling: { ...prev.scheduling, sendTime: e.target.value }
                    }))}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Targeting Tab */}
        <TabsContent value="targeting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Targeting Configuration</CardTitle>
              <CardDescription>
                Define who receives this email template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Select
                  value={config.targeting.audience}
                  onValueChange={(value) => setConfig(prev => ({ 
                    ...prev, 
                    targeting: { ...prev.targeting, audience: value as any }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="segment">Specific Segment</SelectItem>
                    <SelectItem value="custom">Custom Filters</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(config.targeting.audience as string) === 'segment' && (
                <div className="space-y-2">
                  <Label htmlFor="segmentId">Segment ID</Label>
                  <Input
                    id="segmentId"
                    value={config.targeting.segmentId}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      targeting: { ...prev.targeting, segmentId: e.target.value }
                    }))}
                    placeholder="e.g., premium-users"
                  />
                </div>
              )}

              {(config.targeting.audience as string) === 'custom' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Custom Filters</Label>
                    <Button size="sm" onClick={() => {/* Add filter logic */}}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Filter
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Custom targeting filters will be implemented here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testing Configuration</CardTitle>
              <CardDescription>
                Configure test emails and preview settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Test Emails</Label>
                  <Button size="sm" onClick={addTestEmail}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Email
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {config.testing.testEmails.map((email, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={email} readOnly />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeTestEmail(email)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="previewMode"
                  checked={config.testing.previewMode}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    testing: { ...prev.testing, previewMode: e.target.checked }
                  }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="previewMode">Enable preview mode</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Configuration</CardTitle>
              <CardDescription>
                Custom fields and advanced template settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Custom Fields</Label>
                  <Button size="sm" onClick={addCustomField}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Field
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {Object.entries(config.customFields).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Input
                        placeholder="Field key"
                        value={key}
                        onChange={(e) => {
                          const newFields = { ...config.customFields };
                          delete newFields[key];
                          newFields[e.target.value] = value;
                          setConfig(prev => ({ ...prev, customFields: newFields }));
                        }}
                      />
                      <Input
                        placeholder="Field value"
                        value={String(value)}
                        onChange={(e) => updateCustomField(key, e.target.value)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeCustomField(key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EmailTemplateEditor;
