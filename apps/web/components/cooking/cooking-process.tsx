"use client";

import { ChefHat, PoundSterling, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

const processSteps = [
  {
    icon: <ChefHat className="w-8 h-8" />,
    title: "Apply",
    description: "Submit your application with details about your cooking style, specialties, and kitchen setup.",
    color: "bg-gradient-to-br from-amber-50/80 via-amber-100 to-amber-200/90",
    iconColor: "text-amber-600",
    shadowColor: "shadow-amber-100/50",
  },
  {
    icon: <ShieldCheck className="w-8 h-8" />,
    title: "Get Certified",
    description: "Our team will visit your kitchen to verify it meets our hygiene and safety standards. We'll help you get certified.",
    color: "bg-gradient-to-br from-green-50/80 via-green-100 to-green-200/90",
    iconColor: "text-green-600",
    shadowColor: "shadow-green-100/50",
  },
  {
    icon: <PoundSterling className="w-8 h-8" />,
    title: "Start Earning",
    description: "Receive orders, cook delicious meals, and earn money sharing your authentic home cooking with your community.",
    color: "bg-gradient-to-br from-purple-50/80 via-purple-100 to-purple-200/90",
    iconColor: "text-purple-600",
    shadowColor: "shadow-purple-100/50",
  },
];

export function CookingProcess() {
  return (
    <section className="py-24 bg-white" id="process" data-section-theme="light">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <motion.h2
            className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            How It Works
          </motion.h2>
          <motion.p
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Join our community of Food Creators in three simple steps. We'll guide you through each stage of the process.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {processSteps.map((step, index) => (
            <motion.div
              key={index}
              className="relative pb-12 md:pb-0"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div
                className={`h-full rounded-2xl overflow-hidden border border-gray-100/50 shadow-md hover:shadow-xl transition-all duration-300 max-w-[85%] md:max-w-[85%] mx-auto backdrop-blur-sm ${step.shadowColor} hover:-translate-y-1`}
              >
                <div className={`p-6 ${step.color} transition-colors duration-300`}>
                  <div
                    className={`w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center mb-4 ${step.iconColor} shadow-inner transform transition-transform duration-300 group-hover:scale-105`}
                  >
                    {step.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 font-display">{step.title}</h3>
                </div>
                <div className="p-6 bg-white/80">
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </div>

              {index < processSteps.length - 1 && (
                <>
                  {/* Mobile down arrow */}
                  <div className="block md:hidden absolute left-1/2 bottom-0 transform -translate-x-1/2 z-10">
                    <svg
                      className="w-8 h-12 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 48"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 2v32M4 26l8 10 8-10"
                        stroke="currentColor"
                      />
                    </svg>
                  </div>
                  {/* Desktop right arrow */}
                  <div className="hidden md:block absolute top-1/2 -right-8 transform -translate-y-1/2 z-10">
                    <svg
                      className="w-16 h-8 text-gray-300"
                      fill="none"
                      viewBox="0 0 48 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2 12h32M26 4l10 8-10 8"
                        stroke="currentColor"
                      />
                    </svg>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 