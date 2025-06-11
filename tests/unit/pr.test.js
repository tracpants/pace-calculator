import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  loadPRs,
  savePRs,
  getPRForDistance,
  setPR,
  removePR,
  getAllPRs,
  comparePaceWithPR,
  validatePRTime,
  getDistanceName,
  formatDate,
  getDateInputValue
} from '../../src/pr.js'

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem(key) {
    return this.store[key] || null
  },
  setItem(key, value) {
    this.store[key] = value
  },
  removeItem(key) {
    delete this.store[key]
  },
  clear() {
    this.store = {}
  }
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Mock calculator functions
vi.mock('../../src/calculator.js', () => ({
  validateTimeInput: vi.fn((timeStr) => {
    if (!timeStr) return { valid: false, message: 'Time is required' }
    if (timeStr === 'invalid') return { valid: false, message: 'Invalid format' }
    
    // Simple mock - convert time to seconds
    const parts = timeStr.split(':')
    if (parts.length === 3) {
      // H:MM:SS format
      const hours = parseInt(parts[0]) || 0
      const minutes = parseInt(parts[1]) || 0
      const seconds = parseInt(parts[2]) || 0
      return { valid: true, value: hours * 3600 + minutes * 60 + seconds }
    }
    if (parts.length === 2) {
      // MM:SS format
      const minutes = parseInt(parts[0]) || 0
      const seconds = parseInt(parts[1]) || 0
      return { valid: true, value: minutes * 60 + seconds }
    }
    
    // Single number as minutes
    const minutes = parseInt(timeStr) || 0
    return { valid: true, value: minutes * 60 }
  }),
  formatTime: vi.fn((seconds, includeHours = false) => {
    if (includeHours && seconds >= 3600) {
      const hours = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  })
}))

// Mock distances functions
vi.mock('../../src/distances.js', () => ({
  getRaceDistancesKm: vi.fn(() => ({
    '5k': 5,
    '10k': 10,
    'half-marathon': 21.1,
    'marathon': 42.195
  })),
  getDistanceDisplayName: vi.fn((key) => {
    const names = {
      '5k': '5K',
      '10k': '10K',
      'half-marathon': 'Half Marathon',
      'marathon': 'Marathon'
    }
    return names[key] || key
  }),
  normalizeDistanceToKm: vi.fn((distance, unit) => {
    if (unit === 'miles') {
      return distance * 1.609344
    }
    return distance
  }),
  findDistanceKey: vi.fn((distanceKm, unit, tolerance = 0.1) => {
    const distances = {
      5: '5k',
      10: '10k',
      21.1: 'half-marathon',
      42.195: 'marathon'
    }
    
    for (const [standardDistance, key] of Object.entries(distances)) {
      if (Math.abs(distanceKm - parseFloat(standardDistance)) <= tolerance) {
        return key
      }
    }
    return null
  })
}))

describe('Personal Records (PR) Module', () => {
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('loadPRs and savePRs', () => {
    it('should return empty object when no PRs stored', () => {
      const result = loadPRs()
      expect(result).toEqual({})
    })

    it('should save and load PRs correctly', () => {
      const testPRs = {
        '5': {
          distance: 5,
          unit: 'km',
          timeSeconds: 1200,
          dateSet: '2024-01-01T00:00:00.000Z',
          hasCustomDate: false,
          notes: null
        }
      }

      const saveResult = savePRs(testPRs)
      expect(saveResult).toBe(true)

      const loadResult = loadPRs()
      expect(loadResult).toEqual(testPRs)
    })

    it('should handle corrupted localStorage data', () => {
      // Manually set invalid JSON
      localStorageMock.setItem('pace-calculator-prs', '{invalid json}')
      
      const result = loadPRs()
      expect(result).toEqual({})
    })

    it('should handle localStorage save errors', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorageMock.setItem
      localStorageMock.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded')
      })

      const result = savePRs({ test: 'data' })
      expect(result).toBe(false)

      // Restore original method
      localStorageMock.setItem = originalSetItem
    })
  })

  describe('setPR', () => {
    it('should set PR with all parameters', () => {
      const result = setPR(5, 'km', 1200, '2024-01-01', 'Great race!')
      expect(result).toBe(true)

      const prs = loadPRs()
      expect(prs['5']).toEqual({
        distance: 5,
        unit: 'km',
        timeSeconds: 1200,
        dateSet: '2024-01-01T00:00:00.000Z',
        hasCustomDate: true,
        notes: 'Great race!'
      })
    })

    it('should set PR with default date when none provided', () => {
      const beforeTime = new Date().getTime()
      setPR(10, 'km', 2400)
      const afterTime = new Date().getTime()

      const prs = loadPRs()
      const prDate = new Date(prs['10'].dateSet).getTime()
      
      expect(prDate).toBeGreaterThanOrEqual(beforeTime)
      expect(prDate).toBeLessThanOrEqual(afterTime)
      expect(prs['10'].hasCustomDate).toBe(false)
    })

    it('should convert miles to km for storage', () => {
      setPR(3.107, 'miles', 1200) // ~5km
      
      const prs = loadPRs()
      // Should be stored under the km equivalent key
      expect(Object.keys(prs)).toContain('5.0002318080000006') // Mock conversion
    })

    it('should overwrite existing PR', () => {
      setPR(5, 'km', 1200, null, 'First attempt')
      setPR(5, 'km', 1100, null, 'Personal best!')

      const prs = loadPRs()
      expect(prs['5'].timeSeconds).toBe(1100)
      expect(prs['5'].notes).toBe('Personal best!')
    })
  })

  describe('getPRForDistance', () => {
    beforeEach(() => {
      // Set up test PRs
      savePRs({
        '5': {
          distance: 5,
          unit: 'km',
          timeSeconds: 1200,
          dateSet: '2024-01-01T00:00:00.000Z',
          hasCustomDate: false,
          notes: null
        },
        '10': {
          distance: 10,
          unit: 'km',
          timeSeconds: 2500,
          dateSet: '2024-01-01T00:00:00.000Z',
          hasCustomDate: false,
          notes: null
        }
      })
    })

    it('should find exact distance match', () => {
      const result = getPRForDistance(5)
      expect(result).not.toBeNull()
      expect(result.distance).toBe(5)
      expect(result.timeSeconds).toBe(1200)
    })

    it('should find standard distance with tolerance', () => {
      // 5.05km should match 5km standard distance
      const result = getPRForDistance(5.05)
      expect(result).not.toBeNull()
      expect(result.distance).toBe(5)
    })

    it('should return null when no matching PR found', () => {
      const result = getPRForDistance(21.1) // Half marathon not in test data
      expect(result).toBeNull()
    })

    it('should not match distances outside tolerance', () => {
      const result = getPRForDistance(5.2) // Too far from 5km
      expect(result).toBeNull()
    })
  })

  describe('removePR', () => {
    beforeEach(() => {
      setPR(5, 'km', 1200)
      setPR(10, 'km', 2500)
    })

    it('should remove specified PR', () => {
      const result = removePR(5, 'km')
      expect(result).toBe(true)

      const prs = loadPRs()
      expect(prs['5']).toBeUndefined()
      expect(prs['10']).toBeDefined() // Other PRs should remain
    })

    it('should handle removing non-existent PR', () => {
      const result = removePR(21.1, 'km')
      expect(result).toBe(true) // Should succeed even if PR doesn't exist

      const prs = loadPRs()
      expect(Object.keys(prs)).toHaveLength(2) // Original PRs should remain
    })
  })

  describe('getAllPRs', () => {
    beforeEach(() => {
      savePRs({
        '5': {
          distance: 5,
          unit: 'km',
          timeSeconds: 1200,
          dateSet: '2024-01-01T00:00:00.000Z',
          hasCustomDate: false,
          notes: 'Good run'
        },
        '10': {
          distance: 10,
          unit: 'km',
          timeSeconds: 2500,
          dateSet: '2024-02-01T00:00:00.000Z',
          hasCustomDate: true,
          notes: null
        },
        '7.5': {
          distance: 7.5,
          unit: 'km',
          timeSeconds: 1800,
          dateSet: '2024-03-01T00:00:00.000Z',
          hasCustomDate: false,
          notes: null
        }
      })
    })

    it('should return all PRs formatted correctly', () => {
      const result = getAllPRs()
      
      expect(result).toHaveLength(3)
      expect(result[0].distanceKm).toBe(5)
      expect(result[0].displayName).toBe('5K') // Standard distance
      expect(result[0].timeFormatted).toBe('20:00') // Mocked format
      
      expect(result[2].distanceKm).toBe(10) // Should be sorted by distance
      expect(result[2].displayName).toBe('10K')
    })

    it('should sort PRs by distance', () => {
      const result = getAllPRs()
      
      const distances = result.map(pr => pr.distanceKm)
      expect(distances).toEqual([5, 7.5, 10])
    })

    it('should handle custom distances without display names', () => {
      const result = getAllPRs()
      const customDistance = result.find(pr => pr.distanceKm === 7.5)
      
      expect(customDistance.displayName).toBeNull() // No standard name for 7.5km
    })

    it('should return empty array when no PRs exist', () => {
      localStorageMock.clear()
      const result = getAllPRs()
      expect(result).toEqual([])
    })
  })

  describe('comparePaceWithPR', () => {
    beforeEach(() => {
      // Set up a 5K PR of 20:00 (1200 seconds)
      setPR(5, 'km', 1200)
    })

    it('should compare faster current pace with PR', () => {
      // Current time: 19:00 (1140 seconds) for 5K - faster than PR
      const result = comparePaceWithPR(1140, 5, 'km')
      
      expect(result).not.toBeNull()
      expect(result.hasPR).toBe(true)
      expect(result.isFaster).toBe(true)
      expect(result.isSlower).toBe(false)
      expect(result.timeDifference).toBe(-60) // 1 minute faster
      expect(result.paceDifference).toBeLessThan(0)
    })

    it('should compare slower current pace with PR', () => {
      // Current time: 21:00 (1260 seconds) for 5K - slower than PR
      const result = comparePaceWithPR(1260, 5, 'km')
      
      expect(result).not.toBeNull()
      expect(result.isFaster).toBe(false)
      expect(result.isSlower).toBe(true)
      expect(result.timeDifference).toBe(60) // 1 minute slower
      expect(result.paceDifference).toBeGreaterThan(0)
    })

    it('should return null when no PR exists for distance', () => {
      const result = comparePaceWithPR(1200, 10, 'km') // No 10K PR
      expect(result).toBeNull()
    })

    it('should handle different units correctly', () => {
      // Set a PR in miles
      setPR(3.107, 'miles', 1200) // ~5K equivalent
      
      const result = comparePaceWithPR(1140, 3.107, 'miles')
      expect(result).not.toBeNull()
      expect(result.prUnit).toBe('miles')
    })

    it('should calculate percentage differences', () => {
      const result = comparePaceWithPR(1080, 5, 'km') // 18:00 vs 20:00 PR
      
      expect(result.percentageDifference).toBeLessThan(0) // Faster
      expect(Math.abs(result.percentageDifference)).toBeGreaterThan(0)
    })
  })

  describe('validatePRTime', () => {
    it('should accept valid PR times', () => {
      const result = validatePRTime('20:00')
      expect(result.valid).toBe(true)
      expect(result.value).toBe(1200)
    })

    it('should reject times that are too fast', () => {
      const result = validatePRTime('0:20') // 20 seconds
      expect(result.valid).toBe(false)
      expect(result.message).toBe('Time seems too fast for a race')
    })

    it('should reject times exceeding 24 hours', () => {
      const result = validatePRTime('25:00:00')
      expect(result.valid).toBe(false)
      expect(result.message).toBe('Time cannot exceed 24 hours')
    })

    it('should accept boundary times', () => {
      const result1 = validatePRTime('0:30') // Exactly 30 seconds
      expect(result1.valid).toBe(true)
      
      const result2 = validatePRTime('24:00:00') // Exactly 24 hours
      expect(result2.valid).toBe(true)
    })

    it('should delegate to calculator validation for format errors', () => {
      const result = validatePRTime('invalid')
      expect(result.valid).toBe(false)
      expect(result.message).toBe('Invalid format')
    })
  })

  describe('getDistanceName', () => {
    it('should return display name for standard distances', () => {
      expect(getDistanceName(5, 'km')).toBe('5K')
      expect(getDistanceName(21.1, 'km')).toBe('Half Marathon')
      expect(getDistanceName(42.195, 'km')).toBe('Marathon')
    })

    it('should return formatted string for custom distances', () => {
      expect(getDistanceName(7.5, 'km')).toBe('7.5 km')
      expect(getDistanceName(4, 'miles')).toBe('4 miles')
    })

    it('should handle mile to km conversion for standard distances', () => {
      expect(getDistanceName(3.107, 'miles')).toBe('5K') // Should recognize as 5K
    })
  })

  describe('formatDate', () => {
    it('should format ISO date strings correctly', () => {
      const result = formatDate('2024-01-01T00:00:00.000Z')
      // Result will depend on locale, but should be a valid date string
      expect(result).toBeTruthy()
      expect(result).toMatch(/\d/) // Should contain digits
    })

    it('should handle invalid date strings', () => {
      expect(formatDate('invalid-date')).toBe('Invalid Date')
      expect(formatDate(null)).toBe('')
      expect(formatDate('')).toBe('')
    })
  })

  describe('getDateInputValue', () => {
    it('should return YYYY-MM-DD format for date inputs', () => {
      const result = getDateInputValue('2024-01-01T12:30:45.000Z')
      expect(result).toBe('2024-01-01')
    })

    it('should handle invalid dates', () => {
      expect(getDateInputValue('invalid')).toBe('')
      expect(getDateInputValue(null)).toBe('')
      expect(getDateInputValue('')).toBe('')
    })

    it('should handle different timezones correctly', () => {
      const result = getDateInputValue('2024-12-31T23:59:59.000Z')
      expect(result).toBe('2024-12-31') // Should maintain date regardless of timezone
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete PR management workflow', () => {
      // Set multiple PRs
      setPR(5, 'km', 1200, '2024-01-01', 'First 5K')
      setPR(10, 'km', 2500, '2024-02-01', 'First 10K')
      setPR(21.1, 'km', 5400, '2024-03-01', 'First Half')

      // Get all PRs
      const allPRs = getAllPRs()
      expect(allPRs).toHaveLength(3)

      // Compare current performance with existing PR
      const comparison = comparePaceWithPR(1140, 5, 'km') // 19:00 for 5K
      expect(comparison.isFaster).toBe(true)

      // Update PR with better time
      setPR(5, 'km', 1140, '2024-04-01', 'New PR!')
      
      const updatedPR = getPRForDistance(5)
      expect(updatedPR.timeSeconds).toBe(1140)
      expect(updatedPR.notes).toBe('New PR!')

      // Remove a PR
      removePR(10, 'km')
      const remainingPRs = getAllPRs()
      expect(remainingPRs).toHaveLength(2)
      expect(remainingPRs.find(pr => pr.distanceKm === 10)).toBeUndefined()
    })

    it('should handle unit conversions consistently', () => {
      // Set PR in miles
      setPR(3.107, 'miles', 1200)
      
      // Retrieve using km equivalent
      const prFromKm = getPRForDistance(5.0002318080000006) // Mocked conversion
      expect(prFromKm).toBeDefined()
      expect(prFromKm.unit).toBe('miles')

      // Compare using different units
      const comparison = comparePaceWithPR(1140, 5, 'km')
      expect(comparison).toBeDefined()
    })

    it('should maintain data integrity across localStorage operations', () => {
      // Add several PRs
      const testPRs = [
        { distance: 5, unit: 'km', time: 1200 },
        { distance: 10, unit: 'km', time: 2500 },
        { distance: 3.107, unit: 'miles', time: 1300 }
      ]

      testPRs.forEach(pr => setPR(pr.distance, pr.unit, pr.time))

      // Simulate app restart by clearing and reloading
      const savedPRs = localStorage.getItem('pace-calculator-prs')
      localStorageMock.clear()
      localStorageMock.setItem('pace-calculator-prs', savedPRs)

      // Verify all PRs are still accessible
      const reloadedPRs = getAllPRs()
      expect(reloadedPRs).toHaveLength(3)

      // Verify specific PR retrieval still works
      const fiveKPR = getPRForDistance(5)
      expect(fiveKPR).toBeDefined()
      expect(fiveKPR.timeSeconds).toBe(1200)
    })
  })
})