"use client";

import React from "react";
import { motion } from "motion/react";
import { 
  Globe2, 
  Heart, 
  Leaf, 
  Utensils, 
  Home, 
  Shield, 
  ArrowRight,
  Sparkles,
  Award,
  Users,
  Clock,
  Star
} from "lucide-react";
import Link from "next/link";

export default function ValuesPage() {
  const values = [
    {
      title: "Cultural Roots",
      description: "Discover the rich tapestry of culinary traditions that make each dish a unique cultural expression.",
      icon: <Globe2 className="w-8 h-8" />,
      color: "from-indigo-500 to-blue-600",
      href: "/values/cultural-roots",
      features: ["Global Heritage", "Authentic Stories", "Community Connection", "Cultural Education"]
    },
    {
      title: "Healthy Choices",
      description: "Nourishing body and mind with wholesome ingredients and mindful cooking practices.",
      icon: <Leaf className="w-8 h-8" />,
      color: "from-green-500 to-emerald-600",
      href: "/values/healthy-choices",
      features: ["Fresh Ingredients", "Balanced Nutrition", "Portion Control", "Mindful Choices"]
    },
    {
      title: "Vibrant Flavors",
      description: "Experience bold, authentic tastes from around the world, crafted with passion by our community.",
      icon: <Utensils className="w-8 h-8" />,
      color: "from-orange-500 to-red-600",
      href: "/values/vibrant-flavors",
      features: ["Global Cuisine", "Bold Tastes", "Culinary Innovation", "Signature Dishes"]
    },
    {
      title: "Family Traditions",
      description: "Preserving and sharing cherished family recipes that bring people together and create lasting memories.",
      icon: <Home className="w-8 h-8" />,
      color: "from-purple-500 to-violet-600",
      href: "/values/family-traditions",
      features: ["Home Cooking", "Generational Love", "Time-Honored Methods", "Shared Moments"]
    },
    {
      title: "Hygienic Standards",
      description: "Maintaining the highest standards of food safety and cleanliness in every kitchen.",
      icon: <Shield className="w-8 h-8" />,
      color: "from-blue-500 to-cyan-600",
      href: "/values/hygienic-standards",
      features: ["Food Safety", "Clean Kitchens", "Quality Control", "Health Compliance"]
    },
    {
      title: "Sustainable Practices",
      description: "Supporting environmentally conscious cooking and responsible ingredient sourcing.",
      icon: <Heart className="w-8 h-8" />,
      color: "from-teal-500 to-green-600",
      href: "/values/sustainable-practices",
      features: ["Eco-Friendly", "Local Sourcing", "Waste Reduction", "Green Practices"]
    }
  ];

  const stats = [
    { number: "6", label: "Core Values" },
    { number: "50+", label: "Global Cuisines" },
    { number: "1000+", label: "Food Creators" },
    { number: "24/7", label: "Quality Assurance" }
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center bg-black/5 px-6 py-3 rounded-full mb-8"
            >
              <Award className="w-5 h-5 text-black mr-2" />
              <span className="text-black/70 font-medium">Our Foundation</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-black mb-6"
            >
              Our Values
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl md:text-2xl text-black/70 max-w-3xl mx-auto leading-relaxed"
            >
              The principles that guide every meal, every connection, and every moment on CribNosh. 
              We believe great food starts with great values.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-display font-bold text-black mb-2">
                  {stat.number}
                </div>
                <div className="text-black/60 text-sm md:text-base">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="group"
              >
                <Link href={value.href}>
                  <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200 h-full">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-6 text-white transform group-hover:scale-110 transition-transform duration-300`}>
                      {value.icon}
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-2xl font-display font-bold text-black mb-4 group-hover:text-black/80 transition-colors">
                      {value.title}
                    </h3>
                    <p className="text-black/70 mb-6 leading-relaxed">
                      {value.description}
                    </p>
                    
                    {/* Features */}
                    <div className="space-y-2 mb-6">
                      {value.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm text-black/60">
                          <Star className="w-4 h-4 text-black/30 mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    
                    {/* CTA */}
                    <div className="flex items-center text-black/60 group-hover:text-black transition-colors">
                      <span className="font-medium">Learn More</span>
                      <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-black mb-6">
              Ready to Experience Our Values?
            </h2>
            <p className="text-xl text-black/70 mb-8">
              Join thousands of food lovers who share our commitment to quality, culture, and community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/try-it">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center bg-black text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-black/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Start Exploring
                  <ArrowRight className="w-5 h-5 ml-2" />
                </motion.button>
              </Link>
              <Link href="/waitlist">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-50 transition-all duration-300 border-2 border-black"
                >
                  Join Waitlist
                  <Users className="w-5 h-5 ml-2" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
