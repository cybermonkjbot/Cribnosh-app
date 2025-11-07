// NOTE: This page is accessible to both staff (role: 'staff') and admin (role: 'admin') users.
// All admins are staff, but not all staff are admins.

'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Link } from '@/components/link';
import { 
  MessageSquare, 
  User, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { AnimatePresence, motion } from 'motion/react';
import { env } from '@/lib/config/env';

interface MattermostProfile {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname: string;
  position: string;
  department: string;
  timezone: string;
  language: string;
  channels: string[];
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
}

export default function MattermostPage() {
  const [profile, setProfile] = useState<MattermostProfile>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    nickname: '',
    position: '',
    department: '',
    timezone: 'UTC',
    language: 'en',
    channels: ['general'], // Default to general channel
    notifications: {
      email: true,
      push: true,
      desktop: true,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { staff: staffUser, loading: staffAuthLoading } = useStaffAuth();
  const user = useQuery(api.queries.users.getById, staffUser?._id ? { userId: staffUser._id } : "skip");
  const updateMattermost = useMutation(api.mutations.users.updateMattermostStatus);

  // Pre-fill profile data from staff onboarding
  useEffect(() => {
    if (user && !profile.email) {
      const nameParts = user.name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      setProfile(prev => ({
        ...prev,
        email: user.email || staffUser?.email || '',
        firstName: firstName,
        lastName: lastName,
        username: (user.email || staffUser?.email || '').split('@')[0] || '',
        position: user.position || '',
        department: user.department || '',
        nickname: firstName || '',
      }));
    }
  }, [user, staffUser, profile.email]);

  const handleActivate = async () => {
    setLoading(true);
    setError(null);
    try {
      await updateMattermost({ email: staffUser?.email || user?.email || '', mattermostActive: true, mattermostProfile: profile });
      setSuccess(true);
    } catch (err) {
      setError('Failed to activate Mattermost');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <GlassCard className="p-8 text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-asgard text-gray-900 mb-4">Huly Connected!</h1>
          <p className="text-gray-700 mb-6">
            Your Huly profile has been successfully connected. You can now access the team workspace.
          </p>
          <div className="space-y-3">
              <a 
                href={process.env.NEXT_PUBLIC_HULY_URL || 'https://app.huly.io'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
                Open Huly
            </a>
            <Link 
              href="/staff/portal" 
              className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
            >
              Return to Portal
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-100 to-amber-200 flex flex-col">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
        <div className="flex items-center justify-between mb-6">
          <Link href="/staff/portal" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Portal
          </Link>
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 flex items-center justify-center">
        <GlassCard className="p-8 w-full shadow-2xl backdrop-blur-xl bg-white/70 border border-amber-100">
          <AnimatePresence mode='wait'>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">{error}</span>
                </div>
              </motion.div>
            )}

            {/* Profile Review */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
              <div className="text-center mb-8">
                <MessageSquare className="w-16 h-16 text-green-600 mx-auto mb-4 animate-bounce" />
                <h2 className="text-2xl font-asgard text-gray-900 mb-2 drop-shadow">Connect Huly</h2>
                <p className="text-gray-800 font-satoshi">Review your profile and connect to the team workspace</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">Profile automatically configured</span>
                </div>
                <p className="text-green-700 text-sm">Your Mattermost profile has been pre-configured based on your staff information. HR will assign you to appropriate channels based on your department.</p>
              </div>

              {/* Profile Display */}
              <div className="bg-white/50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-asgard text-gray-900 mb-4">Your Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    <p className="text-gray-900 font-medium">{profile.email || 'Loading...'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                    <p className="text-gray-900 font-medium">{profile.firstName} {profile.lastName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Position</label>
                    <p className="text-gray-900 font-medium">{profile.position || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Department</label>
                    <p className="text-gray-900 font-medium">{profile.department || 'Not set'}</p>
                  </div>
                </div>
              </div>

              {/* Activation Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-blue-800 font-medium mb-1">What happens next?</h4>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Your Huly account will be created with the email above</li>
                      <li>• HR will assign you to relevant spaces/projects</li>
                      <li>• You'll receive an email with login instructions</li>
                      <li>• You can access Huly through the staff portal</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-6">
                <button
                  onClick={handleActivate}
                  disabled={loading || !profile.email}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2 text-lg font-medium"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Activating...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-5 h-5" />
                      <span>Connect Huly</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </GlassCard>
      </div>
    </div>
  );
} 