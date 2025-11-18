import { initAutoAdvance } from "./auto-advance.js";
import * as calc from "./calculator.js";
import { getRaceDistances } from "./distances.js";
import { applyTheme, initSettings, loadSettings, saveSettings } from "./settings.js";
import { createSplitsAccordion, setupSplitsAccordion } from "./splits.js";
import { state } from "./state.js";
import "./style.css";

// ============================================================================
// DOM Elements - initialized once on load
// ============================================================================
let form, resultDiv, resultLabel, resultValue, loadingDiv;

// Use centralized settings management from settings.js

// ============================================================================
// Core UI Functions
// ============================================================================
function getTimeValue(prefix) {
	const hours = parseInt(document.getElementById(`${prefix}-hours`)?.value || '0') || 0;
	const minutes = parseInt(document.getElementById(`${prefix}-minutes`)?.value || '0') || 0;
	const seconds = parseInt(document.getElementById(`${prefix}-seconds`)?.value || '0') || 0;
	return hours * 3600 + minutes * 60 + seconds; // Allow unlimited hours - no max
}

function getPaceValue(prefix) {
	const minutes = parseInt(document.getElementById(`${prefix}-minutes`)?.value || '0') || 0;
	const seconds = parseInt(document.getElementById(`${prefix}-seconds`)?.value || '0') || 0;
	return minutes * 60 + seconds;
}

// Enhanced validation with specific field error messages
function validateInputs() {
	const tab = state.currentTab;
	let isValid = true;

	// Clear previous errors
	clearFieldErrors();

	if (tab === 'pace') {
		const time = getTimeValue('pace-time');
		const distance = parseFloat(document.getElementById('pace-distance')?.value || '0');

		if (time <= 0) {
			showFieldError('pace-time-error', 'Please enter a valid time');
			isValid = false;
		}
		if (distance <= 0) {
			showFieldError('pace-distance-error', 'Please enter a distance greater than 0');
			isValid = false;
		}
	} else if (tab === 'time') {
		const pace = getPaceValue('time-pace');
		const distance = parseFloat(document.getElementById('time-distance')?.value || '0');

		if (pace <= 0) {
			showFieldError('time-pace-error', 'Please enter a valid pace');
			isValid = false;
		}
		if (distance <= 0) {
			showFieldError('time-distance-error', 'Please enter a distance greater than 0');
			isValid = false;
		}
	} else if (tab === 'distance') {
		const time = getTimeValue('distance-time');
		const pace = getPaceValue('distance-pace');

		if (time <= 0) {
			showFieldError('distance-time-error', 'Please enter a valid time');
			isValid = false;
		}
		if (pace <= 0) {
			showFieldError('distance-pace-error', 'Please enter a valid pace');
			isValid = false;
		}
	}

	// Update calculate button state
	updateCalculateButton(isValid);

	return isValid;
}

function clearFieldErrors() {
	const errorIds = [
		'pace-time-error', 'pace-distance-error',
		'time-pace-error', 'time-distance-error',
		'distance-time-error', 'distance-pace-error'
	];

	errorIds.forEach(id => {
		const errorElement = document.getElementById(id);
		if (errorElement) {
			errorElement.classList.add('hidden');
			errorElement.textContent = '';
		}
	});

	// Clear input error styling
	document.querySelectorAll('.input-base, .input-segmented').forEach(input => {
		input.classList.remove('error');
	});
}

function showFieldError(errorId, message) {
	const errorElement = document.getElementById(errorId);
	if (errorElement) {
		errorElement.textContent = message;
		errorElement.classList.remove('hidden');
	}

	// Add error styling to associated input(s)
	const baseId = errorId.replace('-error', '');

	// Handle segmented inputs differently
	if (errorId.includes('time-error')) {
		['hours', 'minutes', 'seconds'].forEach(segment => {
			const input = document.getElementById(`${baseId}-${segment}`);
			if (input) input.classList.add('error');
		});
	} else if (errorId.includes('pace-error')) {
		// Handle pace fields (minutes:seconds format)
		['minutes', 'seconds'].forEach(segment => {
			const input = document.getElementById(`${baseId}-${segment}`);
			if (input) input.classList.add('error');
		});
	} else {
		// Handle regular distance inputs
		const input = document.getElementById(baseId);
		if (input) input.classList.add('error');
	}
}

function updateCalculateButton(isValid) {
	const button = document.querySelector('button[type="submit"]');
	if (button) {
		button.disabled = !isValid;
		if (isValid) {
			button.style.opacity = '1';
		} else {
			button.style.opacity = '0.6';
		}
	}
}

function switchTab(tabName) {
	// Save current form state
	state.saveFormState();

	// Clear validation state from previous tab
	clearFieldErrors();

	// Update state and UI
	state.currentTab = tabName;

	// Update tab buttons
	document.querySelectorAll('[data-tab]').forEach(tab => {
		tab.classList.toggle('active', tab.dataset.tab === tabName);
	});

	// Update sections
	document.querySelectorAll('[data-section]').forEach(section => {
		section.classList.toggle('hidden', section.dataset.section !== tabName);
	});

	// Restore form state for new tab
	state.restoreFormState(tabName);

	// Hide result if it was for a different tab
	if (state.lastResult && state.lastResult.type !== tabName) {
		hideResult();
	}

	// Update calculate button state for new tab
	updateButtonStateQuietly();
}

function showLoading() {
	loadingDiv.classList.remove('hidden');
	resultDiv.classList.add('hidden');
}

function hideLoading() {
        loadingDiv.classList.add('hidden');
}


function showResult(label, value, isError = false) {
        resultLabel.textContent = label;
        resultValue.innerHTML = value;
        resultDiv.classList.toggle('error', isError);

        if (!isError) {
                const splitsHtml = createSplitsAccordion();
                if (splitsHtml) {
                        resultValue.innerHTML += splitsHtml;
                        setTimeout(() => {
                                setupSplitsAccordion();
                        }, 0);
                }
        }

        // Show result with proper animation
        resultDiv.classList.remove('hidden');

        // Trigger animation on next frame to ensure smooth transition
        requestAnimationFrame(() => {
                resultDiv.style.opacity = '1';
                resultDiv.style.transform = 'scale(1)';
        });

        // Auto-scroll to results
        setTimeout(() => {
                resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
}

function hideResult() {
	// Animate out first, then hide
	resultDiv.style.opacity = '0';
	resultDiv.style.transform = 'scale(0.95)';

	// Hide after animation completes
	setTimeout(() => {
		resultDiv.classList.add('hidden');
	}, 300); // Match CSS transition duration

	state.lastResult = null;
}

function clearForm() {
	const section = document.querySelector(`[data-section="${state.currentTab}"]`);
	if (section) {
		section.querySelectorAll('input').forEach(input => {
			input.value = '';
			input.classList.remove('error');
		});
		hideResult();
	}
}

function handleCalculation(e) {
        e.preventDefault();

        if (!validateInputs()) {
                showResult('Cannot Calculate', 'Please fill in the required fields above.', true);
                return; // Field-specific errors are already displayed inline
        }

	showLoading();

	// Small delay for loading effect
	setTimeout(() => {
		try {
			let label = '', value = '';

			if (state.currentTab === 'pace') {
				const timeSeconds = getTimeValue('pace-time');
                                const distance = parseFloat(document.getElementById('pace-distance').value);

				const { pacePerKm, pacePerMile } = calc.calculatePace(timeSeconds, distance, state.distanceUnit);

				label = 'Your Pace:';
				value = state.distanceUnit === 'km'
					? `${calc.formatTime(pacePerKm)} /km`
					: `${calc.formatTime(pacePerMile)} /mile`;

                                state.lastResult = { type: 'pace', pacePerKm, pacePerMile };

			} else if (state.currentTab === 'time') {
				const paceSeconds = getPaceValue('time-pace');
                                const distance = parseFloat(document.getElementById('time-distance').value);

				const totalSeconds = calc.calculateTime(paceSeconds, distance, state.distanceUnit, state.distanceUnit);

				label = 'Your Time:';
				value = calc.formatTime(totalSeconds, true);
                                state.lastResult = { type: 'time', totalSeconds };

			} else if (state.currentTab === 'distance') {
				const timeSeconds = getTimeValue('distance-time');
                                const paceSeconds = getPaceValue('distance-pace');

				const { km, miles } = calc.calculateDistance(timeSeconds, paceSeconds, state.distanceUnit);

				label = 'Your Distance:';
				value = state.distanceUnit === 'km' ? `${calc.formatDistance(km)} km` : `${calc.formatDistance(miles)} miles`;
                                state.lastResult = { type: 'distance', km, miles };
                        }

                        hideLoading();
                        showResult(label, value);
                } catch (error) {
                        void error;
                        hideLoading();
                        showResult('Error', 'Calculation failed. Please check your inputs.', true);
                }
	}, 200);
}

function setupPresetDropdowns() {
	const raceDistances = getRaceDistances();
	const options = `<option value="">-- Pick an event --</option>${
		Object.entries(raceDistances)
			.map(([key, value]) => `<option value="${key}">${key.toUpperCase()} (${value[state.distanceUnit]} ${state.distanceUnit})</option>`)
			.join('')
	}`;

	document.querySelectorAll('.preset-select').forEach(select => {
		select.innerHTML = options;
		select.addEventListener('change', e => {
			const preset = e.target.value;
			if (preset) {
				const distanceInput = document.getElementById(`${state.currentTab}-distance`);
				if (distanceInput) {
					distanceInput.value = raceDistances[preset][state.distanceUnit];
				}
			}
		});
	});
}

function setupQuickPresets() {
	document.querySelectorAll('.quick-preset-btn').forEach(button => {
		button.addEventListener('click', () => {
			const presetKey = button.dataset.quickPreset;
			const tabName = button.dataset.tab;
			const raceDistances = getRaceDistances();

			if (presetKey && raceDistances[presetKey]) {
				const distanceValue = raceDistances[presetKey][state.distanceUnit];
				const distanceInput = document.getElementById(`${tabName}-distance`);
				const presetSelect = document.getElementById(`${tabName}-preset`);

				if (distanceInput) {
					distanceInput.value = distanceValue;

					if (presetSelect) {
						presetSelect.value = presetKey;
					}

					clearFieldErrors();

					updateButtonStateQuietly();
				}
			}
		});
	});
}

function setupUnitToggle() {
	document.querySelectorAll('[data-unit]').forEach(toggle => {
		toggle.addEventListener('click', () => {
			const {unit} = toggle.dataset;
			state.distanceUnit = unit;

			// Update settings
			const currentSettings = loadSettings();
			currentSettings.distanceUnit = unit;
			saveSettings(currentSettings);

			// Update UI
			document.querySelectorAll('[data-unit]').forEach(t => {
				t.classList.toggle('active', t.dataset.unit === unit);
			});

			setupPresetDropdowns();
		});
	});
}

// ============================================================================
// Modal Management (Simplified)
// ============================================================================
function setupModals() {
	// Initialize the comprehensive settings system
	initSettings();
}

// ============================================================================
// Real-time Validation Setup
// ============================================================================
function setupRealtimeValidation() {
	// Real-time validation for all input fields
	const inputSelectors = [
		// Time inputs
		'input[id*="time-hours"]',
		'input[id*="time-minutes"]',
		'input[id*="time-seconds"]',
		// Pace inputs
		'input[id*="pace-minutes"]',
		'input[id*="pace-seconds"]',
		// Distance inputs
		'input[id*="distance"]',
	].join(', ');

	document.querySelectorAll(inputSelectors).forEach(input => {
		input.addEventListener('input', () => {
			// Clear errors for current input on typing (keeps UI clean while typing)
			clearInputError(input);

			// Update button state without showing new errors
			setTimeout(() => updateButtonStateQuietly(), 100); // Debounce for better UX
		});

		// Remove blur validation to avoid unexpected errors before submit
		// input.addEventListener('blur', () => {
		// 	validateInputs();
		// });
	});

	// Handle segmented input changes better
	document.querySelectorAll('.input-segmented-group').forEach(group => {
		group.addEventListener('input', () => {
			// Clear errors for the segmented group and update button state quietly
			group.querySelectorAll('input').forEach(input => {
				clearInputError(input);
			});
			setTimeout(() => updateButtonStateQuietly(), 100); // Debounce validation
		});
	});
}

function clearInputError(inputElement) {
	// Get the base input name to find corresponding error element
	const inputId = inputElement.id;

	// Clear specific field errors as user types
	if (inputId.includes('time')) {
		if (inputId.includes('pace-time') || inputId.includes('distance-time')) {
			const prefix = inputId.split('-').slice(0, 3).join('-'); // e.g., 'pace-time', 'distance-time'
			clearFieldErrorsForPrefix(prefix);
			inputElement.classList.remove('error');
		}
	} else if (inputId.includes('pace')) {
		if (inputId.includes('time-pace') || inputId.includes('distance-pace')) {
			const prefix = inputId.split('-').slice(0, 3).join('-'); // e.g., 'time-pace', 'distance-pace'
			clearFieldErrorsForPrefix(prefix);
			inputElement.classList.remove('error');
		}
	} else {
		// For distance inputs
		const errorId = `${inputId}-error`;
		const errorElement = document.getElementById(errorId);
		if (errorElement) {
			errorElement.classList.add('hidden');
			errorElement.textContent = '';
		}
		inputElement.classList.remove('error');
	}
}

function clearFieldErrorsForPrefix(prefix) {
	['hours', 'minutes', 'seconds'].forEach(segment => {
		const input = document.getElementById(`${prefix}-${segment}`);
		if (input) input.classList.remove('error');
	});

	const errorElement = document.getElementById(`${prefix}-error`);
	if (errorElement) {
		errorElement.classList.add('hidden');
		errorElement.textContent = '';
	}
}

// Quiet button state update without showing validation errors
function updateButtonStateQuietly() {
	const tab = state.currentTab;
	let isValid = false;

	if (tab === 'pace') {
		isValid = getTimeValue('pace-time') > 0 && parseFloat(document.getElementById('pace-distance')?.value || '0') > 0;
	} else if (tab === 'time') {
		isValid = getPaceValue('time-pace') > 0 && parseFloat(document.getElementById('time-distance')?.value || '0') > 0;
	} else if (tab === 'distance') {
		isValid = getTimeValue('distance-time') > 0 && getPaceValue('distance-pace') > 0;
	}

	updateCalculateButton(isValid);
}

// ============================================================================
// Main Initialization
// ============================================================================
function initApp() {
	// Initialize DOM elements
	form = document.getElementById('calculator-form');
	resultDiv = document.getElementById('result');
	resultLabel = document.getElementById('result-label');
	resultValue = document.getElementById('result-value');
	loadingDiv = document.getElementById('loading');

        if (!form || !resultDiv || !resultLabel || !resultValue || !loadingDiv) {
                return;
        }

	// Load and apply settings
	const settings = loadSettings();
	applyTheme(settings.theme);
	state.distanceUnit = settings.distanceUnit;

	// Setup event listeners
	form.addEventListener('submit', handleCalculation);
	document.getElementById('clear-btn')?.addEventListener('click', clearForm);

	// Setup tabs
	document.querySelectorAll('[data-tab]').forEach(tab => {
		tab.addEventListener('click', () => switchTab(tab.dataset.tab));
	});

	// Setup other UI components
	setupPresetDropdowns();
	setupQuickPresets();
	setupUnitToggle();
	setupModals();
	setupRealtimeValidation(); // Add real-time validation

	// Initialize auto-advance for segmented inputs
	initAutoAdvance();

        // Perform initial validation to enable button if default values are valid
        updateButtonStateQuietly();

        // Listen for system theme changes
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener('change', () => {
                const currentSettings = loadSettings();
                if (currentSettings.theme === 'system') {
                        applyTheme('system');
                }
        });

        // Make app visible now that everything is loaded
        document.getElementById('app').classList.add('ready');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
