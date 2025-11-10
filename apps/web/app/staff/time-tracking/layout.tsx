import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Time Tracking | Staff Portal | CribNosh',
  description: 'Track your work hours and sessions',
};

export default function TimeTrackingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

