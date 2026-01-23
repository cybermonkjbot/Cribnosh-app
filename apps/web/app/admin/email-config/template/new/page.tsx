"use client";

import { EmailTemplateEditor } from '@/components/admin/email-template-editor';

export default function NewTemplatePage() {
  return (
    <div className="container mx-auto py-6 space-y-[18px]">
      <EmailTemplateEditor
        onCancel={() => window.history.back()}
      />
    </div>
  );
}
