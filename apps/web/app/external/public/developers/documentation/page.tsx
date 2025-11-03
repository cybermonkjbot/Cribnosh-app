'use client';

import { Rocket, BookOpen, Code, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DeveloperDocumentationPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-foreground mb-4 font-asgard">
              CribNosh API Documentation
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Build personalized meal experiences with our intelligent food platform API
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Getting Started Section */}
        <div className="mb-16">
          <div className="grid md:grid-cols-3 gap-6">
            <Link 
              href="/external/public/developers/documentation/quickstart"
              className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
            >
              <Rocket className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Quick Start</h3>
              <p className="text-sm text-muted-foreground">
                Get up and running with the CribNosh API in minutes
              </p>
            </Link>

            <Link 
              href="/external/public/developers/documentation/api-reference"
              className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
            >
              <BookOpen className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">API Reference</h3>
              <p className="text-sm text-muted-foreground">
                Complete reference for all API endpoints with interactive testing
              </p>
            </Link>

            <Link 
              href="/external/public/developers/documentation/examples"
              className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
            >
              <Code className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Code Examples</h3>
              <p className="text-sm text-muted-foreground">
                Ready-to-use code snippets for common operations
              </p>
            </Link>
          </div>
        </div>

        {/* API Overview */}
        <div className="bg-card border border-border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6 font-asgard">API Overview</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">Base URL</h3>
              <code className="bg-muted px-3 py-2 rounded text-sm block">
                https://cribnosh.com/api
              </code>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Authentication</h3>
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
              Need help? Contact our developer support team
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