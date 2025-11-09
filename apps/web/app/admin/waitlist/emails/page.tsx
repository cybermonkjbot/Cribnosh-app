"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Search, 
  Filter,
  Plus,
  Send,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Users,
  BarChart2,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { EmptyState } from '@/components/admin/empty-state';

interface EmailCampaign {
  _id: Id<"emailCampaigns">;
  name: string;
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  recipientType: 'all' | 'pending' | 'approved' | 'rejected' | 'converted';
  recipientCount: number;
  sentCount: number;
  openRate: number;
  clickRate: number;
  createdAt: number;
  scheduledAt?: number;
  sentAt?: number;
  templateId?: Id<"emailTemplates">;
}

interface EmailTemplate {
  _id: Id<"emailTemplates">;
  name: string;
  subject: string;
  content: string;
  type: 'welcome' | 'update' | 'promotion' | 'reminder' | 'custom';
  isActive: boolean;
  createdAt: number;
}

export default function WaitlistEmailsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);

  // New campaign form
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    content: '',
    recipientType: 'all' as const,
    scheduledAt: '',
    templateId: ''
  });

  // Fetch data
  const campaigns = useQuery(api.queries.email.getEmailCampaigns, {});
  const templates = useQuery(api.queries.email.getEmailTemplates, {});
  const waitlistStats = useQuery(api.queries.analytics.getWaitlistStats, {});

  // Mutations
  const createCampaign = useMutation(api.mutations.email.createEmailCampaign);
  const sendCampaign = useMutation(api.mutations.email.sendEmailCampaign);
  const updateCampaign = useMutation(api.mutations.email.updateEmailCampaign);
  const deleteCampaign = useMutation(api.mutations.email.deleteEmailCampaign);

  const handleCreateCampaign = async () => {
    if (!newCampaign.name.trim() || !newCampaign.subject.trim() || !newCampaign.content.trim()) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await createCampaign({
        name: newCampaign.name,
        subject: newCampaign.subject,
        content: newCampaign.content,
        recipientType: newCampaign.recipientType,
        scheduledFor: newCampaign.scheduledAt ? new Date(newCampaign.scheduledAt).getTime() : undefined
      });
      
      setNewCampaign({
        name: '',
        subject: '',
        content: '',
        recipientType: 'all',
        scheduledAt: '',
        templateId: ''
      });
      setIsCreating(false);
      toast({
        title: "Campaign created",
        description: "The email campaign has been created successfully.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Failed to create campaign",
        description: "An error occurred while creating the campaign. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendCampaign = async (campaignId: Id<"emailCampaigns">) => {
    setIsSending(true);
    try {
      await sendCampaign({ campaignId });
      toast({
        title: "Campaign sent",
        description: "The email campaign has been sent successfully.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Failed to send campaign",
        description: "An error occurred while sending the campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: Id<"emailCampaigns">) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      try {
        await deleteCampaign({ campaignId });
        toast({
          title: "Campaign deleted",
          description: "The email campaign has been deleted successfully.",
          variant: "success",
        });
      } catch (err) {
        toast({
          title: "Failed to delete campaign",
          description: "An error occurred while deleting the campaign. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const filteredCampaigns = campaigns?.filter((campaign: any) => {
    const matchesSearch = 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesType = typeFilter === 'all' || campaign.recipientType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'sending':
        return <Badge className="bg-yellow-100 text-yellow-800">Sending</Badge>;
      case 'sent':
        return <Badge className="bg-green-100 text-green-800">Sent</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRecipientTypeBadge = (type: string) => {
    switch (type) {
      case 'all':
        return <Badge variant="outline">All Users</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600">Rejected</Badge>;
      case 'converted':
        return <Badge variant="outline" className="text-blue-600">Converted</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getOpenRate = (campaign: EmailCampaign) => {
    return campaign.openRate || 0;
  };

  const getClickRate = (campaign: EmailCampaign) => {
    return campaign.clickRate || 0;
  };

  return (
    <div className="container mx-auto py-6 space-y-[18px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Email Campaigns</h1>
          <p className="text-gray-600 font-satoshi mt-2">Manage waitlist email campaigns and communications</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{campaigns?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Send className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns?.filter((c: any) => c.status === 'sent').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns?.filter((c: any) => c.status === 'scheduled').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Open Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns?.length ? Math.round(campaigns.reduce((sum: any, c: any) => sum + (c.openRate || 0), 0) / campaigns.length) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Campaign Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Email Campaign</CardTitle>
            <CardDescription>Create a new email campaign for waitlist users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Campaign Name</label>
                <Input
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter campaign name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Recipient Type</label>
                <Select value={newCampaign.recipientType} onValueChange={(value) => setNewCampaign(prev => ({ ...prev, recipientType: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="pending">Pending Only</SelectItem>
                    <SelectItem value="approved">Approved Only</SelectItem>
                    <SelectItem value="rejected">Rejected Only</SelectItem>
                    <SelectItem value="converted">Converted Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Subject Line</label>
              <Input
                value={newCampaign.subject}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter email subject"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Email Content</label>
              <textarea
                value={newCampaign.content}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter email content (HTML supported)"
                rows={8}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Schedule (Optional)</label>
                <Input
                  type="datetime-local"
                  value={newCampaign.scheduledAt}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, scheduledAt: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Template (Optional)</label>
                <Select value={newCampaign.templateId} onValueChange={(value) => setNewCampaign(prev => ({ ...prev, templateId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates ? (
                      templates.map((template: any) => (
                        <SelectItem key={template._id} value={template._id}>{template.name}</SelectItem>
                      ))
                    ) : null}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateCampaign} className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white">
                Create Campaign
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <Input
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="sending">Sending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.map((campaign: any) => (
          <Card key={campaign._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                    {getStatusBadge(campaign.status)}
                    {getRecipientTypeBadge(campaign.recipientType)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{campaign.subject}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-700">
                    <span>Created {new Date(campaign.createdAt).toLocaleDateString()}</span>
                    {campaign.scheduledAt && (
                      <span>Scheduled {new Date(campaign.scheduledAt).toLocaleDateString()}</span>
                    )}
                    {campaign.sentAt && (
                      <span>Sent {new Date(campaign.sentAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedCampaign(campaign)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteCampaign(campaign._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Campaign Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{campaign.recipientCount}</p>
                  <p className="text-sm text-gray-600">Recipients</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{campaign.sentCount}</p>
                  <p className="text-sm text-gray-600">Sent</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{getOpenRate(campaign)}%</p>
                  <p className="text-sm text-gray-600">Open Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{getClickRate(campaign)}%</p>
                  <p className="text-sm text-gray-600">Click Rate</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {campaign.status === 'draft' && (
                  <Button
                    size="sm"
                    onClick={() => handleSendCampaign(campaign._id)}
                    disabled={isSending}
                    className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    {isSending ? 'Sending...' : 'Send Now'}
                  </Button>
                )}
                {campaign.status === 'scheduled' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSendCampaign(campaign._id)}
                    disabled={isSending}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Send Now
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCampaigns.length === 0 && (
        <EmptyState
          icon={Mail}
          title={searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? "No campaigns found" : "No campaigns yet"}
          description={searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
            ? "Try adjusting your search or filter criteria" 
            : "Create your first email campaign to get started"}
          action={searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? {
            label: "Clear filters",
            onClick: () => {
              setSearchTerm('');
              setStatusFilter('all');
              setTypeFilter('all');
            },
            variant: "secondary"
          } : {
            label: "Create Campaign",
            onClick: () => setIsCreating(true),
            variant: "primary"
          }}
          variant={searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? "filtered" : "no-data"}
        />
      )}
    </div>
  );
}
