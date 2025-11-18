import { stateManager } from './state-manager.js';

const INPUT_CONFIGS = {
	hours: { maxLength: 2, maxValue: 23, nextField: 'minutes' },
	minutes: { maxLength: 2, maxValue: 59, nextField: 'seconds', prevField: 'hours' },
	seconds: { maxLength: 2, maxValue: 59, prevField: 'minutes' }
};

// Store listener references for cleanup
const listenerRegistry = new Map();

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
		'pr-time'
	];

	timeInputPrefixes.forEach(prefix => {
		setupAutoAdvanceGroup(prefix);
	});
}

/**
 * Setup auto-advance for a specific input group (e.g., 'pace-time')
 * @param prefix
 */
function setupAutoAdvanceGroup(prefix) {
	// Determine which segments this group has
	const segments = getAvailableSegments(prefix);
	
	segments.forEach((segment, index) => {
		const inputId = `${prefix}-${segment}`;
		const input = document.getElementById(inputId);

		const enabledInputs = stateManager.get('autoAdvance.enabledInputs');
		if (input && !enabledInputs.has(inputId)) {
			setupAutoAdvanceInput(input, segment, prefix, segments, index);
			enabledInputs.add(inputId);
			stateManager.set('autoAdvance.enabledInputs', enabledInputs);
		}
	});
}

/**
 * Get available segments for an input group
 * @param prefix
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
 * @param input
 * @param segment
 * @param prefix
 * @param segments
 * @param segmentIndex
 */
function setupAutoAdvanceInput(input, segment, prefix, segments, segmentIndex) {
	const config = INPUT_CONFIGS[segment];

	// Create listener functions
	const inputHandler = e => {
		handleAutoAdvance(e, input, segment, prefix, segments, segmentIndex, config);
	};

	const keydownHandler = e => {
		handleBackspace(e, input, segment, prefix, segments, segmentIndex);
	};

	const focusHandler = e => {
		const previousValuesMap = stateManager.get('autoAdvance.previousValues');
		previousValuesMap.set(e.target, e.target.value);

		setTimeout(() => {
			e.target.select();
		}, 10);
	};

	const pasteHandler = e => {
		handlePaste(e, input, segment, prefix, segments, segmentIndex);
	};

	// Store listeners for cleanup
	const inputId = input.id;
	listenerRegistry.set(inputId, {
		input: inputHandler,
		keydown: keydownHandler,
		focus: focusHandler,
		paste: pasteHandler
	});

	// Add event listeners
	input.addEventListener('input', inputHandler);
	input.addEventListener('keydown', keydownHandler);
	input.addEventListener('focus', focusHandler);
	input.addEventListener('paste', pasteHandler);
}

/**
 * Handle input and auto-advance logic
 * @param e
 * @param input
 * @param segment
 * @param prefix
 * @param segments
 * @param segmentIndex
 * @param config
 */
function handleAutoAdvance(e, input, segment, prefix, segments, segmentIndex, config) {
	const previousValuesMap = stateManager.get('autoAdvance.previousValues');
	const prevValue = previousValuesMap.get(e.target) || '';
	const prevLength = prevValue.replace(/\D/g, '').length;

	let {value} = e.target;

	value = value.replace(/\D/g, '');

	if (value.length > config.maxLength) {
		value = value.slice(0, config.maxLength);
	}

	const numValue = parseInt(value);
	if (!isNaN(numValue) && numValue > config.maxValue) {
		if (value.length === 2) {
			const firstDigit = value[0];
			const secondDigit = value[1];

			if (segment === 'minutes' || segment === 'seconds') {
				if (parseInt(firstDigit) > 5) {
					value = firstDigit;
					advanceToNext(input, prefix, segments, segmentIndex, secondDigit);
				} else {
					value = config.maxValue.toString();
					advanceToNext(input, prefix, segments, segmentIndex);
				}
			} else if (segment === 'hours') {
				if (numValue > 23) {
					value = firstDigit;
					advanceToNext(input, prefix, segments, segmentIndex, secondDigit);
				}
			}
		} else {
			value = config.maxValue.toString();
		}
	}

	e.target.value = value;

	previousValuesMap.set(e.target, value);

	const shouldAutoAdvance =
		value.length === config.maxLength &&
		segmentIndex < segments.length - 1 &&
		prevLength < config.maxLength;

	if (shouldAutoAdvance) {
		advanceToNext(input, prefix, segments, segmentIndex);
	}
}

/**
 * Handle backspace for going to previous field
 * @param e
 * @param input
 * @param segment
 * @param prefix
 * @param segments
 * @param segmentIndex
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
 * @param e
 * @param input
 * @param segment
 * @param prefix
 * @param segments
 * @param segmentIndex
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
 * @param value
 * @param currentInput
 * @param segment
 * @param prefix
 * @param segments
 * @param segmentIndex
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
 * @param currentInput
 * @param prefix
 * @param segments
 * @param segmentIndex
 * @param prefillValue
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
 * Clean up all event listeners and reset state
 */
export function cleanupAutoAdvance() {
	const enabledInputs = stateManager.get('autoAdvance.enabledInputs');

	// Remove all event listeners
	enabledInputs.forEach(inputId => {
		const input = document.getElementById(inputId);
		const listeners = listenerRegistry.get(inputId);

		if (input && listeners) {
			input.removeEventListener('input', listeners.input);
			input.removeEventListener('keydown', listeners.keydown);
			input.removeEventListener('focus', listeners.focus);
			input.removeEventListener('paste', listeners.paste);
		}
	});

	// Clear registry
	listenerRegistry.clear();

	// Reset state
	stateManager.reset('autoAdvance.enabledInputs');
	stateManager.reset('autoAdvance.previousValues');
}

/**
 * Re-initialize auto-advance (useful after dynamic content changes)
 */
export function reinitAutoAdvance() {
	cleanupAutoAdvance();
	initAutoAdvance();
}