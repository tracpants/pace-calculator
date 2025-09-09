// Simplified state management - replaces complex tabStates system
export const state = {
	currentTab: "pace", // 'pace', 'time', or 'distance'
	distanceUnit: "km", // 'km' or 'miles'
	lastResult: null, // Store last calculation result
	
	// Simple form persistence using browser's built-in FormData
	getFormData() {
		const form = document.getElementById('calculator-form');
		return form ? new FormData(form) : new FormData();
	},
	
	// Save current form state (called before tab switches)
	saveFormState() {
		const formData = this.getFormData();
		const key = `pace-calc-form-${this.currentTab}`;
		const data = {};
		
		// Convert FormData to plain object for localStorage
		for (const [key, value] of formData.entries()) {
			if (key.startsWith(this.currentTab)) {
				data[key] = value;
			}
		}
		
		if (Object.keys(data).length > 0) {
			localStorage.setItem(key, JSON.stringify(data));
		}
	},
	
	// Restore form state when switching tabs
	restoreFormState(tabName) {
		const key = `pace-calc-form-${tabName}`;
		const saved = localStorage.getItem(key);
		
		if (saved) {
			try {
				const data = JSON.parse(saved);
				Object.entries(data).forEach(([fieldId, value]) => {
					const field = document.getElementById(fieldId);
					if (field) field.value = value;
				});
			} catch (e) {
				console.warn('Failed to restore form state:', e);
			}
		}
	}
};