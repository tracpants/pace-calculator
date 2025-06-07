export function parseTime(timeStr) {
	if (!timeStr || typeof timeStr !== 'string') return 0;
	const trimmed = timeStr.trim();
	if (!trimmed) return 0;
	
	// Handle decimal format (e.g., "4.5" = 4:30)
	if (/^\d+(\.\d+)?$/.test(trimmed)) {
		const decimal = parseFloat(trimmed);
		const minutes = Math.floor(decimal);
		const seconds = Math.round((decimal - minutes) * 60);
		return minutes * 60 + seconds;
	}
	
	// Handle space-separated format (e.g., "4 30" = 4:30)
	if (/^\d+\s+\d+(\s+\d+)?$/.test(trimmed)) {
		const parts = trimmed.split(/\s+/).map(p => parseInt(p) || 0);
		if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
		if (parts.length === 2) return parts[0] * 60 + parts[1];
		return 0;
	}
	
	// Handle colon-separated format (e.g., "4:30" or "1:23:45")
	if (trimmed.includes(':')) {
		const parts = trimmed.split(":").map((p) => parseInt(p) || 0);
		if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
		if (parts.length === 2) return parts[0] * 60 + parts[1];
		return 0;
	}
	
	// Handle single number as minutes
	const singleNumber = parseInt(trimmed);
	if (!isNaN(singleNumber)) return singleNumber * 60;
	
	return 0;
}

export function validateTimeInput(timeStr) {
	if (!timeStr || typeof timeStr !== 'string') return { valid: false, message: "Time is required" };
	const trimmed = timeStr.trim();
	if (!trimmed) return { valid: false, message: "Time is required" };
	
	// Check for valid formats
	const validFormats = [
		/^\d+(\.\d+)?$/, // Decimal: 4.5
		/^\d+\s+\d+(\s+\d+)?$/, // Space: 4 30 or 1 23 45
		/^\d+:\d+(:\d+)?$/, // Colon: 4:30 or 1:23:45
		/^\d+$/ // Single number
	];
	
	const isValidFormat = validFormats.some(format => format.test(trimmed));
	if (!isValidFormat) {
		return { valid: false, message: "Invalid format. Use MM:SS, H:MM:SS, or decimal minutes" };
	}
	
	const parsed = parseTime(timeStr);
	if (parsed <= 0) {
		return { valid: false, message: "Time must be greater than 0" };
	}
	
	// Check for reasonable limits (max 24 hours)
	if (parsed > 86400) {
		return { valid: false, message: "Time cannot exceed 24 hours" };
	}
	
	return { valid: true, value: parsed };
}

export function validateDistanceInput(distanceStr) {
	if (!distanceStr) return { valid: false, message: "Distance is required" };
	const distance = parseFloat(distanceStr);
	
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

export function formatTime(seconds, includeHours = false) {
	if (isNaN(seconds) || seconds < 0) return "00:00";
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	if (includeHours && hours > 0) {
		return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
			2,
			"0"
		)}:${String(secs).padStart(2, "0")}`;
	}
	const totalMinutes = hours * 60 + minutes;
	return `${String(totalMinutes).padStart(2, "0")}:${String(secs).padStart(
		2,
		"0"
	)}`;
}

export function calculatePace(totalSeconds, distance, unit) {
	const distanceInMeters =
		unit === "km" ? distance * 1000 : distance * 1609.344;
	if (distanceInMeters <= 0) return { pacePerKm: 0, pacePerMile: 0 };

	const pacePerKm = totalSeconds / (distanceInMeters / 1000);
	const pacePerMile = totalSeconds / (distanceInMeters / 1609.344);
	return { pacePerKm, pacePerMile };
}

export function calculateTime(paceSeconds, distance, paceUnit, distanceUnit) {
	const distanceInMeters =
		distanceUnit === "km" ? distance * 1000 : distance * 1609.344;
	const paceSecondsPerMeter =
		paceUnit === "km" ? paceSeconds / 1000 : paceSeconds / 1609.344;
	return distanceInMeters * paceSecondsPerMeter;
}

export function calculateDistance(totalSeconds, paceSeconds, paceUnit) {
	const paceSecondsPerMeter =
		paceUnit === "km" ? paceSeconds / 1000 : paceSeconds / 1609.344;
	if (paceSecondsPerMeter <= 0) return { km: 0, miles: 0 };
	const distanceInMeters = totalSeconds / paceSecondsPerMeter;
	return {
		km: distanceInMeters / 1000,
		miles: distanceInMeters / 1609.344,
	};
}