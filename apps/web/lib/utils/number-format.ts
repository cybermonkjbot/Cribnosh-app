/**
 * Number formatting utilities for abbreviating large numbers
 * Supports both plain numbers and currency formatting
 */

export type Currency = 'GBP' | 'USD' | 'EUR' | 'NGN' | 'CAD' | 'AUD' | 'JPY' | 'CNY';

export interface FormatNumberOptions {
  /**
   * Minimum value to abbreviate (default: 1000)
   * Numbers below this will be shown in full
   */
  minValue?: number;
  /**
   * Number of decimal places (default: 1)
   */
  decimals?: number;
  /**
   * Whether to show decimal for whole numbers (default: false)
   * e.g., 1.0K vs 1K
   */
  showDecimalsForWhole?: boolean;
  /**
   * Custom suffix for thousands (default: 'K')
   */
  thousandSuffix?: string;
  /**
   * Custom suffix for millions (default: 'M')
   */
  millionSuffix?: string;
  /**
   * Custom suffix for billions (default: 'B')
   */
  billionSuffix?: string;
  /**
   * Custom suffix for trillions (default: 'T')
   */
  trillionSuffix?: string;
}

export interface FormatCurrencyOptions extends FormatNumberOptions {
  /**
   * Currency code (default: 'GBP')
   */
  currency?: Currency;
  /**
   * Whether to include currency symbol (default: true)
   */
  showSymbol?: boolean;
  /**
   * Custom currency symbol (overrides currency default)
   */
  symbol?: string;
  /**
   * Locale for formatting (default: 'en-GB' for GBP, 'en-US' for USD, etc.)
   */
  locale?: string;
}

/**
 * Currency symbol mapping
 */
const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
  NGN: '₦',
  CAD: '$',
  AUD: '$',
  JPY: '¥',
  CNY: '¥',
};

/**
 * Default locale mapping for currencies
 */
const CURRENCY_LOCALES: Record<Currency, string> = {
  GBP: 'en-GB',
  USD: 'en-US',
  EUR: 'en-EU',
  NGN: 'en-NG',
  CAD: 'en-CA',
  AUD: 'en-AU',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
};

/**
 * Formats a number with abbreviations (K, M, B, T)
 * 
 * @param num - The number to format
 * @param options - Formatting options
 * @returns Formatted string (e.g., "1.2K", "3.5M", "2.1B")
 * 
 * @example
 * formatNumber(1500) // "1.5K"
 * formatNumber(2500000) // "2.5M"
 * formatNumber(1500000000) // "1.5B"
 */
export function formatNumber(
  num: number | null | undefined,
  options: FormatNumberOptions = {}
): string {
  if (num === null || num === undefined || isNaN(num)) {
    return '...';
  }

  const {
    minValue = 1000,
    decimals = 1,
    showDecimalsForWhole = false,
    thousandSuffix = 'K',
    millionSuffix = 'M',
    billionSuffix = 'B',
    trillionSuffix = 'T',
  } = options;

  // Return full number if below minimum
  if (Math.abs(num) < minValue) {
    return num.toString();
  }

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  let value: number;
  let suffix: string;

  if (absNum >= 1_000_000_000_000) {
    // Trillions
    value = absNum / 1_000_000_000_000;
    suffix = trillionSuffix;
  } else if (absNum >= 1_000_000_000) {
    // Billions
    value = absNum / 1_000_000_000;
    suffix = billionSuffix;
  } else if (absNum >= 1_000_000) {
    // Millions
    value = absNum / 1_000_000;
    suffix = millionSuffix;
  } else {
    // Thousands
    value = absNum / 1_000;
    suffix = thousandSuffix;
  }

  // Format with appropriate decimals
  const formatted = value.toFixed(decimals);
  
  // Remove trailing zeros and decimal point if not needed
  const finalValue = showDecimalsForWhole 
    ? formatted 
    : parseFloat(formatted).toString();

  return `${sign}${finalValue}${suffix}`;
}

/**
 * Formats a currency value with abbreviations
 * 
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted string (e.g., "£1.2K", "$3.5M", "€2.1B")
 * 
 * @example
 * formatCurrency(1500, { currency: 'GBP' }) // "£1.5K"
 * formatCurrency(2500000, { currency: 'USD' }) // "$2.5M"
 * formatCurrency(90548, { currency: 'GBP' }) // "£90.5K"
 */
export function formatCurrency(
  amount: number | null | undefined,
  options: FormatCurrencyOptions = {}
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '...';
  }

  const {
    currency = 'GBP',
    showSymbol = true,
    symbol,
    locale,
    minValue = 1000,
    decimals = 1,
    showDecimalsForWhole = false,
  } = options;

  // Use custom symbol or currency symbol
  const currencySymbol = symbol || (showSymbol ? CURRENCY_SYMBOLS[currency] : '');
  const currencyLocale = locale || CURRENCY_LOCALES[currency];

  // For amounts below minimum, use standard currency formatting
  if (Math.abs(amount) < minValue) {
    if (showSymbol && currencySymbol) {
      return `${currencySymbol}${Math.abs(amount).toLocaleString(currencyLocale)}`;
    }
    return amount.toLocaleString(currencyLocale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  // For larger amounts, use abbreviation
  const abbreviated = formatNumber(amount, {
    minValue,
    decimals,
    showDecimalsForWhole,
  });

  // Add currency symbol prefix
  if (showSymbol && currencySymbol) {
    return `${currencySymbol}${abbreviated}`;
  }

  return abbreviated;
}

/**
 * Formats a number with full locale formatting (no abbreviation)
 * Useful for displaying exact values when needed
 * 
 * @param num - The number to format
 * @param locale - Locale string (default: 'en-GB')
 * @param options - Intl.NumberFormat options
 * @returns Formatted string with locale-specific formatting
 * 
 * @example
 * formatNumberFull(90548) // "90,548"
 * formatNumberFull(90548, 'en-US') // "90,548"
 */
export function formatNumberFull(
  num: number | null | undefined,
  locale: string = 'en-GB',
  options: Intl.NumberFormatOptions = {}
): string {
  if (num === null || num === undefined || isNaN(num)) {
    return '...';
  }

  return num.toLocaleString(locale, options);
}

/**
 * Formats a currency value with full locale formatting (no abbreviation)
 * 
 * @param amount - The amount to format
 * @param currency - Currency code (default: 'GBP')
 * @param locale - Locale string (default: based on currency)
 * @param options - Intl.NumberFormat options
 * @returns Formatted string with currency symbol and locale formatting
 * 
 * @example
 * formatCurrencyFull(90548, 'GBP') // "£90,548"
 * formatCurrencyFull(90548, 'USD') // "$90,548"
 */
export function formatCurrencyFull(
  amount: number | null | undefined,
  currency: Currency = 'GBP',
  locale?: string,
  options: Intl.NumberFormatOptions = {}
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '...';
  }

  const currencyLocale = locale || CURRENCY_LOCALES[currency];

  return amount.toLocaleString(currencyLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  });
}

/**
 * Determines whether a number should be abbreviated based on its value
 * 
 * @param num - The number to check
 * @param threshold - Minimum value to abbreviate (default: 1000)
 * @returns True if number should be abbreviated
 */
export function shouldAbbreviate(num: number, threshold: number = 1000): boolean {
  return Math.abs(num) >= threshold;
}

