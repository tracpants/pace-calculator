import { beforeEach, afterEach, vi } from 'vitest'

global.matchMedia = global.matchMedia || function (query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
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
    share: undefined,
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined)
    }
  }
})

const createLocalStorageMock = () => ({
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
})

Object.defineProperty(window, 'localStorage', {
  value: createLocalStorageMock(),
  writable: true
})

// Reset DOM and localStorage before each test
beforeEach(() => {
  document.body.innerHTML = ''
  document.head.innerHTML = ''
  localStorage.clear()
})

// Clean up after each test
afterEach(() => {
  document.body.innerHTML = ''
  // Clear any timers that might be running
  vi.clearAllTimers()
})