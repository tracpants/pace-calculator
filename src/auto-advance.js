// Auto-advance functionality for segmented time inputs
// Handles automatic advancement between HH:MM:SS and MM:SS input fields

/**
 * Sets up auto-advance functionality for segmented time inputs
 * Auto-advances to next field when user completes current field
 * Handles backspace to go to previous field when current field is empty
 */

// Configuration for different input types
const INPUT_CONFIGS = {
	hours: { maxLength: 2, maxValue: 23, nextField: 'minutes' },
	minutes: { maxLength: 2, maxValue: 59, nextField: 'seconds', prevField: 'hours' },
	seconds: { maxLength: 2, maxValue: 59, prevField: 'minutes' }
};

// Track which inputs have auto-advance enabled
const autoAdvanceInputs = new Set();

/**
 * Initialize auto-advance for all segmented time inputs
 */
export function initAutoAdvance() {
	// Find all segmented time input groups
	const timeInputPrefixes = [
		'pace-time',
		'time-pace', 
		'distance-time',
		'distance-pace',
		'pr-time',
		'adjuster-pace'
	];

	timeInputPrefixes.forEach(prefix => {
		setupAutoAdvanceGroup(prefix);
	});
}

/**
 * Setup auto-advance for a specific input group (e.g., 'pace-time')
 */
function setupAutoAdvanceGroup(prefix) {
	// Determine which segments this group has
	const segments = getAvailableSegments(prefix);
	
	segments.forEach((segment, index) => {
		const inputId = `${prefix}-${segment}`;
		const input = document.getElementById(inputId);
		
		if (input && !autoAdvanceInputs.has(inputId)) {
			setupAutoAdvanceInput(input, segment, prefix, segments, index);
			autoAdvanceInputs.add(inputId);
		}
	});
}

/**
 * Get available segments for an input group
 */
function getAvailableSegments(prefix) {
	// Check if this is a pace input (MM:SS) or time input (HH:MM:SS)
	const hoursInput = document.getElementById(`${prefix}-hours`);
	
	if (hoursInput) {
		// Full time input: hours, minutes, seconds
		return ['hours', 'minutes', 'seconds'];
	} else {
		// Pace input: minutes, seconds only
		return ['minutes', 'seconds'];
	}
}

/**
 * Setup auto-advance behavior for a single input
 */
function setupAutoAdvanceInput(input, segment, prefix, segments, segmentIndex) {
	const config = INPUT_CONFIGS[segment];
	
	// Input event for auto-advance
	input.addEventListener('input', (e) => {
		handleAutoAdvance(e, input, segment, prefix, segments, segmentIndex, config);
	});
	
	// Keydown event for backspace handling
	input.addEventListener('keydown', (e) => {
		handleBackspace(e, input, segment, prefix, segments, segmentIndex);
	});
	
	// Focus event to select all text for easy editing
	input.addEventListener('focus', (e) => {
		// Small delay to ensure the focus has fully completed
		setTimeout(() => {
			e.target.select();
		}, 10);
	});
	
	// Paste event handling
	input.addEventListener('paste', (e) => {
		handlePaste(e, input, segment, prefix, segments, segmentIndex);
	});
}

/**
 * Handle input and auto-advance logic
 */
function handleAutoAdvance(e, input, segment, prefix, segments, segmentIndex, config) {
	let value = e.target.value;
	
	// Remove non-numeric characters
	value = value.replace(/\D/g, '');
	
	// Enforce max length
	if (value.length > config.maxLength) {
		value = value.slice(0, config.maxLength);
	}
	
	// Validate max value
	const numValue = parseInt(value);
	if (!isNaN(numValue) && numValue > config.maxValue) {
		// If value exceeds max, take the valid part and auto-advance with remainder
		if (value.length === 2) {
			const firstDigit = value[0];
			const secondDigit = value[1];
			
			// For minutes/seconds: if first digit makes it impossible to be valid (e.g., 6X), use just first digit
			if (segment === 'minutes' || segment === 'seconds') {
				if (parseInt(firstDigit) > 5) {
					value = firstDigit;
					advanceToNext(input, prefix, segments, segmentIndex, secondDigit);
				} else {
					value = config.maxValue.toString();
					advanceToNext(input, prefix, segments, segmentIndex);
				}
			} else if (segment === 'hours') {
				// For hours: 24+ hours, take first digit and advance with second
				if (numValue > 23) {
					value = firstDigit;
					advanceToNext(input, prefix, segments, segmentIndex, secondDigit);
				}
			}
		} else {
			value = config.maxValue.toString();
		}
	}
	
	// Update the input value
	e.target.value = value;
	
	// Auto-advance if we have a complete valid value
	if (value.length === config.maxLength && segmentIndex < segments.length - 1) {
		advanceToNext(input, prefix, segments, segmentIndex);
	}
}

/**
 * Handle backspace for going to previous field
 */
function handleBackspace(e, input, segment, prefix, segments, segmentIndex) {
	if (e.key === 'Backspace' && input.value === '' && segmentIndex > 0) {
		e.preventDefault();
		
		// Move to previous field
		const prevSegment = segments[segmentIndex - 1];
		const prevInput = document.getElementById(`${prefix}-${prevSegment}`);
		
		if (prevInput) {
			prevInput.focus();
			// Position cursor at the end
			setTimeout(() => {
				prevInput.setSelectionRange(prevInput.value.length, prevInput.value.length);
			}, 10);
		}
	}
}

/**
 * Handle paste events to intelligently distribute time values
 */
function handlePaste(e, input, segment, prefix, segments, segmentIndex) {
	e.preventDefault();
	
	const pastedData = (e.clipboardData || window.clipboardData).getData('text');
	const cleanData = pastedData.replace(/\D/g, ''); // Keep only digits
	
	if (!cleanData) return;
	
	// Distribute the pasted digits across available fields
	distributePastedValue(cleanData, input, segment, prefix, segments, segmentIndex);
}

/**
 * Distribute pasted numeric value across time fields
 */
function distributePastedValue(value, currentInput, segment, prefix, segments, segmentIndex) {
	const inputs = segments.map(seg => document.getElementById(`${prefix}-${seg}`)).filter(inp => inp);
	
	if (value.length <= 2) {
		// Short value, just put it in current field
		currentInput.value = value;
		handleAutoAdvance({ target: currentInput }, currentInput, segment, prefix, segments, segmentIndex, INPUT_CONFIGS[segment]);
	} else {
		// Longer value, distribute across fields
		let remaining = value;
		let currentIndex = segmentIndex;
		
		while (remaining && currentIndex < inputs.length) {
			const currentSeg = segments[currentIndex];
			const config = INPUT_CONFIGS[currentSeg];
			const chunkSize = Math.min(config.maxLength, remaining.length);
			const chunk = remaining.slice(0, chunkSize);
			
			// Validate the chunk doesn't exceed max value
			const numValue = parseInt(chunk);
			if (!isNaN(numValue) && numValue <= config.maxValue) {
				inputs[currentIndex].value = chunk;
				remaining = remaining.slice(chunkSize);
			} else {
				// If chunk is too large, use max value and keep remaining
				inputs[currentIndex].value = config.maxValue.toString();
				// Don't advance remaining for this invalid chunk
				remaining = remaining.slice(1); // Just remove first digit and try again
			}
			
			currentIndex++;
		}
		
		// Focus the last field we filled or the next empty one
		const targetIndex = Math.min(currentIndex, inputs.length - 1);
		inputs[targetIndex].focus();
	}
}

/**
 * Advance to the next input field
 */
function advanceToNext(currentInput, prefix, segments, segmentIndex, prefillValue = '') {
	if (segmentIndex < segments.length - 1) {
		const nextSegment = segments[segmentIndex + 1];
		const nextInput = document.getElementById(`${prefix}-${nextSegment}`);
		
		if (nextInput) {
			nextInput.focus();
			
			// If we have a prefill value, set it and trigger auto-advance
			if (prefillValue) {
				nextInput.value = prefillValue;
				const config = INPUT_CONFIGS[nextSegment];
				handleAutoAdvance(
					{ target: nextInput }, 
					nextInput, 
					nextSegment, 
					prefix, 
					segments, 
					segmentIndex + 1, 
					config
				);
			} else {
				// Select all content for easy overwrite
				setTimeout(() => {
					nextInput.select();
				}, 10);
			}
		}
	}
}

/**
 * Cleanup auto-advance functionality (for dynamic content)
 */
export function cleanupAutoAdvance() {
	autoAdvanceInputs.clear();
}

/**
 * Re-initialize auto-advance (useful after dynamic content changes)
 */
export function reinitAutoAdvance() {
	cleanupAutoAdvance();
	initAutoAdvance();
}