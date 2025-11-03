"use client";

import React from "react";
import { motion } from "motion/react";
import { Brain, Sparkles, Zap, ThumbsUp, Award, Smile } from "lucide-react";
import { TextGenerateEffect } from "../generate-text-animation";

interface AiDecisionProcessProps {
  reasoningPoints: string[];
}

export function AiDecisionProcess({ reasoningPoints }: AiDecisionProcessProps) {
  // Different conversational intros for each point to make it more engaging
  const conversationalPrefixes = [
    "I noticed",
    "Good news!",
    "Just so you know,",
    "You'll love that",
    "I'm excited that",
  ];

  // Icons for each point to add visual interest
  const icons = [
    <Zap key="zap" size={18} className="text-amber-500 mr-2 mt-0.5 flex-shrink-0" />,
    <ThumbsUp key="thumbsup" size={18} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />,
    <Sparkles key="sparkles" size={18} className="text-purple-500 mr-2 mt-0.5 flex-shrink-0" />,
    <Award key="award" size={18} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />,
    <Smile key="smile" size={18} className="text-pink-500 mr-2 mt-0.5 flex-shrink-0" />,
  ];

  return (
    <div className="bg-white/70  backdrop-blur-md rounded-2xl overflow-hidden shadow-lg border border-slate-200/50  p-5 md:p-6">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center mr-4 shadow-inner">
          <Brain size={24} className="text-indigo-600 " />
        </div>
        <div>
          <h4 className="text-xl font-display font-bold">Hey there!</h4>
          <p className="text-sm text-slate-500 ">Your personal AI food curator</p>
        </div>
      </div>
      
      <div className="space-y-5">
        <div className="border-l-4 border-indigo-500 pl-4 py-1">
          <TextGenerateEffect
            words="I've found your perfect meal match! Here's my thought process:"
            className="text-slate-800  font-medium"
            duration={0.5}
            filter={false}
          />
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="space-y-4 mt-4"
        >
          {reasoningPoints.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.2 }}
              className="flex items-start bg-gradient-to-r from-slate-50/80 to-white/80   p-3 rounded-lg shadow-sm"
            >
              {icons[index % icons.length]}
              <div>
                <span className="font-display font-semibold text-[#ff3b30] ">
                  {conversationalPrefixes[index % conversationalPrefixes.length]}
                </span>{" "}
                <span className="text-slate-700 ">{point.toLowerCase()}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
          className="mt-4 pt-4 border-t border-slate-200 "
        >
          <p className="font-display font-semibold text-center text-slate-700 ">
            Enjoy your curated dining experience!
          </p>
          
          <div className="flex justify-center mt-3">
            <div className="relative">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2, 
                  ease: "easeInOut" 
                }}
              >
                <span className="text-2xl">👨‍🍳</span>
              </motion.div>
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{ 
                  opacity: [0, 1, 0], 
                  y: [0, -8, -12],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2, 
                  ease: "easeOut" 
                }}
              >
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 