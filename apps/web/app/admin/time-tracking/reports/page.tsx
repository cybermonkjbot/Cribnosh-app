"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Users,
  Calendar,
  Download,
  Filter,
  BarChart2,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  FileSpreadsheet,
  Eye,
  Clock as ClockIcon,
  User,
  CheckCircle,
  AlertTriangle,
  Search,
  Trash2
} from 'lucide-react';

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

export default function TimeTrackingReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New report form
  const [newReport, setNewReport] = useState({
    name: '',
    type: 'weekly' as const,
    startDate: '',
    endDate: '',
    users: [] as string[],
    departments: [] as string[],
    projects: [] as string[]
  });

  // Fetch data - all args are optional, so empty object is fine
  const reports = useQuery(api.queries.timeTracking.getTimeTrackingReports, {});
  const stats = useQuery(api.queries.timeTracking.getTimeTrackingStats, {});
  const users = useQuery(api.queries.users.getUsersForAdmin, {});
  const departments = useQuery(api.queries.timeTracking.getDepartments, {});

  // Mutations
  const generateReport = useMutation(api.mutations.timeTracking.generateTimeTrackingReport);
  const deleteReport = useMutation(api.mutations.timeTracking.deleteTimeTrackingReport);
  const downloadReport = useMutation(api.mutations.timeTracking.downloadTimeTrackingReport);

  const handleGenerateReport = async () => {
    if (!newReport.name.trim()) {
      setError('Report name is required');
      return;
    }

    setIsGenerating(true);
    try {
      await generateReport({
        name: newReport.name,
        type: newReport.type,
        startDate: new Date(newReport.startDate).getTime(),
        endDate: new Date(newReport.endDate).getTime(),
        filters: {
          users: newReport.users,
          departments: newReport.departments,
          projects: newReport.projects
        }
      });
      
      setNewReport({
        name: '',
        type: 'weekly',
        startDate: '',
        endDate: '',
        users: [],
        departments: [],
        projects: []
      });
      setSuccess('Report generated successfully');
      setError(null);
    } catch (err) {
      setError('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      try {
        // Type assertion needed because Convex generates types that expect Id<"reports">
        // but the reportId from the query is a string
        await deleteReport({ reportId: reportId as unknown as Id<"reports"> });
        setSuccess('Report deleted successfully');
        setError(null);
      } catch (err) {
        setError('Failed to delete report');
      }
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      await downloadReport({ reportId });
      setSuccess('Report download started');
      setError(null);
    } catch (err) {
      setError('Failed to download report');
    }
  };

  const filteredReports = reports?.filter((report: any) => {
    const matchesSearch = 
      report.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    
    return matchesSearch && matchesType;
  }).sort((a: any, b: any) => {
    switch (sortBy) {
      case 'recent':
        return b.generatedAt - a.generatedAt;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'type':
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  }) || [];

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'daily':
        return <Badge className="bg-blue-100 text-blue-800">Daily</Badge>;
      case 'weekly':
        return <Badge className="bg-green-100 text-green-800">Weekly</Badge>;
      case 'monthly':
        return <Badge className="bg-purple-100 text-purple-800">Monthly</Badge>;
      case 'custom':
        return <Badge className="bg-orange-100 text-orange-800">Custom</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Time Tracking Reports</h1>
          <p className="text-gray-600 font-satoshi mt-2">Generate and analyze time tracking reports</p>
        </div>
        <Button
          onClick={() => {/* Open generate report modal */}}
          className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(stats?.totalHours || 0)}</p>
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
                <p className="text-sm text-gray-600">Productivity Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.productivityScore || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{reports?.length || 0}</p>
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

      {/* Generate Report Form */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Report</CardTitle>
          <CardDescription>Create a custom time tracking report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Report Name</label>
              <Input
                value={newReport.name}
                onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter report name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Report Type</label>
              <Select value={newReport.type} onValueChange={(value) => setNewReport(prev => ({ ...prev, type: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <Input
                type="date"
                value={newReport.startDate}
                onChange={(e) => setNewReport(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <Input
                type="date"
                value={newReport.endDate}
                onChange={(e) => setNewReport(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateReport} 
              disabled={isGenerating}
              className="bg-[#F23E2E] hover:bg-[#F23E2E]/90"
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search reports..."
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
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
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
          </SelectContent>
        </Select>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report: any) => (
          <Card key={report._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900">{report.name}</h4>
                    {getTypeBadge(report.type)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Period: {new Date(report.period.start).toLocaleDateString()} - {new Date(report.period.end).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {report.generatedBy}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(report.generatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {formatDuration(report.data.totalHours)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedReport(report._id)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadReport(report._id)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteReport(report._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Report Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{report.data.totalSessions}</p>
                  <p className="text-sm text-gray-600">Sessions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatDuration(report.data.averageSessionDuration)}
                  </p>
                  <p className="text-sm text-gray-600">Avg Session</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{report.data.productivityScore}%</p>
                  <p className="text-sm text-gray-600">Productivity</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{report.data.topUsers.length}</p>
                  <p className="text-sm text-gray-600">Top Users</p>
                </div>
              </div>

              {/* Top Users */}
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900">Top Performers</h5>
                <div className="space-y-1">
                  {report.data.topUsers.slice(0, 3).map((user: any, index: number) => (
                    <div key={user.userId} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-[#F23E2E]/10 rounded-full flex items-center justify-center text-xs font-medium text-[#F23E2E]">
                          {index + 1}
                        </span>
                        <span className="text-gray-900">{user.userName}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600">{formatDuration(user.totalHours)}</span>
                        <span className="text-gray-500">{user.sessions} sessions</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-600">Generate your first time tracking report to get started</p>
          </CardContent>
        </Card>
      )}

      {/* Top Performers */}
      {stats?.topPerformers && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#F23E2E]" />
              Top Performers
            </CardTitle>
            <CardDescription>Users with highest productivity scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topPerformers.map((performer: any, index: number) => (
                <div key={performer.userId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#F23E2E]/10 rounded-full flex items-center justify-center">
                      <span className="text-[#F23E2E] font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{performer.userName}</p>
                      <p className="text-sm text-gray-600">{formatDuration(performer.totalHours)} total</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{performer.productivity}%</p>
                    <p className="text-sm text-gray-600">Productivity</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {stats?.recentActivity && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#F23E2E]" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.userName}</p>
                    <p className="text-xs text-gray-600">{activity.action}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
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
