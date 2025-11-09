"use client";

import { EmptyState } from '@/components/admin/empty-state';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { formatCurrency } from '@/lib/utils/number-format';
import { useMutation, useQuery } from 'convex/react';
import {
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Plus,
  Receipt,
  Search,
  Trash2,
  User
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAdminUser } from '../../AdminUserProvider';

interface TaxDocument {
  _id: Id<"taxDocuments">;
  documentType: 'p60' | 'p45' | 'p11d' | 'payslip' | 'tax_summary' | 'custom';
  employeeId: Id<"users">;
  employeeName: string;
  taxYear: string;
  period: {
    start: number;
    end: number;
  };
  status: 'draft' | 'generated' | 'sent' | 'acknowledged';
  generatedAt: number;
  sentAt?: number;
  acknowledgedAt?: number;
  data: {
    grossPay: number;
    taxablePay: number;
    taxPaid: number;
    nationalInsurance: number;
    pensionContributions: number;
    studentLoan: number;
    otherDeductions: number;
    netPay: number;
    employerContributions: number;
    benefits: {
      name: string;
      value: number;
      taxable: boolean;
    }[];
  };
  fileUrl?: string;
  fileSize?: number;
  generatedBy: string;
  notes?: string;
}

interface TaxDocumentTemplate {
  _id: string;
  name: string;
  type: 'p60' | 'p45' | 'p11d' | 'payslip' | 'tax_summary';
  description: string;
  isActive: boolean;
  fields: {
    name: string;
    type: 'text' | 'number' | 'date' | 'currency';
    required: boolean;
    defaultValue?: any;
  }[];
}

export default function TaxDocumentsPage() {
  const { sessionToken } = useAdminUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<string | null>(null);

  // New document form
  const [newDocument, setNewDocument] = useState({
    documentType: 'payslip' as const,
    employeeId: '',
    taxYear: new Date().getFullYear().toString(),
    period: {
      start: '',
      end: ''
    },
    notes: ''
  });

  // Fetch data
  const taxDocuments = useQuery((api as any).queries.payroll.getTaxDocuments);
  const employees = useQuery((api as any).queries.users.getUsersForAdmin, sessionToken ? { sessionToken } : "skip");
  const templates = useQuery((api as any).queries.payroll.getTaxDocumentTemplates);
  const payrollStats = useQuery((api as any).queries.payroll.getPayrollStats);

  // Mutations
  const generateDocument = useMutation((api as any).mutations.payroll.generateTaxDocument);
  const deleteDocument = useMutation((api as any).mutations.payroll.deleteTaxDocument);
  const downloadDocument = useMutation((api as any).mutations.payroll.downloadTaxDocument);
  const sendDocument = useMutation((api as any).mutations.payroll.sendTaxDocument);

  const handleGenerateDocument = async () => {
    if (!newDocument.employeeId || !newDocument.period.start || !newDocument.period.end) {
      setError('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    try {
      setError(null);
      await generateDocument({
        documentType: newDocument.documentType,
        employeeId: newDocument.employeeId as Id<"users">,
        taxYear: newDocument.taxYear,
        period: {
          start: new Date(newDocument.period.start).getTime(),
          end: new Date(newDocument.period.end).getTime()
        },
        notes: newDocument.notes
      });
      
      setNewDocument({
        documentType: 'payslip',
        employeeId: '',
        taxYear: new Date().getFullYear().toString(),
        period: {
          start: '',
          end: ''
        },
        notes: ''
      });
      setSuccess('Tax document generated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tax document');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteDocument = async (documentId: Id<"taxDocuments">) => {
    if (confirm('Are you sure you want to delete this tax document?')) {
      try {
        setError(null);
        setIsDeleting(documentId);
        await deleteDocument({ documentId });
        setSuccess('Tax document deleted successfully');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete tax document');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleDownloadDocument = async (documentId: Id<"taxDocuments">) => {
    try {
      setError(null);
      setIsDownloading(documentId);
      await downloadDocument({ documentId });
      setSuccess('Document download started');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download document');
    } finally {
      setIsDownloading(null);
    }
  };

  const handleSendDocument = async (documentId: Id<"taxDocuments">) => {
    try {
      setError(null);
      setIsSending(documentId);
      await sendDocument({ documentId });
      setSuccess('Document sent successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send document');
    } finally {
      setIsSending(null);
    }
  };

  // Auto-dismiss success/error messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const filteredDocuments = taxDocuments?.filter((document: any) => {
    const matchesSearch = 
      document.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.documentType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || document.documentType === typeFilter;
    const matchesStatus = statusFilter === 'all' || document.status === statusFilter;
    const matchesYear = yearFilter === 'all' || document.taxYear === yearFilter;
    
    return matchesSearch && matchesType && matchesStatus && matchesYear;
  }).sort((a: any, b: any) => {
    switch (sortBy) {
      case 'recent':
        return b.generatedAt - a.generatedAt;
      case 'name':
        return a.employeeName.localeCompare(b.employeeName);
      case 'type':
        return a.documentType.localeCompare(b.documentType);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 'generated':
        return <Badge className="bg-blue-100 text-blue-800">Generated</Badge>;
      case 'sent':
        return <Badge className="bg-yellow-100 text-yellow-800">Sent</Badge>;
      case 'acknowledged':
        return <Badge className="bg-green-100 text-green-800">Acknowledged</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'p60':
        return <Badge className="bg-red-100 text-red-800">P60</Badge>;
      case 'p45':
        return <Badge className="bg-orange-100 text-orange-800">P45</Badge>;
      case 'p11d':
        return <Badge className="bg-purple-100 text-purple-800">P11D</Badge>;
      case 'payslip':
        return <Badge className="bg-green-100 text-green-800">Payslip</Badge>;
      case 'tax_summary':
        return <Badge className="bg-blue-100 text-blue-800">Tax Summary</Badge>;
      case 'custom':
        return <Badge className="bg-gray-100 text-gray-800">Custom</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  // formatCurrency is imported from utils

  const uniqueYears = Array.from(new Set(taxDocuments?.map((doc: any) => doc.taxYear) || []));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Tax Documents</h1>
          <p className="text-gray-600 font-satoshi mt-2">Generate and manage tax documents for employees</p>
        </div>
        <Button
          onClick={() => {/* Open generate document modal */}}
          className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Generate Document
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{taxDocuments?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Generated</p>
                <p className="text-2xl font-bold text-gray-900">
                  {taxDocuments?.filter((d: any) => d.status === 'generated').length || 0}
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
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {taxDocuments?.filter((d: any) => d.status === 'draft').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(taxDocuments?.reduce((sum: any, doc: any) => sum + (doc.amount || 0), 0) || 0)}
                </p>
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

      {/* Generate Document Form */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Tax Document</CardTitle>
          <CardDescription>Create a new tax document for an employee</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Document Type</label>
              <Select value={newDocument.documentType} onValueChange={(value) => setNewDocument(prev => ({ ...prev, documentType: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payslip">Payslip</SelectItem>
                  <SelectItem value="p60">P60</SelectItem>
                  <SelectItem value="p45">P45</SelectItem>
                  <SelectItem value="p11d">P11D</SelectItem>
                  <SelectItem value="tax_summary">Tax Summary</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Employee</label>
              <Select value={newDocument.employeeId} onValueChange={(value) => setNewDocument(prev => ({ ...prev, employeeId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                    {employees?.map((employee: any) => (
                    <SelectItem key={employee._id} value={employee._id}>
                      {employee.name || employee.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Tax Year</label>
              <Select value={newDocument.taxYear} onValueChange={(value) => setNewDocument(prev => ({ ...prev, taxYear: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}/{year + 1}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Period Start</label>
              <Input
                type="date"
                value={newDocument.period.start}
                onChange={(e) => setNewDocument(prev => ({ 
                  ...prev, 
                  period: { ...prev.period, start: e.target.value }
                }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Period End</label>
              <Input
                type="date"
                value={newDocument.period.end}
                onChange={(e) => setNewDocument(prev => ({ 
                  ...prev, 
                  period: { ...prev.period, end: e.target.value }
                }))}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Notes (Optional)</label>
            <Input
              value={newDocument.notes}
              onChange={(e) => setNewDocument(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Enter any additional notes"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateDocument} 
              disabled={isGenerating}
              className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
            >
              {isGenerating ? 'Generating...' : 'Generate Document'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="payslip">Payslip</SelectItem>
            <SelectItem value="p60">P60</SelectItem>
            <SelectItem value="p45">P45</SelectItem>
            <SelectItem value="p11d">P11D</SelectItem>
            <SelectItem value="tax_summary">Tax Summary</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="generated">Generated</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {(uniqueYears as any[]).map((year: any, index: number) => (
              <SelectItem key={String(year)} value={String(year)}>{String(year)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recent</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="type">Type</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {filteredDocuments.map((document: any) => (
          <Card key={document._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900">{document.employeeName}</h4>
                    {getTypeBadge(document.documentType)}
                    {getStatusBadge(document.status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Tax Year: {document.taxYear} | Period: {new Date(document.period.start).toLocaleDateString()} - {new Date(document.period.end).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-700">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {document.generatedBy}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(document.generatedAt).toLocaleDateString()}
                    </div>
                    {document.fileSize && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {(document.fileSize / 1024).toFixed(1)} KB
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedDocument(document._id)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadDocument(document._id)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {document.status === 'generated' && (
                    <Button
                      size="sm"
                      onClick={() => handleSendDocument(document._id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Send
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteDocument(document._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Document Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(document.data.grossPay)}</p>
                  <p className="text-sm text-gray-600">Gross Pay</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(document.data.taxPaid)}</p>
                  <p className="text-sm text-gray-600">Tax Paid</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(document.data.nationalInsurance)}</p>
                  <p className="text-sm text-gray-600">National Insurance</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(document.data.netPay)}</p>
                  <p className="text-sm text-gray-600">Net Pay</p>
                </div>
              </div>

              {/* Benefits */}
              {document.data.benefits.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-medium text-gray-900">Benefits</h5>
                  <div className="space-y-1">
                    {document.data.benefits.map((benefit: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{benefit.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(benefit.value)}</span>
                          {benefit.taxable && (
                            <Badge variant="outline" className="text-xs">Taxable</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {document.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{document.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <EmptyState
          icon={FileText}
          title={searchTerm || statusFilter !== 'all' || yearFilter !== 'all' ? "No tax documents found" : "No tax documents yet"}
          description={searchTerm || statusFilter !== 'all' || yearFilter !== 'all' 
            ? "Try adjusting your search or filter criteria" 
            : "Generate your first tax document to get started"}
          action={searchTerm || statusFilter !== 'all' || yearFilter !== 'all' ? {
            label: "Clear filters",
            onClick: () => {
              setSearchTerm('');
              setStatusFilter('all');
              setYearFilter('all');
            },
            variant: "secondary"
          } : {
            label: "Generate Document",
            onClick: () => setIsCreating(true),
            variant: "primary"
          }}
          variant={searchTerm || statusFilter !== 'all' || yearFilter !== 'all' ? "filtered" : "no-data"}
        />
      )}

      {/* Document Templates */}
      {templates && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#F23E2E]" />
              Document Templates
            </CardTitle>
            <CardDescription>Pre-configured templates for different tax documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template: any) => (
                <div key={template._id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#F23E2E]/10 rounded-lg">
                      <Receipt className="w-4 h-4 text-[#F23E2E]" />
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
                      onClick={() => {/* Use template */}}
                    >
                      Use Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
