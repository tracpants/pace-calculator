import "./style.css";
import { initTheme } from "./theme.js";
import { initUI } from "./ui.js";

// Initialize all parts of the application
document.addEventListener("DOMContentLoaded", () => {
	initTheme();
	initUI();
});