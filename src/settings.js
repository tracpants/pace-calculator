import { state } from "./state.js";
import { populatePresetSelects, populateAutocomplete, updateCalculatedResult } from "./ui.js";
import * as pr from "./pr.js";
import * as calc from "./calculator.js";

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

// PR-related DOM elements
const prModal = document.getElementById("pr-modal");
const prModalTitle = document.getElementById("pr-modal-title");
const addPrBtn = document.getElementById("add-pr-btn");
const closePrModalBtn = document.getElementById("close-pr-modal");
const cancelPrBtn = document.getElementById("cancel-pr");
const prForm = document.getElementById("pr-form");
const prList = document.getElementById("pr-list");
const prDistanceInput = document.getElementById("pr-distance");
const prUnitSelect = document.getElementById("pr-unit");
const prTimeInput = document.getElementById("pr-time");

// PR modal state
let editingPR = null;

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
	
	// Populate PR list
	populatePRList();
	
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

// PR Management Functions
function populatePRList() {
	const prs = pr.getAllPRs();
	
	if (prs.length === 0) {
		prList.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-sm text-center py-2">No personal records yet</p>';
		return;
	}
	
	prList.innerHTML = prs.map(prRecord => `
		<div class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
			<div>
				<span class="font-medium text-gray-900 dark:text-white">
					${prRecord.displayName || `${prRecord.distance} ${prRecord.unit}`}
				</span>
				<span class="text-gray-600 dark:text-gray-300 ml-2">${prRecord.timeFormatted}</span>
			</div>
			<div class="flex gap-1">
				<button class="edit-pr-btn text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 p-1" 
						data-distance="${prRecord.distance}" 
						data-unit="${prRecord.unit}" 
						data-time="${prRecord.timeSeconds}"
						title="Edit PR">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
					</svg>
				</button>
				<button class="delete-pr-btn text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1" 
						data-distance="${prRecord.distance}" 
						data-unit="${prRecord.unit}"
						title="Delete PR">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
					</svg>
				</button>
			</div>
		</div>
	`).join('');
	
	// Add event listeners to edit/delete buttons
	prList.querySelectorAll('.edit-pr-btn').forEach(btn => {
		btn.addEventListener('click', handleEditPR);
	});
	
	prList.querySelectorAll('.delete-pr-btn').forEach(btn => {
		btn.addEventListener('click', handleDeletePR);
	});
}

function openPRModal(isEdit = false) {
	prModalTitle.textContent = isEdit ? 'Edit Personal Record' : 'Add Personal Record';
	prModal.classList.remove('hidden');
	prModal.classList.add('flex');
	
	// Set default unit to current setting
	prUnitSelect.value = state.distanceUnit;
	
	// Focus first input
	prDistanceInput.focus();
	
	// Prevent body scroll
	document.body.style.overflow = 'hidden';
}

function closePRModal() {
	prModal.classList.add('hidden');
	prModal.classList.remove('flex');
	
	// Reset form
	prForm.reset();
	editingPR = null;
	
	// Clear errors
	document.querySelectorAll('#pr-modal [id$="-error"]').forEach(error => {
		error.classList.add('hidden');
		error.textContent = '';
	});
	
	// Restore body scroll
	document.body.style.overflow = '';
}

function handleEditPR(e) {
	const btn = e.currentTarget;
	editingPR = {
		distance: parseFloat(btn.dataset.distance),
		unit: btn.dataset.unit,
		timeSeconds: parseFloat(btn.dataset.time)
	};
	
	// Populate form
	prDistanceInput.value = editingPR.distance;
	prUnitSelect.value = editingPR.unit;
	prTimeInput.value = calc.formatTime(editingPR.timeSeconds, true);
	
	openPRModal(true);
}

function handleDeletePR(e) {
	const btn = e.currentTarget;
	const distance = parseFloat(btn.dataset.distance);
	const unit = btn.dataset.unit;
	
	if (confirm(`Delete PR for ${pr.getDistanceName(distance, unit)}?`)) {
		pr.removePR(distance, unit);
		populatePRList();
	}
}

function validatePRForm() {
	let isValid = true;
	
	// Validate distance
	const distanceValidation = calc.validateDistanceInput(prDistanceInput.value);
	const distanceError = document.getElementById('pr-distance-error');
	if (!distanceValidation.valid) {
		distanceError.textContent = distanceValidation.message;
		distanceError.classList.remove('hidden');
		prDistanceInput.classList.add('error');
		isValid = false;
	} else {
		distanceError.classList.add('hidden');
		prDistanceInput.classList.remove('error');
	}
	
	// Validate time
	const timeValidation = pr.validatePRTime(prTimeInput.value);
	const timeError = document.getElementById('pr-time-error');
	if (!timeValidation.valid) {
		timeError.textContent = timeValidation.message;
		timeError.classList.remove('hidden');
		prTimeInput.classList.add('error');
		isValid = false;
	} else {
		timeError.classList.add('hidden');
		prTimeInput.classList.remove('error');
	}
	
	return isValid ? {
		distance: distanceValidation.value,
		unit: prUnitSelect.value,
		timeSeconds: timeValidation.value
	} : null;
}

function handlePRFormSubmit(e) {
	e.preventDefault();
	
	const validation = validatePRForm();
	if (!validation) return;
	
	// If editing, remove the old PR first
	if (editingPR) {
		pr.removePR(editingPR.distance, editingPR.unit);
	}
	
	// Save the new/updated PR
	const success = pr.setPR(validation.distance, validation.unit, validation.timeSeconds);
	
	if (success) {
		populatePRList();
		closePRModal();
	} else {
		alert('Failed to save PR. Please try again.');
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
	
	// PR modal event listeners
	addPrBtn.addEventListener('click', () => openPRModal(false));
	closePrModalBtn.addEventListener('click', closePRModal);
	cancelPrBtn.addEventListener('click', closePRModal);
	prForm.addEventListener('submit', handlePRFormSubmit);
	
	// Keyboard and modal interactions
	document.addEventListener('keydown', handleKeyDown);
	settingsModal.addEventListener('click', handleModalBackdropClick);
	prModal.addEventListener('click', (e) => {
		if (e.target === prModal) closePRModal();
	});
	
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