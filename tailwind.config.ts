import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lexend', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        lexend: ['Lexend', 'sans-serif'],
      },
      fontSize: {
        // System-wide typography scale adjustment
        // Primary info: 16px (text-sm), Secondary info: 14px (text-xs)
        // Mobile minimum 16px enforced via globals.css
        'xs': ['0.875rem', { lineHeight: '1.25rem' }],   // 14px – secondary / auxiliary info
        'sm': ['1rem', { lineHeight: '1.5rem' }],         // 16px – primary content info
        'base': ['1rem', { lineHeight: '1.5rem' }],       // 16px – base (unchanged)
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],    // 18px – (unchanged)
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],     // 20px – (unchanged)
        '2xl': ['1.5rem', { lineHeight: '2rem' }],        // 24px – (unchanged)
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],   // 30px – (unchanged)
      },
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        tertiary: 'var(--color-tertiary)',
        sage: 'var(--color-sage)',
        orange: 'var(--color-orange)',
        surface: 'var(--color-surface)',
        outline: 'var(--color-outline)',
        'hover-bg': 'var(--color-hover-bg)',
        'content-bg': 'var(--color-content-bg)',
      }
    },
  },
  plugins: [],
}
export default config
