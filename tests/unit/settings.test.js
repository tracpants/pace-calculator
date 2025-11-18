import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  loadSettings,
  saveSettings,
  applyTheme,
  applyDefaultDistance
} from '../../src/settings.js';
import { state } from '../../src/state.js';

describe('Settings Module', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();

    document.documentElement.className = '';
    document.documentElement.style.cssText = '';

    state.distanceUnit = 'km';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadSettings', () => {
    it('should return default settings when no saved settings exist', () => {
      const settings = loadSettings();

      expect(settings).toEqual({
        distanceUnit: 'km',
        theme: 'system',
        defaultDistance: null,
        accentColor: 'indigo'
      });
    });

    it('should load saved settings from localStorage', () => {
      const savedSettings = {
        distanceUnit: 'miles',
        theme: 'dark',
        defaultDistance: '10k',
        accentColor: 'indigo'
      };
      localStorage.setItem('pace-calculator-settings', JSON.stringify(savedSettings));

      const settings = loadSettings();

      expect(settings).toEqual(savedSettings);
    });

    it('should merge saved settings with defaults', () => {
      const partialSettings = {
        distanceUnit: 'miles',
        theme: 'dark'
      };
      localStorage.setItem('pace-calculator-settings', JSON.stringify(partialSettings));

      const settings = loadSettings();

      expect(settings.distanceUnit).toBe('miles');
      expect(settings.theme).toBe('dark');
      expect(settings.defaultDistance).toBeNull();
      expect(settings.accentColor).toBe('indigo');
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('pace-calculator-settings', '{invalid json}');

      try {
        loadSettings();
      } catch (error) {
        expect(error).toBeInstanceOf(SyntaxError);
      }
    });
  });

  describe('saveSettings', () => {
    it('should save settings to localStorage', () => {
      const settings = {
        distanceUnit: 'miles',
        theme: 'dark',
        defaultDistance: '5k',
        accentColor: 'indigo'
      };

      saveSettings(settings);

      const saved = JSON.parse(localStorage.getItem('pace-calculator-settings'));
      expect(saved).toEqual(settings);
    });

    it('should overwrite existing settings', () => {
      const oldSettings = { distanceUnit: 'km', theme: 'light' };
      localStorage.setItem('pace-calculator-settings', JSON.stringify(oldSettings));

      const newSettings = { distanceUnit: 'miles', theme: 'dark' };
      saveSettings(newSettings);

      const saved = JSON.parse(localStorage.getItem('pace-calculator-settings'));
      expect(saved).toEqual(newSettings);
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

      const settings = {
        distanceUnit: 'km',
        theme: 'system',
        defaultDistance: '5k',
        accentColor: 'indigo'
      };
      localStorage.setItem('pace-calculator-settings', JSON.stringify(settings));

      applyDefaultDistance();

      const paceDistance = document.getElementById('pace-distance');
      const timeDistance = document.getElementById('time-distance');

      expect(paceDistance.value).toBe('5');
      expect(timeDistance.value).toBe('5');

      consoleLogSpy.mockRestore();
    });

    it('should not overwrite existing values when forceApply is false', () => {
      const settings = {
        distanceUnit: 'km',
        theme: 'system',
        defaultDistance: '10k',
        accentColor: 'indigo'
      };
      localStorage.setItem('pace-calculator-settings', JSON.stringify(settings));

      const paceDistance = document.getElementById('pace-distance');
      paceDistance.value = '5';

      applyDefaultDistance(false);

      expect(paceDistance.value).toBe('5');
    });

    it('should overwrite existing values when forceApply is true', () => {
      const settings = {
        distanceUnit: 'km',
        theme: 'system',
        defaultDistance: '10k',
        accentColor: 'indigo'
      };
      localStorage.setItem('pace-calculator-settings', JSON.stringify(settings));

      const paceDistance = document.getElementById('pace-distance');
      paceDistance.value = '5';

      applyDefaultDistance(true);

      expect(paceDistance.value).toBe('10');
    });

    it('should apply distance values from default setting', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const settings = {
        distanceUnit: 'km',
        theme: 'system',
        defaultDistance: 'half-marathon',
        accentColor: 'indigo'
      };
      localStorage.setItem('pace-calculator-settings', JSON.stringify(settings));

      applyDefaultDistance();

      const paceDistance = document.getElementById('pace-distance');
      const timeDistance = document.getElementById('time-distance');

      expect(paceDistance.value).toBe('21.0975');
      expect(timeDistance.value).toBe('21.0975');

      consoleLogSpy.mockRestore();
    });

    it('should handle missing input fields gracefully', () => {
      document.body.innerHTML = '';

      const settings = {
        distanceUnit: 'km',
        theme: 'system',
        defaultDistance: '5k',
        accentColor: 'indigo'
      };
      localStorage.setItem('pace-calculator-settings', JSON.stringify(settings));

      expect(() => applyDefaultDistance()).not.toThrow();
    });

    it('should handle invalid preset gracefully', () => {
      const settings = {
        distanceUnit: 'km',
        theme: 'system',
        defaultDistance: 'invalid-preset',
        accentColor: 'indigo'
      };
      localStorage.setItem('pace-calculator-settings', JSON.stringify(settings));

      applyDefaultDistance();

      const paceDistance = document.getElementById('pace-distance');
      expect(paceDistance.value).toBe('');
    });

    it('should work with miles unit', () => {
      const settings = {
        distanceUnit: 'miles',
        theme: 'system',
        defaultDistance: '5k',
        accentColor: 'indigo'
      };
      localStorage.setItem('pace-calculator-settings', JSON.stringify(settings));

      state.distanceUnit = 'miles';

      applyDefaultDistance();

      const paceDistance = document.getElementById('pace-distance');
      const expectedDistance = (5 / 1.609344).toFixed(6);

      expect(parseFloat(paceDistance.value)).toBeCloseTo(parseFloat(expectedDistance), 5);
    });
  });

  describe('Integration Tests', () => {
    it('should save and load settings correctly', () => {
      const settings = {
        distanceUnit: 'miles',
        theme: 'dark',
        defaultDistance: 'marathon',
        accentColor: 'indigo'
      };

      saveSettings(settings);
      const loaded = loadSettings();

      expect(loaded).toEqual(settings);
    });

    it('should apply theme and save it', () => {
      applyTheme('dark');

      const settings = loadSettings();
      settings.theme = 'dark';
      saveSettings(settings);

      const loaded = loadSettings();
      expect(loaded.theme).toBe('dark');
    });

    it('should update state when changing distance unit', () => {
      state.distanceUnit = 'miles';

      const settings = loadSettings();
      settings.distanceUnit = 'miles';
      saveSettings(settings);

      const loaded = loadSettings();
      expect(loaded.distanceUnit).toBe('miles');
      expect(state.distanceUnit).toBe('miles');
    });
  });
});
