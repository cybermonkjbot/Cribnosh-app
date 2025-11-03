import React from 'react';
import { Metadata } from 'next';
import { EmailTemplateEditor } from '@/components/admin/email-template-editor';

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
    <div className="container mx-auto py-6">
      <EmailTemplateEditor 
        templateId={params.id}
        onCancel={() => window.history.back()}
      />
    </div>
  );
}
