import { state } from "./state.js";
import * as calc from "./calculator.js";
import * as pr from "./pr.js";

// DOM Elements
const form = document.getElementById("calculator-form");
const resultDiv = document.getElementById("result");
const resultLabel = document.getElementById("result-label");
const resultValue = document.getElementById("result-value");
const loadingDiv = document.getElementById("loading");
const copyBtn = document.getElementById("copy-result-btn");
const copyIcon = document.getElementById("copy-icon");
const checkIcon = document.getElementById("check-icon");

const presets = {
	"1k": { km: 1, miles: 0.621 },
	"1-mile": { km: 1.609, miles: 1 },
	"2k": { km: 2, miles: 1.243 },
	"3k": { km: 3, miles: 1.864 },
	"5k": { km: 5, miles: 3.107 },
	"8k": { km: 8, miles: 4.971 },
	"10k": { km: 10, miles: 6.214 },
	"12k": { km: 12, miles: 7.456 },
	"15k": { km: 15, miles: 9.321 },
	"10-mile": { km: 16.093, miles: 10 },
	"half-marathon": { km: 21.0975, miles: 13.109 },
	"25k": { km: 25, miles: 15.534 },
	"30k": { km: 30, miles: 18.641 },
	"marathon": { km: 42.195, miles: 26.219 },
	"50k": { km: 50, miles: 31.069 },
};

// Extended distances for autocomplete
const distanceSuggestions = {
	km: [1, 1.5, 2, 3, 5, 8, 10, 12, 15, 16.09, 21.0975, 25, 30, 42.195, 50, 100],
	miles: [0.5, 1, 1.5, 2, 3, 3.107, 5, 6.214, 8, 10, 13.109, 15, 20, 26.219, 31, 50, 100]
};

// Segmented input utility functions
function getSegmentedTimeValue(prefix) {
	const hoursInput = document.getElementById(`${prefix}-hours`);
	const minutesInput = document.getElementById(`${prefix}-minutes`);
	const secondsInput = document.getElementById(`${prefix}-seconds`);
	
	const hours = parseInt(hoursInput?.value || '0') || 0;
	const minutes = parseInt(minutesInput?.value || '0') || 0;
	const seconds = parseInt(secondsInput?.value || '0') || 0;
	
	// Convert to seconds
	return hours * 3600 + minutes * 60 + seconds;
}

function getSegmentedPaceValue(prefix) {
	const minutesInput = document.getElementById(`${prefix}-minutes`);
	const secondsInput = document.getElementById(`${prefix}-seconds`);
	
	const minutes = parseInt(minutesInput?.value || '0') || 0;
	const seconds = parseInt(secondsInput?.value || '0') || 0;
	
	// Convert to seconds
	return minutes * 60 + seconds;
}

function validateSegmentedTimeInput(prefix) {
	const totalSeconds = getSegmentedTimeValue(prefix);
	
	if (totalSeconds <= 0) {
		return { valid: false, message: "Time must be greater than 0" };
	}
	
	// Check for reasonable limits (max 24 hours)
	if (totalSeconds > 86400) {
		return { valid: false, message: "Time cannot exceed 24 hours" };
	}
	
	return { valid: true, value: totalSeconds };
}

function validateSegmentedPaceInput(prefix) {
	const totalSeconds = getSegmentedPaceValue(prefix);
	
	if (totalSeconds <= 0) {
		return { valid: false, message: "Pace must be greater than 0" };
	}
	
	// Check for reasonable limits (max 1 hour per unit)
	if (totalSeconds > 3600) {
		return { valid: false, message: "Pace cannot exceed 1 hour per unit" };
	}
	
	return { valid: true, value: totalSeconds };
}

function validateSegmentedInput(prefix, isTimeInput = true) {
	if (isTimeInput) {
		return validateSegmentedTimeInput(prefix);
	} else {
		return validateSegmentedPaceInput(prefix);
	}
}


// Centralized error state management
const ErrorManager = {
	// Set error state for an input
	setError(inputId, message) {
		const input = document.getElementById(inputId);
		const errorElement = document.getElementById(`${inputId}-error`);
		
		if (input) {
			input.classList.remove('valid');
			input.classList.add('error');
		}
		
		if (errorElement && message) {
			errorElement.textContent = message;
			errorElement.classList.remove('hidden');
		}
	},
	
	// Set valid state for an input
	setValid(inputId) {
		const input = document.getElementById(inputId);
		const errorElement = document.getElementById(`${inputId}-error`);
		
		if (input) {
			input.classList.remove('error');
			input.classList.add('valid');
		}
		
		if (errorElement) {
			errorElement.textContent = '';
			errorElement.classList.add('hidden');
		}
	},
	
	// Clear all validation states for an input
	clearState(inputId) {
		const input = document.getElementById(inputId);
		const errorElement = document.getElementById(`${inputId}-error`);
		
		if (input) {
			input.classList.remove('error', 'valid');
		}
		
		if (errorElement) {
			errorElement.textContent = '';
			errorElement.classList.add('hidden');
		}
	},
	
	// Handle segmented input groups (like time inputs)
	setSegmentedError(prefix, message) {
		const errorElement = document.getElementById(`${prefix}-error`);
		
		// Apply error state to all segments
		['hours', 'minutes', 'seconds'].forEach(segment => {
			const input = document.getElementById(`${prefix}-${segment}`);
			if (input) {
				input.classList.remove('valid');
				input.classList.add('error');
			}
		});
		
		if (errorElement && message) {
			errorElement.textContent = message;
			errorElement.classList.remove('hidden');
		}
	},
	
	setSegmentedValid(prefix) {
		const errorElement = document.getElementById(`${prefix}-error`);
		
		// Apply valid state to all segments
		['hours', 'minutes', 'seconds'].forEach(segment => {
			const input = document.getElementById(`${prefix}-${segment}`);
			if (input) {
				input.classList.remove('error');
				input.classList.add('valid');
			}
		});
		
		if (errorElement) {
			errorElement.textContent = '';
			errorElement.classList.add('hidden');
		}
	},
	
	clearSegmentedState(prefix) {
		const errorElement = document.getElementById(`${prefix}-error`);
		
		// Clear all segments
		['hours', 'minutes', 'seconds'].forEach(segment => {
			const input = document.getElementById(`${prefix}-${segment}`);
			if (input) {
				input.classList.remove('error', 'valid');
			}
		});
		
		if (errorElement) {
			errorElement.textContent = '';
			errorElement.classList.add('hidden');
		}
	},
	
	// Clear all errors in current tab
	clearCurrentTab() {
		const currentTab = state.currentTab;
		const currentSection = document.querySelector(`[data-section="${currentTab}"]`);
		
		if (!currentSection) return;
		
		// Clear regular inputs
		currentSection.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
			this.clearState(input.id);
		});
		
		// Clear segmented inputs for current tab
		if (currentTab === 'pace') {
			this.clearSegmentedState('pace-time');
		} else if (currentTab === 'time') {
			this.clearSegmentedState('time-pace');
		} else if (currentTab === 'distance') {
			this.clearSegmentedState('distance-time');
			this.clearSegmentedState('distance-pace');
		}
	}
};

// Input validation functions
function validateInput(inputElement, validationFn) {
	const value = inputElement.value;
	const result = validationFn(value);
	
	if (result.valid) {
		ErrorManager.setValid(inputElement.id);
	} else {
		ErrorManager.setError(inputElement.id, result.message);
	}
	
	return result;
}

function setupInputValidation() {
	// Segmented time inputs (HH:MM:SS)
	const timeInputPrefixes = ['pace-time', 'distance-time'];
	timeInputPrefixes.forEach(prefix => {
		['hours', 'minutes', 'seconds'].forEach(segment => {
			const input = document.getElementById(`${prefix}-${segment}`);
			if (input) {
				input.addEventListener('blur', () => {
					const validation = validateSegmentedInput(prefix, true);
					if (validation.valid) {
						ErrorManager.setSegmentedValid(prefix);
					} else {
						ErrorManager.setSegmentedError(prefix, validation.message);
					}
					updateCalculateButtonState();
				});
				
				input.addEventListener('input', () => {
					// Clear errors on input for immediate feedback
					ErrorManager.clearSegmentedState(prefix);
					// Update button state
					updateCalculateButtonState();
				});
			}
		});
	});
	
	// Segmented pace inputs (MM:SS)
	const paceInputPrefixes = ['time-pace', 'distance-pace'];
	paceInputPrefixes.forEach(prefix => {
		['minutes', 'seconds'].forEach(segment => {
			const input = document.getElementById(`${prefix}-${segment}`);
			if (input) {
				input.addEventListener('blur', () => {
					const validation = validateSegmentedInput(prefix, false);
					if (validation.valid) {
						ErrorManager.setSegmentedValid(prefix);
					} else {
						ErrorManager.setSegmentedError(prefix, validation.message);
					}
					updateCalculateButtonState();
				});
				
				input.addEventListener('input', () => {
					// Clear errors on input for immediate feedback
					ErrorManager.clearSegmentedState(prefix);
					// Update button state
					updateCalculateButtonState();
				});
			}
		});
	});
	
	// Distance inputs
	['pace-distance', 'time-distance'].forEach(id => {
		const input = document.getElementById(id);
		if (input) {
			input.addEventListener('blur', () => {
				validateInput(input, calc.validateDistanceInput);
				updateCalculateButtonState();
			});
			input.addEventListener('input', () => {
				ErrorManager.clearState(input.id);
				// Reset preset dropdown when distance is manually changed
				resetPresetDropdown(id);
				// Update button state
				updateCalculateButtonState();
			});
		}
	});
}

function resetPresetDropdown(distanceInputId) {
	// Get the corresponding preset dropdown for the current tab
	const currentTab = distanceInputId.split('-')[0]; // Extract 'pace' or 'time' from 'pace-distance'
	const presetSelect = document.getElementById(`${currentTab}-preset`);
	
	if (presetSelect) {
		// Check if the current distance matches any preset
		const input = document.getElementById(distanceInputId);
		const currentValue = parseFloat(input.value);
		
		if (currentValue) {
			// Find matching preset
			const matchingPreset = Object.entries(presets).find(([key, values]) => {
				const presetValue = values[state.distanceUnit];
				return Math.abs(currentValue - presetValue) < 0.001; // Small tolerance for floating point comparison
			});
			
			if (matchingPreset) {
				// Set the dropdown to the matching preset
				presetSelect.value = matchingPreset[0];
			} else {
				// No match, reset to default option
				presetSelect.selectedIndex = 0;
			}
		} else {
			// Empty input, reset dropdown
			presetSelect.selectedIndex = 0;
		}
	}
}

function areRequiredFieldsFilled() {
	const tab = state.currentTab;
	
	if (tab === 'pace') {
		// Pace tab needs: time (hours, minutes, seconds) + distance
		const timeValidation = validateSegmentedInput('pace-time', true);
		const distanceInput = document.getElementById('pace-distance');
		const distanceValidation = calc.validateDistanceInput(distanceInput.value);
		
		return timeValidation.valid && distanceValidation.valid;
		
	} else if (tab === 'time') {
		// Time tab needs: pace (minutes, seconds) + distance
		const paceValidation = validateSegmentedInput('time-pace', false);
		const distanceInput = document.getElementById('time-distance');
		const distanceValidation = calc.validateDistanceInput(distanceInput.value);
		
		return paceValidation.valid && distanceValidation.valid;
		
	} else if (tab === 'distance') {
		// Distance tab needs: time (hours, minutes, seconds) + pace (minutes, seconds)
		const timeValidation = validateSegmentedInput('distance-time', true);
		const paceValidation = validateSegmentedInput('distance-pace', false);
		
		return timeValidation.valid && paceValidation.valid;
	}
	
	return false;
}

function updateCalculateButtonState() {
	const calculateButton = document.querySelector('button[type="submit"]');
	const isFormValid = areRequiredFieldsFilled();
	
	if (calculateButton) {
		calculateButton.disabled = !isFormValid;
		
		if (isFormValid) {
			calculateButton.classList.remove('opacity-50', 'cursor-not-allowed');
			calculateButton.classList.add('cursor-pointer');
		} else {
			calculateButton.classList.add('opacity-50', 'cursor-not-allowed');
			calculateButton.classList.remove('cursor-pointer');
		}
	}
}


function focusFirstInput() {
	// Skip auto-focus on mobile devices to avoid jarring keyboard popup
	if (isMobileDevice()) {
		return;
	}
	
	const activeSection = document.querySelector(`[data-section="${state.currentTab}"]`);
	const firstInput = activeSection.querySelector('input');
	if (firstInput) {
		firstInput.focus();
	}
}

function isMobileDevice() {
	// Check for mobile devices using multiple methods
	const userAgent = navigator.userAgent || navigator.vendor || window.opera;
	
	// Check for touch capability and small screen
	const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
	const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
	
	// Check user agent for mobile indicators
	const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
	
	return hasTouch && (isSmallScreen || isMobileUserAgent);
}

function handleKeyboardNavigation(e) {
	// Tab switching with Ctrl/Cmd + 1/2/3
	if ((e.ctrlKey || e.metaKey) && ['1', '2', '3'].includes(e.key)) {
		e.preventDefault();
		const tabMapping = { '1': 'pace', '2': 'time', '3': 'distance' };
		const targetTab = tabMapping[e.key];
		if (targetTab !== state.currentTab) {
			switchTab(targetTab);
		}
		return;
	}
	
	// Arrow keys for tab navigation when focused on tabs
	if (e.target.matches('[role="tab"]')) {
		const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
		const currentIndex = tabs.indexOf(e.target);
		let targetIndex = currentIndex;
		
		if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
			targetIndex = (currentIndex + 1) % tabs.length;
		} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
			targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
		} else if (e.key === 'Home') {
			targetIndex = 0;
		} else if (e.key === 'End') {
			targetIndex = tabs.length - 1;
		} else {
			return;
		}
		
		e.preventDefault();
		tabs[targetIndex].focus();
	}
}

function switchTab(tabName) {
	const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
	if (targetTab) {
		targetTab.click();
		// Focus will be managed in the tab click handler
	}
}

function updateTabNavigation() {
	document.querySelectorAll('[role="tab"]').forEach((tab, index) => {
		const isActive = tab.dataset.tab === state.currentTab;
		tab.setAttribute('aria-selected', isActive);
		tab.setAttribute('tabindex', isActive ? '0' : '-1');
	});
}

function populateAutocomplete() {
	const datalist = document.getElementById('distance-suggestions');
	const suggestions = distanceSuggestions[state.distanceUnit];
	
	datalist.innerHTML = suggestions
		.map(distance => `<option value="${distance}">${distance} ${state.distanceUnit}</option>`)
		.join('');
}

function updateHintTexts() {
	const unit = state.distanceUnit;
	
	// Update pace hint texts
	const timePaceHint = document.getElementById('time-pace-hint');
	const distancePaceHint = document.getElementById('distance-pace-hint');
	
	if (timePaceHint) {
		timePaceHint.textContent = `Enter your pace per ${unit}`;
	}
	if (distancePaceHint) {
		distancePaceHint.textContent = `Enter your pace per ${unit}`;
	}
	
	// Update distance hint texts
	const paceDistanceHint = document.getElementById('pace-distance-hint');
	const timeDistanceHint = document.getElementById('time-distance-hint');
	
	if (paceDistanceHint) {
		paceDistanceHint.textContent = `Enter distance in ${unit}`;
	}
	if (timeDistanceHint) {
		timeDistanceHint.textContent = `Enter distance in ${unit}`;
	}
}

function saveCurrentTabState() {
	// Ensure tab state exists
	if (!state.tabStates[state.currentTab]) {
		state.tabStates[state.currentTab] = {
			inputs: {},
			validationStates: {},
			result: null,
			presetSelection: ""
		};
	}
	const currentTabState = state.tabStates[state.currentTab];
	
	// Save all input values for current tab
	const currentSection = document.querySelector(`[data-section="${state.currentTab}"]`);
	if (currentSection) {
		const inputs = currentSection.querySelectorAll('input[type="text"]');
		inputs.forEach(input => {
			currentTabState.inputs[input.id] = input.value;
			// Save validation states
			currentTabState.validationStates[input.id] = {
				hasError: input.classList.contains('error'),
				hasValid: input.classList.contains('valid')
			};
		});
		
		// Save preset selection
		const presetSelect = currentSection.querySelector('.preset-select');
		if (presetSelect) {
			currentTabState.presetSelection = presetSelect.value;
		}
	}
	
	// Save current result if it exists
	if (state.lastResult && state.lastResult.type === state.currentTab) {
		currentTabState.result = state.lastResult;
	}
}

function restoreTabState(tabName) {
	// Ensure tab state exists
	if (!state.tabStates[tabName]) {
		state.tabStates[tabName] = {
			inputs: {},
			validationStates: {},
			result: null,
			presetSelection: ""
		};
	}
	const tabState = state.tabStates[tabName];
	const targetSection = document.querySelector(`[data-section="${tabName}"]`);
	
	if (!targetSection) return;
	
	// Restore input values
	Object.entries(tabState.inputs).forEach(([inputId, value]) => {
		const input = document.getElementById(inputId);
		if (input) {
			input.value = value;
		}
	});
	
	// Restore validation states
	Object.entries(tabState.validationStates).forEach(([inputId, validationState]) => {
		const input = document.getElementById(inputId);
		if (input) {
			input.classList.remove('error', 'valid');
			if (validationState.hasError) {
				input.classList.add('error');
			} else if (validationState.hasValid) {
				input.classList.add('valid');
			}
		}
	});
	
	// Restore preset selection
	const presetSelect = targetSection.querySelector('.preset-select');
	if (presetSelect && tabState.presetSelection) {
		presetSelect.value = tabState.presetSelection;
	}
	
	// Restore result if it exists
	if (tabState.result) {
		state.lastResult = tabState.result;
		updateCalculatedResult();
	} else {
		// Clear result if no saved result for this tab
		resultDiv.classList.add('hidden');
		resultDiv.classList.remove('show', 'success', 'error');
		state.lastResult = null;
	}
}

function clearNonRelevantFields() {
	// This function is now replaced by saveCurrentTabState and restoreTabState
	// Keep for backward compatibility but make it empty
}

function generateComprehensiveResult() {
	if (!state.lastResult) {
		return `${resultLabel.textContent} ${resultValue.textContent}`;
	}

	const { type, data } = state.lastResult;
	let result = '';

	if (type === "pace") {
		const distInput = document.getElementById("pace-distance");
		const timeSeconds = getSegmentedTimeValue('pace-time');
		const time = calc.formatTime(timeSeconds, true);
		const distance = `${distInput.value} ${state.distanceUnit}`;
		
		result = `Running Pace Calculation:\n`;
		result += `Distance: ${distance}\n`;
		result += `Time: ${time}\n`;
		result += `Pace: ${calc.formatTime(data.pacePerKm)} /km (${calc.formatTime(data.pacePerMile)} /mile)`;
		
		// Add PR comparison if available
		if (data.prComparison) {
			const comparison = data.prComparison;
			result += `\n\nPersonal Record Comparison:\n`;
			result += `PR (${pr.getDistanceName(comparison.prDistance, comparison.prUnit)}): ${comparison.prTimeFormatted}\n`;
			result += `PR Pace: ${comparison.prPaceFormatted} /${comparison.prUnit}\n`;
			result += `Time Difference: ${comparison.isFaster ? '-' : '+'}${comparison.timeDifferenceFormatted} (${comparison.isFaster ? 'faster' : 'slower'})\n`;
			result += `Pace Difference: ${comparison.isFaster ? '-' : '+'}${comparison.paceDifferenceFormatted} /km (${comparison.isFaster ? 'faster' : 'slower'})`;
		}
	} else if (type === "time") {
		const distInput = document.getElementById("time-distance");
		const paceSeconds = getSegmentedPaceValue('time-pace');
		const pace = `${calc.formatTime(paceSeconds)} /${state.distanceUnit}`;
		const distance = `${distInput.value} ${state.distanceUnit}`;
		
		result = `Running Time Calculation:\n`;
		result += `Distance: ${distance}\n`;
		result += `Pace: ${pace}\n`;
		result += `Total Time: ${calc.formatTime(data.totalSeconds, true)}`;
	} else if (type === "distance") {
		const timeSeconds = getSegmentedTimeValue('distance-time');
		const paceSeconds = getSegmentedPaceValue('distance-pace');
		const time = calc.formatTime(timeSeconds, true);
		const pace = `${calc.formatTime(paceSeconds)} /${state.distanceUnit}`;
		
		result = `Running Distance Calculation:\n`;
		result += `Time: ${time}\n`;
		result += `Pace: ${pace}\n`;
		result += `Distance: ${data.km.toFixed(2)} km (${data.miles.toFixed(2)} miles)`;
	}

	return result;
}

function animateCopySuccess() {
	// Animate copy icon out
	copyIcon.classList.add('animate-icon-transition-out');
	copyBtn.classList.add('animate-pulse-success');
	
	// After copy icon fades out, show checkmark with animation
	setTimeout(() => {
		copyIcon.classList.add('hidden');
		copyIcon.classList.remove('animate-icon-transition-out');
		checkIcon.classList.remove('hidden');
		checkIcon.classList.add('animate-icon-transition-in');
	}, 200);
	
	// Reset after 2 seconds total
	setTimeout(() => {
		// Animate checkmark out
		checkIcon.classList.remove('animate-icon-transition-in');
		checkIcon.classList.add('animate-icon-transition-out');
		
		// After checkmark fades out, show copy icon with animation
		setTimeout(() => {
			checkIcon.classList.add('hidden');
			checkIcon.classList.remove('animate-icon-transition-out');
			copyIcon.classList.remove('hidden');
			copyIcon.classList.add('animate-icon-transition-in');
			copyBtn.classList.remove('animate-pulse-success');
			
			// Clean up animation class
			setTimeout(() => {
				copyIcon.classList.remove('animate-icon-transition-in');
			}, 200);
		}, 200);
	}, 2000);
}

async function copyToClipboard(text) {
	try {
		await navigator.clipboard.writeText(text);
		animateCopySuccess();
		return true;
	} catch (err) {
		// Fallback for older browsers
		try {
			const textArea = document.createElement('textarea');
			textArea.value = text;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			
			animateCopySuccess();
			return true;
		} catch (fallbackErr) {
			console.error('Failed to copy text:', fallbackErr);
			return false;
		}
	}
}

async function shareContent(text) {
	// Check if Web Share API is available (mainly on mobile)
	if (navigator.share && isMobileDevice()) {
		try {
			await navigator.share({
				title: 'Running Pace Calculation',
				text: text
			});
			return true;
		} catch (err) {
			// User cancelled sharing or share failed
			console.log('Share cancelled or failed:', err);
			return false;
		}
	}
	
	// Fallback to clipboard
	return await copyToClipboard(text);
}

function showLoading() {
	resultDiv.classList.add('hidden');
	resultDiv.classList.remove('show', 'success', 'error');
	loadingDiv.classList.remove('hidden');
	loadingDiv.classList.add('animate-fade-in');
}

function hideLoading() {
	loadingDiv.classList.add('hidden');
	loadingDiv.classList.remove('animate-fade-in');
}

function scrollToResults() {
	// Check if results are visible and if scrolling is needed
	if (resultDiv.classList.contains('hidden')) return;
	
	// Get the results element position
	const resultsRect = resultDiv.getBoundingClientRect();
	const viewportHeight = window.innerHeight;
	
	// Check if results are already fully visible
	const isFullyVisible = resultsRect.top >= 0 && resultsRect.bottom <= viewportHeight;
	
	// Only scroll if results are not fully visible
	if (!isFullyVisible) {
		// Calculate scroll position to center the results in viewport
		const elementTop = resultsRect.top + window.pageYOffset;
		const elementHeight = resultsRect.height;
		const offset = (viewportHeight - elementHeight) / 2;
		const targetPosition = elementTop - Math.max(offset, 60); // Minimum 60px from top
		
		// Smooth scroll to the calculated position
		window.scrollTo({
			top: Math.max(0, targetPosition), // Ensure we don't scroll above page top
			behavior: 'smooth'
		});
	}
}

function generateRaceSplits() {
	if (!state.lastResult) return null;
	
	const { type, data } = state.lastResult;
	let distance, pacePerUnit;
	
	// Determine distance and pace based on calculation type
	if (type === "pace") {
		// Get distance from input
		const distanceInput = document.getElementById("pace-distance");
		distance = parseFloat(distanceInput.value);
		pacePerUnit = state.distanceUnit === "km" ? data.pacePerKm : data.pacePerMile;
	} else if (type === "time") {
		// Get distance from input
		const distanceInput = document.getElementById("time-distance");
		distance = parseFloat(distanceInput.value);
		pacePerUnit = getSegmentedPaceValue('time-pace');
	} else if (type === "distance") {
		// Use calculated distance
		distance = state.distanceUnit === "km" ? data.km : data.miles;
		pacePerUnit = getSegmentedPaceValue('distance-pace');
	} else {
		return null;
	}
	
	// Don't show splits for very short distances
	if (distance < 0.5) return null;
	
	const unit = state.distanceUnit;
	const splits = [];
	
	// Generate splits for each full unit (1km, 2km, 3km, etc.)
	const totalSplits = Math.floor(distance);
	
	for (let i = 1; i <= totalSplits; i++) {
		const cumulativeTime = pacePerUnit * i;
		splits.push({
			distance: i,
			unit: unit,
			time: calc.formatTime(cumulativeTime, true),
			timeSeconds: cumulativeTime
		});
	}
	
	// Add final split for fractional distance if needed
	const remainder = distance - totalSplits;
	if (remainder > 0.01) { // More than 0.01 units (10m for km, ~50ft for miles)
		const cumulativeTime = pacePerUnit * distance;
		splits.push({
			distance: distance.toFixed(2),
			unit: unit,
			time: calc.formatTime(cumulativeTime, true),
			timeSeconds: cumulativeTime,
			isFinish: true
		});
	}
	
	return {
		splits,
		totalDistance: distance,
		unit,
		pacePerUnit
	};
}


function createSplitsAccordion() {
	const splitsData = generateRaceSplits();
	if (!splitsData) return '';
	
	const { splits, totalDistance, unit, pacePerUnit } = splitsData;
	
	const splitsHtml = splits.map(split => {
		// Determine split type styling and label
		let splitLabel, splitClass = '';
		
		if (split.isFinish) {
			splitLabel = `Finish (${split.distance} ${state.distanceUnit})`;
			splitClass = 'font-semibold border-t pt-2 mt-1';
		} else {
			splitLabel = `${split.distance} ${state.distanceUnit}`;
		}
		
		return `
			<div class="splits-row flex justify-between items-center py-1 px-2 ${splitClass}">
				<span class="text-sm">
					${splitLabel}
				</span>
				<span class="font-mono text-sm">${split.time}</span>
			</div>
		`;
	}).join('');
	
	return `
		<div class="mt-3 pt-3 border-t" style="border-color: var(--color-border-subtle);">
			<button 
				id="splits-toggle" 
				class="w-full flex items-center justify-between py-2 text-left transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
				aria-expanded="false"
				aria-controls="splits-content"
			>
				<span class="text-sm font-medium" style="color: var(--color-text-secondary);">
					Show Splits (${totalDistance % 1 === 0 ? totalDistance : totalDistance.toFixed(2)} ${state.distanceUnit})
				</span>
				<svg id="splits-chevron" class="w-4 h-4 transition-transform duration-200" style="color: var(--color-text-tertiary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
				</svg>
			</button>
			<div 
				id="splits-content" 
				class="hidden mt-2 space-y-1 px-3 py-2 rounded-lg" 
				style="background-color: var(--color-surface-secondary);"
				aria-hidden="true"
			>
				<div class="flex justify-between items-center pb-2 mb-2 border-b text-xs font-medium" style="border-color: var(--color-border-subtle); color: var(--color-text-tertiary);">
					<span>Distance</span>
					<span>Cumulative Time</span>
				</div>
				${splitsHtml}
				<div class="text-xs mt-2 pt-2 border-t" style="border-color: var(--color-border-subtle); color: var(--color-text-tertiary);">
					Pace: ${calc.formatTime(pacePerUnit)} /${state.distanceUnit}
				</div>
			</div>
		</div>
	`;
}

function setupSplitsAccordion() {
	const splitsToggle = document.getElementById('splits-toggle');
	const splitsContent = document.getElementById('splits-content');
	const splitsChevron = document.getElementById('splits-chevron');
	
	if (!splitsToggle || !splitsContent || !splitsChevron) return;
	
	splitsToggle.addEventListener('click', () => {
		const isExpanded = splitsToggle.getAttribute('aria-expanded') === 'true';
		
		if (isExpanded) {
			// Collapse
			splitsContent.classList.add('hidden');
			splitsContent.setAttribute('aria-hidden', 'true');
			splitsToggle.setAttribute('aria-expanded', 'false');
			splitsChevron.style.transform = 'rotate(0deg)';
		} else {
			// Expand
			splitsContent.classList.remove('hidden');
			splitsContent.setAttribute('aria-hidden', 'false');
			splitsToggle.setAttribute('aria-expanded', 'true');
			splitsChevron.style.transform = 'rotate(180deg)';
			
			// Auto-scroll to ensure expanded content is visible
			setTimeout(() => {
				scrollToExpandedSplits();
			}, 100); // Small delay to allow content to render
		}
	});
}

function scrollToExpandedSplits() {
	const splitsContent = document.getElementById('splits-content');
	if (!splitsContent || splitsContent.classList.contains('hidden')) return;
	
	// Get the splits content position and dimensions
	const splitsRect = splitsContent.getBoundingClientRect();
	const viewportHeight = window.innerHeight;
	
	// Check if the bottom of the expanded content is visible
	const isBottomVisible = splitsRect.bottom <= viewportHeight;
	
	// Only scroll if the bottom is cut off
	if (!isBottomVisible) {
		// Calculate how much we need to scroll to show the bottom with some padding
		const scrollOffset = splitsRect.bottom - viewportHeight + 20; // 20px padding
		const currentScrollTop = window.pageYOffset;
		const targetScrollTop = currentScrollTop + scrollOffset;
		
		// Smooth scroll to show the expanded content
		window.scrollTo({
			top: targetScrollTop,
			behavior: 'smooth'
		});
	}
}

function updateUnitToggles() {
	document.querySelectorAll("[data-unit]").forEach((btn) => {
		const isActive = btn.dataset.unit === state.distanceUnit;
		if (isActive) {
			btn.classList.add("active");
			btn.setAttribute('aria-pressed', 'true');
		} else {
			btn.classList.remove("active");
			btn.setAttribute('aria-pressed', 'false');
		}
	});
	populatePresetSelects();
	populateAutocomplete();
	updateCalculatedResult();
	updateHintTexts();
}

function populatePresetSelects() {
	const unit = state.distanceUnit;
	const options =
		`<option value="">-- Pick an event --</option>` +
		Object.entries(presets)
			.map(
				([key, value]) =>
					`<option value="${key}">${key.replace("-", " ").toUpperCase()} (${
						value[unit] % 1 === 0 ? value[unit] : value[unit].toFixed(3)
					} ${unit})</option>`
			)
			.join("");

	document
		.querySelectorAll(".preset-select")
		.forEach((select) => (select.innerHTML = options));
}

function handleFormSubmit(e) {
	e.preventDefault();
	
	// Show loading state
	showLoading();
	
	// Simulate small delay for loading effect
	setTimeout(() => {
		let label = "",
			value = "";

		try {
		if (state.currentTab === "pace") {
			const distInput = document.getElementById("pace-distance");
			
			// Validate inputs
			const timeValidation = validateSegmentedInput('pace-time', true);
			const distValidation = validateInput(distInput, calc.validateDistanceInput);
			
			if (!timeValidation.valid) {
				ErrorManager.setSegmentedError('pace-time', timeValidation.message);
			}
			if (!distValidation.valid) {
				// Distance validation error display handled by validateInput
			}
			
			if (!timeValidation.valid || !distValidation.valid) {
				throw new Error("Please fix the input errors before calculating.");
			}
			
			const { pacePerKm, pacePerMile } = calc.calculatePace(
				timeValidation.value,
				distValidation.value,
				state.distanceUnit
			);
			label = "Your Pace:";
			if (state.distanceUnit === "km") {
				value = `${calc.formatTime(pacePerKm)} /km`;
			} else {
				value = `${calc.formatTime(pacePerMile)} /mile`;
			}
			
			// Check for PR comparison
			const prComparison = pr.comparePaceWithPR(
				timeValidation.value,
				distValidation.value,
				state.distanceUnit
			);
			
			// Store the result for unit conversion
			const result = {
				type: state.currentTab,
				data: { pacePerKm, pacePerMile, prComparison }
			};
			state.lastResult = result;
			state.tabStates[state.currentTab].result = result;
		} else if (state.currentTab === "time") {
			const distInput = document.getElementById("time-distance");
			
			// Validate inputs
			const paceValidation = validateSegmentedInput('time-pace', false);
			const distValidation = validateInput(distInput, calc.validateDistanceInput);
			
			if (!paceValidation.valid) {
				ErrorManager.setSegmentedError('time-pace', paceValidation.message);
			}
			if (!distValidation.valid) {
				// Distance validation error display handled by validateInput
			}
			
			if (!paceValidation.valid || !distValidation.valid) {
				throw new Error("Please fix the input errors before calculating.");
			}
			
			const totalSeconds = calc.calculateTime(
				paceValidation.value,
				distValidation.value,
				state.distanceUnit,
				state.distanceUnit
			);
			label = "Your Time:";
			value = calc.formatTime(totalSeconds, true);
			// Store the result for unit conversion
			const result = {
				type: state.currentTab,
				data: { totalSeconds }
			};
			state.lastResult = result;
			state.tabStates[state.currentTab].result = result;
		} else if (state.currentTab === "distance") {
			// Validate inputs
			const timeValidation = validateSegmentedInput('distance-time', true);
			const paceValidation = validateSegmentedInput('distance-pace', false);
			
			if (!timeValidation.valid) {
				ErrorManager.setSegmentedError('distance-time', timeValidation.message);
			}
			if (!paceValidation.valid) {
				ErrorManager.setSegmentedError('distance-pace', paceValidation.message);
			}
			
			if (!timeValidation.valid || !paceValidation.valid) {
				throw new Error("Please fix the input errors before calculating.");
			}
			
			const { km, miles } = calc.calculateDistance(
				timeValidation.value,
				paceValidation.value,
				state.distanceUnit
			);
			label = "Your Distance:";
			if (state.distanceUnit === "km") {
				value = `${km.toFixed(2)} km`;
			} else {
				value = `${miles.toFixed(2)} miles`;
			}
			// Store the result for unit conversion
			const result = {
				type: state.currentTab,
				data: { km, miles }
			};
			state.lastResult = result;
			state.tabStates[state.currentTab].result = result;
		}
		hideLoading();
		showResult(label, value, 'success');
	} catch (err) {
		hideLoading();
		showResult('Error', err.message || "Please check your inputs. All fields are required.", 'error');
	}
}, 300); // 300ms delay for loading effect
}

function showResult(label, value, type = 'success') {
	resultLabel.textContent = label;
	resultValue.innerHTML = value;
	
	// Add PR comparison if available for pace calculations
	if (state.lastResult && state.lastResult.data && state.lastResult.data.prComparison) {
		const comparison = state.lastResult.data.prComparison;
		const comparisonHtml = `
			<div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
				<div class="text-sm text-gray-600 dark:text-gray-400">
					<div class="flex justify-between items-center">
						<span>PR (${pr.getDistanceName(comparison.prDistance, comparison.prUnit)}):</span>
						<span class="font-mono">${comparison.prTimeFormatted}</span>
					</div>
					<div class="flex justify-between items-center mt-1">
						<span>PR Pace:</span>
						<span class="font-mono">${comparison.prPaceFormatted} /${comparison.prUnit}</span>
					</div>
					<div class="flex justify-between items-center mt-1">
						<span>Time Difference:</span>
						<span class="font-mono ${comparison.isFaster ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
							${comparison.isFaster ? '-' : '+'}${comparison.timeDifferenceFormatted} 
							(${comparison.isFaster ? 'faster' : 'slower'})
						</span>
					</div>
					<div class="flex justify-between items-center mt-1">
						<span>Pace Difference:</span>
						<span class="font-mono ${comparison.isFaster ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
							${comparison.isFaster ? '-' : '+'}${comparison.paceDifferenceFormatted} /km
						</span>
					</div>
				</div>
			</div>
		`;
		resultValue.innerHTML += comparisonHtml;
	}
	
	// Add race splits accordion for successful calculations
	if (type === 'success') {
		const splitsHtml = createSplitsAccordion();
		if (splitsHtml) {
			resultValue.innerHTML += splitsHtml;
		}
	}
	
	// Reset all classes
	resultDiv.classList.remove('hidden', 'success', 'error', 'opacity-0', 'scale-95');
	resultDiv.classList.remove('bg-indigo-50', 'dark:bg-gray-700', 'border-l-4', 'border-indigo-500');
	
	// Add appropriate classes based on type
	if (type === 'success') {
		resultDiv.classList.add('success', 'bg-indigo-50', 'dark:bg-gray-700', 'border-l-4', 'border-indigo-500');
	} else if (type === 'error') {
		resultDiv.classList.add('error');
	}
	
	// Show with animation
	resultDiv.classList.add('show', 'animate-bounce-in');
	
	// Auto-scroll to results after a brief delay to ensure element is visible
	setTimeout(() => {
		scrollToResults();
	}, 200);
	
	// Remove animation class and setup interactions after animation completes
	setTimeout(() => {
		resultDiv.classList.remove('animate-bounce-in');
		// Setup splits accordion if present
		setupSplitsAccordion();
	}, 600);
}

function updateCalculatedResult() {
	if (!state.lastResult || resultDiv.classList.contains("hidden")) return;
	
	const { type, data } = state.lastResult;
	let label = "", value = "";
	
	if (type === "pace") {
		label = "Your Pace:";
		if (state.distanceUnit === "km") {
			value = `${calc.formatTime(data.pacePerKm)} /km`;
		} else {
			value = `${calc.formatTime(data.pacePerMile)} /mile`;
		}
	} else if (type === "time") {
		label = "Your Time:";
		value = calc.formatTime(data.totalSeconds, true);
	} else if (type === "distance") {
		label = "Your Distance:";
		if (state.distanceUnit === "km") {
			value = `${data.km.toFixed(2)} km`;
		} else {
			value = `${data.miles.toFixed(2)} miles`;
		}
	}
	
	showResult(label, value);
}

function clearCurrentTab() {
	const currentTab = state.currentTab;
	const currentSection = document.querySelector(`[data-section="${currentTab}"]`);
	
	if (!currentSection) return;
	
	// Clear only inputs in the current tab (preserving placeholders)
	currentSection.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
		input.value = '';
		input.classList.remove('error', 'valid');
	});
	
	// Clear validation errors for current tab only
	currentSection.querySelectorAll('[id$="-error"]').forEach(error => {
		error.classList.add('hidden');
		error.textContent = '';
	});
	
	// Clear segmented input errors for current tab only
	if (currentTab === 'pace') {
		ErrorManager.clearSegmentedState('pace-time');
	} else if (currentTab === 'time') {
		ErrorManager.clearSegmentedState('time-pace');
	} else if (currentTab === 'distance') {
		ErrorManager.clearSegmentedState('distance-time');
		ErrorManager.clearSegmentedState('distance-pace');
	}
	
	// Reset preset dropdown for current tab only
	const presetSelect = currentSection.querySelector('.preset-select');
	if (presetSelect) {
		presetSelect.selectedIndex = 0;
	}
	
	// Clear result only if it belongs to current tab
	if (state.lastResult && state.lastResult.type === currentTab) {
		resultDiv.classList.add("hidden");
		resultDiv.classList.remove('show', 'success', 'error');
		state.lastResult = null;
		// Also clear from tab state
		if (state.tabStates[currentTab]) {
			state.tabStates[currentTab].result = null;
		}
	}
	
	// Hide loading if visible
	loadingDiv.classList.add("hidden");
	
	// Focus first input (only on non-mobile devices)
	focusFirstInput();
	
	// Update button state after clearing
	updateCalculateButtonState();
}

export { populatePresetSelects, populateAutocomplete, updateCalculatedResult, updateHintTexts };

export function initUI() {
	// Validate critical DOM elements exist
	const requiredElements = [
		'calculator-form',
		'result', 
		'result-label',
		'result-value',
		'loading',
		'copy-result-btn',
		'clear-btn'
	];
	
	for (const id of requiredElements) {
		const element = document.getElementById(id);
		if (!element) {
			console.error(`Required element missing: ${id}`);
			return;
		}
	}
	
	console.log('All required DOM elements found');
	
	// Initial setup
	updateTabNavigation();

	// Setup input validation
	setupInputValidation();
	
	// Initial button state check
	updateCalculateButtonState();

	// Global keyboard event listeners
	document.addEventListener('keydown', handleKeyboardNavigation);
	
	// Enter key to submit form from any input
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Enter' && e.target.matches('input')) {
			e.preventDefault();
			form.dispatchEvent(new Event('submit'));
		}
	});

	// Event Listeners (unit toggles are now handled by settings.js)

	document.querySelectorAll("[data-tab]").forEach((tab) => {
		console.log('Adding event listener to tab:', tab);
		tab.addEventListener("click", () => {
			console.log('Tab clicked:', tab.dataset.tab);
			state.currentTab = tab.dataset.tab;
			// Save current tab state before switching
			saveCurrentTabState();
			
			document.querySelectorAll(".btn-tab").forEach((t) => t.classList.remove("active"));
			tab.classList.add("active");
			updateTabNavigation();
			document
				.querySelectorAll(".form-section")
				.forEach((s) => s.classList.add("hidden"));
			document
				.querySelector(`[data-section="${state.currentTab}"]`)
				.classList.remove("hidden");
			loadingDiv.classList.add("hidden");
			
			// Restore the target tab's state
			restoreTabState(state.currentTab);
			
			// Update button state for new tab
			updateCalculateButtonState();
			
			// Focus first input in new tab after a short delay (only on non-mobile)
			setTimeout(() => focusFirstInput(), 100);
		});
		
		// Tab keyboard navigation
		tab.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				tab.click();
			}
		});
	});

	document.querySelectorAll(".preset-select").forEach((select) => {
		select.addEventListener("change", (e) => {
			const presetKey = e.target.value;
			if (!presetKey) return;
			const distanceInput = document.getElementById(
				`${state.currentTab}-distance`
			);
			distanceInput.value = presets[presetKey][state.distanceUnit];
			// Save preset selection to tab state
			state.tabStates[state.currentTab].presetSelection = presetKey;
			
			// Validate the new value
			if (distanceInput) {
				validateInput(distanceInput, calc.validateDistanceInput);
			}
			
			// Update button state after preset selection
			updateCalculateButtonState();
		});
	});

	form.addEventListener("submit", handleFormSubmit);
	console.log('Added form submit listener to:', form);
	
	const clearBtn = document.getElementById("clear-btn");
	console.log('Clear button found:', clearBtn);
	clearBtn.addEventListener("click", clearCurrentTab);
	
	// Copy/Share button functionality
	copyBtn.addEventListener('click', async () => {
		const comprehensiveText = generateComprehensiveResult();
		
		if (isMobileDevice() && navigator.share) {
			// Use native share sheet on mobile
			const success = await shareContent(comprehensiveText);
			if (!success) {
				// Fallback to clipboard if share was cancelled or failed
				const copySuccess = await copyToClipboard(comprehensiveText);
				if (!copySuccess) {
					alert('Failed to copy to clipboard');
				}
			}
		} else {
			// Desktop: copy to clipboard
			const success = await copyToClipboard(comprehensiveText);
			if (!success) {
				alert('Failed to copy to clipboard');
			}
		}
	});
	
	// Focus first input on page load (only on non-mobile devices)
	setTimeout(() => focusFirstInput(), 100);
}