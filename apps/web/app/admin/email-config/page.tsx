import { EmailConfigDashboard } from '@/components/admin/email-config-dashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Email Configuration - CribNosh Admin',
  description: 'Manage email templates, automation, branding, and delivery settings',
};

export default function EmailConfigPage() {
  return (
    <div className="container mx-auto py-6 space-y-[18px]">
      <EmailConfigDashboard />
    </div>
  );
}
