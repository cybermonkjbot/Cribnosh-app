"use client";

import React from "react";
import { motion } from "motion/react";
import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import { Utensils, Globe, Flame, Star, ChevronLeft, ArrowRight, Heart, Sparkles, Users, Award } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function VibrantFlavorsPage() {
  const features = [
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Cuisine",
      description: "Experience authentic flavors from every corner of the world, right in your neighborhood.",
      color: "from-amber-400/20 to-orange-400/20",
      examples: ["Thai curries", "Italian pastas", "Mexican tacos", "Indian biryanis"]
    },
    {
      icon: <Flame className="w-8 h-8" />,
      title: "Bold Tastes",
      description: "From spicy curries to aromatic herbs, discover dishes that excite your palate.",
      color: "from-red-400/20 to-pink-400/20",
      examples: ["Spicy Sichuan", "Aromatic herbs", "Rich umami", "Tangy citrus"]
    },
    {
      icon: <Utensils className="w-8 h-8" />,
      title: "Culinary Innovation",
      description: "Modern twists on traditional recipes, creating unique flavor combinations.",
      color: "from-purple-400/20 to-blue-400/20",
      examples: ["Fusion dishes", "Creative plating", "New techniques", "Unique pairings"]
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Signature Dishes",
      description: "Each chef's personal masterpieces, perfected through generations of cooking.",
      color: "from-emerald-400/20 to-teal-400/20",
      examples: ["Family recipes", "Chef specialties", "Local favorites", "Hidden gems"]
    }
  ];

  const stats = [
    { number: "50+", label: "Global Cuisines" },
    { number: "200+", label: "Unique Flavors" },
    { number: "1000+", label: "Signature Dishes" },
    { number: "24/7", label: "Flavor Discovery" }
  ];

  const testimonials = [
    {
      quote: "CribNosh has transformed how I experience food. Every meal is a journey through different cultures and flavors.",
      author: "Sarah Chen",
      role: "Food Explorer",
      avatar: "/images/testimonials/sarah-chen.jpg"
    },
    {
      quote: "The variety of flavors available is incredible. I've discovered cuisines I never knew existed!",
      author: "Marcus Johnson",
      role: "Culinary Adventurer",
      avatar: "/images/testimonials/marcus-johnson.jpg"
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#ff3b30] to-[#ff5e54]">
      <ParallaxGroup>
        {/* Background layers */}
        <ParallaxLayer asBackground speed={0.2} className="z-0">
          <div className="fixed inset-0 bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] opacity-90" />
        </ParallaxLayer>
        
        <ParallaxLayer asBackground speed={0.4} className="z-0 pointer-events-none">
          <div className="fixed inset-0">
            <div className="absolute w-[500px] h-[500px] rounded-full bg-[#ff7b54] blur-[120px] -top-20 -right-20 opacity-50" />
            <div className="absolute w-[400px] h-[400px] rounded-full bg-[#ff3b30] blur-[100px] bottom-0 -left-20 opacity-40" />
          </div>
        </ParallaxLayer>

        {/* Content layer */}
        <div className="relative z-10 min-h-screen">
          {/* Navigation */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-0 left-0 right-0 bg-white/10 backdrop-blur-lg z-50 mt-[calc(1.5rem+40px)] sm:mt-0"
          >
            <div className="container mx-auto px-6 py-4">
              <Link href="/values" className="inline-flex items-center text-white/80 hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back to Values
              </Link>
            </div>
          </motion.div>

          <div className="container mx-auto px-6 pt-32 sm:pt-24 pb-16">
            {/* Hero Header */}
            <div className="text-center mb-20 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-br from-orange-400/30 to-red-400/30 rounded-full blur-2xl"
              />
              
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-8"
              >
                <Sparkles className="w-5 h-5 text-white mr-2" />
                <span className="text-white/90 font-medium">Flavor First</span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-6 relative"
              >
                Vibrant Flavors
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed"
              >
                Experience bold, authentic tastes from around the world, crafted with passion by our community of Food Creators. 
                Every bite tells a story of culture, tradition, and culinary excellence.
              </motion.p>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8"
              >
                <Link href="/try-it">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center bg-white text-[#ff3b30] px-8 py-4 rounded-full font-bold text-lg hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Explore Flavors
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </motion.button>
                </Link>
              </motion.div>
            </div>

            {/* Stats Section */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl md:text-5xl font-display font-bold text-white mb-2">
                    {stat.number}
                  </div>
                  <div className="text-white/70 text-sm md:text-base">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-20">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                  className="group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                    style={{ background: `radial-gradient(circle at 50% 50%, ${feature.color}, transparent 70%)` }}
                  />
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 relative hover:border-white/40 transition-all duration-300">
                    <div className="bg-gradient-to-br from-white/20 to-white/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6 text-white transform group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-display font-bold text-white mb-4 group-hover:text-white/90 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-white/80 group-hover:text-white/70 transition-colors mb-4 leading-relaxed">
                      {feature.description}
                    </p>
                    
                    {/* Examples */}
                    <div className="flex flex-wrap gap-2">
                      {feature.examples.map((example, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-white/10 px-3 py-1 rounded-full text-white/70 text-sm border border-white/20"
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Testimonials Section */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mb-20"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white text-center mb-12">
                What Food Lovers Say
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                {testimonials.map((testimonial, index) => (
                  <motion.div
                    key={testimonial.author}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300"
                  >
                    <div className="flex items-start mb-6">
                      <Heart className="w-6 h-6 text-red-400 mr-2 mt-1 flex-shrink-0" />
                      <p className="text-xl text-white/90 italic leading-relaxed">
                        "{testimonial.quote}"
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm mr-4" />
                      <div>
                        <p className="text-white font-medium text-lg">{testimonial.author}</p>
                        <p className="text-white/60">{testimonial.role}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
                Ready to Taste the World?
              </h2>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Join thousands of food lovers discovering new flavors every day. Your next favorite dish is just a click away.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/try-it">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center bg-white text-[#ff3b30] px-8 py-4 rounded-full font-bold text-lg hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Start Exploring
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </motion.button>
                </Link>
                <Link href="/waitlist">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center bg-white/20 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/30 transition-all duration-300 border border-white/30"
                  >
                    Join Waitlist
                    <Users className="w-5 h-5 ml-2" />
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </ParallaxGroup>
    </main>
  );
} 