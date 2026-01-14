import { ReactNode, useMemo } from 'react';
import { withPageAnalytics } from './withPageAnalytics';

export function AnalyticsProvider({ children, pageId }: { children: ReactNode; pageId: string }) {
  // Wrap children with analytics HOC
  const Wrapper = useMemo(() => withPageAnalytics(() => <>{children}</>, pageId), [children, pageId]);
  return <Wrapper />;
}
