import type { Config } from 'tailwindcss';
import { heroui } from '@heroui/react';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        card: 'hsl(var(--card) / <alpha-value>)',
        'card-foreground': 'hsl(var(--card-foreground) / <alpha-value>)',
        popover: 'hsl(var(--popover) / <alpha-value>)',
        'popover-foreground': 'hsl(var(--popover-foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
        20: '80px',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
      },
      maxWidth: {
        page: '72rem',
      },
    },
  },
  darkMode: 'class',
  plugins: [
    heroui({
      prefix: 'heroui',
      addCommonColors: true,
      defaultTheme: 'light',
      defaultExtendTheme: 'light',
      layout: {
        radius: {
          small: '6px',
          medium: '10px',
          large: '16px',
        },
        borderWidth: {
          small: '1px',
          medium: '1px',
          large: '2px',
        },
        fontSize: {
          tiny: '0.75rem',
          small: '0.875rem',
          medium: '1rem',
          large: '1.125rem',
        },
      },
      themes: {
        light: {
          colors: {
            background: '#FFFFFF',
            foreground: '#002E6B',
            divider: '#e5e7eb',
            focus: '#002E6B',
            content1: '#FFFFFF',
            content2: '#f8fafc',
            content3: '#f1f5f9',
            content4: '#e2e8f0',
            primary: {
              50: '#e6edf7',
              100: '#ccdaf0',
              200: '#99b5e1',
              300: '#6690d2',
              400: '#336bc3',
              500: '#002E6B',
              600: '#002560',
              700: '#001c55',
              800: '#00133a',
              900: '#000a1f',
              DEFAULT: '#002E6B',
              foreground: '#FFFFFF',
            },
            danger: {
              50: '#fde8ea',
              100: '#fbd1d5',
              200: '#f7a3ab',
              300: '#f37581',
              400: '#ef4757',
              500: '#C61C2F',
              600: '#b01929',
              700: '#8c1421',
              800: '#680f19',
              900: '#440a10',
              DEFAULT: '#C61C2F',
              foreground: '#FFFFFF',
            },
            warning: {
              50: '#fff9ee',
              100: '#fff3dc',
              200: '#ffe7b9',
              300: '#ffdb96',
              400: '#ffcf73',
              500: '#FFBD59',
              600: '#e6a94f',
              700: '#cc9645',
              800: '#b3823b',
              900: '#996f31',
              DEFAULT: '#FFBD59',
              foreground: '#002E6B',
            },
            secondary: {
              50: '#eef2ff',
              100: '#dde5ff',
              200: '#bbcbff',
              300: '#99b1ff',
              400: '#7797ff',
              500: '#557dff',
              DEFAULT: '#557dff',
              foreground: '#FFFFFF',
            },
            success: {
              DEFAULT: '#22c55e',
              foreground: '#FFFFFF',
            },
          },
        },
        dark: {
          colors: {
            background: '#0a1628',
            foreground: '#e6edf7',
            divider: '#1e3a5f',
            focus: '#6690d2',
            content1: '#0f2040',
            content2: '#162d57',
            content3: '#1e3a6e',
            content4: '#264785',
            primary: {
              DEFAULT: '#6690d2',
              foreground: '#FFFFFF',
            },
            danger: {
              DEFAULT: '#ef4757',
              foreground: '#FFFFFF',
            },
            warning: {
              DEFAULT: '#FFBD59',
              foreground: '#002E6B',
            },
          },
        },
      },
    }),
  ],
};

export default config;
