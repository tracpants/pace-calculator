import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSplitsAccordion, generateRaceSplits, setupSplitsAccordion } from '../../src/splits.js';
import { state } from '../../src/state.js';

describe('Race Splits', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    state.currentTab = 'pace';
    state.distanceUnit = 'km';
    state.lastResult = null;
  });

  describe('generateRaceSplits', () => {
    it('should generate splits for pace calculation type', () => {
      document.body.innerHTML = '<input id="pace-distance" value="5" />';
      state.currentTab = 'pace';
      state.distanceUnit = 'km';
      state.lastResult = { type: 'pace', data: { pacePerKm: 300, pacePerMile: 483 } };

      const data = generateRaceSplits();

      expect(data).toBeTruthy();
      expect(data.splits).toHaveLength(5);
      expect(data.totalDistance).toBe(5);
      expect(data.unit).toBe('km');
      expect(data.pacePerUnit).toBe(300);
    });

    it('should generate splits for pace calculation in miles', () => {
      document.body.innerHTML = '<input id="pace-distance" value="3.1" />';
      state.currentTab = 'pace';
      state.distanceUnit = 'miles';
      state.lastResult = { type: 'pace', data: { pacePerKm: 300, pacePerMile: 483 } };

      const data = generateRaceSplits();

      expect(data).toBeTruthy();
      expect(data.splits).toHaveLength(4);
      expect(data.totalDistance).toBe(3.1);
      expect(data.unit).toBe('miles');
      expect(data.pacePerUnit).toBe(483);
    });

    it('should generate splits for time calculation type', () => {
      document.body.innerHTML = `
        <input id="time-distance" value="10" />
        <input id="time-pace-minutes" value="5" />
        <input id="time-pace-seconds" value="30" />
      `;
      state.currentTab = 'time';
      state.distanceUnit = 'km';
      state.lastResult = { type: 'time', data: { totalTime: 3300 } };

      const data = generateRaceSplits();

      expect(data).toBeTruthy();
      expect(data.splits).toHaveLength(10);
      expect(data.totalDistance).toBe(10);
      expect(data.pacePerUnit).toBe(330);
    });

    it('should generate splits for distance calculation type', () => {
      document.body.innerHTML = `
        <input id="distance-pace-minutes" value="5" />
        <input id="distance-pace-seconds" value="0" />
      `;
      state.currentTab = 'distance';
      state.distanceUnit = 'km';
      state.lastResult = { type: 'distance', data: { km: 8.5, miles: 5.28 } };

      const data = generateRaceSplits();

      expect(data).toBeTruthy();
      expect(data.splits).toHaveLength(9);
      expect(data.totalDistance).toBe(8.5);
      expect(data.pacePerUnit).toBe(300);
    });

    it('should include finish split for partial distances', () => {
      document.body.innerHTML = '<input id="pace-distance" value="5.5" />';
      state.currentTab = 'pace';
      state.distanceUnit = 'km';
      state.lastResult = { type: 'pace', data: { pacePerKm: 300, pacePerMile: 483 } };

      const data = generateRaceSplits();

      expect(data.splits).toHaveLength(6);
      const finishSplit = data.splits[data.splits.length - 1];
      expect(finishSplit.isFinish).toBe(true);
      expect(finishSplit.distance).toBe(5.5);
    });

    it('should not include finish split for whole distances', () => {
      document.body.innerHTML = '<input id="pace-distance" value="10" />';
      state.currentTab = 'pace';
      state.distanceUnit = 'km';
      state.lastResult = { type: 'pace', data: { pacePerKm: 300, pacePerMile: 483 } };

      const data = generateRaceSplits();

      expect(data.splits).toHaveLength(10);
      const lastSplit = data.splits[data.splits.length - 1];
      expect(lastSplit.isFinish).toBeUndefined();
    });

    it('should return null if no lastResult', () => {
      document.body.innerHTML = '<input id="pace-distance" value="5" />';
      state.lastResult = null;

      const data = generateRaceSplits();
      expect(data).toBeNull();
    });

    it('should return null if distance is too small', () => {
      document.body.innerHTML = '<input id="pace-distance" value="0.4" />';
      state.currentTab = 'pace';
      state.lastResult = { type: 'pace', data: { pacePerKm: 300, pacePerMile: 483 } };

      const data = generateRaceSplits();
      expect(data).toBeNull();
    });

    it('should return null if distance input not found', () => {
      state.currentTab = 'pace';
      state.lastResult = { type: 'pace', data: { pacePerKm: 300, pacePerMile: 483 } };

      const data = generateRaceSplits();
      expect(data).toBeNull();
    });

    it('should return null if distance is NaN', () => {
      document.body.innerHTML = '<input id="pace-distance" value="invalid" />';
      state.currentTab = 'pace';
      state.lastResult = { type: 'pace', data: { pacePerKm: 300, pacePerMile: 483 } };

      const data = generateRaceSplits();
      expect(data).toBeNull();
    });

    it('should calculate cumulative times correctly', () => {
      document.body.innerHTML = '<input id="pace-distance" value="3" />';
      state.currentTab = 'pace';
      state.distanceUnit = 'km';
      state.lastResult = { type: 'pace', data: { pacePerKm: 300, pacePerMile: 483 } };

      const data = generateRaceSplits();

      expect(data.splits[0].timeSeconds).toBe(300);
      expect(data.splits[1].timeSeconds).toBe(600);
      expect(data.splits[2].timeSeconds).toBe(900);
    });

    it('should handle marathon distance', () => {
      document.body.innerHTML = '<input id="pace-distance" value="42.195" />';
      state.currentTab = 'pace';
      state.distanceUnit = 'km';
      state.lastResult = { type: 'pace', data: { pacePerKm: 300, pacePerMile: 483 } };

      const data = generateRaceSplits();

      expect(data.splits).toHaveLength(43);
      expect(data.totalDistance).toBe(42.195);

      const finishSplit = data.splits[data.splits.length - 1];
      expect(finishSplit.isFinish).toBe(true);
    });

    it('should handle missing pace inputs for time type', () => {
      document.body.innerHTML = '<input id="time-distance" value="10" />';
      state.currentTab = 'time';
      state.lastResult = { type: 'time', data: { totalTime: 3300 } };

      const data = generateRaceSplits();
      expect(data).toBeNull();
    });
  });

  describe('createSplitsAccordion', () => {
    it('should create HTML for splits accordion', () => {
      document.body.innerHTML = '<input id="pace-distance" value="5" />';
      state.currentTab = 'pace';
      state.distanceUnit = 'km';
      state.lastResult = { type: 'pace', data: { pacePerKm: 300, pacePerMile: 0 } };

      const html = createSplitsAccordion();

      expect(html).toContain('Race Splits');
      expect(html).toContain('splits-toggle');
      expect(html).toContain('splits-content');
      expect(html).toContain('splits-chevron');
    });

    it('should include all split rows in HTML', () => {
      document.body.innerHTML = '<input id="pace-distance" value="5" />';
      state.currentTab = 'pace';
      state.distanceUnit = 'km';
      state.lastResult = { type: 'pace', data: { pacePerKm: 300, pacePerMile: 0 } };

      const html = createSplitsAccordion();
      const container = document.createElement('div');
      container.innerHTML = html;

      const rows = container.querySelectorAll('.splits-row');
      expect(rows.length).toBe(5);
    });

    it('should mark finish split with special styling', () => {
      document.body.innerHTML = '<input id="pace-distance" value="5.5" />';
      state.currentTab = 'pace';
      state.distanceUnit = 'km';
      state.lastResult = { type: 'pace', data: { pacePerKm: 300, pacePerMile: 0 } };

      const html = createSplitsAccordion();

      expect(html).toContain('Finish (5.5 km)');
      expect(html).toContain('font-semibold border-t');
    });

    it('should return empty string if no splits data', () => {
      state.lastResult = null;

      const html = createSplitsAccordion();
      expect(html).toBe('');
    });

    it('should display average pace', () => {
      document.body.innerHTML = '<input id="pace-distance" value="5" />';
      state.currentTab = 'pace';
      state.distanceUnit = 'km';
      state.lastResult = { type: 'pace', data: { pacePerKm: 300, pacePerMile: 0 } };

      const html = createSplitsAccordion();

      expect(html).toContain('Average Pace:');
    });

    it('should include accessibility attributes', () => {
      document.body.innerHTML = '<input id="pace-distance" value="5" />';
      state.currentTab = 'pace';
      state.distanceUnit = 'km';
      state.lastResult = { type: 'pace', data: { pacePerKm: 300, pacePerMile: 0 } };

      const html = createSplitsAccordion();

      expect(html).toContain('aria-expanded="false"');
      expect(html).toContain('aria-controls="splits-content"');
      expect(html).toContain('aria-hidden="true"');
    });
  });

  describe('setupSplitsAccordion', () => {
    it('should set up accordion toggle behavior', () => {
      document.body.innerHTML = `
        <div>
          <button id="splits-toggle" aria-expanded="false"></button>
          <div id="splits-content" class="hidden" aria-hidden="true"></div>
          <svg id="splits-chevron"></svg>
        </div>
      `;

      setupSplitsAccordion();

      const toggle = document.getElementById('splits-toggle');
      const content = document.getElementById('splits-content');
      const chevron = document.getElementById('splits-chevron');

      toggle.click();

      expect(content.classList.contains('hidden')).toBe(false);
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(content.getAttribute('aria-hidden')).toBe('false');
      expect(chevron.style.transform).toBe('rotate(180deg)');
    });

    it('should collapse accordion when clicked again', () => {
      document.body.innerHTML = `
        <div>
          <button id="splits-toggle" aria-expanded="false"></button>
          <div id="splits-content" class="hidden" aria-hidden="true"></div>
          <svg id="splits-chevron"></svg>
        </div>
      `;

      setupSplitsAccordion();

      const toggle = document.getElementById('splits-toggle');
      const content = document.getElementById('splits-content');
      const chevron = document.getElementById('splits-chevron');

      toggle.click();
      toggle.click();

      expect(content.classList.contains('hidden')).toBe(true);
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(content.getAttribute('aria-hidden')).toBe('true');
      expect(chevron.style.transform).toBe('rotate(0deg)');
    });

    it('should handle missing elements gracefully', () => {
      document.body.innerHTML = '<div></div>';

      expect(() => setupSplitsAccordion()).not.toThrow();
    });

    it('should call scroll function when expanding', async () => {
      document.body.innerHTML = `
        <div>
          <button id="splits-toggle" aria-expanded="false"></button>
          <div id="splits-content" class="hidden" aria-hidden="true"></div>
          <svg id="splits-chevron"></svg>
        </div>
      `;

      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

      setupSplitsAccordion();

      const toggle = document.getElementById('splits-toggle');
      toggle.click();

      await new Promise(resolve => setTimeout(resolve, 150));

      scrollToSpy.mockRestore();
    });
  });
});
