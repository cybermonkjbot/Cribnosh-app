"use client";

import { EmbedScripts } from "./embed-scripts";
import { sanitizeEmbedHTML } from "@/lib/utils/embed-sanitizer";

interface BlogContentProps {
  content: string;
}

export function BlogContent({ content }: BlogContentProps) {
  // Sanitize embed content before rendering
  const sanitizedContent = sanitizeEmbedHTML(content);
  
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .blog-content-paragraphs p {
          margin-top: 1rem;
          margin-bottom: 1rem;
        }
        .blog-content-paragraphs p + p {
          margin-top: 1rem;
        }
        .blog-content-paragraphs p:first-child {
          margin-top: 0;
        }
        .blog-content-paragraphs p:last-child {
          margin-bottom: 0;
        }
        .blog-content-paragraphs a[data-type="button"] {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 500;
          transition: all 0.2s;
          text-decoration: none;
          margin: 0.5rem 0;
        }
        .blog-content-paragraphs a[data-type="button"][data-variant="primary"] {
          background-color: #F23E2E;
          color: white;
        }
        .blog-content-paragraphs a[data-type="button"][data-variant="primary"]:hover {
          background-color: rgba(242, 62, 46, 0.9);
        }
        .blog-content-paragraphs a[data-type="button"][data-variant="secondary"] {
          background-color: #4B5563;
          color: white;
        }
        .blog-content-paragraphs a[data-type="button"][data-variant="secondary"]:hover {
          background-color: #374151;
        }
        .blog-content-paragraphs a[data-type="button"][data-variant="outline"] {
          border: 2px solid #F23E2E;
          color: #F23E2E;
          background-color: transparent;
        }
        .blog-content-paragraphs a[data-type="button"][data-variant="outline"]:hover {
          background-color: rgba(242, 62, 46, 0.1);
        }
        .blog-content-paragraphs div[data-type="callout"] {
          margin-top: 1rem;
          margin-bottom: 1rem;
          padding: 1rem;
          border-radius: 0.75rem;
          border: 1px solid;
        }
        .blog-content-paragraphs div[data-type="callout"][data-variant="note"] {
          background-color: #FAFAFA;
          border-color: #E5E5E5;
          color: #262626;
        }
        .blog-content-paragraphs div[data-type="callout"][data-variant="warning"] {
          background-color: #FEF3C7;
          border-color: #FDE68A;
          color: #92400E;
        }
        .blog-content-paragraphs div[data-type="callout"][data-variant="tip"] {
          background-color: #D1FAE5;
          border-color: #A7F3D0;
          color: #065F46;
        }
        .blog-content-paragraphs details[data-type="collapsible"] {
          margin-top: 1rem;
          margin-bottom: 1rem;
          border: 1px solid #E5E5E5;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .blog-content-paragraphs details[data-type="collapsible"] summary {
          padding: 0.75rem 1rem;
          background-color: #F9FAFB;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        .blog-content-paragraphs details[data-type="collapsible"] summary:hover {
          background-color: #F3F4F6;
        }
        .blog-content-paragraphs details[data-type="collapsible"] > div {
          padding: 1rem;
        }
        .blog-content-paragraphs table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        .blog-content-paragraphs table td,
        .blog-content-paragraphs table th {
          border: 1px solid #E5E5E5;
          padding: 0.5rem;
          text-align: left;
        }
        .blog-content-paragraphs table th {
          background-color: #F9FAFB;
          font-weight: 600;
        }
        .blog-content-paragraphs hr {
          margin: 2rem 0;
          border: none;
          border-top: 1px solid #E5E5E5;
        }
      `}} />
      <div 
        className="prose prose-neutral max-w-none blog-content-paragraphs"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
      <EmbedScripts content={sanitizedContent} />
    </>
  );
}

