import { useEffect } from 'react';
import { trackPageView, trackClick, trackMouseMove } from './analytics';

export function withAnalytics<P extends object>(Component: React.ComponentType<P>, pageId: string) {
  return function AnalyticsWrapper(props: P) {
    useEffect(() => {
      trackPageView(pageId);
      // Mouse move tracking (throttled)
      let lastSent = 0;
      const onMove = (e: MouseEvent) => {
        const now = Date.now();
        if (now - lastSent > 100) {
          trackMouseMove(pageId, e.clientX, e.clientY);
          lastSent = now;
        }
      };
      // Click tracking
      const onClick = (e: MouseEvent) => {
        trackClick(pageId, e.clientX, e.clientY);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('click', onClick);
      return () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('click', onClick);
      };
    }, []);
    return <Component {...props} />;
  };
}
