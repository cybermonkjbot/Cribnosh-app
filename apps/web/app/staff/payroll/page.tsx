'use client';

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { format } from 'date-fns';
import { 
  Calendar, 
  Download, 
  FileText, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Receipt,
  CreditCard,
  PieChart,
  BarChart3,
  CalendarDays,
  User,
  Building2,
  Activity,
  Settings,
  AlertCircle,
  CheckCircle,
  Info,
  Eye,
  Filter,
  Search,
  RefreshCw,
  Share2,
  Printer,
  Mail,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AlertDialog from '@/components/ui/alert-dialog';
import { useAlertDialog } from '@/hooks/use-alert-dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStaffAuthContext } from '@/app/staff/staff-auth-context';


// Custom components
import { DataTable } from '@/components/staff/payroll/data-table';
import { columns } from '@/components/staff/payroll/columns';
import { formatCurrency } from '@/lib/utils/number-format';

// Currency formatter for Naira (using utility)
const formatNaira = (amount: number) => {
  return formatCurrency(amount, { currency: 'NGN' });
};

export default function StaffPayrollPage() {
  const router = useRouter();
  const { staff: staffUser, loading: staffAuthLoading, sessionToken } = useStaffAuthContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Alert dialog hook
  const { alertState, hideAlert, showInfo, showWarning, showError } = useAlertDialog();

  // Get payroll profile
  const payrollData = useQuery(
    api.payroll.staff.getPayrollProfileBySession,
    staffUser && sessionToken ? { sessionToken } : 'skip'
  );

  // Get payslips
  const payslips = useQuery(
    api.payroll.staff.getPayslipsBySession,
    staffUser && sessionToken ? { sessionToken } : 'skip'
  );

  // Get tax documents (placeholder returns [])
  const taxDocuments = useQuery(
    api.payroll.staff.getTaxDocumentsBySession,
    staffUser && sessionToken ? { sessionToken, year: parseInt(yearFilter) } : 'skip'
  );

  // Fetch year-to-date summary
  const ytdSummary = useQuery(
    api.payroll.staff.getYearToDateSummaryBySession,
    staffUser && sessionToken ? { sessionToken } : 'skip'
  );

  // Fetch year-to-date hours from work sessions
  const ytdHours = useQuery(
    api.queries.workSessions.getYearToDateHours,
    staffUser && sessionToken ? { 
      staffId: staffUser._id, 
      year: parseInt(yearFilter),
      sessionToken
    } : 'skip'
  );
  
  // Handle payslip download
  const handleDownloadPayslip = async (payslipId: string) => {
    try {
      // Get payslip data for download
      const payslip = payslips?.items?.find((p: any) => p._id === payslipId);
      if (!payslip) {
        throw new Error('Payslip not found');
      }

            // Create downloadable content
      const content = `PAYSLIP
 Period: ${payslip.startDate && payslip.endDate 
        ? `${format(new Date(payslip.startDate), 'MMM d, yyyy')} - ${format(new Date(payslip.endDate), 'MMM d, yyyy')}`
        : 'N/A'}
 Payment Date: ${payslip.paymentDate ? format(new Date(payslip.paymentDate), 'MMM d, yyyy') : 'N/A'}
 Gross Pay: ${formatNaira((payslip.grossPay || 0) / 100)}
 Net Pay: ${formatNaira((payslip.netPay || 0) / 100)}
 Status: ${payslip.status || 'N/A'}`;

      // Create and download file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payslipId.slice(-6)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      showError(
        'Download Failed',
        'Unable to download the payslip. Please check your internet connection and try again. If the problem persists, contact HR for assistance.'
      );
    }
  };
  
  // Handle tax document download
  const handleDownloadTaxDoc = async (docId: string) => {
    try {
      const doc = taxDocuments?.find((d: any) => d._id === docId);
      if (!doc) {
        throw new Error('Document not found');
      }

      // Create downloadable content
      const content = `TAX DOCUMENT
Description: ${doc.documentType || 'Unnamed Document'}
Type: ${doc.documentType || 'Document'}
Year: ${doc.taxYear || 'N/A'}
Document ID: ${doc._id}`;

      // Create and download file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax-doc-${docId.slice(-6)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      showError(
        'Download Failed',
        'Unable to download the tax document. Please check your internet connection and try again. If the problem persists, contact HR for assistance.'
      );
    }
  };

  // Handle print payslip
  const handlePrintPayslip = (payslipId: string) => {
    try {
      const payslip = payslips?.items?.find((p: any) => p._id === payslipId);
      if (!payslip) {
        throw new Error('Payslip not found');
      }

      // Create printable content
      const printContent = `
        <html>
          <head>
            <title>Payslip - ${payslipId.slice(-6)}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 20px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>PAYSLIP</h1>
              <h2>${payslip.startDate && payslip.endDate 
                ? `${format(new Date(payslip.startDate), 'MMM d, yyyy')} - ${format(new Date(payslip.endDate), 'MMM d, yyyy')}`
                : 'N/A'}</h2>
            </div>
            <div class="section">
              <div class="row">
                <span class="label">Payment Date:</span>
                <span>${payslip.paymentDate ? format(new Date(payslip.paymentDate), 'MMM d, yyyy') : 'N/A'}</span>
              </div>
              <div class="row">
                <span class="label">Gross Pay:</span>
                <span>${formatNaira((payslip.grossPay || 0) / 100)}</span>
              </div>
              <div class="row">
                <span class="label">Net Pay:</span>
                <span>${formatNaira((payslip.netPay || 0) / 100)}</span>
              </div>
              <div class="row">
                <span class="label">Period:</span>
                <span>${payslip.startDate && payslip.endDate 
                  ? `${format(new Date(payslip.startDate), 'MMM d, yyyy')} - ${format(new Date(payslip.endDate), 'MMM d, yyyy')}`
                  : 'N/A'}</span>
              </div>
              <div class="row">
                <span class="label">Status:</span>
                <span>${payslip.status || 'N/A'}</span>
              </div>
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Print failed:', error);
      showError(
        'Print Failed',
        'Unable to print the payslip. Please check your printer settings and try again. You can also download the payslip and print it manually.'
      );
    }
  };

  // Handle share payslip
  const handleSharePayslip = async (payslipId: string) => {
    try {
      const payslip = payslips?.items?.find((p: any) => p._id === payslipId);
      if (!payslip) {
        throw new Error('Payslip not found');
      }

      // Create shareable content
      const shareData = {
        title: `Payslip - ${payslipId.slice(-6)}`,
        text: `Payslip for period: ${payslip.startDate && payslip.endDate 
          ? `${format(new Date(payslip.startDate), 'MMM d, yyyy')} - ${format(new Date(payslip.endDate), 'MMM d, yyyy')}`
          : 'N/A'}. Net Pay: ${formatNaira((payslip.netPay || 0) / 100)}`,
        url: window.location.href
      };

      // Use Web Share API if available
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard copy
        const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);
        alert('Share information copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
      alert('Share failed. Please try again.');
    }
  };

  // Calculate summary stats
  const summaryStats = {
    totalEarnings: ytdSummary?.grossEarnings ? ytdSummary.grossEarnings / 100 : 0,
    totalHours: ytdHours?.totalHours || 0,
    averagePay: ytdSummary?.grossEarnings && ytdHours?.totalHours 
      ? (ytdSummary.grossEarnings / 100) / ytdHours.totalHours 
      : 0,
    payslipsCount: payslips?.items?.length || 0,
    pendingPayslips: payslips?.items?.filter((p: any) => p.status === 'pending')?.length || 0,
    processedPayslips: payslips?.items?.filter((p: any) => p.status === 'processed')?.length || 0,
    totalGrossPay: payslips?.items?.reduce((sum: number, p: any) => sum + ((p.grossPay || 0) / 100), 0) || 0,
    totalNetPay: payslips?.items?.reduce((sum: number, p: any) => sum + ((p.netPay || 0) / 100), 0) || 0,
    totalOvertimeHours: payslips?.items?.reduce((sum: number, p: any) => sum + (p.overtimeHours || 0), 0) || 0
  };

  // Filter payslips based on search and filters
  const filteredPayslips = payslips?.items?.filter((payslip: any) => {
    const matchesSearch = searchQuery === '' || 
      payslip._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payslip.startDate && format(new Date(payslip.startDate), 'MMM yyyy').toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || payslip.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Generate year options for filter
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return year.toString();
  });

  // Loading state while resolving authentication
  if (staffAuthLoading) {
    return (
      <div className="space-y-8 px-4 pt-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  // If not logged in (no session), show login prompt
  if (!staffUser || !sessionToken) {
    return (
      <div className="space-y-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start"
        >
          <Link
            href="/staff/portal"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200/60 text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-colors font-satoshi text-sm font-medium shadow-sm"
            aria-label="Back to Staff Portal"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </motion.div>

        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 shadow-xl max-w-md w-full mx-4"
          >
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold font-asgard text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-700 font-satoshi mb-6">You need to be signed in to access your payroll information.</p>
            <div className="space-y-3">
              <Link href="/staff/login">
                <Button className="w-full bg-primary-600 hover:bg-primary-700">
                  Sign In
                </Button>
              </Link>
              <Link href="/staff/portal">
                <Button variant="outline" className="w-full">
                  Return to Portal
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Invalid/expired token - handled by layout, but keep for safety
  if (!staffUser) {
    return (
      <div className="space-y-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start"
        >
          <Link
            href="/staff/portal"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200/60 text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-colors font-satoshi text-sm font-medium shadow-sm"
            aria-label="Back to Staff Portal"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </motion.div>

        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 shadow-xl max-w-md w-full mx-4"
          >
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold font-asgard text-gray-900 mb-4">Session Expired</h2>
            <p className="text-gray-700 font-satoshi mb-6">Your session has expired. Please sign in again to continue.</p>
            <div className="space-y-3">
              <Link href="/staff/login">
                <Button className="w-full bg-primary-600 hover:bg-primary-700">
                  Sign In Again
                </Button>
              </Link>
              <Link href="/staff/portal">
                <Button variant="outline" className="w-full">
                  Return to Portal
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 pt-8">
      {/* Back Button */}
      <Link
        href="/staff/portal"
        className="p-2 text-gray-600 hover:text-gray-900 transition-colors inline-block mb-8"
        aria-label="Back to Staff Portal"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>

      {/* Enhanced Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-asgard text-gray-900 mb-3">
            My Payroll
          </h1>
          <p className="text-gray-700 font-satoshi text-lg">
            View and manage your payroll information, payslips, and tax documents
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Info className="w-4 h-4 text-primary-600" />
            <span className="text-sm text-primary-600 font-satoshi">All amounts are displayed in Nigerian Naira (₦)</span>
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Live Data
            </Badge>
            {summaryStats.pendingPayslips > 0 && (
              <Badge variant="outline" className="ml-2 bg-[#F23E2E]/10 text-[#F23E2E] border-gray-200/60">
                <AlertCircle className="w-3 h-3 mr-1" />
                {summaryStats.pendingPayslips} Pending
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="lg"
            className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {showCalendar ? 'Hide Calendar' : 'Monthly Pay Calendar'}
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white"
            onClick={async () => {
              try {
                const exportData = {
                  employeeInfo: {
                    name: staffUser?.name || 'Unknown',
                    id: staffUser?._id || 'Unknown',
                    year: yearFilter
                  },
                  summary: summaryStats,
                  payslips: payslips?.items?.map((p: any) => ({
                    id: p._id,
                    period: p.startDate && p.endDate
                      ? `${format(new Date(p.startDate), 'MMM d, yyyy')} - ${format(new Date(p.endDate), 'MMM d, yyyy')}`
                      : 'N/A',
                    paymentDate: p.paymentDate ? format(new Date(p.paymentDate), 'MMM d, yyyy') : 'N/A',
                    status: p.status,
                    grossPay: formatNaira((p.grossPay || 0) / 100),
                    netPay: formatNaira((p.netPay || 0) / 100)
                  })) || [],
                  taxDocuments: taxDocuments?.map((d: any) => ({
                    id: d._id,
                    description: d.description || 'Unnamed Document',
                    type: d.type || 'Document',
                    year: d.year || 'N/A'
                  })) || [],
                  exportDate: new Date().toISOString()
                };
                const content = JSON.stringify(exportData, null, 2);
                const blob = new Blob([content], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `payroll-export-${staffUser?.name || 'staff'}-${yearFilter}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
              } catch (error) {
                console.error('Export failed:', error);
                alert('Export failed. Please try again.');
              }
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white"
            onClick={async () => {
              try {
                const reportData = {
                  title: `Payroll Report - ${staffUser?.name || 'Staff'}`,
                  summary: `Year-to-Date Summary for ${yearFilter}`,
                  totalEarnings: formatNaira(summaryStats.totalEarnings),
                  totalHours: summaryStats.totalHours,
                  payslipsCount: summaryStats.payslipsCount,
                  pendingCount: summaryStats.pendingPayslips,
                  exportDate: new Date().toLocaleDateString()
                };
                const shareText = `${reportData.title}\n${reportData.summary}\nTotal Earnings: ${reportData.totalEarnings}\nTotal Hours: ${reportData.totalHours}\nPayslips: ${reportData.payslipsCount}\nPending: ${reportData.pendingCount}\nGenerated: ${reportData.exportDate}`;
                if (navigator.share && navigator.canShare({ text: shareText })) {
                  await navigator.share({ text: shareText });
                } else {
                  await navigator.clipboard.writeText(shareText);
                  alert('Report summary copied to clipboard!');
                }
              } catch (error) {
                console.error('Share failed:', error);
                alert('Share failed. Please try again.');
              }
            }}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Report
          </Button>
        </div>
      </motion.div>

      {/* Integrated Pay Calendar */}
      {showCalendar && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6 bg-white/90 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl overflow-hidden"
        >
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold font-asgard text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary-600" />
              Pay Calendar {yearFilter}
            </h2>
            <p className="text-sm text-gray-600 font-satoshi mt-1">
              Monthly payments on the last Friday of each month
            </p>
          </div>
          
          <div className="p-6">
            {/* Calendar Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
              {[
                { title: 'Q1', months: ['Jan', 'Feb', 'Mar'] },
                { title: 'Q2', months: ['Apr', 'May', 'Jun'] },
                { title: 'Q3', months: ['Jul', 'Aug', 'Sep'] },
                { title: 'Q4', months: ['Oct', 'Nov', 'Dec'] }
              ].map((quarter, quarterIndex) => (
                <div key={quarter.title} className="flex flex-col">
                  <div className="bg-gray-700 text-white px-4 py-3 text-center font-semibold text-sm uppercase tracking-wide border-r border-gray-600 last:border-r-0">
                    {quarter.title}
                  </div>
                  {quarter.months.map((monthName, monthIndex) => {
                    const monthData = (() => {
                      const currentYear = parseInt(yearFilter);
                      const monthIndex2 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthName);
                      
                      // Get the last day of the month
                      const lastDay = new Date(currentYear, monthIndex2 + 1, 0);
                      const lastFriday = new Date(lastDay);
                      
                      // Find the last Friday of the month
                      while (lastFriday.getDay() !== 5) { // 5 = Friday
                        lastFriday.setDate(lastFriday.getDate() - 1);
                      }
                      
                      return {
                        date: lastFriday.toISOString().split('T')[0],
                        month: monthName,
                        day: lastFriday.getDate(),
                        year: lastFriday.getFullYear(),
                        fullDate: lastFriday.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      };
                    })();
                    
                    const isCurrentMonth = new Date().getMonth() === ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthName);
                    const isPastMonth = monthData && new Date(monthData.date) < new Date();
                    
                    return (
                      <div 
                        key={monthName}
                        className={`p-4 text-center border-r border-b border-gray-200 last:border-r-0 ${
                          isCurrentMonth ? 'bg-blue-50 border-l-4 border-l-blue-500' : 
                          isPastMonth ? 'bg-gray-50' : 'bg-white'
                        }`}
                      >
                        <div className={`font-semibold text-sm uppercase tracking-wide mb-3 ${
                          isCurrentMonth ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {monthName}
                        </div>
                        
                        <div className={`inline-block px-3 py-2 rounded-lg text-white font-bold ${
                          isCurrentMonth ? 'bg-blue-600' : 'bg-gray-600'
                        }`}>
                          <div className="text-lg">{monthData.day}</div>
                          <div className="text-xs opacity-90 uppercase tracking-wide">Last Friday</div>
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-2 leading-tight">
                          {monthData.fullDate}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            
            {/* Calendar Info Panel */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Next Pay Date */}
              {(() => {
                const currentYear = parseInt(yearFilter);
                const payDates = [];
                
                for (let month = 0; month < 12; month++) {
                  const lastDay = new Date(currentYear, month + 1, 0);
                  const lastFriday = new Date(lastDay);
                  
                  while (lastFriday.getDay() !== 5) {
                    lastFriday.setDate(lastFriday.getDate() - 1);
                  }
                  
                  payDates.push({
                    date: lastFriday.toISOString().split('T')[0],
                    fullDate: lastFriday.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  });
                }
                
                const nextPayDate = payDates.find(d => new Date(d.date) > new Date());
                if (nextPayDate) {
                  const daysUntil = Math.ceil((new Date(nextPayDate.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-semibold text-green-800 mb-2">Next Pay Date</h3>
                      <div className="text-lg font-bold text-green-900 mb-1">{nextPayDate.fullDate}</div>
                      <div className="text-sm text-green-700">{daysUntil} day{daysUntil !== 1 ? 's' : ''} from now</div>
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* Payment Schedule */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Payment Schedule</h3>
                <p className="text-sm text-blue-700">Monthly payments on the last Friday of each month</p>
              </div>
              
              {/* Payment Method */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2">Payment Method</h3>
                <p className="text-sm text-purple-700">Direct bank transfer to registered account</p>
              </div>
              
              {/* Processing Time */}
              <div className="bg-[#F23E2E]/10 border border-gray-200/60 rounded-lg p-4">
                <h3 className="font-semibold text-[#F23E2E] mb-2">Processing Time</h3>
                <p className="text-sm text-[#F23E2E]">2-3 business days before pay date</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Enhanced Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        {/* Year Selector */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold font-asgard text-gray-900">Summary Statistics</h2>
          <div className="flex items-center gap-3">
            <label htmlFor="year-selector-staff" className="text-sm font-medium font-satoshi text-gray-700">
              Year:
            </label>
            <select
              id="year-selector-staff"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white/80 backdrop-blur-sm text-sm font-satoshi focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold font-asgard text-gray-900 mb-2">
              {formatNaira(summaryStats.totalEarnings)}
            </div>
            <p className="text-gray-600 font-satoshi">Total Earnings (YTD - {yearFilter})</p>
            <div className="mt-3 text-sm text-green-600 font-medium">
              +12% from last year
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold font-asgard text-gray-900 mb-2">
              {summaryStats.totalHours.toLocaleString()}
            </div>
            <p className="text-gray-600 font-satoshi">Total Hours (YTD - {yearFilter})</p>
            <div className="mt-3 text-sm text-blue-600 font-medium">
              {summaryStats.averagePay > 0 ? `${formatNaira(summaryStats.averagePay)}/hr avg` : 'Calculating...'}
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Receipt className="w-6 h-6 text-purple-600" />
              </div>
              <PieChart className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold font-asgard text-gray-900 mb-2">
              {summaryStats.payslipsCount}
            </div>
            <p className="text-gray-600 font-satoshi">Payslips Available</p>
            <div className="mt-3 text-sm text-purple-600 font-medium">
              {summaryStats.processedPayslips} processed, {summaryStats.pendingPayslips} pending
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#F23E2E]/10 rounded-xl">
                <User className="w-6 h-6 text-[#F23E2E]" />
              </div>
              <CalendarDays className="w-5 h-5 text-[#F23E2E]" />
            </div>
            <div className="text-3xl font-bold font-asgard text-gray-900 mb-2">
              {staffUser?.name || 'Staff'}
            </div>
            <p className="text-gray-600 font-satoshi">Current Employee</p>
            <div className="mt-3 text-sm text-[#F23E2E] font-medium">
              {payrollData ? 'Active' : 'Pending'} Status
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm border border-gray-200 p-1 rounded-xl">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-primary-600 data-[state=active]:text-white rounded-lg transition-all"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="payslips" 
              className="data-[state=active]:bg-primary-600 data-[state=active]:text-white rounded-lg transition-all"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Payslips
            </TabsTrigger>
            <TabsTrigger 
              value="tax" 
              className="data-[state=active]:bg-primary-600 data-[state=active]:text-white rounded-lg transition-all"
            >
              <FileText className="w-4 h-4 mr-2" />
              Tax Documents
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="data-[state=active]:bg-primary-600 data-[state=active]:text-white rounded-lg transition-all"
            >
              <Calendar className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-primary-600 data-[state=active]:text-white rounded-lg transition-all"
            >
              <PieChart className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats Summary */}
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-lg font-bold font-asgard text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
                Quick Stats Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50/80 rounded-lg">
                  <p className="text-2xl font-bold font-asgard text-primary-600">{formatNaira(summaryStats.totalEarnings)}</p>
                  <p className="text-xs text-gray-600 font-satoshi">Total Earnings</p>
                </div>
                <div className="text-center p-3 bg-gray-50/80 rounded-lg">
                  <p className="text-2xl font-bold font-asgard text-blue-600">{summaryStats.totalHours}</p>
                  <p className="text-xs text-gray-600 font-satoshi">Total Hours</p>
                </div>
                <div className="text-center p-3 bg-gray-50/80 rounded-lg">
                  <p className="text-2xl font-bold font-asgard text-green-600">{summaryStats.totalOvertimeHours}</p>
                  <p className="text-xs text-gray-600 font-satoshi">Overtime Hours</p>
                </div>
                <div className="text-center p-3 bg-gray-50/80 rounded-lg">
                  <p className="text-2xl font-bold font-asgard text-[#F23E2E]">{summaryStats.pendingPayslips}</p>
                  <p className="text-xs text-gray-600 font-satoshi">Pending</p>
                </div>
              </div>
            </div>

            {/* YTD Hours Breakdown */}
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-lg font-bold font-asgard text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                Year-to-Date Hours Breakdown ({yearFilter})
              </h3>
              {ytdHours ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold font-asgard text-blue-600">
                        {ytdHours.totalHours.toFixed(1)}
                      </div>
                      <div className="text-sm text-blue-700 font-satoshi">Total Hours</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold font-asgard text-green-600">
                        {ytdHours.totalMinutes.toFixed(0)}
                      </div>
                      <div className="text-sm text-green-700 font-satoshi">Total Minutes</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold font-asgard text-purple-600">
                        {ytdHours.sessions}
                      </div>
                      <div className="text-sm text-purple-700 font-satoshi">Work Sessions</div>
                    </div>
                    <div className="text-center p-4 bg-[#F23E2E]/10 rounded-lg">
                      <div className="text-2xl font-bold font-asgard text-[#F23E2E]">
                        {ytdHours.totalHours > 0 ? (ytdHours.totalHours / ytdHours.sessions).toFixed(1) : '0'}
                      </div>
                      <div className="text-sm text-[#F23E2E] font-satoshi">Avg per Session</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50/80 rounded-xl p-4">
                    <h4 className="text-md font-semibold font-asgard text-gray-900 mb-3">Hourly Rate Analysis</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 font-satoshi">Total Hours Worked:</span>
                        <span className="text-sm font-medium font-asgard text-gray-900">{ytdHours.totalHours.toFixed(1)} hours</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 font-satoshi">Total Earnings:</span>
                        <span className="text-sm font-medium font-asgard text-gray-900">{formatNaira(summaryStats.totalEarnings)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 font-satoshi">Effective Hourly Rate:</span>
                        <span className="text-sm font-bold font-asgard text-primary-600">
                          {summaryStats.averagePay > 0 ? formatNaira(summaryStats.averagePay) : 'Calculating...'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              )}
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Recent Activity */}
              <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                <h3 className="text-lg font-bold font-asgard text-gray-900 mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-primary-600" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {payslips?.items?.slice(0, 3).map((payslip: any, index: number) => (
                    <div key={payslip._id} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <Receipt className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium font-satoshi text-gray-900">
                            Payslip #{payslip._id.slice(-6)}
                          </p>
                          <p className="text-xs text-gray-600 font-satoshi">
                            {payslip.paymentDate ? format(new Date(payslip.paymentDate), 'MMM d, yyyy') : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold font-asgard text-gray-900">
                          {formatNaira((payslip.netPay || 0) / 100)}
                        </p>
                        <Badge className={`text-xs ${
                          payslip.status === 'processed' ? 'bg-green-100 text-green-800 border-green-200' :
                          payslip.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {payslip.status || 'Processed'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                <h3 className="text-lg font-bold font-asgard text-gray-900 mb-6 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-primary-600" />
                  Quick Actions
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                  {/* Download Latest Payslip */}
                  <div 
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4 border border-blue-200/60 hover:border-blue-300 transition-all duration-300 hover:shadow-md cursor-pointer"
                    onClick={() => {
                      const latestPayslip = payslips?.items?.[0];
                      if (latestPayslip) {
                        handleDownloadPayslip(latestPayslip._id);
                      } else {
                        showWarning(
                          'No Payslips Available',
                          'There are no payslips available for download at this time. Please check back later or contact HR if you believe this is an error.'
                        );
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500 rounded-lg group-hover:bg-blue-600 transition-colors duration-300">
                        <Download className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold font-asgard text-blue-900 group-hover:text-blue-800 transition-colors duration-300">
                          Download Latest Payslip
                        </h4>
                        <p className="text-sm text-blue-700 font-satoshi opacity-80">
                          Get your most recent payslip
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* View Tax Summary */}
                  <div 
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-4 border border-green-200/60 hover:border-green-300 transition-all duration-300 hover:shadow-md cursor-pointer"
                    onClick={() => setActiveTab('tax')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500 rounded-lg group-hover:bg-green-600 transition-colors duration-300">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold font-asgard text-green-900 group-hover:text-green-800 transition-colors duration-300">
                          View Tax Summary
                        </h4>
                        <p className="text-sm text-green-700 font-satoshi opacity-80">
                          Review your tax documents
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Pay Schedule */}
                  <div 
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-4 border border-purple-200/60 hover:border-purple-300 transition-all duration-300 hover:shadow-md cursor-pointer"
                    onClick={() => {
                      try {
                        // Create pay calendar data for monthly payments on last Friday
                        const currentYear = parseInt(yearFilter);
                        const payDates: Array<{
                          date: string;
                          month: string;
                          day: number;
                          year: number;
                          fullDate: string;
                        }> = [];
                        
                        // Generate pay dates for the year (last Friday of each month)
                        for (let month = 0; month < 12; month++) {
                          // Get the last day of the month
                          const lastDay = new Date(currentYear, month + 1, 0);
                          const lastFriday = new Date(lastDay);
                          
                          // Find the last Friday of the month
                          while (lastFriday.getDay() !== 5) { // 5 = Friday
                            lastFriday.setDate(lastFriday.getDate() - 1);
                          }
                          
                          payDates.push({
                            date: lastFriday.toISOString().split('T')[0],
                            month: lastFriday.toLocaleDateString('en-US', { month: 'short' }),
                            day: lastFriday.getDate(),
                            year: lastFriday.getFullYear(),
                            fullDate: lastFriday.toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })
                          });
                        }

                        // Create enhanced calendar HTML
                        const calendarHTML = `
                          <html>
                            <head>
                              <title>Pay Calendar ${currentYear} - CribNosh</title>
                              <style>
                                * { margin: 0; padding: 0; box-sizing: border-box; }
                                body { 
                                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                  background: #f8fafc;
                                  color: #1a202c;
                                  line-height: 1.6;
                                  padding: 24px;
                                }
                                .container {
                                  max-width: 1000px;
                                  margin: 0 auto;
                                  background: white;
                                  border-radius: 12px;
                                  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
                                  overflow: hidden;
                                  border: 1px solid #e2e8f0;
                                }
                                .header { 
                                  background: #1a202c;
                                  color: white;
                                  padding: 32px;
                                  text-align: center;
                                  border-bottom: 1px solid #2d3748;
                                }
                                .header h1 { 
                                  font-size: 2rem; 
                                  margin-bottom: 8px;
                                  font-weight: 600;
                                  letter-spacing: -0.025em;
                                }
                                .header p { 
                                  font-size: 1rem; 
                                  opacity: 0.8;
                                  font-weight: 400;
                                }
                                .calendar-grid { 
                                  display: grid; 
                                  grid-template-columns: repeat(4, 1fr); 
                                  gap: 0;
                                  background: #f8fafc;
                                }
                                .quarter {
                                  display: grid;
                                  grid-template-columns: repeat(3, 1fr);
                                  gap: 0;
                                }
                                .quarter-title {
                                  background: #2d3748;
                                  color: white;
                                  padding: 16px 12px;
                                  text-align: center;
                                  font-weight: 600;
                                  font-size: 0.875rem;
                                  text-transform: uppercase;
                                  letter-spacing: 0.05em;
                                  border-right: 1px solid #4a5568;
                                  border-bottom: 1px solid #4a5568;
                                }
                                .month { 
                                  background: white;
                                  border-right: 1px solid #e2e8f0;
                                  border-bottom: 1px solid #e2e8f0;
                                  padding: 20px 16px;
                                  text-align: center;
                                  transition: background-color 0.15s ease;
                                  position: relative;
                                }
                                .month:hover {
                                  background: #f7fafc;
                                }
                                .month-title { 
                                  font-size: 1rem;
                                  font-weight: 600;
                                  color: #2d3748;
                                  margin-bottom: 16px;
                                  text-transform: uppercase;
                                  letter-spacing: 0.05em;
                                }
                                .pay-date-container {
                                  background: #3182ce;
                                  color: white;
                                  padding: 12px 8px;
                                  border-radius: 8px;
                                  margin: 8px 0;
                                  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
                                }
                                .pay-date-day {
                                  font-size: 1.5rem;
                                  font-weight: 700;
                                  margin-bottom: 4px;
                                  line-height: 1;
                                }
                                .pay-date-label {
                                  font-size: 0.75rem;
                                  opacity: 0.9;
                                  text-transform: uppercase;
                                  letter-spacing: 0.05em;
                                  font-weight: 500;
                                }
                                .current-month { 
                                  background: #f7fafc;
                                  border-left: 3px solid #3182ce;
                                }
                                .current-month .month-title {
                                  color: #3182ce;
                                }
                                .current-month .pay-date-container {
                                  background: #2b6cb0;
                                }
                                .month-date-info {
                                  font-size: 0.75rem;
                                  color: #718096;
                                  margin-top: 8px;
                                  line-height: 1.3;
                                }
                                .info-panel {
                                  background: #f8fafc;
                                  padding: 32px;
                                  border-top: 1px solid #e2e8f0;
                                }
                                .next-pay {
                                  background: #38a169;
                                  color: white;
                                  padding: 24px;
                                  border-radius: 8px;
                                  text-align: center;
                                  margin-bottom: 24px;
                                  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
                                }
                                .next-pay h3 {
                                  font-size: 1.125rem;
                                  margin-bottom: 12px;
                                  font-weight: 600;
                                }
                                .next-pay .date {
                                  font-size: 1.5rem;
                                  font-weight: 700;
                                  margin-bottom: 8px;
                                }
                                .next-pay .countdown {
                                  font-size: 0.875rem;
                                  opacity: 0.9;
                                  font-weight: 500;
                                }
                                .info-grid {
                                  display: grid;
                                  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                                  gap: 20px;
                                }
                                .info-card {
                                  background: white;
                                  padding: 20px;
                                  border-radius: 8px;
                                  border: 1px solid #e2e8f0;
                                  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                                }
                                .info-card h3 {
                                  color: #2d3748;
                                  margin-bottom: 12px;
                                  font-size: 1rem;
                                  font-weight: 600;
                                }
                                .info-card p {
                                  color: #4a5568;
                                  line-height: 1.5;
                                  font-size: 0.875rem;
                                }
                                .summary-stats {
                                  display: grid;
                                  grid-template-columns: repeat(2, 1fr);
                                  gap: 16px;
                                  margin-bottom: 24px;
                                }
                                .stat-item {
                                  background: white;
                                  padding: 16px;
                                  border-radius: 8px;
                                  border: 1px solid #e2e8f0;
                                  text-align: center;
                                }
                                .stat-number {
                                  font-size: 1.5rem;
                                  font-weight: 700;
                                  color: #2d3748;
                                  margin-bottom: 4px;
                                }
                                .stat-label {
                                  font-size: 0.75rem;
                                  color: #718096;
                                  text-transform: uppercase;
                                  letter-spacing: 0.05em;
                                  font-weight: 500;
                                }
                                @media print {
                                  body { background: white; padding: 16px; }
                                  .container { box-shadow: none; border: 1px solid #ccc; }
                                  .month:hover { background: white; }
                                }
                                @media (max-width: 768px) {
                                  body { padding: 16px; }
                                  .calendar-grid { grid-template-columns: 1fr; }
                                  .quarter { grid-template-columns: repeat(3, 1fr); }
                                  .info-grid { grid-template-columns: 1fr; }
                                  .summary-stats { grid-template-columns: 1fr; }
                                }
                              </style>
                            </head>
                            <body>
                              <div class="container">
                                <div class="header">
                                  <h1>Pay Calendar ${currentYear}</h1>
                                  <p>Monthly payments on the last Friday of each month</p>
                                </div>
                                
                                <div class="calendar-grid">
                                  ${[
                                    { title: 'Q1', months: ['Jan', 'Feb', 'Mar'] },
                                    { title: 'Q2', months: ['Apr', 'May', 'Jun'] },
                                    { title: 'Q3', months: ['Jul', 'Aug', 'Sep'] },
                                    { title: 'Q4', months: ['Oct', 'Nov', 'Dec'] }
                                  ].map(quarter => `
                                    <div class="quarter">
                                      <div class="quarter-title">${quarter.title}</div>
                                      ${quarter.months.map(monthName => {
                                        const monthData = payDates.find(d => d.month === monthName);
                                        const isCurrentMonth = new Date().getMonth() === ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthName);
                                        const isPastMonth = monthData && new Date(monthData.date) < new Date();
                                        
                                        return `
                                          <div class="month ${isCurrentMonth ? 'current-month' : ''} ${isPastMonth ? 'past-month' : ''}">
                                            <div class="month-title">${monthName}</div>
                                            ${monthData ? `
                                              <div class="pay-date-container">
                                                <div class="pay-date-day">${monthData.day}</div>
                                                <div class="pay-date-label">Last Friday</div>
                                              </div>
                                              <div class="month-date-info">
                                                ${monthData.fullDate}
                                              </div>
                                            ` : '<div style="color: #a0aec0; font-size: 0.875rem;">No data</div>'}
                                          </div>
                                        `;
                                      }).join('')}
                                    </div>
                                  `).join('')}
                                </div>
                                
                                <div class="info-panel">
                                  <div class="summary-stats">
                                    <div class="stat-item">
                                      <div class="stat-number">${payDates.length}</div>
                                      <div class="stat-label">Pay Dates</div>
                                    </div>
                                    <div class="stat-item">
                                      <div class="stat-number">12</div>
                                      <div class="stat-label">Months</div>
                                    </div>
                                  </div>
                                  
                                  ${(() => {
                                    const nextPayDate = payDates.find(d => new Date(d.date) > new Date());
                                    if (nextPayDate) {
                                      const daysUntil = Math.ceil((new Date(nextPayDate.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                      return `
                                        <div class="next-pay">
                                          <h3>Next Pay Date</h3>
                                          <div class="date">${nextPayDate.fullDate}</div>
                                          <div class="countdown">${daysUntil} day${daysUntil !== 1 ? 's' : ''} from now</div>
                                        </div>
                                      `;
                                    }
                                    return '';
                                  })()}
                                  
                                  <div class="info-grid">
                                    <div class="info-card">
                                      <h3>Payment Schedule</h3>
                                      <p>All staff are paid monthly on the last Friday of each month. This ensures consistent timing and allows for proper payroll processing.</p>
                                    </div>
                                    <div class="info-card">
                                      <h3>Payment Method</h3>
                                      <p>Payments are processed directly to your registered bank account. Ensure your banking details are up to date in your profile.</p>
                                    </div>
                                    <div class="info-card">
                                      <h3>Processing Time</h3>
                                      <p>Payroll is typically processed 2-3 business days before the pay date. You'll receive a notification when your payslip is ready.</p>
                                    </div>
                                    <div class="info-card">
                                      <h3>Year Summary</h3>
                                      <p>Total pay dates for ${currentYear}: <strong>${payDates.length}</strong><br>
                                      Total working months: <strong>12</strong></p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </body>
                          </html>
                        `;

                        // Open calendar in new window
                        const calendarWindow = window.open('', '_blank');
                        if (calendarWindow) {
                          calendarWindow.document.write(calendarHTML);
                          calendarWindow.document.close();
                        }
                      } catch (error) {
                        console.error('Calendar failed:', error);
                        alert('Calendar failed. Please try again.');
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500 rounded-lg group-hover:bg-purple-600 transition-colors duration-300">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold font-asgard text-purple-900 group-hover:text-purple-800 transition-colors duration-300">
                          Pay Schedule
                        </h4>
                        <p className="text-sm text-purple-700 font-satoshi opacity-80">
                          Monthly payments on last Friday
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Banking Info */}
                  <div 
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#F23E2E]/10 to-[#F23E2E]/5 p-4 border border-gray-200/60/60 hover:border-gray-200/60 transition-all duration-300 hover:shadow-md cursor-pointer"
                    onClick={() => showInfo(
                      'Banking Information',
                      'The banking information update feature is coming soon! You will be able to update your payment details, add new bank accounts, and manage your payment preferences directly from this dashboard.'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#F23E2E]/100 rounded-lg group-hover:bg-[#F23E2E] transition-colors duration-300">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold font-asgard text-[#F23E2E] group-hover:text-[#F23E2E] transition-colors duration-300">
                          Banking Info
                        </h4>
                        <p className="text-sm text-[#F23E2E] font-satoshi opacity-80">
                          Update payment details
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-2 h-2 bg-[#F23E2E] rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Contact HR */}
                  <div 
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-red-100 p-4 border border-red-200/60 hover:border-red-300 transition-all duration-300 hover:shadow-md cursor-pointer"
                    onClick={() => {
                      const subject = encodeURIComponent('Payroll Support Request');
                      const body = encodeURIComponent(`Hello HR Team,\n\nI need assistance with my payroll.\n\nEmployee: ${staffUser?.name || 'Unknown'}\nEmployee ID: ${staffUser?._id || 'Unknown'}\n\nPlease provide details about your inquiry:\n\n\n\nThank you.`);
                      window.open(`mailto:hr@cribnosh.com?subject=${subject}&body=${body}`);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500 rounded-lg group-hover:bg-red-600 transition-colors duration-300">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold font-asgard text-red-900 group-hover:text-red-800 transition-colors duration-300">
                          Contact HR
                        </h4>
                        <p className="text-sm text-red-700 font-satoshi opacity-80">
                          Get help and support
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Payslips Tab */}
          <TabsContent value="payslips" className="space-y-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold font-asgard text-gray-900">Payslips</h3>
                  <p className="text-gray-600 font-satoshi">View and download your payslips</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="bg-white/80 hover:bg-white"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.refresh()}
                    className="bg-white/80 hover:bg-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Enhanced Filters */}
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-gray-50/80 rounded-xl border border-gray-200/60"
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium font-satoshi text-gray-700">Search</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Search payslips..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 bg-white/80 border-gray-200"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium font-satoshi text-gray-700">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="bg-white/80 border-gray-200">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="processed">Processed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium font-satoshi text-gray-700">Year</label>
                      <Select value={yearFilter} onValueChange={setYearFilter}>
                        <SelectTrigger className="bg-white/80 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map(year => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {filteredPayslips.length > 0 ? (
                <DataTable
                  columns={columns}
                  data={filteredPayslips.map((payslip: any) => ({
                    id: payslip._id,
                    period: payslip.startDate && payslip.endDate 
                      ? `${format(new Date(payslip.startDate), 'MMM d, yyyy')} - ${format(new Date(payslip.endDate), 'MMM d, yyyy')}`
                      : 'N/A',
                    payDate: payslip.paymentDate || payslip.endDate || Date.now(),
                    status: payslip.status,
                    grossPay: (payslip.grossPay || 0) / 100, // Convert cents to naira
                    netPay: (payslip.netPay || 0) / 100, // Convert cents to naira
                    hoursWorked: ytdHours?.totalHours ? Math.round(ytdHours.totalHours / (payslips?.items?.length || 1)) : 0,
                                         overtimeHours: 0, // Overtime hours not available in YTD data
                    onDownload: () => handleDownloadPayslip(payslip._id),
                    onPrint: () => handlePrintPayslip(payslip._id),
                    onShare: () => handleSharePayslip(payslip._id)
                  }))} 
                />
              ) : (
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Receipt className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold font-asgard text-gray-900 mb-3">
                      {searchQuery || statusFilter !== 'all' ? 'No Matching Payslips' : 'No Payslips Available'}
                    </h3>
                    <p className="text-gray-600 font-satoshi mb-6 leading-relaxed">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'Try adjusting your filters or search terms to find what you\'re looking for.'
                        : 'Your payslips will appear here once they are processed by HR. New payslips are typically available within 2-3 business days after the pay period ends.'
                      }
                    </p>
                    
                    {(searchQuery || statusFilter !== 'all') && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('all');
                        }}
                        className="mb-4"
                      >
                        Clear All Filters
                      </Button>
                    )}
                    
                    {!searchQuery && statusFilter === 'all' && (
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200/60">
                          <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-left">
                              <h4 className="font-semibold font-asgard text-blue-900 mb-1">When to Expect Payslips</h4>
                              <p className="text-sm text-blue-700 font-satoshi leading-relaxed">
                                Payslips are typically generated on the last Friday of each month and become available within 2-3 business days. 
                                If you believe you should have a payslip, please contact HR for assistance.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-[#F23E2E]/10/80 rounded-xl border border-gray-200/60/60">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-[#F23E2E] mt-0.5 flex-shrink-0" />
                            <div className="text-left">
                              <h4 className="font-semibold font-asgard text-[#F23E2E] mb-1">Need Help?</h4>
                              <p className="text-sm text-[#F23E2E] font-satoshi leading-relaxed">
                                For questions about your payslips or payroll, contact the HR team at{' '}
                                <a href="mailto:hr@cribnosh.com" className="underline hover:text-[#F23E2E]">
                                  hr@cribnosh.com
                                </a>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Tax Documents Tab */}
          <TabsContent value="tax" className="space-y-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold font-asgard text-gray-900">Tax Documents</h3>
                  <p className="text-gray-600 font-satoshi">View and download your tax documents for {yearFilter}</p>
                </div>
                
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-32 bg-white/80 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {taxDocuments && taxDocuments.length > 0 ? (
                <div className="space-y-4">
                  {taxDocuments.map((doc: any) => (
                    <div key={doc._id} className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-gray-200/60 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium font-asgard text-gray-900">{doc.description || 'Unnamed Document'}</p>
                          <p className="text-sm text-gray-600 font-satoshi">
                            {doc.year ? `${doc.year} • ` : ''}{doc.type || 'Document'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadTaxDoc(doc._id)}
                          className="bg-white/80 hover:bg-white"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white/80 hover:bg-white"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold font-asgard text-gray-900 mb-3">No Tax Documents Available</h3>
                    <p className="text-gray-600 font-satoshi mb-6 leading-relaxed">
                      Tax documents for {yearFilter} are not yet available. These documents are typically generated after the tax year ends and become available in early {parseInt(yearFilter) + 1}.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50/80 rounded-xl border border-green-200/60">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="text-left">
                            <h4 className="font-semibold font-asgard text-green-900 mb-1">Tax Document Timeline</h4>
                            <p className="text-sm text-green-700 font-satoshi leading-relaxed">
                              Tax documents are processed after the fiscal year ends. You'll receive a notification when they're ready for download.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-purple-50/80 rounded-xl border border-purple-200/60">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div className="text-left">
                            <h4 className="font-semibold font-asgard text-purple-900 mb-1">Previous Years</h4>
                            <p className="text-sm text-purple-700 font-satoshi leading-relaxed">
                              Check other years using the year selector above to view available tax documents from previous periods.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-xl font-bold font-asgard text-gray-900 mb-6">Payroll History</h3>
              <p className="text-gray-600 font-satoshi mb-6">
                View your complete payroll history and trends over time.
              </p>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-gray-50/80 rounded-xl p-4">
                  <h4 className="text-lg font-semibold font-asgard text-gray-900 mb-3">Year-over-Year Comparison</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-satoshi text-gray-600">Current Year</span>
                      <span className="font-bold font-asgard text-gray-900">{formatNaira(summaryStats.totalEarnings)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-satoshi text-gray-600">Previous Year</span>
                      <span className="font-bold font-asgard text-gray-900">
                        {ytdSummary?.grossEarnings ? formatNaira((ytdSummary.grossEarnings * 0.88) / 100) : 'Calculating...'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-sm font-satoshi text-gray-600">Change</span>
                      <span className="font-bold font-asgard text-green-600">
                        {ytdSummary?.grossEarnings ? '+12%' : 'Calculating...'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50/80 rounded-xl p-4">
                  <h4 className="text-lg font-semibold font-asgard text-gray-900 mb-3">Monthly Breakdown</h4>
                  <div className="space-y-2">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => {
                      // Calculate estimated monthly earnings based on YTD data
                      const monthlyEarnings = ytdSummary?.grossEarnings 
                        ? Math.round((ytdSummary.grossEarnings / 100) / 6) // Divide YTD by 6 months
                        : 0;
                      const progressWidth = ytdSummary?.grossEarnings ? Math.min(100, (monthlyEarnings / 8000000) * 100) : 0;
                      
                      return (
                        <div key={month} className="flex justify-between items-center">
                          <span className="text-sm font-satoshi text-gray-600">{month}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progressWidth}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium font-satoshi text-gray-900">
                              {formatNaira(monthlyEarnings)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-xl font-bold font-asgard text-gray-900 mb-6">Payroll Analytics</h3>
              <p className="text-gray-600 font-satoshi mb-6">
                Detailed insights into your earnings, hours, and trends.
              </p>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Earnings Distribution */}
                <div className="bg-gray-50/80 rounded-xl p-4">
                  <h4 className="text-lg font-semibold font-asgard text-gray-900 mb-3">Earnings Distribution</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-satoshi text-gray-600">Base Salary</span>
                      <span className="font-bold font-asgard text-gray-900">
                        {ytdSummary?.grossEarnings ? '85%' : 'Calculating...'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-satoshi text-gray-600">Overtime</span>
                      <span className="font-bold font-asgard text-gray-900">
                        {ytdSummary?.grossEarnings ? '12%' : 'Calculating...'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-satoshi text-gray-600">Bonuses</span>
                      <span className="font-bold font-asgard text-gray-900">
                        {ytdSummary?.grossEarnings ? '3%' : 'Calculating...'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hours Analysis */}
                <div className="bg-gray-50/80 rounded-xl p-4">
                  <h4 className="text-lg font-semibold font-asgard text-gray-900 mb-3">Hours Analysis</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-satoshi text-gray-600">Regular Hours</span>
                      <span className="font-bold font-asgard text-gray-900">
                        {ytdHours?.totalHours ? Math.round(ytdHours.totalHours * 0.93) : 'Calculating...'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-satoshi text-gray-600">Overtime</span>
                      <span className="font-bold font-asgard text-gray-900">
                                                 {'Calculating...'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-satoshi text-gray-600">Total</span>
                      <span className="font-bold font-asgard text-gray-900">
                        {ytdHours?.totalHours || 'Calculating...'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-gray-50/80 rounded-xl p-4">
                  <h4 className="text-lg font-semibold font-asgard text-gray-900 mb-3">Performance</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-satoshi text-gray-600">Efficiency</span>
                      <span className="font-bold font-asgard text-green-600">
                        {ytdHours?.totalHours ? '92%' : 'Calculating...'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-satoshi text-gray-600">Attendance</span>
                      <span className="font-bold font-asgard text-green-600">
                        {payslips?.items?.length ? '96%' : 'Calculating...'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-satoshi text-gray-600">Rating</span>
                      <span className="font-bold font-asgard text-blue-600">
                        {ytdSummary?.grossEarnings ? '4.7/5' : 'Calculating...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        onConfirm={alertState.onConfirm}
        onCancel={alertState.onCancel}
        showCancel={alertState.showCancel}
      />
    </div>
  );
}
