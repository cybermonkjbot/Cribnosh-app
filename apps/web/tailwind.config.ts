import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: false,
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Satoshi', 'Arial', 'sans-serif'],
        display: ['Asgard', 'serif'],
        asgard: ['Asgard', 'serif'],
        satoshi: ['Satoshi', 'sans-serif'],
      },
      animation: {
        'sparkle': 'sparkle 1s linear forwards',
        'float-up': 'floatUp 3s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.7s ease-out forwards',
      },
      keyframes: {
        sparkle: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '0' },
          '50%': { transform: 'scale(1) rotate(180deg)', opacity: '0.5' },
          '100%': { transform: 'scale(0) rotate(360deg)', opacity: '0' },
        },
        floatUp: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-100vh)', opacity: '0' },
        },
        fadeInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
    colors: {
      slate: {
        1: "rgb(var(--slate-1) / <alpha-value>)",
        2: "rgb(var(--slate-2) / <alpha-value>)",
        3: "rgb(var(--slate-3) / <alpha-value>)",
        4: "rgb(var(--slate-4) / <alpha-value>)",
        5: "rgb(var(--slate-5) / <alpha-value>)",
        6: "rgb(var(--slate-6) / <alpha-value>)",
        7: "rgb(var(--slate-7) / <alpha-value>)",
        8: "rgb(var(--slate-8) / <alpha-value>)",
        9: "rgb(var(--slate-9) / <alpha-value>)",
        10: "rgb(var(--slate-10) / <alpha-value>)",
        11: "rgb(var(--slate-11) / <alpha-value>)",
        12: "rgb(var(--slate-12) / <alpha-value>)",
      },
      gray: {
        1: "rgb(var(--gray-1) / <alpha-value>)",
        2: "rgb(var(--gray-2) / <alpha-value>)",
        3: "rgb(var(--gray-3) / <alpha-value>)",
        4: "rgb(var(--gray-4) / <alpha-value>)",
        5: "rgb(var(--gray-5) / <alpha-value>)",
        6: "rgb(var(--gray-6) / <alpha-value>)",
        7: "rgb(var(--gray-7) / <alpha-value>)",
        8: "rgb(var(--gray-8) / <alpha-value>)",
        9: "rgb(var(--gray-9) / <alpha-value>)",
        10: "rgb(var(--gray-10) / <alpha-value>)",
        11: "rgb(var(--gray-11) / <alpha-value>)",
        12: "rgb(var(--gray-12) / <alpha-value>)",
      },
      primary: {
        50: '#fff1f1',
        100: '#ffdfdf',
        200: '#ffc5c5',
        300: '#ff9d9d',
        400: '#ff6464',
        500: '#ff3b30',
        600: '#ed1d12',
        700: '#c7130a',
        800: '#a4130c',
        900: '#881512',
        950: '#4b0604',
      },
      brand: {
        primary: '#094327',      // Dark green - main brand color
        secondary: '#166534',    // Green-800 - Deep green for gradients
        accent: '#15803d',       // Green-700 - Rich accent green
        background: '#FAFFFA',   // Light green tinted background
        link: '#FF3B30',         // CribNosh red for links
      },
    },
    fontSize: {
      "2xs": [
        "11px",
        {
          lineHeight: "1.3",
          letterSpacing: "-0.3px",
          fontWeight: "300",
        },
      ],
      xs: [
        "0.75rem",
        {
          lineHeight: "1rem",
          letterSpacing: "-0.36px",
          fontWeight: "300",
        },
      ],
      sm: ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "-0.42px" }],
      base: ["1rem", { lineHeight: "1.6", letterSpacing: "-0.48px" }],
      lg: ["1.125rem", { lineHeight: "1.75rem", letterSpacing: "-0.72px" }],
      xl: ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.8px" }],
      "2xl": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-1.12px" }],
      "3xl": ["1.75rem", { lineHeight: "2.25rem", letterSpacing: "-1.2px" }],
      "4xl": ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-1.44px" }],
      "5xl": ["3rem", { letterSpacing: "-1.6px" }],
      "6xl": ["3.75rem", { letterSpacing: "-1.8px" }],
      "7xl": ["4.5rem", { letterSpacing: "-2px" }],
      "8xl": ["6rem", { letterSpacing: "-2.4px" }],
      "9xl": ["8rem", { letterSpacing: "-3.2px" }],
    },
    letterSpacing: {
      tighter: "-0.58px",
      tight: "-0.48px",
    },
    typography: {
      DEFAULT: {
        css: {
          p: {
            letterSpacing: "-0.48px",
          },
          code: {
            letterSpacing: "normal",
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
