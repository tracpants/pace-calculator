import * as calc from '../calculator.js';
import { validateSegmentedTime, validateSegmentedPace } from './time-utils.js';
import { ErrorManager } from './validation-utils.js';

export function calculatePaceResult(state) {
	const distInput = document.getElementById("pace-distance");

	const timeValidation = validateSegmentedTime('pace-time');
	const distValidation = calc.validateDistanceInput(distInput.value);

	if (!timeValidation.valid) {
		ErrorManager.setSegmentedError('pace-time', timeValidation.message);
	}
	if (!distValidation.valid) {
		ErrorManager.setError('pace-distance', distValidation.message);
	}

	if (!timeValidation.valid || !distValidation.valid) {
		throw new Error("Please fix the input errors before calculating.");
	}

	const { pacePerKm, pacePerMile } = calc.calculatePace(
		timeValidation.value,
		distValidation.value,
		state.distanceUnit
	);

	const label = "Your Pace:";
	const value = state.distanceUnit === "km"
		? `${calc.formatTime(pacePerKm)} /km`
		: `${calc.formatTime(pacePerMile)} /mile`;

	return {
		label,
		value,
		data: { pacePerKm, pacePerMile }
	};
}

export function calculateTimeResult(state) {
	const distInput = document.getElementById("time-distance");

	const paceValidation = validateSegmentedPace('time-pace');
	const distValidation = calc.validateDistanceInput(distInput.value);

	if (!paceValidation.valid) {
		ErrorManager.setSegmentedError('time-pace', paceValidation.message);
	}
	if (!distValidation.valid) {
		ErrorManager.setError('time-distance', distValidation.message);
	}

	if (!paceValidation.valid || !distValidation.valid) {
		throw new Error("Please fix the input errors before calculating.");
	}

	const totalSeconds = calc.calculateTime(
		paceValidation.value,
		distValidation.value,
		state.distanceUnit,
		state.distanceUnit
	);

	return {
		label: "Your Time:",
		value: calc.formatTime(totalSeconds, true),
		data: { totalSeconds }
	};
}

export function calculateDistanceResult(state) {
	const timeValidation = validateSegmentedTime('distance-time');
	const paceValidation = validateSegmentedPace('distance-pace');

	if (!timeValidation.valid) {
		ErrorManager.setSegmentedError('distance-time', timeValidation.message);
	}
	if (!paceValidation.valid) {
		ErrorManager.setSegmentedError('distance-pace', paceValidation.message);
	}

	if (!timeValidation.valid || !paceValidation.valid) {
		throw new Error("Please fix the input errors before calculating.");
	}

	const { km, miles } = calc.calculateDistance(
		timeValidation.value,
		paceValidation.value,
		state.distanceUnit
	);

	const label = "Your Distance:";
	const value = state.distanceUnit === "km"
		? `${calc.formatDistance(km)} km`
		: `${calc.formatDistance(miles)} miles`;

	return {
		label,
		value,
		data: { km, miles }
	};
}

export function performCalculation(currentTab, state) {
	if (currentTab === "pace") {
		return calculatePaceResult(state);
	} else if (currentTab === "time") {
		return calculateTimeResult(state);
	} else if (currentTab === "distance") {
		return calculateDistanceResult(state);
	}
	throw new Error("Invalid tab");
}
