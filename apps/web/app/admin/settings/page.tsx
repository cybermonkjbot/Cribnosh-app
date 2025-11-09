"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { AdminTabs, AdminTabsMobile } from '@/components/admin/admin-tabs';
import { AdminPageSkeleton } from '@/components/admin/skeletons';
import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useMutation, useQuery } from 'convex/react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Database,
  FileText,
  Globe,
  Mail,
  RefreshCw,
  Save,
  Server,
  Settings,
  Shield,
  Upload,
  User,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface SystemSetting {
  key: string;
  value: string | number | boolean | string[];
  modifiedBy: string;
  min?: number;
  max?: number;
  type?: string;
  options?: { value: string; label: string; }[];
}

export default function AdminSettings() {
  const { user: adminUser, loading: adminLoading } = useAdminUser();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState('general');
  
  const systemSettings = useQuery(api.queries.admin.getSystemSettings);
  const updateSystemSetting = useMutation(api.mutations.admin.createSystemSetting);
  const logActivity = useMutation(api.mutations.admin.logActivity);

  // Default settings configuration - can be moved to a config file
  const defaultSettings = {
    // Email & Notifications
    emailNotifications: true,
    emailDigest: false,
    
    // Security & Access
    securityLevel: 'standard',
    sessionTimeout: 7200,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireTwoFactor: false,
    sslRequired: true,
    
    // Performance & Caching
    cacheEnabled: true,
    compressionEnabled: true,
    analyticsEnabled: true,
    apiRateLimit: 100,
    
    // System & Maintenance
    maintenanceMode: false,
    debugMode: false,
    autoBackup: true,
    backupFrequency: 'daily',
    maxUploadSize: 10,
    
    // User Management
    allowRegistration: true,
    requireEmailVerification: true,
    defaultUserRole: 'user',
    
    // Content & Media
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
    maxFileSize: 5,
    imageCompression: true,
    
    // API & Integrations
    enableApiAccess: true,
    apiVersion: 'v1',
    webhookRetries: 3,
  };

  const [settings, setSettings] = useState(defaultSettings);

  // Update local state when settings load
  useEffect(() => {
    if (systemSettings) {
      setSettings(prev => ({
        ...defaultSettings,
        ...systemSettings,
      }));
    }
  }, [systemSettings]);

  const handleSettingChange = (key: string, value: string | number | boolean | string[]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setSaveStatus('saving');
    
    try {
      // Validate admin user
      if (!adminUser?._id) {
        throw new Error('Admin user not authenticated. Please log in again.');
      }

      // Validate settings data
      if (!settings || Object.keys(settings).length === 0) {
        throw new Error('No settings to save');
      }

      // Save each setting with individual error handling
      const saveResults = [];
      for (const [key, value] of Object.entries(settings)) {
        try {
          await updateSystemSetting({
            key,
            value,
            modifiedBy: adminUser._id,
          });
          saveResults.push({ key, success: true });
        } catch (settingError) {
          saveResults.push({ key, success: false, error: settingError });
        }
      }

      // Check if any settings failed to save
      const failedSettings = saveResults.filter(result => !result.success);
      if (failedSettings.length > 0) {
        const failedKeys = failedSettings.map(result => result.key).join(', ');
        throw new Error(`Failed to save some settings: ${failedKeys}. Please try again.`);
      }

      // Log the activity
      try {
        await logActivity({
          type: 'system_settings_updated',
          description: 'System settings updated',
          metadata: {
            entityType: 'system_settings',
            details: { 
              updatedSettings: Object.keys(settings),
              adminUser: adminUser._id,
              timestamp: Date.now()
            },
          },
        });
      } catch (logError) {
        // Don't fail the entire operation if logging fails
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      // Show error message to user
      setTimeout(() => {
        setSaveStatus('idle');
        // You could add a toast notification here
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSettingInput = (setting: { key: string; type: string; options?: Array<{ value: string; label: string }> }) => {
    const value = settings[setting.key as keyof typeof settings];
    
    switch (setting.type) {
      case 'boolean':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleSettingChange(setting.key, e.target.checked)}
              className="w-5 h-5 text-[#F23E2E] bg-gray-100 border-gray-300 rounded focus:ring-[#F23E2E]/20 focus:ring-2"
            />
            <span className="text-sm font-medium text-gray-700 font-satoshi">
              {value ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        );
      
      case 'select':
        return (
          <select
            value={typeof value === 'boolean' ? value.toString() : (value || '')}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F23E2E]/20 focus:border-[#F23E2E] font-satoshi"
          >
            {setting.options?.map((option: { value: string; label: string }) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={typeof value === 'number' || typeof value === 'string' ? value : ''}
            onChange={(e) => handleSettingChange(setting.key, parseInt(e.target.value) || 0)}
            min={0}
            max={100}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F23E2E]/20 focus:border-[#F23E2E] font-satoshi"
          />
        );
      
      default:
        return null;
    }
  };

  const tabs = [
    {
      id: 'general',
      label: 'General',
      icon: Settings,
      description: 'Basic system settings'
    },
    {
      id: 'email',
      label: 'Email & Notifications',
      icon: Mail,
      description: 'Email configuration and notifications'
    },
    {
      id: 'security',
      label: 'Security & Access',
      icon: Shield,
      description: 'Security settings and access control'
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: Zap,
      description: 'Caching and performance optimization'
    },
    {
      id: 'users',
      label: 'User Management',
      icon: User,
      description: 'User registration and management'
    },
    {
      id: 'content',
      label: 'Content & Media',
      icon: FileText,
      description: 'File uploads and content settings'
    },
    {
      id: 'api',
      label: 'API & Integrations',
      icon: Globe,
      description: 'API settings and external integrations'
    },
    {
      id: 'maintenance',
      label: 'System & Maintenance',
      icon: Server,
      description: 'System maintenance and monitoring'
    }
  ];

  const settingGroups = {
    general: [
      {
        title: 'System Information',
        icon: Server,
        settings: [
          {
            key: 'maintenanceMode',
            label: 'Maintenance Mode',
            description: 'Put the system in maintenance mode',
            type: 'boolean',
          },
          {
            key: 'debugMode',
            label: 'Debug Mode',
            description: 'Enable debug logging and features',
            type: 'boolean',
          },
        ],
      },
    ],
    email: [
      {
        title: 'Email Configuration',
        icon: Mail,
        settings: [
          {
            key: 'emailNotifications',
            label: 'Email Notifications',
            description: 'Enable email notifications for system events',
            type: 'boolean',
          },
          {
            key: 'emailDigest',
            label: 'Email Digest',
            description: 'Send daily digest emails instead of individual notifications',
            type: 'boolean',
          },
        ],
      },
    ],
    security: [
      {
        title: 'Security Settings',
        icon: Shield,
        settings: [
          {
            key: 'securityLevel',
            label: 'Security Level',
            description: 'Set the security level for the application',
            type: 'select',
            options: [
              { value: 'low', label: 'Low' },
              { value: 'standard', label: 'Standard' },
              { value: 'high', label: 'High' },
              { value: 'maximum', label: 'Maximum' },
            ],
          },
          {
            key: 'sessionTimeout',
            label: 'Session Timeout (seconds)',
            description: 'How long before a user session expires',
            type: 'number',
            min: 300,
            max: 86400,
          },
          {
            key: 'maxLoginAttempts',
            label: 'Max Login Attempts',
            description: 'Maximum failed login attempts before account lockout',
            type: 'number',
            min: 3,
            max: 10,
          },
          {
            key: 'passwordMinLength',
            label: 'Minimum Password Length',
            description: 'Minimum required password length',
            type: 'number',
            min: 6,
            max: 20,
          },
          {
            key: 'requireTwoFactor',
            label: 'Require Two-Factor Authentication',
            description: 'Force all users to enable 2FA',
            type: 'boolean',
          },
          {
            key: 'sslRequired',
            label: 'Require SSL',
            description: 'Force all connections to use HTTPS',
            type: 'boolean',
          },
        ],
      },
    ],
    performance: [
      {
        title: 'Performance & Caching',
        icon: Zap,
        settings: [
          {
            key: 'cacheEnabled',
            label: 'Enable Caching',
            description: 'Enable application-level caching',
            type: 'boolean',
          },
          {
            key: 'compressionEnabled',
            label: 'Enable Compression',
            description: 'Enable response compression',
            type: 'boolean',
          },
          {
            key: 'analyticsEnabled',
            label: 'Enable Analytics',
            description: 'Collect usage analytics and metrics',
            type: 'boolean',
          },
          {
            key: 'apiRateLimit',
            label: 'API Rate Limit',
            description: 'Maximum API requests per minute per user',
            type: 'number',
            min: 10,
            max: 1000,
          },
        ],
      },
    ],
    users: [
      {
        title: 'User Registration',
        icon: User,
        settings: [
          {
            key: 'allowRegistration',
            label: 'Allow Registration',
            description: 'Allow new users to register accounts',
            type: 'boolean',
          },
          {
            key: 'requireEmailVerification',
            label: 'Require Email Verification',
            description: 'Require users to verify their email address',
            type: 'boolean',
          },
          {
            key: 'defaultUserRole',
            label: 'Default User Role',
            description: 'Default role assigned to new users',
            type: 'select',
            options: [
              { value: 'user', label: 'User' },
              { value: 'staff', label: 'Staff' },
              { value: 'admin', label: 'Admin' },
            ],
          },
        ],
      },
    ],
    content: [
      {
        title: 'File Upload Settings',
        icon: Upload,
        settings: [
          {
            key: 'maxUploadSize',
            label: 'Max Upload Size (MB)',
            description: 'Maximum file upload size',
            type: 'number',
            min: 1,
            max: 100,
          },
          {
            key: 'maxFileSize',
            label: 'Max File Size (MB)',
            description: 'Maximum individual file size',
            type: 'number',
            min: 1,
            max: 50,
          },
          {
            key: 'imageCompression',
            label: 'Image Compression',
            description: 'Automatically compress uploaded images',
            type: 'boolean',
          },
        ],
      },
    ],
    api: [
      {
        title: 'API Configuration',
        icon: Globe,
        settings: [
          {
            key: 'enableApiAccess',
            label: 'Enable API Access',
            description: 'Allow external API access',
            type: 'boolean',
          },
          {
            key: 'apiVersion',
            label: 'API Version',
            description: 'Current API version',
            type: 'select',
            options: [
              { value: 'v1', label: 'v1' },
              { value: 'v2', label: 'v2' },
            ],
          },
          {
            key: 'webhookRetries',
            label: 'Webhook Retries',
            description: 'Number of webhook retry attempts',
            type: 'number',
            min: 1,
            max: 10,
          },
        ],
      },
    ],
    maintenance: [
      {
        title: 'Backup & Maintenance',
        icon: Database,
        settings: [
          {
            key: 'autoBackup',
            label: 'Auto Backup',
            description: 'Automatically backup data',
            type: 'boolean',
          },
          {
            key: 'backupFrequency',
            label: 'Backup Frequency',
            description: 'How often to perform backups',
            type: 'select',
            options: [
              { value: 'hourly', label: 'Hourly' },
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ],
          },
        ],
      },
    ],
  };

  const renderTabContent = (activeTab: string) => {
    const groups = settingGroups[activeTab as keyof typeof settingGroups] || [];
    
    return (
      <div className="space-y-6">
        {groups.map((group, groupIndex) => {
          const Icon = group.icon;
          return (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
              className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/30 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-[#F23E2E]/10 rounded-lg">
                  <Icon className="w-6 h-6 text-[#F23E2E]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-asgard text-gray-900">
                    {group.title}
                  </h3>
                  <p className="text-gray-600 font-satoshi">
                    Configure {group.title.toLowerCase()} settings
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                {group.settings.map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-800 font-satoshi">
                        {setting.label}
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 font-satoshi">
                      {setting.description}
                    </p>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  if (adminLoading) {
    return <AdminPageSkeleton title="Loading Settings" description="Preparing your configuration..." />;
  }

  return (
    <div className="container mx-auto py-6 space-y-[18px]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-asgard text-gray-900">
              System Settings
            </h1>
            <p className="text-gray-600 font-satoshi mt-1">
              Configure system-wide settings and preferences
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSaveSettings}
              disabled={isLoading}
              size="lg"
              className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>

        {/* Save Status */}
        {saveStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border font-satoshi ${
              saveStatus === 'success' 
                ? 'bg-[#F23E2E]/10 border-[#F23E2E]/30 text-[#F23E2E]' 
                : saveStatus === 'error'
                ? 'bg-gray-100 border-gray-300 text-gray-800'
                : 'bg-gray-100 border-gray-300 text-gray-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {saveStatus === 'success' && <CheckCircle className="w-5 h-5" />}
              {saveStatus === 'error' && <AlertTriangle className="w-5 h-5" />}
              {saveStatus === 'saving' && <RefreshCw className="w-5 h-5 animate-spin" />}
              <span className="font-medium">
                {saveStatus === 'success' && 'Settings saved successfully!'}
                {saveStatus === 'error' && 'Error saving settings. Please try again.'}
                {saveStatus === 'saving' && 'Saving settings...'}
              </span>
            </div>
          </motion.div>
        )}

        {/* Tabbed Interface */}
        {isMobile ? (
          <AdminTabsMobile
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          >
            {renderTabContent}
          </AdminTabsMobile>
        ) : (
          <AdminTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          >
            {renderTabContent}
          </AdminTabs>
        )}

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/30 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Activity className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-asgard text-gray-900">
                System Status
              </h3>
              <p className="text-gray-600 font-satoshi">
                Current system health and performance
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-[#F23E2E]/10 rounded-lg">
              <div className="w-3 h-3 bg-[#F23E2E] rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium text-gray-800 font-satoshi">System</p>
              <p className="text-lg font-bold text-[#F23E2E] font-asgard">
                {settings.maintenanceMode ? 'Maintenance' : 'Operational'}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <div className="w-3 h-3 bg-gray-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium text-gray-800 font-satoshi">Database</p>
              <p className="text-lg font-bold text-gray-900 font-asgard">
                {settings.cacheEnabled ? 'Cached' : 'Direct'}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <div className="w-3 h-3 bg-gray-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium text-gray-800 font-satoshi">API</p>
              <p className="text-lg font-bold text-gray-900 font-asgard">
                {settings.enableApiAccess ? 'Active' : 'Disabled'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
