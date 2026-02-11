import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getAuthToken } from "@/lib/auth-client";
import { useQuery } from 'convex/react';
import { useEffect, useState } from 'react';

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

  // Authentication is session-based via convex-auth-token cookie
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(getAuthToken());
  }, []);


  const userData = useQuery(
    api.queries.users.getUserBySessionToken,
    token ? { sessionToken: token } : 'skip'
  );

  useEffect(() => {
    if (token === null) {
      setLoading(false);
      return;
    }

    if (userData !== undefined) {
      if (userData) {
        // Transform user to StaffUser format
        const staffUser: StaffUser = {
          _id: userData._id,
          name: userData.name,
          email: userData.email,
          roles: userData.roles || [],
          status: userData.status,
          avatar: userData.avatar,
          preferences: userData.preferences,
        };
        setStaff(staffUser);
      } else {
        setStaff(null);
      }
      setLoading(false);
    }
  }, [userData, token]);

  return { staff, loading };
} 