import { Organization, WebSite, WithContext, SearchAction as SchemaSearchAction } from "schema-dts";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cribnosh.com';

export function JsonLd() {
  const organizationSchema: WithContext<Organization> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CribNosh",
    url: baseUrl,
    logo: `${baseUrl}/logo.svg`,
    sameAs: [
      "https://x.com/CribNosh?t=YDYNvB1ZIaVe0IX5NDe9YQ&s=09",
      "https://www.facebook.com/share/16yzxEUqpx/",
      "https://www.instagram.com/cribnoshuk?igsh=MXM3NWxsOHpsbDB1bA==",
    ],
    description: "CribNosh connects families with local chefs to experience authentic cultural cuisine and traditional recipes.",
  };

  interface CustomSearchAction extends SchemaSearchAction {
    'query-input': string;
  }

  const websiteSchema: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CribNosh",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    } as CustomSearchAction
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
} 