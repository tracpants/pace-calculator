import { stateManager } from './state-manager.js';

export const state = {
	get currentTab() {
		return stateManager.get('app.currentTab');
	},
	set currentTab(value) {
		stateManager.set('app.currentTab', value);
	},

	get distanceUnit() {
		return stateManager.get('settings.distanceUnit');
	},
	set distanceUnit(value) {
		stateManager.set('settings.distanceUnit', value);
	},

	get lastResult() {
		return stateManager.get('app.lastResult');
	},
	set lastResult(value) {
		stateManager.set('app.lastResult', value);
	},

	getFormData() {
		const form = document.getElementById('calculator-form');
		return form ? new FormData(form) : new FormData();
	},

	saveFormState() {
		const formData = this.getFormData();
		const key = `pace-calc-form-${this.currentTab}`;
		const data = {};

		for (const [key, value] of formData.entries()) {
			if (key.startsWith(this.currentTab)) {
				data[key] = value;
			}
		}

		if (Object.keys(data).length > 0) {
			localStorage.setItem(key, JSON.stringify(data));
		}
	},

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

export { stateManager };