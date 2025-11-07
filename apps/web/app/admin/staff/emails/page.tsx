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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Search, 
  Plus,
  Send,
  Eye,
  Trash2,
  Users,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { AdminPageSkeleton } from '@/components/admin/skeletons';
import { EmptyState } from '@/components/admin/empty-state';

interface StaffEmailCampaign {
  _id: Id<"staffEmailCampaigns">;
  name: string;
  subject: string;
  content: string;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  recipientType: 'all_waitlist' | 'pending_waitlist' | 'approved_waitlist' | 'converted_users' | 'all_users';
  recipientCount: number;
  sentCount: number;
  createdAt: number;
  sentAt?: number;
}

export default function StaffEmailsPage() {
  const { loading: adminLoading } = useAdminUser();
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
    } catch (error) {
      setError('Failed to create campaign');
      console.error(error);
    }
  };

  const handleSendCampaign = async (campaignId: Id<"staffEmailCampaigns">) => {
    setIsSending(true);
    try {
      await sendCampaign({ campaignId });
      setSuccess('Campaign sent successfully');
      setError(null);
    } catch (error) {
      setError('Failed to send campaign');
      console.error(error);
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
    } catch (error) {
      setError('Failed to delete campaign');
      console.error(error);
    }
    }
  };

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-dismiss error messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Basic HTML sanitization to prevent XSS
  const sanitizeHtml = (html: string): string => {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
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

  const filteredCampaigns = campaigns?.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (adminLoading) {
    return <AdminPageSkeleton description="Loading..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email Campaigns</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Send emails to waitlist users and customers with simplified campaign management
          </p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
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
              <div className="text-2xl font-bold">{staffStats.totalStaff}</div>
              <p className="text-xs text-muted-foreground">
                Active: {staffStats.activeStaff}
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

      {/* Create Campaign Modal */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Staff Email Campaign</CardTitle>
            <CardDescription>
              Send emails to staff members with simplified targeting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Campaign Name</label>
              <Input
                placeholder="e.g., Monthly Staff Update"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Subject Line</label>
              <Input
                placeholder="e.g., Important Staff Update - January 2024"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-bg-accent)] focus:border-transparent"
              />
            </div>
            
            <div className="flex space-x-2">
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

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sending">Sending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaigns List */}
      <div className="grid gap-4">
        {filteredCampaigns?.map((campaign) => (
          <Card key={campaign._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  <CardDescription>{campaign.subject}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={
                    campaign.status === 'sent' ? 'default' :
                    campaign.status === 'sending' ? 'secondary' :
                    campaign.status === 'failed' ? 'destructive' : 'outline'
                  }>
                    {campaign.status}
                  </Badge>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCampaign(campaign)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {campaign.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => handleSendCampaign(campaign._id)}
                        disabled={isSending}
                        className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCampaign(campaign._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-700">Recipients:</span>
                  <p className="font-medium">{campaign.recipientCount}</p>
                </div>
                <div>
                  <span className="text-gray-700">Sent:</span>
                  <p className="font-medium">{campaign.sentCount}</p>
                </div>
                <div>
                  <span className="text-gray-700">Created:</span>
                  <p className="font-medium">
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-700">Type:</span>
                  <p className="font-medium">
                    {getRecipientTypeLabel(campaign.recipientType)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredCampaigns?.length === 0 && (
          <EmptyState
            icon={Mail}
            title={searchTerm || statusFilter !== 'all' ? "No campaigns found" : "No campaigns yet"}
            description={searchTerm || statusFilter !== 'all' 
              ? "Try adjusting your search or filter criteria" 
              : "Create your first staff email campaign to get started"}
            action={searchTerm || statusFilter !== 'all' ? {
              label: "Clear filters",
              onClick: () => {
                setSearchTerm('');
                setStatusFilter('all');
              },
              variant: "secondary"
            } : {
              label: "Create Campaign",
              onClick: () => setIsCreating(true),
              variant: "primary"
            }}
            variant={searchTerm || statusFilter !== 'all' ? "filtered" : "no-data"}
          />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Campaign Preview Modal */}
      {selectedCampaign && (
        <Card className="fixed inset-4 z-50 overflow-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Campaign Preview</CardTitle>
              <Button variant="outline" onClick={() => setSelectedCampaign(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Subject</label>
                <p className="text-lg font-semibold">{selectedCampaign.subject}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Content</label>
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedCampaign.content).replace(/\n/g, '<br>') }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
