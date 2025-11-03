import { Metadata } from "next";

// Export enhanced metadata for SEO
export const metadata: Metadata = {
  title: "CribNosh Cities | Personalized Home-Cooked Meals Across the Midlands",
  description: "Discover CribNosh's expansion across the Midlands. Join thousands on our waitlist for personalized home-cooked meals in Birmingham, Leicester, Nottingham, Coventry, Stoke-on-Trent, Derby, Wolverhampton, and Northampton. Experience food that understands your mood and cravings.",
  keywords: [
    "CribNosh cities",
    "personalized meals Midlands",
    "home-cooked food delivery",
    "Birmingham food delivery",
    "Leicester food delivery", 
    "Nottingham food delivery",
    "Coventry food delivery",
    "Stoke-on-Trent food delivery",
    "Derby food delivery",
    "Wolverhampton food delivery",
    "Northampton food delivery",
    "Midlands food platform",
    "emotional food matching",
    "local Food Creators",
    "authentic cuisine delivery"
  ],
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  openGraph: {
    title: "CribNosh Cities | Personalized Home-Cooked Meals Across the Midlands",
    description: "Join thousands on our waitlist for personalized home-cooked meals across 8 Midlands cities. Experience food that understands your mood and cravings.",
    type: "website",
    url: "https://cribnosh.com/cities",
    siteName: "CribNosh",
    images: [
      {
        url: "https://cribnosh.com/og-cities.jpg",
        width: 1200,
        height: 630,
        alt: "CribNosh Cities - Personalized Home-Cooked Meals Across the Midlands"
      }
    ],
    locale: "en_GB"
  },
  twitter: {
    card: "summary_large_image",
    title: "CribNosh Cities | Personalized Home-Cooked Meals Across the Midlands",
    description: "Join thousands on our waitlist for personalized home-cooked meals across 8 Midlands cities. Experience food that understands your mood and cravings.",
    images: ["https://cribnosh.com/og-cities.jpg"],
    creator: "@cribnosh"
  },
  alternates: {
    canonical: "https://cribnosh.com/cities",
  },
  other: {
    "geo.region": "GB",
    "geo.placename": "Midlands, United Kingdom",
    "geo.position": "52.4862;-1.8904",
    "ICBM": "52.4862, -1.8904"
  }
}; 