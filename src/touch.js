import { stateManager } from "./state-manager.js";

const SWIPE_CONFIG = {
	minDistance: 50,
	maxTime: 300,
	maxVerticalDistance: 100,
};

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

function handleTouchStart(e) {
	if (!isTouchDevice()) return;

	const touch = e.touches[0];
	stateManager.set('touch.startX', touch.clientX);
	stateManager.set('touch.startY', touch.clientY);
	stateManager.set('touch.startTime', Date.now());
	stateManager.set('touch.isTracking', true);
}

function handleTouchMove(e) {
	if (!stateManager.get('touch.isTracking') || !isTouchDevice()) return;

	const touch = e.touches[0];
	const deltaX = Math.abs(touch.clientX - stateManager.get('touch.startX'));
	const deltaY = Math.abs(touch.clientY - stateManager.get('touch.startY'));

	if (deltaX > deltaY && deltaX > 10) {
		e.preventDefault();
	}
}

function handleTouchEnd(e) {
	if (!stateManager.get('touch.isTracking') || !isTouchDevice()) return;

	const touch = e.changedTouches[0];
	const endTime = Date.now();
	const deltaTime = endTime - stateManager.get('touch.startTime');
	const deltaX = touch.clientX - stateManager.get('touch.startX');
	const deltaY = Math.abs(touch.clientY - stateManager.get('touch.startY'));

	stateManager.set('touch.isTracking', false);

	if (
		deltaTime < SWIPE_CONFIG.maxTime &&
		Math.abs(deltaX) > SWIPE_CONFIG.minDistance &&
		deltaY < SWIPE_CONFIG.maxVerticalDistance
	) {
		const currentTab = stateManager.get('app.currentTab');
		if (deltaX > 0) {
			const nextTab = getNextTab(currentTab, 'next');
			switchToTab(nextTab);
		} else {
			const prevTab = getNextTab(currentTab, 'prev');
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