import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type MobileBrandValue = {
  text: string;
  cursorText: string;
  href: string;
  description: string;
};

const mobileBrandValues: MobileBrandValue[] = [
  {
    text: "Vibrant Flavors",
    cursorText: "Experience bold, authentic tastes from around the world",
    href: "/values/vibrant-flavors",
    description: "Experience bold, authentic tastes from around the world."
  },
  {
    text: "Hygienic Standards",
    cursorText: "Every kitchen certified to the highest safety standards",
    href: "/values/hygienic-standards",
    description: "Every kitchen certified to the highest safety standards."
  },
  {
    text: "Cultural Roots",
    cursorText: "Preserving authentic recipes and cooking traditions",
    href: "/values/cultural-roots",
    description: "Preserving authentic recipes and cooking traditions."
  },
  {
    text: "Family Traditions",
    cursorText: "Recipes passed down through generations",
    href: "/values/family-traditions",
    description: "Recipes passed down through generations."
  },
  {
    text: "Healthy Choices",
    cursorText: "Nutritious meals tailored to your dietary needs",
    href: "/values/healthy-choices",
    description: "Nutritious meals tailored to your dietary needs."
  },
  {
    text: "Sustainable Practices",
    cursorText: "Eco-friendly cooking with local ingredients",
    href: "/values/sustainable-practices",
    description: "Eco-friendly cooking with local ingredients."
  }
];

export function MobileBrandAccordion({ className }: { className?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={cn("rounded-2xl bg-white/10 backdrop-blur-md p-2", className)}>
      {mobileBrandValues.map((value, idx) => (
        <div key={value.text} className="mb-2 last:mb-0">
          <button
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-xl text-left font-display font-bold text-white/90 bg-white/10 hover:bg-white/20 transition-colors shadow-sm",
              openIndex === idx && "bg-white/20"
            )}
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            aria-expanded={openIndex === idx}
            aria-controls={`accordion-panel-${idx}`}
          >
            <span>{value.text}</span>
            <svg
              className={cn("w-5 h-5 transition-transform", openIndex === idx ? "rotate-90" : "rotate-0")}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <AnimatePresence initial={false}>
            {openIndex === idx && (
              <motion.div
                id={`accordion-panel-${idx}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden px-4 pb-3"
              >
                <div className="text-white/80 text-base mb-2">{value.description}</div>
                <Link href={value.href} className="inline-block mt-1 text-sm text-[#ff3b30] underline">
                  Learn more
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
