import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Staff Portal | CribNosh',
  description: 'Staff dashboard and portal',
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

