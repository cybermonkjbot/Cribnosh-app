"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, BarChart2, X } from "lucide-react";
import { AllergenSettingsModal } from "./allergen-settings-modal";
import { DietFilters } from "./diet-filters";
import { useMediaQuery } from "@/hooks/use-media-query";

export function UserSettings() {
  const [showAllergenSettings, setShowAllergenSettings] = useState(false);
  const [showDietSettings, setShowDietSettings] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div className="mb-6 md:mb-8 px-3 md:px-0">
      <div className="grid grid-cols-2 gap-2 md:gap-4">
        <motion.button
          onClick={() => setShowAllergenSettings(true)}
          className="bg-gradient-to-br from-amber-50 to-amber-100   rounded-lg md:rounded-xl border border-amber-200  p-3 md:p-4 flex flex-col items-center justify-center h-[80px] md:h-[100px] shadow-sm hover:shadow-md transition-shadow active:scale-95"
          whileHover={isDesktop ? { y: -5, transition: { duration: 0.2 } } : {}}
          whileTap={{ scale: 0.97 }}
        >
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-200  flex items-center justify-center mb-1.5 md:mb-2 shadow-inner">
            <AlertCircle size={isDesktop ? 20 : 16} className="text-amber-600 " />
          </div>
          <span className="text-xs md:text-sm font-medium text-amber-800 ">Allergen Settings</span>
        </motion.button>
        
        <motion.button
          onClick={() => setShowDietSettings(true)}
          className="bg-gradient-to-br from-green-50 to-green-100   rounded-lg md:rounded-xl border border-green-200  p-3 md:p-4 flex flex-col items-center justify-center h-[80px] md:h-[100px] shadow-sm hover:shadow-md transition-shadow active:scale-95"
          whileHover={isDesktop ? { y: -5, transition: { duration: 0.2 } } : {}}
          whileTap={{ scale: 0.97 }}
        >
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-200  flex items-center justify-center mb-1.5 md:mb-2 shadow-inner">
            <BarChart2 size={isDesktop ? 20 : 16} className="text-green-600 " />
          </div>
          <span className="text-xs md:text-sm font-medium text-green-800 ">Diet Settings</span>
        </motion.button>
      </div>

      {/* Modals */}
      {showAllergenSettings && (
        <AllergenSettingsModal onClose={() => setShowAllergenSettings(false)} />
      )}

      {showDietSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center z-[9999] px-3 md:px-0">
          <motion.div 
            className="bg-white/90  backdrop-blur-md rounded-t-2xl md:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200/20 p-4 md:p-6"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="flex justify-between items-center mb-4 md:mb-6 sticky top-0 bg-white/50  backdrop-blur-sm py-2 -mt-2 -mx-2 px-2">
              <h2 className="text-xl md:text-2xl font-bold font-Asgard bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">
                Diet Settings
              </h2>
              <button 
                onClick={() => setShowDietSettings(false)}
                className="rounded-full p-1.5 md:p-2 hover:bg-gray-100  transition-colors active:scale-95"
              >
                <X size={isDesktop ? 24 : 20} className="text-gray-500 " />
              </button>
            </div>
            <DietFilters />
          </motion.div>
        </div>
      )}
    </div>
  );
} 