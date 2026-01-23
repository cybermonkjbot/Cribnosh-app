"use client";

import { EmailTemplateEditor } from '@/components/admin/email-template-editor';
import { use } from 'react';

interface TemplateEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function TemplateEditPage({ params }: TemplateEditPageProps) {
  const { id } = use(params);

  return (
    <div className="container mx-auto py-6 space-y-[18px]">
      <EmailTemplateEditor
        templateId={id}
        onCancel={() => window.history.back()}
      />
    </div>
  );
}
