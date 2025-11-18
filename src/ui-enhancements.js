import { Notyf } from 'notyf';
import confetti from 'canvas-confetti';
import { CountUp } from 'countup.js';

let notyf = null;

const isTestEnvironment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

export function initUIEnhancements() {
	if (isTestEnvironment) {
		console.log('✅ UI enhancements skipped in test environment');
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
	if (isTestEnvironment || !notyf) return;

	notyf.open({
		type,
		message
	});
}

export function celebrateSuccess() {
	if (isTestEnvironment) return;

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

export function animateNumber(element, finalNumber, options = {}) {
	const {
		decimals = 0,
		duration = 1,
		separator = '',
		prefix = '',
		suffix = ''
	} = options;

	const countUp = new CountUp(element, finalNumber, {
		startVal: 0,
		decimalPlaces: decimals,
		duration,
		separator,
		prefix,
		suffix,
		useEasing: true,
		useGrouping: false,
	});

	if (!countUp.error) {
		countUp.start();
	} else {
		console.error('CountUp error:', countUp.error);
		element.textContent = prefix + finalNumber.toFixed(decimals) + suffix;
	}
}
