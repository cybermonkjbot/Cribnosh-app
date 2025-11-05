"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollToTop } from "@/components/ui/scroll-to-top";

interface ImageViewerProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageViewer({ images, initialIndex = 0, isOpen, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(0);
  const [showCloseHint, setShowCloseHint] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case "ArrowLeft":
          navigateImages("prev");
          break;
        case "ArrowRight":
          navigateImages("next");
          break;
        case "Escape":
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, onClose]);

  const navigateImages = (direction: "next" | "prev") => {
    setLoading(true);
    setDirection(direction === "next" ? 1 : -1);
    
    if (direction === "next") {
      setCurrentIndex(prev => (prev + 1) % images.length);
    } else {
      setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl"
          onClick={(e) => {
            // Close when clicking outside the image container
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
          onMouseMove={(e) => {
            // Show close hint when mouse is near edges
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            const nearEdge = clientX < 50 || clientX > innerWidth - 50 || 
                           clientY < 50 || clientY > innerHeight - 50;
            setShowCloseHint(nearEdge);
          }}
        >
          {/* Close Hint */}
          {showCloseHint && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[101] px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm"
            >
              <p className="text-white font-['Satoshi'] text-sm">
                Click anywhere to close
              </p>
            </motion.div>
          )}

          {/* Close Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onClose}
            className="absolute top-4 right-4 z-[101] p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            data-cursor-text="Close viewer"
          >
            <X className="w-6 h-6 text-white" />
          </motion.button>

          {/* Image Counter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 z-[101] px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm"
          >
            <p className="text-white font-['Satoshi']">
              {currentIndex + 1} / {images.length}
            </p>
          </motion.div>

          {/* Navigation Buttons */}
          <div className="absolute inset-y-0 left-4 flex items-center z-[101]">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigateImages("prev")}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              data-cursor-text="Previous image"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </motion.button>
          </div>

          <div className="absolute inset-y-0 right-4 flex items-center z-[101]">
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigateImages("next")}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              data-cursor-text="Next image"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </motion.button>
          </div>

          {/* Main Image */}
          <div className="relative w-full h-full flex items-center justify-center">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="absolute w-full h-full flex items-center justify-center"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = Math.abs(offset.x) * velocity.x;
                  if (swipe < -10000) {
                    navigateImages("next");
                  } else if (swipe > 10000) {
                    navigateImages("prev");
                  }
                }}
              >
                <div className="relative w-full h-full max-w-7xl max-h-[80vh] mx-4">
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                  <Image
                    src={images[currentIndex]}
                    alt={`Image ${currentIndex + 1}`}
                    fill
                    className="object-contain"
                    onLoadingComplete={() => setLoading(false)}
                    priority
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 