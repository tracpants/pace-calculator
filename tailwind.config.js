
/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,css}"],
	darkMode: "class", // This enables class-based dark mode
	theme: {
		extend: {
			colors: {
				// Simplified theme with indigo accent
				'indigo': {
					50: '#eef2ff',
					100: '#e0e7ff',
					200: '#c7d2fe',
					300: '#a5b4fc',
					400: '#818cf8',
					500: '#6366f1',
					600: '#4f46e5',
					700: '#4338ca',
					800: '#3730a3',
					900: '#312e81',
					950: '#1e1b4b',
				},
				// Basic semantic tokens for light/dark themes
				'surface': 'var(--color-surface)',
				'surface-secondary': 'var(--color-surface-secondary)',
				'surface-tertiary': 'var(--color-surface-tertiary)',
				'text-primary': 'var(--color-text-primary)',
				'text-secondary': 'var(--color-text-secondary)',
				'text-tertiary': 'var(--color-text-tertiary)',
				'text-inverse': 'var(--color-text-inverse)',
				'border-default': 'var(--color-border-default)',
				'border-strong': 'var(--color-border-strong)',
				'border-subtle': 'var(--color-border-subtle)',
				'interactive-primary': 'var(--color-interactive-primary)',
				'interactive-primary-hover': 'var(--color-interactive-primary-hover)',
				'interactive-secondary': 'var(--color-interactive-secondary)',
				'interactive-secondary-hover': 'var(--color-interactive-secondary-hover)',
			},
		},
	},
	plugins: [],
};
