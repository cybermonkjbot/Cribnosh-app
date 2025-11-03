"use client";

import React, { useId } from "react";
import { motion } from "motion/react";
import Link from "next/link";

export type Card = {
  title: string;
  description: string;
  src: string;
  ctaText: string;
  ctaLink: string;
  content: () => React.ReactNode;
};



export default function ExpandableCardDemo({ cards }: { cards: Card[] }) {
  const id = useId();

  return (
      <ul className="max-w-2xl mx-auto w-full space-y-3">
        {cards.map((card) => (
          <Link
            href={card.ctaLink}
            key={`card-${card.title}-${id}`}
            className="block"
          >
            <motion.div
              layoutId={`card-${card.title}-${id}`}
              className="p-4 flex flex-col sm:flex-row justify-between items-center hover:bg-neutral-50 rounded-xl cursor-pointer transition-colors"
            >
              <div className="flex gap-4 flex-col sm:flex-row items-center sm:items-start w-full sm:w-auto">
                <motion.div layoutId={`image-${card.title}-${id}`} className="flex-shrink-0">
                  <img
                    width={100}
                    height={100}
                    src={card.src}
                    alt={card.title}
                    className="h-20 w-20 sm:h-16 sm:w-16 md:h-14 md:w-14 rounded-lg object-cover object-center"
                  />
                </motion.div>
                <div className="flex-1 text-center sm:text-left">
                  <motion.h3
                    layoutId={`title-${card.title}-${id}`}
                    className="font-['Asgard'] font-medium text-neutral-800 text-lg sm:text-base"
                  >
                    {card.title}
                  </motion.h3>
                  <motion.p
                    layoutId={`description-${card.description}-${id}`}
                    className="font-['Satoshi'] text-neutral-600 text-sm mt-1"
                  >
                    {card.description}
                  </motion.p>
                </div>
              </div>
              <motion.div
                layoutId={`button-${card.title}-${id}`}
                className="px-4 py-2 text-sm rounded-full font-bold bg-gray-100 hover:bg-[#ff3b30] hover:text-white text-black mt-3 sm:mt-0 font-['Satoshi'] transition-colors flex-shrink-0"
              >
                {card.ctaText}
              </motion.div>
            </motion.div>
          </Link>
        ))}
      </ul>
  );
}
