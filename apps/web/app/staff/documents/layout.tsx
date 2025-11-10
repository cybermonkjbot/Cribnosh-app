import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documents | Staff Portal | CribNosh',
  description: 'Manage your staff documents',
};

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

