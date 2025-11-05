"use client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useState, useEffect, useCallback, useMemo } from "react";

const CheckIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-4 h-4 sm:w-6 sm:h-6", className)}
    >
      <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
};

const CheckFilled = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("w-4 h-4 sm:w-6 sm:h-6", className)}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

type LoadingState = {
  text: string;
  id?: string;
};

interface LoaderCoreProps {
  loadingStates: LoadingState[];
  value?: number;
}

interface MultiStepLoaderProps {
  loadingStates?: LoadingState[];
  loading?: boolean;
  duration?: number;
  loop?: boolean;
  onComplete?: () => void;
}

const defaultLoadingStates: LoadingState[] = [
  { text: "Waking up the Emotion Engine", id: "emotion" },
  { text: "Finding the Nosh Spot", id: "spot" },
  { text: "Personalizing your cravings", id: "cravings" },
  { text: "Syncing with local chefs", id: "chefs" },
  { text: "Getting your food journey ready...", id: "ready" }
];

const LoaderCore = ({ loadingStates, value = 0 }: LoaderCoreProps) => {
  const [isReturningUser, setIsReturningUser] = useState(false);

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem('cribnosh_visited');
    setIsReturningUser(!!hasVisited);
    
    // Set the flag for future visits
    if (!hasVisited) {
      localStorage.setItem('cribnosh_visited', 'true');
    }
  }, []);

  const animations = useMemo(() => ({
    initial: { opacity: 0, y: -(value * 32) },
    animate: { opacity: 1, y: -(value * 32) },
    transition: { duration: 0.5 }
  }), [value]);

  return (
    <div className="flex relative justify-start max-w-xl mx-auto flex-col mt-10 sm:mt-20 px-4 sm:px-0">
      <div className="flex flex-col gap-3 sm:gap-4">
        {loadingStates.map((loadingState, index) => {
          const distance = Math.abs(index - value);
          const opacity = Math.max(1 - distance * 0.2, 0);

          return (
            <motion.div
              key={loadingState.id || index}
              className={cn("text-left flex items-center gap-2 sm:gap-3")}
              initial={animations.initial}
              animate={{ opacity: opacity, y: -(value * 32) }}
              transition={animations.transition}
            >
              <div>
                {index > value && (
                  <CheckIcon className="text-[#ff3b30] " />
                )}
                {index <= value && (
                  <CheckFilled
                    className={cn(
                      "text-[#ff3b30] ",
                      value === index &&
                        "text-[#ff3b30]  opacity-100"
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-sm sm:text-base text-neutral-800 ",
                  value === index && "text-[#ff3b30]  opacity-100"
                )}
              >
                {loadingState.text}
              </span>
            </motion.div>
          );
        })}
      </div>

      <motion.div 
        className="flex flex-col gap-2 mt-12 sm:mt-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="relative h-12 w-auto sm:h-16">
          <img 
            src="/logo.svg"
            alt="Cribnosh Logo"
            className="h-full w-auto"
          />
        </div>
        <div className="mt-4">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] text-transparent bg-clip-text font-asgard">
            {isReturningUser ? "Welcome Back to CribNosh" : "Welcome to CribNosh"}
          </h2>
          <p className="text-sm sm:text-base text-neutral-600  mt-2 font-satoshi">
            {isReturningUser 
              ? "Continuing your personalized culinary journey" 
              : "Your personalized culinary journey begins here"}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export const MultiStepLoader = ({
  loadingStates = defaultLoadingStates,
  loading = false,
  duration = 1200,
  loop = false,
  onComplete
}: MultiStepLoaderProps) => {
  const [currentState, setCurrentState] = useState(0);
  const [hasShownLoader, setHasShownLoader] = useState(false);
  
  const updateState = useCallback(() => {
    setCurrentState((prevState) => {
      const nextState = loop
        ? prevState === loadingStates.length - 1
          ? 0
          : prevState + 1
        : Math.min(prevState + 1, loadingStates.length - 1);
      
      if (!loop && nextState === loadingStates.length - 1) {
        setTimeout(() => {
          setHasShownLoader(true);
          onComplete?.();
        }, 1000);
      }
      
      return nextState;
    });
  }, [loop, loadingStates.length, onComplete]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (loading && !hasShownLoader) {
      timeoutId = setTimeout(updateState, duration);
    } else {
      setCurrentState(0);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [currentState, loading, updateState, duration, hasShownLoader]);

  // Only show loader on first visit or reload
  if (hasShownLoader) return null;

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          className="w-full h-full fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-xl bg-white/90 "
        >
          <div className="h-[80vh] sm:h-96 relative">
            <LoaderCore value={currentState} loadingStates={loadingStates} />
          </div>

          <div className="bg-gradient-to-t inset-x-0 z-20 bottom-0 bg-white  h-full absolute [mask-image:radial-gradient(900px_at_center,transparent_30%,white)]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
