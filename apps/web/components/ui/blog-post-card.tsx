"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface BlogPostCardProps {
  title: string;
  excerpt: string;
  coverImage: string;
  slug: string;
  author: {
    name: string;
    avatar: string;
  };
  date: string;
  isFeatured?: boolean;
  storyId?: string;
}

export function BlogPostCard({
  title,
  excerpt,
  coverImage,
  slug,
  author,
  date,
  isFeatured = false,
  storyId
}: BlogPostCardProps) {
  const href = `/by-us/${slug}`;

  return (
    <Link href={href} className="block group">
      <div
        className={cn(
          "w-full overflow-hidden relative card rounded-xl shadow-xl border border-transparent ",
          "transition-all duration-500 hover:shadow-2xl",
          isFeatured ? "h-[500px]" : "h-96"
        )}
      >
        <div className="absolute inset-0">
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        </div>

        <div className="relative h-full flex flex-col justify-end p-6 text-white">
          {/* Author Info */}
          <div className="flex items-center mb-4 space-x-3">
            <Image
              src={author.avatar}
              alt={author.name}
              width={40}
              height={40}
              className="rounded-full border-2 border-white"
            />
            <div>
              <p className="font-satoshi text-sm">{author.name}</p>
              <p className="font-satoshi text-xs text-neutral-300">{date}</p>
            </div>
          </div>

          {/* Content */}
          <h2 className={cn(
            "font-asgard font-bold mb-2 transition-colors",
            isFeatured ? "text-3xl" : "text-xl"
          )}>
            {title}
          </h2>
          <p className="font-satoshi text-sm text-neutral-200 line-clamp-2">
            {excerpt}
          </p>

          {/* Read More */}
          <div className="mt-4 inline-flex items-center space-x-2 text-sm font-satoshi text-white/80 group-hover:text-white transition-colors">
            <span>Read more</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
} 