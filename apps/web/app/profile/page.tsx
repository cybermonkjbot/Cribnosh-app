"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/use-session";
import { ArrowRight, Edit, Mail, MapPin, Phone, User } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { isAuthenticated, isLoading, user } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff3b30] mx-auto mb-4"></div>
          <p className="text-gray-600 font-satoshi">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 py-8 w-full">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-[#10B981]/20 flex items-center justify-center mx-auto mb-6">
              <User className="w-12 h-12 text-[#10B981]" />
            </div>
            <h2 className="text-xl font-asgard text-[#094327] mb-2">Sign in to view your profile</h2>
            <p className="text-[#6B7280] font-satoshi mb-8">
              Please sign in to your account to view and manage your profile information, delivery addresses, and preferences.
            </p>
            <Link href="/try-it">
              <Button className="bg-[#ff3b30] hover:bg-[#ff5e54] text-white">
                Browse Kitchens
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-asgard text-gray-900 mb-2">Your Profile</h1>
          <p className="text-gray-600 font-satoshi">Manage your account information</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-[#ff3b30] flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-asgard text-gray-900">
                  {user?.name || 'User'}
                </h2>
                <p className="text-gray-600 font-satoshi text-sm">
                  {user?.email || 'No email'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 font-satoshi">Email</p>
                <p className="text-gray-900 font-medium">{user?.email || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 font-satoshi">Phone</p>
                <p className="text-gray-900 font-medium">{user?.phone || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 font-satoshi">Address</p>
                <p className="text-gray-900 font-medium">Not set</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-asgard text-gray-900 mb-4">Account Settings</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Payment Methods
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Delivery Addresses
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Notification Preferences
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

