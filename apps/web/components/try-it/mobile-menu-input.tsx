"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Mic, X } from 'lucide-react';
import { SearchSuggestions } from './search-suggestions';
import { useMobileDevice } from '@/hooks/use-mobile-device';

interface MobileMenuInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
}

export function MobileMenuInput({
  onSendMessage,
  placeholder = "What would you love to eat?"
}: MobileMenuInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { hasTouchScreen } = useMobileDevice();

  // Handle mobile keyboard visibility
  useEffect(() => {
    const handleResize = () => {
      const visualViewport = window.visualViewport;
      if (visualViewport) {
        const isKeyboard = visualViewport.height < window.innerHeight;
        setIsKeyboardVisible(isKeyboard);
        
        // Adjust container position when keyboard is visible
        if (containerRef.current && isKeyboard) {
          const bottomOffset = window.innerHeight - visualViewport.height;
          containerRef.current.style.transform = `translateY(-${bottomOffset}px)`;
        } else if (containerRef.current) {
          containerRef.current.style.transform = 'translateY(0)';
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
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 80)}px`; // Cap height at 80px for mobile
    }
  }, [inputValue]);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      setShowSuggestions(false);
      // Refocus the input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    // Focus the input after selecting a suggestion
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent default touch behavior to avoid unwanted scrolling
    e.stopPropagation();
  };

  return (
    <motion.div
      ref={containerRef}
      className={`w-full ${isKeyboardVisible ? 'pb-2' : 'pb-4'}`}
      style={{ transition: 'transform 0.2s ease-out' }}
    >
      <div className="relative">
        {/* Main container */}
        <div className={`bg-white/95  rounded-xl shadow-lg border border-slate-200/50  mx-4 ${
          isFocused ? 'ring-2 ring-[#ff3b30]/50' : ''
        }`}>
          <div className="p-3">
            {/* Input area */}
            <div className="flex items-start gap-2">
              <div className="flex-grow relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  onFocus={handleFocus}
                  onBlur={() => setIsFocused(false)}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  onTouchStart={handleTouchStart}
                  placeholder={placeholder}
                  rows={1}
                  className="w-full bg-transparent border-none focus:ring-0 resize-none text-slate-700  placeholder-slate-400  pr-10 text-base"
                  style={{ 
                    minHeight: '24px',
                    maxHeight: '80px',
                    overflowY: 'auto'
                  }}
                />
              </div>
              
              <div className="flex items-center gap-2">
                {!inputValue && (
                  <button
                    type="button"
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600   hover:bg-slate-100  transition-colors touch-manipulation"
                    aria-label="Voice input"
                  >
                    <Mic size={20} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!inputValue.trim()}
                  className={`p-2 rounded-lg transition-colors touch-manipulation ${
                    inputValue.trim()
                      ? 'text-[#ff3b30] hover:bg-[#ff3b30]/10'
                      : 'text-slate-400 '
                  }`}
                  aria-label="Send message"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom info */}
          {!isKeyboardVisible && (
            <div className="px-3 pb-2 flex items-center gap-2 text-xs text-slate-400 ">
              <span>Try CribNosh Intelligence</span>
            </div>
          )}
        </div>

        {/* Search Suggestions */}
        {showSuggestions && inputValue.trim() && (
          <div className="absolute left-0 right-0 z-10">
            <SearchSuggestions 
              query={inputValue.trim()}
              onSelectSuggestion={handleSelectSuggestion}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
} 