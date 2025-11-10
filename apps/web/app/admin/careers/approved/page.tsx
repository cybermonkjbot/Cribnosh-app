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
import { useMutation, useQuery } from 'convex/react';
import {
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Eye,
  Filter,
  MapPin,
  Plus,
  Search,
  Trash2,
  Users
} from 'lucide-react';
import { useState } from 'react';

interface JobPosting {
  _id: Id<"jobPosting">;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salaryMin?: number;
  salaryMax?: number;
  status: 'draft' | 'published' | 'closed' | 'archived';
  description: string;
  requirements: string[];
  benefits: string[];
  postedAt: number;
  applicationDeadline?: number;
  applicantCount: number;
  createdBy: string;
}

export default function ActiveJobsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('published');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('posted');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch job postings
  const jobPostings = useQuery(api.queries.careers.getJobPostings);
  const jobStats = useQuery(api.queries.careers.getJobStats);

  // Mutations
  const updateJobStatus = useMutation(api.mutations.careers.updateJobStatus);
  const deleteJob = useMutation(api.mutations.careers.deleteJob);

  const handleStatusChange = async (jobId: Id<"jobPosting">, newStatus: string) => {
    try {
      await updateJobStatus({ jobId, status: newStatus as any });
      setSuccess('Job status updated successfully');
      setError(null);
    } catch (err) {
      setError('Failed to update job status');
    }
  };

  const handleDeleteJob = async (jobId: Id<"jobPosting">) => {
    if (confirm('Are you sure you want to delete this job posting?')) {
      try {
        await deleteJob({ jobId });
        setSuccess('Job posting deleted successfully');
        setError(null);
      } catch (err) {
        setError('Failed to delete job posting');
      }
    }
  };

  const filteredJobs = jobPostings?.filter((job: any) => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || job.department === departmentFilter;
    const matchesType = typeFilter === 'all' || job.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesType;
  }).sort((a: any, b: any) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'posted':
        return b.postedAt - a.postedAt;
      case 'applicants':
        return b.applicantCount - a.applicantCount;
      case 'salary':
        return (b.salaryMax || 0) - (a.salaryMax || 0);
      default:
        return 0;
    }
  }) || [];

  const departmentOptions = Array.from(new Set(jobPostings?.map((job: any) => job.department) || []));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      case 'closed':
        return <Badge className="bg-red-100 text-red-800">Closed</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'full-time':
        return <Badge variant="outline" className="text-blue-600">Full-time</Badge>;
      case 'part-time':
        return <Badge variant="outline" className="text-green-600">Part-time</Badge>;
      case 'contract':
        return <Badge variant="outline" className="text-purple-600">Contract</Badge>;
      case 'internship':
        return <Badge variant="outline" className="text-orange-600">Internship</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-[18px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Active Job Postings</h1>
          <p className="text-gray-600 font-satoshi mt-2">Manage and monitor current job openings</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Post New Job
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{jobPostings?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobPostings?.filter((job: any) => job.status === 'published').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Applicants</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobPostings?.reduce((sum: any, job: any) => sum + job.applicantCount, 0) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Draft Jobs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobPostings?.filter((job: any) => job.status === 'draft').length || 0}
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
            placeholder="Search job postings..."
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
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departmentOptions.map((dept: any) => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="full-time">Full-time</SelectItem>
            <SelectItem value="part-time">Part-time</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="internship">Internship</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="posted">Posted Date</SelectItem>
            <SelectItem value="applicants">Applicants</SelectItem>
            <SelectItem value="salary">Salary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredJobs.map((job: any) => (
          <Card key={job._id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {job.type}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2">
                  {getStatusBadge(job.status)}
                  {getTypeBadge(job.type)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Department */}
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{job.department}</Badge>
                <span className="text-sm text-gray-600">
                  Posted {new Date(job.postedAt).toLocaleDateString()}
                </span>
              </div>

              {/* Salary */}
              {job.salaryMin && job.salaryMax && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-medium">
                    ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Description */}
              <p className="text-sm text-gray-600 line-clamp-3">{job.description}</p>

              {/* Requirements */}
              {job.requirements.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Key Requirements:</p>
                  <div className="flex flex-wrap gap-1">
                    {job.requirements.slice(0, 3).map((req: any, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {req}
                      </Badge>
                    ))}
                    {job.requirements.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{job.requirements.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">{job.applicantCount}</span>
                    <span className="text-xs text-gray-600">applicants</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {job.applicationDeadline && (
                    <span>Closes {new Date(job.applicationDeadline).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {/* View job details */}}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {/* Edit job */}}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteJob(job._id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <EmptyState
          icon={Briefcase}
          title={searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' ? "No job postings found" : "No active jobs yet"}
          description={searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' 
            ? "Try adjusting your search or filter criteria" 
            : "No active job postings have been published yet"}
          action={searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' ? {
            label: "Clear filters",
            onClick: () => {
              setSearchTerm('');
              setStatusFilter('all');
              setDepartmentFilter('all');
            },
            variant: "secondary"
          } : undefined}
          variant={searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' ? "filtered" : "no-data"}
        />
      )}
    </div>
  );
}