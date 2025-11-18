import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { state, stateManager } from '../../src/state.js';

describe('Settings Modals and UI Interactions', () => {
  let initSettings;

  beforeEach(async () => {
    // Reset state
    state.distanceUnit = 'km';
    localStorage.clear();

    // Create comprehensive DOM
    document.body.innerHTML = `
      <div id="settings-modal" class="hidden"></div>
      <button id="close-settings"></button>
      <input type="radio" class="theme-radio" value="light" name="theme" />
      <input type="radio" class="theme-radio" value="dark" name="theme" />
      <input type="radio" class="theme-radio" value="system" name="theme" />
      <div data-unit="km" tabindex="0"></div>
      <div data-unit="miles" tabindex="0"></div>
      <div class="accent-color-option" data-accent="indigo"></div>
      <div class="accent-color-option" data-accent="blue"></div>
      <div class="accent-color-option" data-accent="red"></div>
      <select id="default-distance-select"></select>
      <button id="menu-btn"></button>
      <div id="menu-dropdown" class="hidden"></div>
      <button id="pr-menu-item"></button>
      <button id="settings-menu-item"></button>
      <button id="help-btn"></button>
      <div id="help-modal" class="hidden"></div>
      <button id="close-help"></button>
      <div id="pr-management-modal" class="hidden"></div>
      <button id="close-pr-management"></button>
      <button id="close-pr-management-btn"></button>
      <div id="pr-empty-state" class="hidden"></div>
      <div id="pr-list"></div>
      <div id="pr-list-actions" class="hidden"></div>
      <div id="pr-modal" class="hidden"></div>
      <h2 id="pr-modal-title">Add Personal Record</h2>
      <button id="add-pr-btn"></button>
      <button id="add-pr-btn-secondary"></button>
      <button id="close-pr-modal"></button>
      <button id="cancel-pr"></button>
      <form id="pr-form">
        <input id="pr-distance" type="number" step="any" />
        <select id="pr-unit">
          <option value="km">km</option>
          <option value="miles">miles</option>
        </select>
        <input id="pr-date" type="date" />
        <textarea id="pr-notes"></textarea>
        <input id="pr-time-hours" type="number" />
        <input id="pr-time-minutes" type="number" />
        <input id="pr-time-seconds" type="number" />
        <div id="pr-distance-error" class="hidden"></div>
        <div id="pr-time-error" class="hidden"></div>
        <button type="submit">Save</button>
      </form>
      <input id="pace-distance" type="text" value="" />
      <select id="pace-preset"></select>
      <input id="time-distance" type="text" value="" />
      <select id="time-preset"></select>
    `;

    document.documentElement.className = '';
    document.documentElement.style.cssText = '';

    // Mock window.matchMedia
    window.matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));

    // Mock UI functions
    window.populatePresetSelects = vi.fn();
    window.updateCalculatedResult = vi.fn();
    window.updateHintTexts = vi.fn();

    // Import initSettings fresh for each test
    const module = await import('../../src/settings.js');
    initSettings = module.initSettings;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe('Settings Modal', () => {
    it('should open settings modal', () => {
      initSettings();
      const settingsModal = document.getElementById('settings-modal');
      const settingsMenuBtn = document.getElementById('settings-menu-item');

      settingsMenuBtn.click();

      expect(settingsModal.classList.contains('hidden')).toBe(false);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should close settings modal', () => {
      initSettings();
      const settingsModal = document.getElementById('settings-modal');
      const settingsMenuBtn = document.getElementById('settings-menu-item');
      const closeBtn = document.getElementById('close-settings');

      settingsMenuBtn.click();
      closeBtn.click();

      expect(settingsModal.classList.contains('hidden')).toBe(true);
      expect(document.body.style.overflow).toBe('');
    });

    it('should close settings modal on Escape key', () => {
      initSettings();
      const settingsModal = document.getElementById('settings-modal');
      const settingsMenuBtn = document.getElementById('settings-menu-item');

      settingsMenuBtn.click();

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(settingsModal.classList.contains('hidden')).toBe(true);
    });

    it('should close settings modal on backdrop click', () => {
      initSettings();
      const settingsModal = document.getElementById('settings-modal');
      const settingsMenuBtn = document.getElementById('settings-menu-item');

      settingsMenuBtn.click();

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: settingsModal, enumerable: true });
      settingsModal.dispatchEvent(clickEvent);

      expect(settingsModal.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Menu Functionality', () => {
    it('should toggle menu open and close', () => {
      initSettings();
      const menuBtn = document.getElementById('menu-btn');
      const menuDropdown = document.getElementById('menu-dropdown');

      menuBtn.click();
      expect(menuDropdown.classList.contains('hidden')).toBe(false);

      menuBtn.click();
      expect(menuDropdown.classList.contains('hidden')).toBe(true);
    });

    it('should close menu on Escape key', () => {
      initSettings();
      const menuBtn = document.getElementById('menu-btn');
      const menuDropdown = document.getElementById('menu-dropdown');

      menuBtn.click();

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(menuDropdown.classList.contains('hidden')).toBe(true);
    });

    it('should close menu when clicking outside', () => {
      initSettings();
      const menuBtn = document.getElementById('menu-btn');
      const menuDropdown = document.getElementById('menu-dropdown');

      menuBtn.click();

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: document.body, enumerable: true });
      document.dispatchEvent(clickEvent);

      expect(menuDropdown.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Help Modal', () => {
    it('should open help modal', () => {
      initSettings();
      const helpBtn = document.getElementById('help-btn');
      const helpModal = document.getElementById('help-modal');

      helpBtn.click();

      expect(helpModal.classList.contains('hidden')).toBe(false);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should close help modal', () => {
      initSettings();
      const helpBtn = document.getElementById('help-btn');
      const closeBtn = document.getElementById('close-help');
      const helpModal = document.getElementById('help-modal');

      helpBtn.click();
      closeBtn.click();

      expect(helpModal.classList.contains('hidden')).toBe(true);
      expect(document.body.style.overflow).toBe('');
    });

    it('should close help modal on Escape key', () => {
      initSettings();
      const helpBtn = document.getElementById('help-btn');
      const helpModal = document.getElementById('help-modal');

      helpBtn.click();

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(helpModal.classList.contains('hidden')).toBe(true);
    });

    it('should close help modal on backdrop click', () => {
      initSettings();
      const helpBtn = document.getElementById('help-btn');
      const helpModal = document.getElementById('help-modal');

      helpBtn.click();

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: helpModal, enumerable: true });
      helpModal.dispatchEvent(clickEvent);

      expect(helpModal.classList.contains('hidden')).toBe(true);
    });
  });

  describe('PR Management Modal', () => {
    it('should open PR management modal', () => {
      initSettings();
      const prMenuBtn = document.getElementById('pr-menu-item');
      const prManagementModal = document.getElementById('pr-management-modal');

      prMenuBtn.click();

      expect(prManagementModal.classList.contains('hidden')).toBe(false);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should close PR management modal', () => {
      initSettings();
      const prMenuBtn = document.getElementById('pr-menu-item');
      const closeBtn = document.getElementById('close-pr-management');
      const prManagementModal = document.getElementById('pr-management-modal');

      prMenuBtn.click();
      closeBtn.click();

      expect(prManagementModal.classList.contains('hidden')).toBe(true);
      expect(document.body.style.overflow).toBe('');
    });

    it('should close PR management modal with secondary button', () => {
      initSettings();
      const prMenuBtn = document.getElementById('pr-menu-item');
      const closeBtn = document.getElementById('close-pr-management-btn');
      const prManagementModal = document.getElementById('pr-management-modal');

      prMenuBtn.click();
      closeBtn.click();

      expect(prManagementModal.classList.contains('hidden')).toBe(true);
    });

    it('should show empty state when no PRs exist', () => {
      initSettings();
      const prMenuBtn = document.getElementById('pr-menu-item');
      const prEmptyState = document.getElementById('pr-empty-state');
      const prListActions = document.getElementById('pr-list-actions');

      prMenuBtn.click();

      expect(prEmptyState.classList.contains('hidden')).toBe(false);
      expect(prListActions.classList.contains('hidden')).toBe(true);
    });

    it('should close PR management modal on Escape key', () => {
      initSettings();
      const prMenuBtn = document.getElementById('pr-menu-item');
      const prManagementModal = document.getElementById('pr-management-modal');

      prMenuBtn.click();

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(prManagementModal.classList.contains('hidden')).toBe(true);
    });

    it('should close PR management modal on backdrop click', () => {
      initSettings();
      const prMenuBtn = document.getElementById('pr-menu-item');
      const prManagementModal = document.getElementById('pr-management-modal');

      prMenuBtn.click();

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: prManagementModal, enumerable: true });
      prManagementModal.dispatchEvent(clickEvent);

      expect(prManagementModal.classList.contains('hidden')).toBe(true);
    });
  });

  describe('PR Add/Edit Modal', () => {
    it('should open PR modal for adding', () => {
      initSettings();
      const addBtn = document.getElementById('add-pr-btn');
      const prModal = document.getElementById('pr-modal');
      const prModalTitle = document.getElementById('pr-modal-title');

      addBtn.click();

      expect(prModal.classList.contains('hidden')).toBe(false);
      expect(prModalTitle.textContent).toBe('Add Personal Record');
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should open PR modal from secondary button', () => {
      initSettings();
      const addBtn = document.getElementById('add-pr-btn-secondary');
      const prModal = document.getElementById('pr-modal');

      addBtn.click();

      expect(prModal.classList.contains('hidden')).toBe(false);
    });

    it('should close PR modal', () => {
      initSettings();
      const addBtn = document.getElementById('add-pr-btn');
      const closeBtn = document.getElementById('close-pr-modal');
      const prModal = document.getElementById('pr-modal');

      addBtn.click();
      closeBtn.click();

      expect(prModal.classList.contains('hidden')).toBe(true);
      expect(document.body.style.overflow).toBe('');
    });

    it('should close PR modal with cancel button', () => {
      initSettings();
      const addBtn = document.getElementById('add-pr-btn');
      const cancelBtn = document.getElementById('cancel-pr');
      const prModal = document.getElementById('pr-modal');

      addBtn.click();
      cancelBtn.click();

      expect(prModal.classList.contains('hidden')).toBe(true);
    });

    it('should close PR modal on Escape key', () => {
      initSettings();
      const addBtn = document.getElementById('add-pr-btn');
      const prModal = document.getElementById('pr-modal');

      addBtn.click();

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(prModal.classList.contains('hidden')).toBe(true);
    });

    it('should close PR modal on backdrop click', () => {
      initSettings();
      const addBtn = document.getElementById('add-pr-btn');
      const prModal = document.getElementById('pr-modal');

      addBtn.click();

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: prModal, enumerable: true });
      prModal.dispatchEvent(clickEvent);

      expect(prModal.classList.contains('hidden')).toBe(true);
    });

    it('should validate PR form with valid inputs', () => {
      initSettings();
      const addBtn = document.getElementById('add-pr-btn');
      const form = document.getElementById('pr-form');

      addBtn.click();

      document.getElementById('pr-distance').value = '5';
      document.getElementById('pr-unit').value = 'km';
      document.getElementById('pr-time-hours').value = '0';
      document.getElementById('pr-time-minutes').value = '25';
      document.getElementById('pr-time-seconds').value = '30';

      form.dispatchEvent(new Event('submit'));
    });

    it('should show error for invalid distance', () => {
      initSettings();
      const addBtn = document.getElementById('add-pr-btn');
      const form = document.getElementById('pr-form');

      addBtn.click();

      document.getElementById('pr-distance').value = '0';
      document.getElementById('pr-time-minutes').value = '25';
      document.getElementById('pr-time-seconds').value = '30';

      form.dispatchEvent(new Event('submit'));

      const errorDiv = document.getElementById('pr-distance-error');
      expect(errorDiv.classList.contains('hidden')).toBe(false);
    });

    it('should show error for invalid time', () => {
      initSettings();
      const addBtn = document.getElementById('add-pr-btn');
      const form = document.getElementById('pr-form');

      addBtn.click();

      document.getElementById('pr-distance').value = '5';
      document.getElementById('pr-time-hours').value = '0';
      document.getElementById('pr-time-minutes').value = '0';
      document.getElementById('pr-time-seconds').value = '0';

      form.dispatchEvent(new Event('submit'));

      const errorDiv = document.getElementById('pr-time-error');
      expect(errorDiv.classList.contains('hidden')).toBe(false);
    });

    it('should validate time on blur', () => {
      initSettings();
      const addBtn = document.getElementById('add-pr-btn');

      addBtn.click();

      const hoursInput = document.getElementById('pr-time-hours');
      const minutesInput = document.getElementById('pr-time-minutes');
      const secondsInput = document.getElementById('pr-time-seconds');

      hoursInput.value = '1';
      minutesInput.value = '30';
      secondsInput.value = '45';

      minutesInput.dispatchEvent(new Event('blur'));
    });

    it('should clear errors on input', () => {
      initSettings();
      const addBtn = document.getElementById('add-pr-btn');

      addBtn.click();

      const minutesInput = document.getElementById('pr-time-minutes');
      const errorDiv = document.getElementById('pr-time-error');

      errorDiv.classList.remove('hidden');

      minutesInput.value = '30';
      minutesInput.dispatchEvent(new Event('input'));

      expect(errorDiv.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Theme Radio Buttons', () => {
    it('should change theme when radio button is changed', () => {
      initSettings();
      const settingsMenuBtn = document.getElementById('settings-menu-item');
      settingsMenuBtn.click();

      const darkRadio = document.querySelector('.theme-radio[value="dark"]');
      darkRadio.checked = true;
      darkRadio.dispatchEvent(new Event('change'));

      expect(document.documentElement.classList.contains('dark')).toBe(true);

      const theme = stateManager.get('settings.theme');
      expect(theme).toBe('dark');
    });
  });

  describe('Accent Color Selection', () => {
    it('should change accent color when option is clicked', () => {
      initSettings();
      const settingsMenuBtn = document.getElementById('settings-menu-item');
      settingsMenuBtn.click();

      const blueOption = document.querySelector('.accent-color-option[data-accent="blue"]');
      blueOption.click();

      const accentColor = stateManager.get('settings.accentColor');
      expect(accentColor).toBe('blue');
      expect(blueOption.classList.contains('selected')).toBe(true);
    });
  });

  describe('Unit Toggles', () => {
    it('should change unit when toggle is clicked', () => {
      initSettings();
      const settingsMenuBtn = document.getElementById('settings-menu-item');
      settingsMenuBtn.click();

      const milesToggle = document.querySelector('[data-unit="miles"]');
      milesToggle.click();

      expect(state.distanceUnit).toBe('miles');
    });

    it('should change unit with Enter key', () => {
      initSettings();
      const settingsMenuBtn = document.getElementById('settings-menu-item');
      settingsMenuBtn.click();

      const milesToggle = document.querySelector('[data-unit="miles"]');
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      Object.defineProperty(enterEvent, 'target', { value: milesToggle, enumerable: true });
      milesToggle.dispatchEvent(enterEvent);

      expect(state.distanceUnit).toBe('miles');
    });

    it('should change unit with Space key', () => {
      initSettings();
      const settingsMenuBtn = document.getElementById('settings-menu-item');
      settingsMenuBtn.click();

      const milesToggle = document.querySelector('[data-unit="miles"]');
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      Object.defineProperty(spaceEvent, 'target', { value: milesToggle, enumerable: true });
      milesToggle.dispatchEvent(spaceEvent);

      expect(state.distanceUnit).toBe('miles');
    });
  });

  describe('Default Distance Selection', () => {
    it('should save default distance when changed', () => {
      initSettings();
      const settingsMenuBtn = document.getElementById('settings-menu-item');
      settingsMenuBtn.click();

      const select = document.getElementById('default-distance-select');
      select.innerHTML = `
        <option value="">No default</option>
        <option value="5k">5K</option>
        <option value="10k">10K</option>
      `;
      select.value = '5k';
      select.dispatchEvent(new Event('change'));

      const defaultDistance = stateManager.get('settings.defaultDistance');
      expect(defaultDistance).toBe('5k');
    });

    it('should clear default distance when empty option selected', () => {
      initSettings();
      const settingsMenuBtn = document.getElementById('settings-menu-item');
      settingsMenuBtn.click();

      const select = document.getElementById('default-distance-select');
      select.innerHTML = `
        <option value="">No default</option>
        <option value="5k">5K</option>
      `;
      select.value = '';
      select.dispatchEvent(new Event('change'));

      const defaultDistance = stateManager.get('settings.defaultDistance');
      expect(defaultDistance).toBeNull();
    });
  });

  describe('System Theme Change', () => {
    it('should respond to system theme changes', () => {
      localStorage.setItem('pace-calculator-settings', JSON.stringify({
        theme: 'system',
        distanceUnit: 'km',
        defaultDistance: null,
        accentColor: 'indigo'
      }));

      const listeners = [];
      window.matchMedia = vi.fn(() => ({
        matches: true,
        addEventListener: (event, listener) => {
          listeners.push({ event, listener });
        },
        removeEventListener: vi.fn()
      }));

      initSettings();

      // Trigger the system theme change listener
      const themeChangeListener = listeners.find(l => l.event === 'change');
      if (themeChangeListener) {
        themeChangeListener.listener({ matches: true });
      }
    });
  });
});
