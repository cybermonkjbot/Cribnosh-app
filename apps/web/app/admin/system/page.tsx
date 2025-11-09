"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import React, { useEffect, useState } from 'react';

import { api } from '@/convex/_generated/api';

import { useMutation, useQuery } from 'convex/react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Mail,
  RefreshCw,
  Save,
  Server,
  Shield,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';

interface SystemSetting {
  key: string;
  value: string | number | boolean | string[];
  lastModified: number;
  modifiedBy: string;
  min?: number;
  max?: number;
  type?: string;
  options?: { value: string; label: string; }[];
}

export default function AdminSystem() {
  const { user: adminUser, loading: adminLoading } = useAdminUser();
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  if (isLoading || adminLoading) return null;
  
  const systemSettings = useQuery(api.queries.admin.getSystemSettings);
  const updateSystemSetting = useMutation(api.mutations.admin.createSystemSetting);
  const logActivity = useMutation(api.mutations.admin.logActivity);

  // Default system settings configuration
  const defaultSystemSettings = {
    emailNotifications: true,
    maintenanceMode: false,
    debugMode: false,
    apiRateLimit: 100,
    maxUploadSize: 10,
    backupFrequency: 'daily',
    allowedDomains: ['*'],
    securityLevel: 'standard',
    autoBackup: true,
    emailDigest: false,
    analyticsEnabled: true,
    cacheEnabled: true,
    compressionEnabled: true,
    sslRequired: true,
    sessionTimeout: 7200,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireTwoFactor: false,
  };

  const [settings, setSettings] = useState(defaultSystemSettings);

  // Update local state when settings load
  useEffect(() => {
    if (systemSettings) {
      setSettings(prev => ({
        ...defaultSystemSettings,
        ...systemSettings,
        allowedDomains: systemSettings.allowedDomains ? [...systemSettings.allowedDomains] : defaultSystemSettings.allowedDomains,
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
      // Save each setting
      for (const [key, value] of Object.entries(settings)) {
        if (!adminUser?._id) {
          throw new Error('Admin user not authenticated');
        }
        
        await updateSystemSetting({
          key,
          value,
          modifiedBy: adminUser._id,
        });
      }

      // Log the activity
      await logActivity({
        type: 'system_settings_updated',
        description: 'System settings updated',
        metadata: {
          entityType: 'system_settings',
          details: { updatedSettings: Object.keys(settings) },
        },
      });

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const settingGroups = [
    {
      title: 'Email & Notifications',
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
    {
      title: 'Security & Access',
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
    {
      title: 'System & Maintenance',
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
        {
          key: 'maxUploadSize',
          label: 'Max Upload Size (MB)',
          description: 'Maximum file upload size',
          type: 'number',
          min: 1,
          max: 100,
        },
      ],
    },
  ];

  const renderSettingInput = (setting: { key: string; type: string; options?: Array<{ value: string; label: string }> }) => {
    const value = settings[setting.key as keyof typeof settings];
    
    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center">
            <button
              onClick={() => handleSettingChange(setting.key, !value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                value ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="ml-3 text-sm text-gray-600 font-satoshi">
              {value ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        );
      
      case 'select':
        return (
          <select
            value={typeof value === 'string' || typeof value === 'number' ? value : ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleSettingChange(setting.key, e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi"
          >
            {(setting.options || []).map((option: { value: string; label: string }) => (
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSettingChange(setting.key, parseInt(e.target.value) || 0)}
            min={0}
            max={100}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi"
          />
        );
      
      default:
        return null;
    }
  };

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
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveSettings}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-satoshi disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}
          </motion.button>
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

      {/* Settings Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settingGroups.map((group, groupIndex) => {
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
                <div className="p-3 bg-primary-100 rounded-lg">
                  <Icon className="w-6 h-6 text-primary-600" />
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
            <p className="text-lg font-bold text-[#F23E2E] font-asgard">Operational</p>
          </div>
          <div className="text-center p-4 bg-gray-100 rounded-lg">
            <div className="w-3 h-3 bg-gray-500 rounded-full mx-auto mb-2"></div>
            <p className="text-sm font-medium text-gray-800 font-satoshi">Database</p>
            <p className="text-lg font-bold text-gray-900 font-asgard">Healthy</p>
          </div>
          <div className="text-center p-4 bg-gray-100 rounded-lg">
            <div className="w-3 h-3 bg-gray-500 rounded-full mx-auto mb-2"></div>
            <p className="text-sm font-medium text-gray-800 font-satoshi">API</p>
            <p className="text-lg font-bold text-gray-900 font-asgard">Active</p>
          </div>
        </div>
      </motion.div>
    </div>
    </div>
  );
}

