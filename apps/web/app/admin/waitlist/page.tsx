"use client";

import { useAdminUser } from "@/app/admin/AdminUserProvider";
import { WaitlistCardSkeleton } from "@/components/admin/skeletons";
import { AuthWrapper } from "@/components/layout/AuthWrapper";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { countryCodeToFlagEmoji, countryNameToCode } from "@/lib/utils";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Building2, ChevronLeft, ChevronRight, Download, Mail, MapPin, Phone, Search, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge } from "@/components/ui/glass-badges";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


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
}

export default function AdminWaitlistPage() {
  // Auth is handled by middleware, no client-side checks needed
  const { sessionToken } = useAdminUser();
  const router = useRouter();
  const { toast } = useToast();

  const waitlist = useQuery(
    api.queries.waitlist.getAll,
    sessionToken ? { sessionToken } : "skip"
  ) as WaitlistEntry[] | undefined;

  // --- Filter State ---
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  
  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset city filter when country filter changes
  useEffect(() => {
    if (countryFilter === "all") {
      setCityFilter("all");
    } else {
      setCityFilter("all");
    }
  }, [countryFilter]);

  // --- Filtered Data ---
  const filteredWaitlist = useMemo(() => {
    if (!waitlist) return [];
    return waitlist.filter(entry => {
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
  }, [waitlist, countryFilter, sourceFilter, cityFilter, debouncedSearchTerm]);

  // --- Unique filter options ---
  const countryOptions = useMemo(() => {
    if (!waitlist) return [];
    const set = new Set<string>();
    waitlist.forEach(entry => {
      const country = entry.location?.country || entry.location?.country_name;
      if (country) set.add(country);
    });
    return Array.from(set).sort();
  }, [waitlist]);

  const sourceOptions = useMemo(() => {
    if (!waitlist) return [];
    const set = new Set<string>();
    waitlist.forEach(entry => {
      if (entry.source) set.add(entry.source);
    });
    return Array.from(set).sort();
  }, [waitlist]);

  const cityOptions = useMemo(() => {
    if (!waitlist) return [];
    const set = new Set<string>();
    waitlist.forEach(entry => {
      const country = entry.location?.country || entry.location?.country_name || "";
      const city = entry.location?.city || entry.city;
      
      // If country filter is set, only show cities from that country
      if (countryFilter === "all" || country === countryFilter) {
        if (city) set.add(city);
      }
    });
    return Array.from(set).sort();
  }, [waitlist, countryFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredWaitlist.length / pageSize);
  const paginatedWaitlist = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredWaitlist.slice(startIndex, endIndex);
  }, [filteredWaitlist, currentPage, pageSize]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setCountryFilter("all");
    setSourceFilter("all");
    setCityFilter("all");
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return searchTerm !== "" || countryFilter !== "all" || sourceFilter !== "all" || cityFilter !== "all";
  }, [searchTerm, countryFilter, sourceFilter, cityFilter]);

  const handleExportCSV = useCallback(() => {
    if (!filteredWaitlist || filteredWaitlist.length === 0) {
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
        ...filteredWaitlist.map(entry => {
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
        description: `Exported ${filteredWaitlist.length} entries to CSV.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "An error occurred while exporting the data. Please try again.",
        variant: "destructive",
      });
    }
  }, [filteredWaitlist, toast]);

  if (!waitlist) {
    return (
      <AuthWrapper role="admin">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold font-asgard text-gray-900">Waitlist</h1>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <WaitlistCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </AuthWrapper>
    );
  }

  if (waitlist.length === 0) {
    return (
      <AuthWrapper role="admin">
        <div className="p-4 sm:p-6 flex flex-col items-center justify-center min-h-[60vh]">
          <EmptyState
            icon={Users}
            title="No one on the waitlist yet!"
            description="As soon as someone joins, you'll see them here. Share the link to get the word out!"
            variant="no-data"
            className="max-w-md"
          />
        </div>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-asgard text-gray-900">Waitlist Management</h1>
            <p className="text-gray-600 font-satoshi mt-1">Manage and analyze waitlist entries</p>
          </div>
          
          <Button
            onClick={handleExportCSV}
            className="w-full sm:w-auto min-h-[44px]"
            disabled={!filteredWaitlist || filteredWaitlist.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or company..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-white border-gray-200 focus:border-gray-400 focus:ring-gray-400"
              />
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium font-satoshi text-gray-700 mb-2">Country</label>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="All countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All countries</SelectItem>
                  {countryOptions.map((country) => (
                    <SelectItem key={country} value={country}>
                      {countryCodeToFlagEmoji(countryNameToCode(country))} {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium font-satoshi text-gray-700 mb-2">Source</label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  {sourceOptions.map((source) => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium font-satoshi text-gray-700 mb-2">City</label>
              <Select value={cityFilter} onValueChange={setCityFilter} disabled={countryFilter === "all" ? false : cityOptions.length === 0}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder={countryFilter === "all" ? "All cities" : cityOptions.length === 0 ? "No cities in selected country" : "All cities"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cities</SelectItem>
                  {cityOptions.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium font-satoshi text-gray-600">Filtered Entries</p>
              <p className="text-2xl font-bold font-asgard text-gray-900">{filteredWaitlist.length}</p>
              {hasActiveFilters && waitlist && (
                <p className="text-xs text-gray-500 font-satoshi mt-1">of {waitlist.length} total</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium font-satoshi text-gray-600">Countries</p>
              <p className="text-2xl font-bold font-asgard text-gray-900">{countryOptions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium font-satoshi text-gray-600">Companies</p>
              <p className="text-2xl font-bold font-asgard text-gray-900">
                {new Set(filteredWaitlist.filter(entry => entry.company).map(entry => entry.company)).size}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Phone className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium font-satoshi text-gray-600">With Phone</p>
              <p className="text-2xl font-bold font-asgard text-gray-900">
                {filteredWaitlist.filter(entry => entry.phone).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Waitlist Entries */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold font-asgard text-gray-900">Waitlist Entries</h3>
              <p className="text-sm text-gray-600 font-satoshi mt-1">
                Showing {paginatedWaitlist.length} of {filteredWaitlist.length} entries
                {hasActiveFilters && waitlist && ` (${waitlist.length} total)`}
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
    </div>
    </AuthWrapper>
  );
} 
