'use client';
import { LocationData, getLocationFromIp } from '@/lib/location/service';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

interface LocationContextValue {
  location: LocationData | null;
  loading: boolean;
}

const LocationContext = createContext<LocationContextValue>({ location: null, loading: true });

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLocation() {
      try {
        // Try to get the IP from the custom header set by middleware (on server), fallback to client IP
        let ip = '';
        if (typeof window !== 'undefined') {
          // On client, fetch from public IP API
          const res = await fetch('https://api.ipify.org?format=json');
          const data = await res.json();
          ip = data.ip;
        }
        if (ip) {
          const loc = await getLocationFromIp(ip);
          setLocation(loc);
        }
      } catch (e) {
        setLocation(null);
      } finally {
        setLoading(false);
      }
    }
    fetchLocation();
  }, []);

  return (
    <LocationContext.Provider value={{ location, loading }}>
      {children}
    </LocationContext.Provider>
  );
};
