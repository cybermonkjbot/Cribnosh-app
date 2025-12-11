"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { EmptyState } from '@/components/admin/empty-state';
import { UsersTableSkeleton } from '@/components/admin/skeletons';
import { UserFilterBar } from '@/components/admin/user-filter-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from 'convex/react';
import { Calendar, Edit, Mail, Shield, Trash, UserPlus, Users } from 'lucide-react';
import { motion } from 'motion/react';

interface User {
  _id: Id<"users">;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: number;
  lastModified?: number;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'moderator' | 'chef';
  status: 'active' | 'inactive' | 'suspended';
}

interface UpdateUserData {
  userId: Id<"users">;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'moderator' | 'chef';
  status: 'active' | 'inactive' | 'suspended';
  password?: string;
}

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  roles: string[];
  status: 'active' | 'inactive' | 'suspended';
}

export default function AdminUsers() {
  // Auth is handled by layout via session-based authentication (session token in cookies)
  // Middleware (proxy.ts) validates session token server-side, no client-side checks needed
  const router = useRouter();
  const { toast } = useToast();
  const { user, sessionToken, loading } = useAdminUser();

  // Authentication is handled by layout, so user is guaranteed to be authenticated here
  // Pass sessionToken if available (for development debug cookie), otherwise rely on httpOnly cookie
  const queryArgs = loading || !sessionToken ? "skip" : { sessionToken };
  const usersQuery = useQuery(api.queries.users.getAllUsers, queryArgs);
  
  // Transform users data: map roles array to role string for display
  const users = usersQuery ? (usersQuery as any[]).map((u: any) => ({
    ...u,
    role: u.roles?.find((r: string) => ['admin', 'moderator', 'chef', 'staff'].includes(r)) || u.roles?.[0] || 'user'
  })) as User[] : undefined;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin' | 'moderator' | 'chef'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active',
  });
  const [formErrors, setFormErrors] = useState<Partial<UserFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; userId: Id<"users"> | null }>({
    isOpen: false,
    userId: null,
  });

  const createUser = useMutation(api.mutations.users.createUser);
  const updateUser = useMutation(api.mutations.users.updateUser);
  const deleteUser = useMutation(api.mutations.users.deleteUser);
  const updateUserStatus = useMutation(api.mutations.users.updateUserStatus);
  const updateUserRole = useMutation(api.mutations.users.updateUserRoles);

  // Validation functions
  const validateForm = (): boolean => {
    const errors: Partial<UserFormData> = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation (only for new users)
    if (!editingUser) {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      } else if (formData.password.length > 128) {
        errors.password = 'Password must be less than 128 characters';
      } else if (formData.password.length < 8 && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        errors.password = 'For passwords under 8 characters, must contain uppercase, lowercase, and number';
      }
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (formData.password && formData.password.length > 128) {
      errors.password = 'Password must be less than 128 characters';
    } else if (formData.password && formData.password.length < 8 && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'For passwords under 8 characters, must contain uppercase, lowercase, and number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
      status: 'active',
    });
    setFormErrors({});
  };

  // Real-time validation for individual fields
  const validateField = (field: keyof UserFormData, value: string) => {
    const errors: Partial<UserFormData> = { ...formErrors };

    switch (field) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Name is required';
        } else if (value.trim().length < 2) {
          errors.name = 'Name must be at least 2 characters';
        } else if (value.trim().length > 50) {
          errors.name = 'Name must be less than 50 characters';
        } else {
          delete errors.name;
        }
        break;
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
          errors.email = 'Email is required';
        } else if (!emailRegex.test(value)) {
          errors.email = 'Please enter a valid email address';
        } else if (value.length > 100) {
          errors.email = 'Email must be less than 100 characters';
        } else {
          delete errors.email;
        }
        break;
      
      case 'password':
        if (!editingUser && !value) {
          errors.password = 'Password is required';
        } else if (value && value.length < 6) {
          errors.password = 'Password must be at least 6 characters';
        } else if (value && value.length > 128) {
          errors.password = 'Password must be less than 128 characters';
        } else if (value && value.length < 8 && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          errors.password = 'For passwords under 8 characters, must contain uppercase, lowercase, and number';
        } else {
          delete errors.password;
        }
        break;
    }

    setFormErrors(errors);
  };

  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleCreateNew = () => {
    setEditingUser(null);
    clearForm();
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't show password when editing
      role: user.role as 'user' | 'admin' | 'moderator' | 'chef',
      status: user.status,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        // Update user (without password if not provided)
        const updateData: UpdateUserData = {
          userId: editingUser._id,
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          status: formData.status,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await updateUser(updateData);
      } else {
        // Create new user
        const createData: CreateUserData = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          roles: [formData.role],
          status: formData.status,
        };
        await createUser(createData);
      }
      setShowModal(false);
      clearForm();
    } catch (error) {
      // You could add a toast notification here for better UX
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: Id<"users">) => {
    setDeleteConfirm({ isOpen: true, userId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.userId) return;
    setIsDeleting(deleteConfirm.userId);
    try {
      await deleteUser({ userId: deleteConfirm.userId });
      toast({
        title: "Success",
        description: "User deleted successfully!",
        variant: "success"
      });
      setDeleteConfirm({ isOpen: false, userId: null });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'moderator': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'chef': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-[18px]">
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-asgard text-gray-900 mb-3 flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-xl">
              <Users className="w-8 h-8 text-primary-600" />
            </div>
            User Management
          </h1>
          <p className="text-gray-700 font-satoshi text-lg">
            Manage system users, roles, and permissions
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => router.push('/admin/users/permissions')}
            className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white"
          >
            <Shield className="w-4 h-4 mr-2" />
            Permissions
          </Button>
          <Button 
            size="lg"
            onClick={handleCreateNew}
            className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white shadow-lg"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </motion.div>

      {/* Enhanced Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <UserFilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          roleFilter={roleFilter}
          onRoleFilterChange={(value: string) => setRoleFilter(value as 'all' | 'user' | 'admin' | 'moderator' | 'chef')}
          statusFilter={statusFilter}
          onStatusFilterChange={(value: string) => setStatusFilter(value as 'all' | 'active' | 'inactive' | 'suspended')}
          totalCount={users?.length || 0}
          filteredCount={filteredUsers?.length}
        />
      </motion.div>

      {/* Enhanced Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/90 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl overflow-hidden"
      >
        {filteredUsers?.length === 0 && users ? (
          <div className="flex flex-col items-center justify-center h-64 p-12">
            <EmptyState
              icon={Users}
              title={searchQuery || statusFilter !== 'all' || roleFilter !== 'all' ? "No users found" : "No users yet"}
              description={searchQuery || statusFilter !== 'all' || roleFilter !== 'all' 
                ? "Try adjusting your search or filter criteria to see more results."
                : "Users will appear here once they are added to the system."}
              action={searchQuery || statusFilter !== 'all' || roleFilter !== 'all' ? {
                label: "Clear filters",
                onClick: () => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setRoleFilter('all');
                },
                variant: "secondary"
              } : undefined}
              variant={searchQuery || statusFilter !== 'all' || roleFilter !== 'all' ? "filtered" : "no-data"}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]" role="table" aria-label="Users table">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr role="row">
                  <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900" scope="col" role="columnheader">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900" scope="col" role="columnheader">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900" scope="col" role="columnheader">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900" scope="col" role="columnheader">Last Login</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900" scope="col" role="columnheader">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/60">
                {!users ? (
                  <UsersTableSkeleton rowCount={5} />
                ) : filteredUsers?.map((user) => (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50/50 transition-colors"
                    role="row"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-800 font-asgard">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold font-asgard text-gray-900">{user.name}</p>
                          <div className="flex items-center gap-1 text-sm text-gray-600 font-satoshi">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${getRoleBadge(user.role)} capitalize`}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${getStatusBadge(user.status)}`}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 font-satoshi">
                        <Calendar className="w-4 h-4" />
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </div>
                    </td>
                    <td className="px-6 py-4" role="cell">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(user)}
                          aria-label={`Edit user ${user.name}`}
                        >
                          <Edit className="w-3 h-3 mr-1" aria-hidden="true" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(user._id)}
                          disabled={isDeleting === user._id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                          aria-label={`Delete user ${user.name}`}
                        >
                          {isDeleting === user._id ? (
                            <>
                              <div className="w-3 h-3 mr-1 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash className="w-3 h-3 mr-1" aria-hidden="true" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* User Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-asgard text-gray-900">
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4" role="form" aria-label="User form">
                <div>
                  <label htmlFor="user-name" className="block text-sm font-medium font-satoshi text-gray-700 mb-2">
                    Name
                  </label>
                  <Input
                    id="user-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, name: value });
                      validateField('name', value);
                    }}
                    placeholder="Enter user name"
                    className={`min-h-[44px] ${
                      formErrors.name 
                        ? 'border-red-500 focus:border-red-500' 
                        : formData.name && !formErrors.name 
                        ? 'border-green-500 focus:border-green-500' 
                        : ''
                    }`}
                    required
                    aria-describedby={formErrors.name ? "name-error" : undefined}
                    aria-invalid={!!formErrors.name}
                  />
                  {formErrors.name && (
                    <p id="name-error" className="text-red-500 text-sm font-satoshi mt-1" role="alert">{formErrors.name}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="user-email" className="block text-sm font-medium font-satoshi text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    id="user-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, email: value });
                      validateField('email', value);
                    }}
                    placeholder="Enter user email"
                    className={`min-h-[44px] ${
                      formErrors.email 
                        ? 'border-red-500 focus:border-red-500' 
                        : formData.email && !formErrors.email 
                        ? 'border-green-500 focus:border-green-500' 
                        : ''
                    }`}
                    required
                    aria-describedby={formErrors.email ? "email-error" : undefined}
                    aria-invalid={!!formErrors.email}
                  />
                  {formErrors.email && (
                    <p id="email-error" className="text-red-500 text-sm font-satoshi mt-1" role="alert">{formErrors.email}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="user-password" className="block text-sm font-medium font-satoshi text-gray-700 mb-2">
                    Password
                  </label>
                  <Input
                    id="user-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, password: value });
                      validateField('password', value);
                    }}
                    placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
                    className={`min-h-[44px] ${
                      formErrors.password 
                        ? 'border-red-500 focus:border-red-500' 
                        : formData.password && !formErrors.password 
                        ? 'border-green-500 focus:border-green-500' 
                        : ''
                    }`}
                    required={!editingUser}
                    aria-describedby={formErrors.password ? "password-error" : undefined}
                    aria-invalid={!!formErrors.password}
                  />
                  {formErrors.password && (
                    <p id="password-error" className="text-red-500 text-sm font-satoshi mt-1" role="alert">{formErrors.password}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium font-satoshi text-gray-700 mb-2">
                    Role
                  </label>
                  <Select value={formData.role} onValueChange={(value: 'user' | 'admin' | 'moderator' | 'chef') => setFormData({ ...formData, role: value })}>
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="chef">Chef</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium font-satoshi text-gray-700 mb-2">
                    Status
                  </label>
                  <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'suspended') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  clearForm();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, userId: null })}
        onConfirm={confirmDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="error"
        isLoading={isDeleting !== null}
      />
    </div>
  );
}

