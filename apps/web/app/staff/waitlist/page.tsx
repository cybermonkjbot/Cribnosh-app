import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { useStaffAuthContext } from '@/app/staff/staff-auth-context';
import { WaitlistEntryCard } from '@/components/staff/WaitlistEntryCard';
import { UnauthenticatedState } from '@/components/ui/UnauthenticatedState';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WaitlistEntrySkeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/convex/_generated/api';
import { useSessionToken } from '@/hooks/useSessionToken';
import { useMutation, useQuery } from 'convex/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Filter, Mail, Plus, RefreshCw, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

interface WaitlistEntry {
  _id: string;
  email: string;
  name?: string;
  phone?: string;
  location?: string;
  source: string;
  status: 'active' | 'converted' | 'inactive';
  priority: 'low' | 'medium' | 'high' | 'vip';
  joinedAt: number;
  notes?: string;
  addedBy?: string;
  addedByName?: string;
}

interface AddLeadFormData {
  email: string;
}

export default function StaffWaitlistPage() {
  const { user: adminUser, loading: adminLoading } = useAdminUser();
  const { staff: staffUser, loading: staffAuthLoading } = useStaffAuthContext();
  const sessionToken = useSessionToken();
  const [activeTab, setActiveTab] = useState('add');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [formData, setFormData] = useState<AddLeadFormData>({ email: '' });
  const [formErrors, setFormErrors] = useState<{ email?: string }>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  const staffMember = staffUser || (adminUser ? {
    _id: adminUser._id,
    email: adminUser.email,
    roles: [adminUser.role],
    status: adminUser.status || 'active',
  } : null);

  const addToWaitlist = useMutation(api.mutations.waitlist.addToWaitlist);
  const logActivity = useMutation(api.mutations.admin.logActivity);

  // Fetch waitlist entries using useQuery
  const entriesData = useQuery(
    api.queries.waitlist.getWaitlistEntries,
    staffMember && sessionToken ? {
      status: statusFilter === 'all' ? undefined : (statusFilter as any),
      search: searchTerm || undefined,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      addedBy: staffMember._id,
      sessionToken,
    } : 'skip'
  );

  const entries = (entriesData?.entries as WaitlistEntry[]) || [];
  const totalEntries = entriesData?.total || 0;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const isLoadingEntries = entriesData === undefined && !!staffMember && !!sessionToken;

  // Handle errors (Convex queries return undefined while loading, then data or null)
  // If useQuery returns null, it might indicate an error or no data depending on implementation
  // But here total=0 entries=[] is more likely.


  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffMember) return;

    // Clear previous errors and success message
    setFormErrors({});
    setSuccessMessage('');

    // Basic validation
    const errors: { email?: string } = {};
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addToWaitlist({
        email: formData.email,
        name: undefined,
        phone: undefined,
        location: undefined,
        source: 'staff_referral',
        referralCode: undefined, // Staff-added leads don't have referral codes
        addedBy: staffMember._id,
        addedByName: staffMember.email,
      });

      if (result.success) {
        const message = result.isExisting
          ? `Lead ${formData.email} was already in the waitlist`
          : `Lead ${formData.email} successfully added to waitlist`;

        setSuccessMessage(message);
        toast.success(message, {
          description: result.isExisting
            ? 'The email was already registered'
            : 'New lead added successfully',
          duration: 4000,
        });

        // Log the staff action
        await logActivity({
          type: 'staff_added_lead',
          description: `Staff member added lead ${formData.email} to waitlist`,
          userId: staffMember._id,
          metadata: {
            entityId: result.waitlistId || "",
            entityType: 'waitlist',
            details: {
              staffEmail: staffMember.email,
              leadEmail: formData.email,
              source: 'staff_referral',
              priority: 'medium',
            },
          },
        });

        setFormData({ email: '' });
        // Reset to first page to see the new entry
        setCurrentPage(1);
        setActiveTab('view');

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        const errorMessage = 'Failed to add lead to waitlist';
        setFormErrors({ email: errorMessage });
        toast.error(errorMessage, {
          description: 'Please check the email address and try again',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error adding lead:', error);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setFormErrors({ email: errorMessage });
      toast.error(errorMessage, {
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Conditional UI states ---
  // Auth is handled at layout level, no page-level checks needed
  // Wait for staff member data to load
  if (!staffMember && (adminLoading || staffAuthLoading)) {
    return null; // Layout handles loading state
  }

  if (staffMember === null && !adminLoading && !staffAuthLoading) {
    return <UnauthenticatedState type="unauthenticated" role="staff" message="Staff member not found." />;
  }


  // --- Main waitlist UI ---
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-white">
      {/* Background accents */}
      <div className="pointer-events-none select-none absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-[#F23E2E]/5 blur-3xl z-0" />
      <div className="pointer-events-none select-none absolute bottom-0 right-0 w-[320px] h-[320px] rounded-full bg-[#F23E2E]/3 blur-2xl z-0" />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/staff/portal" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200/60 text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-colors font-satoshi text-sm font-medium shadow-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold font-asgard text-gray-900 mb-2">
            Waitlist Management
          </h1>
          <p className="text-gray-600 font-satoshi">
            Add leads directly to the waitlist and manage entries you added
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/70 backdrop-blur-sm border border-gray-200/50">
            <TabsTrigger value="add" className="font-satoshi">Add Lead</TabsTrigger>
            <TabsTrigger value="view" className="font-satoshi">View Entries</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-6">
            <GlassCard className="p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-[#F23E2E]/10 rounded-xl mb-4">
                    <Plus className="w-6 h-6 text-[#F23E2E]" />
                  </div>
                  <h2 className="text-xl font-bold font-asgard text-gray-900 mb-2">
                    Add New Lead
                  </h2>
                  <p className="text-gray-600 font-satoshi">
                    Add a lead directly to the waitlist without email verification
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <GlassInput
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      // Clear error when user starts typing
                      if (formErrors.email) {
                        setFormErrors({});
                      }
                    }}
                    placeholder="lead@example.com"
                    required
                    icon={<Mail className="w-4 h-4" />}
                    helperText="Enter the lead's email address"
                    error={formErrors.email}
                  />

                  {successMessage && (
                    <Alert className="bg-green-50/80 backdrop-blur-sm border border-green-200/50">
                      <AlertDescription className="text-green-800 font-satoshi">
                        {successMessage}
                      </AlertDescription>
                    </Alert>
                  )}

                  <GlassButton
                    type="submit"
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    className="w-full"
                    icon={<Plus className="w-4 h-4" />}
                  >
                    {isSubmitting ? 'Adding Lead...' : 'Add Lead to Waitlist'}
                  </GlassButton>
                </form>
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="view" className="space-y-6">
            <GlassCard className="p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100/80 rounded-xl mb-4">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold font-asgard text-gray-900 mb-2">
                    Waitlist Entries
                  </h2>
                  <p className="text-gray-600 font-satoshi">
                    View and manage waitlist entries you added
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <GlassInput
                      placeholder="Search by email or name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      icon={<Search className="w-4 h-4" />}
                    />
                  </div>
                  <div className="w-full sm:w-48">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full bg-white/70 backdrop-blur-sm border border-gray-200/50">
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4 text-gray-400" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <GlassButton
                    onClick={() => { }} // useQuery updates automatically
                    variant="outline"
                    disabled={isLoadingEntries}
                    icon={<RefreshCw className="w-4 h-4" />}
                  >
                    Refresh
                  </GlassButton>
                </div>

                {/* Results */}
                {isLoadingEntries ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <WaitlistEntrySkeleton key={i} />
                    ))}
                  </div>
                ) : entries.length === 0 ? (
                  <Alert className="bg-white/70 backdrop-blur-sm border border-gray-200/50">
                    <AlertDescription className="font-satoshi">
                      {searchTerm || statusFilter !== 'all'
                        ? 'No entries match your search criteria.'
                        : 'No waitlist entries found.'}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 font-satoshi">
                      <span>
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} entries you added
                      </span>
                    </div>
                    {entries.map((entry) => (
                      <WaitlistEntryCard key={entry._id} entry={entry} />
                    ))}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
                        <div className="flex items-center gap-2">
                          <GlassButton
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || isLoadingEntries}
                            variant="outline"
                            icon={<ChevronLeft className="w-4 h-4" />}
                          >
                            Previous
                          </GlassButton>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum: number;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }

                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  disabled={isLoadingEntries}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-satoshi transition-colors ${currentPage === pageNum
                                      ? 'bg-[#F23E2E] text-white'
                                      : 'bg-white/70 hover:bg-white/90 text-gray-700'
                                    } ${isLoadingEntries ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          <GlassButton
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || isLoadingEntries}
                            variant="outline"
                            icon={<ChevronRight className="w-4 h-4" />}
                          >
                            Next
                          </GlassButton>
                        </div>
                        <div className="text-sm text-gray-600 font-satoshi">
                          Page {currentPage} of {totalPages}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
