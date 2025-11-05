// Input component extends from shadcnui - https://ui.shadcn.com/docs/components/input
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useMotionTemplate, useMotionValue, motion } from "motion/react";
import { forwardRef, useState, useRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { useMobileDevice } from '@/hooks/use-mobile-device';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helper?: string;
  icon?: ReactNode;
  onClear?: () => void;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, helper, icon, onClear, className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { hasTouchScreen } = useMobileDevice();

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleTouchStart = () => {
      if (hasTouchScreen) {
        inputRef.current?.focus();
      }
    };

    return (
      <div className="relative space-y-1">
        <label 
          htmlFor={props.id} 
          className={`block text-sm font-medium transition-colors duration-200 ${
            error 
              ? 'text-red-600 '
              : isFocused
                ? 'text-blue-600 '
                : 'text-gray-700 '
          }`}
        >
          {label}
        </label>
        
        <div 
          className={`relative group ${className}`}
          onTouchStart={handleTouchStart}
        >
          <motion.div
            animate={{
              scale: isFocused ? 1.02 : 1,
              boxShadow: isFocused 
                ? '0 0 0 2px rgba(59, 130, 246, 0.5)' 
                : '0 0 0 1px rgba(0, 0, 0, 0.1)'
            }}
            className={`absolute inset-0 rounded-lg bg-transparent pointer-events-none ${
              error 
                ? 'ring-2 ring-red-500'
                : 'ring-1 ring-gray-200 '
            }`}
          />
          
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          
          <input
            ref={ref || inputRef}
            {...props}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`
              block w-full rounded-lg 
              ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5
              bg-white 
              text-gray-900 
              placeholder-gray-400 
              border-transparent
              focus:outline-none focus:ring-0
              disabled:bg-gray-50 disabled:text-gray-500
              text-base sm:text-sm
              ${error ? 'border-red-500' : ''}
              ${className}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${props.id}-error` : undefined}
          />

          {onClear && props.value && (
            <button
              type="button"
              onClick={onClear}
              className={`
                absolute inset-y-0 right-0 pr-3 flex items-center
                text-gray-400 hover:text-gray-500 
                transition-colors duration-200
                ${hasTouchScreen ? 'p-2' : ''}
              `}
              aria-label="Clear input"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {(error || helper) && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`text-sm ${
              error 
                ? 'text-red-600 ' 
                : 'text-gray-500 '
            }`}
            id={error ? `${props.id}-error` : undefined}
          >
            {error || helper}
          </motion.p>
        )}
      </div>
    );
  }
);

InputField.displayName = 'InputField';
