"use client";

import { Badge } from 'lucide-react';

export default function AdminAffiliate() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Badge className="w-8 h-8 text-primary-600" />
        <h1 className="text-2xl font-bold font-asgard text-gray-900">Affiliate Management</h1>
      </div>
      <p className="font-satoshi text-gray-700 max-w-2xl">
        Here you can manage affiliate program settings, view affiliate users, and adjust commission or rewards. (Feature coming soon)
      </p>
    </div>
  );
} 