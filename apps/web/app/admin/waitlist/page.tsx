"use client";

import { useAdminUser } from "@/app/admin/AdminUserProvider";
import { WaitlistCardSkeleton } from "@/components/admin/skeletons";
// Authentication is handled by layout, no need for AuthWrapper
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/hooks/use-toast";
import { countryCodeToFlagEmoji, countryNameToCode } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  BarChart2,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Copy,
  Download,
  Edit,
  Eye,
  FileText,
  List,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Table2,
  Trash2,
  Users,
  XCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/admin/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PriorityBadge, StatusBadge } from "@/components/ui/glass-badges";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WaitlistEntry {
  _id: string;
  _creationTime: number;
  email: string;
  name?: string;
  phone?: string;
  city?: string;
  company?: string;
  teamSize?: string;
  source?: string;
  status?: 'active' | 'converted' | 'inactive';
  priority?: 'low' | 'medium' | 'high' | 'vip' | 'normal';
  joinedAt: number;
  location?: {
    city?: string;
    region?: string;
    country?: string;
    country_name?: string;
    ip?: string;
    [key: string]: string | number | boolean | undefined;
  };
  notes?: string;
  referralCode?: string;
  referrer?: Id<"waitlist">;
}

type WaitlistEntryDoc = Doc<"waitlist">;

export default function AdminWaitlistPage() {
  const { user, sessionToken, loading } = useAdminUser();
  const router = useRouter();
  const { toast } = useToast();

  // Tab state - read from URL query param if present
  const [activeTab, setActiveTab] = useState<string>("list");

  // Read tab from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "details") {
        setActiveTab("details");
      }
    }
  }, []);

  // Fetch data - authentication is handled by layout, so user is guaranteed to be authenticated here
  // Pass sessionToken if available (for development debug cookie), otherwise rely on httpOnly cookie
  // Using "skip" pattern to avoid type inference issues
  const queryArgs = loading || !sessionToken ? "skip" : { sessionToken };
  const waitlist = useQuery(
    api.queries.waitlist.getAll,
    queryArgs
  ) as WaitlistEntry[] | undefined;

  // getWaitlistStats now requires sessionToken for authentication
  const waitlistStats = useQuery(
    api.queries.analytics.getWaitlistStats,
    user ? { sessionToken: sessionToken || undefined } : "skip"
  );

  // Mutations
  const deleteWaitlistEntry = useMutation(api.mutations.waitlist.deleteWaitlistEntry);
  const approveWaitlistEntry = useMutation(api.mutations.waitlist.approveWaitlistEntry);
  const rejectWaitlistEntry = useMutation(api.mutations.waitlist.rejectWaitlistEntry);

  // --- Filter State (shared between tabs) ---
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");

  // Details tab specific filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20; // Constant, not state

  // Details tab pagination
  const [detailsCurrentPage, setDetailsCurrentPage] = useState<number>(1);
  const detailsPageSize = 10;

  // Loading states
  const [isApproving, setIsApproving] = useState<Id<"waitlist"> | null>(null);
  const [isRejecting, setIsRejecting] = useState<Id<"waitlist"> | null>(null);
  const [isDeleting, setIsDeleting] = useState<Id<"waitlist"> | null>(null);

  // Confirmation dialogs
  const [approveConfirm, setApproveConfirm] = useState<{ isOpen: boolean; entryId: Id<"waitlist"> | null }>({
    isOpen: false,
    entryId: null,
  });
  const [rejectConfirm, setRejectConfirm] = useState<{ isOpen: boolean; entryId: Id<"waitlist"> | null }>({
    isOpen: false,
    entryId: null,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; entryId: Id<"waitlist"> | null }>({
    isOpen: false,
    entryId: null,
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
      setDetailsCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset city filter when country filter changes
  useEffect(() => {
    setCityFilter("all");
  }, [countryFilter]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, countryFilter, sourceFilter, cityFilter]);

  useEffect(() => {
    setDetailsCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, locationFilter]);

  // Helper function to extract location string from entry
  const getLocationString = useCallback((entry: WaitlistEntry | WaitlistEntryDoc): string => {
    if (typeof entry.location === 'string') {
      return entry.location;
    }
    if (entry.location && typeof entry.location === 'object') {
      const loc = entry.location as any;
      if (loc.city && loc.country) {
        return `${loc.city}, ${loc.country}`;
      }
      if (loc.city) return loc.city;
      if (loc.country) return loc.country;
      if (loc.country_name) return loc.country_name;
    }
    return '';
  }, []);

  // Normalize waitlist data - treat undefined/null as empty array
  // This must be declared before useMemo hooks that use it
  const waitlistData = waitlist || [];

  // --- Filtered Data for List Tab ---
  const filteredWaitlist = useMemo(() => {
    if (!waitlistData || waitlistData.length === 0) return [];
    return waitlistData.filter(entry => {
      const country = entry.location?.country || entry.location?.country_name || "";
      const source = entry.source || "";
      const city = entry.location?.city || entry.city || "";

      // Search filter
      const matchesSearch = debouncedSearchTerm === "" ||
        entry.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (entry.name && entry.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (entry.company && entry.company.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

      // Location filters
      const matchesCountry = countryFilter === "all" || country === countryFilter;
      const matchesSource = sourceFilter === "all" || source === sourceFilter;
      const matchesCity = cityFilter === "all" || city === cityFilter;

      // If country is selected, only show cities from that country
      const matchesCityInCountry = countryFilter === "all" || cityFilter === "all" ||
        (countryFilter !== "all" && country === countryFilter && city === cityFilter);

      return matchesSearch && matchesCountry && matchesSource && matchesCity && matchesCityInCountry;
    });
  }, [waitlistData, countryFilter, sourceFilter, cityFilter, debouncedSearchTerm]);

  // --- Filtered Data for Details Tab ---
  const filteredEntries = useMemo(() => {
    if (!waitlistData || waitlistData.length === 0) return [];

    return waitlistData.filter((entry: WaitlistEntry) => {
      const locationString = getLocationString(entry);
      const matchesSearch =
        entry.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (entry.name && entry.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        locationString.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || entry.priority === priorityFilter;
      const matchesLocation = locationFilter === 'all' || locationString === locationFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesLocation;
    }).sort((a: WaitlistEntry, b: WaitlistEntry) => {
      switch (sortBy) {
        case 'recent':
          return (b.joinedAt || 0) - (a.joinedAt || 0);
        case 'oldest':
          return (a.joinedAt || 0) - (b.joinedAt || 0);
        case 'name':
          return (a.name || a.email).localeCompare(b.name || b.email);
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'priority':
          const priorityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1, normal: 1 };
          return (priorityOrder[b.priority || 'normal'] || 1) - (priorityOrder[a.priority || 'normal'] || 1);
        default:
          return 0;
      }
    });
  }, [waitlistData, debouncedSearchTerm, statusFilter, priorityFilter, locationFilter, sortBy, getLocationString]);

  // --- Unique filter options ---
  const countryOptions = useMemo(() => {
    if (!waitlistData || waitlistData.length === 0) return [];
    const set = new Set<string>();
    waitlistData.forEach(entry => {
      const country = entry.location?.country || entry.location?.country_name;
      if (country) set.add(country);
    });
    return Array.from(set).sort();
  }, [waitlistData]);

  const sourceOptions = useMemo(() => {
    if (!waitlistData || waitlistData.length === 0) return [];
    const set = new Set<string>();
    waitlistData.forEach(entry => {
      if (entry.source) set.add(entry.source);
    });
    return Array.from(set).sort();
  }, [waitlistData]);

  const cityOptions = useMemo(() => {
    if (!waitlistData || waitlistData.length === 0) return [];
    const set = new Set<string>();
    waitlistData.forEach(entry => {
      const country = entry.location?.country || entry.location?.country_name || "";
      const city = entry.location?.city || entry.city;

      // If country filter is set, only show cities from that country
      if (countryFilter === "all" || country === countryFilter) {
        if (city) set.add(city);
      }
    });
    return Array.from(set).sort();
  }, [waitlistData, countryFilter]);

  const uniqueLocations = useMemo(() => {
    if (!waitlistData || waitlistData.length === 0) return [];
    const locations = new Set<string>();
    waitlistData.forEach((entry: WaitlistEntry) => {
      const locationString = getLocationString(entry);
      if (locationString) {
        locations.add(locationString);
      }
    });
    return Array.from(locations).sort();
  }, [waitlistData, getLocationString]);

  // Pagination for List Tab
  const totalPages = Math.ceil(filteredWaitlist.length / pageSize);
  const paginatedWaitlist = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredWaitlist.slice(startIndex, endIndex);
  }, [filteredWaitlist, currentPage, pageSize]);

  // Pagination for Details Tab
  const detailsTotalPages = Math.ceil(filteredEntries.length / detailsPageSize);
  const paginatedEntries = useMemo(() => {
    const startIndex = (detailsCurrentPage - 1) * detailsPageSize;
    const endIndex = startIndex + detailsPageSize;
    return filteredEntries.slice(startIndex, endIndex);
  }, [filteredEntries, detailsCurrentPage, detailsPageSize]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setCountryFilter("all");
    setSourceFilter("all");
    setCityFilter("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setLocationFilter("all");
    setCurrentPage(1);
    setDetailsCurrentPage(1);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return searchTerm !== "" || countryFilter !== "all" || sourceFilter !== "all" || cityFilter !== "all" ||
      statusFilter !== "all" || priorityFilter !== "all" || locationFilter !== "all";
  }, [searchTerm, countryFilter, sourceFilter, cityFilter, statusFilter, priorityFilter, locationFilter]);

  const handleExportCSV = useCallback(() => {
    const dataToExport = activeTab === "list" ? filteredWaitlist : filteredEntries;
    if (!dataToExport || dataToExport.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no entries matching your current filters.",
        variant: "destructive",
      });
      return;
    }

    try {
      const headers = ["Name", "Email", "Phone", "City", "Country", "Company", "Team Size", "Source", "Status", "Priority", "Joined"];
      const csvContent = [
        headers.join(","),
        ...dataToExport.map(entry => {
          const country = entry.location?.country || entry.location?.country_name || "";
          const city = entry.location?.city || entry.city || "";
          return [
            `"${(entry.name || "").replace(/"/g, '""')}"`,
            `"${entry.email.replace(/"/g, '""')}"`,
            `"${(entry.phone || "").replace(/"/g, '""')}"`,
            `"${city.replace(/"/g, '""')}"`,
            `"${country.replace(/"/g, '""')}"`,
            `"${(entry.company || "").replace(/"/g, '""')}"`,
            `"${(entry.teamSize || "").replace(/"/g, '""')}"`,
            `"${(entry.source || "").replace(/"/g, '""')}"`,
            `"${(entry.status || "active").replace(/"/g, '""')}"`,
            `"${(entry.priority || "normal").replace(/"/g, '""')}"`,
            new Date(entry.joinedAt).toISOString(),
          ].join(",");
        }),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `waitlist-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Exported ${dataToExport.length} entries to CSV.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "An error occurred while exporting the data. Please try again.",
        variant: "destructive",
      });
    }
  }, [filteredWaitlist, filteredEntries, activeTab, toast]);

  const formatEntriesForExport = useCallback((entries: WaitlistEntry[]) => {
    const headers = "Email Address, First Name, Last Name, Address";
    const rows = entries.map(entry => {
      const email = entry.email || "";

      // Split name into first and last
      let firstName = "";
      let lastName = "";
      if (entry.name) {
        const nameParts = entry.name.split(" ");
        if (nameParts.length > 0) {
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(" ");
        }
      }

      // Format address
      let address = "";
      if (entry.location) {
        if (typeof entry.location === 'string') {
          address = entry.location;
        } else {
          // Try to construct a meaningful address string from the object
          const loc = entry.location as any;
          const parts = [];

          if (loc.address) parts.push(loc.address);
          if (loc.city) parts.push(loc.city);
          if (loc.region || loc.state) parts.push(loc.region || loc.state);
          if (loc.postalCode || loc.zipCode) parts.push(loc.postalCode || loc.zipCode);
          if (loc.country || loc.country_name) parts.push(loc.country || loc.country_name);

          if (parts.length > 0) {
            address = parts.join(" ");
          } else {
            // Fallback to whatever properties might exist if the standard ones don't
            if (loc.ip) address += `IP: ${loc.ip} `;
          }
        }
      }
      // If no address found, try city
      if (!address && entry.city) {
        address = entry.city;
      }


      return `${email}, ${firstName}, ${lastName}, ${address}`;
    });

    return [headers, ...rows].join("\n");
  }, []);


  const handleCopyLabels = useCallback(() => {
    const dataToExport = activeTab === "list" ? filteredWaitlist : filteredEntries;
    if (!dataToExport || dataToExport.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no entries matching your current filters.",
        variant: "destructive",
      });
      return;
    }

    const formattedText = formatEntriesForExport(dataToExport);
    navigator.clipboard.writeText(formattedText).then(() => {
      toast({
        title: "Copied to clipboard",
        description: `Copied ${dataToExport.length} entries for labels.`,
        variant: "success",
      });
    }).catch(() => {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    });

  }, [filteredWaitlist, filteredEntries, activeTab, toast, formatEntriesForExport]);

  const handleDownloadLabels = useCallback(() => {
    const dataToExport = activeTab === "list" ? filteredWaitlist : filteredEntries;
    if (!dataToExport || dataToExport.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no entries matching your current filters.",
        variant: "destructive",
      });
      return;
    }

    const formattedText = formatEntriesForExport(dataToExport);
    const blob = new Blob([formattedText], { type: "text/plain;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-labels-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Download started",
      description: `Downloading labels for ${dataToExport.length} entries.`,
      variant: "success",
    });

  }, [filteredWaitlist, filteredEntries, formatEntriesForExport, activeTab, toast]);

  const handleApprove = async (entryId: Id<"waitlist">) => {
    setIsApproving(entryId);
    try {
      await approveWaitlistEntry({ entryId, sessionToken: sessionToken || undefined });
      toast({
        title: "Entry approved",
        description: "The waitlist entry has been approved successfully.",
        variant: "success",
      });
      setApproveConfirm({ isOpen: false, entryId: null });
    } catch (error) {
      toast({
        title: "Failed to approve entry",
        description: "An error occurred while approving the entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(null);
    }
  };

  const handleReject = async (entryId: Id<"waitlist">) => {
    setIsRejecting(entryId);
    try {
      await rejectWaitlistEntry({ entryId, sessionToken: sessionToken || undefined });
      toast({
        title: "Entry rejected",
        description: "The waitlist entry has been rejected successfully.",
        variant: "success",
      });
      setRejectConfirm({ isOpen: false, entryId: null });
    } catch (error) {
      toast({
        title: "Failed to reject entry",
        description: "An error occurred while rejecting the entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(null);
    }
  };

  const handleDelete = async (entryId: Id<"waitlist">) => {
    setIsDeleting(entryId);
    try {
      await deleteWaitlistEntry({ entryId, sessionToken: sessionToken || undefined });
      toast({
        title: "Entry deleted",
        description: "The waitlist entry has been deleted successfully.",
        variant: "success",
      });
      setDeleteConfirm({ isOpen: false, entryId: null });
    } catch (error) {
      toast({
        title: "Failed to delete entry",
        description: "An error occurred while deleting the entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Early returns after all hooks have been called
  // Only show loading if data hasn't loaded yet
  if (waitlist === undefined) {
    return (
      <div className="container mx-auto py-6 space-y-[18px]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold font-asgard text-gray-900">Waitlist</h1>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <WaitlistCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Authentication is handled by layout, so we don't need to check here

  if (waitlistData.length === 0) {
    return (
      <div className="container mx-auto py-6 space-y-[18px] flex flex-col items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={Users}
          title="No one on the waitlist yet!"
          description="As soon as someone joins, you'll see them here. Share the link to get the word out!"
          variant="no-data"
          className="max-w-md"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-[18px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-asgard text-gray-900">Waitlist Management</h1>
          <p className="text-gray-600 font-satoshi mt-1">Manage and analyze waitlist entries</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="w-full sm:w-auto min-h-[44px]"
              disabled={activeTab === "list" ? (!filteredWaitlist || filteredWaitlist.length === 0) : (!filteredEntries || filteredEntries.length === 0)}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportCSV}>
              <Table2 className="w-4 h-4 mr-2" />
              Export to CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyLabels}>
              <Copy className="w-4 h-4 mr-2" />
              Copy for Labels
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadLabels}>
              <FileText className="w-4 h-4 mr-2" />
              Download .txt for Labels
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>



      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white/90 backdrop-blur-lg border border-white/20">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Table2 className="w-4 h-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Details View
          </TabsTrigger>
        </TabsList>

        {/* List Tab */}
        <TabsContent value="list" className="space-y-6">

          {/* Waitlist Entries Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold font-asgard text-gray-900">Waitlist Entries</h3>
                  <p className="text-sm text-gray-600 font-satoshi mt-1">
                    Showing {paginatedWaitlist.length} of {filteredWaitlist.length} entries
                    {hasActiveFilters && waitlistData && ` (${waitlistData.length} total)`}
                  </p>
                </div>
              </div>
            </div>

            {paginatedWaitlist.length === 0 ? (
              <div className="p-12 text-center">
                <EmptyState
                  icon={Users}
                  title="No entries found"
                  description={hasActiveFilters
                    ? "Try adjusting your filters or search term to see more results."
                    : "No waitlist entries yet. Share the link to get the word out!"}
                  action={hasActiveFilters ? {
                    label: "Clear filters",
                    onClick: handleClearFilters,
                    variant: "secondary"
                  } : undefined}
                  variant={hasActiveFilters ? "filtered" : "no-data"}
                />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium font-satoshi text-gray-700 uppercase tracking-wider">Entry</th>
                        <th className="px-4 py-3 text-left text-xs font-medium font-satoshi text-gray-700 uppercase tracking-wider">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-medium font-satoshi text-gray-700 uppercase tracking-wider">Location</th>
                        <th className="px-4 py-3 text-left text-xs font-medium font-satoshi text-gray-700 uppercase tracking-wider">Company</th>
                        <th className="px-4 py-3 text-left text-xs font-medium font-satoshi text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium font-satoshi text-gray-700 uppercase tracking-wider">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedWaitlist.map((entry) => (
                        <tr
                          key={entry._id}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => router.push(`/admin/waitlist/${entry._id}`)}
                        >
                          <td className="px-4 py-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-primary-800 font-asgard">
                                  {entry.name?.charAt(0)?.toUpperCase() || entry.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium font-satoshi text-gray-900">
                                  {entry.name || 'No name provided'}
                                </div>
                                <div className="text-sm text-gray-700 font-satoshi">{entry.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              {entry.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 font-satoshi">
                                  <Phone className="w-3 h-3" />
                                  {entry.phone}
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-sm text-gray-600 font-satoshi">
                                <Mail className="w-3 h-3" />
                                {entry.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              {entry.city && (
                                <div className="text-sm font-satoshi text-gray-900">{entry.city}</div>
                              )}
                              {entry.location?.country && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 font-satoshi">
                                  <MapPin className="w-3 h-3" />
                                  {countryCodeToFlagEmoji(countryNameToCode(entry.location.country))} {entry.location.country}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              {entry.company && (
                                <div className="text-sm font-satoshi text-gray-900">{entry.company}</div>
                              )}
                              {entry.teamSize && (
                                <div className="text-sm text-gray-600 font-satoshi">{entry.teamSize} team</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              <StatusBadge status={entry.status || 'active'} />
                              <PriorityBadge priority={entry.priority || 'normal'} />
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 font-satoshi">
                            {formatDistanceToNow(entry.joinedAt, { addSuffix: true })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-4 sm:p-6 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600 font-satoshi">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="min-h-[36px]"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="min-h-[36px]"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">

          {/* Waitlist Entries Cards */}
          <div className="space-y-4">
            {paginatedEntries.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No waitlist entries found"
                description={hasActiveFilters
                  ? "Try adjusting your search or filter criteria"
                  : "No waitlist entries available"}
                action={hasActiveFilters ? {
                  label: "Clear filters",
                  onClick: handleClearFilters,
                  variant: "secondary"
                } : undefined}
                variant={hasActiveFilters ? "filtered" : "no-data"}
              />
            ) : (
              <>
                {paginatedEntries.map((entry: WaitlistEntry) => (
                  <Card key={entry._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#F23E2E]/10 rounded-full flex items-center justify-center">
                            <span className="text-[#F23E2E] font-bold">
                              {(entry.name || entry.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {entry.name || 'No Name'}
                            </h4>
                            <p className="text-sm text-gray-600">{entry.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={entry.status || 'active'} />
                          <PriorityBadge priority={entry.priority || 'normal'} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            Joined {new Date(entry.joinedAt).toLocaleDateString()}
                          </div>
                          {getLocationString(entry) && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              {getLocationString(entry)}
                            </div>
                          )}
                          {entry.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              {entry.phone}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="text-gray-600">Source: </span>
                            <Badge variant="outline" className="text-xs">{entry.source}</Badge>
                          </div>
                          {entry.referralCode && (
                            <div className="text-sm text-gray-600">
                              Referral: {entry.referralCode}
                            </div>
                          )}
                          {entry.company && (
                            <div className="text-sm text-gray-600">
                              Company: {entry.company}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          {entry.teamSize && (
                            <div className="text-sm text-gray-600">
                              Team Size: {entry.teamSize}
                            </div>
                          )}
                        </div>
                      </div>

                      {entry.notes && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{entry.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/waitlist/${entry._id}`);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/waitlist/${entry._id}?edit=true`);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Entry Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/waitlist/${entry._id}`);
                            }}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/waitlist/${entry._id}?edit=true`);
                            }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Entry
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `mailto:${entry.email}`;
                            }}>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              toast({
                                title: 'Export',
                                description: 'Exporting entry data...',
                              });
                            }}>
                              <FileText className="w-4 h-4 mr-2" />
                              Export Entry
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {(entry.status === 'active' || !entry.status) && (
                              <>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setApproveConfirm({ isOpen: true, entryId: entry._id as Id<"waitlist"> });
                                  }}
                                  disabled={isApproving === entry._id as Id<"waitlist">}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  {isApproving === entry._id as Id<"waitlist"> ? 'Approving...' : 'Approve Entry'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRejectConfirm({ isOpen: true, entryId: entry._id as Id<"waitlist"> });
                                  }}
                                  disabled={isRejecting === entry._id as Id<"waitlist">}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  {isRejecting === entry._id as Id<"waitlist"> ? 'Rejecting...' : 'Reject Entry'}
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm({ isOpen: true, entryId: entry._id as Id<"waitlist"> });
                              }}
                              disabled={isDeleting === entry._id as Id<"waitlist">}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {isDeleting === entry._id as Id<"waitlist"> ? 'Deleting...' : 'Delete Entry'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Pagination */}
                {detailsTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600 font-satoshi">
                      Page {detailsCurrentPage} of {detailsTotalPages} ({filteredEntries.length} entries)
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailsCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={detailsCurrentPage === 1}
                        className="min-h-[36px]"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailsCurrentPage(prev => Math.min(detailsTotalPages, prev + 1))}
                        disabled={detailsCurrentPage === detailsTotalPages}
                        className="min-h-[36px]"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Analytics Section */}
          {waitlistStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#F23E2E]" />
                    Top Locations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {waitlistStats.topLocations.map((location: { location: string; count: number }) => (
                      <div key={location.location} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{location.location}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={(location.count / waitlistStats.total) * 100} className="w-20 h-2" />
                          <span className="text-sm font-medium">{location.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-[#F23E2E]" />
                    Top Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {waitlistStats.topSources.map((source: { source: string; count: number }) => (
                      <div key={source.source} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{source.source}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={(source.count / waitlistStats.total) * 100} className="w-20 h-2" />
                          <span className="text-sm font-medium">{source.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={approveConfirm.isOpen}
        onClose={() => setApproveConfirm({ isOpen: false, entryId: null })}
        onConfirm={async () => {
          if (approveConfirm.entryId) {
            await handleApprove(approveConfirm.entryId);
          }
        }}
        title="Approve Entry"
        message="Are you sure you want to approve this waitlist entry?"
        confirmText="Approve"
        cancelText="Cancel"
        type="info"
        isLoading={isApproving !== null}
      />

      <ConfirmationDialog
        isOpen={rejectConfirm.isOpen}
        onClose={() => setRejectConfirm({ isOpen: false, entryId: null })}
        onConfirm={async () => {
          if (rejectConfirm.entryId) {
            await handleReject(rejectConfirm.entryId);
          }
        }}
        title="Reject Entry"
        message="Are you sure you want to reject this waitlist entry? This action cannot be undone."
        confirmText="Reject"
        cancelText="Cancel"
        type="warning"
        isLoading={isRejecting !== null}
      />

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, entryId: null })}
        onConfirm={async () => {
          if (deleteConfirm.entryId) {
            await handleDelete(deleteConfirm.entryId);
          }
        }}
        title="Delete Entry"
        message="Are you sure you want to delete this waitlist entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="error"
        isLoading={isDeleting !== null}
      />
    </div>
  );
}
