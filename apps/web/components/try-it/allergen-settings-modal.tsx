"use client";

import { Bot, Brain, Check, Info, Shield, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

interface Allergen {
  name: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  icon: string;
}

export const AllergenSettingsModal = ({ onClose }: { onClose: () => void }) => {
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  const processingSteps = [
    { icon: Brain, text: "Analyzing your allergen preferences..." },
    { icon: Sparkles, text: "Updating meal recommendations..." },
    { icon: Check, text: "Notifying your favorite foodCreators..." }
  ];

  const allergens: Allergen[] = [
    {
      name: 'Dairy',
      description: 'Includes milk, cheese, yogurt, and other dairy products',
      severity: 'high',
      icon: '🥛'
    },
    {
      name: 'Eggs',
      description: 'Both egg whites and egg yolks',
      severity: 'high',
      icon: '🥚'
    },
    {
      name: 'Gluten',
      description: 'Found in wheat, barley, rye, and some oats',
      severity: 'medium',
      icon: '🌾'
    },
    {
      name: 'Peanuts',
      description: 'All peanut products and derivatives',
      severity: 'high',
      icon: '🥜'
    },
    {
      name: 'Tree Nuts',
      description: 'Includes almonds, walnuts, cashews, and other tree nuts',
      severity: 'high',
      icon: '🌰'
    },
    {
      name: 'Soy',
      description: 'Soybeans and soy-based products',
      severity: 'medium',
      icon: '🫘'
    },
    {
      name: 'Fish',
      description: 'All types of fish and fish products',
      severity: 'high',
      icon: '🐟'
    },
    {
      name: 'Shellfish',
      description: 'Includes shrimp, crab, lobster, and other shellfish',
      severity: 'high',
      icon: '🦐'
    },
  ];

  const toggleAllergen = (allergenName: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergenName)
        ? prev.filter((item) => item !== allergenName)
        : [...prev, allergenName]
    );
  };

  const handleSave = async () => {
    setIsProcessing(true);

    // Simulate processing steps
    for (let i = 0; i < processingSteps.length; i++) {
      setProcessingStep(i);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Each step takes 1.5s
    }

    // Show success message
    setIsProcessing(false);
    setShowSuccess(true);

    // Close modal after success message
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-orange-500';
      case 'low':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-[99999] pt-24 px-4">
      <div className="bg-white/90  backdrop-blur-md rounded-2xl w-full max-w-2xl max-h-[calc(100vh-8rem)] overflow-y-auto shadow-2xl border border-gray-200/20 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gradient-to-b [&::-webkit-scrollbar-thumb]:from-purple-400/50 [&::-webkit-scrollbar-thumb]:to-blue-500/50   [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:from-purple-500/70 hover:[&::-webkit-scrollbar-thumb]:to-blue-600/70  ">
        <AnimatePresence mode="wait">
          {!isProcessing && !showSuccess ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white/95  backdrop-blur-sm border-b border-gray-200/20 p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold font-Asgard bg-gradient-to-r from-purple-600 via-[#ff3b30] to-blue-500 bg-clip-text text-transparent">
                      Allergen Settings
                    </h2>
                    <p className="text-gray-600  font-Satoshi mt-1">
                      Select your dietary restrictions and allergies
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 hover:bg-purple-100  transition-colors"
                    aria-label="Close modal"
                  >
                    <X size={24} className="text-gray-500 " />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50   rounded-lg p-4 flex items-start gap-3">
                  <Info className="text-[#ff3b30] flex-shrink-0 mt-1" />
                  <p className="text-sm text-gray-700  font-Satoshi">
                    Your allergen settings help us customize your meal recommendations and ensure your safety.
                    Our foodCreators will be notified of your restrictions.
                  </p>
                </div>

                <div className="grid gap-4">
                  {allergens.map((allergen) => (
                    <div
                      key={allergen.name}
                      className={`relative rounded-xl p-4 transition-all duration-200 ${selectedAllergens.includes(allergen.name)
                          ? 'bg-gradient-to-r from-purple-50 to-blue-50   border-purple-200 '
                          : 'bg-gray-50  border-gray-200 '
                        } border hover:shadow-md`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">{allergen.icon}</div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <h3 className="font-Satoshi font-bold">{allergen.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(allergen.severity)} bg-opacity-10`}>
                              {allergen.severity.charAt(0).toUpperCase() + allergen.severity.slice(1)} Risk
                            </span>
                          </div>
                          <p className="text-sm text-gray-600  mt-1">
                            {allergen.description}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <input
                            type="checkbox"
                            id={allergen.name}
                            checked={selectedAllergens.includes(allergen.name)}
                            onChange={() => toggleAllergen(allergen.name)}
                            className="w-5 h-5 rounded border-gray-300 text-[#ff3b30] focus:ring-[#ff3b30] focus:ring-offset-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white/95  backdrop-blur-sm border-t border-gray-200/20 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600 ">
                    <Shield size={16} className="text-[#ff3b30]" />
                    <span>{selectedAllergens.length} allergens selected</span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 font-Satoshi text-gray-700  hover:bg-gray-100  rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 font-Satoshi bg-gradient-to-r from-purple-600 via-[#ff3b30] to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="h-[50vh] flex items-center justify-center p-6"
            >
              <div className="relative max-w-md w-full">
                {/* AI Avatar */}
                <div className="absolute -left-4 -top-4 w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 via-[#ff3b30] to-blue-500 flex items-center justify-center text-white shadow-lg">
                  <Bot size={16} />
                </div>

                {/* Message Bubble */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="bg-gradient-to-r from-purple-600 via-[#ff3b30] to-blue-500 p-[1px] rounded-2xl shadow-xl"
                >
                  <div className="bg-white  rounded-2xl p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      >
                        <Check size={48} className="text-[#ff3b30]" />
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-2"
                      >
                        <h3 className="text-2xl font-bold font-Asgard bg-gradient-to-r from-purple-600 via-[#ff3b30] to-blue-500 bg-clip-text text-transparent">
                          Got it!
                        </h3>
                        <p className="text-gray-600  font-Satoshi">
                          I&apos;ll take {selectedAllergens.length > 0 ?
                            `${selectedAllergens.join(", ")} out of` :
                            "these into account for"} your food experience.
                        </p>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[50vh] flex items-center justify-center"
            >
              <div className="text-center space-y-8">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-[#ff3b30] to-blue-500 rounded-full animate-ping opacity-20" />
                  <div className="relative bg-gradient-to-r from-purple-600 via-[#ff3b30] to-blue-500 p-4 rounded-full text-white">
                    {processingSteps.map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                          opacity: processingStep === index ? 1 : 0,
                          y: processingStep === index ? 0 : 20
                        }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <step.icon size={32} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <div className="space-y-2">
                  {processingSteps.map((step, index) => (
                    <motion.p
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: processingStep === index ? 1 : 0.3
                      }}
                      className={`text-lg font-Satoshi ${processingStep === index
                          ? 'text-gray-900 '
                          : 'text-gray-400 '
                        }`}
                    >
                      {step.text}
                    </motion.p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};