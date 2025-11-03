"use client";

import { useParams } from 'next/navigation';
import { ClipboardList } from 'lucide-react';

export default function WaitlistDetail() {
  const params = useParams();
  const id = params?.id;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="w-8 h-8 text-primary-600" />
        <h1 className="text-2xl font-bold font-asgard text-gray-900">Waitlist Entry Details</h1>
      </div>
      <p className="font-satoshi text-gray-700 mb-4">Entry ID: <span className="font-mono text-primary-700">{id}</span></p>
      <p className="font-satoshi text-gray-600">(Detailed view coming soon. Here you will be able to see and manage all information for this waitlist entry.)</p>
    </div>
  );
} 