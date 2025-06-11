import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fireEvent } from '@testing-library/dom'
import { initUI } from '../ui.js'
import { state } from '../state.js'

// Mock the other modules that ui.js depends on
vi.mock('../settings.js', () => ({
  applyDefaultDistance: vi.fn()
}))

vi.mock('../calculator.js', () => ({
  validateDistanceInput: vi.fn(() => ({ valid: true, value: 10 })),
  formatTime: vi.fn((seconds) => `${Math.floor(seconds/60)}:${(seconds%60).toString().padStart(2, '0')}`),
  formatDistance: vi.fn((distance) => distance.toString())
}))

vi.mock('../auto-advance.js', () => ({
  reinitAutoAdvance: vi.fn()
}))

vi.mock('../pr.js', () => ({
  getAllPRs: vi.fn(() => []),
  getPRForDistance: vi.fn(() => null),
  comparePaceWithPR: vi.fn(() => null),
  getDistanceName: vi.fn(() => 'Test Distance')
}))

vi.mock('../distances.js', () => ({
  getRaceDistances: vi.fn(() => ({
    '5k': { km: 5, miles: 3.107 },
    '10k': { km: 10, miles: 6.214 }
  })),
  getDistanceSuggestions: vi.fn(() => ({
    km: [5, 10, 21.1],
    miles: [3.1, 6.2, 13.1]
  })),
  getDistanceDisplayName: vi.fn((key) => key.toUpperCase()),
  findDistanceKey: vi.fn(() => null)
}))

describe('Tab Functionality', () => {
  beforeEach(() => {
    // Reset state
    state.currentTab = 'pace'
    state.distanceUnit = 'km'
    state.tabStates = {}
    state.lastResult = null
    
    // Create minimal HTML structure needed for tabs
    document.body.innerHTML = `
      <div id="app">
        <!-- Tabs -->
        <div role="tablist">
          <button data-tab="pace" class="btn-tab active" role="tab" id="pace-tab">Pace</button>
          <button data-tab="time" class="btn-tab" role="tab" id="time-tab">Time</button>
          <button data-tab="distance" class="btn-tab" role="tab" id="distance-tab">Distance</button>
        </div>

        <!-- Form sections -->
        <form id="calculator-form">
          <div data-section="pace" class="form-section">
            <input id="pace-time-hours" type="number" />
            <input id="pace-time-minutes" type="number" />
            <input id="pace-time-seconds" type="number" />
            <input id="pace-distance" type="text" />
            <select id="pace-preset" class="preset-select"></select>
            <div id="pace-time-error" class="hidden"></div>
            <div id="pace-distance-error" class="hidden"></div>
          </div>
          
          <div data-section="time" class="form-section hidden">
            <input id="time-pace-minutes" type="number" />
            <input id="time-pace-seconds" type="number" />
            <input id="time-distance" type="text" />
            <select id="time-preset" class="preset-select"></select>
            <div id="time-pace-error" class="hidden"></div>
            <div id="time-distance-error" class="hidden"></div>
          </div>
          
          <div data-section="distance" class="form-section hidden">
            <input id="distance-time-hours" type="number" />
            <input id="distance-time-minutes" type="number" />
            <input id="distance-time-seconds" type="number" />
            <input id="distance-pace-minutes" type="number" />
            <input id="distance-pace-seconds" type="number" />
            <div id="distance-time-error" class="hidden"></div>
            <div id="distance-pace-error" class="hidden"></div>
          </div>
          
          <button type="submit">Calculate</button>
        </form>

        <!-- Required elements -->
        <div id="result" class="hidden">
          <div id="result-label"></div>
          <div id="result-value"></div>
        </div>
        <div id="loading" class="hidden"></div>
        <button id="copy-result-btn">
          <svg id="copy-icon"></svg>
          <svg id="check-icon" class="hidden"></svg>
        </button>
        <button id="clear-btn">Clear</button>
        <button id="save-pr-btn" class="hidden">Save PR</button>
        <button id="update-pr-btn" class="hidden">Update PR</button>
        
        <datalist id="distance-suggestions"></datalist>
      </div>
    `
  })

  describe('Tab Elements Existence', () => {
    it('should find all required tab elements', () => {
      const tabs = document.querySelectorAll('[data-tab]')
      expect(tabs).toHaveLength(3)
      
      const sections = document.querySelectorAll('[data-section]')
      expect(sections).toHaveLength(3)
      
      expect(document.getElementById('pace-tab')).toBeTruthy()
      expect(document.getElementById('time-tab')).toBeTruthy()
      expect(document.getElementById('distance-tab')).toBeTruthy()
    })

    it('should have correct initial tab state', () => {
      const paceTab = document.querySelector('[data-tab="pace"]')
      const timeTab = document.querySelector('[data-tab="time"]')
      const distanceTab = document.querySelector('[data-tab="distance"]')
      
      expect(paceTab.classList.contains('active')).toBe(true)
      expect(timeTab.classList.contains('active')).toBe(false)
      expect(distanceTab.classList.contains('active')).toBe(false)
    })

    it('should have correct initial section visibility', () => {
      const paceSection = document.querySelector('[data-section="pace"]')
      const timeSection = document.querySelector('[data-section="time"]')
      const distanceSection = document.querySelector('[data-section="distance"]')
      
      expect(paceSection.classList.contains('hidden')).toBe(false)
      expect(timeSection.classList.contains('hidden')).toBe(true)
      expect(distanceSection.classList.contains('hidden')).toBe(true)
    })
  })

  describe('Tab Initialization', () => {
    it('should initialize UI without errors', async () => {
      await expect(initUI()).resolves.not.toThrow()
    })

    it('should find all required DOM elements during initialization', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      await initUI()
      
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('Required element missing'))
      consoleSpy.mockRestore()
    })
  })

  describe('Tab Clicking Behavior', () => {
    beforeEach(async () => {
      await initUI()
    })

    it('should switch to time tab when clicked', () => {
      const timeTab = document.querySelector('[data-tab="time"]')
      const paceTab = document.querySelector('[data-tab="pace"]')
      
      fireEvent.click(timeTab)
      
      expect(state.currentTab).toBe('time')
      expect(timeTab.classList.contains('active')).toBe(true)
      expect(paceTab.classList.contains('active')).toBe(false)
    })

    it('should show/hide correct sections when switching tabs', () => {
      const timeTab = document.querySelector('[data-tab="time"]')
      
      fireEvent.click(timeTab)
      
      const paceSection = document.querySelector('[data-section="pace"]')
      const timeSection = document.querySelector('[data-section="time"]')
      
      expect(paceSection.classList.contains('hidden')).toBe(true)
      expect(timeSection.classList.contains('hidden')).toBe(false)
    })

    it('should switch to distance tab when clicked', () => {
      const distanceTab = document.querySelector('[data-tab="distance"]')
      
      fireEvent.click(distanceTab)
      
      expect(state.currentTab).toBe('distance')
      expect(distanceTab.classList.contains('active')).toBe(true)
      
      const distanceSection = document.querySelector('[data-section="distance"]')
      expect(distanceSection.classList.contains('hidden')).toBe(false)
    })

    it('should handle rapid tab switching', () => {
      const timeTab = document.querySelector('[data-tab="time"]')
      const distanceTab = document.querySelector('[data-tab="distance"]')
      const paceTab = document.querySelector('[data-tab="pace"]')
      
      fireEvent.click(timeTab)
      fireEvent.click(distanceTab)
      fireEvent.click(paceTab)
      
      expect(state.currentTab).toBe('pace')
      expect(paceTab.classList.contains('active')).toBe(true)
      
      const paceSection = document.querySelector('[data-section="pace"]')
      expect(paceSection.classList.contains('hidden')).toBe(false)
    })
  })

  describe('Tab Accessibility', () => {
    beforeEach(async () => {
      await initUI()
    })

    it('should have proper ARIA attributes', () => {
      const tabs = document.querySelectorAll('[role="tab"]')
      
      tabs.forEach(tab => {
        expect(tab.getAttribute('role')).toBe('tab')
        expect(tab.hasAttribute('aria-selected')).toBe(true)
        expect(tab.hasAttribute('tabindex')).toBe(true)
      })
    })

    it('should handle keyboard navigation', () => {
      const timeTab = document.querySelector('[data-tab="time"]')
      
      fireEvent.keyDown(timeTab, { key: 'Enter' })
      
      expect(state.currentTab).toBe('time')
    })

    it('should handle space key navigation', () => {
      const distanceTab = document.querySelector('[data-tab="distance"]')
      
      fireEvent.keyDown(distanceTab, { key: ' ' })
      
      expect(state.currentTab).toBe('distance')
    })
  })

  describe('Tab State Management', () => {
    beforeEach(async () => {
      await initUI()
    })

    it('should preserve tab states when switching', () => {
      const paceDistanceInput = document.getElementById('pace-distance')
      paceDistanceInput.value = '10'
      
      // Switch to time tab
      const timeTab = document.querySelector('[data-tab="time"]')
      fireEvent.click(timeTab)
      
      // Switch back to pace tab
      const paceTab = document.querySelector('[data-tab="pace"]')
      fireEvent.click(paceTab)
      
      // Value should be preserved
      expect(paceDistanceInput.value).toBe('10')
    })

    it('should handle errors gracefully', () => {
      const originalQuerySelector = document.querySelector
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock querySelector to return null for target section
      document.querySelector = vi.fn((selector) => {
        if (selector.includes('data-section=')) {
          return null
        }
        return originalQuerySelector.call(document, selector)
      })
      
      const timeTab = document.querySelector('[data-tab="time"]')
      
      expect(() => fireEvent.click(timeTab)).not.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith('Target section not found for:', 'time')
      
      document.querySelector = originalQuerySelector
      consoleSpy.mockRestore()
    })
  })

  describe('Tab Integration with Form', () => {
    beforeEach(async () => {
      await initUI()
    })

    it('should clear form when clear button is clicked', () => {
      const paceDistanceInput = document.getElementById('pace-distance')
      paceDistanceInput.value = '10'
      
      const clearBtn = document.getElementById('clear-btn')
      fireEvent.click(clearBtn)
      
      expect(paceDistanceInput.value).toBe('')
    })

    it('should handle form submission correctly', () => {
      const form = document.getElementById('calculator-form')
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      expect(() => fireEvent.submit(form)).not.toThrow()
      
      consoleSpy.mockRestore()
    })
  })
})