import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Doyle Omachonu | The Founder's Story - Cribnosh",
    description: "Discover the journey of Doyle Omachonu, Founder & CEO of Cribnosh. From Chemical Engineering to building a community-driven food marketplace.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'ProfilePage',
                        mainEntity: {
                            '@type': 'Person',
                            name: 'Doyle Omachonu',
                            jobTitle: 'Founder & CEO',
                            description: 'Founder of Cribnosh, simplifying home-cooked food delivery.',
                            image: 'https://cribnosh.com/IMG_3491.jpg',
                            sameAs: [
                                "https://x.com/CribNosh",
                                "https://www.instagram.com/cribnoshuk"
                            ]
                        }
                    })
                }}
            />
            {children}
        </>
    );
}
