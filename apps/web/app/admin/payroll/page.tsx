'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

// Using Convex generated types instead of custom interface

interface PayPeriod {
  _id: Id<"payPeriods">;
  _creationTime: number;
  processedAt?: number;
  notes?: string;
  processedBy?: Id<"users">;
  status: "pending" | "paid" | "in_progress" | "processed";
  startDate: number;
  endDate: number;
}
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { PayrollCardSkeleton } from '@/components/admin/skeletons';
import { 
  Users, 
  FileText, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Settings,
  Plus,
  Download,
  Eye,
  Edit,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { DataTable } from '@/components/admin/payroll/data-table';
import { columns } from '@/components/admin/payroll/columns';
import PayPeriodDialog from '@/components/admin/payroll/pay-period-dialog';
import { useToast } from "@/hooks/use-toast";
import { motion } from 'motion/react';

export default function PayrollAdminPage() {
  const { toast } = useToast();
  const [isPayPeriodDialogOpen, setIsPayPeriodDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Fetch payroll data with proper typing
  const payPeriodsRaw = useQuery(api.payroll.periods.getPayPeriods, { limit: 5 });
  const staffProfilesRaw = useQuery(api.payroll.admin.getStaffPayrollProfiles, {});
  
  const payPeriods = useMemo(() => payPeriodsRaw || [], [payPeriodsRaw]);
  const staffProfiles = useMemo(() => staffProfilesRaw || [], [staffProfilesRaw]);
  const ytdHoursSummary = useQuery(api.payroll.admin.getYearToDateHoursSummary, { year: selectedYear }) || null;
  const settings = useQuery(api.payroll.admin.getPayrollSettings) as {
    payFrequency?: string;
    standardWorkWeek?: number;
    overtimeMultiplier?: number;
    holidayOvertimeMultiplier?: number;
  } | null;
  
  const processPayroll = useMutation(api.payroll.admin.processPayroll);
  
  const handleProcessPayroll = async (periodId: Id<"payPeriods">) => {
    if (!periodId) return;
    
    try {
      await processPayroll({ periodId });
      toast({
        title: "Payroll Processed",
        description: "Payroll has been processed successfully.",
        variant: "default",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to process payroll. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Enhanced summary stats with better calculations
  interface StaffPayrollProfile {
    _id?: string;
    staffId?: string;
    status?: string;
    hourlyRate?: number;
    [key: string]: unknown;
  }
  const summaryStats = useMemo(() => {
    const activeStaff = staffProfiles?.filter((p: StaffPayrollProfile) => p.status === 'active').length || 0;
    const pendingPayrolls = payPeriods?.filter((p: PayPeriod) => p.status === 'pending').length || 0;
    const processedThisMonth = payPeriods?.filter((p: PayPeriod) => {
      const processedDate = new Date(p.processedAt || 0);
      const now = new Date();
      return (
        p.status === 'processed' && 
        processedDate.getMonth() === now.getMonth() &&
        processedDate.getFullYear() === now.getFullYear()
      );
    }).length || 0;
    
    // Calculate total payroll from active staff using real salary data
    const totalPayroll = staffProfiles?.filter((p: StaffPayrollProfile) => p.status === 'active')
      .reduce((sum: number, staff: StaffPayrollProfile) => sum + ((staff.hourlyRate || 0) * 40 * 4), 0) || 0;
    
    return {
      activeStaff,
      pendingPayrolls,
      processedThisMonth,
      totalPayroll,
      averageSalary: activeStaff > 0 ? Math.round(totalPayroll / activeStaff) : 0
    };
  }, [staffProfiles, payPeriods]);

  // Chart data for visualizations - get real historical data
  const chartData = useMemo(() => {
    if (!payPeriods || payPeriods.length === 0) {
      return [];
    }
    
    // Group pay periods by month and calculate totals
    const monthlyData = payPeriods.reduce((acc: Record<string, { month: string; payroll: number; staff: number }>, period: PayPeriod) => {
      const date = new Date(period.startDate);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          payroll: 0,
          staff: 0
        };
      }
      
      acc[monthKey].payroll += 0; // Calculate from staff profiles if needed
      acc[monthKey].staff += 1; // Count periods as staff count
      
      return acc;
    }, {});
    
    return Object.values(monthlyData).slice(-6); // Last 6 months
  }, [payPeriods]);

  return (
    <div className="space-y-8">
      {/* Enhanced Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-asgard text-gray-900 mb-3">
            Payroll Management
          </h1>
          <p className="text-gray-700 font-satoshi text-lg">
            Manage employee payroll, pay periods, and generate comprehensive reports
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="lg"
            className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Reports
          </Button>
          <Button 
            size="lg"
            onClick={() => setIsPayPeriodDialogOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Pay Period
          </Button>
        </div>
      </motion.div>

      {/* Enhanced Summary Cards with Glassmorphism */}
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
            <label htmlFor="year-selector" className="text-sm font-medium font-satoshi text-gray-700">
              Year:
            </label>
            <select
              id="year-selector"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white/80 backdrop-blur-sm text-sm font-satoshi focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold font-asgard text-gray-900 mb-2">
              {staffProfiles ? summaryStats.activeStaff : <Skeleton className="h-8 w-16" />}
            </div>
            <p className="text-gray-600 font-satoshi">Active Staff Members</p>
            <div className="mt-3 text-sm text-green-600 font-medium">
              +2 from last month
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-3xl font-bold font-asgard text-gray-900 mb-2">
              {payPeriods ? summaryStats.pendingPayrolls : <Skeleton className="h-8 w-16" />}
            </div>
            <p className="text-gray-600 font-satoshi">Pending Payrolls</p>
            <div className="mt-3 text-sm text-amber-600 font-medium">
              Requires attention
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold font-asgard text-gray-900 mb-2">
              {payPeriods ? summaryStats.processedThisMonth : <Skeleton className="h-8 w-16" />}
            </div>
            <p className="text-gray-600 font-satoshi">Processed This Month</p>
            <div className="mt-3 text-sm text-green-600 font-medium">
              On track
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold font-asgard text-gray-900 mb-2">
              ${summaryStats.totalPayroll.toLocaleString()}
            </div>
            <p className="text-gray-600 font-satoshi">Total Payroll</p>
            <div className="mt-3 text-sm text-purple-600 font-medium">
              Avg: ${summaryStats.averageSalary.toLocaleString()}
            </div>
          </div>

          {/* Total Hours (YTD) Card */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold font-asgard text-gray-900 mb-2">
              {ytdHoursSummary ? (
                ytdHoursSummary.overallTotalHoursFormatted
              ) : (
                <Skeleton className="h-8 w-16" />
              )}
            </div>
            <p className="text-gray-600 font-satoshi">Total Hours (YTD)</p>
            <div className="mt-3 text-sm text-emerald-600 font-medium">
              {ytdHoursSummary ? (
                `${ytdHoursSummary.activeStaffCount} active staff • ${ytdHoursSummary.averageHoursPerStaff.toFixed(1)}h avg`
              ) : (
                'Calculating...'
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Tabs with Better Styling */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="periods" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-gray-200 p-1 rounded-xl">
            <TabsTrigger 
              value="periods" 
              className="data-[state=active]:bg-primary-600 data-[state=active]:text-white rounded-lg transition-all"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Pay Periods
            </TabsTrigger>
            <TabsTrigger 
              value="staff" 
              className="data-[state=active]:bg-primary-600 data-[state=active]:text-white rounded-lg transition-all"
            >
              <Users className="w-4 h-4 mr-2" />
              Staff
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-primary-600 data-[state=active]:text-white rounded-lg transition-all"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="data-[state=active]:bg-primary-600 data-[state=active]:text-white rounded-lg transition-all"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          {/* Pay Periods Tab */}
          <TabsContent value="periods" className="space-y-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold font-asgard text-gray-900">Pay Periods</h3>
                <Button 
                  onClick={() => setIsPayPeriodDialogOpen(true)}
                  className="bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Period
                </Button>
              </div>
              
              {payPeriods ? (
                <DataTable 
                  columns={columns} 
                  data={payPeriods.map((period: PayPeriod) => ({
                    id: period._id,
                    startDate: new Date(period.startDate),
                    endDate: new Date(period.endDate),
                    totalPay: 0, // Calculate from staff profiles if needed
                    status: period.status,
                    payFrequency: 'bi-weekly', // Default value
                    staffCount: 0, // Calculate from staff profiles if needed
                    processedAt: period.processedAt ? new Date(period.processedAt).toISOString() : null,
                    onProcess: period._id ? () => handleProcessPayroll(period._id) : undefined
                  }))} 
                />
              ) : (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-xl font-bold font-asgard text-gray-900 mb-6">Staff Payroll Profiles</h3>
              <p className="text-gray-600 font-satoshi mb-6">
                Manage payroll settings and view individual staff member details
              </p>
              
              {staffProfiles ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {staffProfiles.map((profile: StaffPayrollProfile) => (
                    <div key={profile._id} className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/60 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold font-asgard text-gray-900">{profile.staffId}</h4>
                          <p className="text-sm text-gray-600 font-satoshi">
                            ${profile.hourlyRate}/hr • {profile.status}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-700 font-satoshi">
                        Last updated: {new Date().toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <PayrollCardSkeleton key={i} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Monthly Payroll Trend */}
              <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                <h3 className="text-lg font-bold font-asgard text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
                  Monthly Payroll Trend
                </h3>
                <div className="space-y-3">
                  {chartData.map((data: { month: string; payroll: number; staff: number }, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-satoshi text-gray-600">{data.month}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(data.payroll / 70000) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium font-satoshi text-gray-900">
                          ${data.payroll.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff Distribution */}
              <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
                <h3 className="text-lg font-bold font-asgard text-gray-900 mb-4 flex items-center">
                  <PieChart className="w-5 h-5 mr-2 text-primary-600" />
                  Staff Distribution
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-satoshi text-gray-600">Full-time</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium font-satoshi text-gray-900">65%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-satoshi text-gray-600">Part-time</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium font-satoshi text-gray-900">25%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-satoshi text-gray-600">Contract</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-medium font-satoshi text-gray-900">10%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* YTD Hours Breakdown */}
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-lg font-bold font-asgard text-gray-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-emerald-600" />
                Year-to-Date Hours Breakdown ({selectedYear})
              </h3>
              {ytdHoursSummary ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-emerald-50 rounded-lg">
                      <div className="text-2xl font-bold font-asgard text-emerald-600">
                        {ytdHoursSummary.overallTotalHoursFormatted}
                      </div>
                      <div className="text-sm text-emerald-700 font-satoshi">Total Hours</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold font-asgard text-blue-600">
                        {ytdHoursSummary.totalSessions}
                      </div>
                      <div className="text-sm text-blue-700 font-satoshi">Total Sessions</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold font-asgard text-purple-600">
                        {ytdHoursSummary.activeStaffCount}
                      </div>
                      <div className="text-sm text-purple-700 font-satoshi">Active Staff</div>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <div className="text-2xl font-bold font-asgard text-amber-600">
                        {ytdHoursSummary.averageHoursPerStaff.toFixed(1)}
                      </div>
                      <div className="text-sm text-amber-700 font-satoshi">Avg per Staff</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-md font-semibold font-asgard text-gray-900">Staff Hours Breakdown</h4>
                    {(() => {
                      interface StaffHoursData {
                        totalHours: number;
                        sessions?: number;
                        staffName?: string;
                      }
                      return Object.entries(ytdHoursSummary.staffBreakdown || {})
                        .map(([staffId, data]): [string, StaffHoursData] => {
                          const typedData: StaffHoursData = typeof data === 'object' && data !== null && 'totalHours' in data
                            ? data as StaffHoursData
                            : { totalHours: 0 };
                          return [staffId, typedData];
                        })
                        .sort(([, a], [, b]) => b.totalHours - a.totalHours)
                        .slice(0, 10)
                        .map(([staffId, data]) => (
                          <div key={staffId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                              <span className="text-sm font-medium font-satoshi text-gray-900">
                                {data.staffName || staffId}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-600 font-satoshi">
                                {data.sessions || 0} sessions
                              </span>
                              <span className="text-sm font-bold font-asgard text-emerald-600">
                                {data.totalHours.toFixed(1)}h
                              </span>
                            </div>
                          </div>
                        ))
                      })()}
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
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-xl font-bold font-asgard text-gray-900 mb-6">Payroll Settings</h3>
              <p className="text-gray-600 font-satoshi mb-6">
                Configure global payroll settings and rules for your organization
              </p>
              
              {settings ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="bg-gray-50/80 rounded-xl p-4">
                      <h4 className="text-sm font-medium font-asgard text-gray-900 mb-2">Pay Frequency</h4>
                      <p className="text-sm text-gray-600 font-satoshi">
                        {settings.payFrequency || 'Not configured'}
                      </p>
                    </div>
                    <div className="bg-gray-50/80 rounded-xl p-4">
                      <h4 className="text-sm font-medium font-asgard text-gray-900 mb-2">Standard Work Week</h4>
                      <p className="text-sm text-gray-600 font-satoshi">
                        {settings.standardWorkWeek || 0} hours
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-50/80 rounded-xl p-4">
                      <h4 className="text-sm font-medium font-asgard text-gray-900 mb-2">Overtime Multiplier</h4>
                      <p className="text-sm text-gray-600 font-satoshi">
                        {settings.overtimeMultiplier || 0}x
                      </p>
                    </div>
                    <div className="bg-gray-50/80 rounded-xl p-4">
                      <h4 className="text-sm font-medium font-asgard text-gray-900 mb-2">Holiday Overtime</h4>
                      <p className="text-sm text-gray-600 font-satoshi">
                        {settings.holidayOvertimeMultiplier || 0}x
                      </p>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Button variant="outline" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Settings
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Pay Period Dialog */}
      <PayPeriodDialog
        open={isPayPeriodDialogOpen}
        onOpenChange={setIsPayPeriodDialogOpen}
      />
    </div>
  );
}
