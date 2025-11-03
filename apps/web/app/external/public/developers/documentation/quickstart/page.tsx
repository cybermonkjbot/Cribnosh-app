'use client';

import { ArrowLeft, Key, Globe, Rocket } from 'lucide-react';
import Link from 'next/link';

export default function QuickStartPage() {
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
            Quick Start Guide
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Get up and running with the CribNosh API in minutes
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Step 1: API Key */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">1</div>
              <Key className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Get Your API Key</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Most endpoints require authentication. You'll need an API key to access protected resources.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <code className="text-sm">
                Authorization: Bearer YOUR_API_KEY
              </code>
            </div>
          </div>

          {/* Step 2: Base URL */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">2</div>
              <Globe className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Choose Your Environment</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-green-600">Production</h4>
                <code className="text-sm">https://cribnosh.com/api</code>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-600">Development</h4>
                <code className="text-sm">http://localhost:3000/api</code>
              </div>
            </div>
          </div>

          {/* Step 3: First Request */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">3</div>
              <Rocket className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Make Your First Request</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Test the API with a simple health check request:
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm">
{`fetch('https://cribnosh.com/api/health')
  .then(response => response.json())
  .then(data => console.log('API Status:', data.status))
  .catch(error => console.error('Error:', error));`}
              </pre>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">What's Next?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link 
                href="/external/public/developers/documentation/api-reference"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                View API Reference →
              </Link>
              <Link 
                href="/external/public/developers/documentation/examples"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Browse Code Examples →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-card border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Need help getting started? Contact our developer support team
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