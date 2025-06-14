/**
 * Multi-day UI Adapter
 * 
 * Manages the dynamic showing/hiding of days fields in time inputs
 * based on distance presets and current time values.
 * 
 * Preserves clean UI for typical use cases while enabling multi-day
 * time entry for ultra-distance events.
 */

import { isMultidayDistance, shouldAllowMultiday } from './calculator.js';
import { getDistanceValue } from './distances.js';

// Track current multiday state for each tab
const multidayStates = {
	pace: false,
	time: false,
	distance: false
};

/**
 * Initialize multiday UI adaptations
 */
export function initializeMultidayUI() {
	// Add event listeners for preset selects
	['pace', 'time', 'distance'].forEach(tab => {
		const presetSelect = document.getElementById(`${tab}-preset`);
		if (presetSelect) {
			presetSelect.addEventListener('change', () => handlePresetChange(tab));
		}
		
		// Add listeners for time input changes
		const hoursInput = document.getElementById(`${tab}-time-hours`);
		if (hoursInput) {
			hoursInput.addEventListener('input', () => handleTimeInputChange(tab));
		}
	});
}

/**
 * Handle distance preset selection changes
 */
function handlePresetChange(tab) {
	const presetSelect = document.getElementById(`${tab}-preset`);
	const selectedValue = presetSelect.value;
	
	let shouldShowDays = false;
	
	if (selectedValue) {
		// Get distance in kilometers
		const distanceKm = getDistanceValue(selectedValue, 'km');
		shouldShowDays = isMultidayDistance(distanceKm);
	}
	
	updateMultidayVisibility(tab, shouldShowDays);
}

/**
 * Handle time input changes that might indicate multiday context
 */
function handleTimeInputChange(tab) {
	const hoursInput = document.getElementById(`${tab}-time-hours`);
	const currentHours = parseInt(hoursInput.value) || 0;
	
	// If user enters > 20 hours, suggest multiday context
	const shouldShowDays = currentHours > 20;
	
	updateMultidayVisibility(tab, shouldShowDays);
}

/**
 * Update the visibility of multiday fields for a specific tab
 */
function updateMultidayVisibility(tab, showDays) {
	// Only update if state actually changed
	if (multidayStates[tab] === showDays) return;
	
	multidayStates[tab] = showDays;
	
	const daysGroup = document.getElementById(`${tab}-time-days-group`);
	const daysSeparator = document.getElementById(`${tab}-time-days-separator`);
	const hoursInput = document.getElementById(`${tab}-time-hours`);
	
	if (showDays) {
		// Show days field with smooth transition
		if (daysGroup) {
			daysGroup.classList.remove('hidden');
			daysGroup.classList.add('visible');
		}
		if (daysSeparator) {
			daysSeparator.classList.remove('hidden');
			daysSeparator.classList.add('visible');
		}
		
		// Update hours input max to 23 (since we now have days)
		if (hoursInput) {
			hoursInput.max = "23";
		}
		
		// Update hint text
		updateHintText(tab, true);
		
	} else {
		// Hide days field with smooth transition
		if (daysGroup) {
			daysGroup.classList.remove('visible');
			daysGroup.classList.add('hidden');
		}
		if (daysSeparator) {
			daysSeparator.classList.remove('visible');
			daysSeparator.classList.add('hidden');
		}
		
		// Keep hours input max at 23 for consistency
		if (hoursInput) {
			hoursInput.max = "23";
		}
		
		// Reset days input value when hidden
		const daysInput = document.getElementById(`${tab}-time-days`);
		if (daysInput) {
			daysInput.value = '';
		}
		
		// Update hint text
		updateHintText(tab, false);
	}
}

/**
 * Update hint text based on multiday context
 */
function updateHintText(tab, isMultiday) {
	const hintElement = document.getElementById(`${tab}-time-hint`);
	if (!hintElement) return;
	
	if (isMultiday) {
		hintElement.textContent = "Enter your running time (supports multi-day events)";
	} else {
		hintElement.textContent = "Enter your running time";
	}
}

/**
 * Get total seconds from time inputs including days
 */
export function getTimeFromInputs(tab) {
	const daysInput = document.getElementById(`${tab}-time-days`);
	const hoursInput = document.getElementById(`${tab}-time-hours`);
	const minutesInput = document.getElementById(`${tab}-time-minutes`);
	const secondsInput = document.getElementById(`${tab}-time-seconds`);
	
	const days = parseInt(daysInput?.value) || 0;
	const hours = parseInt(hoursInput?.value) || 0;
	const minutes = parseInt(minutesInput?.value) || 0;
	const seconds = parseInt(secondsInput?.value) || 0;
	
	return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

/**
 * Set time inputs from total seconds including days
 */
export function setTimeInputs(tab, totalSeconds) {
	const days = Math.floor(totalSeconds / 86400);
	const remainingAfterDays = totalSeconds % 86400;
	const hours = Math.floor(remainingAfterDays / 3600);
	const minutes = Math.floor((remainingAfterDays % 3600) / 60);
	const seconds = remainingAfterDays % 60;
	
	const daysInput = document.getElementById(`${tab}-time-days`);
	const hoursInput = document.getElementById(`${tab}-time-hours`);
	const minutesInput = document.getElementById(`${tab}-time-minutes`);
	const secondsInput = document.getElementById(`${tab}-time-seconds`);
	
	// Show days field if we have days
	if (days > 0) {
		updateMultidayVisibility(tab, true);
		if (daysInput) daysInput.value = days;
	}
	
	if (hoursInput) hoursInput.value = hours;
	if (minutesInput) minutesInput.value = minutes;
	if (secondsInput) secondsInput.value = seconds;
}

/**
 * Check if multiday mode is active for a tab
 */
export function isMultidayActive(tab) {
	return multidayStates[tab];
}

/**
 * Force multiday mode for a tab (useful for calculations that result in >24h)
 */
export function enableMultidayMode(tab) {
	updateMultidayVisibility(tab, true);
}