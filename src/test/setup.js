// Test setup file
import { beforeEach, afterEach, vi } from 'vitest'

// Mock browser APIs not available in jsdom
global.matchMedia = global.matchMedia || function (query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: global.matchMedia,
})

// Mock navigator properties
Object.defineProperty(window, 'navigator', {
  writable: true,
  value: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    vendor: 'Google Inc.',
    maxTouchPoints: 0,
    share: undefined, // Not available in test environment
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined)
    }
  }
})

// Reset DOM before each test
beforeEach(() => {
  document.body.innerHTML = ''
  document.head.innerHTML = ''
})

// Clean up after each test
afterEach(() => {
  document.body.innerHTML = ''
  // Clear any timers that might be running
  vi.clearAllTimers()
})

// Mock console methods during tests to reduce noise
const originalConsole = { ...console }
beforeEach(() => {
  console.log = vi.fn()
  console.warn = vi.fn() 
  console.error = vi.fn()
})

afterEach(() => {
  Object.assign(console, originalConsole)
})