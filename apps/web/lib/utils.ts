import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function generateMetadata({
  title,
  description,
  path,
  imageUrl,
}: {
  title: string;
  description: string;
  path: string;
  imageUrl?: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cribnosh.co.uk';
  const url = `${baseUrl}${path}`;
  const ogImage = imageUrl || `${baseUrl}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
    },
  };
}

export function generateAiMetadata({
  pageName,
  pageType,
  actions = [],
  entities = [],
  contextualHints = []
}: {
  pageName: string;
  pageType: string;
  actions?: string[];
  entities?: Array<{
    type: string;
    name: string;
    properties?: Record<string, any>;
  }>;
  contextualHints?: string[];
}) {
  return {
    "ai-page-context": {
      "@context": "https://ai.context/v1",
      "@type": pageType,
      "name": pageName,
      "supportedActions": actions,
      "relevantEntities": entities,
      "contextualHints": contextualHints,
      "interactionPatterns": {
        "allowsNavigation": true,
        "requiresAuthentication": pageType === "protected",
        "hasUserInput": actions.length > 0,
        "hasDynamicContent": true
      }
    }
  };
}

/**
 * Converts a country code (ISO 2-letter) to a flag emoji.
 * Example: 'GB' -> '🇬🇧'
 */
export function countryCodeToFlagEmoji(code?: string): string {
  if (!code || code.length !== 2) return '';
  // Regional indicator symbols start at 0x1F1E6 (A)
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 0x1f1e6 + char.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

/**
 * Tries to map a country name to ISO 2-letter code for common cases.
 * Extend as needed.
 */
export function countryNameToCode(name?: string): string | undefined {
  if (!name) return undefined;
  const map: Record<string, string> = {
    'United Kingdom': 'GB',
    'United States': 'US',
    'Nigeria': 'NG',
    'Ghana': 'GH',
    'Canada': 'CA',
    'India': 'IN',
    'France': 'FR',
    'Germany': 'DE',
    'South Africa': 'ZA',
    'Kenya': 'KE',
    // Add more as needed
  };
  return map[name] || undefined;
}
