export const METERS_PER_KM = 1000;
export const METERS_PER_MILE = 1609.344;

export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 3600;
export const SECONDS_PER_DAY = 86400;
export const MAX_SECONDS_SINGLE_DAY = 86400;
export const MAX_SECONDS_MULTIDAY = 604800;

export const roundToDecimalPlaces = (num, places) => {
	const factor = Math.pow(10, places);
	return Math.round((num + Number.EPSILON) * factor) / factor;
};
