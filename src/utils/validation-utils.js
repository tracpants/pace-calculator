import { parseTime, MAX_SECONDS_SINGLE_DAY, MAX_SECONDS_MULTIDAY } from './time-utils.js';

export function validateTimeInput(timeStr, allowMultiday = false) {
	if (!timeStr || typeof timeStr !== 'string') return { valid: false, message: "Time is required" };
	const trimmed = timeStr.trim();
	if (!trimmed) return { valid: false, message: "Time is required" };

	const validFormats = [
		/^\d+(\.\d+)?$/,
		/^\d+\s+\d+(\s+\d+)?(\s+\d+)?$/,
		/^\d+:\d+(:\d+)?(:\d+)?$/,
		/^\d+$/
	];

	const isValidFormat = validFormats.some(format => format.test(trimmed));
	if (!isValidFormat) {
		return { valid: false, message: "Invalid format. Use MM:SS, H:MM:SS, or D:H:MM:SS for multi-day events" };
	}

	const parsed = parseTime(timeStr);
	if (parsed <= 0) {
		return { valid: false, message: "Time must be greater than 0" };
	}

	if (allowMultiday) {
		if (parsed > MAX_SECONDS_MULTIDAY) {
			return { valid: false, message: "Time cannot exceed 7 days" };
		}
	} else {
		if (parsed > MAX_SECONDS_SINGLE_DAY) {
			return { valid: false, message: "Time cannot exceed 24 hours" };
		}
	}

	return { valid: true, value: parsed };
}

export function validateDistanceInput(distanceStr) {
	if (!distanceStr || typeof distanceStr !== 'string') return { valid: false, message: "Distance is required" };
	const trimmed = distanceStr.trim();
	if (!trimmed) return { valid: false, message: "Distance is required" };

	if (!/^\d*\.?\d+$/.test(trimmed)) {
		return { valid: false, message: "Please enter a valid number (e.g., 10 or 10.5)" };
	}

	const distance = parseFloat(trimmed);

	if (isNaN(distance)) {
		return { valid: false, message: "Please enter a valid number" };
	}

	if (distance <= 0) {
		return { valid: false, message: "Distance must be greater than 0" };
	}

	if (distance > 1000) {
		return { valid: false, message: "Distance seems unreasonably large" };
	}

	return { valid: true, value: distance };
}

export const ErrorManager = {
	setError(inputId, message) {
		const input = document.getElementById(inputId);
		const errorElement = document.getElementById(`${inputId}-error`);

		if (input) {
			input.classList.add('error');
		}

		if (errorElement && message) {
			errorElement.textContent = message;
			errorElement.classList.remove('hidden');
		}
	},

	setValid(inputId) {
		const input = document.getElementById(inputId);
		const errorElement = document.getElementById(`${inputId}-error`);

		if (input) {
			input.classList.remove('error');
		}

		if (errorElement) {
			errorElement.textContent = '';
			errorElement.classList.add('hidden');
		}
	},

	clearState(inputId) {
		const input = document.getElementById(inputId);
		const errorElement = document.getElementById(`${inputId}-error`);

		if (input) {
			input.classList.remove('error');
		}

		if (errorElement) {
			errorElement.textContent = '';
			errorElement.classList.add('hidden');
		}
	},

	setSegmentedError(prefix, message) {
		const errorElement = document.getElementById(`${prefix}-error`);

		['hours', 'minutes', 'seconds'].forEach(segment => {
			const input = document.getElementById(`${prefix}-${segment}`);
			if (input) {
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

		['hours', 'minutes', 'seconds'].forEach(segment => {
			const input = document.getElementById(`${prefix}-${segment}`);
			if (input) {
				input.classList.remove('error');
			}
		});

		if (errorElement) {
			errorElement.textContent = '';
			errorElement.classList.add('hidden');
		}
	},

	clearSegmentedState(prefix) {
		const errorElement = document.getElementById(`${prefix}-error`);

		['hours', 'minutes', 'seconds'].forEach(segment => {
			const input = document.getElementById(`${prefix}-${segment}`);
			if (input) {
				input.classList.remove('error');
			}
		});

		if (errorElement) {
			errorElement.textContent = '';
			errorElement.classList.add('hidden');
		}
	},

	clearCurrentTab(currentTab) {
		const currentSection = document.querySelector(`[data-section="${currentTab}"]`);

		if (!currentSection) return;

		currentSection.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
			this.clearState(input.id);
		});

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

export function validateInput(inputElement, validationFn) {
	const {value} = inputElement;
	const result = validationFn(value);

	if (result.valid) {
		ErrorManager.setValid(inputElement.id);
	} else {
		ErrorManager.setError(inputElement.id, result.message);
	}

	return result;
}
