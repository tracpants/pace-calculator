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

// Provide a minimal TouchEvent polyfill for jsdom environment
if (typeof window.TouchEvent === 'undefined') {
  class MockTouchEvent extends Event {
    constructor(type, params = {}) {
      super(type, params)

      const {
        touches = [],
        targetTouches = [],
        changedTouches = [],
        altKey = false,
        metaKey = false,
        ctrlKey = false,
        shiftKey = false
      } = params

      this.touches = touches
      this.targetTouches = targetTouches
      this.changedTouches = changedTouches
      this.altKey = altKey
      this.metaKey = metaKey
      this.ctrlKey = ctrlKey
      this.shiftKey = shiftKey
    }
  }

  window.TouchEvent = MockTouchEvent
  global.TouchEvent = MockTouchEvent
}

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