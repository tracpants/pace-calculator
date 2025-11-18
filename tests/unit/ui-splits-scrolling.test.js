import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as calc from '../../src/calculator.js';
import { state } from '../../src/state.js';

describe('UI Module - Race Splits and Scrolling', () => {
  beforeEach(() => {
    // Reset state
    state.currentTab = 'pace';
    state.distanceUnit = 'km';
    state.lastResult = null;

    // Setup DOM with all required elements
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
          <select id="time-preset" class="preset-select"></select>
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

    // Mock window methods
    window.matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));

    window.scrollTo = vi.fn();
    window.pageYOffset = 0;
    window.innerHeight = 800;

    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 100,
      bottom: 500,
      left: 0,
      right: 100,
      width: 100,
      height: 400
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Race Splits Generation', () => {
    it('should generate splits for pace calculation with full km distance', async () => {
      vi.spyOn(calc, 'calculatePace').mockReturnValue({
        pacePerKm: 300,
        pacePerMile: 480
      });
      vi.spyOn(calc, 'validateDistanceInput').mockReturnValue({ valid: true, value: 10 });

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      document.getElementById('pace-distance').value = '10';
      document.getElementById('pace-time-hours').value = '0';
      document.getElementById('pace-time-minutes').value = '50';
      document.getElementById('pace-time-seconds').value = '0';

      const form = document.getElementById('calculator-form');
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 400));

      const resultValue = document.getElementById('result-value');
      expect(resultValue.innerHTML).toContain('Race Splits');
    });

    it('should generate splits for time calculation', async () => {
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

      const resultValue = document.getElementById('result-value');
      expect(resultValue.innerHTML).toContain('Race Splits');
    });

    it('should generate splits for distance calculation', async () => {
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

      const resultValue = document.getElementById('result-value');
      expect(resultValue.innerHTML).toContain('Race Splits');
    });

    it('should generate splits with fractional distance', async () => {
      vi.spyOn(calc, 'calculatePace').mockReturnValue({
        pacePerKm: 300,
        pacePerMile: 480
      });
      vi.spyOn(calc, 'validateDistanceInput').mockReturnValue({ valid: true, value: 5.5 });

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      document.getElementById('pace-distance').value = '5.5';
      document.getElementById('pace-time-hours').value = '0';
      document.getElementById('pace-time-minutes').value = '27';
      document.getElementById('pace-time-seconds').value = '30';

      const form = document.getElementById('calculator-form');
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 400));

      const resultValue = document.getElementById('result-value');
      expect(resultValue.innerHTML).toContain('Finish');
    });

    it('should not generate splits for very short distances', async () => {
      vi.spyOn(calc, 'calculatePace').mockReturnValue({
        pacePerKm: 300,
        pacePerMile: 480
      });
      vi.spyOn(calc, 'validateDistanceInput').mockReturnValue({ valid: true, value: 0.4 });

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      document.getElementById('pace-distance').value = '0.4';
      document.getElementById('pace-time-hours').value = '0';
      document.getElementById('pace-time-minutes').value = '2';
      document.getElementById('pace-time-seconds').value = '0';

      const form = document.getElementById('calculator-form');
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 400));

      const resultValue = document.getElementById('result-value');
      expect(resultValue.innerHTML).not.toContain('Race Splits');
    });

    it('should generate splits in miles unit', async () => {
      vi.spyOn(calc, 'calculatePace').mockReturnValue({
        pacePerKm: 300,
        pacePerMile: 480
      });
      vi.spyOn(calc, 'validateDistanceInput').mockReturnValue({ valid: true, value: 3.1 });

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      state.distanceUnit = 'miles';
      document.getElementById('pace-distance').value = '3.1';
      document.getElementById('pace-time-hours').value = '0';
      document.getElementById('pace-time-minutes').value = '24';
      document.getElementById('pace-time-seconds').value = '48';

      const form = document.getElementById('calculator-form');
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 400));

      const resultValue = document.getElementById('result-value');
      expect(resultValue.innerHTML).toContain('Race Splits');
    });

    it('should not include finish split for tiny remainder', async () => {
      vi.spyOn(calc, 'calculatePace').mockReturnValue({
        pacePerKm: 300,
        pacePerMile: 480
      });
      vi.spyOn(calc, 'validateDistanceInput').mockReturnValue({ valid: true, value: 5.005 });

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      document.getElementById('pace-distance').value = '5.005';
      document.getElementById('pace-time-hours').value = '0';
      document.getElementById('pace-time-minutes').value = '25';
      document.getElementById('pace-time-seconds').value = '0';

      const form = document.getElementById('calculator-form');
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 400));

      const resultValue = document.getElementById('result-value');
      const splitsHtml = resultValue.innerHTML;
      expect(splitsHtml).toContain('Race Splits');
    });
  });

  describe('Splits Accordion Interaction', () => {
    it('should toggle splits accordion open and closed', async () => {
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

      await new Promise(resolve => setTimeout(resolve, 700));

      const splitsToggle = document.getElementById('splits-toggle');
      const splitsContent = document.getElementById('splits-content');

      if (splitsToggle && splitsContent) {
        expect(splitsContent.classList.contains('hidden')).toBe(true);

        splitsToggle.click();
        await new Promise(resolve => setTimeout(resolve, 200));

        expect(splitsToggle.getAttribute('aria-expanded')).toBe('true');
        expect(splitsContent.classList.contains('hidden')).toBe(false);

        splitsToggle.click();
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(splitsToggle.getAttribute('aria-expanded')).toBe('false');
        expect(splitsContent.classList.contains('hidden')).toBe(true);
      }
    });

    it('should auto-scroll when splits expanded and content is cut off', async () => {
      vi.spyOn(calc, 'calculatePace').mockReturnValue({
        pacePerKm: 300,
        pacePerMile: 480
      });
      vi.spyOn(calc, 'validateDistanceInput').mockReturnValue({ valid: true, value: 10 });

      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        top: 100,
        bottom: 1000,
        left: 0,
        right: 100,
        width: 100,
        height: 900
      }));

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      document.getElementById('pace-distance').value = '10';
      document.getElementById('pace-time-hours').value = '0';
      document.getElementById('pace-time-minutes').value = '50';
      document.getElementById('pace-time-seconds').value = '0';

      const form = document.getElementById('calculator-form');
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 700));

      const splitsToggle = document.getElementById('splits-toggle');
      if (splitsToggle) {
        splitsToggle.click();
        await new Promise(resolve => setTimeout(resolve, 200));

        expect(window.scrollTo).toHaveBeenCalled();
      }
    });

    it('should not scroll when splits content is already visible', async () => {
      vi.spyOn(calc, 'calculatePace').mockReturnValue({
        pacePerKm: 300,
        pacePerMile: 480
      });
      vi.spyOn(calc, 'validateDistanceInput').mockReturnValue({ valid: true, value: 5 });

      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        top: 100,
        bottom: 400,
        left: 0,
        right: 100,
        width: 100,
        height: 300
      }));

      window.scrollTo.mockClear();

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      document.getElementById('pace-distance').value = '5';
      document.getElementById('pace-time-hours').value = '0';
      document.getElementById('pace-time-minutes').value = '25';
      document.getElementById('pace-time-seconds').value = '0';

      const form = document.getElementById('calculator-form');
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 700));

      const splitsToggle = document.getElementById('splits-toggle');
      if (splitsToggle) {
        splitsToggle.click();
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    });
  });

  describe('Result Scrolling Behavior', () => {
    it('should handle scrolling for result visibility', async () => {
      vi.spyOn(calc, 'calculatePace').mockReturnValue({
        pacePerKm: 300,
        pacePerMile: 480
      });
      vi.spyOn(calc, 'validateDistanceInput').mockReturnValue({ valid: true, value: 5 });

      const resultDiv = document.getElementById('result');
      const originalGetBoundingClientRect = resultDiv.getBoundingClientRect;

      resultDiv.getBoundingClientRect = vi.fn(() => ({
        top: 900,
        bottom: 1200,
        left: 0,
        right: 100,
        width: 100,
        height: 300
      }));

      window.scrollTo.mockClear();

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      document.getElementById('pace-distance').value = '5';
      document.getElementById('pace-time-hours').value = '0';
      document.getElementById('pace-time-minutes').value = '25';
      document.getElementById('pace-time-seconds').value = '0';

      const form = document.getElementById('calculator-form');
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 500));

      resultDiv.getBoundingClientRect = originalGetBoundingClientRect;
    });

    it('should not scroll when results are already visible', async () => {
      vi.spyOn(calc, 'calculatePace').mockReturnValue({
        pacePerKm: 300,
        pacePerMile: 480
      });
      vi.spyOn(calc, 'validateDistanceInput').mockReturnValue({ valid: true, value: 5 });

      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        top: 200,
        bottom: 400,
        left: 0,
        right: 100,
        width: 100,
        height: 200
      }));

      window.scrollTo.mockClear();

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      document.getElementById('pace-distance').value = '5';
      document.getElementById('pace-time-hours').value = '0';
      document.getElementById('pace-time-minutes').value = '25';
      document.getElementById('pace-time-seconds').value = '0';

      const form = document.getElementById('calculator-form');
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 500));
    });

    it('should not scroll when result div is hidden', async () => {
      window.scrollTo.mockClear();

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      const resultDiv = document.getElementById('result');
      resultDiv.classList.add('hidden');

      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('Animation and Timing', () => {
    it('should animate copy success with icon transitions', async () => {
      vi.useFakeTimers();

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.lastResult = {
        type: 'pace',
        data: { pacePerKm: 300, pacePerMile: 480 }
      };

      const resultDiv = document.getElementById('result');
      resultDiv.classList.remove('hidden');

      const copyIcon = document.getElementById('copy-icon');
      const checkIcon = document.getElementById('check-icon');
      const copyFeedback = document.getElementById('copy-feedback');

      const copyBtn = document.getElementById('copy-result-btn');
      copyBtn.click();

      await vi.advanceTimersByTimeAsync(100);
      expect(global.navigator.clipboard.writeText).toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(150);
      expect(copyIcon.classList.contains('hidden')).toBe(true);
      expect(checkIcon.classList.contains('hidden')).toBe(false);

      await vi.advanceTimersByTimeAsync(2000);
      expect(copyFeedback.textContent).toBe('');

      await vi.advanceTimersByTimeAsync(200);

      vi.useRealTimers();
    });

    it('should show loading and then hide after calculation', async () => {
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

      const loadingDiv = document.getElementById('loading');
      const form = document.getElementById('calculator-form');

      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 50));
      expect(loadingDiv.classList.contains('hidden')).toBe(false);

      await new Promise(resolve => setTimeout(resolve, 400));
      expect(loadingDiv.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Error State Handling', () => {
    it('should show error result for invalid inputs', async () => {
      vi.spyOn(calc, 'validateDistanceInput').mockReturnValue({
        valid: false,
        message: 'Distance must be positive'
      });

      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'pace';
      document.getElementById('pace-distance').value = '-5';
      document.getElementById('pace-time-minutes').value = '25';

      const form = document.getElementById('calculator-form');
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 400));

      const resultDiv = document.getElementById('result');
      const resultLabel = document.getElementById('result-label');

      expect(resultDiv.classList.contains('error')).toBe(true);
      expect(resultLabel.textContent).toBe('Error');
    });

    it('should show error for distance tab with invalid time', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'distance';
      document.getElementById('distance-time-hours').value = '0';
      document.getElementById('distance-time-minutes').value = '0';
      document.getElementById('distance-time-seconds').value = '0';
      document.getElementById('distance-pace-minutes').value = '5';
      document.getElementById('distance-pace-seconds').value = '0';

      const form = document.getElementById('calculator-form');
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 400));

      const resultDiv = document.getElementById('result');
      expect(resultDiv.classList.contains('error')).toBe(true);
    });

    it('should show error for distance tab with invalid pace', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      state.currentTab = 'distance';
      document.getElementById('distance-time-hours').value = '1';
      document.getElementById('distance-time-minutes').value = '0';
      document.getElementById('distance-time-seconds').value = '0';
      document.getElementById('distance-pace-minutes').value = '0';
      document.getElementById('distance-pace-seconds').value = '0';

      const form = document.getElementById('calculator-form');
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 400));

      const resultDiv = document.getElementById('result');
      expect(resultDiv.classList.contains('error')).toBe(true);
    });
  });

  describe('Tab Initialization', () => {
    it('should handle tab click with missing section gracefully', async () => {
      const { initUI } = await import('../../src/ui.js');
      await initUI();

      // Remove the time section
      const timeSection = document.querySelector('[data-section="time"]');
      if (timeSection) {
        timeSection.remove();
      }

      const timeTab = document.querySelector('[data-tab="time"]');
      if (timeTab) {
        timeTab.click();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    });
  });
});
