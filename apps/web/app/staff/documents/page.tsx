// NOTE: This page is accessible to both staff (role: 'staff') and admin (role: 'admin') users.
// All admins are staff, but not all staff are admins.
'use client';

// Import removed as it's not being used and causing module not found error
import { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useRef, useState } from 'react';

import { useStaffAuthContext } from '@/app/staff/staff-auth-context';
import { AuthWrapper } from "@/components/layout/AuthWrapper";
import { BackButton } from '@/components/staff/BackButton';
import { PageContainer } from '@/components/staff/PageContainer';
import { UnauthenticatedState } from '@/components/ui/UnauthenticatedState';
import { GlassCard } from '@/components/ui/glass-card';
import { api } from "@/convex/_generated/api";
import { staffFetch } from '@/lib/api/staff-api-helper';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: 'contract' | 'policy' | 'form' | 'certificate' | 'payroll' | 'benefits';
  status: 'approved' | 'pending' | 'rejected';
  uploadDate: string;
  expiryDate?: string;
  size: string;
  description: string;
}

export default function StaffDocumentsPage() {
  // Auth is handled by layout via session-based authentication (session token in cookies)
  // Middleware (proxy.ts) validates session token server-side, no client-side checks needed

  const { staff: staffUser, sessionToken } = useStaffAuthContext();
  const documents = useQuery(api.queries.users.getUserDocuments, staffUser?.email && sessionToken ? { email: staffUser.email, sessionToken } : "skip");
  const addDocument = useMutation(api.mutations.documents.uploadDocument);
  
  // State for file upload
  const [file, setFile] = useState<File | null>(null);
  // Document filter state
  const [type, setType] = useState<Document['type'] | ''>('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | ''>('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth is handled at layout level, no page-level checks needed
  // Wait for documents data to load
  if (!documents) {
    return <UnauthenticatedState type="loading" role="staff" message="Loading your documents..." />;
  }
  // Define the document type from the database
  interface DatabaseDocument {
    _id: Id<"documents">;
    _creationTime: number;
    name: string;
    type: Document['type'];
    status: Document['status'];
    uploadDate: string;
    expiryDate?: string;
    size: string;
    description: string;
    userEmail: string;
    storageId: Id<"_storage">;
  }

  // Extend with additional UI-specific properties
  interface DocumentWithEmail extends Omit<DatabaseDocument, 'id' | '_id'> {
    id: string;
    fileUrl: string;
  }

  // Convert database documents to UI documents with file URLs
  const mappedDocs = (documents as DatabaseDocument[]).map(doc => ({
    ...doc,
    id: doc._id,
    fileUrl: `/api/files/${doc.storageId}`
  }));

  // Filter documents based on user role and filters
  const filteredDocs = mappedDocs.filter((doc) => {
    // Base filter for staff members (can only see their own pending/approved docs)
    const isVisibleToStaff = 
      doc.status === 'approved' || 
      (doc.userEmail === staffUser?.email && doc.status !== 'rejected');
    
    // Apply type filter if selected
    const typeMatches = !type || doc.type === type;
    
    // Apply status filter if selected
    const statusMatches = !statusFilter || doc.status === statusFilter;
    
    return isVisibleToStaff && typeMatches && statusMatches;
  });

  // Define type for document status
  type DocumentStatus = 'approved' | 'pending' | 'rejected';
  
  // Define type for document type
  type DocumentType = 'contract' | 'policy' | 'form' | 'certificate' | 'payroll' | 'benefits';

  // Get status icon component based on document status
  const getStatusIcon = (status: DocumentStatus) => {
    const statusIcons = {
      'approved': <CheckCircle className="w-5 h-5 text-green-500" />,
      'pending': <Clock className="w-5 h-5 text-[#F23E2E]" />,
      'rejected': <AlertCircle className="w-5 h-5 text-red-500" />
    } as const;
    return statusIcons[status] || <FileText className="w-5 h-5 text-gray-500" />;
  };

  // Get status color class based on document status
  const getStatusColor = (status: DocumentStatus): string => {
    const statusColors: Record<DocumentStatus, string> = {
      'approved': 'text-green-400',
      'pending': 'text-[#F23E2E]',
      'rejected': 'text-red-400'
    };
    return statusColors[status] || 'text-gray-400';
  };

  // Get type color class based on document type
  const getTypeColor = (type: DocumentType): string => {
    const typeColors: Record<DocumentType, string> = {
      'contract': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'policy': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'form': 'bg-green-500/20 text-green-400 border-green-500/30',
      'certificate': 'bg-[#F23E2E]/20 text-[#F23E2E] border-[#F23E2E]/30',
      'payroll': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'benefits': 'bg-pink-500/20 text-pink-400 border-pink-500/30'
    };
    return typeColors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const handleDownload = (document: DocumentWithEmail) => {
    if (document.fileUrl) {
      window.open(document.fileUrl, '_blank');
    }
  };

  const handleView = (document: DocumentWithEmail) => {
    if (document.fileUrl) {
      window.open(document.fileUrl, '_blank');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type if needed
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!validTypes.includes(selectedFile.type)) {
        setUploadError('Please upload a PDF, JPEG, or PNG file');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      // Validate file size (e.g., 5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (selectedFile.size > maxSize) {
        setUploadError('File size should be less than 5MB');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      setFile(selectedFile);
      setUploadError(null);
    }
  };
  
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setType(e.target.value as Document['type']);
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  };

  interface UploadResponse {
    success: boolean;
    fileUrl: string;
    storageId: Id<"_storage">;
    error?: string;
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !staffUser?.email) {
      setUploadError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userEmail', staffUser.email);
      formData.append('type', type);
      
      const res = await staffFetch('/api/staff/upload-document', {
        method: 'POST',
        body: formData,
      });
      
      const data: UploadResponse = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }
      
      // Save metadata in Convex
      if (data.fileUrl) {
        await addDocument({userEmail: staffUser?.email || '',
          name: file.name,
          type: type as Document['type'],
          size: `${(file.size / 1024).toFixed(2)} KB`,
          description,
          storageId: data.storageId,
          sessionToken: sessionToken || undefined
        });
      }
      
      // Reset form
      setFile(null);
      setDescription('');
      setType('contract');
      
    } catch (err) {
      const error = err as Error;
      setUploadError(error.message || 'Failed to upload document');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  if (filteredDocs.length === 0) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500 font-satoshi">No documents found.</div>;
  }

  return (
    <AuthWrapper role="staff">
      <div className="min-h-screen bg-white/95 backdrop-blur-sm">
        <PageContainer>
          <BackButton href="/staff/portal" className="mb-4" />
        {/* Upload Form */}
        <GlassCard className="p-6 mb-8">
          <form onSubmit={handleUpload} className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
              <input 
                ref={fileInputRef}
                type="file" 
                onChange={handleFileChange} 
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary-50 file:text-primary-700
                  hover:file:bg-primary-100" 
                accept=".pdf,.jpg,.jpeg,.png"
                required 
              />
            </div>
            
            <div className="w-full sm:w-40">
              <label htmlFor="document-type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select 
                id="document-type"
                value={type} 
                onChange={handleTypeChange} 
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="contract">Contract</option>
                <option value="policy">Policy</option>
                <option value="form">Form</option>
                <option value="certificate">Certificate</option>
                <option value="payroll">Payroll</option>
                <option value="benefits">Benefits</option>
              </select>
            </div>
            
            <div className="w-full flex-1">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input 
                id="description"
                type="text" 
                value={description} 
                onChange={handleDescriptionChange} 
                placeholder="Enter document description" 
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500" 
              />
            </div>
            
            <div className="w-full sm:w-auto self-end">
              <button 
                type="submit" 
                disabled={uploading || !file} 
                className="w-full px-4 py-2 bg-[#F23E2E] text-white rounded-lg 
                  hover:bg-[#ed1d12] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F23E2E]
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </span>
                ) : 'Upload'}
              </button>
            </div>
          </form>
          {uploadError && <div className="text-red-500 mt-2">{uploadError}</div>}
        </GlassCard>

        {/* Document Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Approved Documents Stat */}
          <GlassCard className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-white/60">Available</p>
                <p className="text-xl font-medium text-green-400">
                  {filteredDocs.filter((d: DocumentWithEmail) => d.status === 'approved').length}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Pending Documents Stat */}
          <GlassCard className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-[#F23E2E]/10">
                <Clock className="w-6 h-6 text-[#F23E2E]" />
              </div>
              <div>
                <p className="text-sm text-white/60">Pending</p>
                <p className="text-xl font-medium text-[#F23E2E]">
                  {filteredDocs.filter((d: DocumentWithEmail) => d.status === 'pending').length}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Rejected Documents Stat */}
          <GlassCard className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-white/60">Rejected</p>
                <p className="text-xl font-medium text-red-400">
                  {filteredDocs.filter((d: DocumentWithEmail) => d.status === 'rejected').length}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-white/60">Total</p>
                <p className="text-xl font-medium text-blue-400">{filteredDocs.length}</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Documents List */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-asgard text-white">Your Documents</h2>
            <div className="flex space-x-2">
              <div className="relative">
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value as Document['type'] | '')}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#F23E2E] appearance-none pr-8"
                >
                  <option value="">All Types</option>
                  <option value="contract">Contracts</option>
                  <option value="policy">Policies</option>
                  <option value="form">Forms</option>
                  <option value="certificate">Certificates</option>
                  <option value="payroll">Payroll</option>
                  <option value="benefits">Benefits</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              <div className="relative">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | '')}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#F23E2E] appearance-none pr-8"
                >
                  <option value="">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredDocs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                <h3 className="text-lg font-medium text-white mb-1">No documents found</h3>
                <p className="text-gray-400">
                  {statusFilter || type 
                    ? 'Try adjusting your filters or upload a new document.'
                    : 'Upload your first document to get started.'}
                </p>
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <div
                  key={doc._id}
                  className="group flex items-center justify-between p-4 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <div className="mt-1">
                      {getStatusIcon(doc.status)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-white truncate">{doc.name}</h3>
                      {doc.description && (
                        <p className="text-sm text-white/60 truncate">{doc.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(doc.type)}`}>
                          {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                        </span>
                        <span className="text-xs text-white/60">{doc.size}</span>
                        <span className="text-xs text-white/60 flex items-center">
                          <Calendar className="w-3 h-3 mr-1 shrink-0" />
                          {new Date(doc.uploadDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        {doc.expiryDate && (
                          <span 
                            className={`text-xs flex items-center ${
                              new Date(doc.expiryDate) < new Date() 
                                ? 'text-red-400' 
                                : 'text-white/60'
                            }`}
                          >
                            <Calendar className="w-3 h-3 mr-1 shrink-0" />
                            Expires: {new Date(doc.expiryDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 ml-4">
                    <span className={`text-sm font-medium whitespace-nowrap ${getStatusColor(doc.status)}`}>
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleView(doc)}
                        className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
                        title="View document"
                        aria-label="View document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
                        title="Download document"
                        aria-label="Download document"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Important Notices */}
        <div className="mt-8">
          <h2 className="text-xl font-asgard text-gray-900 mb-4">Important Notices</h2>
          <GlassCard className="p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Expired Certificate</p>
                  <p className="text-sm text-white/60">Your Food Safety Certificate has expired. Please renew it to maintain compliance.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-[#F23E2E] mt-0.5" />
                <div>
                  <p className="text-white font-medium">Pending Benefits Enrollment</p>
                  <p className="text-sm text-white/60">Complete your benefits enrollment form to activate your coverage.</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </PageContainer>
    </div>
    </AuthWrapper>
  );
} 
