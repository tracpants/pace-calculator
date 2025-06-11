import { describe, it, expect } from 'vitest'
import {
  parseTime,
  validateTimeInput,
  validateDistanceInput,
  formatTime,
  calculatePace,
  calculateTime,
  calculateDistance,
  formatDistance,
  formatPaceDisplay
} from '../../src/calculator.js'

describe('Calculator Core Functions', () => {
  
  describe('parseTime', () => {
    describe('decimal format', () => {
      it('should parse decimal minutes correctly', () => {
        expect(parseTime('4.5')).toBe(270) // 4:30
        expect(parseTime('2.75')).toBe(165) // 2:45
        expect(parseTime('0.5')).toBe(30) // 0:30
        expect(parseTime('10')).toBe(600) // 10:00
      })

      it('should handle integer format', () => {
        expect(parseTime('5')).toBe(300) // 5:00
        expect(parseTime('0')).toBe(0)
        expect(parseTime('1')).toBe(60)
      })
    })

    describe('colon format', () => {
      it('should parse MM:SS format', () => {
        expect(parseTime('4:30')).toBe(270)
        expect(parseTime('12:45')).toBe(765)
        expect(parseTime('0:30')).toBe(30)
        expect(parseTime('59:59')).toBe(3599)
      })

      it('should parse H:MM:SS format', () => {
        expect(parseTime('1:23:45')).toBe(5025) // 1 hour, 23 min, 45 sec
        expect(parseTime('2:00:00')).toBe(7200) // 2 hours
        expect(parseTime('0:05:30')).toBe(330) // 5:30
      })

      it('should handle leading zeros', () => {
        expect(parseTime('04:05')).toBe(245)
        expect(parseTime('01:02:03')).toBe(3723)
      })
    })

    describe('space format', () => {
      it('should parse space-separated MM SS format', () => {
        expect(parseTime('4 30')).toBe(270)
        expect(parseTime('12 45')).toBe(765)
      })

      it('should parse space-separated H MM SS format', () => {
        expect(parseTime('1 23 45')).toBe(5025)
        expect(parseTime('2 0 0')).toBe(7200)
      })
    })

    describe('edge cases', () => {
      it('should handle empty or invalid inputs', () => {
        expect(parseTime('')).toBe(0)
        expect(parseTime(null)).toBe(0)
        expect(parseTime(undefined)).toBe(0)
        expect(parseTime('invalid')).toBe(0)
        expect(parseTime('abc:def')).toBe(0)
      })

      it('should handle whitespace', () => {
        expect(parseTime('  4:30  ')).toBe(270)
        expect(parseTime(' 4.5 ')).toBe(270)
      })

      it('should handle single number as minutes', () => {
        expect(parseTime('45')).toBe(2700) // 45 minutes
      })
    })
  })

  describe('validateTimeInput', () => {
    describe('valid inputs', () => {
      it('should accept valid time formats', () => {
        expect(validateTimeInput('4:30')).toEqual({ valid: true, value: 270 })
        expect(validateTimeInput('1:23:45')).toEqual({ valid: true, value: 5025 })
        expect(validateTimeInput('4.5')).toEqual({ valid: true, value: 270 })
        expect(validateTimeInput('45')).toEqual({ valid: true, value: 2700 })
      })
    })

    describe('invalid inputs', () => {
      it('should reject empty inputs', () => {
        const result = validateTimeInput('')
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Time is required')
      })

      it('should reject null/undefined inputs', () => {
        expect(validateTimeInput(null).valid).toBe(false)
        expect(validateTimeInput(undefined).valid).toBe(false)
      })

      it('should reject invalid formats', () => {
        const result = validateTimeInput('abc:def')
        expect(result.valid).toBe(false)
        expect(result.message).toContain('Invalid format')
      })

      it('should reject zero time', () => {
        const result = validateTimeInput('0')
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Time must be greater than 0')
      })

      it('should reject times exceeding 24 hours', () => {
        const result = validateTimeInput('25:00:00')
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Time cannot exceed 24 hours')
      })
    })

    describe('boundary conditions', () => {
      it('should accept exactly 24 hours', () => {
        const result = validateTimeInput('24:00:00')
        expect(result.valid).toBe(true)
        expect(result.value).toBe(86400)
      })

      it('should accept just under 24 hours', () => {
        const result = validateTimeInput('23:59:59')
        expect(result.valid).toBe(true)
        expect(result.value).toBe(86399)
      })
    })
  })

  describe('validateDistanceInput', () => {
    describe('valid inputs', () => {
      it('should accept valid distances', () => {
        expect(validateDistanceInput('5')).toEqual({ valid: true, value: 5 })
        expect(validateDistanceInput('10.5')).toEqual({ valid: true, value: 10.5 })
        expect(validateDistanceInput('21.1')).toEqual({ valid: true, value: 21.1 })
        expect(validateDistanceInput('0.1')).toEqual({ valid: true, value: 0.1 })
      })

      it('should handle decimal inputs', () => {
        expect(validateDistanceInput('3.107')).toEqual({ valid: true, value: 3.107 })
        expect(validateDistanceInput('.5')).toEqual({ valid: true, value: 0.5 })
      })
    })

    describe('invalid inputs', () => {
      it('should reject empty inputs', () => {
        const result = validateDistanceInput('')
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Distance is required')
      })

      it('should reject non-numeric inputs', () => {
        const result = validateDistanceInput('abc')
        expect(result.valid).toBe(false)
        expect(result.message).toContain('valid number')
      })

      it('should reject zero distance', () => {
        const result = validateDistanceInput('0')
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Distance must be greater than 0')
      })

      it('should reject negative distances', () => {
        const result = validateDistanceInput('-5')
        expect(result.valid).toBe(false)
        expect(result.message).toContain('valid number')
      })

      it('should reject unreasonably large distances', () => {
        const result = validateDistanceInput('1001')
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Distance seems unreasonably large')
      })
    })

    describe('boundary conditions', () => {
      it('should accept exactly 1000', () => {
        const result = validateDistanceInput('1000')
        expect(result.valid).toBe(true)
        expect(result.value).toBe(1000)
      })

      it('should accept very small distances', () => {
        const result = validateDistanceInput('0.01')
        expect(result.valid).toBe(true)
        expect(result.value).toBe(0.01)
      })
    })
  })

  describe('formatTime', () => {
    describe('MM:SS format (default)', () => {
      it('should format times correctly', () => {
        expect(formatTime(270)).toBe('04:30') // 4:30
        expect(formatTime(3599)).toBe('59:59') // 59:59
        expect(formatTime(30)).toBe('00:30') // 0:30
        expect(formatTime(3600)).toBe('60:00') // 1 hour as 60:00
      })

      it('should handle zero and negative values', () => {
        expect(formatTime(0)).toBe('00:00')
        expect(formatTime(-10)).toBe('00:00')
      })

      it('should round to nearest second', () => {
        expect(formatTime(270.7)).toBe('04:31') // rounds up
        expect(formatTime(270.3)).toBe('04:30') // rounds down
      })
    })

    describe('H:MM:SS format (includeHours=true)', () => {
      it('should format times with hours when requested', () => {
        expect(formatTime(3661, true)).toBe('01:01:01') // 1:01:01
        expect(formatTime(7200, true)).toBe('02:00:00') // 2:00:00
        expect(formatTime(86399, true)).toBe('23:59:59') // 23:59:59
      })

      it('should use MM:SS format when no hours even if includeHours=true', () => {
        expect(formatTime(270, true)).toBe('04:30')
        expect(formatTime(3599, true)).toBe('59:59')
      })
    })

    describe('edge cases', () => {
      it('should handle NaN input', () => {
        expect(formatTime(NaN)).toBe('00:00')
        expect(formatTime('abc')).toBe('00:00')
      })

      it('should handle very large times', () => {
        expect(formatTime(359999, true)).toBe('99:59:59') // 100 hours - 1 second
      })
    })
  })

  describe('calculatePace', () => {
    describe('kilometer calculations', () => {
      it('should calculate pace per km correctly', () => {
        // 30 minutes for 5km = 6:00/km
        const result = calculatePace(1800, 5, 'km')
        expect(result.pacePerKm).toBe(360) // 6:00/km in seconds
        
        // Also verify mile pace conversion
        expect(result.pacePerMile).toBeCloseTo(579.4, 1) // ~9:39/mile
      })

      it('should handle fractional distances', () => {
        // 21:05 for 5.5km
        const result = calculatePace(1265, 5.5, 'km')
        expect(result.pacePerKm).toBeCloseTo(230, 1) // ~3:50/km
      })
    })

    describe('mile calculations', () => {
      it('should calculate pace per mile correctly', () => {
        // 48 minutes for 6 miles = 8:00/mile
        const result = calculatePace(2880, 6, 'miles')
        expect(result.pacePerMile).toBe(480) // 8:00/mile in seconds
        
        // Also verify km pace conversion
        expect(result.pacePerKm).toBeCloseTo(298.3, 1) // ~4:58/km
      })
    })

    describe('precision and consistency', () => {
      it('should maintain precision across unit conversions', () => {
        const result1 = calculatePace(1800, 5, 'km')
        const result2 = calculatePace(1800, 3.107, 'miles') // 5km in miles
        
        // Should be very close (within rounding error)
        expect(Math.abs(result1.pacePerKm - result2.pacePerKm)).toBeLessThan(1)
      })

      it('should handle zero distance', () => {
        const result = calculatePace(1800, 0, 'km')
        expect(result.pacePerKm).toBe(0)
        expect(result.pacePerMile).toBe(0)
      })
    })

    describe('real-world scenarios', () => {
      it('should calculate marathon pace correctly', () => {
        // 3:30:00 marathon (12600 seconds, 42.195km)
        const result = calculatePace(12600, 42.195, 'km')
        expect(formatTime(result.pacePerKm)).toBe('04:59') // ~4:59/km
      })

      it('should calculate 5K race pace correctly', () => {
        // 20:00 5K
        const result = calculatePace(1200, 5, 'km')
        expect(formatTime(result.pacePerKm)).toBe('04:00') // 4:00/km
      })
    })
  })

  describe('calculateTime', () => {
    describe('basic calculations', () => {
      it('should calculate total time correctly', () => {
        // 5:00/km pace for 10km = 50:00 total
        const result = calculateTime(300, 10, 'km', 'km')
        expect(result).toBe(3000) // 50 minutes in seconds
      })

      it('should handle different pace and distance units', () => {
        // 8:00/mile pace for 5km distance
        const result = calculateTime(480, 5, 'miles', 'km')
        expect(result).toBeCloseTo(1491, 0) // ~24:51
      })
    })

    describe('unit conversion scenarios', () => {
      it('should convert km pace to mile distance', () => {
        // 4:00/km pace for 3.107 miles (5km)
        const result = calculateTime(240, 3.107, 'km', 'miles')
        expect(result).toBeCloseTo(1200, 0) // Should be 20:00
      })

      it('should convert mile pace to km distance', () => {
        // 6:00/mile pace for 5km
        const result = calculateTime(360, 5, 'miles', 'km')
        expect(result).toBeCloseTo(1118, 0) // ~18:38
      })
    })

    describe('precision verification', () => {
      it('should maintain calculation consistency', () => {
        // Calculate time, then use that to calculate pace back
        const originalPace = 300 // 5:00/km
        const distance = 10
        
        const calculatedTime = calculateTime(originalPace, distance, 'km', 'km')
        const backCalculatedPace = calculatePace(calculatedTime, distance, 'km')
        
        expect(Math.abs(originalPace - backCalculatedPace.pacePerKm)).toBeLessThan(0.1)
      })
    })
  })

  describe('calculateDistance', () => {
    describe('basic calculations', () => {
      it('should calculate distance correctly', () => {
        // 50:00 total time at 5:00/km pace = 10km
        const result = calculateDistance(3000, 300, 'km')
        expect(result.km).toBe(10)
        expect(result.miles).toBeCloseTo(6.214, 2)
      })

      it('should handle mile pace units', () => {
        // 48:00 total time at 8:00/mile pace = 6 miles
        const result = calculateDistance(2880, 480, 'miles')
        expect(result.miles).toBe(6)
        expect(result.km).toBeCloseTo(9.656, 2)
      })
    })

    describe('edge cases', () => {
      it('should handle zero pace', () => {
        const result = calculateDistance(3000, 0, 'km')
        expect(result.km).toBe(0)
        expect(result.miles).toBe(0)
      })

      it('should handle very fast pace', () => {
        // 10:00 total at 2:00/km pace = 5km
        const result = calculateDistance(600, 120, 'km')
        expect(result.km).toBe(5)
      })
    })

    describe('round-trip calculations', () => {
      it('should maintain precision in round-trip calculations', () => {
        const originalDistance = 21.1 // Half marathon
        const pace = 300 // 5:00/km
        
        const calculatedTime = calculateTime(pace, originalDistance, 'km', 'km')
        const backCalculatedDistance = calculateDistance(calculatedTime, pace, 'km')
        
        expect(Math.abs(originalDistance - backCalculatedDistance.km)).toBeLessThan(0.01)
      })
    })
  })

  describe('formatDistance', () => {
    it('should format distances with default 2 decimal places', () => {
      expect(formatDistance(5.12345)).toBe(5.12)
      expect(formatDistance(10)).toBe(10)
      expect(formatDistance(21.0975)).toBe(21.10)
    })

    it('should respect custom decimal places', () => {
      expect(formatDistance(5.12345, 3)).toBe(5.123)
      expect(formatDistance(5.12345, 1)).toBe(5.1)
      expect(formatDistance(5.12345, 0)).toBe(5)
    })

    it('should handle edge cases', () => {
      expect(formatDistance(0)).toBe(0)
      expect(formatDistance(0.999, 2)).toBe(1)
      expect(formatDistance(0.994, 2)).toBe(0.99)
    })
  })

  describe('formatPaceDisplay', () => {
    it('should format pace in MM:SS format', () => {
      expect(formatPaceDisplay(270)).toBe('04:30')
      expect(formatPaceDisplay(360)).toBe('06:00')
      expect(formatPaceDisplay(599)).toBe('09:59')
    })

    it('should handle edge cases', () => {
      expect(formatPaceDisplay(0)).toBe('00:00')
      expect(formatPaceDisplay(3600)).toBe('60:00') // 1 hour pace
    })
  })

  describe('integration scenarios', () => {
    describe('complete calculation workflows', () => {
      it('should handle pace calculation workflow', () => {
        // User enters 45:30 for 10K
        const timeResult = validateTimeInput('45:30')
        expect(timeResult.valid).toBe(true)
        
        const distanceResult = validateDistanceInput('10')
        expect(distanceResult.valid).toBe(true)
        
        const paceResult = calculatePace(timeResult.value, distanceResult.value, 'km')
        const formattedPace = formatTime(paceResult.pacePerKm)
        
        expect(formattedPace).toBe('04:33') // 4:33/km
      })

      it('should handle time calculation workflow', () => {
        // User wants to know time for 21.1K at 5:00/km pace
        const paceSeconds = parseTime('5:00')
        const distance = 21.1
        
        const totalTime = calculateTime(paceSeconds, distance, 'km', 'km')
        const formattedTime = formatTime(totalTime, true)
        
        expect(formattedTime).toBe('01:45:30') // 1:45:30
      })

      it('should handle distance calculation workflow', () => {
        // User ran for 1:30:00 at 4:30/km pace
        const totalTime = parseTime('1:30:00')
        const paceSeconds = parseTime('4:30')
        
        const result = calculateDistance(totalTime, paceSeconds, 'km')
        const formattedDistance = formatDistance(result.km, 1)
        
        expect(formattedDistance).toBe(20.0) // 20km
      })
    })

    describe('unit conversion consistency', () => {
      it('should maintain consistency across all unit combinations', () => {
        const scenarios = [
          { time: 1800, distance: 5, unit: 'km' },
          { time: 2400, distance: 3.107, unit: 'miles' }, // Roughly equivalent
        ]
        
        scenarios.forEach(scenario => {
          const pace = calculatePace(scenario.time, scenario.distance, scenario.unit)
          const backTime = calculateTime(
            scenario.unit === 'km' ? pace.pacePerKm : pace.pacePerMile,
            scenario.distance,
            scenario.unit,
            scenario.unit
          )
          
          // Should be within 1 second due to rounding
          expect(Math.abs(scenario.time - backTime)).toBeLessThan(1)
        })
      })
    })
  })
})