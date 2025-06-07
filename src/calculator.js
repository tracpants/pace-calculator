export function parseTime(timeStr) {
	if (!timeStr || typeof timeStr !== 'string') return 0;
	const trimmed = timeStr.trim();
	if (!trimmed) return 0;
	
	const parts = trimmed.split(":").map((p) => parseInt(p) || 0);
	if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
	if (parts.length === 2) return parts[0] * 60 + parts[1];
	if (parts.length === 1) return parts[0] * 60; // Handle single number as minutes
	return 0;
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