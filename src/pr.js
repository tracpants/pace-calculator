import * as calc from "./calculator.js";

// PR storage key
const PR_STORAGE_KEY = 'pace-calculator-prs';

// Common race distances (normalized to km for storage)
const STANDARD_DISTANCES = {
	'5k': 5,
	'10k': 10,
	'half-marathon': 21.0975,
	'marathon': 42.195,
	'1-mile': 1.609344
};

// Load PRs from localStorage
export function loadPRs() {
	try {
		const stored = localStorage.getItem(PR_STORAGE_KEY);
		return stored ? JSON.parse(stored) : {};
	} catch (error) {
		console.error('Error loading PRs:', error);
		return {};
	}
}

// Save PRs to localStorage
export function savePRs(prs) {
	try {
		localStorage.setItem(PR_STORAGE_KEY, JSON.stringify(prs));
		return true;
	} catch (error) {
		console.error('Error saving PRs:', error);
		return false;
	}
}

// Normalize distance to km for consistent storage
function normalizeDistance(distance, unit) {
	if (unit === 'miles') {
		return distance * 1.609344;
	}
	return distance;
}

// Get PR for a specific distance (in km)
export function getPRForDistance(distanceKm) {
	const prs = loadPRs();
	
	// Look for exact match first
	const exactMatch = prs[distanceKm.toString()];
	if (exactMatch) {
		return exactMatch;
	}
	
	// Check standard distances with small tolerance (0.1km)
	for (const [name, standardDistanceKm] of Object.entries(STANDARD_DISTANCES)) {
		if (Math.abs(distanceKm - standardDistanceKm) < 0.1) {
			const standardPR = prs[standardDistanceKm.toString()];
			if (standardPR) {
				return standardPR;
			}
		}
	}
	
	return null;
}

// Set PR for a distance
export function setPR(distance, unit, timeSeconds, date = null, notes = null) {
	const distanceKm = normalizeDistance(distance, unit);
	const prs = loadPRs();
	
	prs[distanceKm.toString()] = {
		distance: distance,
		unit: unit,
		timeSeconds: timeSeconds,
		dateSet: date ? new Date(date).toISOString() : new Date().toISOString(),
		hasCustomDate: !!date,
		notes: notes || null
	};
	
	return savePRs(prs);
}

// Remove PR for a distance
export function removePR(distance, unit) {
	const distanceKm = normalizeDistance(distance, unit);
	const prs = loadPRs();
	
	delete prs[distanceKm.toString()];
	return savePRs(prs);
}

// Get all PRs formatted for display
export function getAllPRs() {
	const prs = loadPRs();
	const formatted = [];
	
	for (const [distanceKm, pr] of Object.entries(prs)) {
		// Check if this is a standard distance
		let displayName = null;
		for (const [name, standardDistanceKm] of Object.entries(STANDARD_DISTANCES)) {
			if (Math.abs(parseFloat(distanceKm) - standardDistanceKm) < 0.1) {
				displayName = name.replace('-', ' ').toUpperCase();
				break;
			}
		}
		
		formatted.push({
			distanceKm: parseFloat(distanceKm),
			displayName: displayName,
			distance: pr.distance,
			unit: pr.unit,
			timeSeconds: pr.timeSeconds,
			timeFormatted: calc.formatTime(pr.timeSeconds, true),
			dateSet: pr.dateSet
		});
	}
	
	// Sort by distance
	formatted.sort((a, b) => a.distanceKm - b.distanceKm);
	return formatted;
}

// Compare current pace with PR pace
export function comparePaceWithPR(currentTimeSeconds, distance, unit) {
	const distanceKm = normalizeDistance(distance, unit);
	const pr = getPRForDistance(distanceKm);
	
	if (!pr) {
		return null;
	}
	
	const currentPacePerKm = currentTimeSeconds / distanceKm;
	const prPacePerKm = pr.timeSeconds / distanceKm;
	const paceDifference = currentPacePerKm - prPacePerKm;
	
	// Calculate total time difference
	const timeDifference = currentTimeSeconds - pr.timeSeconds;
	
	// Calculate percentage difference
	const percentageDifference = (paceDifference / prPacePerKm) * 100;
	
	return {
		hasPR: true,
		prTime: pr.timeSeconds,
		prTimeFormatted: calc.formatTime(pr.timeSeconds, true),
		prPace: prPacePerKm,
		prPaceFormatted: calc.formatTime(prPacePerKm),
		currentPace: currentPacePerKm,
		currentPaceFormatted: calc.formatTime(currentPacePerKm),
		paceDifference: paceDifference,
		paceDifferenceFormatted: calc.formatTime(Math.abs(paceDifference)),
		timeDifference: timeDifference,
		timeDifferenceFormatted: calc.formatTime(Math.abs(timeDifference), true),
		percentageDifference: percentageDifference,
		isFaster: paceDifference < 0,
		isSlower: paceDifference > 0,
		prDistance: pr.distance,
		prUnit: pr.unit
	};
}

// Validate time input for PR
export function validatePRTime(timeStr) {
	const validation = calc.validateTimeInput(timeStr);
	if (!validation.valid) {
		return validation;
	}
	
	// Additional validation for reasonable PR times
	const seconds = validation.value;
	if (seconds < 30) { // Less than 30 seconds seems unrealistic
		return { valid: false, message: "Time seems too fast for a race" };
	}
	
	if (seconds > 86400) { // More than 24 hours
		return { valid: false, message: "Time cannot exceed 24 hours" };
	}
	
	return validation;
}

// Get distance name for display
export function getDistanceName(distance, unit) {
	const distanceKm = normalizeDistance(distance, unit);
	
	for (const [name, standardDistanceKm] of Object.entries(STANDARD_DISTANCES)) {
		if (Math.abs(distanceKm - standardDistanceKm) < 0.1) {
			return name.replace('-', ' ').toUpperCase();
		}
	}
	
	return `${distance} ${unit}`;
}

// Format date for display
export function formatDate(isoString) {
	if (!isoString) return '';
	
	try {
		const date = new Date(isoString);
		return date.toLocaleDateString();
	} catch (error) {
		return '';
	}
}

// Get date in YYYY-MM-DD format for date input
export function getDateInputValue(isoString) {
	if (!isoString) return '';
	
	try {
		const date = new Date(isoString);
		return date.toISOString().split('T')[0];
	} catch (error) {
		return '';
	}
}