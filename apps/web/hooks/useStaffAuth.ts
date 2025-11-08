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
        // Authentication is session-based via httpOnly cookie (convex-auth-token)
        // The cookie is not accessible via JavaScript (httpOnly), but is automatically
        // sent with requests. Always make the API call and let the server validate the cookie.
        const response = await fetch('/api/staff/data', {
          method: 'GET',
          credentials: 'include', // Include cookies (session token is sent automatically)
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

          setStaff(staffUser);
        } else {
          setStaff(null);
        }
      } catch (error) {
        setStaff(null);
      } finally {
        setLoading(false);
      }
    };

    checkStaffAuth();
  }, []);

  return { staff, loading };
} 