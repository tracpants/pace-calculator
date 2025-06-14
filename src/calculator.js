// Conversion constants for consistent calculations across the application
const METERS_PER_KM = 1000;
const METERS_PER_MILE = 1609.344; // Exact international mile
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;
const MAX_SECONDS_SINGLE_DAY = 86400; // 24 hours for regular races
const MAX_SECONDS_MULTIDAY = 604800; // 7 days maximum for ultra events

// Precision helpers
const roundToDecimalPlaces = (num, places) => {
	const factor = Math.pow(10, places);
	return Math.round((num + Number.EPSILON) * factor) / factor;
};

export function parseTime(timeStr) {
	if (!timeStr || typeof timeStr !== 'string') return 0;
	const trimmed = timeStr.trim();
	if (!trimmed) return 0;
	
	// Handle decimal format (e.g., "4.5" = 4:30)
	if (/^\d+(\.\d+)?$/.test(trimmed)) {
		const decimal = parseFloat(trimmed);
		const minutes = Math.floor(decimal);
		const seconds = Math.floor((decimal - minutes) * SECONDS_PER_MINUTE);
		return minutes * SECONDS_PER_MINUTE + seconds;
	}
	
	// Handle space-separated format (e.g., "4 30" = 4:30 or "2 1 23 45" = 2 days 1:23:45)
	if (/^\d+\s+\d+(\s+\d+)?(\s+\d+)?$/.test(trimmed)) {
		const parts = trimmed.split(/\s+/).map(p => parseInt(p) || 0);
		if (parts.length === 4) {
			// Days Hours Minutes Seconds
			return parts[0] * SECONDS_PER_DAY + parts[1] * SECONDS_PER_HOUR + parts[2] * SECONDS_PER_MINUTE + parts[3];
		}
		if (parts.length === 3) {
			// Hours Minutes Seconds
			return parts[0] * SECONDS_PER_HOUR + parts[1] * SECONDS_PER_MINUTE + parts[2];
		}
		if (parts.length === 2) {
			// Minutes Seconds
			return parts[0] * SECONDS_PER_MINUTE + parts[1];
		}
		return 0;
	}
	
	// Handle colon-separated format (e.g., "4:30", "1:23:45", or "2:1:23:45")
	if (trimmed.includes(':')) {
		const parts = trimmed.split(":").map(p => parseInt(p) || 0);
		if (parts.length === 4) {
			// Days:Hours:Minutes:Seconds
			return parts[0] * SECONDS_PER_DAY + parts[1] * SECONDS_PER_HOUR + parts[2] * SECONDS_PER_MINUTE + parts[3];
		}
		if (parts.length === 3) {
			// Hours:Minutes:Seconds
			return parts[0] * SECONDS_PER_HOUR + parts[1] * SECONDS_PER_MINUTE + parts[2];
		}
		if (parts.length === 2) {
			// Minutes:Seconds
			return parts[0] * SECONDS_PER_MINUTE + parts[1];
		}
		return 0;
	}
	
	// Handle single number as minutes
	const singleNumber = parseInt(trimmed);
	if (!isNaN(singleNumber)) return singleNumber * SECONDS_PER_MINUTE;
	
	return 0;
}

export function validateTimeInput(timeStr, allowMultiday = false) {
	if (!timeStr || typeof timeStr !== 'string') return { valid: false, message: "Time is required" };
	const trimmed = timeStr.trim();
	if (!trimmed) return { valid: false, message: "Time is required" };
	
	// Check for valid formats including multi-day
	const validFormats = [
		/^\d+(\.\d+)?$/, // Decimal: 4.5
		/^\d+\s+\d+(\s+\d+)?(\s+\d+)?$/, // Space: 4 30, 1 23 45, or 2 1 23 45 (days hours mins secs)
		/^\d+:\d+(:\d+)?(:\d+)?$/, // Colon: 4:30, 1:23:45, or 2:1:23:45 (days:hours:mins:secs)
		/^\d+$/ // Single number
	];
	
	const isValidFormat = validFormats.some(format => format.test(trimmed));
	if (!isValidFormat) {
		return { valid: false, message: "Invalid format. Use MM:SS, H:MM:SS, or D:H:MM:SS for multi-day events" };
	}
	
	const parsed = parseTime(timeStr);
	if (parsed <= 0) {
		return { valid: false, message: "Time must be greater than 0" };
	}
	
	// Check for reasonable limits based on context
	if (allowMultiday) {
		if (parsed > MAX_SECONDS_MULTIDAY) {
			return { valid: false, message: "Time cannot exceed 7 days" };
		}
	} else {
		// For single-day mode, reject anything > 24 hours (allow exactly 24 hours for backward compatibility)
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
	
	// Check for valid number format (including decimals)
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

export function formatTime(seconds, includeHours = false, allowMultiday = false) {
	if (isNaN(seconds) || seconds < 0) return "00:00";
	
	// Round to nearest second to avoid display inconsistencies
	const totalSeconds = Math.round(seconds);
	
	// Calculate time components
	const days = Math.floor(totalSeconds / SECONDS_PER_DAY);
	const remainingAfterDays = totalSeconds % SECONDS_PER_DAY;
	const hours = Math.floor(remainingAfterDays / SECONDS_PER_HOUR);
	const minutes = Math.floor((remainingAfterDays % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
	const secs = remainingAfterDays % SECONDS_PER_MINUTE;

	// Multi-day formatting (≥ 24 hours)
	if (allowMultiday && totalSeconds >= SECONDS_PER_DAY) {
		const dayText = days === 1 ? "day" : "days";
		return `${days} ${dayText} ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
	}
	
	// Single-day formatting
	if (includeHours && totalSeconds >= SECONDS_PER_HOUR) {
		// For times ≥ 1 hour, show HH:MM:SS
		const totalHours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
		const remainingMinutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
		const remainingSecs = totalSeconds % SECONDS_PER_MINUTE;
		
		return `${String(totalHours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}:${String(remainingSecs).padStart(2, "0")}`;
	}
	
	// For times < 1 hour, show MM:SS (with total minutes if > 59)
	const totalMinutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
	const remainingSecs = totalSeconds % SECONDS_PER_MINUTE;
	
	return `${String(totalMinutes).padStart(2, "0")}:${String(remainingSecs).padStart(2, "0")}`;
}

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

// Helper function to determine if a distance suggests multi-day racing
export function isMultidayDistance(distanceKm) {
	// Ultra distances that commonly involve multi-day times:
	// 100K+ often takes > 24h for many runners
	// 100 miles definitely multi-day for most
	// 24-hour+ race distances are inherently multi-day
	return distanceKm >= 100; // 100K and above often involve multi-day times
}

// Helper function to detect if time inputs suggest multi-day context
export function shouldAllowMultiday(selectedDistance, currentTimeSeconds) {
	// Allow multi-day if:
	// 1. Selected distance is ultra-long (100K+)
	// 2. Current time input is already > 20 hours (suggesting ultra context)
	const distanceKm = selectedDistance || 0;
	const timeHours = (currentTimeSeconds || 0) / SECONDS_PER_HOUR;
	
	return isMultidayDistance(distanceKm) || timeHours > 20;
}

