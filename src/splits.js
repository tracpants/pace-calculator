import * as calc from "./calculator.js";
import { state } from "./state.js";
import { getSegmentedPaceValue } from "./utils/time-utils.js";

function generateRaceSplits() {
  if (!state.lastResult) return null;

  const { type, data } = state.lastResult;
  let distance;
  let pacePerUnit;

  if (type === "pace") {
    const distInput = document.getElementById("pace-distance");
    distance = parseFloat(distInput?.value);
    pacePerUnit = state.distanceUnit === "km" ? data.pacePerKm : data.pacePerMile;
  } else if (type === "time") {
    const distInput = document.getElementById("time-distance");
    distance = parseFloat(distInput?.value);
    pacePerUnit = getSegmentedPaceValue("time-pace");
  } else if (type === "distance") {
    distance = state.distanceUnit === "km" ? data.km : data.miles;
    pacePerUnit = getSegmentedPaceValue("distance-pace");
  } else {
    return null;
  }

  if (!distance || !pacePerUnit || distance < 0.5) return null;

  const unit = state.distanceUnit;
  const splits = [];
  const totalSplits = Math.floor(distance);

  for (let i = 1; i <= totalSplits; i++) {
    const cumulativeTime = pacePerUnit * i;
    splits.push({
      distance: i,
      unit,
      time: calc.formatTime(cumulativeTime, true),
      timeSeconds: cumulativeTime,
    });
  }

  const remainder = distance - totalSplits;
  if (remainder > 0.01) {
    const cumulativeTime = pacePerUnit * distance;
    splits.push({
      distance: calc.formatDistance(distance),
      unit,
      time: calc.formatTime(cumulativeTime, true),
      timeSeconds: cumulativeTime,
      isFinish: true,
    });
  }

  return {
    splits,
    totalDistance: distance,
    unit,
    pacePerUnit,
  };
}

function createSplitsAccordion() {
  const splitsData = generateRaceSplits();
  if (!splitsData) return "";

  const { splits, totalDistance, pacePerUnit } = splitsData;

  const splitsHtml = splits
    .map(split => {
      const label = split.isFinish ? `Finish (${split.distance} ${state.distanceUnit})` : `${split.distance} ${state.distanceUnit}`;
      const splitClass = split.isFinish ? "font-semibold border-t pt-2 mt-1" : "";
      return `
        <div class="splits-row flex justify-between items-center py-1 px-2 ${splitClass}">
          <span class="text-sm">${label}</span>
          <span class="font-mono text-sm">${split.time}</span>
        </div>
      `;
    })
    .join("");

  return `
    <div class="mt-4 border rounded-lg overflow-hidden" style="border-color: var(--color-border-subtle);">
      <button
        id="splits-toggle"
        class="w-full flex items-center justify-between py-3 px-4 text-left transition-colors"
        style="background: linear-gradient(to right, var(--color-surface), var(--color-surface-secondary)); border-bottom: 1px solid var(--color-border-subtle);"
        aria-expanded="false"
        aria-controls="splits-content"
      >
        <div class="flex items-center">
          <svg class="w-4 h-4 mr-2" style="color: var(--color-interactive-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span class="text-sm font-medium" style="color: var(--color-text-primary);">Race Splits (${calc.formatDistance(totalDistance)} ${state.distanceUnit})</span>
        </div>
        <svg id="splits-chevron" class="w-4 h-4 transition-transform duration-200" style="color: var(--color-text-tertiary);" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
      </button>
      <div
        id="splits-content"
        class="hidden px-4 py-3"
        style="background-color: var(--color-surface);"
        aria-hidden="true"
      >
        <div class="flex justify-between items-center pb-2 mb-3 border-b text-xs font-semibold uppercase tracking-wide" style="border-color: var(--color-border-subtle); color: var(--color-text-tertiary);">
          <span>Distance</span>
          <span>Cumulative Time</span>
        </div>
        <div class="space-y-1">
          ${splitsHtml}
        </div>
        <div class="text-xs mt-3 pt-3 border-t font-medium" style="border-color: var(--color-border-subtle); color: var(--color-text-secondary);">
          Average Pace: ${calc.formatTime(pacePerUnit)} /${state.distanceUnit}
        </div>
      </div>
    </div>
  `;
}

function scrollToExpandedSplits() {
  const content = document.getElementById("splits-content");
  if (!content || content.classList.contains("hidden")) return;

  const rect = content.getBoundingClientRect();
  const viewportHeight = window.innerHeight;

  if (rect.bottom > viewportHeight) {
    const scrollOffset = rect.bottom - viewportHeight + 20;
    const currentScrollTop = window.pageYOffset;
    window.scrollTo({ top: currentScrollTop + scrollOffset, behavior: "smooth" });
  }
}

function setupSplitsAccordion() {
  const toggle = document.getElementById("splits-toggle");
  const content = document.getElementById("splits-content");
  const chevron = document.getElementById("splits-chevron");

  if (!toggle || !content || !chevron) return;

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";

    if (expanded) {
      content.classList.add("hidden");
      content.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
      chevron.style.transform = "rotate(0deg)";
    } else {
      content.classList.remove("hidden");
      content.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
      chevron.style.transform = "rotate(180deg)";

      setTimeout(() => {
        scrollToExpandedSplits();
      }, 100);
    }
  });
}

export { generateRaceSplits, createSplitsAccordion, setupSplitsAccordion };

