"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileSpreadsheet, 
  Download,
  Filter,
  Plus,
  Eye,
  Trash2,
  BarChart2,
  Users,
  DollarSign,
  Clock
} from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';
import { EmptyState } from '@/components/admin/empty-state';

interface Report {
  _id: string;
  name: string;
  type: 'user' | 'revenue' | 'orders' | 'custom';
  status: 'generating' | 'ready' | 'failed';
  createdAt: number;
  generatedAt?: number;
  fileSize?: number;
  downloadUrl?: string;
  parameters: {
    dateRange?: string;
    filters?: Record<string, string | number | boolean>;
    format?: 'csv' | 'pdf' | 'excel';
    name?: string;
    [key: string]: unknown;
  };
}

interface ReportTemplate {
  _id: string;
  name: string;
  description: string;
  type: string;
  isActive: boolean;
}

interface ReportParameters {
  dateRange?: string;
  format?: 'csv' | 'pdf' | 'excel';
  name?: string;
  [key: string]: unknown;
}

export default function AnalyticsReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [reportParameters, setReportParameters] = useState<ReportParameters>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch data
  const reports = useQuery(api.queries.analytics.getReports);
  const reportTemplates = useQuery(api.queries.analytics.getReportTemplates);

  // Mutations
  const generateReport = useMutation(api.mutations.analytics.generateReport);
  const deleteReport = useMutation(api.mutations.analytics.deleteReport);
  const downloadReport = useMutation(api.mutations.analytics.downloadReport);

  const handleGenerateReport = async () => {
    if (!selectedTemplate) {
      setError('Please select a report template');
      return;
    }

    const selectedTemplateData = reportTemplates?.find((t: ReportTemplate) => t._id === selectedTemplate);
    if (!selectedTemplateData) {
      setError('Selected template not found');
      return;
    }

    const reportName = reportParameters.name || `${selectedTemplateData.name} - ${new Date().toLocaleDateString()}`;

    try {
      await generateReport({
        name: reportName,
        reportType: selectedTemplateData.type,
        parameters: reportParameters
      });
      setSuccess('Report generation started');
      setError(null);
      setIsCreating(false);
      setSelectedTemplate('');
      setReportParameters({});
    } catch {
      setError('Failed to generate report');
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      await downloadReport({ 
        reportId: reportId as unknown as Id<"reports">
      });
      setSuccess('Report download started');
      setError(null);
    } catch {
      setError('Failed to download report');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      try {
        await deleteReport({ 
          reportId: reportId as unknown as Id<"reports">
        });
        setSuccess('Report deleted successfully');
        setError(null);
      } catch {
        setError('Failed to delete report');
      }
    }
  };

  const filteredReports = reports?.filter((report: Report) => {
    const matchesSearch = 
      report.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'generating':
        return <Badge className="bg-yellow-100 text-yellow-800">Generating</Badge>;
      case 'ready':
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="w-4 h-4" />;
      case 'revenue':
        return <DollarSign className="w-4 h-4" />;
      case 'orders':
        return <BarChart2 className="w-4 h-4" />;
      case 'custom':
        return <FileSpreadsheet className="w-4 h-4" />;
      default:
        return <FileSpreadsheet className="w-4 h-4" />;
    }
  };

  const formatFileSize = (fileSize: string | number) => {
    if (typeof fileSize === 'string') {
      return fileSize; // Already formatted
    }
    if (fileSize === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(fileSize) / Math.log(k));
    return parseFloat((fileSize / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Analytics Reports</h1>
          <p className="text-gray-600 font-satoshi mt-2">Generate and manage detailed analytics reports</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{reports?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Download className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ready</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports?.filter((r: Report) => r.status === 'ready').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Generating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports?.filter((r: Report) => r.status === 'generating').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Templates</p>
                <p className="text-2xl font-bold text-gray-900">{reportTemplates?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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

      {/* Create Report Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Generate New Report</CardTitle>
            <CardDescription>Select a template and configure parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Report Template</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {reportTemplates?.map((template: ReportTemplate) => (
                    <SelectItem key={template._id} value={template._id}>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(template.type)}
                        <span>{template.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Date Range</label>
                    <Select 
                      value={reportParameters.dateRange || ''} 
                      onValueChange={(value) => setReportParameters(prev => ({ ...prev, dateRange: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                        <SelectItem value="1y">Last year</SelectItem>
                        <SelectItem value="custom">Custom range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Format</label>
                    <Select 
                      value={reportParameters.format || 'csv'} 
                      onValueChange={(value: 'csv' | 'pdf' | 'excel') => {
                        setReportParameters(prev => ({ 
                          ...prev, 
                          format: value as 'csv' | 'pdf' | 'excel'
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Report Name</label>
                  <Input
                    value={reportParameters.name || ''}
                    onChange={(e) => setReportParameters(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter report name"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleGenerateReport} className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white">
                Generate Report
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="revenue">Revenue</SelectItem>
            <SelectItem value="orders">Orders</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="generating">Generating</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report: Report) => (
          <Card key={report._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#F23E2E]/10 rounded-lg">
                    {getTypeIcon(report.type)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{report.name}</h4>
                    <p className="text-sm text-gray-600 capitalize">{report.type} Report</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(report.status)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-sm font-medium">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {report.generatedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Generated</p>
                    <p className="text-sm font-medium">
                      {new Date(report.generatedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {report.fileSize && (
                  <div>
                    <p className="text-sm text-gray-600">File Size</p>
                    <p className="text-sm font-medium">{formatFileSize(report.fileSize)}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {/* View report details */}}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  {report.status === 'ready' && (
                    <Button
                      size="sm"
                      onClick={() => handleDownloadReport(report._id)}
                      className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteReport(report._id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <EmptyState
          icon={FileSpreadsheet}
          title={searchTerm || typeFilter !== 'all' || statusFilter !== 'all' ? "No reports found" : "No reports yet"}
          description={searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
            ? "Try adjusting your search or filter criteria" 
            : "Generate your first report to get started"}
          action={searchTerm || typeFilter !== 'all' || statusFilter !== 'all' ? {
            label: "Clear filters",
            onClick: () => {
              setSearchTerm('');
              setTypeFilter('all');
              setStatusFilter('all');
            },
            variant: "secondary"
          } : {
            label: "Generate Report",
            onClick: () => setIsCreating(true),
            variant: "primary"
          }}
          variant={searchTerm || typeFilter !== 'all' || statusFilter !== 'all' ? "filtered" : "no-data"}
        />
      )}

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Available Report Templates</CardTitle>
          <CardDescription>Pre-configured report templates for common analytics needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTemplates?.map((template: ReportTemplate) => (
              <div key={template._id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#F23E2E]/10 rounded-lg">
                    {getTypeIcon(template.type)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600 capitalize">{template.type}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                <div className="flex items-center justify-between">
                  <Badge variant={template.isActive ? "default" : "secondary"}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTemplate(template._id);
                      setIsCreating(true);
                    }}
                  >
                    Use Template
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
