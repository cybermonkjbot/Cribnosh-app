'use client';

import dynamic from 'next/dynamic';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect } from 'react';

interface SwaggerUIProps {
  url: string;
  docExpansion?: string;
  defaultModelsExpandDepth?: number;
  defaultModelExpandDepth?: number;
  tryItOutEnabled?: boolean;
  supportedSubmitMethods?: string[];
  deepLinking?: boolean;
  showExtensions?: boolean;
  showCommonExtensions?: boolean;
  validatorUrl?: string | null;
}

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading API Reference...</p>
      </div>
    </div>
  ),
}) as React.ComponentType<SwaggerUIProps>;

export default function ApiReferencePage() {
  useEffect(() => {
    // Add custom SwaggerUI styles after component mounts
    const style = document.createElement('style');
    style.textContent = `
      .swagger-ui {
        font-family: 'Satoshi', ui-sans-serif, system-ui, sans-serif;
      }
      .swagger-ui .topbar {
        display: none;
      }
      .swagger-ui .info {
        margin: 20px 0;
      }
      .swagger-ui .info .title {
        font-family: 'Asgard', ui-sans-serif, system-ui, sans-serif;
        font-weight: 700;
        color: hsl(var(--foreground));
      }
      .swagger-ui .scheme-container {
        background: hsl(var(--card));
        border: 1px solid hsl(var(--border));
        border-radius: 8px;
        padding: 16px;
        margin: 16px 0;
      }
      .swagger-ui .opblock {
        border: 1px solid hsl(var(--border));
        border-radius: 8px;
        margin: 16px 0;
        background: hsl(var(--card));
      }
      .swagger-ui .opblock .opblock-summary {
        border-bottom: 1px solid hsl(var(--border));
        padding: 16px;
      }
      .swagger-ui .opblock .opblock-summary-description {
        color: hsl(var(--muted-foreground));
      }
      .swagger-ui .opblock.opblock-get {
        border-left: 4px solid #22c55e;
      }
      .swagger-ui .opblock.opblock-post {
        border-left: 4px solid #3b82f6;
      }
      .swagger-ui .opblock.opblock-put {
        border-left: 4px solid #eab308;
      }
      .swagger-ui .opblock.opblock-delete {
        border-left: 4px solid #ef4444;
      }
      .swagger-ui .opblock.opblock-patch {
        border-left: 4px solid #a855f7;
      }
      .swagger-ui .btn {
        background: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
        border: none;
        border-radius: 6px;
        padding: 8px 16px;
        font-weight: 500;
      }
      .swagger-ui .btn:hover {
        background: hsl(var(--primary) / 0.9);
      }
      .swagger-ui .btn.execute {
        background: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
      }
      .swagger-ui .btn.execute:hover {
        background: hsl(var(--primary) / 0.9);
      }
      .swagger-ui .parameters-col_description {
        color: hsl(var(--muted-foreground));
      }
      .swagger-ui .parameter__name {
        color: hsl(var(--foreground));
        font-weight: 600;
      }
      .swagger-ui .parameter__type {
        color: hsl(var(--primary));
        font-weight: 500;
      }
      .swagger-ui .response-col_description {
        color: hsl(var(--muted-foreground));
      }
      .swagger-ui .response-col_status {
        font-weight: 600;
      }
      .swagger-ui .model {
        background: hsl(var(--muted) / 0.3);
        border: 1px solid hsl(var(--border));
        border-radius: 6px;
        padding: 12px;
      }
      .swagger-ui .model-title {
        color: hsl(var(--foreground));
        font-weight: 600;
      }
      .swagger-ui .prop-name {
        color: hsl(var(--foreground));
        font-weight: 500;
      }
      .swagger-ui .prop-type {
        color: hsl(var(--primary));
      }
      .swagger-ui .prop-format {
        color: hsl(var(--muted-foreground));
      }
      .swagger-ui .prop-description {
        color: hsl(var(--muted-foreground));
      }
      .swagger-ui input[type="text"], 
      .swagger-ui input[type="password"], 
      .swagger-ui input[type="email"], 
      .swagger-ui input[type="url"], 
      .swagger-ui input[type="number"], 
      .swagger-ui textarea, 
      .swagger-ui select {
        background: hsl(var(--background));
        border: 1px solid hsl(var(--border));
        border-radius: 6px;
        color: hsl(var(--foreground));
        padding: 8px 12px;
      }
      .swagger-ui input:focus, 
      .swagger-ui textarea:focus, 
      .swagger-ui select:focus {
        outline: none;
        border-color: hsl(var(--primary));
        box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
      }
      .swagger-ui .highlight-code {
        background: hsl(var(--muted) / 0.3);
        border: 1px solid hsl(var(--border));
        border-radius: 6px;
      }
      .swagger-ui .response .microlight {
        background: hsl(var(--muted) / 0.3);
        border: 1px solid hsl(var(--border));
        border-radius: 6px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

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
            API Reference
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Complete reference for all CribNosh API endpoints
          </p>
        </div>
      </div>

      {/* API Documentation */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <SwaggerUI
            url="/api/docs"
            docExpansion="list"
            defaultModelsExpandDepth={1}
            defaultModelExpandDepth={1}
            tryItOutEnabled={true}
            supportedSubmitMethods={['get', 'post', 'put', 'delete', 'patch']}
            deepLinking={true}
            showExtensions={true}
            showCommonExtensions={true}
            validatorUrl={null}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-card border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Need help with the API? Contact our developer support team
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