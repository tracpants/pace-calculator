import { state } from "./state.js";
import { populatePresetSelects, populateAutocomplete, updateCalculatedResult } from "./ui.js";

// Settings preferences with defaults
const defaultSettings = {
	distanceUnit: 'km',
	theme: 'system' // 'light', 'dark', or 'system'
};

// DOM Elements
const settingsModal = document.getElementById("settings-modal");
const settingsBtn = document.getElementById("settings-btn");
const closeSettingsBtn = document.getElementById("close-settings");
const saveSettingsBtn = document.getElementById("save-settings");
const themeRadios = document.querySelectorAll('.theme-radio');
const unitToggles = document.querySelectorAll("[data-unit]");

// Load settings from localStorage
function loadSettings() {
	const savedSettings = localStorage.getItem('pace-calculator-settings');
	return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
}

// Save settings to localStorage
function saveSettings(settings) {
	localStorage.setItem('pace-calculator-settings', JSON.stringify(settings));
}

// Apply theme based on preference
function applyTheme(themePreference) {
	let actualTheme;
	
	if (themePreference === 'system') {
		actualTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? 'dark' : 'light';
	} else {
		actualTheme = themePreference;
	}
	
	if (actualTheme === 'dark') {
		document.documentElement.classList.add("dark");
	} else {
		document.documentElement.classList.remove("dark");
	}
}

// Apply distance unit
function applyDistanceUnit(unit) {
	state.distanceUnit = unit;
	
	// Update unit toggles in modal and trigger UI updates
	unitToggles.forEach(toggle => {
		const isActive = toggle.dataset.unit === unit;
		if (isActive) {
			toggle.classList.add("active");
			toggle.setAttribute('aria-pressed', 'true');
		} else {
			toggle.classList.remove("active");
			toggle.setAttribute('aria-pressed', 'false');
		}
	});
	
	// Trigger UI update for autocomplete and presets
	populatePresetSelects();
	populateAutocomplete();
	updateCalculatedResult();
}

// Open settings modal
function openSettings() {
	const settings = loadSettings();
	
	// Set current theme radio
	themeRadios.forEach(radio => {
		radio.checked = radio.value === settings.theme;
	});
	
	// Set current unit toggles
	applyDistanceUnit(settings.distanceUnit);
	
	// Show modal
	settingsModal.classList.remove('hidden');
	settingsModal.classList.add('flex');
	
	// Focus first interactive element
	const firstRadio = settingsModal.querySelector('input[type="radio"]');
	if (firstRadio) {
		firstRadio.focus();
	}
	
	// Prevent body scroll
	document.body.style.overflow = 'hidden';
}

// Close settings modal
function closeSettings() {
	settingsModal.classList.add('hidden');
	settingsModal.classList.remove('flex');
	
	// Restore body scroll
	document.body.style.overflow = '';
	
	// Return focus to settings button
	settingsBtn.focus();
}

// Save and apply settings
function handleSaveSettings() {
	const selectedTheme = document.querySelector('input[name="theme"]:checked')?.value || 'system';
	const selectedUnit = state.distanceUnit; // Already updated by unit toggles
	
	const settings = {
		theme: selectedTheme,
		distanceUnit: selectedUnit
	};
	
	// Save to localStorage
	saveSettings(settings);
	
	// Apply settings
	applyTheme(selectedTheme);
	applyDistanceUnit(selectedUnit);
	
	// Close modal
	closeSettings();
}

// Handle unit toggle clicks in modal
function handleUnitToggle(e) {
	const clickedUnit = e.target.dataset.unit;
	if (clickedUnit) {
		applyDistanceUnit(clickedUnit);
	}
}

// Handle escape key to close modal
function handleKeyDown(e) {
	if (e.key === 'Escape' && !settingsModal.classList.contains('hidden')) {
		closeSettings();
	}
}

// Handle click outside modal to close
function handleModalBackdropClick(e) {
	if (e.target === settingsModal) {
		closeSettings();
	}
}

// Listen for system theme changes
function handleSystemThemeChange(e) {
	const settings = loadSettings();
	if (settings.theme === 'system') {
		applyTheme('system');
	}
}

// Initialize settings
export function initSettings() {
	const settings = loadSettings();
	
	// Apply initial settings
	applyTheme(settings.theme);
	applyDistanceUnit(settings.distanceUnit);
	
	// Event listeners
	settingsBtn.addEventListener('click', openSettings);
	closeSettingsBtn.addEventListener('click', closeSettings);
	saveSettingsBtn.addEventListener('click', handleSaveSettings);
	
	// Unit toggles in modal
	unitToggles.forEach(toggle => {
		toggle.addEventListener('click', handleUnitToggle);
	});
	
	// Keyboard and modal interactions
	document.addEventListener('keydown', handleKeyDown);
	settingsModal.addEventListener('click', handleModalBackdropClick);
	
	// Listen for system theme changes
	window.matchMedia("(prefers-color-scheme: dark)").addEventListener('change', handleSystemThemeChange);
	
	// Make updateUnitToggles available globally for backward compatibility
	window.updateUnitToggles = () => {
		// This will be called from ui.js to update presets and autocomplete
		populatePresetSelects();
		populateAutocomplete();
		updateCalculatedResult();
	};
}

// Export functions for use in other modules
export { loadSettings, saveSettings, applyTheme, applyDistanceUnit };