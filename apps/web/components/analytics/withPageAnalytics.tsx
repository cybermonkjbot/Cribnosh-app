import { useEffect } from 'react';
import { trackPageView, trackClick, trackMouseMove } from '@/lib/analytics';

export function withPageAnalytics<P extends object>(Component: React.ComponentType<P>, pageId: string) {
  return function AnalyticsWrapper(props: P) {
    useEffect(() => {
      trackPageView(pageId);
      let lastMove = 0;
      const onMove = (e: MouseEvent) => {
        const now = Date.now();
        if (now - lastMove > 100) {
          trackMouseMove(pageId, e.clientX, e.clientY);
          lastMove = now;
        }
      };
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
