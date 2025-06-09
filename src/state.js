// A simple object to hold the application's state.
export const state = {
	currentTab: "pace", // 'pace', 'time', or 'distance'
	distanceUnit: "km", // 'km' or 'miles'
	lastResult: null, // Store last calculation result (deprecated, use tabStates)
	// Per-tab state isolation
	tabStates: {
		pace: {
			inputs: {},
			validationStates: {},
			result: null,
			presetSelection: ""
		},
		time: {
			inputs: {},
			validationStates: {},
			result: null,
			presetSelection: ""
		},
		distance: {
			inputs: {},
			validationStates: {},
			result: null,
			presetSelection: ""
		}
	}
};