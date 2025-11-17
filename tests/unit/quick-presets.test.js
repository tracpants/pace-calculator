import { fireEvent } from '@testing-library/dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { state } from '../../src/state.js';

vi.mock('../../src/settings.js', () => ({
	applyDefaultDistance: vi.fn(),
	loadSettings: vi.fn(() => ({ distanceUnit: 'km' })),
	saveSettings: vi.fn()
}));

vi.mock('../../src/calculator.js', () => ({
	validateDistanceInput: vi.fn(() => ({ valid: true, value: 10 })),
	formatTime: vi.fn(seconds => `${Math.floor(seconds/60)}:${(seconds%60).toString().padStart(2, '0')}`),
	formatDistance: vi.fn(distance => distance.toString())
}));

vi.mock('../../src/auto-advance.js', () => ({
	initAutoAdvance: vi.fn()
}));

vi.mock('../../src/pr.js', () => ({
	getAllPRs: vi.fn(() => []),
	getPRForDistance: vi.fn(() => null)
}));

describe('Quick Preset Buttons', () => {
	let setupQuickPresets;
	let clearFieldErrors;
	let updateButtonStateQuietly;

	beforeEach(async () => {
		state.currentTab = 'pace';
		state.distanceUnit = 'km';
		state.tabStates = {};
		state.lastResult = null;

		const { getRaceDistances } = await import('../../src/distances.js');

		document.body.innerHTML = `
			<div id="app">
				<form id="calculator-form">
					<div data-section="pace" class="form-section">
						<!-- Quick Preset Buttons -->
						<div class="grid grid-cols-4 gap-2 mb-3" role="group" aria-label="Quick distance presets">
							<button type="button" data-quick-preset="5k" data-tab="pace" class="quick-preset-btn" aria-label="5K distance">
								5K
							</button>
							<button type="button" data-quick-preset="10k" data-tab="pace" class="quick-preset-btn" aria-label="10K distance">
								10K
							</button>
							<button type="button" data-quick-preset="half-marathon" data-tab="pace" class="quick-preset-btn" aria-label="Half Marathon distance">
								Half
							</button>
							<button type="button" data-quick-preset="marathon" data-tab="pace" class="quick-preset-btn" aria-label="Marathon distance">
								Full
							</button>
						</div>
						<input id="pace-distance" type="text" value="" />
						<select id="pace-preset" class="preset-select"></select>
						<div id="pace-distance-error" class="hidden"></div>
					</div>

					<div data-section="time" class="form-section hidden">
						<!-- Quick Preset Buttons -->
						<div class="grid grid-cols-4 gap-2 mb-3" role="group" aria-label="Quick distance presets">
							<button type="button" data-quick-preset="5k" data-tab="time" class="quick-preset-btn" aria-label="5K distance">
								5K
							</button>
							<button type="button" data-quick-preset="10k" data-tab="time" class="quick-preset-btn" aria-label="10K distance">
								10K
							</button>
							<button type="button" data-quick-preset="half-marathon" data-tab="time" class="quick-preset-btn" aria-label="Half Marathon distance">
								Half
							</button>
							<button type="button" data-quick-preset="marathon" data-tab="time" class="quick-preset-btn" aria-label="Marathon distance">
								Full
							</button>
						</div>
						<input id="time-distance" type="text" value="" />
						<select id="time-preset" class="preset-select"></select>
						<div id="time-distance-error" class="hidden"></div>
					</div>

					<button type="submit">Calculate</button>
				</form>
				<div id="result" class="hidden">
					<div id="result-label"></div>
					<div id="result-value"></div>
				</div>
				<div id="loading" class="hidden"></div>
			</div>
		`;

		clearFieldErrors = vi.fn();
		updateButtonStateQuietly = vi.fn();

		setupQuickPresets = () => {
			document.querySelectorAll('.quick-preset-btn').forEach(button => {
				button.addEventListener('click', () => {
					const presetKey = button.dataset.quickPreset;
					const tabName = button.dataset.tab;
					const raceDistances = getRaceDistances();

					if (presetKey && raceDistances[presetKey]) {
						const distanceValue = raceDistances[presetKey][state.distanceUnit];
						const distanceInput = document.getElementById(`${tabName}-distance`);

						if (distanceInput) {
							distanceInput.value = distanceValue;
							clearFieldErrors();
							updateButtonStateQuietly();
						}
					}
				});
			});
		};

		setupQuickPresets();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should populate distance field when 5K preset button is clicked in pace tab', () => {
		const paceDistanceInput = document.getElementById('pace-distance');
		const fiveKButton = document.querySelector('[data-quick-preset="5k"][data-tab="pace"]');

		expect(paceDistanceInput.value).toBe('');

		fireEvent.click(fiveKButton);

		expect(paceDistanceInput.value).toBe('5');
	});

	it('should populate distance field when 10K preset button is clicked in pace tab', () => {
		const paceDistanceInput = document.getElementById('pace-distance');
		const tenKButton = document.querySelector('[data-quick-preset="10k"][data-tab="pace"]');

		expect(paceDistanceInput.value).toBe('');

		fireEvent.click(tenKButton);

		expect(paceDistanceInput.value).toBe('10');
	});

	it('should populate distance field when half marathon preset button is clicked in pace tab', () => {
		const paceDistanceInput = document.getElementById('pace-distance');
		const halfMarathonButton = document.querySelector('[data-quick-preset="half-marathon"][data-tab="pace"]');

		expect(paceDistanceInput.value).toBe('');

		fireEvent.click(halfMarathonButton);

		expect(paceDistanceInput.value).toBe('21.0975');
	});

	it('should populate distance field when marathon preset button is clicked in pace tab', () => {
		const paceDistanceInput = document.getElementById('pace-distance');
		const marathonButton = document.querySelector('[data-quick-preset="marathon"][data-tab="pace"]');

		expect(paceDistanceInput.value).toBe('');

		fireEvent.click(marathonButton);

		expect(paceDistanceInput.value).toBe('42.195');
	});

	it('should populate distance field in time tab when preset button is clicked', () => {
		const timeDistanceInput = document.getElementById('time-distance');
		const fiveKButton = document.querySelector('[data-quick-preset="5k"][data-tab="time"]');

		expect(timeDistanceInput.value).toBe('');

		fireEvent.click(fiveKButton);

		expect(timeDistanceInput.value).toBe('5');
	});

	it('should update distance value when unit system changes', () => {
		state.distanceUnit = 'miles';

		const paceDistanceInput = document.getElementById('pace-distance');
		const fiveKButton = document.querySelector('[data-quick-preset="5k"][data-tab="pace"]');

		fireEvent.click(fiveKButton);

		const expectedMiles = (5 / 1.609344).toFixed(6);
		expect(parseFloat(paceDistanceInput.value)).toBeCloseTo(parseFloat(expectedMiles), 3);
	});

	it('should have proper accessibility attributes', () => {
		const fiveKButton = document.querySelector('[data-quick-preset="5k"][data-tab="pace"]');

		expect(fiveKButton.getAttribute('aria-label')).toBe('5K distance');
		expect(fiveKButton.getAttribute('type')).toBe('button');

		const buttonGroup = document.querySelector('[role="group"]');
		expect(buttonGroup.getAttribute('aria-label')).toBe('Quick distance presets');
	});

	it('should have all four preset buttons in each tab', () => {
		const paceButtons = document.querySelectorAll('[data-tab="pace"].quick-preset-btn');
		const timeButtons = document.querySelectorAll('[data-tab="time"].quick-preset-btn');

		expect(paceButtons.length).toBe(4);
		expect(timeButtons.length).toBe(4);

		const pacePresetKeys = Array.from(paceButtons).map(btn => btn.dataset.quickPreset);
		expect(pacePresetKeys).toContain('5k');
		expect(pacePresetKeys).toContain('10k');
		expect(pacePresetKeys).toContain('half-marathon');
		expect(pacePresetKeys).toContain('marathon');
	});

	it('should clear error states when preset button is clicked', () => {
		const fiveKButton = document.querySelector('[data-quick-preset="5k"][data-tab="pace"]');

		fireEvent.click(fiveKButton);

		expect(clearFieldErrors).toHaveBeenCalled();
	});
});
