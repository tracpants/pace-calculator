# Distance Configuration Centralization

## Overview

This refactor centralizes all distance-related configuration into a single source of truth, eliminating code duplication and improving maintainability.

## Before the Refactor

Previously, distance configurations were scattered across multiple files:

1. **settings.js**: `presets` object with km/miles values
2. **ui.js**: Duplicate `presets` object + `distanceSuggestions` array
3. **pr.js**: `STANDARD_DISTANCES` object with km-only values

This led to:
- Code duplication
- Inconsistent distance values
- Maintenance overhead when adding new distances
- Risk of inconsistencies between components

## After the Refactor

### New Architecture

**`src/distances.js`** - Single source of truth for all distance data:

```javascript
// Core distance data in km
const RACE_DISTANCES_KM = {
  "1k": 1,
  "5k": 5,
  "10k": 10,
  "half-marathon": 21.0975,
  "marathon": 42.195,
  // ... etc
};

// Exported functions for different use cases
export function getRaceDistances()      // For dropdowns (km + miles)
export function getRaceDistancesKm()   // For PR storage (km only)
export function getDistanceSuggestions() // For autocomplete
export function findDistanceKey()      // For matching distances
export function getDistanceDisplayName() // For UI labels
// ... more utility functions
```

### Refactored Components

1. **settings.js**: Uses `getRaceDistances()` and `getDistanceValue()`
2. **ui.js**: Uses `getRaceDistances()`, `getDistanceSuggestions()`, `findDistanceKey()`
3. **pr.js**: Uses `getRaceDistancesKm()`, `normalizeDistanceToKm()`, `findDistanceKey()`

## Benefits

### ✅ Maintainability
- Single place to add/modify race distances
- Consistent distance values across all components
- Clear separation of concerns

### ✅ Consistency
- All components use the same distance data
- Unified display name formatting
- Standardized conversion functions

### ✅ Flexibility
- Easy to add new race distances
- Simple to modify existing distances
- Different functions for different use cases

### ✅ Reliability
- Eliminates risk of inconsistent distance values
- Centralized validation and normalization
- Better error handling

## Usage Examples

### Adding a New Distance

Before (required changes in 3 files):
```javascript
// settings.js
"new-race": { km: 15.5, miles: 9.632 },

// ui.js
"new-race": { km: 15.5, miles: 9.632 }, // duplicate!

// pr.js
'new-race': 15.5,
```

After (single change):
```javascript
// distances.js only
const RACE_DISTANCES_KM = {
  // ... existing distances
  "new-race": 15.5,  // Auto-calculates miles
};
```

### Using Distance Functions

```javascript
// Get dropdown options with both km and miles
const distances = getRaceDistances();
// { "5k": { km: 5, miles: 3.107 }, ... }

// Get autocomplete suggestions
const suggestions = getDistanceSuggestions();
// { km: [1, 1.5, 2, ...], miles: [0.5, 1, 1.5, ...] }

// Find distance key by value
const key = findDistanceKey(5, 'km'); // Returns "5k"

// Get display name
const name = getDistanceDisplayName('half-marathon'); // Returns "HALF MARATHON"
```

## Migration Notes

- All existing functionality preserved
- No breaking changes to public APIs
- Same user experience
- Improved code maintainability

## Files Modified

- ✅ `src/distances.js` - **NEW** centralized configuration
- ✅ `src/settings.js` - Refactored to use centralized config
- ✅ `src/ui.js` - Refactored to use centralized config  
- ✅ `src/pr.js` - Refactored to use centralized config

## Testing

- [x] Syntax validation passed for all files
- [x] Development server starts successfully
- [x] No duplicate distance configurations remain
- [x] All imports updated correctly

## Ultra Distance Support Added ✅

**NEW**: Added comprehensive ultra distance support including:

### Ultra Distances Available
- **50K** (50km / 31.07 miles)
- **50 Mile** (80.47km / 50 miles) 
- **100K** (100km / 62.14 miles)
- **100 Mile** (160.93km / 100 miles)
- **12 Hour** (120km / 74.56 miles) - Typical distance
- **24 Hour** (200km / 124.27 miles) - Typical distance
- **48 Hour** (350km / 217.48 miles) - Typical distance
- **6 Day** (800km / 497.10 miles) - Typical distance

### New Utility Functions
```javascript
// Check if distance is ultra (>42.195km)
isUltraDistance(50, 'km'); // true
isUltraDistance(26.2, 'miles'); // false (marathon)

// Get distance category
getDistanceCategory(100, 'km'); // "ultra"
getDistanceCategory(10, 'km');  // "middle"

// Get only ultra distances
const ultras = getUltraDistances();

// Get distances by category
const sprints = getDistancesByCategory('sprint');
```

### Enhanced Autocomplete
- Extended distance suggestions up to 1000km/500 miles
- Better support for ultra distance inputs
- Organized by distance categories

## Future Improvements

With this centralized configuration, future enhancements become easier:

1. **Dynamic distance loading** from external APIs
2. **User-defined custom distances**
3. ✅ **Distance categories** (sprint, middle, long, ultra) - **IMPLEMENTED**
4. **Localized distance names**
5. **Additional distance metadata** (difficulty, popularity, etc.)
6. **Ultra-specific features** (aid station planning, multi-day pacing)