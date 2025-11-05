import React from 'react';
import { Metadata } from 'next';
import { EmailTemplateEditor } from '@/components/admin/email-template-editor';

export const metadata: Metadata = {
  title: 'Create New Template - CribNosh Admin',
  description: 'Create a new email template configuration',
};

export default function NewTemplatePage() {
  return (
    <div className="container mx-auto py-6">
      <EmailTemplateEditor 
        onCancel={() => window.history.back()}
      />
    </div>
  );
}
