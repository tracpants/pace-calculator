# Distance Configuration Refactor

## Overview
This refactor centralizes all distance configuration into a single source of truth (`src/distances.js`), eliminating code duplication and improving maintainability.

## Changes Made

### 1. Created `src/distances.js`
- **Single source of truth** for all race distances
- Contains all distances from 1K to ultra distances (6-day races)
- Provides comprehensive utility functions for distance management
- Includes distance categorization (sprint, middle, long, ultra)
- Extended support for ultra distances up to 1000km/500 miles in autocomplete

### 2. Refactored `src/settings.js`
- **Removed:** Duplicate `presets` object (23 lines)
- **Added:** Imports from centralized `distances.js`
- **Updated:** `populateDefaultDistanceSelect()` to use `getRaceDistances()` and `getDistanceDisplayName()`
- **Updated:** `applyDefaultDistance()` to use `getDistanceValue()`

### 3. Refactored `src/ui.js`
- **Removed:** Duplicate `presets` object (16 lines) and `distanceSuggestions` array (4 lines)
- **Added:** Imports from centralized `distances.js`
- **Updated:** `populatePresetSelects()` to use `getRaceDistances()` and `getDistanceDisplayName()`
- **Updated:** `populateAutocomplete()` to use `getDistanceSuggestions()`
- **Updated:** `resetPresetDropdown()` to use `findDistanceKey()`
- **Updated:** Preset selection handling to use centralized functions

### 4. Refactored `src/pr.js`
- **Removed:** `STANDARD_DISTANCES` object (6 lines) and local `normalizeDistance()` function (6 lines)
- **Added:** Imports from centralized `distances.js`
- **Updated:** All functions to use centralized utilities:
  - `getPRForDistance()` uses `getRaceDistancesKm()`
  - `setPR()`, `removePR()`, `comparePaceWithPR()` use `normalizeDistanceToKm()`
  - `getAllPRs()` uses `findDistanceKey()` and `getDistanceDisplayName()`
  - `getDistanceName()` uses `findDistanceKey()` and `getDistanceDisplayName()`

## Benefits

### Before (Duplicated Code)
- **3 separate** distance configurations to maintain
- **Inconsistent** distance values across components
- **49 lines** of duplicated distance data
- **Error-prone** when adding new distances

### After (Centralized System)
- **1 single** source of truth for all distances
- **Consistent** distance values everywhere
- **15+ utility functions** for different use cases
- **Easy maintenance** - add distances in one place
- **Enhanced autocomplete** with extended distance suggestions
- **Ultra distance support** with proper categorization

## Ultra Distance Support Added
- **50K, 50-mile, 100K, 100-mile** - Standard ultra distances
- **12-hour, 24-hour, 48-hour, 6-day** - Time-based ultra events
- **Categorization system** - sprint, middle, long, ultra
- **Extended autocomplete** - suggestions up to 1000km/500 miles
- **Utility functions** - `isUltraDistance()`, `getUltraDistances()`, `getDistancesByCategory()`

## Code Quality Improvements
- **DRY principle** - Don't Repeat Yourself
- **Single responsibility** - One module for distance management
- **Maintainability** - Easier to add/modify distances
- **Type safety** - Centralized validation and conversion
- **Consistency** - All components use same distance values

## Testing
- ✅ Dev server starts without errors
- ✅ All distance dropdowns populate correctly
- ✅ Distance autocomplete works with extended suggestions
- ✅ PR functionality uses centralized distance utilities
- ✅ Settings modal shows all distances including ultra distances
- ✅ No console errors during operation
