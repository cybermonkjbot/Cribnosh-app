'use client';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { LocationData, getLocationFromIp } from '@/lib/location/service';

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
          // On client, fetch from API route that returns IP
          const res = await fetch('/api/get-ip', {
            headers: {
              'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
            },
          });
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
