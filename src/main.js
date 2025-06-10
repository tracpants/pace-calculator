import "./style.css";
import { initSettings, applyDefaultDistance } from "./settings.js";
import { initUI } from "./ui.js";
import { initTouch } from "./touch.js";
import { initAutoAdvance } from "./auto-advance.js";
import { createModalTester } from "./modal-tests.js";
import { ensureModalPositioning, fixModalIssues, debugModalState } from "./modal-positioning.js";
import { validateModals, autoFixModals, startModalMonitoring } from "./modal-validator.js";

// Initialize all parts of the application
document.addEventListener("DOMContentLoaded", () => {
	// CRITICAL: Fix modal positioning first before other initializations
	ensureModalPositioning();
	
	initSettings();
	initUI();
	initTouch();
	initAutoAdvance();
	
	// Apply default distance after all UI components are initialized
	setTimeout(() => {
		applyDefaultDistance();
	}, 50);
	
	// Initialize modal testing and debugging tools
	if (process.env.NODE_ENV !== 'production') {
		const modalTester = createModalTester();
		
		// Make available globally for debugging
		window.modalTester = modalTester;
		window.testModals = () => modalTester.runAllTests();
		window.fixModals = () => {
			fixModalIssues();
			autoFixModals();
			modalTester.diagnoseAndFix();
		};
		window.debugModals = debugModalState;
		window.validateModals = validateModals;
		window.autoFixModals = autoFixModals;
		
		console.log('🧪 Modal tools available:');
		console.log('  - testModals(): Run comprehensive modal tests');
		console.log('  - fixModals(): Fix all modal issues (positioning, CSS, validation)');
		console.log('  - debugModals(): Debug modal state and positioning');
		console.log('  - validateModals(): Run modal validation checks');
		console.log('  - autoFixModals(): Auto-fix common modal issues');
		console.log('  - ensureModalPositioning(): Re-run positioning check');
	}
	
	// Add a final positioning check and validation after everything is loaded
	setTimeout(() => {
		ensureModalPositioning();
		
		// Run comprehensive validation
		const validationResult = validateModals();
		if (!validationResult.passed) {
			console.warn('🔧 Modal validation failed, running auto-fix...');
			autoFixModals();
			
			// Re-validate after auto-fix
			setTimeout(() => {
				const revalidationResult = validateModals();
				if (revalidationResult.passed) {
					console.log('✅ Modal auto-fix successful!');
				} else {
					console.error('❌ Modal auto-fix failed. Manual intervention required.');
				}
			}, 100);
		}
		
		// Start monitoring in development
		if (process.env.NODE_ENV !== 'production') {
			startModalMonitoring(10000); // Check every 10 seconds
		}
	}, 100);
});