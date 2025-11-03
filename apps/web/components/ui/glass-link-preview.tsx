"use client";

import { motion } from "motion/react";
import Image from "next/image";

interface GlassLinkPreviewProps {
  title: string;
  description?: string;
  imageSrc: string;
  imageAlt?: string;
  className?: string;
}

export function GlassLinkPreview({
  title,
  description,
  imageSrc,
  imageAlt = "",
  className = "",
}: GlassLinkPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={`
        relative overflow-hidden rounded-2xl
        bg-white/10 backdrop-blur-md
        border border-white/20
        shadow-xl
        w-[320px] p-4
        ${className}
      `}
    >
      {/* Image Container */}
      <div className="relative h-32 w-full overflow-hidden rounded-xl">
        <Image
          src={imageSrc}
          alt={imageAlt || title}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
          sizes="(max-width: 280px) 100vw, 280px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="mt-4 space-y-2">
        <h3 className="font-asgard text-lg font-semibold text-white/90">
          {title}
        </h3>
        {description && (
          <p className="font-satoshi text-sm text-white/70 line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 via-purple-500/10 to-blue-500/10 blur-xl opacity-50 pointer-events-none" />
    </motion.div>
  );
} 