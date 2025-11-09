"use client";

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { api } from '@/convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Database,
  Download,
  Eye,
  FileText,
  Key,
  Network,
  Settings,
  Shield,
  UserCheck
} from 'lucide-react';
import { useState } from 'react';

interface SecurityCompliance {
  authentication: {
    twoFactorAuth: boolean;
    passwordPolicy: boolean;
    sessionManagement: boolean;
    accountLockout: boolean;
    biometricAuth: boolean;
    ssoEnabled: boolean;
  };
  authorization: {
    roleBasedAccess: boolean;
    principleOfLeastPrivilege: boolean;
    regularAccessReviews: boolean;
    privilegeEscalation: boolean;
    apiAccessControl: boolean;
  };
  dataSecurity: {
    encryptionAtRest: boolean;
    encryptionInTransit: boolean;
    keyManagement: boolean;
    dataClassification: boolean;
    secureBackup: boolean;
    dataLossPrevention: boolean;
  };
  networkSecurity: {
    firewall: boolean;
    intrusionDetection: boolean;
    ddosProtection: boolean;
    vpnAccess: boolean;
    networkSegmentation: boolean;
    sslTls: boolean;
  };
  monitoring: {
    securityLogging: boolean;
    realTimeMonitoring: boolean;
    incidentResponse: boolean;
    threatDetection: boolean;
    vulnerabilityScanning: boolean;
    penetrationTesting: boolean;
  };
  compliance: {
    iso27001: boolean;
    soc2: boolean;
    pciDss: boolean;
    hipaa: boolean;
    gdpr: boolean;
    regularAudits: boolean;
  };
  lastSecurityAudit: number;
  nextSecurityAudit: number;
  securityScore: number;
  vulnerabilities: {
    id: string;
    title: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'resolved';
    description: string;
    cveId?: string;
    affectedSystems: string[];
    remediation: string;
    dueDate: number;
  }[];
  securityIncidents: {
    id: string;
    title: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'investigating' | 'contained' | 'resolved';
    description: string;
    affectedSystems: string[];
    discoveredAt: number;
    resolvedAt?: number;
    impact: string;
  }[];
}

export default function SecurityCompliancePage() {
  const [selectedVulnerability, setSelectedVulnerability] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch security compliance data
  const securityData = useQuery((api as any).queries.compliance.getSecurityCompliance);
  const securityLogs = useQuery((api as any).queries.compliance.getSecurityLogs);

  // Mutations
  const updateSecurity = useMutation((api as any).mutations.compliance.updateSecurityCompliance);
  const resolveVulnerability = useMutation((api as any).mutations.compliance.resolveVulnerability);
  const updateIncident = useMutation((api as any).mutations.compliance.updateSecurityIncident);
  const generateSecurityReport = useMutation((api as any).mutations.compliance.generateSecurityReport);

  const handleUpdateSecurity = async (updates: Partial<SecurityCompliance>) => {
    setIsUpdating(true);
    try {
      await updateSecurity(updates);
      setSuccess('Security settings updated successfully');
      setError(null);
    } catch (err) {
      setError('Failed to update security settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResolveVulnerability = async (vulnerabilityId: string) => {
    try {
      await resolveVulnerability({ vulnerabilityId });
      setSuccess('Vulnerability resolved successfully');
      setError(null);
    } catch (err) {
      setError('Failed to resolve vulnerability');
    }
  };

  const handleUpdateIncident = async (incidentId: string, updates: any) => {
    try {
      await updateIncident({ incidentId, ...updates });
      setSuccess('Incident updated successfully');
      setError(null);
    } catch (err) {
      setError('Failed to update incident');
    }
  };

  const handleGenerateReport = async () => {
    try {
      await generateSecurityReport();
      setSuccess('Security report generated successfully');
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
      case 'investigating':
      case 'contained':
        return 'bg-yellow-100 text-yellow-800';
      case 'open':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const securityCategories = [
    {
      title: 'Authentication',
      icon: Key,
      items: [
        { label: 'Two-Factor Authentication', value: securityData?.authentication.twoFactorAuth ? 1 : 0, max: 1 },
        { label: 'Password Policy', value: securityData?.authentication.passwordPolicy ? 1 : 0, max: 1 },
        { label: 'Session Management', value: securityData?.authentication.sessionManagement ? 1 : 0, max: 1 },
        { label: 'Account Lockout', value: securityData?.authentication.accountLockout ? 1 : 0, max: 1 },
        { label: 'Biometric Auth', value: securityData?.authentication.biometricAuth ? 1 : 0, max: 1 },
        { label: 'SSO Enabled', value: securityData?.authentication.ssoEnabled ? 1 : 0, max: 1 }
      ]
    },
    {
      title: 'Authorization',
      icon: UserCheck,
      items: [
        { label: 'Role-Based Access', value: securityData?.authorization.roleBasedAccess ? 1 : 0, max: 1 },
        { label: 'Least Privilege', value: securityData?.authorization.principleOfLeastPrivilege ? 1 : 0, max: 1 },
        { label: 'Access Reviews', value: securityData?.authorization.regularAccessReviews ? 1 : 0, max: 1 },
        { label: 'Privilege Escalation', value: securityData?.authorization.privilegeEscalation ? 1 : 0, max: 1 },
        { label: 'API Access Control', value: securityData?.authorization.apiAccessControl ? 1 : 0, max: 1 }
      ]
    },
    {
      title: 'Data Security',
      icon: Database,
      items: [
        { label: 'Encryption at Rest', value: securityData?.dataSecurity.encryptionAtRest ? 1 : 0, max: 1 },
        { label: 'Encryption in Transit', value: securityData?.dataSecurity.encryptionInTransit ? 1 : 0, max: 1 },
        { label: 'Key Management', value: securityData?.dataSecurity.keyManagement ? 1 : 0, max: 1 },
        { label: 'Data Classification', value: securityData?.dataSecurity.dataClassification ? 1 : 0, max: 1 },
        { label: 'Secure Backup', value: securityData?.dataSecurity.secureBackup ? 1 : 0, max: 1 },
        { label: 'Data Loss Prevention', value: securityData?.dataSecurity.dataLossPrevention ? 1 : 0, max: 1 }
      ]
    },
    {
      title: 'Network Security',
      icon: Network,
      items: [
        { label: 'Firewall', value: securityData?.networkSecurity.firewall ? 1 : 0, max: 1 },
        { label: 'Intrusion Detection', value: securityData?.networkSecurity.intrusionDetection ? 1 : 0, max: 1 },
        { label: 'DDoS Protection', value: securityData?.networkSecurity.ddosProtection ? 1 : 0, max: 1 },
        { label: 'VPN Access', value: securityData?.networkSecurity.vpnAccess ? 1 : 0, max: 1 },
        { label: 'Network Segmentation', value: securityData?.networkSecurity.networkSegmentation ? 1 : 0, max: 1 },
        { label: 'SSL/TLS', value: securityData?.networkSecurity.sslTls ? 1 : 0, max: 1 }
      ]
    }
  ];

  return (
    <div className="container mx-auto py-6 space-y-[18px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Security Compliance</h1>
          <p className="text-gray-600 font-satoshi mt-2">Monitor and manage security compliance and threats</p>
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
            onClick={() => {/* Open security settings */}}
            className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Security Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Security Compliance Score</h3>
              <p className="text-sm text-gray-600">Based on current security standards and best practices</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                {securityData?.securityScore || 0}%
              </div>
              <div className="text-sm text-gray-600">
                {securityData?.securityScore && securityData.securityScore >= 90 ? 'Excellent' : 
                 securityData?.securityScore && securityData.securityScore >= 70 ? 'Good' : 
                 securityData?.securityScore && securityData.securityScore >= 50 ? 'Fair' : 'Poor'}
              </div>
            </div>
          </div>
          <Progress value={securityData?.securityScore || 0} className="h-3" />
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

      {/* Security Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {securityCategories.map((category, index) => (
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

      {/* Compliance Standards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#F23E2E]" />
            Compliance Standards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'ISO 27001', value: securityData?.compliance.iso27001, color: 'bg-blue-100 text-blue-800' },
              { name: 'SOC 2', value: securityData?.compliance.soc2, color: 'bg-green-100 text-green-800' },
              { name: 'PCI DSS', value: securityData?.compliance.pciDss, color: 'bg-purple-100 text-purple-800' },
              { name: 'HIPAA', value: securityData?.compliance.hipaa, color: 'bg-orange-100 text-orange-800' },
              { name: 'GDPR', value: securityData?.compliance.gdpr, color: 'bg-yellow-100 text-yellow-800' },
              { name: 'Regular Audits', value: securityData?.compliance.regularAudits, color: 'bg-red-100 text-red-800' }
            ].map((standard, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium text-gray-900">{standard.name}</span>
                <Badge className={standard.value ? standard.color : 'bg-gray-100 text-gray-800'}>
                  {standard.value ? 'Compliant' : 'Not Compliant'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Vulnerabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#F23E2E]" />
            Security Vulnerabilities
          </CardTitle>
          <CardDescription>Track and manage security vulnerabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityData?.vulnerabilities?.map((vulnerability: any) => (
              <div key={vulnerability.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{vulnerability.title}</h4>
                    <Badge className={getSeverityColor(vulnerability.severity)}>
                      {vulnerability.severity}
                    </Badge>
                    <Badge className={getStatusColor(vulnerability.status)}>
                      {vulnerability.status}
                    </Badge>
                    {vulnerability.cveId && (
                      <Badge variant="outline" className="text-xs">
                        {vulnerability.cveId}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{vulnerability.description}</p>
                  <div className="text-xs text-gray-500 mb-2">
                    <strong>Affected Systems:</strong> {vulnerability.affectedSystems.join(', ')}
                  </div>
                  <div className="text-xs text-gray-500">
                    <strong>Remediation:</strong> {vulnerability.remediation}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due: {new Date(vulnerability.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedVulnerability(vulnerability.id)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {vulnerability.status !== 'resolved' && (
                    <Button
                      size="sm"
                      onClick={() => handleResolveVulnerability(vulnerability.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {(!securityData?.vulnerabilities || securityData.vulnerabilities.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p>No security vulnerabilities found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Incidents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#F23E2E]" />
            Security Incidents
          </CardTitle>
          <CardDescription>Monitor and manage security incidents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityData?.securityIncidents?.map((incident: any) => (
              <div key={incident.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{incident.title}</h4>
                    <Badge className={getSeverityColor(incident.severity)}>
                      {incident.severity}
                    </Badge>
                    <Badge className={getStatusColor(incident.status)}>
                      {incident.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                  <div className="text-xs text-gray-500 mb-2">
                    <strong>Affected Systems:</strong> {incident.affectedSystems.join(', ')}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    <strong>Impact:</strong> {incident.impact}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Discovered: {new Date(incident.discoveredAt).toLocaleDateString()}
                    </div>
                    {incident.resolvedAt && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Resolved: {new Date(incident.resolvedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedIncident(incident.id)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {incident.status !== 'resolved' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateIncident(incident.id, { status: 'resolved', resolvedAt: Date.now() })}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {(!securityData?.securityIncidents || securityData.securityIncidents.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p>No security incidents found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#F23E2E]" />
            Recent Security Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {securityLogs?.slice(0, 5).map((log: any, index: number) => (
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
