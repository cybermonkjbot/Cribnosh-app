"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Mic, X, Sparkles, Command } from 'lucide-react';

interface FloatingAssistantInputProps {
  onSendMessage: (message: string) => void;
  isVisible: boolean;
  onClose: () => void;
  placeholder?: string;
}

export function FloatingAssistantInput({
  onSendMessage,
  isVisible,
  onClose,
  placeholder = "Ask me to modify the meal or suggest alternatives..."
}: FloatingAssistantInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input when component becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isVisible]);

  // Handle mobile keyboard visibility
  useEffect(() => {
    const handleResize = () => {
      const visualViewport = window.visualViewport;
      if (visualViewport) {
        const isKeyboard = visualViewport.height < window.innerHeight;
        setIsKeyboardVisible(isKeyboard);
        
        // Adjust container position when keyboard is visible
        if (containerRef.current) {
          containerRef.current.style.transform = `translate(-50%, ${isKeyboard ? '-10px' : '0px'})`;
        }
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`; // Cap height at 120px
    }
  }, [inputValue]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + / to focus
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Escape to close
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      // Refocus the input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed left-1/2 transform -translate-x-1/2 z-[100] w-full px-2 sm:px-4 max-w-2xl ${
            isKeyboardVisible ? 'bottom-2' : 'bottom-4 sm:bottom-8'
          }`}
          style={{ pointerEvents: 'auto' }}
        >
          <div className="relative">
            {/* Backdrop blur effect */}
            <div className="absolute inset-0 bg-white/70  backdrop-blur-xl rounded-2xl" />
            
            {/* Main container */}
            <div className="relative bg-gradient-to-b from-white/80 to-slate-50/80   rounded-2xl shadow-lg border border-slate-200/50 ">
              <div className="p-3 sm:p-4">
                {/* Input area */}
                <div 
                  className={`relative transition-all duration-200 ${
                    isFocused ? 'ring-2 ring-[#ff3b30]/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-grow relative">
                      <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={placeholder}
                        rows={1}
                        className="w-full bg-transparent border-none focus:ring-0 resize-none text-slate-700  placeholder-slate-400  pr-10 text-base sm:text-sm"
                        style={{ 
                          minHeight: '24px',
                          maxHeight: '120px',
                          overflowY: 'auto'
                        }}
                      />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 pr-2">
                        {!inputValue && !isKeyboardVisible && (
                          <div className="text-xs text-slate-400  flex items-center gap-1 hidden sm:flex">
                            <Command size={12} />
                            <span>/</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 sm:gap-2">
                      {!inputValue && !isKeyboardVisible && (
                        <button
                          type="button"
                          className="p-2.5 sm:p-2 rounded-lg text-slate-400 hover:text-slate-600   hover:bg-slate-100  transition-colors touch-manipulation"
                          aria-label="Voice input"
                        >
                          <Mic size={22} className="sm:w-5 sm:h-5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!inputValue.trim()}
                        className={`p-2.5 sm:p-2 rounded-lg transition-colors touch-manipulation ${
                          inputValue.trim()
                            ? 'text-[#ff3b30] hover:bg-[#ff3b30]/10'
                            : 'text-slate-400 '
                        }`}
                        aria-label="Send message"
                      >
                        <Send size={22} className="sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom info - hide when keyboard is visible on mobile */}
              {!isKeyboardVisible && (
                <div className="px-3 sm:px-4 pb-2 sm:pb-3 flex items-center justify-between text-xs text-slate-400 ">
                  <div className="flex items-center gap-2">
                    <Sparkles size={12} />
                    <span>AI-powered assistance</span>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 sm:p-1 hover:text-slate-600  transition-colors touch-manipulation"
                    aria-label="Close assistant"
                  >
                    <X size={16} className="sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 