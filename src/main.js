import "./style.css";
import { initAutoAdvance } from "./auto-advance.js";
import { ensureModalPositioning } from "./modal-positioning.js";
import { initSettings, applyDefaultDistance } from "./settings.js";
import { initTouch } from "./touch.js";
import { initUI } from "./ui.js";

// Initialize all parts of the application
document.addEventListener("DOMContentLoaded", async () => {
	// Initialize UI first to ensure tab functionality works properly
	try {
		await initUI();
	} catch (error) {
		console.error('❌ UI initialization failed:', error);
		// Continue with other initializations even if UI fails
	}
	
	// Initialize other components
	ensureModalPositioning();
	initSettings();
	initTouch();
	initAutoAdvance();
	
	// Apply default distance after all UI components are initialized
	setTimeout(() => {
		applyDefaultDistance();
	}, 50);
});