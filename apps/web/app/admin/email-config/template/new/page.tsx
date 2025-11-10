import { EmailTemplateEditor } from '@/components/admin/email-template-editor';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create New Template - CribNosh Admin',
  description: 'Create a new email template configuration',
};

export default function NewTemplatePage() {
  return (
    <div className="container mx-auto py-6 space-y-[18px]">
      <EmailTemplateEditor 
        onCancel={() => window.history.back()}
      />
    </div>
  );
}
