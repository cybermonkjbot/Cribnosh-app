"use client";

import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";

// List of expansion cities with varied "weights" for visual hierarchy
const cities = [
    { name: "London", weight: 5 },
    { name: "Manchester", weight: 4 },
    { name: "Birmingham", weight: 4 },
    { name: "Glasgow", weight: 3 },
    { name: "Liverpool", weight: 3 },
    { name: "Bristol", weight: 3 },
    { name: "Newcastle", weight: 2 },
    { name: "Leeds", weight: 2 },
    { name: "Sheffield", weight: 2 },
    { name: "Cardiff", weight: 2 },
    { name: "Belfast", weight: 2 },
    { name: "Dublin", weight: 2 },
    { name: "Brighton", weight: 1 },
    { name: "Cambridge", weight: 1 },
    { name: "Oxford", weight: 1 },
    { name: "York", weight: 1 },
];

type CityPosition = {
    x: number;
    y: number;
    width: number;
    height: number;
    city: typeof cities[0];
};

/**
 * Renders a word cloud style visualization of future expansion cities.
 * Uses a collision detection algorithm to prevent overlaps.
 */
function CityWordCloud() {
    const [positions, setPositions] = useState<CityPosition[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        const width = window.innerWidth;
        const height = 600; // Fixed height container
        const centerX = width / 2;
        const centerY = height / 2;
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        const placedItems: CityPosition[] = [];

        // Helper to estimate text size based on weight (font size)
        const estimateSize = (name: string, weight: number): { w: number, h: number } => {
            // Font size mapping approximations (px) including padding
            // 5: 96px (6xl/8xl), 4: 72px (5xl/7xl), 3: 60px (4xl/6xl), 2: 36px (2xl/4xl), 1: 30px
            // Weight 5 is huge, we need generous boxes
            let fontSize = 30;
            if (weight >= 5) fontSize = 100;
            else if (weight === 4) fontSize = 80;
            else if (weight === 3) fontSize = 60;
            else if (weight === 2) fontSize = 40;
            else fontSize = 30;

            // Approximate width: char count * (fontSize * 0.6)
            const w = name.length * (fontSize * 0.6) + 40; // +40 for safety/padding
            const h = fontSize + 40;
            return { w, h };
        };

        // Attempt to place a city
        cities.forEach((city) => {
            const { w, h } = estimateSize(city.name, city.weight);
            let bestX = 0; // Relative to center
            let bestY = 0; // Relative to center
            let placed = false;

            // Spiral search for a free spot
            // Start from center (0,0) and spiral outwards
            for (let angle = 0; angle < Math.PI * 2 * 10; angle += 0.25) {
                // Increase radius slowly
                const radius = angle * 12;

                // Elliptical spiral (wider than tall)
                const x = Math.cos(angle) * radius * 1.5;
                const y = Math.sin(angle) * radius;

                // Check bounds (relative to center)
                if (x < -halfWidth + w / 2 || x > halfWidth - w / 2 || y < -halfHeight + h / 2 || y > halfHeight - h / 2) continue;

                // Check collision with existing
                const collision = placedItems.some(item => {
                    const buffer = 20;
                    return (
                        x < item.x + item.width / 2 + w / 2 + buffer &&
                        x > item.x - item.width / 2 - w / 2 - buffer &&
                        y < item.y + item.height / 2 + h / 2 + buffer &&
                        y > item.y - item.height / 2 - h / 2 - buffer
                    );
                });

                if (!collision) {
                    bestX = x;
                    bestY = y;
                    placed = true;
                    break;
                }
            }

            if (placed) {
                placedItems.push({
                    x: bestX,
                    y: bestY,
                    width: w,
                    height: h,
                    city
                });
            }
        });

        setPositions(placedItems);
    }, []);

    if (!mounted) return null;

    return (
        <div className="relative w-full h-[600px] overflow-hidden bg-gradient-to-b from-white via-neutral-50/50 to-white">
            {/* Central glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vh] h-[60vh] bg-[#ff3b30]/5 rounded-full blur-3xl" />

            {positions.map((pos, i) => {
                const { city, x, y } = pos;
                return (
                    <motion.div
                        key={city.name}
                        initial={{ opacity: 0, scale: 0, x: "-50%", y: "-50%" }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            x: `calc(${x}px - 50%)`,
                            y: `calc(${y}px - 50%)`,
                        }}
                        style={{
                            left: "50%",
                            top: "50%",
                        }}
                        transition={{
                            duration: 0.8,
                            delay: i * 0.05,
                            ease: "easeOut"
                        }}
                        whileHover={{ scale: 1.1, color: "#ff3b30", zIndex: 50 }}
                        className={`absolute cursor-default transition-colors duration-300 font-asgard font-bold whitespace-nowrap select-none flex items-center justify-center
              ${city.weight >= 5 ? "text-6xl md:text-8xl text-neutral-900/80 z-40" :
                                city.weight === 4 ? "text-5xl md:text-7xl text-neutral-800/60 z-30" :
                                    city.weight === 3 ? "text-4xl md:text-6xl text-neutral-700/40 z-20" :
                                        "text-2xl md:text-4xl text-neutral-400/30 z-10"
                            }`}
                    >
                        {city.name}
                    </motion.div>
                );
            })}
        </div>
    );
}

export default function ExpansionsPage() {
    return (
        <main className="min-h-screen bg-white relative overflow-x-hidden">
            {/* Header Section */}
            <div className="container mx-auto px-4 pt-12 pb-8 relative z-10">
                <Link
                    href="/"
                    className="inline-flex items-center text-neutral-500 hover:text-[#ff3b30] transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>

                <div className="text-center">
                    <h1 className="font-asgard text-5xl md:text-7xl font-bold text-neutral-900 mb-6">
                        Where we're going next.
                    </h1>
                    <p className="font-satoshi text-xl text-neutral-500 max-w-2xl mx-auto">
                        Our mission is global, but our roots are local. We are actively planning expansions into these vibrant food cities.
                    </p>
                </div>
            </div>

            {/* Full Width Word Cloud */}
            <CityWordCloud />

            {/* Footer Section */}
            <div className="container mx-auto px-4 pb-12 relative z-10">
                <div className="text-center">
                    <p className="text-neutral-400 font-satoshi">
                        Don't see your city? <Link href="/waitlist" className="underline hover:text-[#ff3b30]">Join the national waitlist</Link> to bring CribNosh to you.
                    </p>
                </div>
            </div>
        </main>
    );
}
