"use client";

import { Send } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { toast, Toaster } from 'sonner';
import { ChatBubble } from "../ui/chat-bubble";
import { DraggableCardBody, DraggableCardContainer } from "../ui/dragablecards";
import ExpandableCardDemo from "../ui/expandable-card-standard";
import { ThoughtBubble } from "../ui/thought-bubble";

interface Card {
  title: string;
  description: string;
  src: string;
  ctaText: string;
  ctaLink: string;
  content: () => React.ReactNode;
}

// Deterministic rotation based on ID
const getRotation = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (hash % 6) - 3;
};

interface CommunityPost {
  id: string;
  username: string;
  userImage: string;
  mealName: string;
  mealImage: string;
  story: string;
  likes: number;
}

const ShareThoughtCard = ({ onSubmit, onClose }: { onSubmit: (post: CommunityPost) => void; onClose: () => void }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [story, setStory] = useState("");
  const storyInputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (story.trim()) {
      const newPost: CommunityPost = {
        id: `post${Date.now()}`,
        username: name.toLowerCase().replace(/\s+/g, '_'),
        userImage: "/card-images/IMG_2262.png", // Default user image
        mealName: "Community Story",
        mealImage: "/backgrounds/masonry-1.jpg", // Default meal image
        story: story.trim(),
        likes: 0
      };

      // Show the toast notification
      toast.success('Story submitted!', {
        description: 'Your story will be reviewed and shared with the community soon.',
        duration: 5000,
        className: 'font-["Satoshi"]'
      });

      onSubmit(newPost);
      onClose();
      setStep(0);
      setName("");
      setStory("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: 'name' | 'story') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'name' && name.trim()) {
        setStep(1);
      } else if (type === 'story') {
        handleSubmit();
      }
    }
  };

  // Focus management for story input
  useEffect(() => {
    if (step === 1 && storyInputRef.current) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        storyInputRef.current?.focus();
        // Ensure the input is in view
        storyInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <div className="space-y-6 p-4 relative z-[60]">
      <div className="space-y-6">
        {/* AI Message */}
        <ChatBubble
          message="Hi there! I'd love to hear your CribNosh story. Let's start with your name..."
          className="bg-gradient-to-br from-amber-50 to-orange-50  "
        />

        {/* Name Input */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end gap-4"
          >
            <div className="flex-grow">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'name')}
                placeholder="Type your name..."
                className="w-full px-6 py-4 rounded-2xl bg-white  border-2 border-transparent focus:border-[#ff3b30] focus:outline-none transition-colors font-['Satoshi'] text-lg"
                disabled={step > 0}
                autoFocus
              />
            </div>
            {name && step === 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setStep(1)}
                className="px-6 py-4 bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] text-white rounded-xl font-['Satoshi'] font-medium hover:opacity-90 transition-all hover:scale-105"
              >
                Next →
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* Story Prompt - Only show after name is entered */}
        {step >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <ChatBubble
              message={`Nice to meet you, ${name}! How has CribNosh impacted your culinary journey?`}
              className="bg-gradient-to-br from-amber-50 to-orange-50  "
            />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-end gap-4"
            >
              <div className="flex-grow relative">
                <textarea
                  ref={storyInputRef}
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'story')}
                  placeholder="CribNosh has..."
                  rows={4}
                  className="w-full px-6 py-4 rounded-2xl bg-white  border-2 border-transparent focus:border-[#ff3b30] focus:outline-none transition-colors resize-none font-['Satoshi'] text-lg pr-12"
                />
                {story && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={handleSubmit}
                    className="absolute right-4 bottom-4 p-2 text-[#ff3b30] hover:text-[#ff5e54] transition-colors"
                  >
                    <Send size={20} />
                  </motion.button>
                )}
                <div className="absolute right-4 bottom-4 text-sm text-gray-400  font-['Satoshi']">
                  {!story && "Press Enter to share"}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export function CommunitySpotlightSection() {
  const [active, setActive] = useState<Card | null>(null);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([
    {
      id: "post1",
      username: "maria_c",
      userImage: "/card-images/IMG_2262.png",
      mealName: "Abuela's Empanadas",
      mealImage: "/card-images/c846b65e-1de1-4595-9079-b2cfe134f414.jpeg",
      story: "My grandmother's recipe brought to life by Chef Luis. Tasted just like home!",
      likes: 124,
    },
    {
      id: "post2",
      username: "james_k",
      userImage: "/delivery-/IMG_2270.png",
      mealName: "Authentic Pad Thai",
      mealImage: "/delivery-/118c0d60-0766-4e0a-800d-a47d0927325f.jpeg",
      story: "Never thought I could get restaurant-quality Thai food delivered to my door. Chef Niran is amazing!",
      likes: 98,
    },
    {
      id: "post3",
      username: "aisha_m",
      userImage: "/delivery-/8580cf51-dc5a-4803-b3fa-4124eb93f29c.jpeg",
      mealName: "Moroccan Tagine",
      mealImage: "/IMG_2246.jpeg",
      story: "The flavors transported me back to my childhood in Marrakech. Thank you Chef Amina!",
      likes: 156,
    },
  ]);

  const handleNewPost = (newPost: CommunityPost) => {
    setCommunityPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const shareThoughtCards = [
    {
      title: "Share Your Story",
      description: "Let's chat about your CribNosh experience",
      src: "/backgrounds/masonry-1.jpg",
      ctaText: "Start Sharing",
      ctaLink: "#",
      content: () => <ShareThoughtCard onSubmit={handleNewPost} onClose={() => setActive(null)} />,
    },
  ];

  return (
    <div className="relative py-6 md:py-10 pb-12 md:pb-20 overflow-hidden">
      <div className="container mx-auto px-2 md:px-10 relative z-10">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4 font-['Asgard']">Community Spotlight</h2>
          <p className="text-base md:text-xl text-gray-600  max-w-2xl mx-auto font-['Satoshi']">
            Real stories from our community sharing their favorite CribNosh experiences
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-8 md:mb-12">
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-base md:text-lg text-center md:text-left text-gray-600  max-w-md font-['Satoshi']"
          >
            Our community is at the heart of everything we do. Drag the cards to explore stories from CribNosh users who have discovered new flavors and connected with their cultural roots.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            onClick={() => setActive(shareThoughtCards[0])}
            className="cursor-pointer"
            data-cursor-text="Click to share your story"
          >
            <ThoughtBubble />
          </motion.div>
        </div>

        <ExpandableCardDemo cards={shareThoughtCards} />

        <motion.div
          className="relative flex flex-wrap justify-center gap-3 md:gap-8"
          layout
        >
          {communityPosts.map((post, index) => (
            <motion.div
              key={post.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              style={{
                position: post.id.startsWith('post') ? 'relative' : 'absolute',
                top: post.id.startsWith('post') ? 'auto' : '0',
                zIndex: post.id.startsWith('post') ? 1 : 50,
                transform: post.id.startsWith('post') ? 'none' : `rotate(${getRotation(post.id)}deg)`,
              }}
              className={post.id.startsWith('post') ? '' : 'hover:z-50 transition-all duration-300 hover:-translate-y-2'}
            >
              <DraggableCardContainer>
                <DraggableCardBody
                  className={`w-[calc(100vw-24px)] sm:w-[350px] bg-white/90  backdrop-blur-sm p-0 overflow-hidden ${!post.id.startsWith('post') ? 'shadow-xl' : ''}`}
                  data-cursor-text="Drag to explore this story"
                >
                  <div
                    className="relative h-40 sm:h-48 w-full"
                    data-cursor-text={`📸 ${post.mealName} by @${post.username}`}
                  >
                    <Image
                      src={post.mealImage}
                      alt={post.mealName}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="text-lg sm:text-xl font-bold font-['Asgard']">{post.mealName}</h3>
                    </div>
                  </div>

                  <div className="px-5 pt-5 pb-4 sm:p-5">
                    <div
                      className="flex items-center mb-4"
                      data-cursor-text={`Meet @${post.username}`}
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden relative mr-3">
                        <Image
                          src={post.userImage}
                          alt={post.username}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="font-medium text-sm sm:text-base font-['Satoshi']">@{post.username}</p>
                    </div>

                    <p className="text-sm sm:text-base text-gray-600  mb-5 font-['Satoshi'] leading-relaxed">
                      "{post.story}"
                    </p>

                    <div className="flex justify-between items-center">
                      <div
                        className="flex items-center gap-1.5"
                        data-cursor-text={`${post.likes} community members loved this`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="#ff3b30" viewBox="0 0 24 24" strokeWidth={1.5} stroke="none" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                        <span className="text-sm text-gray-600  font-['Satoshi']">
                          {post.likes}
                        </span>
                      </div>

                      <Link
                        href={`/story/${post.id}`}
                        className="text-sm text-[#ff3b30] hover:text-[#ff5e54] font-medium font-['Satoshi'] flex items-center gap-1"
                        data-cursor-text="View full story"
                      >
                        <span>Read More</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </DraggableCardBody>
              </DraggableCardContainer>
            </motion.div>
          ))}
        </motion.div>
      </div>
      <Toaster
        position="top-center"
        theme="light"
        closeButton
        richColors
        style={{
          fontFamily: 'Satoshi'
        }}
      />
    </div>
  );
} 