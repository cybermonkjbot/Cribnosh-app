"use client";

import { RotatingHeading } from "@/components/ui/rotating-heading";
import { motion } from "motion/react";
import Link from "next/link";

interface SocialLink {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    color: string;
}

const socialLinks: SocialLink[] = [
    {
        id: "twitter",
        title: "X (Twitter)",
        description: "Follow us for the latest updates, announcements, and community conversations.",
        href: "https://x.com/CribNosh?t=YDYNvB1ZIaVe0IX5NDe9YQ&s=09",
        color: "text-black",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
            </svg>
        ),
    },
    {
        id: "instagram",
        title: "Instagram",
        description: "See our culinary world in pictures. Daily inspiration, food creator highlights, and food porn.",
        href: "https://www.instagram.com/cribnoshuk?igsh=MXM3NWxsOHpsbDB1bA==",
        color: "text-pink-500",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
        ),
    },
    {
        id: "facebook",
        title: "Facebook",
        description: "Join our community group, share your experiences, and connect with other foodies.",
        href: "https://www.facebook.com/share/16yzxEUqpx/",
        color: "text-blue-600",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
        ),
    },
];

const SocialCard = ({ link, index }: { link: SocialLink; index: number }) => {
    return (
        <Link href={link.href} target="_blank" rel="noopener noreferrer" className="block h-full">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative h-full overflow-hidden rounded-3xl bg-white/5 p-8 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm border border-white/10 flex flex-col items-center text-center"
            >
                <div className="relative z-10 flex flex-col items-center h-full">
                    <div className={`mb-6 inline-block rounded-xl bg-white/5 p-4 ${link.color} group-hover:scale-110 transition-transform duration-300`}>
                        {link.icon}
                    </div>
                    <h3 className="mb-4 font-asgard text-xl sm:text-2xl font-bold text-neutral-800 ">{link.title}</h3>
                    <p className="text-neutral-600  mb-6 flex-grow">{link.description}</p>

                    <span className="inline-flex items-center text-sm font-semibold text-[#ff3b30] group-hover:translate-x-1 transition-transform duration-300">
                        Connect with us
                        <svg
                            className="ml-2 h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                        </svg>
                    </span>
                </div>
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#ff3b30]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
        </Link>
    );
};

export default function SocialMediaPage() {
    return (
        <main>
            <section data-section-theme="light" className="min-h-screen relative">
                <div className="absolute mt-20 inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,#ff3b3015_0%,transparent_100%)]" />

                <div className="container mx-auto px-4 py-24">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <h1 className="font-asgard text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
                            <span className="text-neutral-900 ">
                                Connect with us on{" "}
                                <RotatingHeading
                                    items={[
                                        { text: [{ value: "Social Media", highlight: true }] },
                                        { text: [{ value: "Twitter", highlight: true }] },
                                        { text: [{ value: "Instagram", highlight: true }] },
                                        { text: [{ value: "Facebook", highlight: true }] },
                                    ]}
                                    className="inline"
                                    highlightClassName="text-[#ff3b30]"
                                />
                            </span>
                        </h1>
                        <p className="text-xl text-neutral-600  max-w-2xl mx-auto">
                            Join the CribNosh community across the web. Stay updated, get inspired, and share your culinary journey with us.
                        </p>
                    </motion.div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                        {socialLinks.map((link, index) => (
                            <SocialCard key={link.id} link={link} index={index} />
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-24 text-center"
                    >
                        <h2 className="font-asgard text-2xl sm:text-3xl font-bold text-neutral-800 mb-6">
                            Don't forget to check our features
                        </h2>
                        <Link
                            href="/features"
                            className="inline-flex items-center justify-center rounded-full bg-[#ff3b30] px-8 py-3 text-lg font-semibold text-white hover:bg-[#ff5e54] transition-colors duration-300"
                        >
                            View Features
                        </Link>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
