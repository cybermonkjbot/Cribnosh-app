"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { JSX } from "react";

interface CityData {
  title: string;
  description: string;
  src: string;
  placeholder: "blur" | "empty";
  blurDataURL: string;
  ctaText: string;
  ctaLink: string;
  content: () => JSX.Element;
}

const cities: CityData[] = [
  {
    title: "London",
    description: "Capital city & financial hub",
    src: "/images/cities/optimized/london.jpeg",
    placeholder: "blur",
    blurDataURL: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQrJyEkKSM4Mjc1NjM4PTEwPT08Mi83RkdPT1pXWVlgYGBwYHCEhICE/9j/CABEIAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/2gAIAQEAAAAAoD//xAAUAQEAAAAAAAAAAAAAAAAAAAAA/9oACAECEAAAAH//xAAUAQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDEAAAAH//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/AH//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AH//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AH//2Q==",
    ctaText: "Learn More",
    ctaLink: "#",
    content: () => (
      <>
        <p>London is the capital and largest city of England and the United Kingdom. Standing on the River Thames, London has been a major settlement for two millennia.</p>
        <ul className="list-disc pl-4">
          <li>Population: 9+ million</li>
          <li>Key Areas: Westminster, City of London, Canary Wharf</li>
          <li>Major Industries: Finance, Technology, Creative Arts</li>
        </ul>
      </>
    ),
  },
  {
    title: "Manchester",
    description: "Industrial & cultural powerhouse",
    src: "/images/cities/optimized/manchester.jpg",
    placeholder: "blur",
    blurDataURL: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQrJyEkKSM4Mjc1NjM4PTEwPT08Mi83RkdPT1pXWVlgYGBwYHCEhICE/9j/CABEIAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/2gAIAQEAAAAAoD//xAAUAQEAAAAAAAAAAAAAAAAAAAAA/9oACAECEAAAAH//xAAUAQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDEAAAAH//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/AH//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AH//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AH//2Q==",
    ctaText: "Learn More",
    ctaLink: "#",
    content: () => (
      <>
        <p>Manchester is a major city in the northwest of England with a rich industrial heritage. The city is known for its influence on industry and music.</p>
        <ul className="list-disc pl-4">
          <li>Population: 2.8+ million</li>
          <li>Key Areas: Northern Quarter, Spinningfields, MediaCityUK</li>
          <li>Major Industries: Digital Tech, Media, Manufacturing</li>
        </ul>
      </>
    ),
  },
  {
    title: "Birmingham",
    description: "Second largest UK city",
    src: "/images/cities/optimized/birmingham.jpg",
    placeholder: "blur",
    blurDataURL: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQrJyEkKSM4Mjc1NjM4PTEwPT08Mi83RkdPT1pXWVlgYGBwYHCEhICE/9j/CABEIAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/2gAIAQEAAAAAoD//xAAUAQEAAAAAAAAAAAAAAAAAAAAA/9oACAECEAAAAH//xAAUAQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDEAAAAH//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/AH//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AH//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AH//2Q==",
    ctaText: "Learn More",
    ctaLink: "#",
    content: () => (
      <>
        <p>Birmingham is a major city in England&apos;s West Midlands region. It was a powerhouse of the Industrial Revolution and continues to be a major economic center.</p>
        <ul className="list-disc pl-4">
          <li>Population: 2.6+ million</li>
          <li>Key Areas: Jewellery Quarter, Digbeth, Brindleyplace</li>
          <li>Major Industries: Manufacturing, Services, Education</li>
        </ul>
      </>
    ),
  },
];

/**
 * Displays a section highlighting major UK cities where CribNosh is available, including animated city cards and waitlist links.
 *
 * @param isHome - If true, applies home page-specific text styling; otherwise, uses default section styles.
 */
export function CitiesSection({ isHome = false }: { isHome?: boolean } = {}) {
  return (
    <div className="py-24">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className={`text-4xl font-display font-bold mb-4 ${isHome ? 'text-gray-900 ' : 'text-white'}`}>
            Available in Major Cities
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${isHome ? 'text-gray-700 ' : 'text-white'}`}>
            CribNosh is expanding rapidly. Join our waitlist to be notified when we launch in your city.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cities.map((city, index) => (
            <motion.div
              key={city.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent z-10" />

              <Image
                src={city.src}
                alt={`${city.title} - CribNosh location`}
                width={600}
                height={400}
                placeholder={city.placeholder}
                blurDataURL={city.blurDataURL}
                className="w-full h-64 object-cover transform group-hover:scale-105 transition-transform duration-500"
                priority={index === 0}
              />

              <div className="absolute inset-0 z-20 flex flex-col justify-end p-6">
                <h3 className="text-2xl font-display font-bold text-white mb-2">
                  {city.title}
                </h3>
                <p className="text-white/80 text-sm">
                  {city.description}
                </p>
                <Link
                  href="/waitlist"
                  className="mt-4 inline-flex items-center text-white hover:text-[#ff3b30] transition-colors"
                >
                  <span>Join Waitlist</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5 ml-2"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/cities"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#ff3b30] hover:bg-[#ff2920] transition-colors duration-300"
          >
            View All Cities
          </Link>
        </div>
      </div>
    </div>
  );
}