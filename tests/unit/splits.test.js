import { describe, it, expect } from 'vitest';
import { createSplitsAccordion, generateRaceSplits } from '../../src/splits.js';
import { state } from '../../src/state.js';

describe('race splits', () => {
  it('creates split rows for pace result', () => {
    document.body.innerHTML = '<input id="pace-distance" value="5" />';
    state.currentTab = 'pace';
    state.distanceUnit = 'km';
    state.lastResult = { type: 'pace', pacePerKm: 300, pacePerMile: 0 };

    const data = generateRaceSplits();
    expect(data.splits).toHaveLength(5);

    const html = createSplitsAccordion();
    const container = document.createElement('div');
    container.innerHTML = html;
    const rows = container.querySelectorAll('.splits-row');
    expect(rows.length).toBe(5);
    expect(html).toContain('Race Splits');
  });
});
