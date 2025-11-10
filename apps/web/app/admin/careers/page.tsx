"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { EmptyState } from '@/components/admin/empty-state';
import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from 'convex/react';
import {
  Briefcase,
  Building,
  Clock,
  Edit,
  Eye,
  Mail,
  MapPin,
  Plus,
  Search,
  Trash,
  Users,
  X
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';



interface JobPosting {
  _id: Id<"jobPosting">;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  isActive: boolean;
  postedAt: number;
  updatedAt?: number;
  slug: string;
}

interface JobApplication {
  _id: Id<"jobApplication">;
  jobId: Id<"jobPosting">;
  fullName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  coverLetter?: string;
  portfolio?: string;
  status: string;
  submittedAt: number;
  lastUpdated?: number;
}

interface JobFormData {
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  isActive: boolean;
}

export default function AdminCareers() {
  const { toast } = useToast();
  const { sessionToken } = useAdminUser();
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs');
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [jobFormData, setJobFormData] = useState<JobFormData>({
    title: '',
    department: '',
    location: '',
    type: '',
    description: '',
    requirements: [],
    responsibilities: [],
    benefits: [],
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Partial<JobFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isCreating, setIsCreating] = useState(false);

  const jobPostings = useQuery(
    api.queries.careers.getJobPostings,
    sessionToken ? { sessionToken } : "skip"
  ) as JobPosting[] | undefined;

  const applications = useQuery(
    api.queries.careers.getJobApplications,
    sessionToken ? { sessionToken } : "skip"
  ) as JobApplication[] | undefined;
  
  const createJob = useMutation(api.mutations.careers.createJobPosting);
  const updateJob = useMutation(api.mutations.careers.updateJobPosting);
  const deleteJob = useMutation(api.mutations.careers.deleteJobPosting);
  const updateApplicationStatus = useMutation(api.mutations.careers.updateApplicationStatus);

  const filteredJobs = jobPostings?.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && job.isActive) ||
                         (statusFilter === 'inactive' && !job.isActive);
    return matchesSearch && matchesStatus;
  });

  const filteredApplications = applications?.filter(app => {
    const matchesSearch = app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleCreateJob = () => {
    setEditingJob(null);
    setJobFormData({
      title: '',
      department: '',
      location: '',
      type: '',
      description: '',
      requirements: [],
      responsibilities: [],
      benefits: [],
      isActive: true,
    });
    setShowJobModal(true);
  };

  const handleEditJob = (job: JobPosting) => {
    setEditingJob(job);
    setJobFormData({
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      description: job.description,
      requirements: job.requirements,
      responsibilities: job.responsibilities,
      benefits: job.benefits,
      isActive: job.isActive,
    });
    setShowJobModal(true);
  };

  const validateJobForm = () => {
    const errors: Partial<JobFormData> = {};

    if (!jobFormData.title.trim()) {
      errors.title = 'Job title is required';
    } else if (jobFormData.title.trim().length < 3) {
      errors.title = 'Job title must be at least 3 characters';
    }

    if (!jobFormData.department.trim()) {
      errors.department = 'Department is required';
    }

    if (!jobFormData.location.trim()) {
      errors.location = 'Location is required';
    }

    if (!jobFormData.description.trim()) {
      errors.description = 'Job description is required';
    } else if (jobFormData.description.trim().length < 50) {
      errors.description = 'Job description must be at least 50 characters';
    }

    if (!jobFormData.requirements.length || jobFormData.requirements.every(req => !req.trim())) {
      errors.requirements = ['At least one requirement is required'];
    }

    if (!jobFormData.responsibilities.length || jobFormData.responsibilities.every(resp => !resp.trim())) {
      errors.responsibilities = ['At least one responsibility is required'];
    }

    setFormErrors(errors);
    return errors;
  };

  const handleSaveJob = async () => {
    const errors = validateJobForm();
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before saving.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingJob) {
        await updateJob({
          jobId: editingJob._id,
          ...jobFormData,
        });
      } else {
        await createJob(jobFormData);
      }
      setShowJobModal(false);
      setEditingJob(null);
      setFormErrors({});
      toast({
        title: "Success",
        description: editingJob ? "Job updated successfully!" : "Job created successfully!",
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error saving job. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId: Id<"jobPosting">) => {
    if (confirm('Are you sure you want to delete this job posting?')) {
      setIsDeleting(jobId);
      try {
        await deleteJob({ jobId });
        toast({
          title: "Success",
          description: "Job deleted successfully!",
          variant: "success"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Error deleting job. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: Id<"jobApplication">, status: string) => {
    try {
      await updateApplicationStatus({ applicationId, status });
      toast({
        title: "Success",
        description: `Application status updated to ${status}!`,
        variant: "success"
      });
    } catch (error) {
       toast({
        title: "Error",
        description: "Error updating application status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const addArrayItem = (field: 'requirements' | 'responsibilities' | 'benefits') => {
    setJobFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const updateArrayItem = (field: 'requirements' | 'responsibilities' | 'benefits', index: number, value: string) => {
    setJobFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item),
    }));
  };

  const removeArrayItem = (field: 'requirements' | 'responsibilities' | 'benefits', index: number) => {
    setJobFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const getStatusColor = (status: string) => {
    // Use brand color for positive statuses, neutral dark for others
    switch (status) {
      case 'pending': return 'bg-gray-200 text-gray-800';
      case 'reviewed': return 'bg-[#F23E2E]/10 text-[#F23E2E]';
      case 'shortlisted': return 'bg-[#F23E2E]/10 text-[#F23E2E]';
      case 'rejected': return 'bg-gray-200 text-gray-800';
      case 'hired': return 'bg-[#F23E2E]/10 text-[#F23E2E]';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-[18px]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold font-asgard text-gray-900">
          Careers Management
        </h1>
        {activeTab === 'jobs' && (
          <Button
            onClick={handleCreateJob}
            size="lg"
            className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            New Job
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/30 p-1">
        <Button
          onClick={() => setActiveTab('jobs')}
          variant={activeTab === 'jobs' ? "default" : "ghost"}
          className={`flex-1 ${
            activeTab === 'jobs'
              ? 'bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white'
              : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Job Postings
          </div>
        </Button>
        <Button
          onClick={() => setActiveTab('applications')}
          variant={activeTab === 'applications' ? "default" : "ghost"}
          className={`flex-1 ${
            activeTab === 'applications'
              ? 'bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white'
              : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Applications
          </div>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'jobs' ? 'jobs' : 'applications'}...`}
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/50 backdrop-blur-sm rounded-lg border border-gray-200/30 focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi"
          />
        </div>
        {activeTab === 'jobs' && (
          <select
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 bg-white/50 backdrop-blur-sm rounded-lg border border-gray-200/30 focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        )}
      </div>

      {/* Content */}
      {activeTab === 'jobs' ? (
        // Jobs List
        !jobPostings ? (
          <div className="flex items-center justify-center h-64 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/30">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredJobs?.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={searchQuery || statusFilter !== 'all' ? "No jobs found" : "No jobs yet"}
            description={searchQuery || statusFilter !== 'all' 
              ? "Try adjusting your search or filter criteria" 
              : "Create your first job posting to get started"}
            action={searchQuery || statusFilter !== 'all' ? {
              label: "Clear filters",
              onClick: () => {
                setSearchQuery('');
                setStatusFilter('all');
              },
              variant: "secondary"
            } : {
              label: "Create Job",
              onClick: () => setIsCreating(true),
              variant: "primary"
            }}
            variant={searchQuery || statusFilter !== 'all' ? "filtered" : "no-data"}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs?.map((job) => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/30 p-6 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-600" />
                    <span className={`px-2 py-1 text-xs font-medium rounded-full font-satoshi ${
                      job.isActive ? 'bg-[#F23E2E]/10 text-[#F23E2E]' : 'bg-gray-200 text-gray-800'
                    }`}>
                      {job.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditJob(job)}
                      className="p-1 text-gray-600 hover:text-primary-600 transition-colors"
                      aria-label="Edit job"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job._id)}
                      disabled={isDeleting === job._id}
                      className="p-1 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Delete job"
                    >
                      {isDeleting === job._id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      ) : (
                        <Trash className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2 font-asgard">{job.title}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-satoshi">
                    <Building className="w-4 h-4" />
                    <span>{job.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-satoshi">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-satoshi">
                    <Clock className="w-4 h-4" />
                    <span>{job.type}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 font-satoshi line-clamp-3">
                  {job.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-700 font-satoshi">
                  <span>Posted {new Date(job.postedAt).toLocaleDateString()}</span>
                  <span>{job.requirements.length} requirements</span>
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        // Applications List
        !applications ? (
          <div className="flex items-center justify-center h-64 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/30">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredApplications?.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchQuery ? "No applications found" : "No applications yet"}
            description={searchQuery 
              ? "Try adjusting your search criteria" 
              : "Applications will appear here once candidates apply"}
            action={searchQuery ? {
              label: "Clear filters",
              onClick: () => setSearchQuery(''),
              variant: "secondary"
            } : undefined}
            variant={searchQuery ? "filtered" : "no-data"}
          />
        ) : (
          <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-satoshi">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-satoshi">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-satoshi">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-satoshi">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-satoshi">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-gray-200/30">
                  {filteredApplications?.map((app) => (
                    <motion.tr
                      key={app._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 font-asgard">
                            {app.fullName}
                          </div>
                          <div className="text-sm text-gray-700 font-satoshi">
                            {app.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-satoshi">
                        {/* We would need to fetch job details here */}
                        Job Position
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={app.status}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleUpdateApplicationStatus(app._id, e.target.value)}
                          className={`px-2 py-1 text-xs font-medium rounded-full border-0 font-satoshi ${getStatusColor(app.status)}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                          <option value="hired">Hired</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-satoshi">
                        {new Date(app.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            className="text-primary-600 hover:text-primary-900 transition-colors"
                            aria-label="View application"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="text-gray-900 hover:text-[#F23E2E] transition-colors"
                            aria-label="Send email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Job Modal */}
      <AnimatePresence>
        {showJobModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowJobModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold font-asgard text-gray-900">
                    {editingJob ? 'Edit Job' : 'Create New Job'}
                  </h2>
                  <button
                    onClick={() => setShowJobModal(false)}
                    className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 font-satoshi">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={jobFormData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobFormData(prev => ({ ...prev, title: e.target.value }))}
                      className={`w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 font-satoshi ${
                        formErrors.title ? 'border-gray-500 focus:ring-gray-500/50' : 'border-gray-300 focus:ring-[#F23E2E]/50'
                      }`}
                      placeholder="Enter job title"
                    />
                    {formErrors.title && <p className="text-gray-700 text-sm mt-1">{formErrors.title}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 font-satoshi">
                      Department
                    </label>
                    <input
                      type="text"
                      value={jobFormData.department}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobFormData(prev => ({ ...prev, department: e.target.value }))}
                      className={`w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 font-satoshi ${
                        formErrors.department ? 'border-gray-500 focus:ring-gray-500/50' : 'border-gray-300 focus:ring-[#F23E2E]/50'
                      }`}
                      placeholder="Enter department"
                    />
                    {formErrors.department && <p className="text-gray-700 text-sm mt-1">{formErrors.department}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 font-satoshi">
                      Location
                    </label>
                    <input
                      type="text"
                      value={jobFormData.location}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi"
                      placeholder="Enter location"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 font-satoshi">
                      Job Type
                    </label>
                    <select
                      value={jobFormData.type}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setJobFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi"
                    >
                      <option value="">Select job type</option>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2 font-satoshi">
                    Job Description
                  </label>
                  <textarea
                    value={jobFormData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJobFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi"
                    placeholder="Enter job description"
                  />
                </div>
                
                {/* Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2 font-satoshi">
                    Requirements
                  </label>
                  <div className="space-y-2">
                    {jobFormData.requirements.map((req, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={req}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateArrayItem('requirements', index, e.target.value)}
                          className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi"
                          placeholder="Enter requirement"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('requirements', index)}
                          className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-satoshi"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('requirements')}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-satoshi"
                    >
                      Add Requirement
                    </button>
                  </div>
                </div>
                
                {/* Responsibilities */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2 font-satoshi">
                    Responsibilities
                  </label>
                  <div className="space-y-2">
                    {jobFormData.responsibilities.map((resp, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={resp}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateArrayItem('responsibilities', index, e.target.value)}
                          className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi"
                          placeholder="Enter responsibility"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('responsibilities', index)}
                          className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-satoshi"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('responsibilities')}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-satoshi"
                    >
                      Add Responsibility
                    </button>
                  </div>
                </div>
                
                {/* Benefits */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2 font-satoshi">
                    Benefits
                  </label>
                  <div className="space-y-2">
                    {jobFormData.benefits.map((benefit, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={benefit}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateArrayItem('benefits', index, e.target.value)}
                          className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi"
                          placeholder="Enter benefit"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('benefits', index)}
                          className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-satoshi"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('benefits')}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-satoshi"
                    >
                      Add Benefit
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={jobFormData.isActive}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-800 font-satoshi">
                      Active job posting
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowJobModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-satoshi"
                >
                  Cancel
                </button>
                <Button
                  onClick={handleSaveJob}
                  disabled={isSubmitting}
                  size="lg"
                  className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : editingJob ? 'Update' : 'Create'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 
