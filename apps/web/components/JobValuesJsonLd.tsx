import { JobPosting, WithContext } from "schema-dts";

interface JobValuesJsonLdProps {
    type: 'driver' | 'food-creator';
    datePosted?: string;
}

export function JobValuesJsonLd({ type, datePosted = new Date().toISOString() }: JobValuesJsonLdProps) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cribnosh.com';

    const isFoodCreator = type === 'food-creator';
    const title = isFoodCreator ? "Food Creator" : "Delivery Driver";
    const desc = isFoodCreator
        ? "Join CribNosh as a Food Creator. Cook your authentic family recipes from home, set your own schedule, and earn money sharing your culture. We handle delivery and marketing."
        : "Join CribNosh as a Delivery Driver. Deliver joy and authentic meals across your city. Flexible hours, competitive pay, and a supportive community.";

    const jobSchema: WithContext<JobPosting> = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: title,
        description: desc,
        identifier: {
            "@type": "PropertyValue",
            name: "CribNosh",
            value: isFoodCreator ? "CN-FOODCREATOR-001" : "CN-DRV-001"
        },
        datePosted: datePosted,
        validThrough: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        employmentType: "CONTRACTOR",
        hiringOrganization: {
            "@type": "Organization",
            name: "CribNosh",
            sameAs: "https://cribnosh.com",
            logo: "https://cribnosh.com/logo.svg"
        },
        jobLocation: {
            "@type": "Place",
            address: {
                "@type": "PostalAddress",
                addressRegion: "West Midlands",
                addressCountry: "GB"
            }
        },
        baseSalary: {
            "@type": "MonetaryAmount",
            currency: "GBP",
            value: {
                "@type": "QuantitativeValue",
                unitText: "HOUR",
                // estimated values
                minValue: isFoodCreator ? 15 : 11,
                maxValue: isFoodCreator ? 50 : 18
            }
        },
        jobLocationType: isFoodCreator ? "TELECOMMUTE" : undefined,
        applicantLocationRequirements: {
            "@type": "Country",
            name: "GB"
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jobSchema) }}
        />
    );
}
