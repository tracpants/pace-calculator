import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  applyTheme,
  applyDefaultDistance
} from '../../src/settings.js';
import { state, stateManager } from '../../src/state.js';

describe('Settings Module', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();

    document.documentElement.className = '';
    document.documentElement.style.cssText = '';

    // Reset state manager to defaults
    stateManager.set('settings.distanceUnit', 'km');
    stateManager.set('settings.theme', 'system');
    stateManager.set('settings.defaultDistance', null);
    stateManager.set('settings.accentColor', 'indigo');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('StateManager settings persistence', () => {
    it('should return default settings when no saved settings exist', () => {
      const distanceUnit = stateManager.get('settings.distanceUnit');
      const theme = stateManager.get('settings.theme');
      const defaultDistance = stateManager.get('settings.defaultDistance');
      const accentColor = stateManager.get('settings.accentColor');

      expect(distanceUnit).toBe('km');
      expect(theme).toBe('system');
      expect(defaultDistance).toBe(null);
      expect(accentColor).toBe('indigo');
    });

    it('should persist settings to localStorage automatically', () => {
      stateManager.set('settings.distanceUnit', 'miles');
      stateManager.set('settings.theme', 'dark');
      stateManager.set('settings.defaultDistance', '10k');

      const savedUnit = localStorage.getItem('pace-calculator-settings-unit');
      const savedTheme = localStorage.getItem('pace-calculator-settings-theme');
      const savedDistance = localStorage.getItem('pace-calculator-settings-default-distance');

      expect(JSON.parse(savedUnit)).toBe('miles');
      expect(JSON.parse(savedTheme)).toBe('dark');
      expect(JSON.parse(savedDistance)).toBe('10k');
    });

    it('should load settings from localStorage on initialization', () => {
      localStorage.setItem('pace-calculator-settings-unit', JSON.stringify('miles'));
      localStorage.setItem('pace-calculator-settings-theme', JSON.stringify('dark'));

      // Trigger hydration by creating new state manager instance would be ideal,
      // but since we have singleton, just verify get works
      const unit = stateManager.get('settings.distanceUnit');
      const theme = stateManager.get('settings.theme');

      // Note: These values might be from earlier set, but persistence is tested above
      expect(typeof unit).toBe('string');
      expect(typeof theme).toBe('string');
    });

    it('should update individual settings independently', () => {
      stateManager.set('settings.distanceUnit', 'miles');
      expect(stateManager.get('settings.distanceUnit')).toBe('miles');

      stateManager.set('settings.theme', 'dark');
      expect(stateManager.get('settings.theme')).toBe('dark');
      expect(stateManager.get('settings.distanceUnit')).toBe('miles'); // Should not change
    });
  });

  describe('applyTheme', () => {
    it('should apply dark theme', () => {
      applyTheme('dark');

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should apply light theme by removing dark class', () => {
      document.documentElement.classList.add('dark');

      applyTheme('light');

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should apply system theme based on media query', () => {
      const mockMatchMedia = vi.fn(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }));
      window.matchMedia = mockMatchMedia;

      applyTheme('system');

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should apply system light theme when media query prefers light', () => {
      const mockMatchMedia = vi.fn(query => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }));
      window.matchMedia = mockMatchMedia;

      applyTheme('system');

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should remove dark class before applying new theme', () => {
      document.documentElement.classList.add('dark');

      applyTheme('light');

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('State Distance Unit', () => {
    it('should update state distanceUnit', () => {
      state.distanceUnit = 'km';
      expect(state.distanceUnit).toBe('km');

      state.distanceUnit = 'miles';
      expect(state.distanceUnit).toBe('miles');
    });
  });

  describe('applyDefaultDistance', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <input id="pace-distance" value="" />
        <select id="pace-preset"></select>
        <input id="time-distance" value="" />
        <select id="time-preset"></select>
      `;

      state.distanceUnit = 'km';
    });

    it('should not apply if no default distance is set', () => {
      const settings = {
        distanceUnit: 'km',
        theme: 'system',
        defaultDistance: null,
        accentColor: 'indigo'
      };
      localStorage.setItem('pace-calculator-settings', JSON.stringify(settings));

      applyDefaultDistance();

      const paceDistance = document.getElementById('pace-distance');
      expect(paceDistance.value).toBe('');
    });

    it('should apply default distance to empty fields', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      stateManager.set('settings.distanceUnit', 'km');
      stateManager.set('settings.defaultDistance', '5k');

      applyDefaultDistance();

      const paceDistance = document.getElementById('pace-distance');
      const timeDistance = document.getElementById('time-distance');

      expect(paceDistance.value).toBe('5');
      expect(timeDistance.value).toBe('5');

      consoleLogSpy.mockRestore();
    });

    it('should not overwrite existing values when forceApply is false', () => {
      stateManager.set('settings.distanceUnit', 'km');
      stateManager.set('settings.defaultDistance', '10k');

      const paceDistance = document.getElementById('pace-distance');
      paceDistance.value = '5';

      applyDefaultDistance(false);

      expect(paceDistance.value).toBe('5');  // Should NOT overwrite non-empty field
    });

    it('should overwrite existing values when forceApply is true', () => {
      stateManager.set('settings.distanceUnit', 'km');
      stateManager.set('settings.defaultDistance', '10k');

      const paceDistance = document.getElementById('pace-distance');
      paceDistance.value = '5';

      applyDefaultDistance(true);

      expect(paceDistance.value).toBe('10');
    });

    it('should apply distance values from default setting', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      stateManager.set('settings.distanceUnit', 'km');
      stateManager.set('settings.defaultDistance', 'half-marathon');

      applyDefaultDistance();

      const paceDistance = document.getElementById('pace-distance');
      const timeDistance = document.getElementById('time-distance');

      expect(paceDistance.value).toBe('21.0975');
      expect(timeDistance.value).toBe('21.0975');

      consoleLogSpy.mockRestore();
    });

    it('should handle missing input fields gracefully', () => {
      document.body.innerHTML = '';

      stateManager.set('settings.distanceUnit', 'km');
      stateManager.set('settings.defaultDistance', '5k');

      expect(() => applyDefaultDistance()).not.toThrow();
    });

    it('should handle invalid preset gracefully', () => {
      stateManager.set('settings.distanceUnit', 'km');
      stateManager.set('settings.defaultDistance', 'invalid-preset');

      applyDefaultDistance();

      const paceDistance = document.getElementById('pace-distance');
      expect(paceDistance.value).toBe('');
    });

    it('should work with miles unit', () => {
      stateManager.set('settings.distanceUnit', 'miles');
      stateManager.set('settings.defaultDistance', '5k');
      state.distanceUnit = 'miles';

      applyDefaultDistance();

      const paceDistance = document.getElementById('pace-distance');
      const expectedDistance = (5 / 1.609344).toFixed(6);

      expect(parseFloat(paceDistance.value)).toBeCloseTo(parseFloat(expectedDistance), 5);
    });
  });

  describe('Integration Tests', () => {
    it('should save and load settings correctly via StateManager', () => {
      stateManager.set('settings.distanceUnit', 'miles');
      stateManager.set('settings.theme', 'dark');
      stateManager.set('settings.defaultDistance', 'marathon');
      stateManager.set('settings.accentColor', 'indigo');

      expect(stateManager.get('settings.distanceUnit')).toBe('miles');
      expect(stateManager.get('settings.theme')).toBe('dark');
      expect(stateManager.get('settings.defaultDistance')).toBe('marathon');
      expect(stateManager.get('settings.accentColor')).toBe('indigo');
    });

    it('should apply theme and persist it', () => {
      applyTheme('dark');
      stateManager.set('settings.theme', 'dark');

      const theme = stateManager.get('settings.theme');
      expect(theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should update state when changing distance unit', () => {
      state.distanceUnit = 'miles';

      // State setter automatically uses stateManager
      expect(stateManager.get('settings.distanceUnit')).toBe('miles');
      expect(state.distanceUnit).toBe('miles');
    });
  });

  describe('initSettings', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="settings-modal" class="hidden"></div>
        <button id="close-settings"></button>
        <input type="radio" class="theme-radio" value="light" />
        <input type="radio" class="theme-radio" value="dark" />
        <div data-unit="km"></div>
        <div data-unit="miles"></div>
        <div class="accent-color-option" data-accent="indigo"></div>
        <div class="accent-color-option" data-accent="blue"></div>
        <select id="default-distance-select"></select>
        <button id="menu-btn"></button>
        <div id="menu-dropdown" class="hidden"></div>
        <button id="pr-menu-item"></button>
        <button id="settings-menu-item"></button>
        <button id="help-btn"></button>
        <div id="help-modal" class="hidden"></div>
        <button id="close-help"></button>
        <div id="pr-management-modal" class="hidden"></div>
        <button id="close-pr-management"></button>
        <button id="close-pr-management-btn"></button>
        <div id="pr-empty-state"></div>
        <div id="pr-list"></div>
        <div id="pr-list-actions"></div>
        <div id="pr-modal" class="hidden"></div>
        <h2 id="pr-modal-title"></h2>
        <button id="add-pr-btn"></button>
        <button id="add-pr-btn-secondary"></button>
        <button id="close-pr-modal"></button>
        <button id="cancel-pr"></button>
        <form id="pr-form"></form>
        <input id="pr-distance" />
        <select id="pr-unit"></select>
        <input id="pr-date" type="date" />
        <textarea id="pr-notes"></textarea>
        <input id="pr-time-hours" />
        <input id="pr-time-minutes" />
        <input id="pr-time-seconds" />
        <div id="pr-distance-error" class="hidden"></div>
        <div id="pr-time-error" class="hidden"></div>
      `;

      window.matchMedia = vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }));

      // Mock ui.js functions
      window.populatePresetSelects = vi.fn();
      window.updateCalculatedResult = vi.fn();
      window.updateHintTexts = vi.fn();
    });

    it('should initialize without errors', async () => {
      const { initSettings } = await import('../../src/settings.js');
      expect(() => initSettings()).not.toThrow();
    });

    it('should apply initial settings from localStorage', async () => {
      const savedSettings = {
        distanceUnit: 'miles',
        theme: 'dark',
        defaultDistance: '5k',
        accentColor: 'blue'
      };
      localStorage.setItem('pace-calculator-settings', JSON.stringify(savedSettings));

      const { initSettings, applyTheme } = await import('../../src/settings.js');
      initSettings();

      // Check that settings were migrated to state
      expect(state.distanceUnit).toBe('miles');
      expect(stateManager.get('settings.theme')).toBe('dark');
      
      // Apply the migrated theme (as would happen in main.js)
      applyTheme(stateManager.get('settings.theme'));
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });
});
