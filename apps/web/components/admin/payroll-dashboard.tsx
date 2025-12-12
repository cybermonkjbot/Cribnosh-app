'use client';

import { api } from '@/convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import {
  Calendar,
  Download,
  Eye,
  FileText,
  Filter,
  Plus,
  PoundSterling,
  Send,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface PayrollSummary {
  totalEmployees: number;
  totalPayrollRecords: number;
  totalGrossPay: number;
  totalTaxPaid: number;
  totalNationalInsurance: number;
  totalPension: number;
  totalNetPay: number;
  averageGrossPay: number;
  averageNetPay: number;
}

interface TaxDocument {
  _id: string;
  employee_id: string;
  document_type: 'p60' | 'p45' | 'p11d' | 'self_assessment' | 'payslip';
  tax_year: string;
  generated_at: number;
  status: 'generated' | 'sent' | 'archived';
}

interface PayrollDashboardProps {
  taxYear?: string;
  employeeId?: string;
}

export default function PayrollDashboard({
  taxYear = '2023-2024',
  employeeId
}: PayrollDashboardProps) {
  const [filters, setFilters] = useState({
    taxYear,
    employeeId: employeeId || '',
    documentType: '',
    status: ''
  });

  // Get payroll data from Convex
  const payrollSummary = useQuery((api as any).queries.payroll.getPayrollStats, {});

  const taxDocuments = useQuery((api as any).queries.payroll.getTaxDocuments, {});

  const generateTaxDocument = useMutation((api as any).mutations.payroll.generateTaxDocument);

  const summaryLoading = !payrollSummary;
  const documentsLoading = !taxDocuments;

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateTaxDocument = async (documentType: string, employeeId: string, format: string = 'pdf') => {
    try {
      const result = await generateTaxDocument({
        periodId: employeeId as any, // Using employeeId as periodId for now
        notes: `Generated ${documentType} for employee ${employeeId} in ${filters.taxYear}`
      });

      if (result) {
        // For now, create a simple download - can be enhanced with proper file generation
        const dataStr = JSON.stringify(result, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax-document-${documentType}-${employeeId}-${filters.taxYear}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Generate tax document failed:', error);
    }
  };

  if (summaryLoading || documentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Payroll Filters
          </h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            New Payroll Run
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Year</label>
            <select
              value={filters.taxYear}
              onChange={(e) => handleFilterChange('taxYear', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="2023-2024">2023-2024</option>
              <option value="2022-2023">2022-2023</option>
              <option value="2021-2022">2021-2022</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <input
              type="text"
              placeholder="Employee ID"
              value={filters.employeeId}
              onChange={(e) => handleFilterChange('employeeId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select
              value={filters.documentType}
              onChange={(e) => handleFilterChange('documentType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Documents</option>
              <option value="p60">P60</option>
              <option value="p45">P45</option>
              <option value="p11d">P11D</option>
              <option value="self_assessment">Self Assessment</option>
              <option value="payslip">Payslip</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Statuses</option>
              <option value="generated">Generated</option>
              <option value="sent">Sent</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{payrollSummary?.totalEmployees.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Gross Pay</p>
              <p className="text-2xl font-bold text-gray-900">£{payrollSummary?.totalGrossPay.toLocaleString()}</p>
            </div>
            <PoundSterling className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tax Paid</p>
              <p className="text-2xl font-bold text-gray-900">£{payrollSummary?.totalTaxPaid.toLocaleString()}</p>
            </div>
            <FileText className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Net Pay</p>
              <p className="text-2xl font-bold text-gray-900">£{payrollSummary?.totalNetPay.toLocaleString()}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </motion.div>

      {/* Tax Documents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Tax Documents</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tax Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {taxDocuments?.map((document: any) => (
                <tr key={document._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {document.employee_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {document.document_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {document.tax_year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(document.generated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${document.status === 'generated' ? 'bg-yellow-100 text-yellow-800' :
                        document.status === 'sent' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {document.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleGenerateTaxDocument(document.document_type, document.employee_id, 'pdf')}
                        className="text-blue-600 hover:text-blue-900"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleGenerateTaxDocument(document.document_type, document.employee_id, 'csv')}
                        className="text-green-600 hover:text-green-900"
                        title="Download CSV"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        className="text-purple-600 hover:text-purple-900"
                        title="View Document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="text-orange-600 hover:text-orange-900"
                        title="Send to Employee"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {/* Generate all P60s */ }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileText className="w-5 h-5" />
            Generate All P60s
          </button>
          <button
            onClick={() => {/* Generate all P45s */ }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileText className="w-5 h-5" />
            Generate All P45s
          </button>
          <button
            onClick={() => {/* Generate all P11Ds */ }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FileText className="w-5 h-5" />
            Generate All P11Ds
          </button>
        </div>
      </motion.div>
    </div>
  );
} 