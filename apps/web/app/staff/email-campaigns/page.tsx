"use client";

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Eye,
  Mail,
  Plus,
  Search,
  Send,
  Trash2,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type StaffEmailCampaign = Doc<"staffEmailCampaigns">;

export default function StaffEmailCampaignsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<StaffEmailCampaign | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New campaign form
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    content: '',
    recipientType: 'all_waitlist' as 'all_waitlist' | 'pending_waitlist' | 'approved_waitlist' | 'converted_users' | 'all_users'
  });

  // Fetch data
  const campaigns = useQuery(api.queries.staff.getStaffEmailCampaigns);
  const staffStats = useQuery(api.queries.staff.getStaffStats);

  // Mutations
  const createCampaign = useMutation(api.mutations.staff.createStaffEmailCampaign);
  const sendCampaign = useMutation(api.mutations.staff.sendStaffEmailCampaign);
  const deleteCampaign = useMutation(api.mutations.staff.deleteStaffEmailCampaign);

  const handleCreateCampaign = async () => {
    if (!newCampaign.name.trim() || !newCampaign.subject.trim() || !newCampaign.content.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await createCampaign({
        name: newCampaign.name,
        subject: newCampaign.subject,
        content: newCampaign.content,
        recipientType: newCampaign.recipientType
      });
      
      setNewCampaign({
        name: '',
        subject: '',
        content: '',
        recipientType: 'all_waitlist'
      });
      setIsCreating(false);
      setSuccess('Campaign created successfully');
      setError(null);
    } catch (err) {
      setError('Failed to create campaign');
    }
  };

  const handleSendCampaign = async (campaignId: Id<"staffEmailCampaigns">) => {
    setIsSending(true);
    setError(null);
    setSuccess(null);
    try {
      await sendCampaign({ campaignId });
      setSuccess('Campaign sent successfully');
      setError(null);
    } catch (err) {
      setError('Failed to send campaign');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: Id<"staffEmailCampaigns">) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      try {
        await deleteCampaign({ campaignId });
        setSuccess('Campaign deleted successfully');
        setError(null);
      } catch (err) {
        setError('Failed to delete campaign');
      }
    }
  };

  const getRecipientTypeLabel = (type: StaffEmailCampaign['recipientType']) => {
    switch (type) {
      case 'all_waitlist': return 'All Waitlist Users';
      case 'pending_waitlist': return 'Pending Waitlist';
      case 'approved_waitlist': return 'Approved Waitlist';
      case 'converted_users': return 'Converted Users';
      case 'all_users': return 'All Users';
      default: return type;
    }
  };

  const filteredCampaigns = campaigns?.filter((campaign: Doc<"staffEmailCampaigns">) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: StaffEmailCampaign['status']) => {
    switch (status) {
      case 'draft': return <Badge variant="outline" className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 'sending': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 animate-pulse">Sending...</Badge>;
      case 'sent': return <Badge variant="default" className="bg-green-100 text-green-800">Sent</Badge>;
      case 'failed': return <Badge variant="destructive" className="bg-red-100 text-red-800">Failed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="mb-4">
        <Link href="/staff/portal" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200/60 text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-colors font-satoshi text-sm font-medium shadow-sm">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email Campaigns</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Send emails to waitlist users and customers
          </p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      {staffStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staffStats.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active: {staffStats.activeUsers || 0}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campaigns Sent</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staffStats.totalCampaigns}</div>
              <p className="text-xs text-muted-foreground">
                This month: {staffStats.monthlyCampaigns}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staffStats.deliveryRate}%</div>
              <p className="text-xs text-muted-foreground">
                Average delivery success
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Create Campaign Form */}
      {isCreating && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Create New Email Campaign</CardTitle>
            <CardDescription>
              Create a new email campaign to send to your target audience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Campaign Name</label>
              <Input
                placeholder="e.g., Welcome Series, Product Launch"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Subject Line</label>
              <Input
                placeholder="e.g., Welcome to CribNosh!"
                value={newCampaign.subject}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Target Audience</label>
              <Select
                value={newCampaign.recipientType}
                onValueChange={(value: 'all_waitlist' | 'pending_waitlist' | 'approved_waitlist' | 'converted_users' | 'all_users') => setNewCampaign(prev => ({ ...prev, recipientType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_waitlist">All Waitlist Users</SelectItem>
                  <SelectItem value="pending_waitlist">Pending Waitlist</SelectItem>
                  <SelectItem value="approved_waitlist">Approved Waitlist</SelectItem>
                  <SelectItem value="converted_users">Converted Users</SelectItem>
                  <SelectItem value="all_users">All Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Email Content</label>
              <textarea
                placeholder="Write your email content here..."
                value={newCampaign.content}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, content: e.target.value }))}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={handleCreateCampaign} className="bg-red-600 hover:bg-red-700">
                Create Campaign
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sending">Sending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaigns List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new campaign.</p>
          </div>
        ) : (
          filteredCampaigns.map((campaign: Doc<"staffEmailCampaigns">) => (
            <Card key={campaign._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <CardDescription className="text-sm">{campaign.subject}</CardDescription>
                  </div>
                  {getStatusBadge(campaign.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                  {campaign.content}
                </p>
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Audience:</span>
                    <span>{getRecipientTypeLabel(campaign.recipientType)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recipients:</span>
                    <span>{campaign.recipientCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sent:</span>
                    <span>{campaign.sentCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
              <div className="px-6 pb-6">
                <div className="flex space-x-2">
                  {campaign.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => handleSendCampaign(campaign._id)}
                      disabled={isSending}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Send
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedCampaign(campaign)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteCampaign(campaign._id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Campaign Preview Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedCampaign.name}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCampaign(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">Subject:</h4>
                <p className="text-gray-600">{selectedCampaign.subject}</p>
              </div>
              <div>
                <h4 className="font-medium">Content:</h4>
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="whitespace-pre-wrap text-sm">{selectedCampaign.content}</pre>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Audience:</span>
                  <p>{getRecipientTypeLabel(selectedCampaign.recipientType)}</p>
                </div>
                <div>
                  <span className="font-medium">Recipients:</span>
                  <p>{selectedCampaign.recipientCount}</p>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <p>{selectedCampaign.status}</p>
                </div>
                <div>
                  <span className="font-medium">Created:</span>
                  <p>{new Date(selectedCampaign.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
