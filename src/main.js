import "./style.css";
import { initSettings } from "./settings.js";
import { initUI } from "./ui.js";

// Initialize all parts of the application
document.addEventListener("DOMContentLoaded", () => {
	initSettings();
	initUI();
});