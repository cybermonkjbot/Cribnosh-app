// app/admin/login/page.tsx
'use client';

import UnifiedInternalLogin from '@/components/ui/UnifiedInternalLogin';

export default function AdminLoginPage() {
  return (
    <UnifiedInternalLogin role="admin" apiEndpoint="/api/admin/login" redirectPath="/admin" />
  );
}