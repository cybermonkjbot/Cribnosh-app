import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";


import { CustomScrollbar } from "../components/ui/custom-scrollbar";
import { ScrollToTop } from "../components/ui/scroll-to-top";
import { LocationProvider } from '../context/location-context';

import { AiMetadata } from "../components/AiMetadata";
import { ConvexClientProvider } from "../components/ConvexClientProvider";
import { JsonLd } from "../components/JsonLd";
import { ClientLayout } from "../components/layout/client-layout";
import RootLayoutClient from "./layout-client";
import AppProviders from './providers';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
};

// Helper to get a valid base URL
function getBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL;
  try {
    if (envUrl && /^https?:\/\//.test(envUrl)) {
      return new URL(envUrl);
    }
  } catch (e) {
    // ignore invalid URL
  }
  return new URL('https://cribnosh.com');
}

export const metadata: Metadata = {
  metadataBase: getBaseUrl(),
  title: "Cribnosh | The app for foodies",
  description: "Personalized meal platform with cultural awareness and family-oriented recipes",
  keywords: [
    "Cribnosh",
    "meal delivery UK",
    "home cooked meals",
    "authentic cultural food",
    "local chefs Midlands",
    "family recipes",
    "healthy eating",
    "sustainable food delivery",
    "food creators",
    "chef marketplace",
    "CribNosh app",
    "dining experiences",
    "Birmingham food delivery",
    "Leicester meal service",
    "Nottingham home cooking",
    "Doyle Omachonu",
    "Doyle Omachonu Cribnosh",
    "Cribnosh CEO",
    "Cribnosh Founder"
  ],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { rel: 'icon', url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }
    ]
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CribNosh',
    startupImage: '/apple-icon.png'
  }
};

// We use Suspense boundaries below to isolate components using usePathname/useSearchParams
// during static generation. This avoids the need for force-dynamic at the root level.

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" className="light" suppressHydrationWarning>
      <head>
        {/* iOS/Safari specific meta tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CribNosh" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Google Search/SEO improvements */}
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="google-site-verification" content="YOUR_GOOGLE_SITE_VERIFICATION_CODE" />

        {/* <Suspense fallback={null}>
          <CanonicalTag />
        </Suspense> */}

        <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml" />

        {/* Open Graph tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Cribnosh | The app for foodies" />
        <meta property="og:description" content="Personalized meal platform with cultural awareness and family-oriented recipes" />
        <meta property="og:url" content={getBaseUrl().toString()} />
        <meta property="og:image" content="/apple-icon.png" />
        <meta property="og:site_name" content="Cribnosh" />

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Cribnosh | The app for foodies" />
        <meta name="twitter:description" content="Personalized meal platform with cultural awareness and family-oriented recipes" />
        <meta name="twitter:image" content="/apple-icon.png" />
        <meta name="twitter:site" content="@cribnosh" />

        {/* Theme colors */}
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        {/* <meta n ame="theme-color" content="#000000" media="(prefers-color-scheme: dark)" /> */}

        {/* iOS icons and splash screens */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        {/* Recommended additional Apple icon sizes for best compatibility */}
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/apple-icon.png" />

        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#ff3b30" />

        {/* Other meta tags */}
        <meta name="msapplication-TileColor" content="#ffffff" />

        {/* PWA manifest */}
        <link rel="manifest" href="/site.webmanifest" />

        <JsonLd />
        {/* Organization and WebSite structured data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Cribnosh',
            url: getBaseUrl().toString(),
            logo: '/apple-icon.png',
            address: {
              '@type': 'PostalAddress',
              addressCountry: 'GB',
              addressRegion: 'United Kingdom'
            },
            founder: {
              '@type': 'Person',
              name: 'Doyle Omachonu',
              jobTitle: 'Founder & CEO',
              image: `${getBaseUrl().toString()}IMG_3491.jpg`,
              url: `${getBaseUrl().toString()}founders-story`
            },
            sameAs: [
              'https://www.facebook.com/share/16yzxEUqpx/',
              'https://www.instagram.com/cribnoshuk?igsh=MXM3NWxsOHpsbDB1bA==',
              'https://x.com/CribNosh?t=YDYNvB1ZIaVe0IX5NDe9YQ&s=09'
            ]
          })
        }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            url: getBaseUrl().toString(),
            name: 'Cribnosh',
            potentialAction: {
              '@type': 'SearchAction',
              target: `${getBaseUrl().toString()}search?q={search_term_string}`,
              'query-input': 'required name=search_term_string'
            }
          })
        }} />
        <AiMetadata />

        {/* Additional SEO enhancements */}
        <meta name="author" content="Cribnosh Team" />
        <meta name="copyright" content="Cribnosh, All rights reserved" />
        <meta name="application-name" content="Cribnosh" />
        <meta name="HandheldFriendly" content="True" />
        <meta name="MobileOptimized" content="320" />
        <meta name="rating" content="General" />
        <meta name="distribution" content="global" />
        <meta name="subject" content="Food, Recipes, Culture, Family Meals" />
        <meta name="category" content="Food & Drink" />
        <meta name="revisit-after" content="7 days" />
        <meta name="format-detection" content="telephone=no, email=no, address=no" />
        {/* Example shortlink, update if you have a real short URL */}
        <link rel="shortlink" href={getBaseUrl().toString()} />
        {/* Example hreflang for English, add more for other languages */}
        <link rel="alternate" href={getBaseUrl().toString()} hrefLang="en-gb" />
        <link rel="alternate" href={getBaseUrl().toString()} hrefLang="en" />
      </head>
      <body>
        <ConvexClientProvider>
          <AppProviders>
            <Suspense fallback={null}>
              <RootLayoutClient>
                <ClientLayout>
                  <LocationProvider>
                    {children}
                    <ScrollToTop />
                    <CustomScrollbar />
                  </LocationProvider>
                </ClientLayout>
              </RootLayoutClient>
            </Suspense>
          </AppProviders>
        </ConvexClientProvider>
      </body>
    </html >
  );
}