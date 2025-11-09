"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { AccountSettingsSkeleton } from '@/components/admin/skeletons';
import { GlassCard } from '@/components/ui/glass-card';
import { Id } from '@/convex/_generated/dataModel';
import { useSessionToken } from '@/hooks/useSessionToken';
import { Loader2, Settings, UploadCloud, User } from 'lucide-react';

import { api } from '@/convex/_generated/api';
import { useAction, useMutation } from 'convex/react';
import { useEffect, useState } from 'react';


const CUISINE_OPTIONS = ["Nigerian", "Ghanaian", "Jamaican", "Indian", "Chinese", "British", "Italian", "Other"];
const DIETARY_OPTIONS = ["Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-Free", "Dairy-Free", "Nut-Free"];

export default function AdminAccountSettings() {
  const { user, loading: adminLoading } = useAdminUser();
  const sessionToken = useSessionToken();

  const updateUser = useMutation(api.mutations.users.updateUser);
  const hashPassword = useAction(api.actions.password.hashPasswordAction);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    preferences: {
      cuisine: [] as string[],
      dietary: [] as string[],
    },
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Fetch current user on mount
  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      setError(null);
      try {
        // Get user from AdminUserProvider
        if (user) {
          setForm(f => ({
            ...f,
            name: user.name || '',
            email: user.email || '',
            preferences: {
              cuisine: user.preferences?.cuisine || [],
              dietary: user.preferences?.dietary || [],
            },
          }));
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load account info.');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
     
  }, [user]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : false;
    if (name.startsWith('cuisine-')) {
      const cuisine = name.replace('cuisine-', '');
      setForm(f => ({
        ...f,
        preferences: {
          ...f.preferences,
          cuisine: checked
            ? [...f.preferences.cuisine, cuisine]
            : f.preferences.cuisine.filter(c => c !== cuisine),
        },
      }));
    } else if (name.startsWith('dietary-')) {
      const dietary = name.replace('dietary-', '');
      setForm(f => ({
        ...f,
        preferences: {
          ...f.preferences,
          dietary: checked
            ? [...f.preferences.dietary, dietary]
            : f.preferences.dietary.filter(d => d !== dietary),
        },
      }));
    } else {
      setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!user) return;
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required.');
      return;
    }
    if (form.password && form.password !== form.passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      if (!user) {
        setError('User not found');
        return;
      }
      const updates: {
        userId: Id<"users">;
        name: string;
        email: string;
        preferences: { cuisine: string[]; dietary: string[] };
        password?: string;
      } = {
        userId: user._id as Id<"users">,
        name: form.name,
        email: form.email,
        preferences: form.preferences,
      };
      if (form.password) {
        updates.password = await hashPassword({ password: form.password });
      }
      await updateUser(updates);
      setSuccess('Account updated successfully!');
      setForm(f => ({...f, password: '', passwordConfirm: '',
    sessionToken: sessionToken || undefined
  }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update account.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setError(null);
    setSuccess(null);
    try {
      // Preview
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
      // Upload
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload avatar');
      if (!user) {
        throw new Error('User not found');
      }
      await updateUser({userId: user._id as Id<"users">, avatar: data.url,
    sessionToken: sessionToken || undefined
  });
      // Note: setUser is not available in this context, the user will be updated via the query
      setSuccess('Profile picture updated!');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to upload avatar.');
    } finally {
      setAvatarUploading(false);
    }
  }



  return (
    <div>
          <div className="min-h-screen flex items-center justify-center bg-primary-50 p-4">
      <GlassCard className="max-w-lg w-full p-8 flex flex-col items-center gap-6 border-primary-200">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold font-asgard text-gray-900">Account Settings</h1>
        </div>
        {loading || adminLoading ? (
          <AccountSettingsSkeleton />
        ) : error ? (
          <div className="text-gray-900 font-satoshi text-center">{error}</div>
        ) : !user ? (
          <div className="text-gray-900 font-satoshi text-center">Please log in to access account settings.</div>
        ) : (
          <form className="w-full space-y-6" onSubmit={handleSubmit}>
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center gap-2 mb-4">
              <div className="relative w-24 h-24">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary-200 shadow"
                  />
                ) : user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile picture"
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary-200 shadow"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = ''; }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center border-2 border-primary-200 shadow">
                    <User className="w-12 h-12 text-primary-300" />
                  </div>
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-full">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                  </div>
                )}
              </div>
              <label htmlFor="avatar-upload" className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-100 text-primary-800 font-satoshi text-sm cursor-pointer hover:bg-primary-200 transition-colors">
                <UploadCloud className="w-4 h-4" />
                Change Photo
                <input
                  id="avatar-upload"
                  name="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={avatarUploading}
                />
              </label>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-1 font-satoshi">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-primary-200 bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 font-satoshi"
                required
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1 font-satoshi">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-primary-200 bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 font-satoshi"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-1 font-satoshi">New Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-primary-200 bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 font-satoshi"
                autoComplete="new-password"
                placeholder="Leave blank to keep current password"
              />
            </div>
            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-900 mb-1 font-satoshi">Confirm Password</label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                value={form.passwordConfirm}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-primary-200 bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 font-satoshi"
                autoComplete="new-password"
                placeholder="Repeat new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1 font-satoshi">Cuisine Preferences</label>
              <div className="flex flex-wrap gap-2">
                {CUISINE_OPTIONS.map(cuisine => (
                  <label key={cuisine} className="flex items-center gap-1 text-sm font-satoshi">
                    <input
                      type="checkbox"
                      name={`cuisine-${cuisine}`}
                      checked={form.preferences.cuisine.includes(cuisine)}
                      onChange={handleChange}
                      className="accent-primary-600"
                    />
                    {cuisine}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1 font-satoshi">Dietary Preferences</label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map(dietary => (
                  <label key={dietary} className="flex items-center gap-1 text-sm font-satoshi">
                    <input
                      type="checkbox"
                      name={`dietary-${dietary}`}
                      checked={form.preferences.dietary.includes(dietary)}
                      onChange={handleChange}
                      className="accent-primary-600"
                    />
                    {dietary}
                  </label>
                ))}
              </div>
            </div>
            {success && <div className="text-[#F23E2E] font-satoshi text-center">{success}</div>}
            {error && <div className="text-gray-900 font-satoshi text-center">{error}</div>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-primary-600 text-white font-bold text-lg shadow hover:bg-primary-700 transition-colors font-satoshi disabled:opacity-50"
              disabled={saving}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" /> : null}
              Save Changes
            </button>
          </form>
        )}
      </GlassCard>
    </div>
    </div>
  );
} 
