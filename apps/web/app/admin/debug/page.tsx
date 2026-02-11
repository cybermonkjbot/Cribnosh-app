'use client';

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from 'convex/react';
import { useEffect, useState } from 'react';

export default function AdminDebugPage() {
  const { user, loading, sessionToken } = useAdminUser();
  const { toast } = useToast();
  const [cookies, setCookies] = useState<string>('');
  const [localStorage, setLocalStorage] = useState<string>('');

  const me = useQuery(api.queries.users.getMe, { sessionToken: sessionToken || undefined });

  useEffect(() => {
    setCookies(document.cookie);
    setLocalStorage(JSON.stringify({
      adminEmail: window.localStorage.getItem('adminEmail'),
      adminToken: window.localStorage.getItem('adminToken'),
    }, null, 2));
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-[18px]">
      <h1 className="text-2xl font-bold">Admin Debug Page</h1>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">AdminUserProvider State:</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify({ user, loading }, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Cookies:</h2>
          <pre className="bg-gray-100 p-4 rounded">{cookies}</pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold">LocalStorage:</h2>
          <pre className="bg-gray-100 p-4 rounded">{localStorage}</pre>
        </div>



        <div>
          <h2 className="text-lg font-semibold">Convex api.queries.users.getMe:</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(me, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
