import { JobPosting, WithContext } from "schema-dts";

interface JobValuesJsonLdProps {
    type: 'chef' | 'driver' | 'food-creator';
    datePosted?: string;
}

export function JobValuesJsonLd({ type, datePosted = new Date().toISOString() }: JobValuesJsonLdProps) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cribnosh.com';

    const isChef = type === 'chef' || type === 'food-creator';
    const title = isChef ? "Food Creator" : "Delivery Driver";
    const desc = isChef
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
            value: isChef ? "CN-CHEF-001" : "CN-DRV-001"
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
                minValue: isChef ? 15 : 11,
                maxValue: isChef ? 50 : 18
            }
        },
        jobLocationType: isChef ? "TELECOMMUTE" : undefined,
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
