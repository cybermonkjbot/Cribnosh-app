import { useEffect, useState } from 'react';

export interface MobileDeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  orientation: 'portrait' | 'landscape';
  hasTouchScreen: boolean;
}

export const useMobileDevice = (): MobileDeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<MobileDeviceInfo>({
    isMobile: false,
    isTablet: false,
    orientation: 'portrait',
    hasTouchScreen: false
  });

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const mobileRegex = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i;
      const tabletRegex = /ipad|android(?!.*mobile)/i;
      
      // Check for touch screen capability
      const hasTouchScreen = (
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        ((navigator as any).msMaxTouchPoints > 0)
      );

      // Get screen orientation
      const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';

      // Determine device type
      const isMobile = mobileRegex.test(userAgent) || window.innerWidth <= 640;
      const isTablet = tabletRegex.test(userAgent) || (window.innerWidth <= 1024 && window.innerWidth > 640);

      setDeviceInfo({
        isMobile,
        isTablet,
        orientation,
        hasTouchScreen
      });
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return deviceInfo;
}; 