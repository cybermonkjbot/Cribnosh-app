"use client";

import { useEffect } from 'react';

interface EmbedScriptsProps {
  content: string;
}

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load: () => void;
      };
    };
  }
}

export function EmbedScripts({ content }: EmbedScriptsProps) {
  useEffect(() => {
    // Load Twitter widgets if Twitter embeds are present
    if (content.includes('twitter-embed') || content.includes('twitter-tweet')) {
      // Check if script is already loaded
      const existingScript = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]');
      if (existingScript) {
        // Re-initialize widgets if script already exists
        if (window.twttr && window.twttr.widgets) {
          window.twttr.widgets.load();
        }
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      script.onload = () => {
        // Initialize widgets after script loads
        if (window.twttr && window.twttr.widgets) {
          window.twttr.widgets.load();
        }
      };
      document.body.appendChild(script);

      return () => {
        // Note: We don't remove the script on cleanup to avoid re-loading
        // The script is cached by the browser anyway
      };
    }
  }, [content]);

  useEffect(() => {
    // Load TikTok embed script if TikTok embeds are present
    if (content.includes('tiktok-embed')) {
      // Check if script is already loaded
      const existingScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]');
      if (existingScript) {
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      document.body.appendChild(script);

      return () => {
        // Note: We don't remove the script on cleanup to avoid re-loading
      };
    }
  }, [content]);

  // Lazy load iframes
  useEffect(() => {
    const iframes = document.querySelectorAll('.embed-responsive iframe[loading="lazy"]');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const iframe = entry.target as HTMLIFrameElement;
          if (iframe.dataset.src) {
            iframe.src = iframe.dataset.src;
            iframe.removeAttribute('data-src');
          }
          iframe.classList.add('loaded');
          observer.unobserve(iframe);
        }
      });
    }, {
      rootMargin: '50px'
    });

    iframes.forEach(iframe => {
      // Store src in data-src for lazy loading
      if (iframe.src && !iframe.dataset.src) {
        iframe.dataset.src = iframe.src;
        iframe.removeAttribute('src');
      }
      observer.observe(iframe);
    });

    return () => {
      iframes.forEach(iframe => observer.unobserve(iframe));
    };
  }, [content]);

  return null;
}

