"use client";

import { MasonryBackground } from "@/components/ui/masonry-background";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function JobPostingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || undefined;
  const job = useQuery(api.queries.careers.getJobBySlug,
    slug ? { slug } : "skip"
  );
  const submitApplication = useMutation(api.mutations.careers.submitJobApplication);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    resumeUrl: "",
    coverLetter: "",
    portfolio: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-section-theme="light">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff3b30]"></div>
      </div>
    );
  }

  if (job === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-section-theme="light">
        <div className="text-center">
          <h1 className="font-asgard text-2xl text-gray-900 mb-4">Job Not Found</h1>
          <p className="font-satoshi text-gray-600 mb-6">This position may have been filled or removed.</p>
          <Link
            href="/careers"
            className="inline-flex items-center px-6 py-3 bg-[#ff3b30] text-white rounded-lg hover:bg-[#ff5e54] transition-all duration-300"
          >
            View All Positions
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await submitApplication({
        jobId: job._id,
        ...formData,
      });
      setSuccess(true);
      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        resumeUrl: "",
        coverLetter: "",
        portfolio: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <MasonryBackground className="z-0" />

      <div className="relative z-10">
        {/* Back Button */}
        <div
          data-section-theme="light"
          className="pt-8 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto">
            <Link
              href="/careers"
              className="inline-flex items-center text-gray-600 hover:text-[#ff3b30] transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Careers
            </Link>
          </div>
        </div>

        {/* Job Details */}
        <section
          data-section-theme="light"
          className="pt-8 pb-16 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="bg-white/70 sm:bg-white backdrop-blur-sm sm:backdrop-blur-none rounded-xl p-6 sm:p-8 shadow-sm">
                  <h1 className="font-asgard text-3xl sm:text-4xl text-gray-900 mb-4">{job.title}</h1>

                  <div className="flex flex-wrap gap-4 mb-8">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-satoshi bg-red-50 text-[#ff3b30]">
                      {job.department}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-satoshi bg-gray-100 text-gray-600">
                      {job.location}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-satoshi bg-gray-100 text-gray-600">
                      {job.type}
                    </span>
                  </div>

                  <div className="prose prose-lg prose-gray max-w-none font-satoshi">
                    <p>{job.description}</p>

                    <h2 className="font-asgard text-2xl text-gray-900 mt-8 mb-4">Responsibilities</h2>
                    <ul className="list-disc pl-6 space-y-2">
                      {job.responsibilities.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>

                    <h2 className="font-asgard text-2xl text-gray-900 mt-8 mb-4">Requirements</h2>
                    <ul className="list-disc pl-6 space-y-2">
                      {job.requirements.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>

                    <h2 className="font-asgard text-2xl text-gray-900 mt-8 mb-4">Benefits</h2>
                    <ul className="list-disc pl-6 space-y-2">
                      {job.benefits.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Application Form */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <div className="bg-white/70 sm:bg-white backdrop-blur-sm sm:backdrop-blur-none rounded-xl p-6 shadow-sm">
                    <h2 className="font-asgard text-2xl text-gray-900 mb-6">Apply Now</h2>

                    {success ? (
                      <div className="text-center py-8">
                        <svg
                          className="w-16 h-16 text-green-500 mx-auto mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <h3 className="font-asgard text-xl text-gray-900 mb-2">Application Submitted!</h3>
                        <p className="font-satoshi text-gray-600 mb-6">
                          We'll review your application and get back to you soon.
                        </p>
                        <button
                          onClick={() => setSuccess(false)}
                          className="text-[#ff3b30] hover:text-[#ff5e54] transition-colors"
                        >
                          Apply for another position
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
                            {error}
                          </div>
                        )}

                        <div>
                          <label className="block font-satoshi text-sm font-medium text-gray-700 mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#ff3b30] focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block font-satoshi text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#ff3b30] focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block font-satoshi text-sm font-medium text-gray-700 mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#ff3b30] focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block font-satoshi text-sm font-medium text-gray-700 mb-1">
                            Resume URL
                          </label>
                          <input
                            type="url"
                            required
                            value={formData.resumeUrl}
                            onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#ff3b30] focus:border-transparent"
                            placeholder="Link to your resume (Google Drive, Dropbox, etc.)"
                          />
                        </div>

                        <div>
                          <label className="block font-satoshi text-sm font-medium text-gray-700 mb-1">
                            Cover Letter (Optional)
                          </label>
                          <textarea
                            value={formData.coverLetter}
                            onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#ff3b30] focus:border-transparent"
                            placeholder="Tell us why you're interested in this role"
                          />
                        </div>

                        <div>
                          <label className="block font-satoshi text-sm font-medium text-gray-700 mb-1">
                            Portfolio URL (Optional)
                          </label>
                          <input
                            type="url"
                            value={formData.portfolio}
                            onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#ff3b30] focus:border-transparent"
                            placeholder="Link to your portfolio or work samples"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className={`w-full px-6 py-3 bg-[#ff3b30] text-white rounded-lg hover:bg-[#ff5e54] transition-all duration-300 font-satoshi relative overflow-hidden ${isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                            }`}
                        >
                          {isSubmitting ? (
                            <span className="flex items-center justify-center">
                              <svg
                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Submitting...
                            </span>
                          ) : (
                            "Submit Application"
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
} 