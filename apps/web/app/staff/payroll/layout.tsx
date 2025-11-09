import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payroll | Staff Portal | CribNosh',
  description: 'View your payroll information and payslips',
};

export default function PayrollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

