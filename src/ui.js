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

function clearSegmentedInputErrors(prefix) {
	const errorElement = document.getElementById(`${prefix}-error`);
	if (errorElement) {
		errorElement.classList.add('hidden');
		errorElement.textContent = '';
	}
	
	// Clear error styling from all segment inputs
	['hours', 'minutes', 'seconds'].forEach(segment => {
		const input = document.getElementById(`${prefix}-${segment}`);
		if (input) {
			input.classList.remove('error', 'valid');
		}
	});
}

function showSegmentedInputError(prefix, message) {
	const errorElement = document.getElementById(`${prefix}-error`);
	if (errorElement) {
		errorElement.textContent = message;
		errorElement.classList.remove('hidden');
	}
	
	// Add error styling to all segment inputs
	['hours', 'minutes', 'seconds'].forEach(segment => {
		const input = document.getElementById(`${prefix}-${segment}`);
		if (input) {
			input.classList.add('error');
			input.classList.remove('valid');
		}
	});
}

function markSegmentedInputValid(prefix) {
	clearSegmentedInputErrors(prefix);
	
	// Add valid styling to all segment inputs
	['hours', 'minutes', 'seconds'].forEach(segment => {
		const input = document.getElementById(`${prefix}-${segment}`);
		if (input) {
			input.classList.add('valid');
		}
	});
}

// Input validation functions
function validateInput(inputElement, validationFn) {
	const value = inputElement.value;
	const errorElement = document.getElementById(inputElement.id + '-error');
	const result = validationFn(value);
	
	// Remove existing validation classes
	inputElement.classList.remove('error', 'valid');
	
	if (result.valid) {
		inputElement.classList.add('valid');
		errorElement.textContent = '';
		errorElement.classList.add('hidden');
	} else {
		inputElement.classList.add('error');
		errorElement.textContent = result.message;
		errorElement.classList.remove('hidden');
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
						markSegmentedInputValid(prefix);
					} else {
						showSegmentedInputError(prefix, validation.message);
					}
					updateCalculateButtonState();
				});
				
				input.addEventListener('input', () => {
					// Clear errors on input for immediate feedback
					clearSegmentedInputErrors(prefix);
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
						markSegmentedInputValid(prefix);
					} else {
						showSegmentedInputError(prefix, validation.message);
					}
					updateCalculateButtonState();
				});
				
				input.addEventListener('input', () => {
					// Clear errors on input for immediate feedback
					clearSegmentedInputErrors(prefix);
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
				if (input.classList.contains('error')) {
					input.classList.remove('error');
					const errorElement = document.getElementById(input.id + '-error');
					errorElement.classList.add('hidden');
				}
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

function setupHelpModal() {
	const helpBtn = document.getElementById('help-btn');
	const helpModal = document.getElementById('help-modal');
	const closeHelpBtn = document.getElementById('close-help');
	
	// Open help modal
	helpBtn.addEventListener('click', () => {
		helpModal.classList.remove('hidden');
		helpModal.classList.add('flex');
		
		// Focus close button for accessibility
		closeHelpBtn.focus();
		
		// Prevent body scroll
		document.body.style.overflow = 'hidden';
	});
	
	// Close help modal
	function closeHelpModal() {
		helpModal.classList.add('hidden');
		helpModal.classList.remove('flex');
		
		// Restore body scroll
		document.body.style.overflow = '';
		
		// Return focus to help button
		helpBtn.focus();
	}
	
	closeHelpBtn.addEventListener('click', closeHelpModal);
	
	// Close on backdrop click
	helpModal.addEventListener('click', (e) => {
		if (e.target === helpModal) {
			closeHelpModal();
		}
	});
	
	// Close on escape key
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && !helpModal.classList.contains('hidden')) {
			closeHelpModal();
		}
	});
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

function clearNonRelevantFields() {
	// Clear all input fields except those in the current tab
	const allInputs = document.querySelectorAll('input[type="text"]');
	allInputs.forEach(input => {
		const isInCurrentTab = input.closest(`[data-section="${state.currentTab}"]`);
		if (!isInCurrentTab) {
			input.value = '';
			// Clear validation states
			input.classList.remove('error', 'valid');
			const errorElement = document.getElementById(input.id + '-error');
			if (errorElement) {
				errorElement.classList.add('hidden');
				errorElement.textContent = '';
			}
		}
	});
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

async function copyToClipboard(text) {
	try {
		await navigator.clipboard.writeText(text);
		// Show success state
		copyIcon.classList.add('hidden');
		checkIcon.classList.remove('hidden');
		copyBtn.classList.add('animate-pulse-success');
		
		// Reset after 2 seconds
		setTimeout(() => {
			copyIcon.classList.remove('hidden');
			checkIcon.classList.add('hidden');
			copyBtn.classList.remove('animate-pulse-success');
		}, 2000);
		
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
				showSegmentedInputError('pace-time', timeValidation.message);
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
			state.lastResult = {
				type: state.currentTab,
				data: { pacePerKm, pacePerMile, prComparison }
			};
		} else if (state.currentTab === "time") {
			const distInput = document.getElementById("time-distance");
			
			// Validate inputs
			const paceValidation = validateSegmentedInput('time-pace', false);
			const distValidation = validateInput(distInput, calc.validateDistanceInput);
			
			if (!paceValidation.valid) {
				showSegmentedInputError('time-pace', paceValidation.message);
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
			state.lastResult = {
				type: state.currentTab,
				data: { totalSeconds }
			};
		} else if (state.currentTab === "distance") {
			// Validate inputs
			const timeValidation = validateSegmentedInput('distance-time', true);
			const paceValidation = validateSegmentedInput('distance-pace', false);
			
			if (!timeValidation.valid) {
				showSegmentedInputError('distance-time', timeValidation.message);
			}
			if (!paceValidation.valid) {
				showSegmentedInputError('distance-pace', paceValidation.message);
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
			state.lastResult = {
				type: state.currentTab,
				data: { km, miles }
			};
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
	
	// Remove animation class after animation completes
	setTimeout(() => {
		resultDiv.classList.remove('animate-bounce-in');
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

function clearAll() {
	form.reset();
	resultDiv.classList.add("hidden");
	resultDiv.classList.remove('show', 'success', 'error');
	loadingDiv.classList.add("hidden");
	state.lastResult = null;
	
	// Clear validation states
	document.querySelectorAll('.input-base').forEach(input => {
		input.classList.remove('error', 'valid');
	});
	document.querySelectorAll('[id$="-error"]').forEach(error => {
		error.classList.add('hidden');
		error.textContent = '';
	});
	
	// Clear segmented input errors
	['pace-time', 'time-pace', 'distance-time', 'distance-pace'].forEach(prefix => {
		clearSegmentedInputErrors(prefix);
	});
	
	// Reset preset dropdowns
	document.querySelectorAll('.preset-select').forEach(select => {
		select.selectedIndex = 0;
	});
	
	// Focus first input (only on non-mobile devices)
	focusFirstInput();
	
	// Update button state after clearing
	updateCalculateButtonState();
}

export { populatePresetSelects, populateAutocomplete, updateCalculatedResult };

export function initUI() {
	// Initial setup
	updateUnitToggles();
	updateTabNavigation();
	document.querySelector('.tab[data-tab="pace"]').classList.add("active");

	// Setup input validation
	setupInputValidation();
	
	// Initial button state check
	updateCalculateButtonState();
	
	// Setup help modal
	setupHelpModal();

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
		tab.addEventListener("click", () => {
			state.currentTab = tab.dataset.tab;
			document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
			tab.classList.add("active");
			updateTabNavigation();
			document
				.querySelectorAll(".form-section")
				.forEach((s) => s.classList.add("hidden"));
			document
				.querySelector(`[data-section="${state.currentTab}"]`)
				.classList.remove("hidden");
			resultDiv.classList.add("hidden");
			loadingDiv.classList.add("hidden");
			state.lastResult = null;
			
			// Clear non-relevant fields when switching tabs
			clearNonRelevantFields();
			
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
			// Keep the selected preset visible instead of resetting
			// e.target.selectedIndex = 0; // Removed this line
			
			// Validate the new value
			if (distanceInput) {
				validateInput(distanceInput, calc.validateDistanceInput);
			}
			
			// Update button state after preset selection
			updateCalculateButtonState();
		});
	});

	form.addEventListener("submit", handleFormSubmit);
	document.getElementById("clear-btn").addEventListener("click", clearAll);
	
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