import "./style.css";
import { initSettings } from "./settings.js";
import { initUI } from "./ui.js";
import { initTouch } from "./touch.js";

// Initialize all parts of the application
document.addEventListener("DOMContentLoaded", () => {
	initSettings();
	initUI();
	initTouch();
});