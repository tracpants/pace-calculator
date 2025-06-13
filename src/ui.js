import * as calc from "./calculator.js";
import { getRaceDistances, getDistanceSuggestions, getDistanceDisplayName, findDistanceKey } from "./distances.js";
import { safeGetElements, safeAddEventListener, robustInit } from "./dom-ready.js";
import * as pr from "./pr.js";
import { state } from "./state.js";

// DOM Elements (will be initialized in initUI)
let form, resultDiv, resultLabel, resultValue, loadingDiv, copyBtn, copyIcon, checkIcon, savePrBtn, updatePrBtn;

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
		const {currentTab} = state;
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
	const {value} = inputElement;
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
			// Find matching preset using centralized function
			const matchingKey = findDistanceKey(currentValue, state.distanceUnit, 0.001);
			
			if (matchingKey) {
				// Set the dropdown to the matching preset
				presetSelect.value = matchingKey;
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
	document.querySelectorAll('[role="tab"]').forEach(tab => {
		const isActive = tab.dataset.tab === state.currentTab;
		tab.setAttribute('aria-selected', isActive);
		tab.setAttribute('tabindex', isActive ? '0' : '-1');
	});
}

function populateAutocomplete() {
	const datalist = document.getElementById('distance-suggestions');
	const suggestions = getDistanceSuggestions()[state.distanceUnit];
	
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
		result += `Distance: ${calc.formatDistance(data.km)} km (${calc.formatDistance(data.miles)} miles)`;
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
	} catch {
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
				text
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
			unit,
			time: calc.formatTime(cumulativeTime, true),
			timeSeconds: cumulativeTime
		});
	}
	
	// Add final split for fractional distance if needed
	const remainder = distance - totalSplits;
	if (remainder > 0.01) { // More than 0.01 units (10m for km, ~50ft for miles)
		const cumulativeTime = pacePerUnit * distance;
		splits.push({
			distance: calc.formatDistance(distance),
			unit,
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
	
	const { splits, totalDistance, pacePerUnit } = splitsData;
	
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
		<div class="mt-4 border rounded-lg overflow-hidden" style="border-color: var(--color-border-subtle);">
			<button 
				id="splits-toggle" 
				class="w-full flex items-center justify-between py-3 px-4 text-left transition-colors" 
				style="background: linear-gradient(to right, var(--color-surface), var(--color-surface-secondary)); border-bottom: 1px solid var(--color-border-subtle);"
				aria-expanded="false"
				aria-controls="splits-content"
			>
				<div class="flex items-center">
					<svg class="w-4 h-4 mr-2" style="color: var(--color-interactive-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
					<span class="text-sm font-medium" style="color: var(--color-text-primary);">
						Race Splits (${calc.formatDistance(totalDistance)} ${state.distanceUnit})
					</span>
				</div>
				<svg id="splits-chevron" class="w-4 h-4 transition-transform duration-200" style="color: var(--color-text-tertiary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
				</svg>
			</button>
			<div 
				id="splits-content" 
				class="hidden px-4 py-3" 
				style="background-color: var(--color-surface);"
				aria-hidden="true"
			>
				<div class="flex justify-between items-center pb-2 mb-3 border-b text-xs font-semibold uppercase tracking-wide" style="border-color: var(--color-border-subtle); color: var(--color-text-tertiary);">
					<span>Distance</span>
					<span>Cumulative Time</span>
				</div>
				<div class="space-y-1">
					${splitsHtml}
				</div>
				<div class="text-xs mt-3 pt-3 border-t font-medium" style="border-color: var(--color-border-subtle); color: var(--color-text-secondary);">
					Average Pace: ${calc.formatTime(pacePerUnit)} /${state.distanceUnit}
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


function populatePresetSelects() {
	const unit = state.distanceUnit;
	const raceDistances = getRaceDistances();
	const options =
		`<option value="">-- Pick an event --</option>${ 
		Object.entries(raceDistances)
			.map(
				([key, value]) =>
					`<option value="${key}">${getDistanceDisplayName(key)} (${
						calc.formatDistance(value[unit], 3)
					} ${unit})</option>`
			)
			.join("")}`;

	document
		.querySelectorAll(".preset-select")
		.forEach(select => (select.innerHTML = options));
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
				value = `${calc.formatDistance(km)} km`;
			} else {
				value = `${calc.formatDistance(miles)} miles`;
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
			<div class="mt-4 p-4 rounded-lg" style="background: linear-gradient(to right, var(--color-surface-secondary), color-mix(in srgb, var(--color-surface-secondary) 80%, transparent)); border: 1px solid var(--color-border-subtle);">
				<h3 class="text-base font-semibold mb-3 flex items-center" style="color: var(--color-text-primary);">
					<svg class="w-4 h-4 mr-2" style="color: var(--color-interactive-primary);" fill="currentColor" viewBox="0 0 24 24">
						<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
					</svg>
					Personal Record Comparison
				</h3>
				<div class="space-y-2">
					<div class="flex justify-between items-center">
						<span class="text-sm font-medium" style="color: var(--color-text-secondary);">PR (${pr.getDistanceName(comparison.prDistance, comparison.prUnit)}):</span>
						<span class="font-mono text-sm font-semibold" style="color: var(--color-text-primary);">${comparison.prTimeFormatted}</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm font-medium" style="color: var(--color-text-secondary);">PR Pace:</span>
						<span class="font-mono text-sm font-semibold" style="color: var(--color-text-primary);">${comparison.prPaceFormatted} /${comparison.prUnit}</span>
					</div>
					<div class="flex justify-between items-center pt-2 border-t" style="border-color: var(--color-border-subtle);">
						<span class="text-sm font-medium" style="color: var(--color-text-secondary);">Time Difference:</span>
						<span class="font-mono text-sm font-bold" style="color: ${comparison.isFaster ? 'var(--color-status-success)' : 'var(--color-status-error)'};">
							${comparison.isFaster ? '-' : '+'}${comparison.timeDifferenceFormatted} 
							(${comparison.isFaster ? 'faster' : 'slower'})
						</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm font-medium" style="color: var(--color-text-secondary);">Pace Difference:</span>
						<span class="font-mono text-sm font-bold" style="color: ${comparison.isFaster ? 'var(--color-status-success)' : 'var(--color-status-error)'};">
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
	resultDiv.classList.remove('success', 'error');
	
	// Add appropriate classes based on type
	if (type === 'success') {
		resultDiv.classList.add('success');
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
		// Update PR button visibility
		updatePRButtonVisibility();
	}, 600);
}

function updatePRButtonVisibility() {
	if (!state.lastResult) {
		if (savePrBtn) savePrBtn.classList.add('hidden');
		if (updatePrBtn) updatePrBtn.classList.add('hidden');
		return;
	}

	const { type } = state.lastResult;
	
	// Only show PR buttons for pace calculations (not time or distance calculations)
	if (type !== 'pace') {
		if (savePrBtn) savePrBtn.classList.add('hidden');
		if (updatePrBtn) updatePrBtn.classList.add('hidden');
		return;
	}

	// Get current calculation distance
	const distanceInput = document.getElementById("pace-distance");
	const distance = parseFloat(distanceInput.value);
	
	if (!distance || distance <= 0) {
		if (savePrBtn) savePrBtn.classList.add('hidden');
		if (updatePrBtn) updatePrBtn.classList.add('hidden');
		return;
	}

	// Normalize distance to km for PR lookup
	const distanceKm = state.distanceUnit === "km" ? distance : distance * 1.609344;
	
	// Check if there's an existing PR for this distance
	const existingPR = pr.getPRForDistance(distanceKm);
	
	if (existingPR) {
		// Get current time from calculation
		const currentTimeSeconds = getSegmentedTimeValue('pace-time');
		
		// Show update button if current time is better (faster) than existing PR
		if (currentTimeSeconds < existingPR.timeSeconds) {
			if (savePrBtn) savePrBtn.classList.add('hidden');
			if (updatePrBtn) {
				updatePrBtn.classList.remove('hidden');
				updatePrBtn.title = `Update PR (current: ${calc.formatTime(existingPR.timeSeconds, true)})`;
			}
		} else {
			// Current time is slower, no button needed
			if (savePrBtn) savePrBtn.classList.add('hidden');
			if (updatePrBtn) updatePrBtn.classList.add('hidden');
		}
	} else {
		// No existing PR, show save button
		if (savePrBtn) {
			savePrBtn.classList.remove('hidden');
			savePrBtn.title = `Save as Personal Record`;
		}
		if (updatePrBtn) updatePrBtn.classList.add('hidden');
	}
}

function handleSavePR() {
	if (!state.lastResult || state.lastResult.type !== 'pace') return;
	
	const distanceInput = document.getElementById("pace-distance");
	const distance = parseFloat(distanceInput.value);
	const timeSeconds = getSegmentedTimeValue('pace-time');
	
	if (!distance || !timeSeconds) return;
	
	// Save the PR
	const success = pr.setPR(distance, state.distanceUnit, timeSeconds);
	
	if (success) {
		// Show brief success feedback
		savePrBtn.style.color = 'var(--color-status-success)';
		savePrBtn.title = 'Personal Record Saved!';
		
		// Reset after 2 seconds
		setTimeout(() => {
			savePrBtn.style.color = 'var(--color-text-tertiary)';
			updatePRButtonVisibility(); // This will hide the save button
		}, 2000);
	}
}

function handleUpdatePR() {
	if (!state.lastResult || state.lastResult.type !== 'pace') return;
	
	const distanceInput = document.getElementById("pace-distance");
	const distance = parseFloat(distanceInput.value);
	const timeSeconds = getSegmentedTimeValue('pace-time');
	
	if (!distance || !timeSeconds) return;
	
	// Update the PR (this will overwrite the existing one)
	const success = pr.setPR(distance, state.distanceUnit, timeSeconds);
	
	if (success) {
		// Show brief success feedback
		updatePrBtn.style.color = 'var(--color-status-success)';
		updatePrBtn.title = 'Personal Record Updated!';
		
		// Reset after 2 seconds
		setTimeout(() => {
			updatePrBtn.style.color = 'var(--color-text-tertiary)';
			updatePRButtonVisibility(); // This will hide the update button
		}, 2000);
	}
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
			value = `${calc.formatDistance(data.km)} km`;
		} else {
			value = `${calc.formatDistance(data.miles)} miles`;
		}
	}
	
	showResult(label, value);
	// Update PR button visibility when result is updated  
	updatePRButtonVisibility();
}

function clearCurrentTab() {
	const {currentTab} = state;
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
	
	// Removed auto-focus to preserve natural tab order
	
	// Update button state after clearing
	updateCalculateButtonState();
}

export { populatePresetSelects, populateAutocomplete, updateCalculatedResult, updateHintTexts };

/**
 * Core UI initialization logic (called by robustInitUI)
 */
async function coreInitUI() {
	console.log('🚀 Starting core UI initialization');
	
	// Get all required DOM elements with error handling
	const elementIds = [
		'calculator-form',
		'result', 
		'result-label',
		'result-value',
		'loading',
		'copy-result-btn',
		'copy-icon',
		'check-icon',
		'clear-btn'
	];
	
	const optionalElementIds = [
		'save-pr-btn',
		'update-pr-btn'
	];
	
	// Get required elements
	const elements = safeGetElements(elementIds, true);
	
	// Get optional elements
	const optionalElements = safeGetElements(optionalElementIds, false);
	
	// Assign to module variables
	form = elements['calculator-form'];
	resultDiv = elements['result'];
	resultLabel = elements['result-label'];
	resultValue = elements['result-value'];
	loadingDiv = elements['loading'];
	copyBtn = elements['copy-result-btn'];
	copyIcon = elements['copy-icon'];
	checkIcon = elements['check-icon'];
	savePrBtn = optionalElements['save-pr-btn'];
	updatePrBtn = optionalElements['update-pr-btn'];
	
	// Verify tab elements exist
	const tabElements = document.querySelectorAll("[data-tab]");
	const sectionElements = document.querySelectorAll("[data-section]");
	
	if (tabElements.length === 0) {
		throw new Error('No tab elements found - check [data-tab] selectors');
	}
	
	if (sectionElements.length === 0) {
		throw new Error('No section elements found - check [data-section] selectors');
	}
	
	console.log(`✅ Found ${tabElements.length} tab elements and ${sectionElements.length} section elements`);
	
	// Initial setup
	updateTabNavigation();
	setupInputValidation();
	updateCalculateButtonState();
	
	// Add global keyboard event listeners
	safeAddEventListener(document, 'keydown', handleKeyboardNavigation, 'document (keyboard nav)');
	
	// Enter key to submit form from any input
	safeAddEventListener(document, 'keydown', e => {
		if (e.key === 'Enter' && e.target.matches('input')) {
			e.preventDefault();
			if (form) {
				form.dispatchEvent(new Event('submit'));
			}
		}
	}, 'document (enter key)');
	
	// Setup tab click handlers
	tabElements.forEach((tab, index) => {
		safeAddEventListener(tab, 'click', () => {
			try {
				state.currentTab = tab.dataset.tab;
				
				// Save current tab state before switching
				saveCurrentTabState();
				
				// Update tab visual states
				document.querySelectorAll(".btn-tab").forEach(t => t.classList.remove("active"));
				tab.classList.add("active");
				updateTabNavigation();
				
				// Update section visibility
				document.querySelectorAll(".form-section").forEach(s => s.classList.add("hidden"));
				
				const targetSection = document.querySelector(`[data-section="${state.currentTab}"]`);
				if (targetSection) {
					targetSection.classList.remove("hidden");
				} else {
					console.error('Target section not found for:', state.currentTab);
				}
				
				if (loadingDiv) loadingDiv.classList.add("hidden");
				
				// Restore the target tab's state
				restoreTabState(state.currentTab);
				updateCalculateButtonState();
				
				// Removed auto-focus to preserve natural tab order
			} catch (error) {
				console.error('Error in tab click handler:', error);
			}
		}, `tab-${index}`);
		
		// Tab keyboard navigation
		safeAddEventListener(tab, 'keydown', e => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				tab.click();
			}
		}, `tab-${index} (keyboard)`);
	});
	
	// Setup preset select handlers
	document.querySelectorAll(".preset-select").forEach((select, index) => {
		safeAddEventListener(select, 'change', e => {
			const presetKey = e.target.value;
			if (!presetKey) return;
			
			const distanceInput = document.getElementById(`${state.currentTab}-distance`);
			if (distanceInput) {
				const raceDistances = getRaceDistances();
				distanceInput.value = raceDistances[presetKey][state.distanceUnit];
				
				// Save preset selection to tab state
				if (!state.tabStates[state.currentTab]) {
					state.tabStates[state.currentTab] = { inputs: {}, validationStates: {}, result: null, presetSelection: "" };
				}
				state.tabStates[state.currentTab].presetSelection = presetKey;
				
				// Validate the new value
				validateInput(distanceInput, calc.validateDistanceInput);
				updateCalculateButtonState();
			}
		}, `preset-select-${index}`);
	});
	
	// Setup form submission
	safeAddEventListener(form, 'submit', handleFormSubmit, 'calculator-form');
	
	// Setup clear button
	const clearBtn = elements['clear-btn'];
	safeAddEventListener(clearBtn, 'click', clearCurrentTab, 'clear-btn');
	
	// Setup copy button
	safeAddEventListener(copyBtn, 'click', async () => {
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
	}, 'copy-btn');
	
	// Setup PR buttons (optional)
	safeAddEventListener(savePrBtn, 'click', handleSavePR, 'save-pr-btn');
	safeAddEventListener(updatePrBtn, 'click', handleUpdatePR, 'update-pr-btn');
	
	// Removed auto-focus to preserve natural tab order for accessibility
	
	console.log('✅ Core UI initialization completed successfully');
}

/**
 * UI initialization with environment-aware error handling
 */
export async function initUI() {
	// In test environment, elements are available immediately
	if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
		try {
			await coreInitUI();
			return;
		} catch (error) {
			console.error('❌ Test UI initialization failed:', error);
			throw error;
		}
	}
	
	// In browser environment, use robust DOM-ready handling
	try {
		const result = await robustInit(coreInitUI, {
			name: 'UI Components',
			timeout: 10000,
			requiredElements: [
				'#app',
				'[data-tab="pace"]',
				'[data-tab="time"]', 
				'[data-tab="distance"]',
				'[data-section="pace"]',
				'[data-section="time"]',
				'[data-section="distance"]',
				'#calculator-form'
			],
			retries: 2
		});
		return result;
	} catch (error) {
		console.error('❌ Browser UI initialization failed:', error);
		throw error;
	}
}