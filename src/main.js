import "./style.css";
import { initSettings, applyDefaultDistance } from "./settings.js";
import { initUI } from "./ui.js";
import { initTouch } from "./touch.js";
import { initAutoAdvance } from "./auto-advance.js";

// Initialize all parts of the application
document.addEventListener("DOMContentLoaded", () => {
	initSettings();
	initUI();
	initTouch();
	initAutoAdvance();
	
	// Apply default distance after all UI components are initialized
	setTimeout(() => {
		applyDefaultDistance();
	}, 50);
});