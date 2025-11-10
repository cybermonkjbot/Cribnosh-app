"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { PriorityBadge, StatusBadge } from '@/components/ui/glass-badges';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  ClipboardList,
  Edit,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Tag,
  Trash2,
  User,
  X,
  XCircle
} from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
// Auth is handled by layout, no need for AuthWrapper
import { WaitlistCardSkeleton } from '@/components/admin/skeletons';

type WaitlistEntry = Doc<"waitlist">;

export default function WaitlistDetail() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sessionToken } = useAdminUser();
  const { toast } = useToast();
  
  const entryId = params?.id as Id<"waitlist"> | undefined;
  const isEditMode = searchParams?.get('edit') === 'true';
  
  const [isEditing, setIsEditing] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [approveConfirm, setApproveConfirm] = useState(false);
  const [rejectConfirm, setRejectConfirm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    status: 'active' as 'active' | 'converted' | 'inactive',
    priority: 'normal' as 'low' | 'medium' | 'high' | 'vip' | 'normal',
    notes: '',
  });

  // Fetch entry
  const entry = useQuery(
    api.queries.waitlist.getById,
    entryId && sessionToken ? { id: entryId, sessionToken } : "skip"
  ) as WaitlistEntry | undefined;

  // Mutations
  const updateEntry = useMutation(api.mutations.waitlist.updateWaitlistEntry);
  const deleteEntry = useMutation(api.mutations.waitlist.deleteWaitlistEntry);
  const approveEntry = useMutation(api.mutations.waitlist.approveWaitlistEntry);
  const rejectEntry = useMutation(api.mutations.waitlist.rejectWaitlistEntry);

  // Initialize form data when entry loads
  useEffect(() => {
    if (entry) {
      setFormData({
        status: (entry.status as 'active' | 'converted' | 'inactive') || 'active',
        priority: (entry.priority as 'low' | 'medium' | 'high' | 'vip' | 'normal') || 'normal',
        notes: entry.notes || '',
      });
    }
  }, [entry]);

  // Helper function to get location string
  const getLocationString = (entry: WaitlistEntry | undefined): string => {
    if (!entry) return '';
    if (typeof entry.location === 'string') {
      return entry.location;
    }
    if (entry.location && typeof entry.location === 'object') {
      const loc = entry.location as any;
      const parts: string[] = [];
      if (loc.city) parts.push(loc.city);
      if (loc.region) parts.push(loc.region);
      if (loc.country) parts.push(loc.country);
      if (loc.country_name && !loc.country) parts.push(loc.country_name);
      return parts.join(', ');
    }
    return '';
  };

  const handleSave = async () => {
    if (!entryId) return;
    
    setIsSaving(true);
    try {
      await updateEntry({
        entryId,
        status: formData.status,
        priority: formData.priority,
        notes: formData.notes || undefined,
        sessionToken: sessionToken || undefined,
      });
      
      toast({
        title: "Entry updated",
        description: "The waitlist entry has been updated successfully.",
        variant: "success",
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Failed to update entry",
        description: "An error occurred while updating the entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entryId) return;
    
    setIsDeleting(true);
    try {
      await deleteEntry({
        entryId,
        sessionToken: sessionToken || undefined,
      });
      
      toast({
        title: "Entry deleted",
        description: "The waitlist entry has been deleted successfully.",
        variant: "success",
      });
      
      router.push('/admin/waitlist');
    } catch (error) {
      toast({
        title: "Failed to delete entry",
        description: "An error occurred while deleting the entry. Please try again.",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  const handleApprove = async () => {
    if (!entryId) return;
    
    setIsApproving(true);
    try {
      await approveEntry({
        entryId,
        sessionToken: sessionToken || undefined,
      });
      
      toast({
        title: "Entry approved",
        description: "The waitlist entry has been approved successfully.",
        variant: "success",
      });
      
      setApproveConfirm(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Failed to approve entry",
        description: "An error occurred while approving the entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!entryId) return;
    
    setIsRejecting(true);
    try {
      await rejectEntry({
        entryId,
        sessionToken: sessionToken || undefined,
      });
      
      toast({
        title: "Entry rejected",
        description: "The waitlist entry has been rejected successfully.",
        variant: "success",
      });
      
      setRejectConfirm(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Failed to reject entry",
        description: "An error occurred while rejecting the entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  if (!entryId) {
    return (
      <div className="container mx-auto py-6 space-y-[18px]">
        <p className="text-gray-900">Invalid entry ID</p>
      </div>
    );
  }

  if (entry === undefined) {
    return (
      <div className="container mx-auto py-6 space-y-[18px]">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <WaitlistCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (entry === null) {
    return (
      <div className="container mx-auto py-6 space-y-[18px]">
        <div className="text-center py-12">
          <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Entry Not Found</h2>
          <p className="text-gray-600 mb-4">The waitlist entry you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/admin/waitlist')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Waitlist
          </Button>
        </div>
      </div>
    );
  }

  const locationString = getLocationString(entry);

  return (
      <div className="container mx-auto py-6 space-y-[18px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/waitlist')}
              className="min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Waitlist
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-asgard text-gray-900">
                Waitlist Entry Details
              </h1>
              <p className="text-gray-600 font-satoshi mt-1">
                View and manage waitlist entry information
              </p>
            </div>
          </div>
          
          {!isEditing && (
            <div className="flex gap-2">
              {entry.status === 'pending' && (
                <>
                  <Button
                    onClick={() => setApproveConfirm(true)}
                    disabled={isApproving}
                    className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isApproving ? 'Approving...' : 'Approve'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRejectConfirm(true)}
                    disabled={isRejecting}
                    className="text-gray-900 hover:text-[#F23E2E]"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {isRejecting ? 'Rejecting...' : 'Reject'}
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="min-h-[44px]"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(true)}
                disabled={isDeleting}
                className="text-gray-900 hover:text-[#F23E2E] min-h-[44px]"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          )}
        </div>

        {/* Entry Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900 font-satoshi">{entry.email}</p>
                  </div>
                </div>
                
                {entry.name && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Name</Label>
                    <p className="mt-1 text-gray-900 font-satoshi">{entry.name}</p>
                  </div>
                )}
                
                {entry.phone && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Phone</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900 font-satoshi">{entry.phone}</p>
                    </div>
                  </div>
                )}
                
                {locationString && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Location</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900 font-satoshi">{locationString}</p>
                    </div>
                  </div>
                )}
                
                {entry.company && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Company</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900 font-satoshi">{entry.company}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status and Priority */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Status & Priority
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'active' | 'converted' | 'inactive') => 
                          setFormData(prev => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger id="status" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value: 'low' | 'medium' | 'high' | 'vip' | 'normal') => 
                          setFormData(prev => ({ ...prev, priority: value }))
                        }
                      >
                        <SelectTrigger id="priority" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="vip">VIP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="mt-1"
                        rows={4}
                        placeholder="Add notes about this entry..."
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Status</Label>
                      <div className="mt-2">
                        <StatusBadge status={entry.status || 'active'} />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Priority</Label>
                      <div className="mt-2">
                        <PriorityBadge priority={entry.priority || 'normal'} />
                      </div>
                    </div>
                    
                    {entry.notes && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Notes</Label>
                        <p className="mt-1 text-gray-900 font-satoshi whitespace-pre-wrap">{entry.notes}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Joined</Label>
                  <p className="mt-1 text-gray-900 font-satoshi">
                    {new Date(entry.joinedAt).toLocaleDateString()} ({formatDistanceToNow(entry.joinedAt, { addSuffix: true })})
                  </p>
                </div>
                
                {entry.convertedAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Converted</Label>
                    <p className="mt-1 text-gray-900 font-satoshi">
                      {new Date(entry.convertedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {entry.lastNotifiedAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Last Notified</Label>
                    <p className="mt-1 text-gray-900 font-satoshi">
                      {formatDistanceToNow(entry.lastNotifiedAt, { addSuffix: true })}
                    </p>
                  </div>
                )}
                
                {entry.updatedAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Last Updated</Label>
                    <p className="mt-1 text-gray-900 font-satoshi">
                      {formatDistanceToNow(entry.updatedAt, { addSuffix: true })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {entry.source && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Source</Label>
                    <p className="mt-1 text-gray-900 font-satoshi">{entry.source}</p>
                  </div>
                )}
                
                {entry.referralCode && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Referral Code</Label>
                    <p className="mt-1 text-gray-900 font-satoshi font-mono">{entry.referralCode}</p>
                  </div>
                )}
                
                {entry.addedByName && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Added By</Label>
                    <p className="mt-1 text-gray-900 font-satoshi">{entry.addedByName}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Actions */}
        {isEditing && (
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                // Reset form data
                if (entry) {
                  setFormData({
                    status: (entry.status as 'active' | 'converted' | 'inactive') || 'active',
                    priority: (entry.priority as 'low' | 'medium' | 'high' | 'vip' | 'normal') || 'normal',
                    notes: entry.notes || '',
                  });
                }
              }}
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="min-h-[44px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}

        {/* Confirmation Dialogs */}
        <ConfirmationDialog
          isOpen={deleteConfirm}
          onClose={() => setDeleteConfirm(false)}
          onConfirm={handleDelete}
          title="Delete Entry"
          message="Are you sure you want to delete this waitlist entry? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="error"
          isLoading={isDeleting}
        />

        <ConfirmationDialog
          isOpen={approveConfirm}
          onClose={() => setApproveConfirm(false)}
          onConfirm={handleApprove}
          title="Approve Entry"
          message="Are you sure you want to approve this waitlist entry?"
          confirmText="Approve"
          cancelText="Cancel"
          type="info"
          isLoading={isApproving}
        />

        <ConfirmationDialog
          isOpen={rejectConfirm}
          onClose={() => setRejectConfirm(false)}
          onConfirm={handleReject}
          title="Reject Entry"
          message="Are you sure you want to reject this waitlist entry? This action cannot be undone."
          confirmText="Reject"
          cancelText="Cancel"
          type="warning"
          isLoading={isRejecting}
        />
      </div>
  );
}
