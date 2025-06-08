import { state } from "./state.js";

// Touch gesture configuration
const SWIPE_CONFIG = {
	minDistance: 50, // Minimum distance for a swipe
	maxTime: 300, // Maximum time for a swipe gesture (ms)
	maxVerticalDistance: 100, // Maximum vertical movement to still be considered horizontal swipe
};

// Touch state
let touchState = {
	startX: 0,
	startY: 0,
	startTime: 0,
	isTracking: false,
};

// Tab order for navigation
const tabOrder = ['pace', 'time', 'distance'];

// Get next/previous tab
function getNextTab(currentTab, direction) {
	const currentIndex = tabOrder.indexOf(currentTab);
	if (direction === 'next') {
		return tabOrder[(currentIndex + 1) % tabOrder.length];
	} else {
		return tabOrder[(currentIndex - 1 + tabOrder.length) % tabOrder.length];
	}
}

// Switch to tab programmatically
function switchToTab(tabName) {
	const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
	if (targetTab) {
		targetTab.click();
	}
}

// Check if device has touch capability
function isTouchDevice() {
	return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Handle touch start
function handleTouchStart(e) {
	if (!isTouchDevice()) return;
	
	const touch = e.touches[0];
	touchState = {
		startX: touch.clientX,
		startY: touch.clientY,
		startTime: Date.now(),
		isTracking: true,
	};
}

// Handle touch move
function handleTouchMove(e) {
	if (!touchState.isTracking || !isTouchDevice()) return;
	
	// Prevent default scrolling behavior during potential swipe
	const touch = e.touches[0];
	const deltaX = Math.abs(touch.clientX - touchState.startX);
	const deltaY = Math.abs(touch.clientY - touchState.startY);
	
	// If horizontal movement is greater than vertical, prevent default scroll
	if (deltaX > deltaY && deltaX > 10) {
		e.preventDefault();
	}
}

// Handle touch end
function handleTouchEnd(e) {
	if (!touchState.isTracking || !isTouchDevice()) return;
	
	const touch = e.changedTouches[0];
	const endTime = Date.now();
	const deltaTime = endTime - touchState.startTime;
	const deltaX = touch.clientX - touchState.startX;
	const deltaY = Math.abs(touch.clientY - touchState.startY);
	
	touchState.isTracking = false;
	
	// Check if this qualifies as a swipe
	if (
		deltaTime < SWIPE_CONFIG.maxTime &&
		Math.abs(deltaX) > SWIPE_CONFIG.minDistance &&
		deltaY < SWIPE_CONFIG.maxVerticalDistance
	) {
		// Determine swipe direction
		if (deltaX > 0) {
			// Swipe right - go to next tab
			const nextTab = getNextTab(state.currentTab, 'next');
			switchToTab(nextTab);
		} else {
			// Swipe left - go to previous tab
			const prevTab = getNextTab(state.currentTab, 'prev');
			switchToTab(prevTab);
		}
	}
}

// Add visual feedback to indicate swipe capability
function addSwipeIndicator() {
	const tabContainer = document.querySelector('[role="tablist"]');
	if (tabContainer && isTouchDevice()) {
		tabContainer.setAttribute('data-swipe-enabled', 'true');
		// Add a subtle hint that tabs are swipeable
		tabContainer.title = 'Swipe left or right to change tabs';
	}
}

// Initialize touch gestures
export function initTouch() {
	if (!isTouchDevice()) return;
	
	// Add touch event listeners to the main app container
	const app = document.getElementById('app');
	if (app) {
		app.addEventListener('touchstart', handleTouchStart, { passive: false });
		app.addEventListener('touchmove', handleTouchMove, { passive: false });
		app.addEventListener('touchend', handleTouchEnd, { passive: true });
	}
	
	// Add visual indicator
	addSwipeIndicator();
}