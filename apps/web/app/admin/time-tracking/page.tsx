'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  Users, 
  Calendar, 
  Filter, 
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Edit,
  Trash,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Download,
  User,
  Target,
  Activity,
  PieChart
} from 'lucide-react';
import { EmptyState } from '@/components/admin/empty-state';
import { motion } from 'motion/react';
import { TimeTrackingTableSkeleton } from '@/components/admin/skeletons';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

type Session = {
  _id: Id<'workSessions'>;
  staffId: Id<'users'>;
  clockInTime: number;
  clockOutTime?: number;
  duration?: number;
  status: 'active' | 'completed' | 'paused' | 'adjusted';
  notes?: string;
};

export default function AdminTimeTrackingPage() {
  const { sessionToken } = useAdminUser();
  const [staffId, setStaffId] = useState<string>('');
  const [status, setStatus] = useState<string>('all');
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(50);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; sessionId: Id<'workSessions'> | null }>({
    isOpen: false,
    sessionId: null,
  });

  const filters = useMemo(() => ({
    staffId: staffId ? (staffId as Id<'users'>) : undefined,
    status: status && status !== 'all' ? (status as Session['status']) : undefined,
    startDate: start ? new Date(start).getTime() : undefined,
    endDate: end ? new Date(end).getTime() : undefined,
    skip: page * limit,
    limit,
    sessionToken: sessionToken || undefined,
  }), [staffId, status, start, end, page, limit, sessionToken]);

  const list = useQuery(api.queries.workSessions.listSessionsAdmin, sessionToken ? filters : "skip") as
    | { total: number; results: Session[] }
    | undefined;

  const adjustSession = useMutation(api.mutations.workSessions.adjustSession);
  const deleteSession = useMutation(api.mutations.workSessions.deleteSession);

  const confirmDelete = async () => {
    if (!deleteConfirm.sessionId) return;
    try {
      setError(null);
      await deleteSession({ sessionId: deleteConfirm.sessionId });
      setSuccess('Session deleted successfully');
      setDeleteConfirm({ isOpen: false, sessionId: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    }
  };

  useEffect(() => {
    // Reset pagination when filters change
    setPage(0);
  }, [staffId, status, start, end]);

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

  // Calculate analytics from the data
  const analytics = useMemo(() => {
    if (!list?.results) return null;

    const sessions = list.results;
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const weekStart = todayStart - (7 * 24 * 60 * 60 * 1000);
    const monthStart = todayStart - (30 * 24 * 60 * 60 * 1000);

    // Filter sessions by time periods
    const todaySessions = sessions.filter(s => s.clockInTime >= todayStart);
    const weekSessions = sessions.filter(s => s.clockInTime >= weekStart);
    const monthSessions = sessions.filter(s => s.clockInTime >= monthStart);

    // Calculate totals
    const totalHours = sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / (1000 * 60 * 60);
    const todayHours = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0) / (1000 * 60 * 60);
    const weekHours = weekSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / (1000 * 60 * 60);
    const monthHours = monthSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / (1000 * 60 * 60);

    // Active sessions
    const activeSessions = sessions.filter(s => s.status === 'active').length;

    // Staff stats
    const staffStats = sessions.reduce((acc, s) => {
      if (!acc[s.staffId]) {
        acc[s.staffId] = { totalHours: 0, sessionCount: 0, lastActive: 0 };
      }
      acc[s.staffId].totalHours += (s.duration || 0) / (1000 * 60 * 60);
      acc[s.staffId].sessionCount += 1;
      acc[s.staffId].lastActive = Math.max(acc[s.staffId].lastActive, s.clockInTime);
      return acc;
    }, {} as Record<string, { totalHours: number; sessionCount: number; lastActive: number }>);

    // Status distribution
    const statusCounts = sessions.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      todayHours: Math.round(todayHours * 100) / 100,
      weekHours: Math.round(weekHours * 100) / 100,
      monthHours: Math.round(monthHours * 100) / 100,
      activeSessions,
      totalSessions: sessions.length,
      staffCount: Object.keys(staffStats).length,
      staffStats,
      statusCounts,
      averageSessionLength: sessions.length > 0 ? Math.round((totalHours / sessions.length) * 100) / 100 : 0
    };
  }, [list?.results]);

  const getStatusBadge = (status: Session['status']) => {
    const variants = {
      active: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      paused: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      adjusted: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return variants[status] || variants.completed;
  };

  const getStatusIcon = (status: Session['status']) => {
    const icons = {
      active: Play,
      completed: CheckCircle,
      paused: Pause,
      adjusted: AlertTriangle
    };
    const Icon = icons[status] || CheckCircle;
    return <Icon className="w-3 h-3" />;
  };

  return (
    <div className="space-y-8">
      {/* Error and Success Messages */}
      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-satoshi">{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="font-satoshi text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-asgard text-gray-900 mb-3">
            Time Tracking Analytics
          </h1>
          <p className="text-gray-700 font-satoshi text-lg">
            Comprehensive time tracking insights, staff management, and productivity analytics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="lg" className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </motion.div>

      {/* Analytics Overview Cards */}
      {analytics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 font-satoshi">Today's Hours</p>
                  <p className="text-3xl font-bold text-blue-900 font-asgard">{analytics.todayHours}h</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 font-satoshi">Active Sessions</p>
                  <p className="text-3xl font-bold text-green-900 font-asgard">{analytics.activeSessions}</p>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 font-satoshi">This Week</p>
                  <p className="text-3xl font-bold text-purple-900 font-asgard">{analytics.weekHours}h</p>
                </div>
                <div className="p-3 bg-purple-200 rounded-full">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 font-satoshi">Staff Members</p>
                  <p className="text-3xl font-bold text-orange-900 font-asgard">{analytics.staffCount}</p>
                </div>
                <div className="p-3 bg-orange-200 rounded-full">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/90 backdrop-blur-lg border border-white/20">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Staff Analytics
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Time Distribution Chart */}
            <Card className="bg-white/90 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-asgard">
                  <PieChart className="w-5 h-5" />
                  Time Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-satoshi text-gray-600">Completed Sessions</span>
                      <span className="font-semibold text-gray-900">{analytics.statusCounts.completed || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-satoshi text-gray-600">Active Sessions</span>
                      <span className="font-semibold text-gray-900">{analytics.statusCounts.active || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-satoshi text-gray-600">Paused Sessions</span>
                      <span className="font-semibold text-gray-900">{analytics.statusCounts.paused || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-satoshi text-gray-600">Adjusted Sessions</span>
                      <span className="font-semibold text-gray-900">{analytics.statusCounts.adjusted || 0}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Productivity Metrics */}
            <Card className="bg-white/90 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-asgard">
                  <Target className="w-5 h-5" />
                  Productivity Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-satoshi text-gray-600">Average Session Length</span>
                      <span className="font-semibold text-gray-900">{analytics.averageSessionLength}h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-satoshi text-gray-600">Total Sessions</span>
                      <span className="font-semibold text-gray-900">{analytics.totalSessions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-satoshi text-gray-600">This Month</span>
                      <span className="font-semibold text-gray-900">{analytics.monthHours}h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-satoshi text-gray-600">Total Hours</span>
                      <span className="font-semibold text-gray-900">{analytics.totalHours}h</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Staff Analytics Tab */}
        <TabsContent value="staff" className="space-y-6">
          <Card className="bg-white/90 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-asgard">
                <Users className="w-5 h-5" />
                Staff Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics && (
                <div className="space-y-4">
                  {Object.entries(analytics.staffStats).map(([staffId, stats]) => (
                    <div key={staffId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 font-satoshi">{staffId}</p>
                          <p className="text-sm text-gray-700 font-satoshi">
                            Last active: {new Date(stats.lastActive).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{stats.totalHours.toFixed(1)}h</p>
                        <p className="text-sm text-gray-700 font-satoshi">{stats.sessionCount} sessions</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          {/* Enhanced Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold font-asgard text-gray-900">Session Filters</h3>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <label className="text-sm font-medium font-satoshi text-gray-700">Staff ID</label>
                <Input
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="Enter staff ID"
                  className="bg-white/80 border-gray-200"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium font-satoshi text-gray-700">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-white/80 border-gray-200">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="adjusted">Adjusted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium font-satoshi text-gray-700">Start Date</label>
                <Input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="bg-white/80 border-gray-200"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium font-satoshi text-gray-700">End Date</label>
                <Input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="bg-white/80 border-gray-200"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium font-satoshi text-gray-700">Per Page</label>
                <Select value={limit.toString()} onValueChange={(value) => setLimit(Number(value))}>
                  <SelectTrigger className="bg-white/80 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Data Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/90 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full" role="table" aria-label="Time tracking sessions">
                <thead className="bg-gray-50/80 border-b border-gray-200">
                  <tr role="row">
                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900" scope="col" role="columnheader">Staff</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900" scope="col" role="columnheader">Clock In</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900" scope="col" role="columnheader">Clock Out</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900" scope="col" role="columnheader">Duration</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900" scope="col" role="columnheader">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900" scope="col" role="columnheader">Notes</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900" scope="col" role="columnheader">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/60">
                  {!list ? (
                    <TimeTrackingTableSkeleton rowCount={5} />
                  ) : list.results.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <EmptyState
                          icon={Clock}
                          title="No sessions found"
                          description="No time tracking sessions have been recorded yet"
                          variant="compact"
                        />
                      </td>
                    </tr>
                  ) : (
                    list.results.map((s) => {
                      const duration = s.duration ? Math.round(s.duration / 60000) : null;
                      return (
                        <tr key={s._id} className="hover:bg-gray-50/50 transition-colors" role="row" aria-label={`Session for staff ${s.staffId}`}>
                          <td className="px-6 py-4" role="cell" aria-label={`Staff ID: ${s.staffId}`}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-primary-600" />
                              </div>
                              <span className="font-mono text-sm text-gray-900 font-satoshi">{s.staffId}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-satoshi text-gray-900">
                                {new Date(s.clockInTime).toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {s.clockOutTime ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-satoshi text-gray-900">
                                  {new Date(s.clockOutTime).toLocaleString()}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500 font-satoshi">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {duration !== null ? (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-satoshi text-gray-900">
                                  {Math.floor(duration / 60)}h {duration % 60}m
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500 font-satoshi">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={`${getStatusBadge(s.status)} flex items-center gap-1`}>
                              {getStatusIcon(s.status)}
                              {s.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            <span className="text-sm font-satoshi text-gray-600 truncate block" title={s.notes || ''}>
                              {s.notes || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    setError(null);
                                    await adjustSession({ sessionId: s._id, updates: { status: 'adjusted' } });
                                    setSuccess('Session status updated successfully');
                                  } catch (err) {
                                    setError(err instanceof Error ? err.message : 'Failed to update session');
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    adjustSession({ sessionId: s._id, updates: { status: 'adjusted' } })
                                      .then(() => setSuccess('Session status updated successfully'))
                                      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to update session'));
                                  }
                                }}
                                className="text-xs"
                                aria-label="Adjust session status"
                                tabIndex={0}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Adjust
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (!s.clockOutTime) return;
                                  try {
                                    setError(null);
                                    const newOut = s.clockOutTime + 5 * 60 * 1000;
                                    await adjustSession({ sessionId: s._id, updates: { clockOutTime: newOut } });
                                    setSuccess('Session time adjusted successfully');
                                  } catch (err) {
                                    setError(err instanceof Error ? err.message : 'Failed to adjust session time');
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    if (s.clockOutTime) {
                                      const newOut = s.clockOutTime + 5 * 60 * 1000;
                                      adjustSession({ sessionId: s._id, updates: { clockOutTime: newOut } })
                                        .then(() => setSuccess('Session time adjusted successfully'))
                                        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to adjust session time'));
                                    }
                                  }
                                }}
                                className="text-xs"
                                aria-label="Add 5 minutes to session"
                                tabIndex={0}
                              >
                                +5m
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteConfirm({ isOpen: true, sessionId: s._id })}
                                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                aria-label="Delete session"
                                tabIndex={0}
                              >
                                <Trash className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Enhanced Pagination */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between bg-white/90 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-xl"
          >
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <span className="text-sm font-satoshi text-gray-600">
                Page {page + 1} {list ? `of ${Math.max(1, Math.ceil(list.total / limit))}` : ''}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                disabled={!list || (page + 1) * limit >= (list?.total || 0)}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="text-sm font-satoshi text-gray-600">
              {list ? `Showing ${page * limit + 1}-${Math.min((page + 1) * limit, list.total)} of ${list.total} sessions` : ''}
            </div>
          </motion.div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card className="bg-white/90 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-asgard">
                <Download className="w-5 h-5" />
                Export Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  CSV Report
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  PDF Summary
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Excel Workbook
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, sessionId: null })}
        onConfirm={confirmDelete}
        title="Delete Session"
        message="Are you sure you want to delete this session? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="error"
      />
    </div>
  );
}


