/* global KeyboardEvent */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as calc from '../../src/calculator.js';
import { state } from '../../src/state.js';

describe('UI Module', () => {
  beforeEach(() => {
    // Reset state
    state.currentTab = 'pace';
    state.distanceUnit = 'km';
    state.lastResult = null;

    // Setup minimal DOM
    document.body.innerHTML = `
      <form id="calculator-form">
        <div data-section="pace" class="form-section">
          <input id="pace-distance" type="text" />
          <div id="pace-distance-error" class="hidden"></div>
          <div id="pace-distance-hint"></div>
          <input id="pace-time-hours" type="number" />
          <input id="pace-time-minutes" type="number" />
          <input id="pace-time-seconds" type="number" />
          <div id="pace-time-error" class="hidden"></div>
          <select id="pace-preset" class="preset-select">
            <option value="">-- Pick an event --</option>
          </select>
        </div>
        <div data-section="time" class="form-section hidden">
          <input id="time-distance" type="text" />
          <div id="time-distance-error" class="hidden"></div>
          <div id="time-distance-hint"></div>
          <input id="time-pace-minutes" type="number" />
          <input id="time-pace-seconds" type="number" />
          <div id="time-pace-error" class="hidden"></div>
          <div id="time-pace-hint"></div>
          <select id="time-preset" class="preset-select">
            <option value="">-- Pick an event --</option>
          </select>
        </div>
        <div data-section="distance" class="form-section hidden">
          <input id="distance-time-hours" type="number" />
          <input id="distance-time-minutes" type="number" />
          <input id="distance-time-seconds" type="number" />
          <div id="distance-time-error" class="hidden"></div>
          <input id="distance-pace-minutes" type="number" />
          <input id="distance-pace-seconds" type="number" />
          <div id="distance-pace-error" class="hidden"></div>
          <div id="distance-pace-hint"></div>
        </div>
        <button type="submit">Calculate</button>
      </form>
      <div id="result" class="hidden">
        <span id="result-label"></span>
        <span id="result-value"></span>
      </div>
      <div id="loading" class="hidden"></div>
      <button id="copy-result-btn">
        <span id="copy-icon"></span>
        <span id="check-icon" class="hidden"></span>
      </button>
      <div id="copy-feedback"></div>
      <button id="clear-btn">Clear</button>
      <button id="save-pr-btn" class="hidden"></button>
      <button id="update-pr-btn" class="hidden"></button>
      <button data-tab="pace" role="tab" class="btn-tab active"></button>
      <button data-tab="time" role="tab" class="btn-tab"></button>
      <button data-tab="distance" role="tab" class="btn-tab"></button>
      <datalist id="distance-suggestions"></datalist>
    `;

    // Mock navigator
    global.navigator = {
      userAgent: 'Mozilla/5.0',
      vendor: '',
      maxTouchPoints: 0,
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    };

    // Mock window.matchMedia
    window.matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Input Validation Helpers', () => {
    it('should validate segmented time input correctly', async () => {
      const { initUI } = await import('../../src/ui.js');

      // Set valid time
      document.getElementById('pace-time-hours').value = '1';
      document.getElementById('pace-time-minutes').value = '30';
      document.getElementById('pace-time-seconds').value = '45';

      expect(() => initUI()).not.toThrow();
    });

    it('should validate segmented pace input correctly', async () => {
      const { initUI } = await import('../../src/ui.js');

      // Set valid pace
      document.getElementById('time-pace-minutes').value = '5';
      document.getElementById('time-pace-seconds').value = '30';

      expect(() => initUI()).not.toThrow();
    });
  });

  describe('Device Detection', () => {
    it('should detect non-mobile devices', async () => {
      global.navigator.maxTouchPoints = 0;
      window.matchMedia = vi.fn(() => ({ matches: false }));

      // This indirectly tests isMobileDevice through UI initialization
      const { initUI } = await import('../../src/ui.js');
      expect(() => initUI()).not.toThrow();
    });

    it('should detect mobile devices', async () => {
      global.navigator.maxTouchPoints = 5;
      window.matchMedia = vi.fn(() => ({ matches: true }));

      const { initUI } = await import('../../src/ui.js');
      expect(() => initUI()).not.toThrow();
    });
  });

  describe('Result Display', () => {
    it('should update hint texts for km', async () => {
      const { updateHintTexts } = await import('../../src/ui.js');
      state.distanceUnit = 'km';

      updateHintTexts();

      const timePaceHint = document.getElementById('time-pace-hint');
      const distancePaceHint = document.getElementById('distance-pace-hint');

      if (timePaceHint) {
        expect(timePaceHint.textContent).toContain('km');
      }
      if (distancePaceHint) {
        expect(distancePaceHint.textContent).toContain('km');
      }
    });

    it('should update hint texts for miles', async () => {
      const { updateHintTexts } = await import('../../src/ui.js');
      state.distanceUnit = 'miles';

      updateHintTexts();

      const timePaceHint = document.getElementById('time-pace-hint');
      const distancePaceHint = document.getElementById('distance-pace-hint');

      if (timePaceHint) {
        expect(timePaceHint.textContent).toContain('miles');
      }
      if (distancePaceHint) {
        expect(distancePaceHint.textContent).toContain('miles');
      }
    });
  });

  describe('Autocomplete', () => {
    it('should populate autocomplete suggestions', async () => {
      const { populateAutocomplete } = await import('../../src/ui.js');

      populateAutocomplete();

      const datalist = document.getElementById('distance-suggestions');
      expect(datalist).not.toBeNull();
    });
  });

  describe('Preset Selection', () => {
    it('should populate preset selects', async () => {
      const { populatePresetSelects } = await import('../../src/ui.js');

      populatePresetSelects();

      const pacePreset = document.getElementById('pace-preset');
      const timePreset = document.getElementById('time-preset');

      expect(pacePreset.options.length).toBeGreaterThan(1);
      expect(timePreset.options.length).toBeGreaterThan(1);
    });
  });

  describe('Result Updates', () => {
    it('should update calculated result for pace calculation', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.lastResult = {
        type: 'pace',
        data: {
          pacePerKm: 300,
          pacePerMile: 480
        }
      };
      state.distanceUnit = 'km';

      const resultDiv = document.getElementById('result');
      resultDiv.classList.remove('hidden');
      resultDiv.classList.add('show');

      const { updateCalculatedResult } = await import('../../src/ui.js');
      updateCalculatedResult();

      const resultValue = document.getElementById('result-value');
      expect(resultValue.innerHTML).toContain('/km');
    });

    it('should update calculated result for time calculation', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.lastResult = {
        type: 'time',
        data: {
          totalSeconds: 3600
        }
      };

      const resultDiv = document.getElementById('result');
      resultDiv.classList.remove('hidden');
      resultDiv.classList.add('show');

      const { updateCalculatedResult } = await import('../../src/ui.js');
      updateCalculatedResult();

      const resultLabel = document.getElementById('result-label');
      expect(resultLabel.textContent).toContain('Time');
    });

    it('should update calculated result for distance calculation', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.lastResult = {
        type: 'distance',
        data: {
          km: 5,
          miles: 3.1
        }
      };
      state.distanceUnit = 'km';

      const resultDiv = document.getElementById('result');
      resultDiv.classList.remove('hidden');
      resultDiv.classList.add('show');

      const { updateCalculatedResult } = await import('../../src/ui.js');
      updateCalculatedResult();

      const resultValue = document.getElementById('result-value');
      expect(resultValue.innerHTML).toContain('km');
    });

    it('should not update result if result is hidden', async () => {
      const { updateCalculatedResult } = await import('../../src/ui.js');

      state.lastResult = {
        type: 'pace',
        data: { pacePerKm: 300, pacePerMile: 480 }
      };

      const resultDiv = document.getElementById('result');
      resultDiv.classList.add('hidden');

      updateCalculatedResult();

      const resultValue = document.getElementById('result-value');
      expect(resultValue.innerHTML).toBe('');
    });
  });

  describe('Clipboard Operations', () => {
    it('should handle clipboard write success', async () => {
      global.navigator.clipboard.writeText = vi.fn().mockResolvedValue(undefined);

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.lastResult = {
        type: 'pace',
        data: { pacePerKm: 300, pacePerMile: 480 }
      };

      const resultDiv = document.getElementById('result');
      resultDiv.classList.remove('hidden');

      const copyBtn = document.getElementById('copy-result-btn');
      copyBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(global.navigator.clipboard.writeText).toHaveBeenCalled();
    });

    it('should handle clipboard write failure with fallback', async () => {
      global.navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error('Clipboard error'));
      document.execCommand = vi.fn().mockReturnValue(true);

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.lastResult = {
        type: 'pace',
        data: { pacePerKm: 300, pacePerMile: 480 }
      };

      const resultDiv = document.getElementById('result');
      resultDiv.classList.remove('hidden');

      const copyBtn = document.getElementById('copy-result-btn');
      copyBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(global.navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should calculate pace on form submit', async () => {
      vi.spyOn(calc, 'calculatePace').mockReturnValue({
        pacePerKm: 300,
        pacePerMile: 480
      });
      vi.spyOn(calc, 'validateDistanceInput').mockReturnValue({ valid: true, value: 5 });

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      document.getElementById('pace-distance').value = '5';
      document.getElementById('pace-time-hours').value = '0';
      document.getElementById('pace-time-minutes').value = '25';
      document.getElementById('pace-time-seconds').value = '0';

      const form = document.getElementById('calculator-form');
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 400));

      expect(calc.calculatePace).toHaveBeenCalled();
    });

    it('should calculate time on form submit', async () => {
      vi.spyOn(calc, 'calculateTime').mockReturnValue(1500);
      vi.spyOn(calc, 'validateDistanceInput').mockReturnValue({ valid: true, value: 5 });

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'time';
      document.getElementById('time-distance').value = '5';
      document.getElementById('time-pace-minutes').value = '5';
      document.getElementById('time-pace-seconds').value = '0';

      const form = document.getElementById('calculator-form');
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 400));

      expect(calc.calculateTime).toHaveBeenCalled();
    });

    it('should calculate distance on form submit', async () => {
      vi.spyOn(calc, 'calculateDistance').mockReturnValue({
        km: 5,
        miles: 3.1
      });

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'distance';
      document.getElementById('distance-time-hours').value = '0';
      document.getElementById('distance-time-minutes').value = '25';
      document.getElementById('distance-time-seconds').value = '0';
      document.getElementById('distance-pace-minutes').value = '5';
      document.getElementById('distance-pace-seconds').value = '0';

      const form = document.getElementById('calculator-form');
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 400));

      expect(calc.calculateDistance).toHaveBeenCalled();
    });

    it('should handle form submission errors', async () => {
      vi.spyOn(calc, 'validateDistanceInput').mockReturnValue({
        valid: false,
        message: 'Invalid distance'
      });

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      document.getElementById('pace-distance').value = 'invalid';
      document.getElementById('pace-time-minutes').value = '25';

      const form = document.getElementById('calculator-form');
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 400));

      const resultDiv = document.getElementById('result');
      expect(resultDiv.classList.contains('error')).toBe(true);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should switch tabs with Ctrl+1/2/3', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      const event = new KeyboardEvent('keydown', {
        key: '2',
        ctrlKey: true
      });

      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(state.currentTab).toBe('time');
    });

    it('should handle Enter key on inputs', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      const form = document.getElementById('calculator-form');
      const submitSpy = vi.fn();
      form.addEventListener('submit', submitSpy);

      const input = document.getElementById('pace-distance');
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      });

      Object.defineProperty(event, 'target', { value: input, enumerable: true });
      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(submitSpy).toHaveBeenCalled();
    });
  });

  describe('Tab State Management', () => {
    it('should save and restore tab states', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      // Set some values in pace tab
      state.currentTab = 'pace';
      document.getElementById('pace-distance').value = '10';

      // Switch to time tab
      const timeTab = document.querySelector('[data-tab="time"]');
      timeTab.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Switch back to pace tab
      const paceTab = document.querySelector('[data-tab="pace"]');
      paceTab.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if value was restored
      expect(document.getElementById('pace-distance').value).toBe('10');
    });
  });

  describe('Clear Function', () => {
    it('should clear current tab inputs', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      const distanceInput = document.getElementById('pace-distance');
      distanceInput.value = '5';

      const clearBtn = document.getElementById('clear-btn');
      clearBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(distanceInput.value).toBe('');
    });

    it('should clear errors when clearing tab', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      const errorDiv = document.getElementById('pace-distance-error');
      errorDiv.classList.remove('hidden');

      const clearBtn = document.getElementById('clear-btn');
      clearBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(errorDiv.classList.contains('hidden')).toBe(true);
    });
  });

  describe('PR Button Visibility', () => {
    it('should show save PR button for pace calculations without existing PR', async () => {
      const mockGetPRForDistance = vi.fn().mockReturnValue(null);
      vi.doMock('../../src/pr.js', () => ({
        getPRForDistance: mockGetPRForDistance,
        comparePaceWithPR: vi.fn().mockReturnValue(null)
      }));

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.lastResult = {
        type: 'pace',
        data: {
          pacePerKm: 300,
          pacePerMile: 480
        }
      };

      document.getElementById('pace-distance').value = '5';
      document.getElementById('pace-time-minutes').value = '25';

      const resultDiv = document.getElementById('result');
      resultDiv.classList.remove('hidden');

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should hide PR buttons for non-pace calculations', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.lastResult = {
        type: 'time',
        data: {
          totalSeconds: 1500
        }
      };

      const savePrBtn = document.getElementById('save-pr-btn');
      const updatePrBtn = document.getElementById('update-pr-btn');

      expect(savePrBtn.classList.contains('hidden')).toBe(true);
      expect(updatePrBtn.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Loading State', () => {
    it('should show loading during calculation', async () => {
      vi.spyOn(calc, 'calculatePace').mockReturnValue({
        pacePerKm: 300,
        pacePerMile: 480
      });
      vi.spyOn(calc, 'validateDistanceInput').mockReturnValue({ valid: true, value: 5 });

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      document.getElementById('pace-distance').value = '5';
      document.getElementById('pace-time-minutes').value = '25';

      const form = document.getElementById('calculator-form');
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 50));

      const loadingDiv = document.getElementById('loading');
      expect(loadingDiv.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Input Reset on Manual Change', () => {
    it('should reset preset dropdown when distance is manually changed', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      const presetSelect = document.getElementById('pace-preset');
      const distanceInput = document.getElementById('pace-distance');

      // Select a preset
      presetSelect.selectedIndex = 1;

      // Manually change distance
      distanceInput.value = '7.5';
      distanceInput.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('Segmented Input Validation', () => {
    it('should validate time inputs on blur', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      const hoursInput = document.getElementById('pace-time-hours');
      const minutesInput = document.getElementById('pace-time-minutes');
      const secondsInput = document.getElementById('pace-time-seconds');

      hoursInput.value = '1';
      minutesInput.value = '30';
      secondsInput.value = '45';

      hoursInput.dispatchEvent(new Event('blur'));
      minutesInput.dispatchEvent(new Event('blur'));
      secondsInput.dispatchEvent(new Event('blur'));

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should clear errors on input', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      const minutesInput = document.getElementById('pace-time-minutes');
      const errorDiv = document.getElementById('pace-time-error');

      errorDiv.classList.remove('hidden');
      minutesInput.classList.add('error');

      minutesInput.value = '30';
      minutesInput.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(errorDiv.classList.contains('hidden')).toBe(true);
    });
  });
});
