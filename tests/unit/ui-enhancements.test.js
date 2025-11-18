import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initUIEnhancements, showToast, celebrateSuccess } from '../../src/ui-enhancements.js';

// Mock external dependencies
vi.mock('notyf', () => {
	const NotyfMock = vi.fn(function NotyfConstructor() {
		this.open = vi.fn();
		this.success = vi.fn();
		this.error = vi.fn();
	});
	return { Notyf: NotyfMock };
});

vi.mock('canvas-confetti', () => ({
		default: vi.fn()
	}));

describe('UI Enhancements Module', () => {
	let originalProcessEnv;

	beforeEach(() => {
		// Save original process.env
		originalProcessEnv = process.env.NODE_ENV;

		// Set to non-test environment by default
		process.env.NODE_ENV = 'development';

		// Clear all mocks
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Restore process.env
		process.env.NODE_ENV = originalProcessEnv;

		// Clear any running timers
		vi.clearAllTimers();
	});

	describe('isTestEnvironment detection', () => {
		it('should skip initialization in test environment', async () => {
			process.env.NODE_ENV = 'test';

			const { Notyf } = await import('notyf');

			initUIEnhancements();

			// Notyf should not be initialized in test environment
			expect(Notyf).not.toHaveBeenCalled();
		});

		it('should initialize in non-test environment', async () => {
			process.env.NODE_ENV = 'development';

			const { Notyf } = await import('notyf');

			initUIEnhancements();

			// Notyf should be initialized
			expect(Notyf).toHaveBeenCalledWith(expect.objectContaining({
				duration: 3000,
				position: { x: 'right', y: 'top' },
				dismissible: true,
				ripple: true
			}));
		});
	});

	describe('initUIEnhancements', () => {
		it('should initialize Notyf with correct configuration', async () => {
			const { Notyf } = await import('notyf');

			initUIEnhancements();

			expect(Notyf).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: 3000,
					position: {
						x: 'right',
						y: 'top'
					},
					types: expect.arrayContaining([
						expect.objectContaining({
							type: 'success',
							background: 'var(--color-status-success)',
							icon: false
						}),
						expect.objectContaining({
							type: 'error',
							background: 'var(--color-status-error)',
							icon: false
						}),
						expect.objectContaining({
							type: 'info',
							background: 'var(--color-interactive-primary)',
							icon: false
						})
					]),
					dismissible: true,
					ripple: true
				})
			);
		});

		it('should configure custom toast types', async () => {
			const { Notyf } = await import('notyf');

			initUIEnhancements();

			const config = Notyf.mock.calls[0][0];

			expect(config.types).toHaveLength(3);
			expect(config.types[0].type).toBe('success');
			expect(config.types[1].type).toBe('error');
			expect(config.types[2].type).toBe('info');
		});
	});

	describe('showToast', () => {
		it('should display success toast', async () => {
			const { Notyf } = await import('notyf');

			initUIEnhancements();
			const notyfInstance = Notyf.mock.results[0].value;

			showToast('Operation successful', 'success');

			expect(notyfInstance.open).toHaveBeenCalledWith({
				type: 'success',
				message: 'Operation successful'
			});
		});

		it('should display error toast', async () => {
			const { Notyf } = await import('notyf');

			initUIEnhancements();
			const notyfInstance = Notyf.mock.results[0].value;

			showToast('Operation failed', 'error');

			expect(notyfInstance.open).toHaveBeenCalledWith({
				type: 'error',
				message: 'Operation failed'
			});
		});

		it('should display info toast', async () => {
			const { Notyf } = await import('notyf');

			initUIEnhancements();
			const notyfInstance = Notyf.mock.results[0].value;

			showToast('Information message', 'info');

			expect(notyfInstance.open).toHaveBeenCalledWith({
				type: 'info',
				message: 'Information message'
			});
		});

		it('should default to success type if no type provided', async () => {
			const { Notyf } = await import('notyf');

			initUIEnhancements();
			const notyfInstance = Notyf.mock.results[0].value;

			showToast('Default message');

			expect(notyfInstance.open).toHaveBeenCalledWith({
				type: 'success',
				message: 'Default message'
			});
		});

		it('should not show toast in test environment', async () => {
			process.env.NODE_ENV = 'test';

			const { Notyf } = await import('notyf');

			initUIEnhancements();

			// Should not throw
			expect(() => showToast('Test message')).not.toThrow();

			// Notyf should not have been called
			expect(Notyf).not.toHaveBeenCalled();
		});

		it('should not show toast if not initialized', () => {
			// Don't call initUIEnhancements

			// Should not throw
			expect(() => showToast('Test message')).not.toThrow();
		});
	});

	describe('celebrateSuccess', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should trigger confetti animation', async () => {
			const confetti = (await import('canvas-confetti')).default;

			celebrateSuccess();

			// Fast-forward past first interval (250ms)
			vi.advanceTimersByTime(250);

			// Confetti should have been called
			expect(confetti).toHaveBeenCalled();
		});

		it('should fire confetti from both sides', async () => {
			const confetti = (await import('canvas-confetti')).default;

			celebrateSuccess();

			// Fast-forward past first interval
			vi.advanceTimersByTime(250);

			// Should be called twice (left and right side)
			expect(confetti).toHaveBeenCalledTimes(2);

			// Check origins are different
			const firstCall = confetti.mock.calls[0][0];
			const secondCall = confetti.mock.calls[1][0];

			expect(firstCall.origin.x).toBeLessThan(0.5);  // Left side (0.1-0.3)
			expect(secondCall.origin.x).toBeGreaterThan(0.5); // Right side (0.7-0.9)
		});

		it('should run confetti animation for 2 seconds', async () => {
			const confetti = (await import('canvas-confetti')).default;

			celebrateSuccess();

			// Advance through entire duration (2000ms) + a bit more
			vi.advanceTimersByTime(2500);

			// Should have fired multiple times (every 250ms for 2000ms = 8 times)
			// Each firing calls confetti twice (left + right)
			expect(confetti.mock.calls.length).toBeGreaterThanOrEqual(14); // 8 intervals * 2 calls
		});

		it('should stop confetti after animation completes', async () => {
			const confetti = (await import('canvas-confetti')).default;

			celebrateSuccess();

			// Advance past animation duration
			vi.advanceTimersByTime(2500);

			const callCountAfterAnimation = confetti.mock.calls.length;

			// Advance more time
			vi.advanceTimersByTime(1000);

			// Should not have called confetti more times
			expect(confetti.mock.calls.length).toBe(callCountAfterAnimation);
		});

		it('should not trigger confetti in test environment', async () => {
			process.env.NODE_ENV = 'test';

			const confetti = (await import('canvas-confetti')).default;

			celebrateSuccess();

			vi.advanceTimersByTime(2500);

			// Confetti should not be called in test environment
			expect(confetti).not.toHaveBeenCalled();
		});

		it('should decrease particle count over time', async () => {
			const confetti = (await import('canvas-confetti')).default;

			celebrateSuccess();

			// First interval
			vi.advanceTimersByTime(250);
			const firstCallParticleCount = confetti.mock.calls[0][0].particleCount;

			// Clear calls
			confetti.mockClear();

			// Later interval (halfway through animation)
			vi.advanceTimersByTime(750); // Now at 1000ms (halfway)
			const laterCallParticleCount = confetti.mock.calls[0][0].particleCount;

			// Particle count should decrease as animation progresses
			expect(laterCallParticleCount).toBeLessThan(firstCallParticleCount);
		});
	});

	describe('Edge Cases', () => {
		it('should handle multiple initializations gracefully', () => {
			expect(() => {
				initUIEnhancements();
				initUIEnhancements();
				initUIEnhancements();
			}).not.toThrow();
		});

		it('should handle showToast with empty message', async () => {
			const { Notyf } = await import('notyf');

			initUIEnhancements();
			const notyfInstance = Notyf.mock.results[0].value;

			showToast('');

			expect(notyfInstance.open).toHaveBeenCalledWith({
				type: 'success',
				message: ''
			});
		});

		it('should handle showToast with very long message', async () => {
			const { Notyf } = await import('notyf');

			initUIEnhancements();
			const notyfInstance = Notyf.mock.results[0].value;

			const longMessage = 'A'.repeat(1000);
			showToast(longMessage);

			expect(notyfInstance.open).toHaveBeenCalledWith({
				type: 'success',
				message: longMessage
			});
		});

		it('should handle multiple simultaneous celebrations', async () => {
			vi.useFakeTimers();

			const confetti = (await import('canvas-confetti')).default;

			celebrateSuccess();
			celebrateSuccess();
			celebrateSuccess();

			vi.advanceTimersByTime(250);

			// All three celebrations should trigger confetti
			expect(confetti.mock.calls.length).toBeGreaterThan(0);

			vi.useRealTimers();
		});
	});
});
