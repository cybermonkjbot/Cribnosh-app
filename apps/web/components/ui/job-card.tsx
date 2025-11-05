import { motion } from "motion/react";
import Link from "next/link";
import { Doc } from "@/convex/_generated/dataModel";

interface JobCardProps {
  job: Doc<"jobPosting">;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <Link href={`/careers/${job.slug}`} className="group block">
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        className="relative overflow-hidden bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
      >
        {/* Background gradient blob */}
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-gradient-to-br from-[#ff3b30]/10 to-pink-100/20 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-gradient-to-tr from-blue-100/20 to-[#ff3b30]/10 rounded-full blur-3xl" />
        
        {/* Content */}
        <div className="relative">
          {/* Department tag */}
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-satoshi bg-[#ff3b30]/10 text-[#ff3b30] mb-4">
            {job.department}
          </span>

          {/* Title */}
          <h3 className="font-asgard text-2xl text-gray-900 group-hover:text-[#ff3b30] transition-colors mb-3">
            {job.title}
          </h3>

          {/* Description preview */}
          <p className="font-satoshi text-gray-600 mb-4 line-clamp-2">
            {job.description}
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm font-satoshi text-gray-600">
            <span className="inline-flex items-center">
              <svg className="w-4 h-4 mr-1.5 text-[#ff3b30]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {job.location}
            </span>
            <span className="inline-flex items-center">
              <svg className="w-4 h-4 mr-1.5 text-[#ff3b30]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {job.type}
            </span>
          </div>

          {/* Arrow indicator */}
          <div className="absolute top-6 right-0">
            <motion.svg
              className="w-6 h-6 text-gray-400 group-hover:text-[#ff3b30] transition-colors"
              initial={{ x: 0 }}
              animate={undefined}
              whileHover={{ x: 4 }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </motion.svg>
          </div>
        </div>
      </motion.div>
    </Link>
  );
} 