import { EmailTemplateEditor } from '@/components/admin/email-template-editor';
import { Metadata } from 'next';

interface TemplateEditPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: TemplateEditPageProps): Promise<Metadata> {
  return {
    title: `Edit Template ${params.id} - CribNosh Admin`,
    description: 'Edit email template configuration',
  };
}

export default function TemplateEditPage({ params }: TemplateEditPageProps) {
  return (
    <div className="container mx-auto py-6 space-y-[18px]">
      <EmailTemplateEditor 
        templateId={params.id}
        onCancel={() => window.history.back()}
      />
    </div>
  );
}
