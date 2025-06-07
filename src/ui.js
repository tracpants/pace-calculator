import { state } from "./state.js";
import * as calc from "./calculator.js";

// DOM Elements
const form = document.getElementById("calculator-form");
const resultDiv = document.getElementById("result");
const resultLabel = document.getElementById("result-label");
const resultValue = document.getElementById("result-value");

const presets = {
	marathon: { km: 42.195, miles: 26.219 },
	"half-marathon": { km: 21.0975, miles: 13.109 },
	"10k": { km: 10, miles: 6.214 },
	"5k": { km: 5, miles: 3.107 },
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
}

function populatePresetSelects() {
	const unit = state.distanceUnit;
	const options =
		`<option value="">-- Pick an event --</option>` +
		Object.entries(presets)
			.map(
				([key, value]) =>
					`<option value="${key}">${key.replace("-", " ")} (${
						value[unit].toFixed(2)
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
			const time = calc.parseTime(document.getElementById("pace-time").value);
			const dist = parseFloat(document.getElementById("pace-distance").value);
			if (!time || !dist) throw new Error("Missing inputs");
			const { pacePerKm, pacePerMile } = calc.calculatePace(
				time,
				dist,
				state.distanceUnit
			);
			label = "Your Pace:";
			value = `${calc.formatTime(pacePerKm)} /km<br>${calc.formatTime(
				pacePerMile
			)} /mile`;
		} else if (state.currentTab === "time") {
			const pace = calc.parseTime(document.getElementById("time-pace").value);
			const dist = parseFloat(document.getElementById("time-distance").value);
			if (!pace || !dist) throw new Error("Missing inputs");
			const totalSeconds = calc.calculateTime(
				pace,
				dist,
				state.distanceUnit,
				state.distanceUnit
			);
			label = "Your Time:";
			value = calc.formatTime(totalSeconds, true);
		} else if (state.currentTab === "distance") {
			const time = calc.parseTime(
				document.getElementById("distance-time").value
			);
			const pace = calc.parseTime(
				document.getElementById("distance-pace").value
			);
			if (!time || !pace) throw new Error("Missing inputs");
			const { km, miles } = calc.calculateDistance(
				time,
				pace,
				state.distanceUnit
			);
			label = "Your Distance:";
			value = `${km.toFixed(2)} km<br>${miles.toFixed(2)} miles`;
		}
		showResult(label, value);
	} catch (err) {
		alert("Please check your inputs. All fields are required.");
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

function clearAll() {
	form.reset();
	resultDiv.classList.add("hidden");
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