"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { MasonryBackground } from "@/components/ui/masonry-background";
import { ParallaxContent } from "@/components/ui/parallax-section";
import { JobCard } from "@/components/ui/job-card";

const departments = [
  "Engineering",
  "Product",
  "Design",
];

const jobTypes = ["Full-time", "Remote"];

const FilterButton = ({ 
  label, 
  value, 
  selected, 
  onChange 
}: { 
  label: string; 
  value: string; 
  selected: boolean; 
  onChange: (value: string | null) => void;
}) => (
  <button
    onClick={() => onChange(selected ? null : value)}
    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-satoshi transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
      selected 
        ? "bg-[#ff3b30] text-white shadow-md" 
        : "bg-white/70 text-gray-600 hover:bg-white/90"
    }`}
  >
    {label}
  </button>
);

export default function CareersPage() {
  const jobs = useQuery(api.queries.careers.listActiveJobs);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter((job: any) => {
      const matchesDepartment = !selectedDepartment || job.department === selectedDepartment;
      const matchesType = !selectedType || 
        (selectedType === "Full-time" && job.type === "Full-time") ||
        (selectedType === "Remote" && job.location === "Remote");
      return matchesDepartment && matchesType;
    });
  }, [jobs, selectedDepartment, selectedType]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <MasonryBackground className="z-0 opacity-50" />
      
      <div className="relative z-10">
        {/* Hero Section */}
        <section 
          data-section-theme="light"
          className="pt-20 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto">
            <ParallaxContent>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="inline-block mb-6 px-6 py-2 rounded-full bg-[#ff3b30]/10 text-[#ff3b30] font-satoshi"
                >
                  We're Hiring!
                </motion.div>
                <h1 className="font-asgard text-[2.5rem] leading-[1.1] sm:text-6xl md:text-7xl lg:text-8xl text-gray-900 mb-6">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-[#ff3b30] to-gray-900">
                    Join Our Mission
                  </span>
                  <span className="block text-[#ff3b30] text-[2rem] sm:text-5xl mt-2">
                    Build the Future of Food
                  </span>
                </h1>
                <p className="font-satoshi text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  We're on a mission to revolutionize home dining. Join our team and help create
                  meaningful connections through food, technology, and community.
                </p>
              </motion.div>
            </ParallaxContent>
          </div>
        </section>

        {/* Filters Section */}
        <section 
          data-section-theme="light"
          className="py-4 sm:py-6 px-3 sm:px-6 lg:px-8 sticky top-0 bg-white/90 backdrop-blur-lg z-20 border-y border-gray-100 shadow-sm"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide flex-wrap">
              {departments.map(dept => (
                <FilterButton
                  key={dept}
                  label={dept}
                  value={dept}
                  selected={selectedDepartment === dept}
                  onChange={setSelectedDepartment}
                />
              ))}
              {jobTypes.map(type => (
                <FilterButton
                  key={type}
                  label={type}
                  value={type}
                  selected={selectedType === type}
                  onChange={setSelectedType}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Job Listings */}
        <section 
          data-section-theme="light"
          className="py-12 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid gap-6">
              {jobs === undefined ? (
                // Loading state
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
                    >
                      <div className="h-8 bg-gray-200 rounded-full w-32 mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : filteredJobs.length === 0 ? (
                // No results state
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <div className="inline-block p-4 rounded-full bg-[#ff3b30]/10 text-[#ff3b30] mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="font-asgard text-2xl sm:text-3xl text-gray-900 mb-3">No Positions Found</h3>
                  <p className="font-satoshi text-gray-600 max-w-md mx-auto">
                    Try adjusting your filters or check back later for new opportunities.
                  </p>
                </motion.div>
              ) : (
                // Job listings
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="grid gap-6"
                >
                  {filteredJobs.map((job: any) => (
                    <JobCard key={job._id} job={job} />
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-white to-gray-50">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="font-asgard text-4xl sm:text-5xl text-gray-900 mb-4">
                Why Join CribNosh?
              </h2>
              <p className="font-satoshi text-lg text-gray-600 max-w-2xl mx-auto">
                Join a team that's passionate about revolutionizing the way people experience food and community.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Innovation First",
                  description: "Work on cutting-edge technology that's reshaping the future of food and community.",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                },
                {
                  title: "Growth & Learning",
                  description: "Continuous learning opportunities, mentorship, and career development programs.",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  ),
                },
                {
                  title: "Work-Life Balance",
                  description: "Flexible working hours, remote options, and emphasis on personal wellbeing.",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
                {
                  title: "Inclusive Culture",
                  description: "Diverse, equitable, and inclusive environment where everyone belongs.",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ),
                },
                {
                  title: "Competitive Benefits",
                  description: "Comprehensive healthcare, equity packages, and performance bonuses.",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
                {
                  title: "Social Impact",
                  description: "Make a real difference in how people connect and share through food.",
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  ),
                },
              ].map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#ff3b30]/10 text-[#ff3b30] mb-4">
                    {value.icon}
                  </div>
                  <h3 className="font-asgard text-xl text-gray-900 mb-2">{value.title}</h3>
                  <p className="font-satoshi text-gray-600">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
} 