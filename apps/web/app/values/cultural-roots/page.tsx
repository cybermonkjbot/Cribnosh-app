"use client";

import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import { ArrowRight, Award, Book, ChevronLeft, Globe2, Heart, MapPin, Star, Users } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

export default function CulturalRootsPage() {
  const features = [
    {
      icon: <Globe2 className="w-8 h-8" />,
      title: "Global Heritage",
      description: "Celebrating diverse culinary traditions from communities around the world.",
      color: "from-indigo-400/20 to-blue-400/20",
      examples: ["Italian pasta", "Japanese sushi", "Indian curry", "Mexican mole"]
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Authentic Stories",
      description: "Every dish carries a story of family, tradition, and cultural significance.",
      color: "from-rose-400/20 to-pink-400/20",
      examples: ["Family recipes", "Cultural rituals", "Historical dishes", "Traditional methods"]
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community Connection",
      description: "Building bridges between cultures through shared culinary experiences.",
      color: "from-amber-400/20 to-orange-400/20",
      examples: ["Cultural exchange", "Shared meals", "Community events", "Cross-cultural learning"]
    },
    {
      icon: <Book className="w-8 h-8" />,
      title: "Cultural Education",
      description: "Learning about different cultures through their unique cooking methods and ingredients.",
      color: "from-emerald-400/20 to-teal-400/20",
      examples: ["Culinary techniques", "Ingredient origins", "Cultural significance", "Historical context"]
    }
  ];

  const culturalHighlights = [
    {
      region: "Asia",
      dishes: ["Dim Sum", "Sushi", "Curry", "Pho"],
      color: "from-red-400/20 to-orange-400/20"
    },
    {
      region: "Europe",
      dishes: ["Pasta", "Paella", "Ratatouille", "Schnitzel"],
      color: "from-blue-400/20 to-indigo-400/20"
    },
    {
      region: "Africa",
      dishes: ["Tagine", "Jollof Rice", "Bobotie", "Injera"],
      color: "from-green-400/20 to-emerald-400/20"
    },
    {
      region: "Americas",
      dishes: ["Tacos", "Feijoada", "Poutine", "Empanadas"],
      color: "from-purple-400/20 to-pink-400/20"
    }
  ];

  const testimonials = [
    {
      quote: "Through CribNosh, I've been able to share my grandmother's recipes and keep our cultural heritage alive in my community.",
      author: "Maria Rodriguez",
      role: "Food Creator & Cultural Ambassador",
      avatar: "/images/testimonials/maria-rodriguez.jpg"
    },
    {
      quote: "I love learning about different cultures through food. Every meal is a lesson in history and tradition.",
      author: "Ahmed Hassan",
      role: "Cultural Food Explorer",
      avatar: "/images/testimonials/ahmed-hassan.jpg"
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#6366f1] to-[#818cf8]">
      <ParallaxGroup>
        {/* Background layers */}
        <ParallaxLayer asBackground speed={0.2} className="z-0">
          <div className="fixed inset-0 bg-gradient-to-br from-[#6366f1] to-[#818cf8] opacity-90" />
        </ParallaxLayer>

        <ParallaxLayer asBackground speed={0.4} className="z-0 pointer-events-none">
          <div className="fixed inset-0">
            <div className="absolute w-[500px] h-[500px] rounded-full bg-[#a5b4fc] blur-[120px] -top-20 -right-20 opacity-50" />
            <div className="absolute w-[400px] h-[400px] rounded-full bg-[#6366f1] blur-[100px] bottom-0 -left-20 opacity-40" />
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
                className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-br from-indigo-400/30 to-blue-400/30 rounded-full blur-2xl"
              />

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-8"
              >
                <Award className="w-5 h-5 text-white mr-2" />
                <span className="text-white/90 font-medium">Heritage Preserved</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-6 relative"
              >
                Cultural Roots
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed"
              >
                Discover the rich tapestry of culinary traditions that make each dish a unique cultural expression.
                Every recipe tells a story of heritage, community, and the human connection to food.
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
                    className="inline-flex items-center bg-white text-[#6366f1] px-8 py-4 rounded-full font-bold text-lg hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Explore Cultures
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </motion.button>
                </Link>
              </motion.div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-20">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
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

            {/* Cultural Highlights */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mb-20"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white text-center mb-12">
                Global Culinary Heritage
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {culturalHighlights.map((region, index) => (
                  <motion.div
                    key={region.region}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                      style={{ background: `radial-gradient(circle at 50% 50%, ${region.color}, transparent 70%)` }}
                    />
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 relative hover:border-white/40 transition-all duration-300 text-center">
                      <div className="mb-4">
                        <MapPin className="w-8 h-8 text-white mx-auto mb-2" />
                        <h3 className="text-xl font-display font-bold text-white mb-3">
                          {region.region}
                        </h3>
                      </div>

                      <div className="space-y-2">
                        {region.dishes.map((dish, idx) => (
                          <div
                            key={idx}
                            className="text-white/80 text-sm bg-white/5 px-3 py-2 rounded-lg border border-white/10"
                          >
                            {dish}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Testimonials Section */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="mb-20"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white text-center mb-12">
                Voices of Cultural Preservation
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                {testimonials.map((testimonial, index) => (
                  <motion.div
                    key={testimonial.author}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 + index * 0.1 }}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300"
                  >
                    <div className="flex items-start mb-6">
                      <Star className="w-6 h-6 text-yellow-400 mr-2 mt-1 flex-shrink-0" />
                      <p className="text-xl text-white/90 italic leading-relaxed">
                        &quot;{testimonial.quote}&quot;
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
              transition={{ delay: 1.2 }}
              className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
                Preserve Your Cultural Heritage
              </h2>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Share your family recipes, discover new traditions, and help preserve the world&apos;s culinary heritage.
                Every dish has a story worth telling.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/try-it">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center bg-white text-[#6366f1] px-8 py-4 rounded-full font-bold text-lg hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Start Sharing
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </motion.button>
                </Link>
                <Link href="/waitlist">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center bg-white/20 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/30 transition-all duration-300 border border-white/30"
                  >
                    Join Community
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