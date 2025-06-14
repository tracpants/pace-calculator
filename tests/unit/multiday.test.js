/**
 * Tests for multi-day time support functionality
 * 
 * Ensures that the calculator can handle ultra-distance events
 * that exceed 24 hours while maintaining clean UI for regular use.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
	parseTime, 
	validateTimeInput, 
	formatTime, 
	isMultidayDistance,
	shouldAllowMultiday,
	calculatePace,
	calculateTime,
	calculateDistance
} from '../../src/calculator.js';

describe('Multi-day Time Support', () => {
	
	describe('parseTime with multi-day formats', () => {
		it('should parse colon format with days (D:H:MM:SS)', () => {
			expect(parseTime('2:1:23:45')).toBe(2 * 86400 + 1 * 3600 + 23 * 60 + 45);
			expect(parseTime('1:0:30:15')).toBe(86400 + 30 * 60 + 15);
			expect(parseTime('3:12:0:0')).toBe(3 * 86400 + 12 * 3600);
		});

		it('should parse space format with days (D H MM SS)', () => {
			expect(parseTime('2 1 23 45')).toBe(2 * 86400 + 1 * 3600 + 23 * 60 + 45);
			expect(parseTime('1 0 30 15')).toBe(86400 + 30 * 60 + 15);
			expect(parseTime('5 23 59 59')).toBe(5 * 86400 + 23 * 3600 + 59 * 60 + 59);
		});

		it('should still parse regular formats correctly', () => {
			// Regular H:MM:SS should work as before
			expect(parseTime('1:23:45')).toBe(1 * 3600 + 23 * 60 + 45);
			expect(parseTime('23:59:59')).toBe(23 * 3600 + 59 * 60 + 59);
			
			// Regular MM:SS should work as before  
			expect(parseTime('45:30')).toBe(45 * 60 + 30);
			expect(parseTime('5:15')).toBe(5 * 60 + 15);
		});

		it('should handle edge cases', () => {
			expect(parseTime('0:0:0:0')).toBe(0);
			expect(parseTime('7:0:0:0')).toBe(7 * 86400); // 7 days exactly
			expect(parseTime('1:24:0:0')).toBe(86400 + 24 * 3600); // 1 day + 24 hours = 48 hours
		});
	});

	describe('validateTimeInput with multiday support', () => {
		it('should reject >24h when multiday not allowed', () => {
			const result = validateTimeInput('25:0:0', false);
			expect(result.valid).toBe(false);
			expect(result.message).toContain('24 hours');
		});

		it('should accept >24h when multiday allowed', () => {
			const result = validateTimeInput('1:2:30:15', true); // 1 day 2:30:15
			expect(result.valid).toBe(true);
			expect(result.value).toBe(86400 + 2 * 3600 + 30 * 60 + 15);
		});

		it('should enforce 7-day maximum for multiday', () => {
			const result = validateTimeInput('8:0:0:0', true); // 8 days
			expect(result.valid).toBe(false);
			expect(result.message).toContain('7 days');
		});

		it('should accept exactly 7 days', () => {
			const result = validateTimeInput('7:0:0:0', true);
			expect(result.valid).toBe(true);
			expect(result.value).toBe(7 * 86400);
		});

		it('should still validate normal times correctly', () => {
			// Normal validation should work as before
			expect(validateTimeInput('1:30:45', false).valid).toBe(true);
			expect(validateTimeInput('23:59:59', false).valid).toBe(true);
			expect(validateTimeInput('24:0:0', false).valid).toBe(true); // Exactly 24h allowed for backward compatibility
			expect(validateTimeInput('24:0:1', false).valid).toBe(false); // But over 24h should be rejected
		});
	});

	describe('formatTime with multiday support', () => {
		it('should format single-day times normally', () => {
			expect(formatTime(3665, true, false)).toBe('01:01:05'); // 1h 1m 5s
			expect(formatTime(125, false, false)).toBe('02:05'); // 2m 5s
			expect(formatTime(86399, true, false)).toBe('23:59:59'); // 23h 59m 59s
		});

		it('should format multi-day times with days', () => {
			const oneDayPlus = 86400 + 3600 + 30 * 60 + 15; // 1 day 1:30:15
			expect(formatTime(oneDayPlus, true, true)).toBe('1 day 01:30:15');
			
			const twoDaysPlus = 2 * 86400 + 12 * 3600 + 45 * 60; // 2 days 12:45:00
			expect(formatTime(twoDaysPlus, true, true)).toBe('2 days 12:45:00');
		});

		it('should use correct plural/singular for days', () => {
			const oneDay = 86400 + 3600; // Exactly 1 day 1 hour
			expect(formatTime(oneDay, true, true)).toBe('1 day 01:00:00');
			
			const threeDays = 3 * 86400 + 2 * 3600 + 30 * 60; // 3 days 2:30:00
			expect(formatTime(threeDays, true, true)).toBe('3 days 02:30:00');
		});

		it('should handle exactly 24 hours edge case', () => {
			// Exactly 24 hours should show as 1 day when multiday enabled
			expect(formatTime(86400, true, true)).toBe('1 day 00:00:00');
			
			// But show as 24:00:00 when multiday disabled
			expect(formatTime(86400, true, false)).toBe('24:00:00');
		});
	});

	describe('isMultidayDistance helper', () => {
		it('should identify ultra distances as multiday', () => {
			expect(isMultidayDistance(100)).toBe(true); // 100K
			expect(isMultidayDistance(160.9344)).toBe(true); // 100 miles
			expect(isMultidayDistance(200)).toBe(true); // 24-hour race distance
			expect(isMultidayDistance(500)).toBe(true); // Multi-day race
		});

		it('should identify regular distances as single-day', () => {
			expect(isMultidayDistance(5)).toBe(false); // 5K
			expect(isMultidayDistance(10)).toBe(false); // 10K
			expect(isMultidayDistance(21.0975)).toBe(false); // Half marathon
			expect(isMultidayDistance(42.195)).toBe(false); // Marathon
			expect(isMultidayDistance(50)).toBe(false); // 50K (borderline but typically <24h)
			expect(isMultidayDistance(80.4672)).toBe(false); // 50 miles (typically <24h)
		});
	});

	describe('shouldAllowMultiday helper', () => {
		it('should allow multiday for ultra distances', () => {
			expect(shouldAllowMultiday(100, 0)).toBe(true); // 100K distance
			expect(shouldAllowMultiday(160, 0)).toBe(true); // 100+ mile distance
		});

		it('should allow multiday for long time inputs', () => {
			const twentyOneHours = 21 * 3600;
			expect(shouldAllowMultiday(50, twentyOneHours)).toBe(true); // >20h suggests ultra context
		});

		it('should not allow multiday for regular scenarios', () => {
			expect(shouldAllowMultiday(42.195, 3 * 3600)).toBe(false); // Marathon in 3h
			expect(shouldAllowMultiday(21, 1.5 * 3600)).toBe(false); // Half marathon in 1.5h
		});
	});

	describe('Multiday calculations', () => {
		it('should calculate pace for ultra-distance events', () => {
			// 100K in 30 hours (realistic ultra time)
			const thirtyHours = 30 * 3600;
			const result = calculatePace(thirtyHours, 100, 'km');
			
			// Should be 18 minutes per km (30h / 100km = 0.3h = 18m)
			expect(result.pacePerKm).toBeCloseTo(18 * 60, 1);
		});

		it('should calculate time for ultra-distance events', () => {
			// 100 miles at 15 min/mile pace
			const paceSeconds = 15 * 60; // 15 minutes per mile
			const result = calculateTime(paceSeconds, 100, 'miles', 'miles');
			
			// Should be 25 hours (100 * 15min = 1500min = 25h)
			expect(result).toBeCloseTo(25 * 3600, 1);
		});

		it('should calculate distance for ultra-duration events', () => {
			// 48 hours at 12 min/km pace  
			const fortyEightHours = 48 * 3600;
			const pacePerKm = 12 * 60; // 12 minutes per km
			const result = calculateDistance(fortyEightHours, pacePerKm, 'km');
			
			// Should be 240 km (48h * 60min/h / 12min/km = 240km)
			expect(result.km).toBeCloseTo(240, 1);
		});
	});

	describe('Real-world ultra scenarios', () => {
		it('should handle Western States 100 (100 miles in 30 hours)', () => {
			const thirtyHours = 30 * 3600;
			const hundredMiles = 100;
			
			const pace = calculatePace(thirtyHours, hundredMiles, 'miles');
			// 30 hours / 100 miles = 18 minutes per mile
			expect(pace.pacePerMile).toBeCloseTo(18 * 60, 5);
			
			// Validate time parsing for 30 hours
			const validation = validateTimeInput('1:6:0:0', true); // 1 day 6 hours
			expect(validation.valid).toBe(true);
			expect(validation.value).toBe(thirtyHours);
		});

		it('should handle Spartathlon (153 miles in 36 hours)', () => {
			const thirtySevenHours = 37 * 3600; // Slightly over cutoff
			const spartathlonMiles = 153;
			
			const pace = calculatePace(thirtySevenHours, spartathlonMiles, 'miles');
			// ~14.5 minutes per mile (37h * 60min / 153mi ≈ 14.51 min/mi)
			expect(pace.pacePerMile).toBeCloseTo(870.6, 1); // 14.51 * 60 = 870.6 seconds
		});

		it('should handle 6-day race scenarios', () => {
			// 6 days at conservative 10 min/km average
			const sixDays = 6 * 86400;
			const conservativePace = 10 * 60; // 10 min/km
			
			const distance = calculateDistance(sixDays, conservativePace, 'km');
			// 6 days * 24h * 60min / 10min/km = 864 km
			expect(distance.km).toBeCloseTo(864, 1);
		});
	});

	describe('Backward compatibility', () => {
		it('should not break existing calculations', () => {
			// Standard marathon calculations should work exactly as before
			const marathonTime = 3 * 3600 + 30 * 60; // 3:30:00
			const marathonDistance = 42.195;
			
			const pace = calculatePace(marathonTime, marathonDistance, 'km');
			const expectedPace = marathonTime / marathonDistance; // seconds per km
			
			expect(pace.pacePerKm).toBeCloseTo(expectedPace, 1);
		});

		it('should format regular times identically to before', () => {
			// These should be identical to the old behavior
			expect(formatTime(3665, true, false)).toBe('01:01:05');
			expect(formatTime(125, false, false)).toBe('02:05');
			expect(formatTime(23 * 3600 + 59 * 60 + 59, true, false)).toBe('23:59:59');
		});
	});
});