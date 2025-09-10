import * as calc from "./calculator.js";
import { getDistanceDisplayName, getDistanceValue, getRaceDistances } from "./distances.js";
import * as pr from "./pr.js";
import { state } from "./state.js";
import { populatePresetSelects, updateCalculatedResult, updateHintTexts } from "./ui.js";

// Settings preferences with defaults
const defaultSettings = {
	distanceUnit: 'km',
	theme: 'system', // 'light', 'dark', or 'system'
	defaultDistance: null, // no default distance initially (user can set their preference)
	accentColor: 'indigo' // default accent color
};

// DOM Elements (will be initialized in initSettings)
let settingsModal, closeSettingsBtn, themeRadios, unitToggles, accentColorOptions, defaultDistanceSelect;
let menuBtn, menuDropdown, prMenuBtn, settingsMenuBtn;
let helpBtn, helpModal, closeHelpBtn;
let prManagementModal, closePrManagementBtn, closePrManagementBtnSecondary, prEmptyState;
let prModal, prModalTitle, addPrBtn, addPrBtnSecondary, closePrModalBtn, cancelPrBtn, prForm, prList, prListActions;
let prDistanceInput, prUnitSelect, prDateInput, prNotesInput;
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
	// Remove all theme classes first
	document.documentElement.classList.remove("dark");

	let actualTheme;

	if (themePreference === 'system') {
		actualTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? 'dark' : 'light';
	} else {
		actualTheme = themePreference;
	}

	// Apply the appropriate theme class
	if (actualTheme === 'dark') {
		document.documentElement.classList.add("dark");
	}
	// Light theme is the default (no class needed)
}

function applyAccentColor(color) {
	// Set CSS custom property for accent color
	document.documentElement.style.setProperty('--accent-color', `var(--color-${color})`);

	// Update interactive colors to use the selected accent
	// Use CSS custom properties instead of hardcoded colors
	document.documentElement.style.setProperty('--color-interactive-primary', `var(--color-${color})`);
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


// Handle theme selection with auto-apply
function handleThemeChange(e) {
	const selectedTheme = e.target.value;
	const currentSettings = loadSettings();

	// Apply theme immediately
	applyTheme(selectedTheme);

	// Save immediately
	currentSettings.theme = selectedTheme;
	saveSettings(currentSettings);
}


// Handle accent color selection
function handleAccentColorSelect(e) {
	const selectedColor = e.currentTarget.dataset.accent;
	if (selectedColor) {
		// Update UI immediately
		updateAccentColorUI(selectedColor);
		// Apply the color theme
		applyAccentColor(selectedColor);
		// Save immediately
		const currentSettings = loadSettings();
		currentSettings.accentColor = selectedColor;
		saveSettings(currentSettings);
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
            toggle.setAttribute('aria-selected', 'true');
            toggle.setAttribute('tabindex', '0');
        } else {
            toggle.classList.remove("active");
            toggle.setAttribute('aria-selected', 'false');
            toggle.setAttribute('tabindex', '-1');
        }
    });

    // Trigger UI update for presets
    populatePresetSelects();
    // In simplified builds where ui.js hasn't initialized its globals yet,
    // updateCalculatedResult can throw. Guard to avoid breaking event binding.
    try {
        updateCalculatedResult();
    } catch (err) {
        // Non-fatal during early init; UI will refresh after first calculation.
        console.warn('updateCalculatedResult skipped during init:', err?.message || err);
    }
    updateHintTexts();

    // Update default distance dropdown if in settings modal
    populateDefaultDistanceSelect();

    // Apply default distance whenever unit changes
    applyDefaultDistance();
}

// Populate default distance dropdown based on current unit
function populateDefaultDistanceSelect() {
	if (!defaultDistanceSelect) return;

	const unit = state.distanceUnit;
	const raceDistances = getRaceDistances();

	// Build options HTML
	const options =
		`<option value="">No default (leave blank)</option>${
		Object.entries(raceDistances)
			.map(([key, value]) => {
				const displayName = getDistanceDisplayName(key);
				const distance = calc.formatDistance(value[unit], 3);
				return `<option value="${key}">${displayName} (${distance} ${unit})</option>`;
			})
			.join("")}`;

	defaultDistanceSelect.innerHTML = options;
}

// Handle default distance selection change
function handleDefaultDistanceChange(e) {
	const selectedPreset = e.target.value;

	// Save the setting immediately
        const currentSettings = loadSettings();
        currentSettings.defaultDistance = selectedPreset || null;
        saveSettings(currentSettings);

        // Immediately apply the selected default distance
        applyDefaultDistance();
}

// Apply default distance to all distance input fields if set
function applyDefaultDistance(forceApply = false) {
	const settings = loadSettings();

	if (!settings.defaultDistance) {
		console.log('No default distance set');
		return; // No default set
	}

	const distance = getDistanceValue(settings.defaultDistance, state.distanceUnit);
	if (!distance) {
		console.log('Invalid preset:', settings.defaultDistance);
		return; // Invalid preset
	}

	console.log('Applying default distance:', distance, state.distanceUnit, forceApply ? '(forced)' : '(empty fields only)');

	// Apply to all distance input fields
	['pace-distance', 'time-distance'].forEach(inputId => {
		const input = document.getElementById(inputId);
		if (input) {
			const isEmpty = !input.value || input.value.trim() === '';
			console.log(`Field ${inputId}: exists=${!!input}, isEmpty=${isEmpty}, currentValue="${input.value}"`);

			// Apply if field is empty OR if force apply is enabled (for fresh page loads)
			if (isEmpty || forceApply) {
				input.value = distance;
				console.log(`Set ${inputId} to ${distance}${forceApply ? ' (forced)' : ''}`);

				// Update corresponding preset dropdown
				const tabPrefix = inputId.split('-')[0]; // 'pace' or 'time'
				const presetSelect = document.getElementById(`${tabPrefix}-preset`);
				if (presetSelect) {
					presetSelect.value = settings.defaultDistance;
					console.log(`Set ${tabPrefix}-preset to ${settings.defaultDistance}`);
				}
			}
		} else {
			console.log(`Field ${inputId} not found`);
		}
	});
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

	// Populate and set default distance
	populateDefaultDistanceSelect();
	if (defaultDistanceSelect) {
		defaultDistanceSelect.value = settings.defaultDistance || '';
	}

	// Set current accent color
	updateAccentColorUI(settings.accentColor);



	// Show modal
	settingsModal.classList.remove('hidden');

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

	// Restore body scroll
	document.body.style.overflow = '';

	// Return focus to menu button
	menuBtn.focus();
}


// Handle unit toggle clicks in modal
function handleUnitToggle(e) {
	const clickedUnit = e.target.dataset.unit;
	if (clickedUnit && (e.type === 'click' || e.key === 'Enter' || e.key === ' ')) {
		e.preventDefault();
		applyDistanceUnit(clickedUnit);

		// Focus the clicked unit button
		e.target.focus();
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


// Handle click outside help modal to close
function handleHelpBackdropClick(e) {
	if (e.target === helpModal) {
		closeHelp();
	}
}

// Handle click outside PR management modal to close
function handlePRManagementBackdropClick(e) {
	if (e.target === prManagementModal) {
		closePRManagement();
	}
}

// Handle click outside PR modal to close
function handlePRModalBackdropClick(e) {
	if (e.target === prModal) {
		closePRModal();
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
function handleSystemThemeChange(_e) {
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

	// Focus close button for accessibility
	closeHelpBtn.focus();

	// Prevent body scroll
	document.body.style.overflow = 'hidden';
}

function closeHelp() {
	helpModal.classList.add('hidden');

	// Restore body scroll
	document.body.style.overflow = '';

	// Return focus to help button
	helpBtn.focus();
}

// PR Management Functions
function openPRManagement() {
	closeMenu();

	// Populate PR list
	populatePRList();

	// Show modal
	prManagementModal.classList.remove('hidden');

	// Focus close button
	if (closePrManagementBtn) {
		closePrManagementBtn.focus();
	}

	// Prevent body scroll
	document.body.style.overflow = 'hidden';
}

function closePRManagement() {
	prManagementModal.classList.add('hidden');

	// Restore body scroll
	document.body.style.overflow = '';

	// Return focus to menu button
	menuBtn.focus();
}

function populatePRList() {
	const prs = pr.getAllPRs();

	if (prs.length === 0) {
		prList.innerHTML = '';
		prEmptyState.classList.remove('hidden');
		prListActions.classList.add('hidden');
		return;
	}

	prEmptyState.classList.add('hidden');
	prListActions.classList.remove('hidden');

	prList.innerHTML = prs.map(prRecord => `
		<div class="flex justify-between items-center p-2 rounded-lg" style="background-color: var(--color-surface-secondary);">
			<div>
				<div>
					<span class="font-medium modal-title">
						${prRecord.displayName || `${prRecord.distance} ${prRecord.unit}`}
					</span>
					<span class="ml-2 modal-text">${prRecord.timeFormatted}</span>
				</div>
				${prRecord.dateSet ? `<div class="text-xs mt-1 modal-text-tertiary">
					${pr.formatDate(prRecord.dateSet)}
				</div>` : ''}
				${prRecord.notes ? `<div class="text-xs mt-1 italic modal-text-tertiary">
					"${prRecord.notes}"
				</div>` : ''}
			</div>
			<div class="flex gap-1">
				<button class="edit-pr-btn p-1 rounded"
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
				<button class="delete-pr-btn p-1 rounded"
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

	// Set default unit to current setting
	prUnitSelect.value = state.distanceUnit;

	// Focus first input
	prDistanceInput.focus();

	// Prevent body scroll
	document.body.style.overflow = 'hidden';
}

function closePRModal() {
	prModal.classList.add('hidden');

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
	const {unit} = btn.dataset;

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

// PR Time Validation Functions
function validatePRSegmentedTime() {
	const hours = parseInt(document.getElementById('pr-time-hours').value) || 0;
	const minutes = parseInt(document.getElementById('pr-time-minutes').value) || 0;
	const seconds = parseInt(document.getElementById('pr-time-seconds').value) || 0;

	if (hours === 0 && minutes === 0 && seconds === 0) {
		return { valid: false, message: 'Please enter a valid time' };
	}

	if (minutes >= 60 || seconds >= 60) {
		return { valid: false, message: 'Minutes and seconds must be less than 60' };
	}

	if (hours < 0 || minutes < 0 || seconds < 0) {
		return { valid: false, message: 'Time values cannot be negative' };
	}

	const totalSeconds = hours * 3600 + minutes * 60 + seconds;
	return { valid: true, value: totalSeconds };
}

function setPRSegmentedTimeValue(totalSeconds) {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	document.getElementById('pr-time-hours').value = hours > 0 ? hours : '';
	document.getElementById('pr-time-minutes').value = minutes;
	document.getElementById('pr-time-seconds').value = seconds;
}

function showPRTimeError(message) {
	const errorElement = document.getElementById('pr-time-error');
	errorElement.textContent = message;
	errorElement.classList.remove('hidden');

	// Add error styling to time inputs
	['pr-time-hours', 'pr-time-minutes', 'pr-time-seconds'].forEach(id => {
		document.getElementById(id).classList.add('error');
	});
}

function markPRTimeValid() {
	const errorElement = document.getElementById('pr-time-error');
	errorElement.classList.add('hidden');

	// Remove error styling from time inputs
	['pr-time-hours', 'pr-time-minutes', 'pr-time-seconds'].forEach(id => {
		document.getElementById(id).classList.remove('error');
	});
}

function clearPRTimeErrors() {
	markPRTimeValid();
}

// Initialize settings
export function initSettings() {
	// Initialize DOM elements
	settingsModal = document.getElementById("settings-modal");
	closeSettingsBtn = document.getElementById("close-settings");
	themeRadios = document.querySelectorAll('.theme-radio');
	unitToggles = document.querySelectorAll("[data-unit]");
	accentColorOptions = document.querySelectorAll('.accent-color-option');
	defaultDistanceSelect = document.getElementById('default-distance-select');

	// Menu elements
	menuBtn = document.getElementById("menu-btn");
	menuDropdown = document.getElementById("menu-dropdown");
	prMenuBtn = document.getElementById("pr-menu-item");
	settingsMenuBtn = document.getElementById("settings-menu-item");

	// Help elements
	helpBtn = document.getElementById("help-btn");
	helpModal = document.getElementById("help-modal");
	closeHelpBtn = document.getElementById("close-help");

	// PR Management Modal elements
	prManagementModal = document.getElementById("pr-management-modal");
	closePrManagementBtn = document.getElementById("close-pr-management");
	closePrManagementBtnSecondary = document.getElementById("close-pr-management-btn");
	prEmptyState = document.getElementById("pr-empty-state");
	prList = document.getElementById("pr-list");
	prListActions = document.getElementById("pr-list-actions");

	// PR Add/Edit Modal elements
	prModal = document.getElementById("pr-modal");
	prModalTitle = document.getElementById("pr-modal-title");
	addPrBtn = document.getElementById("add-pr-btn");
	addPrBtnSecondary = document.getElementById("add-pr-btn-secondary");
	closePrModalBtn = document.getElementById("close-pr-modal");
	cancelPrBtn = document.getElementById("cancel-pr");
	prForm = document.getElementById("pr-form");
	prDistanceInput = document.getElementById("pr-distance");
	prUnitSelect = document.getElementById("pr-unit");
	prDateInput = document.getElementById("pr-date");
	prNotesInput = document.getElementById("pr-notes");

	const settings = loadSettings();

	// Apply initial settings
	applyTheme(settings.theme);
	applyDistanceUnit(settings.distanceUnit);
	applyAccentColor(settings.accentColor);

	// Event listeners (with null checks)
	if (closeSettingsBtn) {
		closeSettingsBtn.addEventListener('click', closeSettings);
	}

	// Theme radio button listeners for auto-apply
	if (themeRadios) {
		themeRadios.forEach(radio => {
			radio.addEventListener('change', handleThemeChange);
		});
	}

	// Menu event listeners
	if (menuBtn) {
		menuBtn.addEventListener('click', handleMenuToggle);
	}
	if (prMenuBtn) {
		prMenuBtn.addEventListener('click', openPRManagement);
	}
	if (settingsMenuBtn) {
		settingsMenuBtn.addEventListener('click', openSettings);
	}

	// Help modal event listeners
	if (helpBtn) {
		helpBtn.addEventListener('click', openHelp);
	}
	if (closeHelpBtn) {
		closeHelpBtn.addEventListener('click', closeHelp);
	}

	// PR Management modal event listeners
	if (closePrManagementBtn) {
		closePrManagementBtn.addEventListener('click', closePRManagement);
	}
	if (closePrManagementBtnSecondary) {
		closePrManagementBtnSecondary.addEventListener('click', closePRManagement);
	}
	if (addPrBtn) {
		addPrBtn.addEventListener('click', () => openPRModal(false));
	}
	if (addPrBtnSecondary) {
		addPrBtnSecondary.addEventListener('click', () => openPRModal(false));
	}

	// PR modal event listeners
	if (closePrModalBtn) {
		closePrModalBtn.addEventListener('click', closePRModal);
	}
	if (cancelPrBtn) {
		cancelPrBtn.addEventListener('click', closePRModal);
	}
	if (prForm) {
		prForm.addEventListener('submit', handlePRFormSubmit);
	}

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

	// Unit toggles in modal
	if (unitToggles) {
		unitToggles.forEach(toggle => {
			toggle.addEventListener('click', handleUnitToggle);
			toggle.addEventListener('keydown', handleUnitToggle);
		});
	}

	// Accent color event listeners
	if (accentColorOptions) {
		accentColorOptions.forEach(option => {
			option.addEventListener('click', handleAccentColorSelect);
		});
	}

	// Default distance select event listener
	if (defaultDistanceSelect) {
		defaultDistanceSelect.addEventListener('change', handleDefaultDistanceChange);
	}

	// Keyboard and modal interactions
	document.addEventListener('keydown', handleKeyDown);
	document.addEventListener('click', handleDocumentClick);
	settingsModal.addEventListener('click', handleModalBackdropClick);
	helpModal.addEventListener('click', handleHelpBackdropClick);
	prManagementModal.addEventListener('click', handlePRManagementBackdropClick);
	prModal.addEventListener('click', handlePRModalBackdropClick);

	// Listen for system theme changes
	window.matchMedia("(prefers-color-scheme: dark)").addEventListener('change', handleSystemThemeChange);

	// Apply default distance after initialization is complete
	// Use setTimeout to ensure all DOM elements are fully ready
	// Force apply on initial page load to override restored form state
	setTimeout(() => {
		applyDefaultDistance(true);
	}, 0);

	// Make updateUnitToggles available globally for backward compatibility
	window.updateUnitToggles = () => {
		// This will be called from ui.js to update presets
		populatePresetSelects();
		updateCalculatedResult();
	};
}

// Export functions for use in other modules
export { applyDefaultDistance, applyDistanceUnit, applyTheme, loadSettings, saveSettings };
