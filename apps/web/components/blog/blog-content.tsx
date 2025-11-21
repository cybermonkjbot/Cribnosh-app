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
      <div 
        className="prose prose-neutral max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
      <EmbedScripts content={sanitizedContent} />
    </>
  );
}

