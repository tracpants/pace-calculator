import {
	SECONDS_PER_MINUTE,
	SECONDS_PER_HOUR,
	SECONDS_PER_DAY,
	MAX_SECONDS_SINGLE_DAY,
	MAX_SECONDS_MULTIDAY
} from './constants.js';

export {
	SECONDS_PER_MINUTE,
	SECONDS_PER_HOUR,
	SECONDS_PER_DAY,
	MAX_SECONDS_SINGLE_DAY,
	MAX_SECONDS_MULTIDAY
};

export function parseTime(timeStr) {
	if (!timeStr || typeof timeStr !== 'string') return 0;
	const trimmed = timeStr.trim();
	if (!trimmed) return 0;

	if (/^\d+(\.\d+)?$/.test(trimmed)) {
		const decimal = parseFloat(trimmed);
		const minutes = Math.floor(decimal);
		const seconds = Math.round((decimal - minutes) * SECONDS_PER_MINUTE);
		return minutes * SECONDS_PER_MINUTE + seconds;
	}

	if (/^\d+\s+\d+(\s+\d+)?(\s+\d+)?$/.test(trimmed)) {
		const parts = trimmed.split(/\s+/).map(p => parseInt(p) || 0);
		if (parts.length === 4) {
			return parts[0] * SECONDS_PER_DAY + parts[1] * SECONDS_PER_HOUR + parts[2] * SECONDS_PER_MINUTE + parts[3];
		}
		if (parts.length === 3) {
			return parts[0] * SECONDS_PER_HOUR + parts[1] * SECONDS_PER_MINUTE + parts[2];
		}
		if (parts.length === 2) {
			return parts[0] * SECONDS_PER_MINUTE + parts[1];
		}
		return 0;
	}

	if (trimmed.includes(':')) {
		const parts = trimmed.split(":").map(p => parseInt(p) || 0);
		if (parts.length === 4) {
			return parts[0] * SECONDS_PER_DAY + parts[1] * SECONDS_PER_HOUR + parts[2] * SECONDS_PER_MINUTE + parts[3];
		}
		if (parts.length === 3) {
			return parts[0] * SECONDS_PER_HOUR + parts[1] * SECONDS_PER_MINUTE + parts[2];
		}
		if (parts.length === 2) {
			return parts[0] * SECONDS_PER_MINUTE + parts[1];
		}
		return 0;
	}

	const singleNumber = parseInt(trimmed);
	if (!isNaN(singleNumber)) return singleNumber * SECONDS_PER_MINUTE;

	return 0;
}

export function formatTime(seconds, includeHours = false, allowMultiday = false) {
	if (isNaN(seconds) || seconds < 0) return "00:00";

	const totalSeconds = Math.round(seconds);

	const days = Math.floor(totalSeconds / SECONDS_PER_DAY);
	const remainingAfterDays = totalSeconds % SECONDS_PER_DAY;
	const hours = Math.floor(remainingAfterDays / SECONDS_PER_HOUR);
	const minutes = Math.floor((remainingAfterDays % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
	const secs = remainingAfterDays % SECONDS_PER_MINUTE;

	if (allowMultiday && totalSeconds >= SECONDS_PER_DAY) {
		const dayText = days === 1 ? "day" : "days";
		return `${days} ${dayText} ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
	}

	if (includeHours) {
		const totalHours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
		const remainingMinutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
		const remainingSecs = totalSeconds % SECONDS_PER_MINUTE;

		return `${String(totalHours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}:${String(remainingSecs).padStart(2, "0")}`;
	}

	const totalMinutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
	const remainingSecs = totalSeconds % SECONDS_PER_MINUTE;

	return `${String(totalMinutes).padStart(2, "0")}:${String(remainingSecs).padStart(2, "0")}`;
}

export function getSegmentedTimeValue(prefix) {
	const hoursInput = document.getElementById(`${prefix}-hours`);
	const minutesInput = document.getElementById(`${prefix}-minutes`);
	const secondsInput = document.getElementById(`${prefix}-seconds`);

	const hours = parseInt(hoursInput?.value || '0') || 0;
	const minutes = parseInt(minutesInput?.value || '0') || 0;
	const seconds = parseInt(secondsInput?.value || '0') || 0;

	return hours * SECONDS_PER_HOUR + minutes * SECONDS_PER_MINUTE + seconds;
}

export function getSegmentedPaceValue(prefix) {
	const minutesInput = document.getElementById(`${prefix}-minutes`);
	const secondsInput = document.getElementById(`${prefix}-seconds`);

	const minutes = parseInt(minutesInput?.value || '0') || 0;
	const seconds = parseInt(secondsInput?.value || '0') || 0;

	return minutes * SECONDS_PER_MINUTE + seconds;
}

export function setSegmentedTimeValue(prefix, totalSeconds) {
	const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
	const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
	const seconds = totalSeconds % SECONDS_PER_MINUTE;

	const hoursInput = document.getElementById(`${prefix}-hours`);
	const minutesInput = document.getElementById(`${prefix}-minutes`);
	const secondsInput = document.getElementById(`${prefix}-seconds`);

	if (hoursInput) hoursInput.value = hours > 0 ? hours : '';
	if (minutesInput) minutesInput.value = minutes;
	if (secondsInput) secondsInput.value = seconds;
}

export function validateSegmentedTime(prefix) {
	const hours = parseInt(document.getElementById(`${prefix}-hours`)?.value || '0') || 0;
	const minutes = parseInt(document.getElementById(`${prefix}-minutes`)?.value || '0') || 0;
	const seconds = parseInt(document.getElementById(`${prefix}-seconds`)?.value || '0') || 0;

	if (hours === 0 && minutes === 0 && seconds === 0) {
		return { valid: false, message: 'Time must be greater than 0' };
	}

	if (minutes >= 60 || seconds >= 60) {
		return { valid: false, message: 'Minutes and seconds must be less than 60' };
	}

	if (hours < 0 || minutes < 0 || seconds < 0) {
		return { valid: false, message: 'Time values cannot be negative' };
	}

	const totalSeconds = hours * SECONDS_PER_HOUR + minutes * SECONDS_PER_MINUTE + seconds;
	return { valid: true, value: totalSeconds };
}

export function validateSegmentedPace(prefix) {
	const totalSeconds = getSegmentedPaceValue(prefix);

	if (totalSeconds <= 0) {
		return { valid: false, message: "Pace must be greater than 0" };
	}

	if (totalSeconds > SECONDS_PER_HOUR) {
		return { valid: false, message: "Pace cannot exceed 1 hour per unit" };
	}

	return { valid: true, value: totalSeconds };
}
