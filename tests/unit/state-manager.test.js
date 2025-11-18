import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { stateManager } from '../../src/state-manager.js';

describe('StateManager', () => {
	beforeEach(() => {
		stateManager.resetAll();
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	describe('Initialization', () => {
		it('should initialize with default state values', () => {
			expect(stateManager.get('app.currentTab')).toBe('pace');
			expect(stateManager.get('app.lastResult')).toBeNull();
			expect(stateManager.get('settings.distanceUnit')).toBe('km');
			expect(stateManager.get('settings.theme')).toBe('system');
			expect(stateManager.get('settings.defaultDistance')).toBeNull();
			expect(stateManager.get('settings.accentColor')).toBe('indigo');
			expect(stateManager.get('touch.startX')).toBe(0);
			expect(stateManager.get('touch.startY')).toBe(0);
			expect(stateManager.get('touch.startTime')).toBe(0);
			expect(stateManager.get('touch.isTracking')).toBe(false);
			expect(stateManager.get('prManagement.editingPR')).toBeNull();
		});

		it('should initialize autoAdvance with Set and WeakMap', () => {
			const enabledInputs = stateManager.get('autoAdvance.enabledInputs');
			const previousValues = stateManager.get('autoAdvance.previousValues');
			expect(enabledInputs).toBeInstanceOf(Set);
			expect(previousValues).toBeInstanceOf(WeakMap);
		});

		it('should return full state with getState()', () => {
			const fullState = stateManager.getState();
			expect(fullState).toHaveProperty('app');
			expect(fullState).toHaveProperty('settings');
			expect(fullState).toHaveProperty('autoAdvance');
			expect(fullState).toHaveProperty('touch');
			expect(fullState).toHaveProperty('prManagement');
		});
	});

	describe('Get and Set', () => {
		it('should get and set app.currentTab', () => {
			stateManager.set('app.currentTab', 'time');
			expect(stateManager.get('app.currentTab')).toBe('time');
		});

		it('should get and set settings.distanceUnit', () => {
			stateManager.set('settings.distanceUnit', 'miles');
			expect(stateManager.get('settings.distanceUnit')).toBe('miles');
		});

		it('should get and set app.lastResult', () => {
			const result = { value: 42, unit: 'km', type: 'pace' };
			stateManager.set('app.lastResult', result);
			expect(stateManager.get('app.lastResult')).toEqual(result);
		});

		it('should get and set touch state', () => {
			stateManager.set('touch.startX', 100);
			stateManager.set('touch.startY', 200);
			stateManager.set('touch.startTime', 1234567890);
			stateManager.set('touch.isTracking', true);

			expect(stateManager.get('touch.startX')).toBe(100);
			expect(stateManager.get('touch.startY')).toBe(200);
			expect(stateManager.get('touch.startTime')).toBe(1234567890);
			expect(stateManager.get('touch.isTracking')).toBe(true);
		});

		it('should get and set prManagement.editingPR', () => {
			const editingPR = {
				distance: 5,
				unit: 'km',
				timeSeconds: 1200,
				dateSet: '2024-01-01',
				notes: 'Great run'
			};
			stateManager.set('prManagement.editingPR', editingPR);
			expect(stateManager.get('prManagement.editingPR')).toEqual(editingPR);
		});
	});

	describe('Validation', () => {
		it('should validate enum values for currentTab', () => {
			expect(() => stateManager.set('app.currentTab', 'pace')).not.toThrow();
			expect(() => stateManager.set('app.currentTab', 'time')).not.toThrow();
			expect(() => stateManager.set('app.currentTab', 'distance')).not.toThrow();
			expect(() => stateManager.set('app.currentTab', 'invalid')).toThrow();
		});

		it('should validate enum values for distanceUnit', () => {
			expect(() => stateManager.set('settings.distanceUnit', 'km')).not.toThrow();
			expect(() => stateManager.set('settings.distanceUnit', 'miles')).not.toThrow();
			expect(() => stateManager.set('settings.distanceUnit', 'meters')).toThrow();
		});

		it('should validate enum values for theme', () => {
			expect(() => stateManager.set('settings.theme', 'light')).not.toThrow();
			expect(() => stateManager.set('settings.theme', 'dark')).not.toThrow();
			expect(() => stateManager.set('settings.theme', 'system')).not.toThrow();
			expect(() => stateManager.set('settings.theme', 'custom')).toThrow();
		});

		it('should validate type for string fields', () => {
			// eslint-disable-next-line custom/no-hardcoded-colors
			expect(() => stateManager.set('settings.accentColor', 'blue')).not.toThrow();
			expect(() => stateManager.set('settings.accentColor', 123)).toThrow();
		});

		it('should validate type for number fields', () => {
			expect(() => stateManager.set('touch.startX', 100)).not.toThrow();
			expect(() => stateManager.set('touch.startX', '100')).toThrow();
		});

		it('should validate type for boolean fields', () => {
			expect(() => stateManager.set('touch.isTracking', true)).not.toThrow();
			expect(() => stateManager.set('touch.isTracking', 'true')).toThrow();
		});

		it('should allow null for nullable fields', () => {
			expect(() => stateManager.set('app.lastResult', null)).not.toThrow();
			expect(() => stateManager.set('settings.defaultDistance', null)).not.toThrow();
			expect(() => stateManager.set('prManagement.editingPR', null)).not.toThrow();
		});

		it('should reject null for non-nullable fields', () => {
			expect(() => stateManager.set('settings.distanceUnit', null)).toThrow();
			expect(() => stateManager.set('touch.isTracking', null)).toThrow();
		});

		it('should reject invalid paths', () => {
			expect(() => stateManager.set('invalid.path', 'value')).toThrow();
			expect(() => stateManager.set('app.invalid', 'value')).toThrow();
		});
	});

	describe('Update', () => {
		it('should update value using updater function', () => {
			stateManager.set('touch.startX', 100);
			stateManager.update('touch.startX', current => current + 50);
			expect(stateManager.get('touch.startX')).toBe(150);
		});

		it('should pass current value to updater', () => {
			stateManager.set('app.currentTab', 'pace');
			stateManager.update('app.currentTab', current => {
				expect(current).toBe('pace');
				return 'time';
			});
			expect(stateManager.get('app.currentTab')).toBe('time');
		});
	});

	describe('Subscribe/Unsubscribe', () => {
		it('should notify listeners when value changes', () => {
			const listener = vi.fn();
			stateManager.subscribe('app.currentTab', listener);

			stateManager.set('app.currentTab', 'time');

			expect(listener).toHaveBeenCalledWith('time', 'pace');
		});

		it('should notify multiple listeners', () => {
			const listener1 = vi.fn();
			const listener2 = vi.fn();

			stateManager.subscribe('app.currentTab', listener1);
			stateManager.subscribe('app.currentTab', listener2);

			stateManager.set('app.currentTab', 'distance');

			expect(listener1).toHaveBeenCalledWith('distance', 'pace');
			expect(listener2).toHaveBeenCalledWith('distance', 'pace');
		});

		it('should not notify after unsubscribe', () => {
			const listener = vi.fn();
			stateManager.subscribe('app.currentTab', listener);
			stateManager.unsubscribe('app.currentTab', listener);

			stateManager.set('app.currentTab', 'time');

			expect(listener).not.toHaveBeenCalled();
		});

		it('should return unsubscribe function', () => {
			const listener = vi.fn();
			const unsubscribe = stateManager.subscribe('app.currentTab', listener);

			unsubscribe();
			stateManager.set('app.currentTab', 'time');

			expect(listener).not.toHaveBeenCalled();
		});

		it('should not notify if value does not change', () => {
			const listener = vi.fn();
			stateManager.subscribe('app.currentTab', listener);

			stateManager.set('app.currentTab', 'pace');

			expect(listener).not.toHaveBeenCalled();
		});

		it('should handle errors in listeners gracefully', () => {
			const errorListener = vi.fn(() => {
				throw new Error('Listener error');
			});
			const successListener = vi.fn();

			stateManager.subscribe('app.currentTab', errorListener);
			stateManager.subscribe('app.currentTab', successListener);

			expect(() => stateManager.set('app.currentTab', 'time')).not.toThrow();
			expect(successListener).toHaveBeenCalled();
		});
	});

	describe('Persistence', () => {
		it('should persist distanceUnit to localStorage', () => {
			stateManager.set('settings.distanceUnit', 'miles');
			expect(localStorage.getItem('pace-calculator-settings-unit')).toBe('"miles"');
		});

		it('should persist theme to localStorage', () => {
			stateManager.set('settings.theme', 'dark');
			expect(localStorage.getItem('pace-calculator-settings-theme')).toBe('"dark"');
		});

		it('should persist defaultDistance to localStorage', () => {
			stateManager.set('settings.defaultDistance', '5k');
			expect(localStorage.getItem('pace-calculator-settings-default-distance')).toBe('"5k"');
		});

		it('should persist accentColor to localStorage', () => {
			// eslint-disable-next-line custom/no-hardcoded-colors
			stateManager.set('settings.accentColor', 'blue');
			// eslint-disable-next-line custom/no-hardcoded-colors
			expect(localStorage.getItem('pace-calculator-settings-accent-color')).toBe('"blue"');
		});

		it('should hydrate state from localStorage', () => {
			localStorage.setItem('pace-calculator-settings-unit', '"miles"');
			localStorage.setItem('pace-calculator-settings-theme', '"dark"');
			localStorage.setItem('pace-calculator-settings-default-distance', '"10k"');
			// eslint-disable-next-line custom/no-hardcoded-colors
			localStorage.setItem('pace-calculator-settings-accent-color', '"purple"');

			stateManager.hydrate();

			expect(stateManager.get('settings.distanceUnit')).toBe('miles');
			expect(stateManager.get('settings.theme')).toBe('dark');
			expect(stateManager.get('settings.defaultDistance')).toBe('10k');
			// eslint-disable-next-line custom/no-hardcoded-colors
			expect(stateManager.get('settings.accentColor')).toBe('purple');
		});

		it('should handle non-serializable values gracefully', () => {
			const enabledInputs = stateManager.get('autoAdvance.enabledInputs');
			enabledInputs.add('test-input');

			expect(() => stateManager.set('autoAdvance.enabledInputs', enabledInputs)).not.toThrow();

			const retrieved = stateManager.get('autoAdvance.enabledInputs');
			expect(retrieved.has('test-input')).toBe(true);
		});
	});

	describe('Reset', () => {
		it('should reset single field to default', () => {
			stateManager.set('app.currentTab', 'time');
			stateManager.reset('app.currentTab');
			expect(stateManager.get('app.currentTab')).toBe('pace');
		});

		it('should reset nullable field to null', () => {
			const result = { value: 42, unit: 'km' };
			stateManager.set('app.lastResult', result);
			stateManager.reset('app.lastResult');
			expect(stateManager.get('app.lastResult')).toBeNull();
		});

		it('should reset all state with resetAll', () => {
			stateManager.set('app.currentTab', 'distance');
			stateManager.set('settings.distanceUnit', 'miles');
			stateManager.set('touch.startX', 100);

			stateManager.resetAll();

			expect(stateManager.get('app.currentTab')).toBe('pace');
			expect(stateManager.get('settings.distanceUnit')).toBe('km');
			expect(stateManager.get('touch.startX')).toBe(0);
		});

		it('should notify listeners on reset', () => {
			const listener = vi.fn();
			stateManager.set('app.currentTab', 'time');
			stateManager.subscribe('app.currentTab', listener);

			stateManager.reset('app.currentTab');

			expect(listener).toHaveBeenCalledWith('pace', 'time');
		});
	});

	describe('Immutability', () => {
		it('should not mutate original state when getting', () => {
			const result = { value: 42, unit: 'km' };
			stateManager.set('app.lastResult', result);

			const retrieved = stateManager.get('app.lastResult');
			retrieved.value = 100;

			expect(stateManager.get('app.lastResult').value).toBe(42);
		});

		it('should return new state object from getState', () => {
			const state1 = stateManager.getState();
			const state2 = stateManager.getState();

			expect(state1).not.toBe(state2);
			expect(state1).toEqual(state2);
		});

		it('should handle nested object updates immutably', () => {
			const pr1 = { distance: 5, unit: 'km', timeSeconds: 1200 };
			stateManager.set('prManagement.editingPR', pr1);

			const pr2 = { distance: 10, unit: 'miles', timeSeconds: 2400 };
			stateManager.set('prManagement.editingPR', pr2);

			const retrieved = stateManager.get('prManagement.editingPR');
			expect(retrieved).toEqual(pr2);
			expect(retrieved).not.toBe(pr2);
		});
	});

	describe('AutoAdvance State', () => {
		it('should manage enabledInputs Set', () => {
			const enabledInputs = stateManager.get('autoAdvance.enabledInputs');
			enabledInputs.add('input-1');
			enabledInputs.add('input-2');
			stateManager.set('autoAdvance.enabledInputs', enabledInputs);

			const retrieved = stateManager.get('autoAdvance.enabledInputs');
			expect(retrieved.has('input-1')).toBe(true);
			expect(retrieved.has('input-2')).toBe(true);
			expect(retrieved.size).toBe(2);
		});

		it('should manage previousValues WeakMap', () => {
			const input1 = document.createElement('input');
			const input2 = document.createElement('input');

			const previousValues = stateManager.get('autoAdvance.previousValues');
			previousValues.set(input1, 'value1');
			previousValues.set(input2, 'value2');

			expect(previousValues.get(input1)).toBe('value1');
			expect(previousValues.get(input2)).toBe('value2');
		});
	});

	describe('Complex Scenarios', () => {
		it('should handle rapid state changes', () => {
			for (let i = 0; i < 100; i++) {
				stateManager.set('touch.startX', i);
			}
			expect(stateManager.get('touch.startX')).toBe(99);
		});

		it('should handle multiple subscriptions and updates', () => {
			const listeners = Array.from({ length: 10 }, () => vi.fn());
			listeners.forEach(listener => {
				stateManager.subscribe('app.currentTab', listener);
			});

			stateManager.set('app.currentTab', 'time');

			listeners.forEach(listener => {
				expect(listener).toHaveBeenCalledWith('time', 'pace');
			});
		});

		it('should maintain consistency across multiple state changes', () => {
			stateManager.set('app.currentTab', 'time');
			stateManager.set('settings.distanceUnit', 'miles');
			stateManager.set('touch.isTracking', true);
			stateManager.set('prManagement.editingPR', { distance: 5, unit: 'km', timeSeconds: 1200 });

			expect(stateManager.get('app.currentTab')).toBe('time');
			expect(stateManager.get('settings.distanceUnit')).toBe('miles');
			expect(stateManager.get('touch.isTracking')).toBe(true);
			expect(stateManager.get('prManagement.editingPR')).toEqual({ distance: 5, unit: 'km', timeSeconds: 1200 });
		});
	});
});
