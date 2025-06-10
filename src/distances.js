/**
 * Centralized Distance Configuration
 * 
 * This file serves as the single source of truth for all race distances
 * and distance-related data used throughout the application.
 */

// Conversion constants
export const CONVERSIONS = {
    KM_TO_MILES: 0.621371,
    MILES_TO_KM: 1.609344
};

/**
 * Standard race distances with precise values
 * All distances stored in kilometers for consistency
 * Includes sprint, middle, long, and ultra distances
 */
const RACE_DISTANCES_KM = {
    // Sprint distances
    "1k": 1,
    "1-mile": 1.609344,
    "2k": 2,
    "3k": 3,
    
    // Middle distances
    "5k": 5,
    "8k": 8,
    "10k": 10,
    "12k": 12,
    "15k": 15,
    "10-mile": 16.09344,
    
    // Long distances
    "half-marathon": 21.0975,
    "25k": 25,
    "30k": 30,
    "marathon": 42.195,
    
    // Ultra distances
    "50k": 50,
    "50-mile": 80.4672,    // 50 miles
    "100k": 100,
    "100-mile": 160.9344,  // 100 miles
    "12-hour": 120,        // Typical 12-hour race distance (estimate)
    "24-hour": 200,        // Typical 24-hour race distance (estimate)
    "48-hour": 350,        // Typical 48-hour race distance (estimate)
    "6-day": 800,          // Typical 6-day race distance (estimate)
};

/**
 * Convert kilometers to miles using precise conversion factor
 */
function kmToMiles(km) {
    return km * CONVERSIONS.KM_TO_MILES;
}

/**
 * Convert miles to kilometers using precise conversion factor
 */
function milesToKm(miles) {
    return miles * CONVERSIONS.MILES_TO_KM;
}

/**
 * Get all race distances with both km and miles values
 * Used for dropdowns and presets
 */
export function getRaceDistances() {
    const distances = {};
    
    for (const [key, kmValue] of Object.entries(RACE_DISTANCES_KM)) {
        distances[key] = {
            km: kmValue,
            miles: kmToMiles(kmValue)
        };
    }
    
    return distances;
}

/**
 * Get race distances in kilometers only
 * Used for PR logic and storage
 */
export function getRaceDistancesKm() {
    return { ...RACE_DISTANCES_KM };
}

/**
 * Get distance suggestions for autocomplete
 * Includes common fractional distances and ultra distances for better UX
 */
export function getDistanceSuggestions() {
    return {
        km: [
            // Sprint & middle distances
            1, 1.5, 2, 3, 5, 8, 10, 12, 15, 
            16.09, // 10 miles
            // Long distances
            21.0975, // half marathon
            25, 30, 
            42.195, // marathon
            // Ultra distances
            50, 60, 80.47, // 50 miles
            100, 120, 150, 160.93, // 100 miles
            200, 250, 300, 350, 400, 500, 600, 700, 800, 1000
        ],
        miles: [
            // Sprint & middle distances
            0.5, 1, 1.5, 2, 3, 
            3.107, // 5k
            5, 
            6.214, // 10k
            8, 10, 
            13.109, // half marathon
            15, 20, 
            26.219, // marathon
            // Ultra distances
            31, 40, 50, 62, // 100k
            75, 100, 125, 150, 200, 250, 300, 400, 500
        ]
    };
}

/**
 * Get formatted display name for a distance
 * @param {string} key - Distance key (e.g., "half-marathon")
 * @returns {string} - Formatted display name (e.g., "HALF MARATHON")
 */
export function getDistanceDisplayName(key) {
    return key.replace(/[-_]/g, " ").toUpperCase();
}

/**
 * Find distance key by approximate distance value
 * @param {number} distance - Distance value
 * @param {string} unit - Unit ("km" or "miles")
 * @param {number} tolerance - Tolerance for matching (default: 0.1 km)
 * @returns {string|null} - Distance key or null if no match
 */
export function findDistanceKey(distance, unit, tolerance = 0.1) {
    // Convert to km for comparison
    const distanceKm = unit === "miles" ? milesToKm(distance) : distance;
    
    for (const [key, kmValue] of Object.entries(RACE_DISTANCES_KM)) {
        if (Math.abs(distanceKm - kmValue) <= tolerance) {
            return key;
        }
    }
    
    return null;
}

/**
 * Get distance value for a specific key and unit
 * @param {string} key - Distance key
 * @param {string} unit - Unit ("km" or "miles")
 * @returns {number|null} - Distance value or null if key doesn't exist
 */
export function getDistanceValue(key, unit) {
    const kmValue = RACE_DISTANCES_KM[key];
    if (!kmValue) return null;
    
    return unit === "miles" ? kmToMiles(kmValue) : kmValue;
}

/**
 * Get all distance keys sorted by distance
 * @returns {string[]} - Array of distance keys
 */
export function getDistanceKeys() {
    return Object.keys(RACE_DISTANCES_KM).sort((a, b) => {
        return RACE_DISTANCES_KM[a] - RACE_DISTANCES_KM[b];
    });
}

/**
 * Check if a distance is a standard race distance
 * @param {number} distance - Distance value
 * @param {string} unit - Unit ("km" or "miles")
 * @param {number} tolerance - Tolerance for matching (default: 0.1 km)
 * @returns {boolean} - True if it's a standard race distance
 */
export function isStandardRaceDistance(distance, unit, tolerance = 0.1) {
    return findDistanceKey(distance, unit, tolerance) !== null;
}

/**
 * Get the normalized distance in km for storage
 * @param {number} distance - Distance value
 * @param {string} unit - Unit ("km" or "miles")
 * @returns {number} - Distance in kilometers
 */
export function normalizeDistanceToKm(distance, unit) {
    return unit === "miles" ? milesToKm(distance) : distance;
}

/**
 * Convert distance from km to specified unit
 * @param {number} distanceKm - Distance in kilometers
 * @param {string} unit - Target unit ("km" or "miles")
 * @returns {number} - Distance in target unit
 */
export function convertFromKm(distanceKm, unit) {
    return unit === "miles" ? kmToMiles(distanceKm) : distanceKm;
}

/**
 * Distance categories for better organization
 */
export const DISTANCE_CATEGORIES = {
    SPRINT: "sprint",
    MIDDLE: "middle", 
    LONG: "long",
    ULTRA: "ultra"
};

/**
 * Get distance category for a distance
 * @param {number} distance - Distance value
 * @param {string} unit - Unit ("km" or "miles")
 * @returns {string} - Distance category
 */
export function getDistanceCategory(distance, unit) {
    const distanceKm = normalizeDistanceToKm(distance, unit);
    
    if (distanceKm <= 3) return DISTANCE_CATEGORIES.SPRINT;
    if (distanceKm <= 21) return DISTANCE_CATEGORIES.MIDDLE;
    if (distanceKm <= 42.195) return DISTANCE_CATEGORIES.LONG;
    return DISTANCE_CATEGORIES.ULTRA;
}

/**
 * Check if a distance is an ultra distance (>42.195km/26.2miles)
 * @param {number} distance - Distance value
 * @param {string} unit - Unit ("km" or "miles")
 * @returns {boolean} - True if ultra distance
 */
export function isUltraDistance(distance, unit) {
    return getDistanceCategory(distance, unit) === DISTANCE_CATEGORIES.ULTRA;
}

/**
 * Get distances by category
 * @param {string} category - Distance category
 * @returns {Object} - Object with distance keys in that category
 */
export function getDistancesByCategory(category) {
    const allDistances = getRaceDistances();
    const result = {};
    
    for (const [key, value] of Object.entries(allDistances)) {
        if (getDistanceCategory(value.km, 'km') === category) {
            result[key] = value;
        }
    }
    
    return result;
}

/**
 * Get ultra distances only
 * @returns {Object} - Object with ultra distance keys only
 */
export function getUltraDistances() {
    return getDistancesByCategory(DISTANCE_CATEGORIES.ULTRA);
}