import { describe, it, expect } from 'vitest';
import {
  getRaceDistances,
  getRaceDistancesKm,
  getDistanceDisplayName,
  getDistanceValue,
  getDistanceSuggestions,
  normalizeDistanceToKm,
  findDistanceKey,
  isUltraDistance,
  getDistanceCategory,
  getUltraDistances,
  getDistancesByCategory
} from '../../src/distances.js';

describe('Distance Utilities', () => {
  describe('getRaceDistances', () => {
    it('should return all race distances with km and miles', () => {
      const distances = getRaceDistances();

      expect(distances).toBeTruthy();
      expect(distances['5k']).toBeDefined();
      expect(distances['5k'].km).toBe(5);
      expect(distances['5k'].miles).toBeCloseTo(3.106856, 5);

      expect(distances['marathon']).toBeDefined();
      expect(distances['marathon'].km).toBe(42.195);
      expect(distances['marathon'].miles).toBeCloseTo(26.21876, 5);
    });

    it('should include sprint distances', () => {
      const distances = getRaceDistances();

      expect(distances['1k']).toBeDefined();
      expect(distances['1-mile']).toBeDefined();
      expect(distances['2k']).toBeDefined();
      expect(distances['3k']).toBeDefined();
    });

    it('should include middle distances', () => {
      const distances = getRaceDistances();

      expect(distances['5k']).toBeDefined();
      expect(distances['8k']).toBeDefined();
      expect(distances['10k']).toBeDefined();
      expect(distances['12k']).toBeDefined();
      expect(distances['15k']).toBeDefined();
    });

    it('should include long distances', () => {
      const distances = getRaceDistances();

      expect(distances['10-mile']).toBeDefined();
      expect(distances['half-marathon']).toBeDefined();
      expect(distances['25k']).toBeDefined();
      expect(distances['30k']).toBeDefined();
      expect(distances['marathon']).toBeDefined();
    });

    it('should include ultra distances', () => {
      const distances = getRaceDistances();

      expect(distances['50k']).toBeDefined();
      expect(distances['50-mile']).toBeDefined();
      expect(distances['100k']).toBeDefined();
      expect(distances['100-mile']).toBeDefined();
      expect(distances['12-hour']).toBeDefined();
      expect(distances['24-hour']).toBeDefined();
    });
  });

  describe('getRaceDistancesKm', () => {
    it('should return all race distances in km only', () => {
      const distances = getRaceDistancesKm();

      expect(distances['5k']).toBe(5);
      expect(distances['10k']).toBe(10);
      expect(distances['marathon']).toBe(42.195);
      expect(distances['half-marathon']).toBe(21.0975);
    });

    it('should return a copy of the distances object', () => {
      const distances1 = getRaceDistancesKm();
      const distances2 = getRaceDistancesKm();

      expect(distances1).not.toBe(distances2);
      expect(distances1).toEqual(distances2);
    });
  });

  describe('getDistanceDisplayName', () => {
    it('should return proper display names', () => {
      expect(getDistanceDisplayName('5k')).toBe('5K');
      expect(getDistanceDisplayName('10k')).toBe('10K');
      expect(getDistanceDisplayName('half-marathon')).toBe('Half Marathon');
      expect(getDistanceDisplayName('marathon')).toBe('Marathon');
      expect(getDistanceDisplayName('1-mile')).toBe('1 Mile');
      expect(getDistanceDisplayName('100-mile')).toBe('100 Mile');
    });

    it('should handle unknown distances with fallback', () => {
      const result = getDistanceDisplayName('unknown-distance');
      expect(result).toBe('UNKNOWN DISTANCE');
    });

    it('should handle distances with dashes', () => {
      expect(getDistanceDisplayName('10-mile')).toBe('10 Mile');
      expect(getDistanceDisplayName('50-mile')).toBe('50 Mile');
    });
  });

  describe('getDistanceValue', () => {
    it('should return distance in km', () => {
      expect(getDistanceValue('5k', 'km')).toBe(5);
      expect(getDistanceValue('10k', 'km')).toBe(10);
      expect(getDistanceValue('marathon', 'km')).toBe(42.195);
    });

    it('should return distance in miles', () => {
      expect(getDistanceValue('5k', 'miles')).toBeCloseTo(3.106856, 5);
      expect(getDistanceValue('10k', 'miles')).toBeCloseTo(6.213712, 5);
      expect(getDistanceValue('marathon', 'miles')).toBeCloseTo(26.21876, 5);
    });

    it('should return null for unknown distance', () => {
      expect(getDistanceValue('unknown', 'km')).toBeNull();
      expect(getDistanceValue('unknown', 'miles')).toBeNull();
    });

    it('should handle 1-mile distance', () => {
      expect(getDistanceValue('1-mile', 'miles')).toBeCloseTo(1, 5);
      expect(getDistanceValue('1-mile', 'km')).toBeCloseTo(1.609344, 5);
    });
  });

  describe('getDistanceSuggestions', () => {
    it('should return suggestions for km and miles', () => {
      const suggestions = getDistanceSuggestions();

      expect(suggestions.km).toBeDefined();
      expect(suggestions.miles).toBeDefined();
      expect(Array.isArray(suggestions.km)).toBe(true);
      expect(Array.isArray(suggestions.miles)).toBe(true);
    });

    it('should include standard race distances', () => {
      const suggestions = getDistanceSuggestions();

      expect(suggestions.km).toContain(5);
      expect(suggestions.km).toContain(10);
      expect(suggestions.km).toContain(21.0975);
      expect(suggestions.km).toContain(42.195);
    });

    it('should include common training distances', () => {
      const suggestions = getDistanceSuggestions();

      expect(suggestions.km).toContain(1.5);
      expect(suggestions.km).toContain(6);
      expect(suggestions.km).toContain(18);
      expect(suggestions.km).toContain(20);
    });

    it('should have no duplicates', () => {
      const suggestions = getDistanceSuggestions();

      const uniqueKm = [...new Set(suggestions.km)];
      const uniqueMiles = [...new Set(suggestions.miles)];

      expect(suggestions.km.length).toBe(uniqueKm.length);
      expect(suggestions.miles.length).toBe(uniqueMiles.length);
    });

    it('should be sorted in ascending order', () => {
      const suggestions = getDistanceSuggestions();

      const sortedKm = [...suggestions.km].sort((a, b) => a - b);
      const sortedMiles = [...suggestions.miles].sort((a, b) => a - b);

      expect(suggestions.km).toEqual(sortedKm);
      expect(suggestions.miles).toEqual(sortedMiles);
    });
  });

  describe('normalizeDistanceToKm', () => {
    it('should return same value for km', () => {
      expect(normalizeDistanceToKm(5, 'km')).toBe(5);
      expect(normalizeDistanceToKm(10, 'km')).toBe(10);
      expect(normalizeDistanceToKm(42.195, 'km')).toBe(42.195);
    });

    it('should convert miles to km', () => {
      expect(normalizeDistanceToKm(1, 'miles')).toBeCloseTo(1.609344, 5);
      expect(normalizeDistanceToKm(3.1, 'miles')).toBeCloseTo(4.98896, 4);
      expect(normalizeDistanceToKm(26.2, 'miles')).toBeCloseTo(42.16481, 4);
    });

    it('should handle zero distance', () => {
      expect(normalizeDistanceToKm(0, 'km')).toBe(0);
      expect(normalizeDistanceToKm(0, 'miles')).toBe(0);
    });
  });

  describe('findDistanceKey', () => {
    it('should find distance key by km value', () => {
      expect(findDistanceKey(5, 'km')).toBe('5k');
      expect(findDistanceKey(10, 'km')).toBe('10k');
      expect(findDistanceKey(42.195, 'km')).toBe('marathon');
      expect(findDistanceKey(21.0975, 'km')).toBe('half-marathon');
    });

    it('should find distance key by miles value', () => {
      expect(findDistanceKey(1, 'miles')).toBe('1-mile');
      expect(findDistanceKey(3.106856, 'miles')).toBe('5k');
      expect(findDistanceKey(6.213712, 'miles')).toBe('10k');
    });

    it('should return null for unknown distance', () => {
      expect(findDistanceKey(7.5, 'km')).toBeNull();
      expect(findDistanceKey(4.2, 'miles')).toBeNull();
    });

    it('should handle tolerance parameter', () => {
      expect(findDistanceKey(5.0001, 'km', 0.001)).toBe('5k');
      expect(findDistanceKey(5.01, 'km', 0.001)).toBeNull();
      expect(findDistanceKey(5.01, 'km', 0.1)).toBe('5k');
    });

    it('should handle ultra distances', () => {
      expect(findDistanceKey(50, 'km')).toBe('50k');
      expect(findDistanceKey(100, 'km')).toBe('100k');
    });
  });

  describe('isUltraDistance', () => {
    it('should return true for ultra distances', () => {
      expect(isUltraDistance('50k')).toBe(true);
      expect(isUltraDistance('50-mile')).toBe(true);
      expect(isUltraDistance('100k')).toBe(true);
      expect(isUltraDistance('100-mile')).toBe(true);
      expect(isUltraDistance('12-hour')).toBe(true);
      expect(isUltraDistance('24-hour')).toBe(true);
    });

    it('should return false for non-ultra distances', () => {
      expect(isUltraDistance('5k')).toBe(false);
      expect(isUltraDistance('10k')).toBe(false);
      expect(isUltraDistance('marathon')).toBe(false);
      expect(isUltraDistance('half-marathon')).toBe(false);
    });

    it('should return false for unknown distances', () => {
      expect(isUltraDistance('unknown')).toBe(false);
    });
  });

  describe('getDistanceCategory', () => {
    it('should return sprint for sprint distances', () => {
      expect(getDistanceCategory('1k')).toBe('sprint');
      expect(getDistanceCategory('1-mile')).toBe('sprint');
      expect(getDistanceCategory('2k')).toBe('sprint');
      expect(getDistanceCategory('3k')).toBe('sprint');
    });

    it('should return middle for middle distances', () => {
      expect(getDistanceCategory('5k')).toBe('middle');
      expect(getDistanceCategory('8k')).toBe('middle');
      expect(getDistanceCategory('10k')).toBe('middle');
      expect(getDistanceCategory('15k')).toBe('middle');
    });

    it('should return long for long distances', () => {
      expect(getDistanceCategory('10-mile')).toBe('long');
      expect(getDistanceCategory('half-marathon')).toBe('long');
      expect(getDistanceCategory('marathon')).toBe('long');
    });

    it('should return ultra for ultra distances', () => {
      expect(getDistanceCategory('50k')).toBe('ultra');
      expect(getDistanceCategory('100k')).toBe('ultra');
      expect(getDistanceCategory('100-mile')).toBe('ultra');
    });

    it('should return null for unknown distances', () => {
      expect(getDistanceCategory('unknown')).toBeNull();
    });
  });

  describe('getUltraDistances', () => {
    it('should return only ultra distances', () => {
      const ultraDistances = getUltraDistances();

      expect(ultraDistances['50k']).toBeDefined();
      expect(ultraDistances['50-mile']).toBeDefined();
      expect(ultraDistances['100k']).toBeDefined();
      expect(ultraDistances['100-mile']).toBeDefined();
    });

    it('should not include non-ultra distances', () => {
      const ultraDistances = getUltraDistances();

      expect(ultraDistances['5k']).toBeUndefined();
      expect(ultraDistances['10k']).toBeUndefined();
      expect(ultraDistances['marathon']).toBeUndefined();
    });

    it('should return distances with km and miles values', () => {
      const ultraDistances = getUltraDistances();

      expect(ultraDistances['50k'].km).toBe(50);
      expect(ultraDistances['50k'].miles).toBeCloseTo(31.0686, 4);
      expect(ultraDistances['100k'].km).toBe(100);
      expect(ultraDistances['100k'].miles).toBeCloseTo(62.1371, 4);
    });
  });

  describe('getDistancesByCategory', () => {
    it('should return sprint distances', () => {
      const sprintDistances = getDistancesByCategory('sprint');

      expect(sprintDistances['1k']).toBeDefined();
      expect(sprintDistances['1-mile']).toBeDefined();
      expect(sprintDistances['2k']).toBeDefined();
      expect(sprintDistances['3k']).toBeDefined();

      expect(sprintDistances['5k']).toBeUndefined();
    });

    it('should return middle distances', () => {
      const middleDistances = getDistancesByCategory('middle');

      expect(middleDistances['5k']).toBeDefined();
      expect(middleDistances['10k']).toBeDefined();
      expect(middleDistances['15k']).toBeDefined();

      expect(middleDistances['marathon']).toBeUndefined();
    });

    it('should return long distances', () => {
      const longDistances = getDistancesByCategory('long');

      expect(longDistances['10-mile']).toBeDefined();
      expect(longDistances['half-marathon']).toBeDefined();
      expect(longDistances['marathon']).toBeDefined();

      expect(longDistances['50k']).toBeUndefined();
    });

    it('should return ultra distances', () => {
      const ultraDistances = getDistancesByCategory('ultra');

      expect(ultraDistances['50k']).toBeDefined();
      expect(ultraDistances['100k']).toBeDefined();

      expect(ultraDistances['marathon']).toBeUndefined();
    });

    it('should return empty object for unknown category', () => {
      const unknown = getDistancesByCategory('unknown');
      expect(Object.keys(unknown)).toHaveLength(0);
    });

    it('should return distances with km and miles values', () => {
      const sprintDistances = getDistancesByCategory('sprint');

      expect(sprintDistances['1k'].km).toBe(1);
      expect(sprintDistances['1k'].miles).toBeCloseTo(0.621371, 5);
    });
  });
});
