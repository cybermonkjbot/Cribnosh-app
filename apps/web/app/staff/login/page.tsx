'use client';

import UnifiedInternalLogin from '@/components/ui/UnifiedInternalLogin';

export default function StaffLoginPage() {
  return (
    <UnifiedInternalLogin role="staff" apiEndpoint="/api/staff/auth/login" redirectPath="/staff/portal" />
  );
} 