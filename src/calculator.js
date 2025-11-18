import {
	METERS_PER_KM,
	METERS_PER_MILE,
	roundToDecimalPlaces
} from './utils/constants.js';
import {
	parseTime,
	formatTime
} from './utils/time-utils.js';
import {
	validateTimeInput,
	validateDistanceInput
} from './utils/validation-utils.js';

export { parseTime, formatTime, validateTimeInput, validateDistanceInput };

export function calculatePace(totalSeconds, distance, unit) {
	// Convert distance to meters using consistent conversion factors
	const distanceInMeters = unit === "km" ? distance * METERS_PER_KM : distance * METERS_PER_MILE;

	if (distanceInMeters <= 0) return { pacePerKm: 0, pacePerMile: 0 };

	// Calculate pace in seconds per unit distance
	const pacePerKm = totalSeconds / (distanceInMeters / METERS_PER_KM);
	const pacePerMile = totalSeconds / (distanceInMeters / METERS_PER_MILE);

	// Return raw values - rounding will be handled at display time
	return {
		pacePerKm,
		pacePerMile
	};
}

export function calculateTime(paceSeconds, distance, paceUnit, distanceUnit) {
	// Convert distance to meters using consistent conversion factors
	const distanceInMeters = distanceUnit === "km" ? distance * METERS_PER_KM : distance * METERS_PER_MILE;

	// Convert pace to seconds per meter
	const paceSecondsPerMeter = paceUnit === "km" ? paceSeconds / METERS_PER_KM : paceSeconds / METERS_PER_MILE;

	// Calculate total time in seconds
	const totalTimeSeconds = distanceInMeters * paceSecondsPerMeter;

	// Return raw seconds - rounding will be handled at display time
	return totalTimeSeconds;
}

export function calculateDistance(totalSeconds, paceSeconds, paceUnit) {
	// Convert pace to seconds per meter
	const paceSecondsPerMeter = paceUnit === "km" ? paceSeconds / METERS_PER_KM : paceSeconds / METERS_PER_MILE;

	if (paceSecondsPerMeter <= 0) return { km: 0, miles: 0 };

	// Calculate distance in meters
	const distanceInMeters = totalSeconds / paceSecondsPerMeter;

	// Convert to km and miles with consistent conversion factors
	return {
		km: distanceInMeters / METERS_PER_KM,
		miles: distanceInMeters / METERS_PER_MILE,
	};
}

// Utility function for consistent rounding in UI display
export function formatDistance(distance, decimalPlaces = 2) {
	return roundToDecimalPlaces(distance, decimalPlaces);
}

// Utility function for consistent pace formatting
export function formatPaceDisplay(paceSeconds, allowMultiday = false) {
	return formatTime(paceSeconds, false, allowMultiday);
}

// Simple validation - allow unlimited hours for all use cases
