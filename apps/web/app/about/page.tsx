import { Metadata } from "next";
import AboutClient from "./client-page";

export const metadata: Metadata = {
    title: "About Us",
    description: "Learn about Cribnosh's mission to connect food lovers with authentic, home-cooked meals and local food creators in the UK.",
    keywords: "about Cribnosh, cultural food delivery, home cooked meals UK, food community"
};

export default function AboutPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": [
                            {
                                "@type": "Question",
                                "name": "What is Cribnosh?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "Cribnosh is a platform that connects food lovers with local food creators offering authentic, home-cooked cultural meals."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "How does Cribnosh support local cooks?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "We provide a marketplace for food creators to share their culinary heritage, manage orders, and reach a wider audience of food enthusiasts."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "Is Cribnosh available in my city?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "We are currently expanding across the UK, with a strong presence in Birmingham, London, and the Midlands. Check our locations page for full details."
                                }
                            }
                        ]
                    })
                }}
            />
            <AboutClient />
        </>
    );
}
