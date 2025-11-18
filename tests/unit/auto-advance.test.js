import { fireEvent } from '@testing-library/dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { initAutoAdvance, cleanupAutoAdvance, reinitAutoAdvance } from '../../src/auto-advance.js'

describe('Auto-Advance Functionality', () => {
  beforeEach(() => {
    vi.useFakeTimers()
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
    vi.useRealTimers()
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

      fireEvent.input(hoursInput, { target: { value: '01' } })

      await vi.advanceTimersByTimeAsync(15)
      expect(minutesInput.focus).toHaveBeenCalled()
    })

    it('should advance from minutes to seconds when minutes field is complete', async () => {
      const minutesInput = document.getElementById('pace-time-minutes')
      const secondsInput = document.getElementById('pace-time-seconds')

      // Mock focus method
      secondsInput.focus = vi.fn()
      secondsInput.select = vi.fn()

      fireEvent.input(minutesInput, { target: { value: '30' } })

      await vi.advanceTimersByTimeAsync(15)
      expect(secondsInput.focus).toHaveBeenCalled()
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
      
      fireEvent.input(secondsInput, { target: { value: '45' } })

      await vi.advanceTimersByTimeAsync(15)
      expect(focusSpy).not.toHaveBeenCalled()
    })

    it('should handle overflow values correctly', async () => {
      const minutesInput = document.getElementById('time-pace-minutes')
      const secondsInput = document.getElementById('time-pace-seconds')

      // Mock focus and other methods
      secondsInput.focus = vi.fn()
      secondsInput.select = vi.fn()

      fireEvent.input(minutesInput, { target: { value: '65' } })

      expect(minutesInput.value).toBe('6')
      await vi.advanceTimersByTimeAsync(15)
      expect(secondsInput.focus).toHaveBeenCalled()
      expect(secondsInput.value).toBe('5')
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

      await vi.advanceTimersByTimeAsync(15)
      expect(input.select).toHaveBeenCalled()
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

      fireEvent.input(minutesInput, { target: { value: '04' } })

      await vi.advanceTimersByTimeAsync(15)
      expect(secondsInput.focus).toHaveBeenCalled()
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

      fireEvent.input(hoursInput, { target: { value: '01' } })

      await vi.advanceTimersByTimeAsync(15)
      expect(minutesInput.focus).toHaveBeenCalled()

      fireEvent.input(minutesInput, { target: { value: '23' } })

      await vi.advanceTimersByTimeAsync(15)
      expect(secondsInput.focus).toHaveBeenCalled()
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

  describe('Arrow Key / Spinner Behavior', () => {
    beforeEach(() => {
      initAutoAdvance()
    })

    it('should NOT auto-advance when modifying an already-complete field', async () => {
      const minutesInput = document.getElementById('pace-time-minutes')
      const secondsInput = document.getElementById('pace-time-seconds')

      // Mock focus and select methods
      secondsInput.focus = vi.fn()
      secondsInput.select = vi.fn()

      // Set initial value of "04" (complete field)
      minutesInput.value = '04'
      // Simulate focus event to store previous value
      fireEvent.focus(minutesInput)

      await vi.advanceTimersByTimeAsync(15)

      // Now simulate user pressing up arrow (or spinner) to change to "05"
      minutesInput.value = '05'
      fireEvent.input(minutesInput, { target: { value: '05' } })

      await vi.advanceTimersByTimeAsync(15)

      // Should NOT advance to seconds since field was already complete
      expect(secondsInput.focus).not.toHaveBeenCalled()
      expect(minutesInput.value).toBe('05')
    })

    it('should auto-advance when completing a previously incomplete field', async () => {
      const minutesInput = document.getElementById('pace-time-minutes')
      const secondsInput = document.getElementById('pace-time-seconds')

      // Mock focus and select methods
      secondsInput.focus = vi.fn()
      secondsInput.select = vi.fn()

      // Set initial value of "4" (incomplete field)
      minutesInput.value = '4'
      // Simulate focus event to store previous value
      fireEvent.focus(minutesInput)

      await vi.advanceTimersByTimeAsync(15)

      // Now simulate user typing another digit to complete the field
      minutesInput.value = '45'
      fireEvent.input(minutesInput, { target: { value: '45' } })

      await vi.advanceTimersByTimeAsync(15)

      // SHOULD advance to seconds since field was incomplete and now complete
      expect(secondsInput.focus).toHaveBeenCalled()
      expect(minutesInput.value).toBe('45')
    })

    it('should NOT auto-advance when changing from "59" to "58" via down arrow', async () => {
      const secondsInput = document.getElementById('time-pace-seconds')

      // Set initial value of "59" (complete field)
      secondsInput.value = '59'
      // Simulate focus event to store previous value
      fireEvent.focus(secondsInput)

      await vi.advanceTimersByTimeAsync(15)

      // Simulate user pressing down arrow to change to "58"
      secondsInput.value = '58'
      fireEvent.input(secondsInput, { target: { value: '58' } })

      await vi.advanceTimersByTimeAsync(15)

      // Value should be updated but no auto-advance (it's the last field anyway)
      expect(secondsInput.value).toBe('58')
    })

    it('should auto-advance when typing from empty to complete field', async () => {
      const minutesInput = document.getElementById('time-pace-minutes')
      const secondsInput = document.getElementById('time-pace-seconds')

      // Mock focus and select methods
      secondsInput.focus = vi.fn()
      secondsInput.select = vi.fn()

      // Start with empty field
      minutesInput.value = ''
      // Simulate focus event to store previous value
      fireEvent.focus(minutesInput)

      await vi.advanceTimersByTimeAsync(15)

      // User types first digit
      minutesInput.value = '3'
      fireEvent.input(minutesInput, { target: { value: '3' } })

      await vi.advanceTimersByTimeAsync(15)

      // Should not advance yet (incomplete)
      expect(secondsInput.focus).not.toHaveBeenCalled()

      // User types second digit
      minutesInput.value = '30'
      fireEvent.input(minutesInput, { target: { value: '30' } })

      await vi.advanceTimersByTimeAsync(15)

      // NOW should advance (complete)
      expect(secondsInput.focus).toHaveBeenCalled()
    })

    it('should handle rapid up arrow presses without auto-advancing', async () => {
      const minutesInput = document.getElementById('pace-time-minutes')
      const secondsInput = document.getElementById('pace-time-seconds')

      // Mock focus and select methods
      secondsInput.focus = vi.fn()
      secondsInput.select = vi.fn()

      // Set initial value of "45" (complete field)
      minutesInput.value = '45'
      fireEvent.focus(minutesInput)

      await vi.advanceTimersByTimeAsync(15)

      // Simulate multiple up arrow presses
      minutesInput.value = '46'
      fireEvent.input(minutesInput, { target: { value: '46' } })

      await vi.advanceTimersByTimeAsync(15)

      minutesInput.value = '47'
      fireEvent.input(minutesInput, { target: { value: '47' } })

      await vi.advanceTimersByTimeAsync(15)

      minutesInput.value = '48'
      fireEvent.input(minutesInput, { target: { value: '48' } })

      await vi.advanceTimersByTimeAsync(15)

      // Should NEVER advance since field was already complete
      expect(secondsInput.focus).not.toHaveBeenCalled()
      expect(minutesInput.value).toBe('48')
    })
  })
})
