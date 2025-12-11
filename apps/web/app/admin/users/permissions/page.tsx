"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import {
  Edit,
  Eye,
  Save,
  Search,
  Settings,
  Shield,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Permission {
  _id: Id<"permissions">;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  createdAt: number;
}

interface UserPermission {
  userId: Id<"users">;
  userName: string;
  userEmail: string;
  permissions: string[];
}

export default function UserPermissionsPage() {
  const { sessionToken } = useAdminUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch data
  const permissions = useQuery(api.queries.admin.getAvailablePermissions, sessionToken ? { sessionToken } : 'skip');
  const users = useQuery(api.queries.users.getUsersForAdmin, sessionToken ? { sessionToken } : "skip");
  const userPermissionsData = useQuery(api.queries.admin.getUserPermissions, sessionToken ? { sessionToken } : 'skip');

  // Mutations
  const updateUserPermissions = useMutation(api.mutations.admin.updateUserPermissions);
  const togglePermission = useMutation(api.mutations.admin.toggleUserPermission);

  const permissionCategories = [
    { name: 'User Management', icon: Users, color: 'bg-blue-100 text-blue-800' },
    { name: 'Content Management', icon: Edit, color: 'bg-green-100 text-green-800' },
    { name: 'System Settings', icon: Settings, color: 'bg-purple-100 text-purple-800' },
    { name: 'Analytics', icon: Eye, color: 'bg-orange-100 text-orange-800' },
    { name: 'Security', icon: Shield, color: 'bg-red-100 text-red-800' }
  ];

  const handlePermissionToggle = async (userId: string, permissionId: string, granted: boolean) => {
    try {
      setError(null);
      setIsUpdating(true);
      await togglePermission({ userId: userId as Id<"users">, permissionId, granted });
      setSuccess('Permission updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update permission');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkUpdate = async (userId: string) => {
    try {
      setError(null);
      setIsSaving(true);
      const permStrings = userPermissions[userId] || [];
      // Convert string array to object array as expected by mutation
      const permObjects = permStrings.map((permId) => ({
        id: permId,
        granted: true
      }));
      await updateUserPermissions({ 
        userId: userId as Id<"users">, 
        permissions: permObjects
      });
      setSuccess('Permissions updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update permissions');
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-dismiss success/error messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const filteredUsers = users?.filter((user: any) =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredPermissions = permissions?.filter((permission: any) =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="container mx-auto py-6 space-y-[18px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">User Permissions</h1>
          <p className="text-gray-600 font-satoshi mt-2">Manage individual user permissions and access control</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
        <Input
          placeholder="Search users or permissions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#F23E2E]" />
              Users
            </CardTitle>
            <CardDescription>Select a user to manage their permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredUsers.map((user: any) => (
                <div
                  key={user._id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedUser === user._id
                      ? 'border-[#F23E2E] bg-[#F23E2E]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedUser(user._id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#F23E2E]/10 rounded-full flex items-center justify-center">
                      <span className="text-[#F23E2E] font-medium text-sm">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {user.name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{user.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {userPermissionsData?.find((up: any) => up.userId === user._id)?.permissions.length || 0} permissions
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Permissions Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#F23E2E]" />
              Permissions
            </CardTitle>
            <CardDescription>
              {selectedUser ? 'Manage permissions for selected user' : 'Select a user to manage permissions'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedUser ? (
              <div className="space-y-4">
                {permissionCategories.map(category => {
                  const categoryPermissions = filteredPermissions.filter((p: any) => p.category === category.name);
                  if (categoryPermissions.length === 0) return null;

                  return (
                    <div key={category.name} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <category.icon className="w-4 h-4" />
                        <h4 className="font-medium text-gray-900">{category.name}</h4>
                      </div>
                      <div className="space-y-2 ml-6">
                        {categoryPermissions.map((permission: any) => {
                          const userPerms = userPermissionsData?.find((up: any) => up.userId === selectedUser);
                          const hasPermission = userPerms?.permissions ? (userPerms.permissions as any).includes(permission.name as any) : false;
                          
                          return (
                            <div key={permission._id} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                                <p className="text-xs text-gray-600">{permission.description}</p>
                              </div>
                              <Switch
                                checked={hasPermission}
                                onCheckedChange={(checked) => handlePermissionToggle(selectedUser, permission.name, checked)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => handleBulkUpdate(selectedUser)}
                    className="w-full bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p>Select a user to manage their permissions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Permissions Overview */}
      <Card>
        <CardHeader>
          <CardTitle>All Available Permissions</CardTitle>
          <CardDescription>Complete list of system permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {permissionCategories.map(category => {
              const categoryPermissions = filteredPermissions.filter((p: any) => p.category === category.name);
              if (categoryPermissions.length === 0) return null;

              return (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={category.color}>
                      {category.name}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {categoryPermissions.length} permissions
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {categoryPermissions.map((permission: any) => (
                      <div key={permission._id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                            <p className="text-xs text-gray-600">{permission.description}</p>
                          </div>
                          <Badge variant={permission.isActive ? "default" : "secondary"} className="text-xs">
                            {permission.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
