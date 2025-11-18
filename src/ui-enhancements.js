import confetti from 'canvas-confetti';
import { Notyf } from 'notyf';
import { logger } from "./utils/logger.js";

let notyf = null;

function isTestEnvironment() {
	try {
		return typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
	} catch {
		return false;
	}
}

export function initUIEnhancements() {
	if (isTestEnvironment()) {
		logger.log('✅ UI enhancements skipped in test environment');
		return;
	}

	notyf = new Notyf({
		duration: 3000,
		position: {
			x: 'right',
			y: 'top',
		},
		types: [
			{
				type: 'success',
				background: 'var(--color-status-success)',
				icon: false,
			},
			{
				type: 'error',
				background: 'var(--color-status-error)',
				icon: false,
			},
			{
				type: 'info',
				background: 'var(--color-interactive-primary)',
				icon: false,
			}
		],
		dismissible: true,
		ripple: true,
	});
}

export function showToast(message, type = 'success') {
	if (isTestEnvironment() || !notyf) return;

	notyf.open({
		type,
		message
	});
}

export function celebrateSuccess() {
	if (isTestEnvironment()) return;

	const duration = 2000;
	const animationEnd = Date.now() + duration;
	const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

	function randomInRange(min, max) {
		return Math.random() * (max - min) + min;
	}

	const interval = setInterval(() => {
		const timeLeft = animationEnd - Date.now();

		if (timeLeft <= 0) {
			return clearInterval(interval);
		}

		const particleCount = 50 * (timeLeft / duration);

		confetti({
			...defaults,
			particleCount,
			origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
		});
		confetti({
			...defaults,
			particleCount,
			origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
		});
	}, 250);
}
