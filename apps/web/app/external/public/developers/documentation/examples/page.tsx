'use client';

import { ArrowLeft, Code, Copy } from 'lucide-react';
import Link from 'next/link';

interface CodeExample {
  title: string;
  description: string;
  code: string;
}

const codeExamples: CodeExample[] = [
  {
    title: 'Health Check',
    description: 'Check the health status of the CribNosh API',
    code: `fetch('/api/health')
  .then(response => response.json())
  .then(data => console.log('Health status:', data.status))
  .catch(error => console.error('Error:', error));`
  },
  {
    title: 'Join Waitlist',
    description: 'Add a user to the CribNosh waitlist',
    code: `fetch('/api/waitlist', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@cribnosh.co.uk',
    location: {
      city: 'London',
      country: 'GB'
    }
  })
})
.then(response => response.json())
.then(data => console.log('Success:', data));`
  },
  {
    title: 'Submit Contact Form',
    description: 'Send a contact form inquiry',
    code: `fetch('/api/contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@cribnosh.co.uk',
    subject: 'General Inquiry',
    message: 'Hello, I have a question about CribNosh.'
  })
})
.then(response => response.json())
.then(data => console.log('Success:', data));`
  }
];

export default function CodeExamplesPage() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <Link 
            href="/external/public/developers/documentation"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Documentation
          </Link>
          <h1 className="text-4xl font-bold text-foreground font-asgard">
            Code Examples
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Ready-to-use code snippets for common CribNosh API operations
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {codeExamples.map((example, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{example.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {example.description}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(example.code)}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors px-3 py-1 border border-primary/20 rounded hover:bg-primary/5"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>
              <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
                  <code>{example.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* API Reference */}
        <div className="mt-12 bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 font-asgard">API Reference</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Base URL</h3>
              <code className="bg-muted px-3 py-2 rounded text-sm block">
                https://cribnosh.com/api
              </code>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Authentication</h3>
              <code className="bg-muted px-3 py-2 rounded text-sm block">
                Authorization: Bearer YOUR_API_KEY
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-card border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Need help with implementation? Contact our developer support team
            </p>
            <div className="flex justify-center gap-6">
              <a href="mailto:dev@cribnosh.com" className="text-primary hover:text-primary/80 transition-colors">
                dev@cribnosh.com
              </a>
              <a href="https://github.com/cribnosh" className="text-primary hover:text-primary/80 transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}