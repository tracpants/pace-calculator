import { initAutoAdvance } from "./auto-advance.js";
import { applyTheme, initSettings } from "./settings.js";
import { stateManager } from "./state.js";
import "./style.css";
import { initTouch } from "./touch.js";
import { initUI } from "./ui.js";

/**
 * Main application initialization
 *
 * This module serves as the entry point for the Pace Calculator application.
 * It orchestrates the initialization of all core modules:
 * - UI components and event handlers
 * - Settings and preferences
 * - Auto-advance input functionality
 * - Touch and mobile interactions
 */

async function initApp() {
	console.log('🚀 Initializing Pace Calculator application');

	try {
		// Initialize core UI first (tabs, forms, validation, etc.)
		await initUI();
		console.log('✅ UI initialized');

		// Initialize settings system (modals, theme, preferences)
		initSettings();
		console.log('✅ Settings initialized');

		// Initialize auto-advance for segmented time/pace inputs
		initAutoAdvance();
		console.log('✅ Auto-advance initialized');

		// Initialize touch and mobile interactions
		initTouch();
		console.log('✅ Touch interactions initialized');

		// Apply saved theme
		const theme = stateManager.get('settings.theme');
		applyTheme(theme);
		console.log(`✅ Theme applied: ${theme}`);

		// Listen for system theme changes
		window.matchMedia("(prefers-color-scheme: dark)").addEventListener('change', () => {
			const currentTheme = stateManager.get('settings.theme');
			if (currentTheme === 'system') {
				applyTheme('system');
			}
		});

		// Make app visible now that everything is loaded
		const appElement = document.getElementById('app');
		if (appElement) {
			appElement.classList.add('ready');
			console.log('✅ App ready and visible');
		}

		console.log('🎉 Pace Calculator initialized successfully');
	} catch (error) {
		console.error('❌ Failed to initialize Pace Calculator:', error);
		// Don't throw - let the app continue if possible
	}
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
