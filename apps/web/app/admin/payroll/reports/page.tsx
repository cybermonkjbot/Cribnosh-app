'use client';

import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';

import { DataTable } from "@/components/admin/payroll/data-table";
import { columns } from "@/components/admin/payroll/reports/columns";
import { PayrollReportsChartSkeleton, PayrollReportsSummarySkeleton, PayrollReportsTableSkeleton } from "@/components/admin/skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, CartesianGrid, BarChart as RechartsBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Calendar } from '@/components/ui/calendar';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import { BarChart as BarChartIcon, CalendarIcon, Clock, Download, FileText, List, PoundSterling, Users } from 'lucide-react';
import { useAdminUser } from '../../AdminUserProvider';

interface TimeTrackingReport {
  _id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  period: {
    start: number;
    end: number;
  };
  generatedAt: number;
  generatedBy: string;
  data: {
    totalHours: number;
    totalSessions: number;
    averageSessionDuration: number;
    productivityScore: number;
    topUsers: {
      userId: string;
      userName: string;
      totalHours: number;
      sessions: number;
    }[];
    hourlyBreakdown: {
      hour: number;
      totalHours: number;
      activeUsers: number;
    }[];
    dailyBreakdown: {
      date: string;
      totalHours: number;
      sessions: number;
      productivity: number;
    }[];
    projectBreakdown: {
      projectId: string;
      projectName: string;
      totalHours: number;
      percentage: number;
    }[];
    departmentBreakdown: {
      department: string;
      totalHours: number;
      averageHours: number;
      users: number;
    }[];
  };
  filters: {
    users?: string[];
    departments?: string[];
    projects?: string[];
    dateRange?: {
      start: number;
      end: number;
    };
  };
}

interface TimeTrackingStats {
  totalUsers: number;
  activeUsers: number;
  totalHours: number;
  averageHoursPerUser: number;
  productivityScore: number;
  topPerformers: {
    userId: string;
    userName: string;
    totalHours: number;
    productivity: number;
  }[];
  recentActivity: {
    userId: string;
    userName: string;
    action: string;
    timestamp: number;
  }[];
}

export default function PayrollReportsPage() {
  const { sessionToken } = useAdminUser();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });

  // Type-safe handler for date range selection
  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if (range) {
      setDateRange({
        from: range.from,
        to: range.to
      });
    }
  };

  // Get the selected date range for the Calendar component
  const selectedDateRange = {
    from: dateRange?.from,
    to: dateRange?.to
  };

  const [department, setDepartment] = useState<string>('all');
  const [departments, setDepartments] = useState<{ value: string; label: string }[]>([]);

  // Define types for the API responses
  interface PayrollSummary {
    totalPayroll?: number;
    totalEmployees?: number;
    totalHours?: number;
    totalOvertime?: number;
    byDepartment?: Record<string, any>;
    byPayPeriod?: Record<string, any>;
  }

  interface PayrollDetails {
    period: {
      _id: Id<"payPeriods">;
      _creationTime: number;
      notes?: string;
      processedAt?: number;
      processedBy?: Id<"users">;
      status: "pending" | "paid" | "in_progress" | "processed";
      startDate: number;
      endDate: number;
    } | null;
    employeeName: string;
    department: string;
    hoursWorked: number;
    overtimeHours: number;
    regularPay: number;
    overtimePay: number;
    totalPay: number;
    netPay: number;
  }

  // Fetch summary report data with proper typing
  const summary = useQuery(api.payroll.reports.getPayrollSummary,
    dateRange?.from && dateRange.to
      ? {
        startDate: dateRange.from.getTime(),
        endDate: dateRange.to.getTime(),
        department: department !== 'all' ? department : undefined,
      }
      : 'skip'
  ) as PayrollSummary | null;

  // Fetch detailed report data with proper typing
  const details = useQuery(api.payroll.reports.getPayrollDetails,
    dateRange?.from && dateRange.to
      ? {
        startDate: dateRange.from.getTime(),
        endDate: dateRange.to.getTime(),
        department: department !== 'all' ? department : undefined,
      }
      : 'skip'
  ) as unknown as PayrollDetails[] | null;

  const isLoadingSummary = summary === undefined;
  const isLoadingDetails = details === undefined;

  // Fetch departments from database
  const departmentsQuery = useQuery(api.queries.timeTracking.getDepartments, sessionToken ? { sessionToken } : 'skip');

  useEffect(() => {
    if (departmentsQuery) {
      const depts = [
        { value: 'all', label: 'All Departments' },
        ...departmentsQuery.map((dept: { id: string; name: string }) => ({
          value: dept.id,
          label: dept.name
        }))
      ];
      setDepartments(depts);
    }
  }, [departmentsQuery]);

  // Format data for charts with proper typing
  interface DepartmentData {
    name: string;
    payroll: number;
    employees: number;
    hours: number;
    overtime: number;
  }

  const departmentData: DepartmentData[] = summary && 'byDepartment' in summary && summary.byDepartment
    ? Object.entries(summary.byDepartment).map(([dept, data]: [string, any]) => ({
      name: dept,
      payroll: data.payroll || 0,
      employees: data.employees || 0,
      hours: data.hours || 0,
      overtime: data.overtime || 0,
    }))
    : [];

  interface PeriodData {
    name: string;
    payroll: number;
    employees: number;
  }

  const periodData: PeriodData[] = summary && 'byPayPeriod' in summary && summary.byPayPeriod
    ? Object.entries(summary.byPayPeriod)
      .map(([_, data]: [string, any]) => ({
        name: `${format(new Date(data.startDate), 'MMM d')} - ${format(new Date(data.endDate), 'MMM d, yyyy')}`,
        payroll: data.payroll || 0,
        employees: data.employees || 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  // Handle export
  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: "Error",
        description: "Please select a date range",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/payroll/export?format=${format}&start=${dateRange.from.toISOString()}&end=${dateRange.to.toISOString()}${department !== 'all' ? `&department=${department}` : ''}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Payroll report exported as ${format.toUpperCase()}`,
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export payroll report",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-[18px]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Reports</h1>
          <p className="text-muted-foreground">
            Generate and analyze payroll reports
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="min-w-[250px]">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={selectedDateRange}
                  onSelect={handleDateRangeSelect}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.value} value={dept.value}>
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">
            <BarChartIcon className="h-4 w-4 mr-2" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="details">
            <List className="h-4 w-4 mr-2" />
            Detailed Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          {isLoadingSummary ? (
            <PayrollReportsSummarySkeleton />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Payroll
                  </CardTitle>
                  <PoundSterling className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${summary?.totalPayroll?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dateRange?.from && dateRange?.to
                      ? `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`
                      : 'Select date range'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Employees
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summary?.totalEmployees || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {summary?.totalHours?.toFixed(1) || '0'} total hours
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Overtime
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summary?.totalOvertime?.toFixed(1) || '0'} hours
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {summary?.totalOvertime ?
                      `$${(summary.totalOvertime * 22.5).toFixed(2)}` :
                      '$0.00'} total overtime pay
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Average Pay
                  </CardTitle>
                  <PoundSterling className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${summary?.totalEmployees && summary?.totalPayroll !== undefined
                      ? (summary.totalPayroll / summary.totalEmployees).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })
                      : '0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    per employee
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Payroll by Department</CardTitle>
                <CardDescription>
                  Total payroll amount by department
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoadingSummary ? (
                  <PayrollReportsChartSkeleton />
                ) : departmentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={departmentData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip
                        formatter={(value: any) => [`$${(Number(value) || 0).toLocaleString()}`, 'Payroll']}
                        labelFormatter={(label) => `Department: ${label}`}
                      />
                      <Bar dataKey="payroll" fill="#8884d8" name="Payroll" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No data available for the selected filters
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payroll Over Time</CardTitle>
                <CardDescription>
                  Payroll amount by pay period
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoadingSummary ? (
                  <PayrollReportsChartSkeleton />
                ) : periodData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={periodData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any) => [`$${(Number(value) || 0).toLocaleString()}`, 'Payroll']}
                        labelFormatter={(label) => `Period: ${label}`}
                      />
                      <Bar dataKey="payroll" fill="#82ca9d" name="Payroll" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No data available for the selected filters
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Details</CardTitle>
              <CardDescription>
                Detailed payroll information for each employee
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDetails ? (
                <PayrollReportsTableSkeleton rowCount={5} />
              ) : details && details.length > 0 ? (
                <DataTable
                  columns={columns}
                  data={details}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-medium">No payroll data found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters or select a different date range
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
