"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Clock, ArrowRight, Loader2 } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  recentSearches?: string[];
  onClearRecent?: () => void;
}

export function SearchModal({
  isOpen,
  onClose,
  onSearch,
  placeholder = "Search...",
  isLoading = false,
  recentSearches = [],
  onClearRecent
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowSuggestions(e.target.value.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      const firstSuggestion = suggestionsRef.current?.querySelector('[data-suggestion]') as HTMLElement;
      firstSuggestion?.focus();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200/50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#F23E2E]/10 rounded-lg">
                <Search className="w-5 h-5 text-[#F23E2E]" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-asgard text-gray-900">Search</h2>
                <p className="text-sm text-gray-600 font-satoshi">Find anything in the admin panel</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close search"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="relative" ref={suggestionsRef}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowSuggestions(query.length > 0)}
                  placeholder={placeholder}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F23E2E]/50 focus:border-transparent text-lg font-satoshi placeholder-gray-500"
                  aria-label="Search input"
                />
                {isLoading && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-[#F23E2E] animate-spin" />
                  </div>
                )}
              </div>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto"
                  >
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div className="p-3 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                            Recent Searches
                          </span>
                          {onClearRecent && (
                            <button
                              onClick={onClearRecent}
                              className="text-xs text-gray-400 hover:text-gray-600 font-satoshi"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        {recentSearches.slice(0, 3).map((search, index) => (
                          <button
                            key={index}
                            data-suggestion
                            onClick={() => handleSuggestionClick(search)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-left transition-colors"
                          >
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700 font-satoshi">{search}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="p-3">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi mb-2 block">
                        Quick Actions
                      </span>
                      <div className="space-y-1">
                        <button
                          data-suggestion
                          onClick={() => handleSuggestionClick('users')}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-left transition-colors"
                        >
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 font-satoshi">Search users</span>
                        </button>
                        <button
                          data-suggestion
                          onClick={() => handleSuggestionClick('orders')}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-left transition-colors"
                        >
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 font-satoshi">Search orders</span>
                        </button>
                        <button
                          data-suggestion
                          onClick={() => handleSuggestionClick('analytics')}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-left transition-colors"
                        >
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 font-satoshi">View analytics</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!query.trim() || isLoading}
              className="mt-4 w-full py-3 rounded-xl bg-[#F23E2E] text-white font-bold text-lg shadow-lg hover:bg-[#F23E2E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500 font-satoshi">
              <div className="flex items-center gap-4">
                <span>Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd> to search</span>
                <span>Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd> to close</span>
              </div>
              <span>Global search across all admin data</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
