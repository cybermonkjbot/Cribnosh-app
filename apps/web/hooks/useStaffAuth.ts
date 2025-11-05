import { useState, useEffect } from 'react';
import { Id } from "@/convex/_generated/dataModel";

export interface StaffUser {
  _id: Id<"users">;
  name: string;
  email: string;
  roles: string[];
  status?: string;
  avatar?: string;
  preferences?: {
    cuisine?: string[];
    dietary?: string[];
  };
}

interface StaffAuthState {
  staff: StaffUser | null;
  loading: boolean;
}

export function useStaffAuth(): StaffAuthState {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStaffAuth = async () => {
      try {
        // Check if we have a session token in cookies
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };
        
        const sessionToken = getCookie('convex-auth-token');
        
        if (!sessionToken) {
          setStaff(null);
          setLoading(false);
          return;
        }

        // Fetch user data from API
        const response = await fetch('/api/staff/data', {
          method: 'GET',
          credentials: 'include', // Include cookies
        });

        if (!response.ok) {
          setStaff(null);
          setLoading(false);
          return;
        }

        const data = await response.json();

        if (data.success && data.data) {
          // Transform API user to StaffUser format
          const staffUser: StaffUser = {
            _id: data.data.id || data.data._id, // Handle both id and _id fields
            name: data.data.name,
            email: data.data.email,
            roles: data.data.roles || [],
            status: data.data.status,
            avatar: data.data.avatar,
            preferences: data.data.preferences,
          };

          console.log('[useStaffAuth] Transformed staff user:', staffUser);
          setStaff(staffUser);
        } else {
          console.log('[useStaffAuth] No valid staff data found:', data);
          setStaff(null);
        }
      } catch (error) {
        console.error('Staff auth check failed:', error);
        setStaff(null);
      } finally {
        setLoading(false);
      }
    };

    checkStaffAuth();
  }, []);

  return { staff, loading };
} 