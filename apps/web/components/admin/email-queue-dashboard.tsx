'use client';

import React, { useState, useEffect } from 'react';
import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle, Clock, Filter, Mail, RefreshCw, Search, XCircle } from 'lucide-react';

interface EmailQueueItem {
  _id: string;
  templateId: string;
  recipientEmail: string;
  recipientData: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledFor: number;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  maxAttempts: number;
  lastAttempt?: number;
  errorMessage?: string;
  trackingId?: string;
  _creationTime: number;
}

interface EmailHistoryItem {
  _id: string;
  _creationTime: number;
  emailId: string;
  templateId: string;
  recipientEmail: string;
  eventType: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed' | 'contact_created' | 'contact_updated' | 'contact_deleted' | 'domain_created' | 'domain_updated' | 'domain_deleted';
  timestamp: number;
  metadata: any;
  deviceInfo?: {
    type: string;
    os: string;
    browser: string;
    client: string;
  };
  locationInfo?: {
    country: string;
    region: string;
    city: string;
    ipAddress: string;
  };
}

export function EmailQueueDashboard() {
  const { sessionToken } = useAdminUser();
  const [queueFilter, setQueueFilter] = useState<'all' | 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed'>('all');
  const [searchEmail, setSearchEmail] = useState('');
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | 'all'>('24h');

  // Fetch queue data
  const queueData = useQuery(api.queries.email.getEmailQueueAdmin, sessionToken ? {
    status: queueFilter === 'all' ? undefined : queueFilter,
    priority: priorityFilter === 'all' ? undefined : priorityFilter,
    limit: 100,
    sessionToken,
  } : 'skip');

  // Fetch queue stats
  const queueStats = useQuery(api.queries.email.getEmailQueueStats, sessionToken ? { sessionToken } : 'skip');

  // Fetch history data
  const historyData = useQuery(api.queries.email.getEmailHistoryAdmin, sessionToken ? {
    eventType: historyFilter === 'all' ? undefined : historyFilter,
    recipientEmail: searchEmail || undefined,
    limit: 100,
    startDate: dateRange === 'all' ? undefined : getDateRangeStart(dateRange),
    endDate: dateRange === 'all' ? undefined : Date.now(),
    sessionToken,
  } : 'skip');

  // Fetch history stats
  const historyStats = useQuery(api.queries.email.getEmailHistoryStats, sessionToken ? {
    startDate: dateRange === 'all' ? undefined : getDateRangeStart(dateRange),
    endDate: dateRange === 'all' ? undefined : Date.now(),
    sessionToken,
  } : 'skip');

  function getDateRangeStart(range: string): number {
    const now = Date.now();
    switch (range) {
      case '24h': return now - (24 * 60 * 60 * 1000);
      case '7d': return now - (7 * 24 * 60 * 60 * 1000);
      case '30d': return now - (30 * 24 * 60 * 60 * 1000);
      default: return 0;
    }
  }

  function getStatusBadge(status: string) {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      sent: 'default',
      failed: 'destructive',
      cancelled: 'outline'
    } as const;

    const icons = {
      pending: Clock,
      processing: RefreshCw,
      sent: CheckCircle,
      failed: XCircle,
      cancelled: AlertCircle
    };

    const Icon = icons[status as keyof typeof icons] || Clock;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  }

  function getPriorityBadge(priority: string) {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'default',
      critical: 'destructive'
    } as const;

    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'secondary'}>
        {priority}
      </Badge>
    );
  }

  function getEventTypeBadge(eventType: string) {
    const variants = {
      sent: 'default',
      delivered: 'default',
      opened: 'default',
      clicked: 'default',
      bounced: 'destructive',
      complained: 'destructive',
      unsubscribed: 'secondary'
    } as const;

    return (
      <Badge variant={variants[eventType as keyof typeof variants] || 'secondary'}>
        {eventType}
      </Badge>
    );
  }

  if (!queueData || !queueStats || !historyData || !historyStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading email data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Queue Management</h1>
          <p className="text-muted-foreground">
            Monitor email queue status and view send history
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Status</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {queueStats.pending} pending, {queueStats.processing} processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats.recent24h}</div>
            <p className="text-xs text-muted-foreground">
              emails in last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{historyStats.rates.deliveryRate}%</div>
            <p className="text-xs text-muted-foreground">
              {historyStats.delivered} of {historyStats.sent} delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{historyStats.rates.openRate}%</div>
            <p className="text-xs text-muted-foreground">
              {historyStats.opened} of {historyStats.delivered} opened
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue">Email Queue</TabsTrigger>
          <TabsTrigger value="history">Send History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Email Queue Tab */}
        <TabsContent value="queue" className="space-y-4">
          <div className="flex items-center space-x-4">
            <Select value={queueFilter} onValueChange={(value: any) => setQueueFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Email Queue</CardTitle>
              <CardDescription>
                Current emails in the processing queue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queueData.map((email: EmailQueueItem) => (
                    <TableRow key={email._id}>
                      <TableCell className="font-medium">{email.recipientEmail}</TableCell>
                      <TableCell>{email.templateId}</TableCell>
                      <TableCell>{getPriorityBadge(email.priority)}</TableCell>
                      <TableCell>{getStatusBadge(email.status)}</TableCell>
                      <TableCell>
                        {email.attempts}/{email.maxAttempts}
                        {email.errorMessage && (
                          <div className="text-xs text-red-500 mt-1">
                            {email.errorMessage}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(email.scheduledFor), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(email._creationTime), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Send History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center space-x-4">
            <Select value={historyFilter} onValueChange={(value: any) => setHistoryFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="opened">Opened</SelectItem>
                <SelectItem value="clicked">Clicked</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
                <SelectItem value="complained">Complained</SelectItem>
                <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Send History</CardTitle>
              <CardDescription>
                Email delivery and engagement events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData.map((event: EmailHistoryItem) => (
                    <TableRow key={event._id}>
                      <TableCell className="font-medium">{event.recipientEmail}</TableCell>
                      <TableCell>{event.templateId}</TableCell>
                      <TableCell>{getEventTypeBadge(event.eventType)}</TableCell>
                      <TableCell>
                        {event.deviceInfo ? (
                          <div className="text-sm">
                            <div>{event.deviceInfo.type}</div>
                            <div className="text-xs text-muted-foreground">
                              {event.deviceInfo.browser} on {event.deviceInfo.os}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.locationInfo ? (
                          <div className="text-sm">
                            <div>{event.locationInfo.city}, {event.locationInfo.country}</div>
                            <div className="text-xs text-muted-foreground">
                              {event.locationInfo.ipAddress}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Email Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Sent</span>
                  <span className="font-medium">{historyStats.sent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Delivered</span>
                  <span className="font-medium">{historyStats.delivered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Opened</span>
                  <span className="font-medium">{historyStats.opened}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Clicked</span>
                  <span className="font-medium">{historyStats.clicked}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Engagement Rates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Delivery Rate</span>
                  <span className="font-medium">{historyStats.rates.deliveryRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Open Rate</span>
                  <span className="font-medium">{historyStats.rates.openRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Click Rate</span>
                  <span className="font-medium">{historyStats.rates.clickRate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Issues</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Bounced</span>
                  <span className="font-medium text-red-600">{historyStats.bounced}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Complained</span>
                  <span className="font-medium text-red-600">{historyStats.complained}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Unsubscribed</span>
                  <span className="font-medium text-yellow-600">{historyStats.unsubscribed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Bounce Rate</span>
                  <span className="font-medium text-red-600">{historyStats.rates.bounceRate}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>
                Email campaign performance overview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{historyStats.uniqueRecipients}</div>
                  <div className="text-sm text-muted-foreground">Unique Recipients</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{historyStats.uniqueTemplates}</div>
                  <div className="text-sm text-muted-foreground">Templates Used</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{historyStats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Events</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{historyStats.rates.complaintRate}%</div>
                  <div className="text-sm text-muted-foreground">Complaint Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
