"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { Download, Mail, Phone, MapPin, Building2, Users } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { countryNameToCode, countryCodeToFlagEmoji } from "@/lib/utils";
import { AuthWrapper } from "@/components/layout/AuthWrapper";
import { useState, useMemo } from "react";
import { WaitlistCardSkeleton } from "@/components/admin/skeletons";

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/admin/empty-state";


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

  const waitlist = useQuery(api.queries.waitlist.getAll) as WaitlistEntry[] | undefined;

  // --- Filter State ---
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");

  // --- Filtered Data ---
  const filteredWaitlist = useMemo(() => {
    if (!waitlist) return [];
    return waitlist.filter(entry => {
      const country = entry.location?.country || entry.location?.country_name || "";
      const source = entry.source || "";
      const city = entry.location?.city || entry.city || "";
      return (
        (countryFilter === "all" || country === countryFilter) &&
        (sourceFilter === "all" || source === sourceFilter) &&
        (cityFilter === "all" || city === cityFilter)
      );
    });
  }, [waitlist, countryFilter, sourceFilter, cityFilter]);

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
      const city = entry.location?.city || entry.city;
      if (city) set.add(city);
    });
    return Array.from(set).sort();
  }, [waitlist]);

  const handleExportCSV = () => {
    if (!waitlist) return;
    const headers = ["Name", "Email", "Phone", "City", "Company", "Team Size", "Joined"];
    const csvContent = [
      headers.join(","),
      ...waitlist.map(entry => [
        entry.name || "",
        entry.email,
        entry.phone || "",
        entry.city || "",
        entry.company || "",
        entry.teamSize || "",
        new Date(entry.joinedAt).toISOString(),
      ].join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold font-asgard text-gray-900 mb-4">Filters</h3>
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
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="All cities" />
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
              <p className="text-sm font-medium font-satoshi text-gray-600">Total Entries</p>
              <p className="text-2xl font-bold font-asgard text-gray-900">{filteredWaitlist.length}</p>
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
          <h3 className="text-lg font-semibold font-asgard text-gray-900">Waitlist Entries</h3>
          <p className="text-sm text-gray-600 font-satoshi mt-1">
            Showing {filteredWaitlist.length} of {waitlist?.length || 0} entries
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium font-satoshi text-gray-700 uppercase tracking-wider">Entry</th>
                <th className="px-4 py-3 text-left text-xs font-medium font-satoshi text-gray-700 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium font-satoshi text-gray-700 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium font-satoshi text-gray-700 uppercase tracking-wider">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium font-satoshi text-gray-700 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWaitlist.map((entry) => (
                <tr key={entry._id} className="hover:bg-gray-50">
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
                  <td className="px-4 py-4 text-sm text-gray-700 font-satoshi">
                    {formatDistanceToNow(entry.joinedAt, { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 
