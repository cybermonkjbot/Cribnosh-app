"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from 'convex/react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Database,
  Download,
  Eye,
  FileText,
  Globe,
  Lock,
  Settings,
  Shield,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  status: 'compliant' | 'pending' | 'non-compliant';
  lastUpdated: string;
  category: 'gdpr' | 'security' | 'data-protection' | 'privacy';
}

function GDPRSettingsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const updateGDPR = useMutation(api.mutations.compliance.updateGDPRCompliance);
  const [loading, setLoading] = useState(false);
  const { user } = useAdminUser();

  const [formData, setFormData] = useState({
    lawfulBasis: 'consent',
    dataMinimization: true,
    purposeLimitation: true,
    storageLimitation: true,
    accuracy: true,
    security: true,
    accountability: true,
    rightToAccess: true,
    rightToRectification: true,
    rightToErasure: true,
    userDataRetention: '3 years',
    transactionDataRetention: '7 years'
  });

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateGDPR({
        dataProcessing: {
          lawfulBasis: formData.lawfulBasis,
          dataMinimization: formData.dataMinimization,
          purposeLimitation: formData.purposeLimitation,
          storageLimitation: formData.storageLimitation,
          accuracy: formData.accuracy,
          security: formData.security,
          accountability: formData.accountability,
        },
        userRights: {
          rightToAccess: formData.rightToAccess,
          rightToRectification: formData.rightToRectification,
          rightToErasure: formData.rightToErasure,
          rightToRestrictProcessing: true, // Defaulting for now
          rightToDataPortability: true, // Defaulting for now
          rightToObject: true, // Defaulting for now
          rightsRelatedToAutomatedDecisionMaking: true, // Defaulting for now
        },
        dataRetention: {
          userData: formData.userDataRetention,
          transactionData: formData.transactionDataRetention,
          marketingData: '2 years', // Default
          analyticsData: '1 year', // Default
        },
        modifiedBy: user._id as any,
      });
      toast({ title: "GDPR Settings Updated", description: "Changes have been saved successfully.", variant: "success" });
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update GDPR settings.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>GDPR Compliance Settings</DialogTitle>
          <DialogDescription>Manage data processing principles and user rights.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <h3 className="font-medium">Data Processing Principles</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="min" checked={formData.dataMinimization} onCheckedChange={(c) => setFormData({ ...formData, dataMinimization: !!c })} />
                <Label htmlFor="min">Data Minimization</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="pur" checked={formData.purposeLimitation} onCheckedChange={(c) => setFormData({ ...formData, purposeLimitation: !!c })} />
                <Label htmlFor="pur">Purpose Limitation</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="stor" checked={formData.storageLimitation} onCheckedChange={(c) => setFormData({ ...formData, storageLimitation: !!c })} />
                <Label htmlFor="stor">Storage Limitation</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="acc" checked={formData.accuracy} onCheckedChange={(c) => setFormData({ ...formData, accuracy: !!c })} />
                <Label htmlFor="acc">Accuracy</Label>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-medium">Data Retention</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>User Data</Label>
                <Input value={formData.userDataRetention} onChange={(e) => setFormData({ ...formData, userDataRetention: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Transaction Data</Label>
                <Input value={formData.transactionDataRetention} onChange={(e) => setFormData({ ...formData, transactionDataRetention: e.target.value })} />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#F23E2E] text-white hover:bg-[#F23E2E]/90">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SecuritySettingsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const updateSecurity = useMutation(api.mutations.compliance.updateSecurityCompliance);
  const [loading, setLoading] = useState(false);
  const { user } = useAdminUser();

  const [formData, setFormData] = useState({
    mfaEnabled: true,
    passwordPolicy: 'strong',
    sessionTimeout: '30m',
    roleBasedAccess: true,
    encryptionAtRest: true,
    encryptionInTransit: true,
    keyManagement: 'aws-kms'
  });

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateSecurity({
        accessControls: {
          mfaEnabled: formData.mfaEnabled,
          passwordPolicy: formData.passwordPolicy,
          sessionTimeout: formData.sessionTimeout,
          roleBasedAccess: formData.roleBasedAccess,
        },
        dataEncryption: {
          atRest: formData.encryptionAtRest,
          inTransit: formData.encryptionInTransit,
          keyManagement: formData.keyManagement,
        },
        modifiedBy: user._id as any,
      });
      toast({ title: "Security Settings Updated", description: "Changes have been saved successfully.", variant: "success" });
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update security settings.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Security Compliance Settings</DialogTitle>
          <DialogDescription>Configure access controls and encryption standards.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <h3 className="font-medium">Access Controls</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="mfa" checked={formData.mfaEnabled} onCheckedChange={(c) => setFormData({ ...formData, mfaEnabled: !!c })} />
                <Label htmlFor="mfa">Enforce MFA</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="rbac" checked={formData.roleBasedAccess} onCheckedChange={(c) => setFormData({ ...formData, roleBasedAccess: !!c })} />
                <Label htmlFor="rbac">Role-Based Access Control</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Session Timeout</Label>
              <Select value={formData.sessionTimeout} onValueChange={(v) => setFormData({ ...formData, sessionTimeout: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15m">15 Minutes</SelectItem>
                  <SelectItem value="30m">30 Minutes</SelectItem>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="4h">4 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-medium">Encryption</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="enc-rest" checked={formData.encryptionAtRest} onCheckedChange={(c) => setFormData({ ...formData, encryptionAtRest: !!c })} />
                <Label htmlFor="enc-rest">Encryption At Rest</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="enc-transit" checked={formData.encryptionInTransit} onCheckedChange={(c) => setFormData({ ...formData, encryptionInTransit: !!c })} />
                <Label htmlFor="enc-transit">Encryption In Transit</Label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#F23E2E] text-white hover:bg-[#F23E2E]/90">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReportIncidentModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const reportIncident = useMutation(api.mutations.compliance.reportSecurityIncident);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'data_breach',
    severity: 'medium',
    description: '',
    affectedUsers: '0'
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await reportIncident({
        incidentType: formData.type,
        severity: formData.severity as any,
        description: formData.description,
        affectedUsers: parseInt(formData.affectedUsers) || 0,
        details: {},
      });
      toast({ title: "Incident Reported", description: "The security incident has been logged.", variant: "success" });
      onOpenChange(false);
      setFormData({ type: 'data_breach', severity: 'medium', description: '', affectedUsers: '0' });
    } catch (error) {
      toast({ title: "Error", description: "Failed to report incident.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Security Incident</DialogTitle>
          <DialogDescription>Log a new security incident or potential breach.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Incident Type</Label>
            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="data_breach">Data Breach</SelectItem>
                <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
                <SelectItem value="phishing">Phishing Attempt</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Severity</Label>
            <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Affected Users (Estimate)</Label>
            <Input type="number" value={formData.affectedUsers} onChange={(e) => setFormData({ ...formData, affectedUsers: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what happened..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#F23E2E] text-white hover:bg-[#F23E2E]/90">Submit Report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminCompliancePage() {
  const { sessionToken } = useAdminUser();

  const [activeTab, setActiveTab] = useState<'overview' | 'gdpr' | 'security' | 'audit'>('overview');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showGDPRModal, setShowGDPRModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  // Get compliance items from Convex
  const complianceItems = useQuery(
    api.queries.admin.getAdminStats,
    sessionToken ? { sessionToken } : "skip"
  ) as ComplianceItem[] | undefined;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-200 text-green-800';
      case 'pending': return 'bg-yellow-200 text-yellow-800';
      case 'non-compliant': return 'bg-red-200 text-red-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return CheckCircle;
      case 'pending': return Clock;
      case 'non-compliant': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  const filteredItems = activeTab === 'overview'
    ? (complianceItems || [])
    : (complianceItems || []).filter(item => item.category === activeTab);

  const complianceStats = {
    total: complianceItems?.length || 0,
    compliant: (complianceItems || []).filter(item => item.status === 'compliant').length,
    pending: (complianceItems || []).filter(item => item.status === 'pending').length,
    nonCompliant: (complianceItems || []).filter(item => item.status === 'non-compliant').length,
  };

  const handleExportCompliance = () => {
    setShowExportModal(true);
  };


  return (
    <div className="container mx-auto py-6 space-y-[18px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">
            Compliance Management
          </h1>
          <p className="text-gray-600 font-satoshi mt-1">
            Manage GDPR, security, and data protection compliance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowIncidentModal(true)}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-satoshi"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Report Incident
          </Button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportCompliance}
            className="flex items-center gap-2 px-4 py-2 bg-[#F23E2E] text-white rounded-lg hover:bg-[#F23E2E]/90 transition-colors font-satoshi"
          >
            <Download className="w-4 h-4" />
            Export Report
          </motion.button>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/30 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-satoshi">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 font-asgard">{complianceStats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/30 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-satoshi">Compliant</p>
              <p className="text-2xl font-bold text-green-600 font-asgard">{complianceStats.compliant}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/30 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-satoshi">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 font-asgard">{complianceStats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/30 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-satoshi">Non-Compliant</p>
              <p className="text-2xl font-bold text-red-600 font-asgard">{complianceStats.nonCompliant}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/30 p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors font-satoshi ${activeTab === 'overview'
            ? 'bg-primary-500 text-white'
            : 'text-gray-600 hover:text-gray-800'
            }`}
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Overview
          </div>
        </button>
        <button
          onClick={() => setActiveTab('gdpr')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors font-satoshi ${activeTab === 'gdpr'
            ? 'bg-primary-500 text-white'
            : 'text-gray-600 hover:text-gray-800'
            }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            GDPR
          </div>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors font-satoshi ${activeTab === 'security'
            ? 'bg-primary-500 text-white'
            : 'text-gray-600 hover:text-gray-800'
            }`}
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Security
          </div>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors font-satoshi ${activeTab === 'audit'
            ? 'bg-primary-500 text-white'
            : 'text-gray-600 hover:text-gray-800'
            }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Audit
          </div>
        </button>
      </div>

      {/* Actions Bar for Specific Tabs */}
      {activeTab === 'gdpr' && (
        <div className="flex justify-end">
          <Button onClick={() => setShowGDPRModal(true)} className="bg-primary-600 hover:bg-primary-700 text-white font-satoshi">
            <Settings className="w-4 h-4 mr-2" />
            Manage GDPR Settings
          </Button>
        </div>
      )}
      {activeTab === 'security' && (
        <div className="flex justify-end">
          <Button onClick={() => setShowSecurityModal(true)} className="bg-primary-600 hover:bg-primary-700 text-white font-satoshi">
            <Settings className="w-4 h-4 mr-2" />
            Manage Security Settings
          </Button>
        </div>
      )}

      {/* Compliance Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item, index) => {
          const StatusIcon = getStatusIcon(item.status);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/30 p-6 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <StatusIcon className="w-4 h-4 text-gray-600" />
                  <span className={`px-2 py-1 text-xs font-medium rounded-full font-satoshi ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <button
                  className="p-1 text-gray-600 hover:text-primary-600 transition-colors"
                  aria-label="View details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2 font-asgard">{item.title}</h3>
              <p className="text-sm text-gray-600 mb-4 font-satoshi line-clamp-2">
                {item.description}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-700 font-satoshi">
                <span>Updated {item.lastUpdated}</span>
                <span className="capitalize">{item.category}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Data Protection Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/30 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <Database className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-asgard text-gray-900">
              Data Protection Summary
            </h2>
            <p className="text-gray-600 font-satoshi">
              Overview of Data Protection Measures and Compliance Status
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-lg font-bold text-green-600 font-asgard">Data Encryption</p>
            <p className="text-sm text-green-700 font-satoshi">AES-256 encryption enabled</p>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-lg font-bold text-blue-600 font-asgard">GDPR Compliance</p>
            <p className="text-sm text-blue-700 font-satoshi">Full compliance maintained</p>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-lg font-bold text-purple-600 font-asgard">Last Audit</p>
            <p className="text-sm text-purple-700 font-satoshi">January 15, 2025</p>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <GDPRSettingsModal open={showGDPRModal} onOpenChange={setShowGDPRModal} />
      <SecuritySettingsModal open={showSecurityModal} onOpenChange={setShowSecurityModal} />
      <ReportIncidentModal open={showIncidentModal} onOpenChange={setShowIncidentModal} />

      {/* Export Modal */}
      {showExportModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowExportModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-asgard text-gray-900">
                  Export Compliance Report
                </h2>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2 font-satoshi">
                  Report Format
                </label>
                <select className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi">
                  <option value="pdf">PDF Report</option>
                  <option value="csv">CSV Data</option>
                  <option value="json">JSON Export</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2 font-satoshi">
                  Date Range
                </label>
                <select className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi">
                  <option value="last-month">Last Month</option>
                  <option value="last-quarter">Last Quarter</option>
                  <option value="last-year">Last Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-satoshi"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle export logic here
                  setShowExportModal(false);
                }}
                className="px-6 py-2 bg-[#F23E2E] text-white rounded-lg hover:bg-[#F23E2E]/90 transition-colors font-satoshi"
              >
                Export Report
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
