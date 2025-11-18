import { describe, it, expect, beforeEach, vi } from 'vitest';
import { state, stateManager } from '../../src/state.js';

describe('State Management', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="calculator-form">
        <input id="pace-distance" name="pace-distance" value="5" />
        <input id="pace-minutes" name="pace-minutes" value="5" />
        <input id="time-distance" name="time-distance" value="10" />
      </form>
    `;
    localStorage.clear();
    stateManager.resetAll();
    state.currentTab = 'pace';
    state.distanceUnit = 'km';
    state.lastResult = null;
  });

  describe('Initial State', () => {
    it('should have default currentTab as pace', () => {
      expect(state.currentTab).toBe('pace');
    });

    it('should have default distanceUnit as km', () => {
      expect(state.distanceUnit).toBe('km');
    });

    it('should have lastResult as null initially', () => {
      expect(state.lastResult).toBeNull();
    });
  });

  describe('getFormData', () => {
    it('should return FormData from calculator form', () => {
      const formData = state.getFormData();
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get('pace-distance')).toBe('5');
      expect(formData.get('pace-minutes')).toBe('5');
    });

    it('should return empty FormData if form not found', () => {
      document.body.innerHTML = '';
      const formData = state.getFormData();
      expect(formData).toBeInstanceOf(FormData);
      expect(Array.from(formData.entries())).toHaveLength(0);
    });
  });

  describe('saveFormState', () => {
    it('should save form data to localStorage for current tab', () => {
      state.currentTab = 'pace';
      state.saveFormState();

      const saved = localStorage.getItem('pace-calc-form-pace');
      expect(saved).toBeTruthy();

      const data = JSON.parse(saved);
      expect(data['pace-distance']).toBe('5');
      expect(data['pace-minutes']).toBe('5');
    });

    it('should only save fields matching current tab', () => {
      state.currentTab = 'pace';
      state.saveFormState();

      const saved = JSON.parse(localStorage.getItem('pace-calc-form-pace'));
      expect(saved['pace-distance']).toBe('5');
      expect(saved['pace-minutes']).toBe('5');
      expect(saved['time-distance']).toBeUndefined();
    });

    it('should save form state for time tab', () => {
      state.currentTab = 'time';
      state.saveFormState();

      const saved = localStorage.getItem('pace-calc-form-time');
      expect(saved).toBeTruthy();

      const data = JSON.parse(saved);
      expect(data['time-distance']).toBe('10');
    });

    it('should not save if no matching fields', () => {
      state.currentTab = 'distance';
      state.saveFormState();

      const saved = localStorage.getItem('pace-calc-form-distance');
      expect(saved).toBeNull();
    });

    it('should handle form not found', () => {
      document.body.innerHTML = '';
      state.currentTab = 'pace';
      expect(() => state.saveFormState()).not.toThrow();
    });
  });

  describe('restoreFormState', () => {
    it('should restore saved form state', () => {
      const savedData = {
        'pace-distance': '42.195',
        'pace-minutes': '4'
      };
      localStorage.setItem('pace-calc-form-pace', JSON.stringify(savedData));

      state.restoreFormState('pace');

      expect(document.getElementById('pace-distance').value).toBe('42.195');
      expect(document.getElementById('pace-minutes').value).toBe('4');
    });

    it('should handle missing fields gracefully', () => {
      const savedData = {
        'pace-distance': '10',
        'nonexistent-field': '999'
      };
      localStorage.setItem('pace-calc-form-pace', JSON.stringify(savedData));

      expect(() => state.restoreFormState('pace')).not.toThrow();
      expect(document.getElementById('pace-distance').value).toBe('10');
    });

    it('should handle no saved state', () => {
      expect(() => state.restoreFormState('pace')).not.toThrow();
    });

    it('should handle corrupted JSON gracefully', () => {
      localStorage.setItem('pace-calc-form-pace', '{invalid json}');

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      state.restoreFormState('pace');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to restore form state:',
        expect.any(Error)
      );
      consoleWarnSpy.mockRestore();
    });

    it('should restore state for different tabs', () => {
      const timeData = {
        'time-distance': '21.0975'
      };
      localStorage.setItem('pace-calc-form-time', JSON.stringify(timeData));

      state.restoreFormState('time');

      expect(document.getElementById('time-distance').value).toBe('21.0975');
    });
  });

  describe('State Updates', () => {
    it('should allow updating currentTab', () => {
      state.currentTab = 'time';
      expect(state.currentTab).toBe('time');

      state.currentTab = 'distance';
      expect(state.currentTab).toBe('distance');
    });

    it('should allow updating distanceUnit', () => {
      state.distanceUnit = 'miles';
      expect(state.distanceUnit).toBe('miles');

      state.distanceUnit = 'km';
      expect(state.distanceUnit).toBe('km');
    });

    it('should allow updating lastResult', () => {
      const result = {
        type: 'pace',
        pacePerKm: 300,
        pacePerMile: 483
      };

      state.lastResult = result;
      expect(state.lastResult).toEqual(result);
      expect(state.lastResult.type).toBe('pace');
    });
  });
});
