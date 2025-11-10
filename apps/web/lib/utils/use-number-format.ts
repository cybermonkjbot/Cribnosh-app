/**
 * React hook for number formatting utilities
 * Provides easy access to number and currency formatting functions
 */

import { useMemo } from 'react';
import {
  formatNumber,
  formatCurrency,
  formatNumberFull,
  formatCurrencyFull,
  type Currency,
  type FormatNumberOptions,
  type FormatCurrencyOptions,
} from './number-format';

export interface UseNumberFormatReturn {
  /**
   * Format a number with abbreviations
   */
  formatNumber: (num: number | null | undefined, options?: FormatNumberOptions) => string;
  /**
   * Format a currency value with abbreviations
   */
  formatCurrency: (amount: number | null | undefined, options?: FormatCurrencyOptions) => string;
  /**
   * Format a number with full locale formatting (no abbreviation)
   */
  formatNumberFull: (num: number | null | undefined, locale?: string, options?: Intl.NumberFormatOptions) => string;
  /**
   * Format a currency value with full locale formatting (no abbreviation)
   */
  formatCurrencyFull: (amount: number | null | undefined, currency?: Currency, locale?: string, options?: Intl.NumberFormatOptions) => string;
}

/**
 * React hook for number formatting
 * 
 * @param defaultCurrency - Default currency to use (default: 'GBP')
 * @param defaultLocale - Default locale to use (default: 'en-GB')
 * @returns Object with formatting functions
 * 
 * @example
 * const { formatCurrency, formatNumber } = useNumberFormat('GBP');
 * 
 * // In component
 * <div>{formatCurrency(90548)}</div> // "£90.5K"
 * <div>{formatNumber(1500)}</div> // "1.5K"
 */
export function useNumberFormat(
  defaultCurrency: Currency = 'GBP',
  defaultLocale: string = 'en-GB'
): UseNumberFormatReturn {
  return useMemo(
    () => ({
      formatNumber: (num: number | null | undefined, options?: FormatNumberOptions) =>
        formatNumber(num, options),
      formatCurrency: (amount: number | null | undefined, options?: FormatCurrencyOptions) =>
        formatCurrency(amount, { currency: defaultCurrency, ...options }),
      formatNumberFull: (num: number | null | undefined, locale?: string, options?: Intl.NumberFormatOptions) =>
        formatNumberFull(num, locale || defaultLocale, options),
      formatCurrencyFull: (amount: number | null | undefined, currency?: Currency, locale?: string, options?: Intl.NumberFormatOptions) =>
        formatCurrencyFull(amount, currency || defaultCurrency, locale || defaultLocale, options),
    }),
    [defaultCurrency, defaultLocale]
  );
}

