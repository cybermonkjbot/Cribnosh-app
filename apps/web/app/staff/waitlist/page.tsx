'use client';

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { WaitlistEntryCard } from '@/components/staff/WaitlistEntryCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WaitlistEntrySkeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnauthenticatedState } from '@/components/ui/UnauthenticatedState';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { staffFetch } from '@/lib/api/staff-api-helper';
import { Filter, Mail, Plus, RefreshCw, Search, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
  const { staff: staffUser, loading: staffAuthLoading } = useStaffAuth();
  const [activeTab, setActiveTab] = useState('add');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [staffMember, setStaffMember] = useState<{ roles?: string[]; status?: string; email?: string } | null>(null);
  const [localStaffLoading, setLocalStaffLoading] = useState(true);
  const [formData, setFormData] = useState<AddLeadFormData>({
    email: '',
  });
  const [formErrors, setFormErrors] = useState<{ email?: string }>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Use staff user data from hook when available
  useEffect(() => {
    if (staffUser) {
      setStaffMember(staffUser);
      setLocalStaffLoading(false);
    } else if (adminUser && adminUser.email) {
      // Fallback to admin user if available
      setStaffMember({
        email: adminUser.email,
        roles: adminUser.role ? [adminUser.role] : [],
        status: adminUser.status || 'active',
      });
      setLocalStaffLoading(false);
    } else if (!staffAuthLoading && !adminLoading) {
      // If both loading is complete and no user, try to fetch from API as fallback
      async function fetchStaffData() {
        setLocalStaffLoading(true);
        try {
          const res = await staffFetch('/api/staff/data');
          if (res.ok) {
            const data = await res.json();
            setStaffMember(data.data); // Extract the actual data from the API response
          } else {
            setStaffMember(null);
          }
        } catch (error) {
          setStaffMember(null);
        } finally {
          setLocalStaffLoading(false);
        }
      }
      fetchStaffData();
    }
  }, [staffUser, staffAuthLoading, adminUser, adminLoading]);

  // Load waitlist entries
  const loadEntries = useCallback(async () => {
    if (!staffMember) return;
    
    setIsLoadingEntries(true);
    setEntriesError(null);
    try {
      const response = await staffFetch('/api/staff/waitlist', {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setEntries(data.data.entries || []);
        setEntriesError(null);
        toast.success(`Loaded ${data.data.entries.length} waitlist entries`, {
          description: 'Entries refreshed successfully',
          duration: 2000,
        });
      } else {
        throw new Error(data.message || 'Failed to load waitlist entries');
      }
    } catch (error) {
      console.error('Error loading entries:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load waitlist entries';
      setEntriesError(errorMessage);
      toast.error(errorMessage, {
        description: 'Please try refreshing the page',
        duration: 5000,
      });
    } finally {
      setIsLoadingEntries(false);
    }
  }, [staffMember]);

  // Load entries on component mount
  useEffect(() => {
    if (staffMember) {
      loadEntries();
    }
  }, [staffMember, loadEntries]);

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
      const response = await staffFetch('/api/staff/waitlist', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        const message = data.data.isExisting 
          ? `Lead ${formData.email} was already in the waitlist`
          : `Lead ${formData.email} successfully added to waitlist`;
        
        setSuccessMessage(message);
        toast.success(message, {
          description: data.data.isExisting 
            ? 'The email was already registered'
            : 'New lead added successfully',
          duration: 4000,
        });
        
        setFormData({ email: '' });
        // Reload entries to show the new one
        loadEntries();
        setActiveTab('view');
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        const errorMessage = data.message || 'Failed to add lead to waitlist';
        setFormErrors({ email: errorMessage });
        toast.error(errorMessage, {
          description: 'Please check the email address and try again',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error adding lead:', error);
      const errorMessage = 'Network error. Please check your connection and try again.';
      setFormErrors({ email: errorMessage });
      toast.error(errorMessage, {
        description: 'Unable to connect to the server',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter entries based on search and status
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchTerm || 
      entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.name && entry.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // --- Conditional UI states ---
  if (adminLoading || staffAuthLoading || localStaffLoading) {
    return <UnauthenticatedState type="loading" role="staff" message="Loading waitlist management..." />;
  }

  if (!staffUser && !adminUser) {
    return <UnauthenticatedState type="unauthenticated" role="staff" message="Please log in to access waitlist management." />;
  }

  if (staffMember === null) {
    return <UnauthenticatedState type="unauthenticated" role="staff" message="Staff member not found." />;
  }

  if (!staffMember.roles?.includes('staff') && !staffMember.roles?.includes('admin')) {
    return <UnauthenticatedState type="unauthorized" role="staff" message="Access denied: You do not have staff access." />;
  }

  if (staffMember.status && staffMember.status !== 'active') {
    return <UnauthenticatedState type="inactive-account" role="staff" />;
  }

  // --- Main waitlist UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        {/* Background accents */}
        <div className="pointer-events-none select-none absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-[#F23E2E]/5 blur-3xl z-0" />
        <div className="pointer-events-none select-none absolute bottom-0 right-0 w-[320px] h-[320px] rounded-full bg-[#F23E2E]/3 blur-2xl z-0" />
        
        <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold font-asgard text-gray-900 mb-2">
              Waitlist Management
            </h1>
            <p className="text-gray-600 font-satoshi">
              Add leads directly to the waitlist and manage existing entries
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
                      View and manage existing waitlist entries
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
                      onClick={loadEntries} 
                      variant="outline" 
                      disabled={isLoadingEntries}
                      icon={<RefreshCw className="w-4 h-4" />}
                    >
                      Refresh
                    </GlassButton>
                  </div>

                  {/* Error Display */}
                  {entriesError && (
                    <Alert className="bg-red-50/80 backdrop-blur-sm border border-red-200/50">
                      <AlertDescription className="text-red-800 font-satoshi">
                        <div className="space-y-2">
                          <p className="font-semibold">Error loading waitlist entries:</p>
                          <p>{entriesError}</p>
                          <button
                            onClick={loadEntries}
                            className="text-sm underline hover:no-underline"
                          >
                            Try again
                          </button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Results */}
                  {isLoadingEntries ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <WaitlistEntrySkeleton key={i} />
                      ))}
                    </div>
                  ) : entriesError ? null : filteredEntries.length === 0 ? (
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
                          Showing {filteredEntries.length} of {entries.length} entries
                          {(searchTerm || statusFilter !== 'all') && ' (filtered)'}
                        </span>
                      </div>
                      {filteredEntries.map((entry) => (
                        <WaitlistEntryCard key={entry._id} entry={entry} />
                      ))}
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
