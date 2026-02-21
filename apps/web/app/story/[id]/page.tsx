"use client";

import { JsonLd } from "@/components/JsonLd";
import { ImageViewer } from "@/components/ui/image-viewer";
import { ArrowLeft, Forward, Heart } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function StoryPage() {
  const params = useParams();
  const storyId = params.id;

  // This would normally come from an API or database
  const story = {
    id: storyId,
    username: "maria_c",
    userImage: "/card-images/IMG_2262.png",
    mealName: "Abuela's Empanadas",
    mealImage: "/card-images/c846b65e-1de1-4595-9079-b2cfe134f414.jpeg",
    story: "My grandmother's recipe brought to life by Food Creator Luis. Every bite takes me back to Sunday afternoons in her kitchen, watching her carefully fold each empanada with love and precision. The way Luis has captured those exact flavors, from the perfectly seasoned beef to the flaky pastry, is nothing short of magical. It's not just food - it's a bridge to my childhood memories, a taste of home delivered right to my door. What makes it even more special is how Luis added his own subtle twist with a homemade chimichurri that complements the traditional recipe perfectly. This is exactly what CribNosh is about - preserving our culinary heritage while creating new memories.",
    likes: 124,
    date: "March 15, 2026",
    location: "Miami, FL",
    chefName: "Luis Rodriguez",
    chefImage: "/delivery-/IMG_2270.png",
    additionalImages: [
      "/backgrounds/masonry-1.jpg",
      "/backgrounds/masonry-2.jpg",
      "/backgrounds/masonry-3.jpg"
    ]
  };

  const [isLoved, setIsLoved] = useState(false);
  const [likeCount, setLikeCount] = useState(story.likes);
  const [isAnimating, setIsAnimating] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const allImages = [story.mealImage, ...story.additionalImages];

  const handleLove = () => {
    setIsAnimating(true);
    setIsLoved(!isLoved);
    setLikeCount(prev => isLoved ? prev - 1 : prev + 1);

    // Reset animation state after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index);
    setViewerOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50  ">
      <JsonLd />
      {/* Recipe Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Recipe",
            "name": story.mealName,
            "image": story.mealImage,
            "author": {
              "@type": "Person",
              "name": story.chefName
            },
            "datePublished": story.date,
            "description": story.story.slice(0, 160),
            "recipeCuisine": "Authentic",
            "prepTime": "PT30M",
            "cookTime": "PT45M",
            "totalTime": "PT75M",
            "recipeYield": "4 servings",
            "recipeCategory": "Main Course",
            "keywords": `${story.mealName}, ${story.chefName}, home cooked, cultural food`,
            "nutrition": {
              "@type": "NutritionInformation",
              "calories": "450 calories"
            },
            "recipeIngredient": [
              "Love",
              "Authentic spices",
              "Family tradition"
            ],
            "recipeInstructions": [
              {
                "@type": "HowToStep",
                "text": "Prepared with traditional methods passed down through generations."
              }
            ],
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "reviewCount": story.likes
            }
          })
        }}
      />
      {/* Breadcrumb Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://cribnosh.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Community",
                "item": "https://cribnosh.com/community"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": story.mealName,
                "item": `https://cribnosh.com/story/${story.id}`
              }
            ]
          })
        }}
      />
      {/* Hero Section */}
      <div
        data-section-theme="dark"
        className="relative h-screen w-screen cursor-pointer"
        style={{
          marginTop: 'calc(-1 * var(--header-height))',
          marginLeft: 'calc(-50vw + 50%)',
          width: '100vw',
          transform: 'none' // Ensure no transform interferes with cursor
        }}
        onClick={() => openImageViewer(0)}
      >
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={story.mealImage}
            alt={story.mealName}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        <Link
          href="/community"
          className="absolute top-[calc(var(--header-height)+1.5rem)] left-6 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all"
          >
            <ArrowLeft size={20} />
            <span className="font-['Satoshi']">Back to Stories</span>
          </motion.div>
        </Link>

        {/* Story Title */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
          <div className="container mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-white mb-4 font-['Asgard']"
            >
              {story.mealName}
            </motion.h1>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={story.userImage}
                    alt={story.username}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-white font-['Satoshi'] font-medium">@{story.username}</p>
                  <p className="text-white/70 text-sm font-['Satoshi']">{story.location}</p>
                </div>
              </div>
              <div className="h-8 w-[1px] bg-white/20" />
              <p className="text-white/70 font-['Satoshi']">{story.date}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Story Content */}
      <div
        data-section-theme="light"
        className="container mx-auto px-6 py-12"
      >
        <div className="max-w-3xl mx-auto">
          {/* Story Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <p className="text-lg text-gray-700  leading-relaxed font-['Satoshi']">
              {story.story}
            </p>
          </motion.div>

          {/* Chef Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/50  backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50  mb-12"
          >
            <h2 className="text-2xl font-bold mb-4 font-['Asgard']">Made with Love By</h2>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden">
                <Image
                  src={story.chefImage}
                  alt={story.chefName}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="text-xl font-medium font-['Satoshi']">{story.chefName}</h3>
                <p className="text-gray-600  font-['Satoshi']">CribNosh Verified Food Creator</p>
              </div>
            </div>
          </motion.div>

          {/* Additional Images */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {story.additionalImages.map((image, index) => (
              <div
                key={index}
                className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group"
                onClick={() => openImageViewer(index + 1)}
              >
                <Image
                  src={image}
                  alt={`Additional view of ${story.mealName}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </motion.div>

          {/* Like Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex justify-center gap-4"
          >
            <motion.button
              onClick={handleLove}
              className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${isLoved
                ? 'bg-[#ff3b30] text-white'
                : 'bg-gray-100  text-gray-700 '
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-cursor-text="Tap to like"
            >
              <motion.div
                animate={isAnimating ? { scale: [1, 1.5, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                <Heart
                  className={`w-6 h-6 ${isLoved ? 'fill-white' : 'fill-none'}`}
                />
              </motion.div>
              <span className="font-['Satoshi'] font-medium">{likeCount} loves</span>
            </motion.button>

            <motion.button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `${story.mealName} by ${story.chefName}`,
                    text: `Check out this story about ${story.mealName} on CribNosh`,
                    url: window.location.href,
                  }).catch(console.error);
                } else {
                  // Fallback for browsers that don't support Web Share API
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-gray-100  text-gray-700  transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-cursor-text="Share with your foodie friend"
            >
              <Forward className="w-6 h-6" />
              <span className="font-['Satoshi'] font-medium">Share</span>
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Image Viewer */}
      <ImageViewer
        images={allImages}
        initialIndex={selectedImageIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
} 