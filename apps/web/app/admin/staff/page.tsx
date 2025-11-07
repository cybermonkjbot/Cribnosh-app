"use client";
import { AuthWrapper } from '@/components/layout/AuthWrapper';
import { StaffTableSkeleton } from '@/components/admin/skeletons';
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Plus, Search, Shield, Users, Upload, FileText, Eye, Edit, Trash, Filter, Download } from "lucide-react";
import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'motion/react';

interface StaffUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
}

interface Document {
  _id: Id<"documents">;
  name?: string;
  type?: string;
  userEmail?: string;
  uploadedAt?: number | string;
  status?: string;
  [key: string]: unknown;
}

export default function AdminStaffPage() {
  const staff = useQuery(api.queries.users.getAllStaff) as StaffUser[] | undefined;
  const documents = useQuery(api.queries.users.getAllDocuments, {}) as Document[] | undefined;
  const uploadDocument = useMutation(api.mutations.documents.uploadDocument);
  const updateDocumentStatus = useMutation(api.mutations.documents.updateDocumentStatus);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState('contract');
  const [description, setDescription] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredStaff = useMemo(() => {
    if (!staff) return [];
    return staff.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
                           user.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || (user.status || 'active') === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staff, search, roleFilter, statusFilter]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedStaff) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userEmail', selectedStaff);
      formData.append('type', type);
      const res = await fetch('/api/staff/upload-document', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      await uploadDocument({
        userEmail: selectedStaff,
        name: file.name,
        type,
        size: file.size.toString(),
        description,
        storageId: data.storageId,
      });
      setFile(null);
      setDescription('');
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (id: Id<'documents'>) => {
    await updateDocumentStatus({ documentId: id, status: 'active' });
  };
  
  const handleReject = async (id: Id<'documents'>) => {
    await updateDocumentStatus({ documentId: id, status: 'inactive' });
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'bg-destructive/10 text-destructive border-destructive/20',
      moderator: 'bg-primary-100 text-primary-800 border-primary-200',
      chef: 'bg-primary-100 text-primary-800 border-primary-200',
      employee: 'bg-primary-100 text-primary-800 border-primary-200'
    };
    return variants[role as keyof typeof variants] || variants.employee;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-primary-100 text-primary-800 border-primary-200',
      inactive: 'bg-muted text-muted-foreground border-muted',
      suspended: 'bg-destructive/10 text-destructive border-destructive/20'
    };
    return variants[status as keyof typeof variants] || variants.active;
  };

  // Auto-dismiss upload error after 5 seconds
  useEffect(() => {
    if (uploadError) {
      const timer = setTimeout(() => setUploadError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadError]);

  return (
    <AuthWrapper role="admin">
      <div className="space-y-8">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold font-asgard text-gray-900 mb-3 flex items-center gap-3">
              <div className="p-3 bg-primary-100 rounded-xl">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              Staff Management
            </h1>
            <p className="text-gray-700 font-satoshi text-lg">
              Manage staff members, roles, and document uploads
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="lg"
              className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Staff
            </Button>
            <Button 
              size="lg"
              className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white shadow-lg"
              disabled
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Staff (Coming Soon)
            </Button>
          </div>
        </motion.div>

        {/* Enhanced Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold font-asgard text-gray-900">Search & Filters</h3>
          </div>
          
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium font-satoshi text-gray-700">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search staff by name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 bg-white/80 border-gray-200"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium font-satoshi text-gray-700">Role</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="bg-white/80 border-gray-200">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="chef">Chef</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium font-satoshi text-gray-700">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white/80 border-gray-200">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium font-satoshi text-gray-700">Total Staff</label>
              <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                <span className="text-2xl font-bold font-asgard text-primary-600">
                  {filteredStaff.length}
                </span>
                <p className="text-xs text-primary-600 font-satoshi">Members</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Staff Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Staff Member</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/60">
                {!staff ? (
                  <StaffTableSkeleton rowCount={5} />
                ) : filteredStaff && filteredStaff.length > 0 ? (
                  filteredStaff.map(user => (
                    <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <Shield className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-semibold font-asgard text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-600 font-satoshi">ID: {user._id.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <a 
                          href={`mailto:${user.email}`} 
                          className="text-primary-600 hover:text-primary-700 hover:underline font-satoshi"
                        >
                          {user.email}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${getRoleBadge(user.role)} capitalize`}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${getStatusBadge(user.status || 'active')}`}>
                          {user.status || "Active"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={`/admin/staff/${user._id}`}>
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-12 h-12 text-gray-500" />
                        <p className="text-gray-700 font-satoshi">No staff members found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Document Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-6">
            <Upload className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold font-asgard text-gray-900">Document Upload</h3>
          </div>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium font-satoshi text-gray-700">Staff Member</label>
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                  <SelectTrigger className="bg-white/80 border-gray-200">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff?.map(user => (
                      <SelectItem key={user._id} value={user.email}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium font-satoshi text-gray-700">Document Type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="bg-white/80 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="id">ID Document</SelectItem>
                    <SelectItem value="certificate">Certificate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium font-satoshi text-gray-700">File</label>
                <Input
                  type="file"
                  onChange={handleFileChange}
                  className="bg-white/80 border-gray-200"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium font-satoshi text-gray-700">Description</label>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Document description..."
                className="bg-white/80 border-gray-200"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                type="submit" 
                disabled={!file || !selectedStaff || uploading}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Document'}
              </Button>
              
              {uploadError && (
                <p className="text-red-600 text-sm font-satoshi">{uploadError}</p>
              )}
            </div>
          </form>
        </motion.div>

        {/* Documents List */}
        {documents && documents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl"
          >
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold font-asgard text-gray-900">Recent Documents</h3>
            </div>
            
            <div className="space-y-3">
              {documents?.slice(0, 5).map((doc: Document) => (
                <div key={doc._id} className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-gray-200/60">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="font-medium font-satoshi text-gray-900">{doc.name}</p>
                      <p className="text-sm text-gray-600 font-satoshi">{doc.type} • {doc.userEmail || doc.uploadedAt || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={doc.status === 'active' ? 'bg-primary-100 text-primary-800 border-primary-200' : 'bg-muted text-muted-foreground border-muted'}>
                      {doc.status}
                    </Badge>
                    
                    {doc.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(doc._id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(doc._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </AuthWrapper>
  );
} 
