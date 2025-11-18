import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { stateManager } from '../../src/state-manager.js';
import { initTouch, cleanupTouch } from '../../src/touch.js';

/* global TouchEvent */

describe('Touch Gestures Module', () => {
	beforeEach(() => {
		// Reset DOM
		document.body.innerHTML = '';

		// Reset state manager
		stateManager.resetAll();

		// Mock touch device
		Object.defineProperty(window, 'ontouchstart', {
			writable: true,
			configurable: true,
			value: {}
		});

		Object.defineProperty(navigator, 'maxTouchPoints', {
			writable: true,
			configurable: true,
			value: 5
		});
	});

	afterEach(() => {
		cleanupTouch();

		// Reset touch device mock
		Object.defineProperty(window, 'ontouchstart', {
			writable: true,
			configurable: true,
			value: undefined
		});
		Object.defineProperty(navigator, 'maxTouchPoints', {
			writable: true,
			configurable: true,
			value: 0
		});
	});

	describe('initTouch', () => {
		it('should add touch event listeners to app element', () => {
			document.body.innerHTML = `
				<div id="app"></div>
				<div role="tablist">
					<button data-tab="pace">Pace</button>
					<button data-tab="time">Time</button>
					<button data-tab="distance">Distance</button>
				</div>
			`;

			const app = document.getElementById('app');
			const addEventListenerSpy = vi.spyOn(app, 'addEventListener');

			initTouch();

			// Should add 3 event listeners
			expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), expect.any(Object));
			expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), expect.any(Object));
			expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function), expect.any(Object));
			expect(addEventListenerSpy).toHaveBeenCalledTimes(3);
		});

		it('should add swipe indicator to tablist', () => {
			document.body.innerHTML = `
				<div id="app"></div>
				<div role="tablist"></div>
			`;

			initTouch();

			const tablist = document.querySelector('[role="tablist"]');
			expect(tablist.getAttribute('data-swipe-enabled')).toBe('true');
			expect(tablist.title).toBe('Swipe left or right to change tabs');
		});

		it('should not initialize if no app element exists', () => {
			document.body.innerHTML = '<div></div>';

			// Should not throw
			expect(() => initTouch()).not.toThrow();
		});

		it('should work correctly when maxTouchPoints is 0', () => {
			// Set maxTouchPoints to 0 but keep ontouchstart (mimics desktop with touch events available)
			Object.defineProperty(navigator, 'maxTouchPoints', {
				writable: true,
				configurable: true,
				value: 0
			});

			document.body.innerHTML = `
				<div id="app"></div>
				<div role="tablist"></div>
			`;

			const app = document.getElementById('app');
			const addEventListenerSpy = vi.spyOn(app, 'addEventListener');

			initTouch();

			// Since 'ontouchstart' in window will still be true, listeners should be added
			// (isTouchDevice checks: 'ontouchstart' in window OR maxTouchPoints > 0)
			expect(addEventListenerSpy).toHaveBeenCalled();
		});

		it('should cleanup existing listeners before adding new ones', () => {
			document.body.innerHTML = '<div id="app"></div>';

			initTouch();
			initTouch(); // Call again

			// Should not throw and should still work
			expect(() => initTouch()).not.toThrow();
		});
	});

	describe('cleanupTouch', () => {
		it('should remove touch event listeners', () => {
			document.body.innerHTML = '<div id="app"></div>';

			const app = document.getElementById('app');
			const removeEventListenerSpy = vi.spyOn(app, 'removeEventListener');

			initTouch();
			cleanupTouch();

			// Should remove 3 event listeners
			expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
			expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
			expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
			expect(removeEventListenerSpy).toHaveBeenCalledTimes(3);
		});

		it('should reset touch state', () => {
			document.body.innerHTML = '<div id="app"></div>';

			// Set some touch state
			stateManager.set('touch.isTracking', true);
			stateManager.set('touch.startX', 100);
			stateManager.set('touch.startY', 200);
			stateManager.set('touch.startTime', Date.now());

			cleanupTouch();

			// State should be reset
			expect(stateManager.get('touch.isTracking')).toBe(false);
			expect(stateManager.get('touch.startX')).toBe(0);
			expect(stateManager.get('touch.startY')).toBe(0);
			expect(stateManager.get('touch.startTime')).toBe(0);
		});

		it('should handle cleanup when not initialized', () => {
			// Should not throw
			expect(() => cleanupTouch()).not.toThrow();
		});
	});

	describe('Touch Event Handling', () => {
		beforeEach(() => {
			document.body.innerHTML = `
				<div id="app"></div>
				<div role="tablist">
					<button data-tab="pace" class="tab-button active" role="tab">Pace</button>
					<button data-tab="time" class="tab-button" role="tab">Time</button>
					<button data-tab="distance" class="tab-button" role="tab">Distance</button>
				</div>
				<div data-section="pace"></div>
				<div data-section="time" class="hidden"></div>
				<div data-section="distance" class="hidden"></div>
			`;

			stateManager.set('app.currentTab', 'pace');
		});

		it('should track touch start coordinates', () => {
			const app = document.getElementById('app');
			initTouch();

			const touchStartEvent = new TouchEvent('touchstart', {
				touches: [{
					clientX: 150,
					clientY: 250
				}]
			});

			app.dispatchEvent(touchStartEvent);

			expect(stateManager.get('touch.startX')).toBe(150);
			expect(stateManager.get('touch.startY')).toBe(250);
			expect(stateManager.get('touch.isTracking')).toBe(true);
			expect(stateManager.get('touch.startTime')).toBeGreaterThan(0);
		});

		it('should detect right swipe and switch to next tab', () => {
			const app = document.getElementById('app');
			const timeTab = document.querySelector('[data-tab="time"]');
			const clickSpy = vi.spyOn(timeTab, 'click');

			initTouch();

			// Start touch
			const touchStartEvent = new TouchEvent('touchstart', {
				touches: [{
					clientX: 100,
					clientY: 200
				}]
			});
			app.dispatchEvent(touchStartEvent);

			// End touch (swipe right > 50px)
			const touchEndEvent = new TouchEvent('touchend', {
				changedTouches: [{
					clientX: 200, // 100px movement
					clientY: 205  // 5px vertical movement
				}]
			});
			app.dispatchEvent(touchEndEvent);

			// Should switch to time tab (next tab)
			expect(clickSpy).toHaveBeenCalled();
		});

		it('should detect left swipe and switch to previous tab', () => {
			const app = document.getElementById('app');
			const distanceTab = document.querySelector('[data-tab="distance"]');
			const clickSpy = vi.spyOn(distanceTab, 'click');

			// Set current tab to pace
			stateManager.set('app.currentTab', 'pace');

			initTouch();

			// Start touch
			const touchStartEvent = new TouchEvent('touchstart', {
				touches: [{
					clientX: 200,
					clientY: 200
				}]
			});
			app.dispatchEvent(touchStartEvent);

			// End touch (swipe left > 50px)
			const touchEndEvent = new TouchEvent('touchend', {
				changedTouches: [{
					clientX: 100, // -100px movement
					clientY: 205  // 5px vertical movement
				}]
			});
			app.dispatchEvent(touchEndEvent);

			// Should switch to distance tab (previous tab, wraps around)
			expect(clickSpy).toHaveBeenCalled();
		});

		it('should not switch tabs if swipe distance is too small', () => {
			const app = document.getElementById('app');
			const timeTab = document.querySelector('[data-tab="time"]');
			const clickSpy = vi.spyOn(timeTab, 'click');

			initTouch();

			// Start touch
			const touchStartEvent = new TouchEvent('touchstart', {
				touches: [{
					clientX: 100,
					clientY: 200
				}]
			});
			app.dispatchEvent(touchStartEvent);

			// End touch (only 30px movement, less than minDistance of 50px)
			const touchEndEvent = new TouchEvent('touchend', {
				changedTouches: [{
					clientX: 130,
					clientY: 205
				}]
			});
			app.dispatchEvent(touchEndEvent);

			// Should not switch tabs
			expect(clickSpy).not.toHaveBeenCalled();
		});

		it('should not switch tabs if vertical movement is too large', () => {
			const app = document.getElementById('app');
			const timeTab = document.querySelector('[data-tab="time"]');
			const clickSpy = vi.spyOn(timeTab, 'click');

			initTouch();

			// Start touch
			const touchStartEvent = new TouchEvent('touchstart', {
				touches: [{
					clientX: 100,
					clientY: 100
				}]
			});
			app.dispatchEvent(touchStartEvent);

			// End touch (100px horizontal but 150px vertical, exceeds maxVerticalDistance)
			const touchEndEvent = new TouchEvent('touchend', {
				changedTouches: [{
					clientX: 200,
					clientY: 250 // 150px vertical movement
				}]
			});
			app.dispatchEvent(touchEndEvent);

			// Should not switch tabs (likely vertical scroll)
			expect(clickSpy).not.toHaveBeenCalled();
		});

		it('should wrap around from last tab to first tab on right swipe', () => {
			const app = document.getElementById('app');
			const paceTab = document.querySelector('[data-tab="pace"]');
			const clickSpy = vi.spyOn(paceTab, 'click');

			// Set current tab to distance (last tab)
			stateManager.set('app.currentTab', 'distance');

			initTouch();

			// Swipe right
			app.dispatchEvent(new TouchEvent('touchstart', {
				touches: [{ clientX: 100, clientY: 200 }]
			}));

			app.dispatchEvent(new TouchEvent('touchend', {
				changedTouches: [{ clientX: 200, clientY: 205 }]
			}));

			// Should wrap to pace tab (first tab)
			expect(clickSpy).toHaveBeenCalled();
		});

		it('should wrap around from first tab to last tab on left swipe', () => {
			const app = document.getElementById('app');
			const distanceTab = document.querySelector('[data-tab="distance"]');
			const clickSpy = vi.spyOn(distanceTab, 'click');

			// Set current tab to pace (first tab)
			stateManager.set('app.currentTab', 'pace');

			initTouch();

			// Swipe left
			app.dispatchEvent(new TouchEvent('touchstart', {
				touches: [{ clientX: 200, clientY: 200 }]
			}));

			app.dispatchEvent(new TouchEvent('touchend', {
				changedTouches: [{ clientX: 100, clientY: 205 }]
			}));

			// Should wrap to distance tab (last tab)
			expect(clickSpy).toHaveBeenCalled();
		});
	});

	describe('Touch Move Prevention', () => {
		it('should prevent default on horizontal swipe during touchmove', () => {
			document.body.innerHTML = '<div id="app"></div>';

			const app = document.getElementById('app');
			initTouch();

			// Start touch
			stateManager.set('touch.isTracking', true);
			stateManager.set('touch.startX', 100);
			stateManager.set('touch.startY', 200);

			// Move horizontally
			const touchMoveEvent = new TouchEvent('touchmove', {
				touches: [{
					clientX: 120, // 20px horizontal
					clientY: 202  // 2px vertical
				}],
				cancelable: true
			});

			const preventDefaultSpy = vi.spyOn(touchMoveEvent, 'preventDefault');
			app.dispatchEvent(touchMoveEvent);

			// Should prevent default for horizontal swipes
			expect(preventDefaultSpy).toHaveBeenCalled();
		});

		it('should not prevent default if not tracking', () => {
			document.body.innerHTML = '<div id="app"></div>';

			const app = document.getElementById('app');
			initTouch();

			// Don't set isTracking
			const touchMoveEvent = new TouchEvent('touchmove', {
				touches: [{
					clientX: 120,
					clientY: 202
				}],
				cancelable: true
			});

			const preventDefaultSpy = vi.spyOn(touchMoveEvent, 'preventDefault');
			app.dispatchEvent(touchMoveEvent);

			// Should not prevent default
			expect(preventDefaultSpy).not.toHaveBeenCalled();
		});
	});
});
