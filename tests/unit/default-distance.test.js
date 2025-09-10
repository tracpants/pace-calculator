import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../../src/ui.js', () => ({
  populatePresetSelects: vi.fn(),
  updateCalculatedResult: vi.fn(),
  updateHintTexts: vi.fn(),
}))

vi.mock('../../src/pr.js', () => ({
  getAllPRs: vi.fn(() => []),
  getPRForDistance: vi.fn(() => null),
  comparePaceWithPR: vi.fn(() => null),
  getDistanceName: vi.fn(() => ''),
}))

vi.mock('../../src/calculator.js', () => ({
  formatDistance: vi.fn(d => d),
}))

describe('Default distance', () => {
  beforeEach(() => {
    // Stub matchMedia for jsdom
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    localStorage.clear()
    localStorage.setItem('pace-calculator-settings', JSON.stringify({
      distanceUnit: 'km',
      defaultDistance: '5k',
      theme: 'system',
      accentColor: 'indigo',
    }))

    document.body.innerHTML = `
      <div id="settings-modal"></div>
      <div id="help-modal"></div>
      <div id="pr-management-modal"></div>
      <div id="pr-modal"></div>
      <select id="default-distance-select"></select>
      <input id="pace-distance" />
      <select id="pace-preset"></select>
      <input id="time-distance" />
      <select id="time-preset"></select>
      <div data-unit="km"></div>
      <div data-unit="miles"></div>
    `
  })

  it('applies saved default distance on init', async () => {
    const settings = await import('../../src/settings.js')
    settings.initSettings()

    expect(document.getElementById('pace-distance').value).toBe('5')
    expect(document.getElementById('time-distance').value).toBe('5')
    // Preset dropdowns should reflect the saved default if options exist
    // (test environment has no options, so ensure no crash and inputs are set)
  })
})
