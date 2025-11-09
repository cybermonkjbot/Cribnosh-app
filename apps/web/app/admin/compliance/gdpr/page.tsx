"use client";

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { api } from '@/convex/_generated/api';
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
  Lock,
  Settings,
  Shield,
  Users,
  XCircle
} from 'lucide-react';
import { useState } from 'react';

interface GDPRCompliance {
  dataProcessing: {
    lawfulBasis: string[];
    dataCategories: string[];
    processingPurposes: string[];
    dataRetention: {
      category: string;
      period: number;
      unit: 'days' | 'months' | 'years';
    }[];
  };
  userRights: {
    rightToAccess: boolean;
    rightToRectification: boolean;
    rightToErasure: boolean;
    rightToPortability: boolean;
    rightToRestrictProcessing: boolean;
    rightToObject: boolean;
  };
  dataProtection: {
    encryption: boolean;
    accessControls: boolean;
    dataMinimization: boolean;
    purposeLimitation: boolean;
    storageLimitation: boolean;
    accuracy: boolean;
  };
  consentManagement: {
    explicitConsent: boolean;
    consentWithdrawal: boolean;
    consentRecords: boolean;
    ageVerification: boolean;
    parentalConsent: boolean;
  };
  breachManagement: {
    breachDetection: boolean;
    breachNotification: boolean;
    breachRecords: boolean;
    dpoNotification: boolean;
  };
  dpo: {
    appointed: boolean;
    contactDetails: string;
    responsibilities: string[];
  };
  lastAudit: number;
  nextAudit: number;
  complianceScore: number;
  issues: {
    id: string;
    title: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'resolved';
    description: string;
    dueDate: number;
  }[];
}

export default function GDPRCompliancePage() {
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch GDPR compliance data
  const gdprData = useQuery((api as any).queries.compliance.getGDPRCompliance);
  const auditLogs = useQuery((api as any).queries.compliance.getComplianceLogs);

  // Mutations
  const updateCompliance = useMutation((api as any).mutations.compliance.updateGDPRCompliance);
  const resolveIssue = useMutation((api as any).mutations.compliance.resolveComplianceIssue);
  const generateReport = useMutation((api as any).mutations.compliance.generateComplianceReport);

  const handleUpdateCompliance = async (updates: Partial<GDPRCompliance>) => {
    setIsUpdating(true);
    try {
      await updateCompliance(updates);
      setSuccess('Compliance settings updated successfully');
      setError(null);
    } catch (err) {
      setError('Failed to update compliance settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResolveIssue = async (issueId: string) => {
    try {
      await resolveIssue({ issueId });
      setSuccess('Issue resolved successfully');
      setError(null);
    } catch (err) {
      setError('Failed to resolve issue');
    }
  };

  const handleGenerateReport = async () => {
    try {
      await generateReport({ type: 'gdpr' });
      setSuccess('Compliance report generated successfully');
      setError(null);
    } catch (err) {
      setError('Failed to generate report');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'open':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const complianceItems = [
    {
      title: 'Data Processing',
      icon: Database,
      items: [
        { label: 'Lawful Basis Defined', value: gdprData?.dataProcessing.lawfulBasis.length || 0, max: 6 },
        { label: 'Data Categories', value: gdprData?.dataProcessing.dataCategories.length || 0, max: 8 },
        { label: 'Processing Purposes', value: gdprData?.dataProcessing.processingPurposes.length || 0, max: 5 },
        { label: 'Retention Policies', value: gdprData?.dataProcessing.dataRetention.length || 0, max: 6 }
      ]
    },
    {
      title: 'User Rights',
      icon: Users,
      items: [
        { label: 'Right to Access', value: gdprData?.userRights.rightToAccess ? 1 : 0, max: 1 },
        { label: 'Right to Rectification', value: gdprData?.userRights.rightToRectification ? 1 : 0, max: 1 },
        { label: 'Right to Erasure', value: gdprData?.userRights.rightToErasure ? 1 : 0, max: 1 },
        { label: 'Right to Portability', value: gdprData?.userRights.rightToPortability ? 1 : 0, max: 1 },
        { label: 'Right to Restrict', value: gdprData?.userRights.rightToRestrictProcessing ? 1 : 0, max: 1 },
        { label: 'Right to Object', value: gdprData?.userRights.rightToObject ? 1 : 0, max: 1 }
      ]
    },
    {
      title: 'Data Protection',
      icon: Lock,
      items: [
        { label: 'Encryption', value: gdprData?.dataProtection.encryption ? 1 : 0, max: 1 },
        { label: 'Access Controls', value: gdprData?.dataProtection.accessControls ? 1 : 0, max: 1 },
        { label: 'Data Minimization', value: gdprData?.dataProtection.dataMinimization ? 1 : 0, max: 1 },
        { label: 'Purpose Limitation', value: gdprData?.dataProtection.purposeLimitation ? 1 : 0, max: 1 },
        { label: 'Storage Limitation', value: gdprData?.dataProtection.storageLimitation ? 1 : 0, max: 1 },
        { label: 'Accuracy', value: gdprData?.dataProtection.accuracy ? 1 : 0, max: 1 }
      ]
    },
    {
      title: 'Consent Management',
      icon: FileText,
      items: [
        { label: 'Explicit Consent', value: gdprData?.consentManagement.explicitConsent ? 1 : 0, max: 1 },
        { label: 'Consent Withdrawal', value: gdprData?.consentManagement.consentWithdrawal ? 1 : 0, max: 1 },
        { label: 'Consent Records', value: gdprData?.consentManagement.consentRecords ? 1 : 0, max: 1 },
        { label: 'Age Verification', value: gdprData?.consentManagement.ageVerification ? 1 : 0, max: 1 },
        { label: 'Parental Consent', value: gdprData?.consentManagement.parentalConsent ? 1 : 0, max: 1 }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">GDPR Compliance</h1>
          <p className="text-gray-600 font-satoshi mt-2">Monitor and manage GDPR compliance requirements</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateReport}
            variant="outline"
            className="border-[#F23E2E] text-[#F23E2E] hover:bg-[#F23E2E]/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <Button
            onClick={() => {/* Open settings */}}
            className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Compliance Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Overall Compliance Score</h3>
              <p className="text-sm text-gray-600">Based on current GDPR requirements</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                {gdprData?.complianceScore || 0}%
              </div>
              <div className="text-sm text-gray-600">
                {gdprData?.complianceScore && gdprData.complianceScore >= 80 ? 'Compliant' : 
                 gdprData?.complianceScore && gdprData.complianceScore >= 60 ? 'Needs Improvement' : 'Non-Compliant'}
              </div>
            </div>
          </div>
          <Progress value={gdprData?.complianceScore || 0} className="h-3" />
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Compliance Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {complianceItems.map((category, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <category.icon className="w-5 h-5 text-[#F23E2E]" />
                {category.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {category.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(item.value / item.max) * 100} className="w-20 h-2" />
                    <span className="text-sm font-medium w-8 text-right">
                      {item.value}/{item.max}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Protection Officer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#F23E2E]" />
            Data Protection Officer (DPO)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">DPO Status</h4>
              <div className="flex items-center gap-2 mb-4">
                {gdprData?.dpo.appointed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={gdprData?.dpo.appointed ? 'text-green-600' : 'text-red-600'}>
                  {gdprData?.dpo.appointed ? 'DPO Appointed' : 'No DPO Appointed'}
                </span>
              </div>
              {gdprData?.dpo.appointed && (
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Contact Details</label>
                    <p className="text-sm text-gray-600">{gdprData.dpo.contactDetails}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Responsibilities</label>
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {gdprData.dpo.responsibilities.map((responsibility: any, index: number) => (
                        <li key={index}>{responsibility}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Audit Information</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Audit</span>
                  <span className="text-sm font-medium">
                    {gdprData?.lastAudit ? new Date(gdprData.lastAudit).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Next Audit</span>
                  <span className="text-sm font-medium">
                    {gdprData?.nextAudit ? new Date(gdprData.nextAudit).toLocaleDateString() : 'Not Scheduled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#F23E2E]" />
            Compliance Issues
          </CardTitle>
          <CardDescription>Track and resolve GDPR compliance issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gdprData?.issues?.map((issue: any) => (
              <div key={issue.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{issue.title}</h4>
                    <Badge className={getSeverityColor(issue.severity)}>
                      {issue.severity}
                    </Badge>
                    <Badge className={getStatusColor(issue.status)}>
                      {issue.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due: {new Date(issue.dueDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {issue.status === 'open' ? 'Overdue' : 'In Progress'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedIssue(issue.id)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {issue.status !== 'resolved' && (
                    <Button
                      size="sm"
                      onClick={() => handleResolveIssue(issue.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {(!gdprData?.issues || gdprData.issues.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p>No compliance issues found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#F23E2E]" />
            Recent Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {auditLogs?.slice(0, 5).map((log: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="text-sm font-medium text-gray-900">{log.action}</p>
                  <p className="text-xs text-gray-600">{log.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">{log.user}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
