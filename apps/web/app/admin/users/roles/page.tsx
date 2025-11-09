"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import {
  Edit,
  Filter,
  Plus,
  Search,
  Trash2,
  UserCheck,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface UserRole {
  _id: Id<"userRoles">;
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
  userCount: number;
  createdAt: number;
}

export default function UserRolesPage() {
  const { sessionToken } = useAdminUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] as string[] });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; roleId: Id<"userRoles"> | null }>({
    isOpen: false,
    roleId: null,
  });

  // Fetch roles and users
  // Note: These queries may not exist yet - using type assertions for now
  const roles = useQuery(api.queries.admin?.getUserRoles as typeof api.queries.admin.getUserRoles) as UserRole[] | undefined;
  const users = useQuery(api.queries.users?.getUsersForAdmin as typeof api.queries.users.getAllStaff, sessionToken ? { sessionToken } : "skip") as Array<{ _id: Id<"users">; name?: string; email?: string }> | undefined;
  const permissions = useQuery(api.queries.admin?.getAvailablePermissions as typeof api.queries.admin.getAvailablePermissions) as string[] | undefined;

  // Mutations
  const createRole = useMutation(api.mutations.admin?.createUserRole as typeof api.mutations.admin.createUserRole);
  const updateRole = useMutation(api.mutations.admin?.updateUserRole as typeof api.mutations.admin.updateUserRole);
  const deleteRole = useMutation(api.mutations.admin?.deleteUserRole as typeof api.mutations.admin.deleteUserRole);
  const assignRole = useMutation(api.mutations.admin?.assignUserRole as typeof api.mutations.admin.assignUserRole);

  const availablePermissions = [
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'chefs.view',
    'chefs.approve',
    'chefs.reject',
    'orders.view',
    'orders.manage',
    'analytics.view',
    'settings.manage',
    'staff.manage',
    'payroll.view',
    'content.manage',
    'compliance.view'
  ];

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) {
      setError('Role name is required');
      return;
    }

    try {
      setError(null);
      await createRole({
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions
      });
      setNewRole({ name: '', description: '', permissions: [] });
      setIsCreating(false);
      setSuccess('Role created successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
    }
  };

  const handleUpdateRole = async (roleId: Id<"userRoles">, updates: Partial<UserRole>) => {
    try {
      setError(null);
      setIsUpdating(true);
      await updateRole({ roleId, ...updates });
      setSuccess('Role updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteRole = async (roleId: Id<"userRoles">) => {
    setDeleteConfirm({ isOpen: true, roleId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.roleId) return;
    try {
      setError(null);
      setIsDeleting(deleteConfirm.roleId);
      await deleteRole({ roleId: deleteConfirm.roleId });
      setSuccess('Role deleted successfully');
      setDeleteConfirm({ isOpen: false, roleId: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleAssignRole = async (userId: Id<"users">, roleId: Id<"userRoles">) => {
    try {
      setError(null);
      setIsAssigning(userId);
      await assignRole({ userId, roleId });
      setSuccess('Role assigned successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    } finally {
      setIsAssigning(null);
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

  const togglePermission = (permission: string) => {
    setNewRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const filteredRoles = roles?.filter((role: UserRole) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">User Roles</h1>
          <p className="text-gray-600 font-satoshi mt-2">Manage user roles and permissions</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          size="lg"
          className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
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

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <Input
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedRole ?? undefined} onValueChange={(val) => setSelectedRole(val === "__ALL__" ? null : val)}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__ALL__">All Roles</SelectItem>
            {roles?.map((role: UserRole) => (
              <SelectItem key={role._id} value={role._id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Create Role Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Role</CardTitle>
            <CardDescription>Define a new user role with specific permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Role Name</label>
                <Input
                  value={newRole.name}
                  onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter role name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Input
                  value={newRole.description}
                  onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter role description"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Permissions</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availablePermissions.map(permission => (
                  <label key={permission} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newRole.permissions.includes(permission)}
                      onChange={() => togglePermission(permission)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{permission}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateRole} className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white">
                Create Role
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role: UserRole) => (
          <Card key={role._id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#F23E2E]" />
                  {role.name}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedRole(role._id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!role.isDefault && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteRole(role._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {role.userCount} users assigned
                  </span>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map((permission: string) => (
                      <Badge key={permission} variant="secondary" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>

                {role.isDefault && (
                  <Badge variant="outline" className="text-xs">
                    Default Role
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users with Role Assignment */}
      {selectedRole && (
        <Card>
          <CardHeader>
            <CardTitle>Assign Role to Users</CardTitle>
            <CardDescription>Select users to assign the selected role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {users?.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#F23E2E]/10 rounded-full flex items-center justify-center">
                      <span className="text-[#F23E2E] font-medium text-sm">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name || 'Unknown User'}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAssignRole(user._id, selectedRole as Id<"userRoles">)}
                    className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
                  >
                    Assign Role
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, roleId: null })}
        onConfirm={confirmDelete}
        title="Delete Role"
        message="Are you sure you want to delete this role? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="error"
        isLoading={isDeleting !== null}
      />
    </div>
  );
}
