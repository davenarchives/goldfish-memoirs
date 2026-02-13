/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Goldfish Memoirs Brand Colors
                'goldfish': {
                    50: '#FFF5ED',
                    100: '#FFE8D6',
                    200: '#FFCEAD',
                    300: '#FFB085',
                    400: '#FF9B66',
                    500: '#FF8C42', // Primary Goldfish Orange
                    600: '#FF7520',
                    700: '#E65A00',
                    800: '#B34600',
                    900: '#803300',
                },
                'water-blue': {
                    50: '#F0F9FF',
                    100: '#E0F2FE', // Soft Water Blue (Light Mode Background)
                    200: '#BAE6FD',
                    300: '#7DD3FC',
                    400: '#38BDF8',
                    500: '#0EA5E9',
                    600: '#0284C7',
                    700: '#0369A1',
                    800: '#075985',
                    900: '#0C4A6E',
                },
                'ocean-navy': {
                    50: '#F8FAFC',
                    100: '#F1F5F9',
                    200: '#E2E8F0',
                    300: '#CBD5E1',
                    400: '#94A3B8',
                    500: '#64748B',
                    600: '#475569',
                    700: '#334155',
                    800: '#1E293B',
                    900: '#0F172A', // Deep Ocean Navy (Dark Mode Background)
                },
            },
            backdropBlur: {
                xs: '2px',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-goldfish': 'linear-gradient(135deg, #FF8C42 0%, #FFB085 100%)',
                'glassmorphism-light': 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.3) 100%)',
                'glassmorphism-dark': 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(30, 41, 59, 0.3) 100%)',
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                'glass-lg': '0 12px 48px 0 rgba(31, 38, 135, 0.2)',
                'goldfish': '0 4px 20px rgba(255, 140, 66, 0.3)',
                'goldfish-lg': '0 8px 32px rgba(255, 140, 66, 0.4)',
            },
            borderRadius: {
                '4xl': '2rem',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
            },
        },
    },
    plugins: [],
}
