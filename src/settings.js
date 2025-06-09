import { state } from "./state.js";
import { populatePresetSelects, populateAutocomplete, updateCalculatedResult, updateHintTexts } from "./ui.js";
import * as pr from "./pr.js";
import * as calc from "./calculator.js";

// Settings preferences with defaults
const defaultSettings = {
	distanceUnit: 'km',
	theme: 'system', // 'light', 'dark', 'system', 'amoled', 'high-contrast', or 'monochrome'
	accentColor: 'indigo' // default accent color
};

// DOM Elements
const settingsModal = document.getElementById("settings-modal");
const closeSettingsBtn = document.getElementById("close-settings");
const saveSettingsBtn = document.getElementById("save-settings");
const themeRadios = document.querySelectorAll('.theme-radio');
const unitToggles = document.querySelectorAll("[data-unit]");
const accentColorOptions = document.querySelectorAll('.accent-color-option');

// Menu elements
const menuBtn = document.getElementById("menu-btn");
const menuDropdown = document.getElementById("menu-dropdown");
const prMenuBtn = document.getElementById("pr-menu-item");
const settingsMenuBtn = document.getElementById("settings-menu-item");

// Help elements (separate from menu)
const helpBtn = document.getElementById("help-btn");
const helpModal = document.getElementById("help-modal");
const closeHelpBtn = document.getElementById("close-help");

// PR Management Modal elements
const prManagementModal = document.getElementById("pr-management-modal");
const closePrManagementBtn = document.getElementById("close-pr-management");
const closePrManagementBtnSecondary = document.getElementById("close-pr-management-btn");
const prEmptyState = document.getElementById("pr-empty-state");

// PR Add/Edit Modal elements
const prModal = document.getElementById("pr-modal");
const prModalTitle = document.getElementById("pr-modal-title");
const addPrBtn = document.getElementById("add-pr-btn");
const closePrModalBtn = document.getElementById("close-pr-modal");
const cancelPrBtn = document.getElementById("cancel-pr");
const prForm = document.getElementById("pr-form");
const prList = document.getElementById("pr-list");
const prDistanceInput = document.getElementById("pr-distance");
const prUnitSelect = document.getElementById("pr-unit");
const prDateInput = document.getElementById("pr-date");
const prNotesInput = document.getElementById("pr-notes");

// PR modal state
let editingPR = null;

// Utility functions for segmented PR time input
function getPRSegmentedTimeValue() {
	const hoursInput = document.getElementById('pr-time-hours');
	const minutesInput = document.getElementById('pr-time-minutes');
	const secondsInput = document.getElementById('pr-time-seconds');
	
	const hours = parseInt(hoursInput?.value || '0') || 0;
	const minutes = parseInt(minutesInput?.value || '0') || 0;
	const seconds = parseInt(secondsInput?.value || '0') || 0;
	
	return hours * 3600 + minutes * 60 + seconds;
}

function setPRSegmentedTimeValue(totalSeconds) {
	const hoursInput = document.getElementById('pr-time-hours');
	const minutesInput = document.getElementById('pr-time-minutes');
	const secondsInput = document.getElementById('pr-time-seconds');
	
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	
	if (hoursInput) hoursInput.value = hours > 0 ? hours : '';
	if (minutesInput) minutesInput.value = minutes;
	if (secondsInput) secondsInput.value = seconds;
}

function validatePRSegmentedTime() {
	const totalSeconds = getPRSegmentedTimeValue();
	
	if (totalSeconds <= 0) {
		return { valid: false, message: "Time must be greater than 0" };
	}
	
	if (totalSeconds > 86400) {
		return { valid: false, message: "Time cannot exceed 24 hours" };
	}
	
	return { valid: true, value: totalSeconds };
}

function clearPRTimeErrors() {
	const errorElement = document.getElementById('pr-time-error');
	if (errorElement) {
		errorElement.classList.add('hidden');
		errorElement.textContent = '';
	}
	
	['hours', 'minutes', 'seconds'].forEach(segment => {
		const input = document.getElementById(`pr-time-${segment}`);
		if (input) {
			input.classList.remove('error', 'valid');
		}
	});
}

function showPRTimeError(message) {
	const errorElement = document.getElementById('pr-time-error');
	if (errorElement) {
		errorElement.textContent = message;
		errorElement.classList.remove('hidden');
	}
	
	['hours', 'minutes', 'seconds'].forEach(segment => {
		const input = document.getElementById(`pr-time-${segment}`);
		if (input) {
			input.classList.add('error');
			input.classList.remove('valid');
		}
	});
}

function markPRTimeValid() {
	clearPRTimeErrors();
	
	['hours', 'minutes', 'seconds'].forEach(segment => {
		const input = document.getElementById(`pr-time-${segment}`);
		if (input) {
			input.classList.add('valid');
		}
	});
}

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
	// Remove all theme classes first
	document.documentElement.classList.remove("dark", "amoled", "high-contrast", "monochrome");
	
	let actualTheme;
	
	if (themePreference === 'system') {
		actualTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? 'dark' : 'light';
	} else {
		actualTheme = themePreference;
	}
	
	// Apply the appropriate theme class
	if (actualTheme === 'dark') {
		document.documentElement.classList.add("dark");
	} else if (actualTheme === 'amoled') {
		document.documentElement.classList.add("amoled");
	} else if (actualTheme === 'high-contrast') {
		document.documentElement.classList.add("high-contrast");
	} else if (actualTheme === 'monochrome') {
		document.documentElement.classList.add("monochrome");
	}
	// Light theme is the default (no class needed)
}

// Apply accent color
function applyAccentColor(accentColor) {
	// Apply the accent color data attribute to the document element
	document.documentElement.setAttribute('data-accent-color', accentColor);
}

// Update accent color UI to show current selection
function updateAccentColorUI(accentColor) {
	accentColorOptions.forEach(option => {
		if (option.dataset.accent === accentColor) {
			option.classList.add('selected');
		} else {
			option.classList.remove('selected');
		}
	});
}

// Handle accent color selection
function handleAccentColorSelect(e) {
	const selectedColor = e.currentTarget.dataset.accent;
	if (selectedColor) {
		// Update UI immediately
		updateAccentColorUI(selectedColor);
		// Apply the color theme
		applyAccentColor(selectedColor);
		// Save to current session (will be saved when user clicks Save)
		const currentSettings = loadSettings();
		currentSettings.accentColor = selectedColor;
		localStorage.setItem('pace-calculator-settings', JSON.stringify(currentSettings));
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
	updateHintTexts();
}

// Open settings modal
function openSettings() {
	closeMenu();
	
	const settings = loadSettings();
	
	// Set current theme radio
	themeRadios.forEach(radio => {
		radio.checked = radio.value === settings.theme;
	});
	
	// Set current unit toggles
	applyDistanceUnit(settings.distanceUnit);
	
	// Set current accent color
	updateAccentColorUI(settings.accentColor);
	
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
	
	// Return focus to menu button
	menuBtn.focus();
}

// Save and apply settings
function handleSaveSettings() {
	const selectedTheme = document.querySelector('input[name="theme"]:checked')?.value || 'system';
	const selectedUnit = state.distanceUnit; // Already updated by unit toggles
	
	// Get current accent color from settings
	const currentSettings = loadSettings();
	
	const settings = {
		theme: selectedTheme,
		distanceUnit: selectedUnit,
		accentColor: currentSettings.accentColor
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
	if (e.key === 'Escape') {
		if (!menuDropdown.classList.contains('hidden')) {
			closeMenu();
		} else if (!helpModal.classList.contains('hidden')) {
			closeHelp();
		} else if (!settingsModal.classList.contains('hidden')) {
			closeSettings();
		} else if (!prManagementModal.classList.contains('hidden')) {
			closePRManagement();
		} else if (!prModal.classList.contains('hidden')) {
			closePRModal();
		}
	}
}

// Handle click outside modal to close
function handleModalBackdropClick(e) {
	if (e.target === settingsModal) {
		closeSettings();
	}
}

// Handle click outside PR management modal to close
function handlePRManagementBackdropClick(e) {
	if (e.target === prManagementModal) {
		closePRManagement();
	}
}

// Handle click outside help modal to close
function handleHelpBackdropClick(e) {
	if (e.target === helpModal) {
		closeHelp();
	}
}

// Handle click outside menu to close
function handleDocumentClick(e) {
	if (!menuBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
		if (!menuDropdown.classList.contains('hidden')) {
			closeMenu();
		}
	}
}

// Listen for system theme changes
function handleSystemThemeChange(e) {
	const settings = loadSettings();
	if (settings.theme === 'system') {
		applyTheme('system');
	}
}

// Menu functionality
function openMenu() {
	menuDropdown.classList.remove('hidden');
	// Focus first menu item
	prMenuBtn.focus();
}

function closeMenu() {
	menuDropdown.classList.add('hidden');
	// Return focus to menu button
	menuBtn.focus();
}

function handleMenuToggle() {
	if (menuDropdown.classList.contains('hidden')) {
		openMenu();
	} else {
		closeMenu();
	}
}

// Help modal functionality
function openHelp() {
	helpModal.classList.remove('hidden');
	helpModal.classList.add('flex');
	
	// Focus close button for accessibility
	closeHelpBtn.focus();
	
	// Prevent body scroll
	document.body.style.overflow = 'hidden';
}

function closeHelp() {
	helpModal.classList.add('hidden');
	helpModal.classList.remove('flex');
	
	// Restore body scroll
	document.body.style.overflow = '';
	
	// Return focus to help button
	helpBtn.focus();
}

// Open PR management modal
function openPRManagement() {
	closeMenu();
	
	// Populate PR list
	populatePRList();
	
	// Show modal
	prManagementModal.classList.remove('hidden');
	prManagementModal.classList.add('flex');
	
	// Focus close button
	closePrManagementBtn.focus();
	
	// Prevent body scroll
	document.body.style.overflow = 'hidden';
}

// Close PR management modal
function closePRManagement() {
	prManagementModal.classList.add('hidden');
	prManagementModal.classList.remove('flex');
	
	// Restore body scroll
	document.body.style.overflow = '';
	
	// Return focus to menu button
	menuBtn.focus();
}

// PR Management Functions
function populatePRList() {
	const prs = pr.getAllPRs();
	
	if (prs.length === 0) {
		prList.innerHTML = '';
		prEmptyState.classList.remove('hidden');
		return;
	}
	
	prEmptyState.classList.add('hidden');
	
	prList.innerHTML = prs.map(prRecord => `
		<div class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
			<div>
				<div>
					<span class="font-medium text-gray-900 dark:text-white">
						${prRecord.displayName || `${prRecord.distance} ${prRecord.unit}`}
					</span>
					<span class="text-gray-600 dark:text-gray-300 ml-2">${prRecord.timeFormatted}</span>
				</div>
				${prRecord.dateSet ? `<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
					${pr.formatDate(prRecord.dateSet)}
				</div>` : ''}
				${prRecord.notes ? `<div class="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
					"${prRecord.notes}"
				</div>` : ''}
			</div>
			<div class="flex gap-1">
				<button class="edit-pr-btn text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 p-1" 
						data-distance="${prRecord.distance}" 
						data-unit="${prRecord.unit}" 
						data-time="${prRecord.timeSeconds}"
						data-date="${prRecord.dateSet || ''}"
						data-notes="${prRecord.notes || ''}"
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
	
	// Clear segmented time input errors
	clearPRTimeErrors();
	
	// Restore body scroll
	document.body.style.overflow = '';
}

function handleEditPR(e) {
	const btn = e.currentTarget;
	editingPR = {
		distance: parseFloat(btn.dataset.distance),
		unit: btn.dataset.unit,
		timeSeconds: parseFloat(btn.dataset.time),
		dateSet: btn.dataset.date,
		notes: btn.dataset.notes
	};
	
	// Populate form
	prDistanceInput.value = editingPR.distance;
	prUnitSelect.value = editingPR.unit;
	setPRSegmentedTimeValue(editingPR.timeSeconds);
	prDateInput.value = pr.getDateInputValue(editingPR.dateSet);
	prNotesInput.value = editingPR.notes || '';
	
	openPRModal(true);
}

function handleDeletePR(e) {
	const btn = e.currentTarget;
	const distance = parseFloat(btn.dataset.distance);
	const unit = btn.dataset.unit;
	
	if (confirm(`Delete PR for ${pr.getDistanceName(distance, unit)}?`)) {
		pr.removePR(distance, unit);
		populatePRList(); // Refresh the PR list in management modal
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
	const timeValidation = validatePRSegmentedTime();
	if (!timeValidation.valid) {
		showPRTimeError(timeValidation.message);
		isValid = false;
	} else {
		markPRTimeValid();
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
	const date = prDateInput.value || null;
	const notes = prNotesInput.value.trim() || null;
	const success = pr.setPR(validation.distance, validation.unit, validation.timeSeconds, date, notes);
	
	if (success) {
		populatePRList(); // Refresh the PR list in management modal
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
	applyAccentColor(settings.accentColor);
	
	// Event listeners
	closeSettingsBtn.addEventListener('click', closeSettings);
	saveSettingsBtn.addEventListener('click', handleSaveSettings);
	
	// Menu event listeners
	menuBtn.addEventListener('click', handleMenuToggle);
	prMenuBtn.addEventListener('click', openPRManagement);
	settingsMenuBtn.addEventListener('click', openSettings);
	
	// Help modal event listeners
	helpBtn.addEventListener('click', openHelp);
	closeHelpBtn.addEventListener('click', closeHelp);
	
	// PR Management modal event listeners
	closePrManagementBtn.addEventListener('click', closePRManagement);
	closePrManagementBtnSecondary.addEventListener('click', closePRManagement);
	
	// Unit toggles in modal
	unitToggles.forEach(toggle => {
		toggle.addEventListener('click', handleUnitToggle);
	});
	
	// Accent color event listeners
	accentColorOptions.forEach(option => {
		option.addEventListener('click', handleAccentColorSelect);
	});
	
	// PR modal event listeners
	addPrBtn.addEventListener('click', () => openPRModal(false));
	closePrModalBtn.addEventListener('click', closePRModal);
	cancelPrBtn.addEventListener('click', closePRModal);
	prForm.addEventListener('submit', handlePRFormSubmit);
	
	// PR segmented time input validation
	['hours', 'minutes', 'seconds'].forEach(segment => {
		const input = document.getElementById(`pr-time-${segment}`);
		if (input) {
			input.addEventListener('blur', () => {
				const validation = validatePRSegmentedTime();
				if (validation.valid) {
					markPRTimeValid();
				} else {
					showPRTimeError(validation.message);
				}
			});
			
			input.addEventListener('input', () => {
				clearPRTimeErrors();
			});
		}
	});
	
	// Keyboard and modal interactions
	document.addEventListener('keydown', handleKeyDown);
	document.addEventListener('click', handleDocumentClick);
	settingsModal.addEventListener('click', handleModalBackdropClick);
	helpModal.addEventListener('click', handleHelpBackdropClick);
	prManagementModal.addEventListener('click', handlePRManagementBackdropClick);
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