import React from 'react';
import { Metadata } from 'next';
import { EmailQueueDashboard } from '@/components/admin/email-queue-dashboard';

export const metadata: Metadata = {
  title: 'Email Queue Management - CribNosh Admin',
  description: 'Monitor and manage email queue, view send history and analytics',
};

export default function EmailQueuePage() {
  return (
    <div className="container mx-auto py-6">
      <EmailQueueDashboard />
    </div>
  );
}