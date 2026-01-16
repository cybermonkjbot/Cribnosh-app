import { EmailTemplateEditor } from '@/components/admin/email-template-editor';
import { Metadata } from 'next';

interface TemplateEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: TemplateEditPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Edit Template ${id} - CribNosh Admin`,
    description: 'Edit email template configuration',
  };
}

export default async function TemplateEditPage({ params }: TemplateEditPageProps) {
  const { id } = await params;
  return (
    <div className="container mx-auto py-6 space-y-[18px]">
      <EmailTemplateEditor
        templateId={id}
        onCancel={() => window.history.back()}
      />
    </div>
  );
}
