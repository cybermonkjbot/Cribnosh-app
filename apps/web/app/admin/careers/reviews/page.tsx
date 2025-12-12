"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { EmptyState } from '@/components/admin/empty-state';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import {
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  Mail,
  Phone,
  Search,
  Star,
  XCircle
} from 'lucide-react';
import { useState } from 'react';

interface JobApplication {
  _id: Id<"jobApplication">;
  jobId: Id<"jobPosting">;
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  status: 'pending' | 'reviewing' | 'interviewed' | 'accepted' | 'rejected';
  appliedAt: number;
  resumeUrl?: string;
  coverLetter?: string;
  experience: string;
  skills: string[];
  expectedSalary?: number;
  availability: string;
  notes?: string;
  rating?: number;
  interviewDate?: number;
  interviewNotes?: string;
}

export default function JobApplicationsPage() {
  const { user, sessionToken } = useAdminUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('applied');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch job applications
  const queryArgs = user && sessionToken ? { sessionToken } : "skip";
  const applications = useQuery(api.queries.careers.getJobApplications, queryArgs);
  const applicationStats = useQuery(api.queries.careers.getApplicationStats, queryArgs);

  // Mutations
  const updateApplicationStatus = useMutation(api.mutations.careers.updateApplicationStatus);
  const scheduleInterview = useMutation(api.mutations.careers.scheduleInterview);
  const addApplicationNotes = useMutation(api.mutations.careers.addApplicationNotes);

  const handleStatusChange = async (applicationId: Id<"jobApplication">, newStatus: string) => {
    try {
      await updateApplicationStatus({ applicationId, status: newStatus as any });
      setSuccess('Application status updated successfully');
      setError(null);
    } catch (err) {
      setError('Failed to update application status');
    }
  };

  const handleScheduleInterview = async (applicationId: Id<"jobApplication">) => {
    const date = prompt('Enter interview date (YYYY-MM-DD):');
    if (date) {
      try {
        await scheduleInterview({ applicationId, interviewDate: new Date(date).getTime() });
        setSuccess('Interview scheduled successfully');
        setError(null);
      } catch (err) {
        setError('Failed to schedule interview');
      }
    }
  };

  const filteredApplications = applications?.filter((app: any) => {
    const matchesSearch =
      app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicantEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.experience.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesJob = jobFilter === 'all' || app.jobId === jobFilter;

    return matchesSearch && matchesStatus && matchesJob;
  }).sort((a: any, b: any) => {
    switch (sortBy) {
      case 'name':
        return a.applicantName.localeCompare(b.applicantName);
      case 'applied':
        return b.appliedAt - a.appliedAt;
      case 'job':
        return a.jobTitle.localeCompare(b.jobTitle);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  }) || [];

  const jobOptions = Array.from(new Set(applications?.map((app: any) => ({ id: app.jobId, title: app.jobTitle })) || []));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'reviewing':
        return <Badge className="bg-blue-100 text-blue-800">Reviewing</Badge>;
      case 'interviewed':
        return <Badge className="bg-purple-100 text-purple-800">Interviewed</Badge>;
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'reviewing':
        return <Eye className="w-4 h-4" />;
      case 'interviewed':
        return <Calendar className="w-4 h-4" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-[18px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Job Applications</h1>
          <p className="text-gray-600 font-satoshi mt-2">Review and manage job applications</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Applications
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
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{applications?.length || 0}</p>
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
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applications?.filter((app: any) => app.status === 'pending').length || 0}
                </p>
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
                <p className="text-sm text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applications?.filter((app: any) => app.status === 'accepted').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Interviews Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applications?.filter((app: any) => app.status === 'interviewed').length || 0}
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

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <Input
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="interviewed">Interviewed</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Job Position" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            {jobOptions.map((job: any) => (
              <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="applied">Applied Date</SelectItem>
            <SelectItem value="job">Job Position</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.map((application: any) => (
          <Card key={application._id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{application.applicantName}</CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {application.jobTitle}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Applied {new Date(application.appliedAt).toLocaleDateString()}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(application.status)}
                  {getStatusBadge(application.status)}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{application.applicantEmail}</span>
                  </div>
                  {application.applicantPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{application.applicantPhone}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {application.expectedSalary && (
                    <div className="text-sm">
                      <span className="font-medium">Expected Salary: </span>
                      <span>${application.expectedSalary.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="font-medium">Availability: </span>
                    <span>{application.availability}</span>
                  </div>
                </div>
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Experience:</p>
                <p className="text-sm text-gray-600">{application.experience}</p>
              </div>

              {/* Skills */}
              {application.skills.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {application.skills.map((skill: any, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Interview Info */}
              {application.interviewDate && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Interview Scheduled:</span>
                    <span>{new Date(application.interviewDate).toLocaleDateString()}</span>
                  </div>
                  {application.interviewNotes && (
                    <p className="text-sm text-gray-600 mt-1">{application.interviewNotes}</p>
                  )}
                </div>
              )}

              {/* Rating */}
              {application.rating && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Rating:</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < application.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600">({application.rating}/5)</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {/* View full application */ }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </Button>
                {application.resumeUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(application.resumeUrl, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Resume
                  </Button>
                )}
                {application.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(application._id, 'reviewing')}
                  >
                    Start Review
                  </Button>
                )}
                {application.status === 'reviewing' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleScheduleInterview(application._id)}
                  >
                    Schedule Interview
                  </Button>
                )}
                <Select
                  value={application.status}
                  onValueChange={(value) => handleStatusChange(application._id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="interviewed">Interviewed</SelectItem>
                    <SelectItem value="accepted">Accept</SelectItem>
                    <SelectItem value="rejected">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredApplications.length === 0 && (
        <EmptyState
          icon={FileText}
          title={searchTerm || statusFilter !== 'all' || jobFilter !== 'all' ? "No applications found" : "No applications yet"}
          description={searchTerm || statusFilter !== 'all' || jobFilter !== 'all'
            ? "Try adjusting your search or filter criteria"
            : "Applications will appear here once candidates apply to job postings"}
          action={searchTerm || statusFilter !== 'all' || jobFilter !== 'all' ? {
            label: "Clear filters",
            onClick: () => {
              setSearchTerm('');
              setStatusFilter('all');
              setJobFilter('all');
            },
            variant: "secondary"
          } : undefined}
          variant={searchTerm || statusFilter !== 'all' || jobFilter !== 'all' ? "filtered" : "no-data"}
        />
      )}
    </div>
  );
}