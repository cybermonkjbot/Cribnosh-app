import { ReactNode } from 'react';
import { withPageAnalytics } from './withPageAnalytics';

export function AnalyticsProvider({ children, pageId }: { children: ReactNode; pageId: string }) {
  // Wrap children with analytics HOC
  const Wrapper = withPageAnalytics(() => <>{children}</>, pageId);
  return <Wrapper />;
}
