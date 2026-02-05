import { useEffect, useState } from 'react';

export function useUserIp() {
  const [ip, setIp] = useState<string | null>(null);

  useEffect(() => {
    const cachedIp = localStorage.getItem('userIp');
    if (cachedIp) {
      setIp(cachedIp);
    } else {
      fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => {
          if (data?.ip) {
            setIp(data.ip);
            localStorage.setItem('userIp', data.ip);
          }
        })
        .catch(() => setIp(null));
    }
  }, []);

  return ip;
} 