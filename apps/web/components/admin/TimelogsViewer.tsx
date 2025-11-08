'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Search, Filter, Download } from 'lucide-react';

interface Timelog {
  _id: string;
  user: string;
  staffId: string;
  bucket: string;
  logs: any[];
  timestamp: number;
  createdBy?: string;
  createdAt?: number;
  updatedBy?: string;
  updatedAt?: number;
  changeLog?: Array<{
    action: string;
    by: string;
    at: number;
    details?: any;
  }>;
}

interface TimelogsResponse {
  total: number;
  results: Timelog[];
}

interface Staff {
  _id: string;
  name: string;
  email: string;
}

export default function TimelogsViewer() {
  const [staff, setStaff] = useState('');
  const [bucket, setBucket] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [logDetail, setLogDetail] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get session token from cookies
  const [sessionToken, setSessionToken] = useState<string | undefined>(undefined);
  useEffect(() => {
    const getCookie = (name: string): string | undefined => {
      if (typeof document === 'undefined') return undefined;
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : undefined;
    };
    const token = getCookie('convex-auth-token');
    setSessionToken(token);
  }, []);

  // Get timelogs from Convex
  const timelogsData = useQuery(api.queries.timelogs.getTimelogs, {
    staffId: staff ? staff as Id<"users"> : undefined,
    bucket: bucket || undefined,
    start: start ? new Date(start).getTime() : undefined,
    end: end ? new Date(end).getTime() : undefined,
    skip: page * limit,
    limit
  });

  // Get staff list from Convex - using admin dashboard query
  const adminStaffData = useQuery(
    api.queries.staff.getAdminStaffDashboard,
    sessionToken ? { sessionToken } : 'skip'
  );
  const staffList = adminStaffData?.staff || [];

  const timelogs = timelogsData?.results || [];
  const total = timelogsData?.total || 0;
  const loading = !timelogsData;

  function getStaffName(staffId: string) {
    const staff = staffList.find((s: any) => s._id === staffId);
    return staff ? `${staff.name} (${staff.email})` : staffId;
  }

  function handleExpand(log: Timelog) {
    if (expanded === log._id) {
      setExpanded(null);
      setLogDetail(null);
    } else {
      setExpanded(log._id);
      setLogDetail(log.logs);
      setError(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Timelogs Viewer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Staff</label>
              <Select value={staff} onValueChange={setStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Staff</SelectItem>
                  {staffList.map((s: any) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name} ({s.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bucket</label>
              <Input
                placeholder="Bucket name"
                value={bucket}
                onChange={e => setBucket(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <Input
                type="date"
                value={start}
                onChange={e => setStart(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <Input
                type="date"
                value={end}
                onChange={e => setEnd(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Per Page</label>
              <Select value={limit.toString()} onValueChange={(value) => setLimit(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} per page</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bucket</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"># Logs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
                ) : timelogs.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No results found</td></tr>
                ) : timelogs.map((log: Timelog) => (
                  <React.Fragment key={log._id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.user}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getStaffName(log.staffId)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Badge variant="outline">{log.bucket}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.logs.length}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExpand(log)}
                          className="flex items-center gap-1"
                        >
                          {expanded === log._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {expanded === log._id ? 'Hide' : 'View'}
                        </Button>
                      </td>
                    </tr>
                    {expanded === log._id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Logs Data:</h4>
                              <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-white p-3 rounded border">
                                {JSON.stringify(logDetail, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Audit Information:</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Created By:</span> {log.createdBy || 'N/A'}
                                </div>
                                <div>
                                  <span className="font-medium">Created At:</span> {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                                </div>
                                <div>
                                  <span className="font-medium">Updated By:</span> {log.updatedBy || 'N/A'}
                                </div>
                                <div>
                                  <span className="font-medium">Updated At:</span> {log.updatedAt ? new Date(log.updatedAt).toLocaleString() : 'N/A'}
                                </div>
                              </div>
                            </div>
                            {log.changeLog && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Change Log:</h4>
                                <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-white p-3 rounded border">
                                  {JSON.stringify(log.changeLog, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {page + 1} of {Math.ceil(total / limit) || 1}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * limit >= total}
            >
              Next
            </Button>
          </div>
          <div className="text-sm text-gray-500">
            Showing {timelogs.length} of {total} results
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 