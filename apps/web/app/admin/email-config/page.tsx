import React from 'react';
import { Metadata } from 'next';
import { EmailConfigDashboard } from '@/components/admin/email-config-dashboard';

export const metadata: Metadata = {
  title: 'Email Configuration - CribNosh Admin',
  description: 'Manage email templates, automation, branding, and delivery settings',
};

export default function EmailConfigPage() {
  return (
    <div className="container mx-auto py-6">
      <EmailConfigDashboard />
    </div>
  );
}
