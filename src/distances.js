/**
 * Centralized distance configuration for the pace calculator
 * Single source of truth for all race distances and distance-related utilities
 */

// All race distances stored in kilometers for consistency
// This is the single source of truth for all distance calculations
const RACE_DISTANCES_KM = {
    // Sprint distances (up to 3K)
    "1k": 1,
    "1-mile": 1.609344,
    "2k": 2,
    "3k": 3,

    // Middle distances (3K to 15K)
    "5k": 5,
    "8k": 8,
    "10k": 10,
    "12k": 12,
    "15k": 15,

    // Long distances (10-mile to marathon)
    "10-mile": 16.09344,
    "half-marathon": 21.0975,
    "25k": 25,
    "30k": 30,
    "marathon": 42.195,

    // Ultra distances (50K and beyond)
    "50k": 50,
    "50-mile": 80.4672,
    "100k": 100,
    "100-mile": 160.9344,
    "12-hour": 120,    // Estimated distance for 12-hour race
    "24-hour": 200,    // Estimated distance for 24-hour race
    "48-hour": 350,    // Estimated distance for 48-hour race
    "6-day": 800,      // Estimated distance for 6-day race
};

// Distance categories for organization
const DISTANCE_CATEGORIES = {
    sprint: ["1k", "1-mile", "2k", "3k"],
    middle: ["5k", "8k", "10k", "12k", "15k"],
    long: ["10-mile", "half-marathon", "25k", "30k", "marathon"],
    ultra: ["50k", "50-mile", "100k", "100-mile", "12-hour", "24-hour", "48-hour", "6-day"]
};

// Display names for better UX
const DISTANCE_DISPLAY_NAMES = {
    "1k": "1K",
    "1-mile": "1 Mile",
    "2k": "2K", 
    "3k": "3K",
    "5k": "5K",
    "8k": "8K",
    "10k": "10K",
    "12k": "12K",
    "15k": "15K",
    "10-mile": "10 Mile",
    "half-marathon": "Half Marathon",
    "25k": "25K",
    "30k": "30K",
    "marathon": "Marathon",
    "50k": "50K",
    "50-mile": "50 Mile", 
    "100k": "100K",
    "100-mile": "100 Mile",
    "12-hour": "12 Hour",
    "24-hour": "24 Hour",
    "48-hour": "48 Hour",
    "6-day": "6 Day"
};

/**
 * Convert kilometers to miles
 * @param km
 */
function kmToMiles(km) {
    return km / 1.609344;
}

/**
 * Convert miles to kilometers
 * @param miles
 */
function milesToKm(miles) {
    return miles * 1.609344;
}

/**
 * Get all race distances with both km and miles values
 * @returns {object} Object with distance keys and {km, miles} values
 */
export function getRaceDistances() {
    const distances = {};
    for (const [key, km] of Object.entries(RACE_DISTANCES_KM)) {
        distances[key] = {
            km,
            miles: kmToMiles(km)
        };
    }
    return distances;
}

/**
 * Get race distances only in kilometers
 * @returns {object} Object with distance keys and kilometer values
 */
export function getRaceDistancesKm() {
    return { ...RACE_DISTANCES_KM };
}

/**
 * Get distance display name
 * @param {string} key - Distance key (e.g., "5k", "half-marathon")
 * @returns {string} Human-readable display name
 */
export function getDistanceDisplayName(key) {
    return DISTANCE_DISPLAY_NAMES[key] || key.replace("-", " ").toUpperCase();
}

/**
 * Get distance value for a specific unit
 * @param {string} key - Distance key (e.g., "5k", "marathon")
 * @param {string} unit - "km" or "miles"
 * @returns {number|null} Distance value or null if not found
 */
export function getDistanceValue(key, unit) {
    const km = RACE_DISTANCES_KM[key];
    if (!km) return null;
    
    return unit === "miles" ? kmToMiles(km) : km;
}

/**
 * Get distance suggestions for autocomplete
 * @returns {object} Object with km and miles arrays of suggested distances
 */
export function getDistanceSuggestions() {
    // Standard race distances
    const standardKm = Object.values(RACE_DISTANCES_KM);
    
    // Additional common training distances
    const additionalKm = [1.5, 6, 7, 9, 16, 18, 20, 32, 35, 40, 45, 60, 75, 90, 150, 200, 300, 400, 500, 750, 1000];
    
    // Combine and sort
    const allKm = [...new Set([...standardKm, ...additionalKm])].sort((a, b) => a - b);
    
    return {
        km: allKm,
        miles: allKm.map(kmToMiles).sort((a, b) => a - b)
    };
}

/**
 * Normalize distance to kilometers
 * @param {number} distance - Distance value
 * @param {string} unit - "km" or "miles"
 * @returns {number} Distance in kilometers
 */
export function normalizeDistanceToKm(distance, unit) {
    return unit === "miles" ? milesToKm(distance) : distance;
}

/**
 * Find distance key by value with tolerance
 * @param {number} distance - Distance value to find
 * @param {string} unit - "km" or "miles" 
 * @param {number} tolerance - Tolerance for matching (default 0.001)
 * @returns {string|null} Distance key or null if not found
 */
export function findDistanceKey(distance, unit, tolerance = 0.001) {
    const distanceKm = normalizeDistanceToKm(distance, unit);
    
    for (const [key, km] of Object.entries(RACE_DISTANCES_KM)) {
        if (Math.abs(distanceKm - km) < tolerance) {
            return key;
        }
    }
    
    return null;
}

/**
 * Check if a distance is an ultra distance
 * @param {string} key - Distance key
 * @returns {boolean} True if ultra distance
 */
export function isUltraDistance(key) {
    return DISTANCE_CATEGORIES.ultra.includes(key);
}

/**
 * Get distance category
 * @param {string} key - Distance key
 * @returns {string|null} Category name or null if not found
 */
export function getDistanceCategory(key) {
    for (const [category, distances] of Object.entries(DISTANCE_CATEGORIES)) {
        if (distances.includes(key)) {
            return category;
        }
    }
    return null;
}

/**
 * Get ultra distances only
 * @returns {object} Object with ultra distance keys and {km, miles} values
 */
export function getUltraDistances() {
    const ultraDistances = {};
    for (const key of DISTANCE_CATEGORIES.ultra) {
        const km = RACE_DISTANCES_KM[key];
        if (km) {
            ultraDistances[key] = {
                km,
                miles: kmToMiles(km)
            };
        }
    }
    return ultraDistances;
}

/**
 * Get distances by category
 * @param {string} category - "sprint", "middle", "long", or "ultra"
 * @returns {object} Object with distance keys and {km, miles} values for that category
 */
export function getDistancesByCategory(category) {
    const categoryDistances = {};
    const keys = DISTANCE_CATEGORIES[category] || [];
    
    for (const key of keys) {
        const km = RACE_DISTANCES_KM[key];
        if (km) {
            categoryDistances[key] = {
                km,
                miles: kmToMiles(km)
            };
        }
    }
    
    return categoryDistances;
}