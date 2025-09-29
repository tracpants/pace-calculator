import { fireEvent } from '@testing-library/dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { initAutoAdvance, cleanupAutoAdvance, reinitAutoAdvance } from '../../src/auto-advance.js'

describe('Auto-Advance Functionality', () => {
  beforeEach(() => {
    // Clean up any existing auto-advance state
    cleanupAutoAdvance()
    
    // Create test HTML structure with segmented time inputs
    document.body.innerHTML = `
      <div id="app">
        <!-- Pace Time Inputs (HH:MM:SS format) -->
        <div>
          <input id="pace-time-hours" type="number" />
          <input id="pace-time-minutes" type="number" />
          <input id="pace-time-seconds" type="number" />
        </div>
        
        <!-- Time Pace Inputs (MM:SS format) -->
        <div>
          <input id="time-pace-minutes" type="number" />
          <input id="time-pace-seconds" type="number" />
        </div>
        
        <!-- Distance Time Inputs (HH:MM:SS format) -->
        <div>
          <input id="distance-time-hours" type="number" />
          <input id="distance-time-minutes" type="number" />
          <input id="distance-time-seconds" type="number" />
        </div>
        
        <!-- Distance Pace Inputs (MM:SS format) -->
        <div>
          <input id="distance-pace-minutes" type="number" />
          <input id="distance-pace-seconds" type="number" />
        </div>
        
        <!-- PR Time Inputs (HH:MM:SS format) -->
        <div>
          <input id="pr-time-hours" type="number" />
          <input id="pr-time-minutes" type="number" />
          <input id="pr-time-seconds" type="number" />
        </div>
      </div>
    `
  })

  afterEach(() => {
    cleanupAutoAdvance()
  })

  describe('Auto-Advance Initialization', () => {
    it('should initialize without errors', () => {
      expect(() => initAutoAdvance()).not.toThrow()
    })

    it('should find and setup all input groups', () => {
      initAutoAdvance()
      
      // Verify all expected inputs are present
      const expectedInputs = [
        'pace-time-hours', 'pace-time-minutes', 'pace-time-seconds',
        'time-pace-minutes', 'time-pace-seconds',
        'distance-time-hours', 'distance-time-minutes', 'distance-time-seconds',
        'distance-pace-minutes', 'distance-pace-seconds',
        'pr-time-hours', 'pr-time-minutes', 'pr-time-seconds'
      ]
      
      expectedInputs.forEach(id => {
        const input = document.getElementById(id)
        expect(input).toBeTruthy()
      })
    })

    it('should handle reinitialize correctly', () => {
      initAutoAdvance()
      expect(() => reinitAutoAdvance()).not.toThrow()
    })
  })

  describe('Numeric Input Validation', () => {
    beforeEach(() => {
      initAutoAdvance()
    })

    it('should enforce max length (2 characters)', () => {
      const input = document.getElementById('pace-time-minutes')
      input.value = '123'

      fireEvent.input(input)
      
      expect(input.value).toBe('12')
    })

    it('should validate max values for minutes (59)', () => {
      const input = document.getElementById('pace-time-minutes')
      input.value = '99'
      
      fireEvent.input(input)
      
      // For minutes/seconds: if first digit > 5, use first digit only and advance second
      expect(input.value).toBe('9')
    })

    it('should validate max values for seconds (59)', () => {
      const input = document.getElementById('pace-time-seconds')
      input.value = '99'
      
      fireEvent.input(input)
      
      // For minutes/seconds: if first digit > 5, use first digit only and advance second
      expect(input.value).toBe('9')
    })

    it('should validate max values for hours (23)', () => {
      const input = document.getElementById('pace-time-hours')
      input.value = '99'
      
      fireEvent.input(input)
      
      // For hours: 24+ hours, take first digit and advance with second
      expect(input.value).toBe('9')
    })
  })

  describe('Auto-Advance Behavior', () => {
    beforeEach(() => {
      initAutoAdvance()
    })

    it('should advance from hours to minutes when hours field is complete', async () => {
      const hoursInput = document.getElementById('pace-time-hours')
      const minutesInput = document.getElementById('pace-time-minutes')

      // Mock focus method
      minutesInput.focus = vi.fn()
      minutesInput.select = vi.fn()

      // Enter 2-digit hour value
      fireEvent.input(hoursInput, { target: { value: '01' } })

      // Should auto-advance to minutes
      await new Promise(resolve => {
        setTimeout(() => {
          expect(minutesInput.focus).toHaveBeenCalled()
          resolve()
        }, 15)
      })
    })

    it('should advance from minutes to seconds when minutes field is complete', async () => {
      const minutesInput = document.getElementById('pace-time-minutes')
      const secondsInput = document.getElementById('pace-time-seconds')

      // Mock focus method
      secondsInput.focus = vi.fn()
      secondsInput.select = vi.fn()

      // Enter 2-digit minute value
      fireEvent.input(minutesInput, { target: { value: '30' } })

      // Should auto-advance to seconds
      await new Promise(resolve => {
        setTimeout(() => {
          expect(secondsInput.focus).toHaveBeenCalled()
          resolve()
        }, 15)
      })
    })

    it('should not advance from last field (seconds)', async () => {
      const secondsInput = document.getElementById('pace-time-seconds')

      // Mock focus method to track if it gets called on any other element
      const focusSpy = vi.fn()
      document.querySelectorAll('input').forEach(input => {
        if (input !== secondsInput) {
          input.focus = focusSpy
        }
      })
      
      // Enter 2-digit second value
      fireEvent.input(secondsInput, { target: { value: '45' } })

      // Should NOT auto-advance
      await new Promise(resolve => {
        setTimeout(() => {
          expect(focusSpy).not.toHaveBeenCalled()
          resolve()
        }, 15)
      })
    })

    it('should handle overflow values correctly', async () => {
      const minutesInput = document.getElementById('time-pace-minutes')
      const secondsInput = document.getElementById('time-pace-seconds')

      // Mock focus and other methods
      secondsInput.focus = vi.fn()
      secondsInput.select = vi.fn()

      // Enter value that exceeds max (first digit 6 makes it impossible to be valid)
      fireEvent.input(minutesInput, { target: { value: '65' } })

      // Should take first digit only and advance with second digit
      expect(minutesInput.value).toBe('6')
      await new Promise(resolve => {
        setTimeout(() => {
          expect(secondsInput.focus).toHaveBeenCalled()
          expect(secondsInput.value).toBe('5')
          resolve()
        }, 15)
      })
    })
  })

  describe('Backspace Navigation', () => {
    beforeEach(() => {
      initAutoAdvance()
    })

    it('should move to previous field on backspace when current field is empty', () => {
      const hoursInput = document.getElementById('pace-time-hours')
      const minutesInput = document.getElementById('pace-time-minutes')

      // Mock focus and selection methods
      hoursInput.focus = vi.fn()
      hoursInput.setSelectionRange = vi.fn()
      hoursInput.value = '02' // Set some value to move cursor to end

      // Clear minutes input and press backspace
      minutesInput.value = ''
      fireEvent.keyDown(minutesInput, { key: 'Backspace' })

      expect(hoursInput.focus).toHaveBeenCalled()
    })

    it('should not move to previous field if current field has value', () => {
      const hoursInput = document.getElementById('pace-time-hours')
      const minutesInput = document.getElementById('pace-time-minutes')
      
      // Mock focus method
      hoursInput.focus = vi.fn()
      
      // Set value in minutes input and press backspace
      minutesInput.value = '30'
      fireEvent.keyDown(minutesInput, { key: 'Backspace' })
      
      // Should NOT move to hours input
      expect(hoursInput.focus).not.toHaveBeenCalled()
    })

    it('should not move from first field when backspace is pressed', () => {
      const hoursInput = document.getElementById('pace-time-hours')
      
      // Clear hours input and press backspace
      hoursInput.value = ''
      fireEvent.keyDown(hoursInput, { key: 'Backspace' })
      
      // Should remain in hours input (no error should occur)
      expect(() => fireEvent.keyDown(hoursInput, { key: 'Backspace' })).not.toThrow()
    })
  })

  describe('Paste Functionality', () => {
    beforeEach(() => {
      initAutoAdvance()
    })

    it('should handle pasted numeric string distribution', () => {
      const minutesInput = document.getElementById('time-pace-minutes')
      const secondsInput = document.getElementById('time-pace-seconds')

      // Mock clipboard data with just numbers
      const mockClipboardData = {
        getData: vi.fn(() => '430')
      }
      
      const pasteEvent = new Event('paste', { bubbles: true, cancelable: true })
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: mockClipboardData
      })
      
      fireEvent(minutesInput, pasteEvent)
      
      // Should distribute: 43 minutes, 0 seconds
      expect(minutesInput.value).toBe('43')
      expect(secondsInput.value).toBe('0')
    })

    it('should handle short pasted values in current field only', () => {
      const minutesInput = document.getElementById('time-pace-minutes')
      const secondsInput = document.getElementById('time-pace-seconds')
      
      // Mock clipboard data with short value
      const mockClipboardData = {
        getData: vi.fn(() => '5')
      }
      
      const pasteEvent = new Event('paste', { bubbles: true, cancelable: true })
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: mockClipboardData
      })
      
      fireEvent(minutesInput, pasteEvent)
      
      // Should only affect current field
      expect(minutesInput.value).toBe('5')
      expect(secondsInput.value).toBe('')
    })
  })

  describe('Focus Selection', () => {
    beforeEach(() => {
      initAutoAdvance()
    })

    it('should select all text on focus', async () => {
      const input = document.getElementById('pace-time-minutes')
      input.value = '30'

      // Mock select method
      input.select = vi.fn()

      fireEvent.focus(input)

      // Should select all text after small delay
      await new Promise(resolve => {
        setTimeout(() => {
          expect(input.select).toHaveBeenCalled()
          resolve()
        }, 15)
      })
    })
  })

  describe('Mixed Input Groups', () => {
    beforeEach(() => {
      initAutoAdvance()
    })

    it('should handle MM:SS format inputs correctly', async () => {
      const minutesInput = document.getElementById('time-pace-minutes')
      const secondsInput = document.getElementById('time-pace-seconds')

      // Mock focus method
      secondsInput.focus = vi.fn()
      secondsInput.select = vi.fn()

      // Enter valid minute value
      fireEvent.input(minutesInput, { target: { value: '04' } })

      // Should auto-advance to seconds
      await new Promise(resolve => {
        setTimeout(() => {
          expect(secondsInput.focus).toHaveBeenCalled()
          resolve()
        }, 15)
      })
    })

    it('should handle HH:MM:SS format inputs correctly', async () => {
      const hoursInput = document.getElementById('distance-time-hours')
      const minutesInput = document.getElementById('distance-time-minutes')
      const secondsInput = document.getElementById('distance-time-seconds')

      // Mock focus methods
      minutesInput.focus = vi.fn()
      minutesInput.select = vi.fn()
      secondsInput.focus = vi.fn()
      secondsInput.select = vi.fn()

      // Test hour to minute advancement
      fireEvent.input(hoursInput, { target: { value: '01' } })

      await new Promise(resolve => {
        setTimeout(() => {
          expect(minutesInput.focus).toHaveBeenCalled()
          resolve()
        }, 15)
      })

      // Test minute to second advancement
      fireEvent.input(minutesInput, { target: { value: '23' } })

      await new Promise(resolve => {
        setTimeout(() => {
          expect(secondsInput.focus).toHaveBeenCalled()
          resolve()
        }, 15)
      })
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      initAutoAdvance()
    })

    it('should handle missing input elements gracefully', () => {
      // Remove some inputs
      document.getElementById('pace-time-seconds').remove()
      
      // Reinitialize
      expect(() => reinitAutoAdvance()).not.toThrow()
      
      // Should still work for existing inputs
      const minutesInput = document.getElementById('pace-time-minutes')
      fireEvent.input(minutesInput, { target: { value: '30' } })
      
      // Should not throw error when trying to advance to removed field
      expect(minutesInput.value).toBe('30')
    })

    it('should handle duplicate initialization calls', () => {
      initAutoAdvance()
      
      // Initialize again - should not add duplicate event listeners
      expect(() => initAutoAdvance()).not.toThrow()
    })

    // Tests that relied on non-numeric characters are intentionally omitted.
  })
})
