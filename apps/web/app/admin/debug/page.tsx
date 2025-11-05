'use client';

import { useEffect, useState } from 'react';
import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { useToast } from '@/hooks/use-toast';

export default function AdminDebugPage() {
  const { user, loading } = useAdminUser();
  const { toast } = useToast();
  const [cookies, setCookies] = useState<string>('');
  const [localStorage, setLocalStorage] = useState<string>('');

  useEffect(() => {
    setCookies(document.cookie);
    setLocalStorage(JSON.stringify({
      adminEmail: window.localStorage.getItem('adminEmail'),
      adminToken: window.localStorage.getItem('adminToken'),
    }, null, 2));
  }, []);

  return (
    <div className="p-8 space-y-6">
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
          <h2 className="text-lg font-semibold">Test API Call:</h2>
          <button 
            onClick={async () => {
              try {
                const response = await fetch('/api/admin/me', { credentials: 'include' });
                const data = await response.json();
                toast({
                  title: "API Response",
                  description: `Response: ${JSON.stringify(data, null, 2)}`,
                  variant: "default"
                });
              } catch (error) {
                toast({
                  title: "API Error",
                  description: `Error: ${error}`,
                  variant: "destructive"
                });
              }
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test /api/admin/me
          </button>
        </div>
      </div>
    </div>
  );
}
