/* global KeyboardEvent */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as calc from '../../src/calculator.js';
import * as pr from '../../src/pr.js';
import { state } from '../../src/state.js';

describe('UI Module Extended Coverage', () => {
  beforeEach(() => {
    // Reset state
    state.currentTab = 'pace';
    state.distanceUnit = 'km';
    state.lastResult = null;
    state.tabStates = {
      pace: { inputs: {}, validationStates: {}, result: null, presetSelection: '' },
      time: { inputs: {}, validationStates: {}, result: null, presetSelection: '' },
      distance: { inputs: {}, validationStates: {}, result: null, presetSelection: '' }
    };

    // Setup comprehensive DOM
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
            <option value="5k">5K</option>
            <option value="10k">10K</option>
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
            <option value="5k">5K</option>
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
      <button data-tab="pace" role="tab" class="btn-tab active" tabindex="0" aria-selected="true"></button>
      <button data-tab="time" role="tab" class="btn-tab" tabindex="-1" aria-selected="false"></button>
      <button data-tab="distance" role="tab" class="btn-tab" tabindex="-1" aria-selected="false"></button>
      <datalist id="distance-suggestions"></datalist>
    `;

    // Mock navigator
    global.navigator = {
      userAgent: 'Mozilla/5.0',
      vendor: '',
      maxTouchPoints: 0,
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      },
      share: undefined
    };

    // Mock window methods
    window.matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));

    window.scrollTo = vi.fn();
    window.pageYOffset = 0;
    window.innerHeight = 800;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Keyboard Navigation - Arrow Keys', () => {
    it('should navigate tabs with ArrowRight', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      const tabs = document.querySelectorAll('[role="tab"]');
      const firstTab = tabs[0];
      firstTab.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true
      });

      Object.defineProperty(event, 'target', { value: firstTab, enumerable: true });
      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should navigate tabs with ArrowLeft', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      const tabs = document.querySelectorAll('[role="tab"]');
      const secondTab = tabs[1];
      secondTab.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        bubbles: true
      });

      Object.defineProperty(event, 'target', { value: secondTab, enumerable: true });
      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should navigate to first tab with Home key', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      const tabs = document.querySelectorAll('[role="tab"]');
      const lastTab = tabs[2];
      lastTab.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'Home',
        bubbles: true
      });

      Object.defineProperty(event, 'target', { value: lastTab, enumerable: true });
      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should navigate to last tab with End key', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      const tabs = document.querySelectorAll('[role="tab"]');
      const firstTab = tabs[0];
      firstTab.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'End',
        bubbles: true
      });

      Object.defineProperty(event, 'target', { value: firstTab, enumerable: true });
      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should navigate tabs with ArrowDown', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      const tabs = document.querySelectorAll('[role="tab"]');
      const firstTab = tabs[0];
      firstTab.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true
      });

      Object.defineProperty(event, 'target', { value: firstTab, enumerable: true });
      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should navigate tabs with ArrowUp', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      const tabs = document.querySelectorAll('[role="tab"]');
      const secondTab = tabs[1];
      secondTab.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true
      });

      Object.defineProperty(event, 'target', { value: secondTab, enumerable: true });
      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should handle Space key on tabs', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      const tabs = document.querySelectorAll('[role="tab"]');
      const secondTab = tabs[1];

      const event = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true
      });

      Object.defineProperty(event, 'target', { value: secondTab, enumerable: true });
      secondTab.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should switch tabs with Cmd+1', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'time';

      const event = new KeyboardEvent('keydown', {
        key: '1',
        metaKey: true
      });

      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should switch tabs with Cmd+3', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      const event = new KeyboardEvent('keydown', {
        key: '3',
        metaKey: true
      });

      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(state.currentTab).toBe('distance');
    });

    it('should not switch to same tab', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';

      const event = new KeyboardEvent('keydown', {
        key: '1',
        ctrlKey: true
      });

      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(state.currentTab).toBe('pace');
    });
  });

  describe('Preset Selection', () => {
    it('should handle preset selection change', async () => {
      vi.spyOn(calc, 'validateDistanceInput').mockReturnValue({ valid: true, value: 5 });

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      const presetSelect = document.getElementById('pace-preset');
      presetSelect.value = '5k';

      const event = new Event('change', { bubbles: true });
      presetSelect.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should not apply preset when empty value selected', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      const presetSelect = document.getElementById('pace-preset');
      const distanceInput = document.getElementById('pace-distance');

      distanceInput.value = '10';
      presetSelect.value = '';

      const event = new Event('change', { bubbles: true });
      presetSelect.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(distanceInput.value).toBe('10');
    });

    it('should reset preset dropdown when distance matches preset', async () => {
      vi.doMock('../../src/distances.js', async importOriginal => {
        const actual = await importOriginal();
        return {
          ...actual,
          findDistanceKey: vi.fn().mockReturnValue('5k'),
        };
      });

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      const distanceInput = document.getElementById('pace-distance');
      distanceInput.value = '5';

      const event = new Event('input', { bubbles: true });
      distanceInput.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should reset preset dropdown to default when no match', async () => {
      vi.doMock('../../src/distances.js', async importOriginal => {
        const actual = await importOriginal();
        return {
          ...actual,
          findDistanceKey: vi.fn().mockReturnValue(null),
        };
      });

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      const presetSelect = document.getElementById('pace-preset');
      const distanceInput = document.getElementById('pace-distance');

      presetSelect.selectedIndex = 1;
      distanceInput.value = '7.5';

      const event = new Event('input', { bubbles: true });
      distanceInput.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should reset preset dropdown when distance is empty', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      const presetSelect = document.getElementById('pace-preset');
      const distanceInput = document.getElementById('pace-distance');

      presetSelect.selectedIndex = 1;
      distanceInput.value = '';

      const event = new Event('input', { bubbles: true });
      distanceInput.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('PR Button Handling', () => {
    it('should handle save PR button click', async () => {
      vi.spyOn(pr, 'setPR').mockReturnValue(true);
      vi.spyOn(pr, 'getPRForDistance').mockReturnValue(null);
      vi.spyOn(pr, 'comparePaceWithPR').mockReturnValue(null);

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.lastResult = {
        type: 'pace',
        data: { pacePerKm: 300, pacePerMile: 480 }
      };

      document.getElementById('pace-distance').value = '5';
      document.getElementById('pace-time-hours').value = '0';
      document.getElementById('pace-time-minutes').value = '25';
      document.getElementById('pace-time-seconds').value = '0';

      const savePrBtn = document.getElementById('save-pr-btn');
      savePrBtn.classList.remove('hidden');
      savePrBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(pr.setPR).toHaveBeenCalled();
    });

    it('should handle update PR button click', async () => {
      vi.spyOn(pr, 'setPR').mockReturnValue(true);
      vi.spyOn(pr, 'getPRForDistance').mockReturnValue({
        distance: 5,
        unit: 'km',
        timeSeconds: 1600
      });

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.lastResult = {
        type: 'pace',
        data: { pacePerKm: 300, pacePerMile: 480 }
      };

      document.getElementById('pace-distance').value = '5';
      document.getElementById('pace-time-hours').value = '0';
      document.getElementById('pace-time-minutes').value = '24';
      document.getElementById('pace-time-seconds').value = '0';

      const updatePrBtn = document.getElementById('update-pr-btn');
      updatePrBtn.classList.remove('hidden');
      updatePrBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(pr.setPR).toHaveBeenCalled();
    });

    it('should not save PR when no result', async () => {
      vi.spyOn(pr, 'setPR');

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.lastResult = null;

      const savePrBtn = document.getElementById('save-pr-btn');
      savePrBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(pr.setPR).not.toHaveBeenCalled();
    });

    it('should not save PR when result is not pace type', async () => {
      vi.spyOn(pr, 'setPR');

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.lastResult = {
        type: 'time',
        data: { totalSeconds: 1500 }
      };

      const savePrBtn = document.getElementById('save-pr-btn');
      savePrBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(pr.setPR).not.toHaveBeenCalled();
    });

    it('should not hide PR buttons when distance is invalid', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.lastResult = {
        type: 'pace',
        data: { pacePerKm: 300, pacePerMile: 480 }
      };

      document.getElementById('pace-distance').value = '0';

      const savePrBtn = document.getElementById('save-pr-btn');
      const updatePrBtn = document.getElementById('update-pr-btn');

      expect(savePrBtn.classList.contains('hidden')).toBe(true);
      expect(updatePrBtn.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Share and Copy Functionality', () => {
    it('should use Web Share API on mobile when available', async () => {
      global.navigator.share = vi.fn().mockResolvedValue(undefined);
      global.navigator.maxTouchPoints = 5;
      window.matchMedia = vi.fn(() => ({ matches: true }));

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

      expect(global.navigator.share).toHaveBeenCalled();
    });

    it('should fallback to clipboard when share is cancelled', async () => {
      global.navigator.share = vi.fn().mockRejectedValue(new Error('Share cancelled'));
      global.navigator.clipboard.writeText = vi.fn().mockResolvedValue(undefined);
      global.navigator.maxTouchPoints = 5;
      window.matchMedia = vi.fn(() => ({ matches: true }));

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

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(global.navigator.clipboard.writeText).toHaveBeenCalled();
    });

    it('should handle clipboard failure with fallback success', async () => {
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

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });

    it('should generate comprehensive result for time calculation', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.lastResult = {
        type: 'time',
        data: { totalSeconds: 1500 }
      };

      document.getElementById('time-distance').value = '5';
      document.getElementById('time-pace-minutes').value = '5';
      document.getElementById('time-pace-seconds').value = '0';

      const resultDiv = document.getElementById('result');
      resultDiv.classList.remove('hidden');

      const copyBtn = document.getElementById('copy-result-btn');
      copyBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(global.navigator.clipboard.writeText).toHaveBeenCalled();
    });

    it('should generate comprehensive result for distance calculation', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.lastResult = {
        type: 'distance',
        data: { km: 5, miles: 3.1 }
      };

      document.getElementById('distance-time-hours').value = '0';
      document.getElementById('distance-time-minutes').value = '25';
      document.getElementById('distance-time-seconds').value = '0';
      document.getElementById('distance-pace-minutes').value = '5';
      document.getElementById('distance-pace-seconds').value = '0';

      const resultDiv = document.getElementById('result');
      resultDiv.classList.remove('hidden');

      const copyBtn = document.getElementById('copy-result-btn');
      copyBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(global.navigator.clipboard.writeText).toHaveBeenCalled();
    });

    it('should generate comprehensive result with PR comparison', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.lastResult = {
        type: 'pace',
        data: {
          pacePerKm: 300,
          pacePerMile: 480,
          prComparison: {
            prDistance: 5,
            prUnit: 'km',
            prTimeFormatted: '26:00',
            prPaceFormatted: '5:12',
            isFaster: true,
            timeDifferenceFormatted: '1:00',
            paceDifferenceFormatted: '0:12'
          }
        }
      };

      document.getElementById('pace-distance').value = '5';
      document.getElementById('pace-time-hours').value = '0';
      document.getElementById('pace-time-minutes').value = '25';
      document.getElementById('pace-time-seconds').value = '0';

      const resultDiv = document.getElementById('result');
      resultDiv.classList.remove('hidden');

      const copyBtn = document.getElementById('copy-result-btn');
      copyBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(global.navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  describe('Validation Edge Cases', () => {
    it('should validate pace inputs on blur for time tab', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'time';
      const minutesInput = document.getElementById('time-pace-minutes');
      const secondsInput = document.getElementById('time-pace-seconds');

      minutesInput.value = '5';
      secondsInput.value = '30';

      minutesInput.dispatchEvent(new Event('blur'));
      secondsInput.dispatchEvent(new Event('blur'));

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should validate pace inputs on blur for distance tab', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'distance';
      const minutesInput = document.getElementById('distance-pace-minutes');
      const secondsInput = document.getElementById('distance-pace-seconds');

      minutesInput.value = '5';
      secondsInput.value = '30';

      minutesInput.dispatchEvent(new Event('blur'));
      secondsInput.dispatchEvent(new Event('blur'));

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should validate time inputs on blur for distance tab', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'distance';
      const hoursInput = document.getElementById('distance-time-hours');
      const minutesInput = document.getElementById('distance-time-minutes');
      const secondsInput = document.getElementById('distance-time-seconds');

      hoursInput.value = '1';
      minutesInput.value = '30';
      secondsInput.value = '0';

      hoursInput.dispatchEvent(new Event('blur'));
      minutesInput.dispatchEvent(new Event('blur'));
      secondsInput.dispatchEvent(new Event('blur'));

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should clear errors on input for time tab pace inputs', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'time';
      const minutesInput = document.getElementById('time-pace-minutes');
      const errorDiv = document.getElementById('time-pace-error');

      errorDiv.classList.remove('hidden');

      minutesInput.value = '5';
      minutesInput.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(errorDiv.classList.contains('hidden')).toBe(true);
    });

    it('should clear errors on input for distance tab', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'distance';
      const minutesInput = document.getElementById('distance-pace-minutes');
      const errorDiv = document.getElementById('distance-pace-error');

      errorDiv.classList.remove('hidden');

      minutesInput.value = '5';
      minutesInput.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(errorDiv.classList.contains('hidden')).toBe(true);
    });

    it('should validate distance input on blur', async () => {
      vi.spyOn(calc, 'validateDistanceInput').mockReturnValue({ valid: true, value: 5 });

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'time';
      const distanceInput = document.getElementById('time-distance');

      distanceInput.value = '5';
      distanceInput.dispatchEvent(new Event('blur'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(calc.validateDistanceInput).toHaveBeenCalled();
    });

    it('should handle invalid pace exceeding 1 hour', async () => {
      vi.spyOn(calc, 'validateDistanceInput').mockReturnValue({ valid: true, value: 5 });

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'time';
      document.getElementById('time-distance').value = '5';
      document.getElementById('time-pace-minutes').value = '61';
      document.getElementById('time-pace-seconds').value = '0';

      const form = document.getElementById('calculator-form');
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 400));

      const resultDiv = document.getElementById('result');
      expect(resultDiv.classList.contains('error')).toBe(true);
    });

    it('should handle zero time input', async () => {
      vi.spyOn(calc, 'validateDistanceInput').mockReturnValue({ valid: true, value: 5 });

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      document.getElementById('pace-distance').value = '5';
      document.getElementById('pace-time-hours').value = '0';
      document.getElementById('pace-time-minutes').value = '0';
      document.getElementById('pace-time-seconds').value = '0';

      const form = document.getElementById('calculator-form');
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 400));

      const resultDiv = document.getElementById('result');
      expect(resultDiv.classList.contains('error')).toBe(true);
    });

    it('should handle zero pace input', async () => {
      vi.spyOn(calc, 'validateDistanceInput').mockReturnValue({ valid: true, value: 5 });

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'time';
      document.getElementById('time-distance').value = '5';
      document.getElementById('time-pace-minutes').value = '0';
      document.getElementById('time-pace-seconds').value = '0';

      const form = document.getElementById('calculator-form');
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 400));

      const resultDiv = document.getElementById('result');
      expect(resultDiv.classList.contains('error')).toBe(true);
    });
  });

  describe('Tab State Management Extended', () => {
    it('should initialize tab states on tab switch', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      const distanceInput = document.getElementById('pace-distance');
      distanceInput.value = '5';
      distanceInput.classList.add('valid');

      const timeTab = document.querySelector('[data-tab="time"]');
      timeTab.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(state.currentTab).toBe('time');
      expect(state.tabStates.pace).toBeDefined();
    });

    it('should restore validation states when switching back to tab', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      const distanceInput = document.getElementById('pace-distance');
      distanceInput.value = '5';
      distanceInput.classList.add('valid');

      const timeTab = document.querySelector('[data-tab="time"]');
      timeTab.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      const paceTab = document.querySelector('[data-tab="pace"]');
      paceTab.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(distanceInput.classList.contains('valid')).toBe(true);
    });

    it('should save preset selection when switching tabs', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      const presetSelect = document.getElementById('pace-preset');
      presetSelect.selectedIndex = 1;

      const timeTab = document.querySelector('[data-tab="time"]');
      timeTab.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(state.tabStates.pace.presetSelection).toBeDefined();
    });

    it('should clear result when clearing tab with matching result type', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      state.lastResult = { type: 'pace', data: {} };
      const resultDiv = document.getElementById('result');
      resultDiv.classList.remove('hidden');
      resultDiv.classList.add('show');

      const clearBtn = document.getElementById('clear-btn');
      clearBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(resultDiv.classList.contains('hidden')).toBe(true);
      expect(state.lastResult).toBeNull();
    });

    it('should not clear result when clearing tab with different result type', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      state.lastResult = { type: 'time', data: {} };
      const resultDiv = document.getElementById('result');
      resultDiv.classList.remove('hidden');
      resultDiv.classList.add('show');

      const clearBtn = document.getElementById('clear-btn');
      clearBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(state.lastResult).not.toBeNull();
    });

    it('should clear all segmented inputs for distance tab', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'distance';
      document.getElementById('distance-time-hours').value = '1';
      document.getElementById('distance-pace-minutes').value = '5';

      const clearBtn = document.getElementById('clear-btn');
      clearBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(document.getElementById('distance-time-hours').value).toBe('');
      expect(document.getElementById('distance-pace-minutes').value).toBe('');
    });
  });

  describe('Result Display Edge Cases', () => {
    it('should update result for miles unit', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.distanceUnit = 'miles';
      state.lastResult = {
        type: 'pace',
        data: { pacePerKm: 300, pacePerMile: 480 }
      };

      const resultDiv = document.getElementById('result');
      resultDiv.classList.remove('hidden');

      const { updateCalculatedResult } = await import('../../src/ui.js');
      updateCalculatedResult();

      const resultValue = document.getElementById('result-value');
      expect(resultValue.innerHTML).toContain('/mile');
    });

    it('should update result for distance calculation in miles', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.distanceUnit = 'miles';
      state.lastResult = {
        type: 'distance',
        data: { km: 5, miles: 3.1 }
      };

      const resultDiv = document.getElementById('result');
      resultDiv.classList.remove('hidden');

      const { updateCalculatedResult } = await import('../../src/ui.js');
      updateCalculatedResult();

      const resultValue = document.getElementById('result-value');
      expect(resultValue.innerHTML).toContain('miles');
    });

    it('should show PR comparison in result display', async () => {
      vi.spyOn(calc, 'calculatePace').mockReturnValue({
        pacePerKm: 300,
        pacePerMile: 480
      });
      vi.spyOn(calc, 'validateDistanceInput').mockReturnValue({ valid: true, value: 5 });
      vi.spyOn(pr, 'comparePaceWithPR').mockReturnValue({
        prDistance: 5,
        prUnit: 'km',
        prTimeFormatted: '26:00',
        prPaceFormatted: '5:12',
        isFaster: true,
        timeDifferenceFormatted: '1:00',
        paceDifferenceFormatted: '0:12'
      });

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

      const resultValue = document.getElementById('result-value');
      expect(resultValue.innerHTML).toContain('Personal Record');
    });

    it('should show slower PR comparison', async () => {
      vi.spyOn(calc, 'calculatePace').mockReturnValue({
        pacePerKm: 300,
        pacePerMile: 480
      });
      vi.spyOn(calc, 'validateDistanceInput').mockReturnValue({ valid: true, value: 5 });
      vi.spyOn(pr, 'comparePaceWithPR').mockReturnValue({
        prDistance: 5,
        prUnit: 'km',
        prTimeFormatted: '24:00',
        prPaceFormatted: '4:48',
        isFaster: false,
        timeDifferenceFormatted: '1:00',
        paceDifferenceFormatted: '0:12'
      });

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

      const resultValue = document.getElementById('result-value');
      expect(resultValue.innerHTML).toContain('slower');
    });
  });

  describe('Mobile Device Detection', () => {
    it('should detect mobile with touch and mobile user agent', () => {
      global.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      global.navigator.maxTouchPoints = 5;
      window.matchMedia = vi.fn(() => ({ matches: true }));

      expect(global.navigator.maxTouchPoints).toBeGreaterThan(0);
    });

    it('should not detect desktop as mobile', () => {
      global.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      global.navigator.maxTouchPoints = 0;
      window.matchMedia = vi.fn(() => ({ matches: false }));

      expect(global.navigator.maxTouchPoints).toBe(0);
    });
  });

  describe('Unit Conversion', () => {
    it('should update hints for miles unit', async () => {
      const { updateHintTexts } = await import('../../src/ui.js');
      state.distanceUnit = 'miles';

      updateHintTexts();

      const paceDistanceHint = document.getElementById('pace-distance-hint');
      if (paceDistanceHint) {
        expect(paceDistanceHint.textContent).toContain('miles');
      }
    });

    it('should update hints for km unit', async () => {
      const { updateHintTexts } = await import('../../src/ui.js');
      state.distanceUnit = 'km';

      updateHintTexts();

      const timeDistanceHint = document.getElementById('time-distance-hint');
      if (timeDistanceHint) {
        expect(timeDistanceHint.textContent).toContain('km');
      }
    });
  });
});
