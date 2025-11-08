// NOTE: This page is accessible to both staff (role: 'staff') and admin (role: 'admin') users.
// All admins are staff, but not all staff are admins.

'use client';

import { Link } from '@/components/link';
import { UnauthenticatedState } from '@/components/ui/UnauthenticatedState';
import { GlassCard } from '@/components/ui/glass-card';
import { api } from "@/convex/_generated/api";
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { useAction, useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  ArrowLeft,
  Badge,
  Building,
  Calendar,
  Edit,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Utility to get a cookie value by name (client-side only)
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : undefined;
}

interface StaffProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  employeeId: string;
  department: string;
  position: string;
  startDate: string;
  employmentType: string;
  salary: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };
  collaborationSuiteActive: boolean;
  onboardingComplete: boolean;
}

// Map Convex user object to StaffProfile interface
function mapUserToStaffProfile(user: any): StaffProfile {
  return {
    id: user._id || '',
    firstName: user.firstName || user.name?.split(' ')[0] || '',
    lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
    email: user.email || '',
    phone: user.phone || '',
    dateOfBirth: user.dateOfBirth || '',
    address: user.address || { street: '', city: '', state: '', zipCode: '', country: '' },
    employeeId: user.employeeId || '',
    department: user.department || '',
    position: user.position || '',
    startDate: user.startDate || '',
    employmentType: user.employmentType || '',
    salary: user.salary || '',
    emergencyContact: user.emergencyContact || { name: '', relationship: '', phone: '', email: '' },
    collaborationSuiteActive: user.collaborationSuiteActive || false,
    onboardingComplete: Boolean(user.onboarding),
  };
}

export default function StaffProfilePage() {
  // Auth is handled by layout via session-based authentication (session token in cookies)
  // Middleware (proxy.ts) validates session token server-side, no client-side checks needed

  // All hooks must be called at the top, before any conditional logic
  const { staff: staffUser, loading: staffAuthLoading } = useStaffAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempProfile, setTempProfile] = useState<StaffProfile | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  
  // Get session token from cookies
  const [sessionToken, setSessionToken] = useState<string | undefined>(undefined);
  useEffect(() => {
    const token = getCookie('convex-auth-token');
    setSessionToken(token);
  }, []);
  
  // Fetch full profile data using user ID
  const profile = useQuery(
    api.queries.users.getById,
    staffUser?._id && sessionToken
      ? { userId: staffUser._id, sessionToken }
      : 'skip'
  );
  const updateUser = useMutation(api.mutations.users.updateUser);
  const hashPassword = useAction(api.actions.password.hashPasswordAction);

  // Initialize tempProfile when profile data is available
  useEffect(() => {
    if (profile && !tempProfile) {
      setTempProfile(mapUserToStaffProfile(profile));
    }
  }, [profile, tempProfile]);

  // Auth is handled at layout level, no page-level checks needed
  // Wait for profile data to load
  if (!profile) {
    return <UnauthenticatedState type="loading" role="staff" message="Loading your profile information..." />;
  }
  
  if (profile === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        {/* Back Button */}
        <div className="w-full mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/staff/portal" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200/60 text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-colors font-satoshi text-sm font-medium shadow-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 shadow-xl max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold font-asgard text-gray-900 mb-4">Profile Not Found</h2>
            <p className="text-gray-700 font-satoshi mb-6">We couldn't find your profile information. This might be due to a system error or your account may need to be set up.</p>
            <div className="space-y-3">
              <Link href="/staff/portal">
                <button className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-satoshi font-medium transition-colors">
                  Return to Portal
                </button>
              </Link>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-satoshi font-medium hover:bg-gray-50 transition-colors">
                Contact HR
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const staffProfile = mapUserToStaffProfile(profile);
  const isAdmin = Array.isArray(profile?.roles) && profile.roles.includes('admin');

  const handleEdit = () => {
    if (staffProfile) {
      setTempProfile(staffProfile);
      setEditing(true);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (staffProfile) {
      setTempProfile(staffProfile);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!tempProfile) return;
      
      await updateUser({
        userId: profile._id,
        name: `${tempProfile.firstName} ${tempProfile.lastName}`,
        email: tempProfile.email,
        // Add other fields as needed, e.g. phone, address, etc.
        // phone: tempProfile.phone,
        // address: tempProfile.address,
        // department: tempProfile.department,
        // position: tempProfile.position,
        // ...
      });
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    if (!password || password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (password !== passwordConfirm) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const hashed = await hashPassword({ password });
      await updateUser({ userId: profile._id, password: hashed });
      setPassword('');
      setPasswordConfirm('');
      setShowPasswordForm(false);
      setPasswordSuccess('Password updated successfully!');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const updateTempProfile = (field: string, value: any) => {
    setTempProfile(prev => {
      if (!prev) return prev;
      
      const keys = field.split('.');
      const newProfile = { ...prev };
      let current: any = newProfile;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      return newProfile;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-amber-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/staff/portal" className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-asgard text-gray-900">Staff Profile</h1>
                <p className="text-sm text-gray-800">Manage your personal information</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isAdmin ? (
                editing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="p-2 text-green-600 hover:text-green-700 transition-colors"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )
              ) : (
                <button
                  onClick={() => setShowPasswordForm((v) => !v)}
                  className="p-2 text-amber-600 hover:text-amber-700 transition-colors font-satoshi border border-amber-200 rounded-lg"
                >
                  Change Password
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-xl font-asgard text-gray-900">
                  {staffProfile.firstName} {staffProfile.lastName}
                </h2>
                <p className="text-gray-700">{staffProfile.position || 'Not set by HR'}</p>
                <p className="text-gray-700">{staffProfile.department || 'Not set by HR'}</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Badge className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-gray-600">Employee ID</p>
                    <p className="text-gray-900 font-medium">{staffProfile.employeeId || 'Not set by HR'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Employment Type</p>
                    <p className="text-gray-900 font-medium">{staffProfile.employmentType || 'Not set by HR'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="text-gray-900 font-medium">{staffProfile.startDate || 'Not set by HR'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${staffProfile.collaborationSuiteActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <div>
                    <p className="text-sm text-gray-600">Collaboration Suite Status</p>
                    <p className={`font-medium ${staffProfile.collaborationSuiteActive ? 'text-green-600' : 'text-gray-600'}`}>{staffProfile.collaborationSuiteActive ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Password Change Form for Staff */}
            {!isAdmin && showPasswordForm && (
              <GlassCard className="p-6 mb-6">
                <h3 className="text-lg font-asgard text-gray-900 mb-4">Change Password</h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">New Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      minLength={8}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={e => setPasswordConfirm(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      minLength={8}
                      required
                    />
                  </div>
                  {passwordError && <p className="text-red-600 font-satoshi text-sm">{passwordError}</p>}
                  {passwordSuccess && <p className="text-green-600 font-satoshi text-sm">{passwordSuccess}</p>}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-satoshi"
                      disabled={loading}
                    >
                      Update Password
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-satoshi"
                      onClick={() => setShowPasswordForm(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </GlassCard>
            )}
            {/* Admin-only profile editing */}
            {isAdmin && (
              <>
                <GlassCard className="p-6">
                  <h3 className="text-lg font-asgard text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">First Name</label>
                      {editing ? (
                        <input
                          type="text"
                          value={tempProfile?.firstName || ''}
                          onChange={(e) => updateTempProfile('firstName', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      ) : (
                        <p className="text-gray-900">{staffProfile.firstName || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Last Name</label>
                      {editing ? (
                        <input
                          type="text"
                          value={tempProfile?.lastName || ''}
                          onChange={(e) => updateTempProfile('lastName', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      ) : (
                        <p className="text-gray-900">{staffProfile.lastName || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Email</label>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-800" />
                        {editing ? (
                          <input
                            type="email"
                            value={tempProfile?.email || ''}
                            onChange={(e) => updateTempProfile('email', e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        ) : (
                          <p className="text-gray-900">{staffProfile.email || 'Not set'}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Phone</label>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-800" />
                        {editing ? (
                          <input
                            type="tel"
                            value={tempProfile?.phone || ''}
                            onChange={(e) => updateTempProfile('phone', e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        ) : (
                          <p className="text-gray-900">{staffProfile.phone || 'Not set'}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Date of Birth</label>
                      {editing ? (
                        <input
                          type="date"
                          value={tempProfile?.dateOfBirth || ''}
                          onChange={(e) => updateTempProfile('dateOfBirth', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      ) : (
                        <p className="text-gray-900">{staffProfile.dateOfBirth || 'Not set'}</p>
                      )}
                    </div>
                  </div>
                </GlassCard>
                <GlassCard className="p-6">
                  <h3 className="text-lg font-asgard text-gray-900 mb-4">Address</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Street Address</label>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-800" />
                        {editing ? (
                          <input
                            type="text"
                            value={tempProfile?.address?.street || ''}
                            onChange={(e) => updateTempProfile('address.street', e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        ) : (
                          <p className="text-gray-900">{staffProfile.address?.street || 'Not set'}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-800 mb-1">City</label>
                        {editing ? (
                          <input
                            type="text"
                            value={tempProfile?.address?.city || ''}
                            onChange={(e) => updateTempProfile('address.city', e.target.value)}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        ) : (
                          <p className="text-gray-900">{staffProfile.address?.city || 'Not set'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-800 mb-1">State</label>
                        {editing ? (
                          <input
                            type="text"
                            value={tempProfile?.address?.state || ''}
                            onChange={(e) => updateTempProfile('address.state', e.target.value)}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        ) : (
                          <p className="text-gray-900">{staffProfile.address?.state || 'Not set'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-800 mb-1">ZIP Code</label>
                        {editing ? (
                          <input
                            type="text"
                            value={tempProfile?.address?.zipCode || ''}
                            onChange={(e) => updateTempProfile('address.zipCode', e.target.value)}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        ) : (
                          <p className="text-gray-900">{staffProfile.address?.zipCode || 'Not set'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
                <GlassCard className="p-6">
                  <h3 className="text-lg font-asgard text-gray-900 mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Name</label>
                      {editing ? (
                        <input
                          type="text"
                          value={tempProfile?.emergencyContact?.name || ''}
                          onChange={(e) => updateTempProfile('emergencyContact.name', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      ) : (
                        <p className="text-gray-900">{staffProfile.emergencyContact.name || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Relationship</label>
                      {editing ? (
                        <input
                          type="text"
                          value={tempProfile?.emergencyContact?.relationship || ''}
                          onChange={(e) => updateTempProfile('emergencyContact.relationship', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      ) : (
                        <p className="text-gray-900">{staffProfile.emergencyContact.relationship || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Phone</label>
                      {editing ? (
                        <input
                          type="tel"
                          value={tempProfile?.emergencyContact?.phone || ''}
                          onChange={(e) => updateTempProfile('emergencyContact.phone', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      ) : (
                        <p className="text-gray-900">{staffProfile.emergencyContact.phone || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Email</label>
                      {editing ? (
                        <input
                          type="email"
                          value={tempProfile?.emergencyContact?.email || ''}
                          onChange={(e) => updateTempProfile('emergencyContact.email', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      ) : (
                        <p className="text-gray-900">{staffProfile.emergencyContact.email || 'Not set'}</p>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 