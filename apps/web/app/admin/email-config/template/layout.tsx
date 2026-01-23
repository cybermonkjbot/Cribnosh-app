import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Email Templates - CribNosh Admin',
    description: 'Manage and edit email template configurations',
};

export default function EmailTemplateLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
