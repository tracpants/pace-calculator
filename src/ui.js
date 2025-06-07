import { state } from "./state.js";
import * as calc from "./calculator.js";

// DOM Elements
const form = document.getElementById("calculator-form");
const resultDiv = document.getElementById("result");
const resultLabel = document.getElementById("result-label");
const resultValue = document.getElementById("result-value");

const presets = {
	"5k": { km: 5, miles: 3.107 },
	"10k": { km: 10, miles: 6.214 },
	"half-marathon": { km: 21.0975, miles: 13.109 },
	"marathon": { km: 42.195, miles: 26.219 },
	"1-mile": { km: 1.609, miles: 1 },
};

function updateUnitToggles() {
	document.querySelectorAll("[data-unit]").forEach((btn) => {
		if (btn.dataset.unit === state.distanceUnit) {
			btn.classList.add("active");
		} else {
			btn.classList.remove("active");
		}
	});
	populatePresetSelects();
	updateCalculatedResult();
}

function populatePresetSelects() {
	const unit = state.distanceUnit;
	const options =
		`<option value="">-- Pick an event --</option>` +
		Object.entries(presets)
			.map(
				([key, value]) =>
					`<option value="${key}">${key.replace("-", " ").toUpperCase()} (${
						value[unit] % 1 === 0 ? value[unit] : value[unit].toFixed(3)
					} ${unit})</option>`
			)
			.join("");

	document
		.querySelectorAll(".preset-select")
		.forEach((select) => (select.innerHTML = options));
}

function handleFormSubmit(e) {
	e.preventDefault();
	let label = "",
		value = "";

	try {
		if (state.currentTab === "pace") {
			const timeValue = document.getElementById("pace-time").value;
			const distValue = document.getElementById("pace-distance").value;
			const time = calc.parseTime(timeValue);
			const dist = parseFloat(distValue);
			if (time <= 0) throw new Error("Please enter a valid time (e.g., 45:30)");
			if (dist <= 0 || isNaN(dist)) throw new Error("Please enter a valid distance");
			const { pacePerKm, pacePerMile } = calc.calculatePace(
				time,
				dist,
				state.distanceUnit
			);
			label = "Your Pace:";
			if (state.distanceUnit === "km") {
				value = `${calc.formatTime(pacePerKm)} /km`;
			} else {
				value = `${calc.formatTime(pacePerMile)} /mile`;
			}
			// Store the result for unit conversion
			state.lastResult = {
				type: state.currentTab,
				data: { pacePerKm, pacePerMile }
			};
		} else if (state.currentTab === "time") {
			const paceValue = document.getElementById("time-pace").value;
			const distValue = document.getElementById("time-distance").value;
			const pace = calc.parseTime(paceValue);
			const dist = parseFloat(distValue);
			if (pace <= 0) throw new Error("Please enter a valid pace (e.g., 04:30)");
			if (dist <= 0 || isNaN(dist)) throw new Error("Please enter a valid distance");
			const totalSeconds = calc.calculateTime(
				pace,
				dist,
				state.distanceUnit,
				state.distanceUnit
			);
			label = "Your Time:";
			value = calc.formatTime(totalSeconds, true);
			// Store the result for unit conversion
			state.lastResult = {
				type: state.currentTab,
				data: { totalSeconds }
			};
		} else if (state.currentTab === "distance") {
			const timeValue = document.getElementById("distance-time").value;
			const paceValue = document.getElementById("distance-pace").value;
			const time = calc.parseTime(timeValue);
			const pace = calc.parseTime(paceValue);
			if (time <= 0) throw new Error("Please enter a valid time (e.g., 01:35:00)");
			if (pace <= 0) throw new Error("Please enter a valid pace (e.g., 04:30)");
			const { km, miles } = calc.calculateDistance(
				time,
				pace,
				state.distanceUnit
			);
			label = "Your Distance:";
			if (state.distanceUnit === "km") {
				value = `${km.toFixed(2)} km`;
			} else {
				value = `${miles.toFixed(2)} miles`;
			}
			// Store the result for unit conversion
			state.lastResult = {
				type: state.currentTab,
				data: { km, miles }
			};
		}
		showResult(label, value);
	} catch (err) {
		alert(err.message || "Please check your inputs. All fields are required.");
	}
}

function showResult(label, value) {
	resultLabel.textContent = label;
	resultValue.innerHTML = value;
	resultDiv.classList.remove("hidden");
	resultDiv.classList.add(
		"bg-indigo-50",
		"dark:bg-gray-700",
		"border-l-4",
		"border-indigo-500"
	);
}

function updateCalculatedResult() {
	if (!state.lastResult || resultDiv.classList.contains("hidden")) return;
	
	const { type, data } = state.lastResult;
	let label = "", value = "";
	
	if (type === "pace") {
		label = "Your Pace:";
		if (state.distanceUnit === "km") {
			value = `${calc.formatTime(data.pacePerKm)} /km`;
		} else {
			value = `${calc.formatTime(data.pacePerMile)} /mile`;
		}
	} else if (type === "time") {
		label = "Your Time:";
		value = calc.formatTime(data.totalSeconds, true);
	} else if (type === "distance") {
		label = "Your Distance:";
		if (state.distanceUnit === "km") {
			value = `${data.km.toFixed(2)} km`;
		} else {
			value = `${data.miles.toFixed(2)} miles`;
		}
	}
	
	showResult(label, value);
}

function clearAll() {
	form.reset();
	resultDiv.classList.add("hidden");
	state.lastResult = null;
}

export function initUI() {
	// Initial setup
	updateUnitToggles();
	document.querySelector('.tab[data-tab="pace"]').classList.add("active");

	// Event Listeners
	document.querySelectorAll("[data-unit]").forEach((btn) => {
		btn.addEventListener("click", () => {
			state.distanceUnit = btn.dataset.unit;
			updateUnitToggles();
		});
	});

	document.querySelectorAll("[data-tab]").forEach((tab) => {
		tab.addEventListener("click", () => {
			state.currentTab = tab.dataset.tab;
			document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
			tab.classList.add("active");
			document
				.querySelectorAll(".form-section")
				.forEach((s) => s.classList.add("hidden"));
			document
				.querySelector(`[data-section="${state.currentTab}"]`)
				.classList.remove("hidden");
			resultDiv.classList.add("hidden");
			state.lastResult = null;
		});
	});

	document.querySelectorAll(".preset-select").forEach((select) => {
		select.addEventListener("change", (e) => {
			const presetKey = e.target.value;
			if (!presetKey) return;
			const distanceInput = document.getElementById(
				`${state.currentTab}-distance`
			);
			distanceInput.value = presets[presetKey][state.distanceUnit];
			e.target.selectedIndex = 0;
		});
	});

	form.addEventListener("submit", handleFormSubmit);
	document.getElementById("clear-btn").addEventListener("click", clearAll);
}