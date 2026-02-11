"use client";

import Link from "next/link";

interface LocationsGridProps {
    currentCity: string;
    allCities: string[];
}

export function LocationsGrid({ currentCity, allCities }: LocationsGridProps) {
    // Simple pseudo-random selection based on city name length or similar to keep it deterministic but varied
    // or just pick the first 12 that aren't the current city.
    // For a real "mesh", we'd want this to be smarter, but for now, just some links.

    // Let's just take a slice for now, or randomize if we want better crawling.
    // Deterministic random to avoid hydration mismatch
    const seed = currentCity.length;
    const shuffled = [...allCities].sort((a, b) => {
        // Simple deterministic sort based on char codes
        return (a.charCodeAt(0) + seed) - (b.charCodeAt(0) + seed);
    });

    const relevantCities = shuffled
        .filter(c => c !== currentCity)
        .slice(0, 24); // Show 24 links

    return (
        <section className="py-16 bg-black text-white border-t border-white/10">
            <div className="container mx-auto px-4">
                <h3 className="text-2xl font-bold mb-8 text-center md:text-left">
                    Serving {allCities.length}+ Locations Across the UK
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {relevantCities.map((city) => (
                        <Link
                            key={city}
                            href={`/locations/${city.toLowerCase().replace(/\s+/g, '-')}`}
                            className="text-gray-400 hover:text-[#ff3b30] transition-colors text-sm"
                        >
                            Food Delivery in {city}
                        </Link>
                    ))}
                </div>
                <div className="mt-8 text-center">
                    <Link href="/all-cities" className="text-[#ff3b30] hover:text-white transition-colors underline">
                        View All Locations
                    </Link>
                </div>
            </div>
        </section>
    );
}
