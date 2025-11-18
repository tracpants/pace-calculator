/**
 * Centralized State Management System
 *
 * Provides a single source of truth for all application state with:
 * - Immutable state updates
 * - Event-driven notifications
 * - State validation
 * - Automatic localStorage persistence
 * - Path-based state access
 */

import { logger } from "./utils/logger.js";

const STATE_SCHEMA = {
	app: {
		currentTab: { type: 'string', enum: ['pace', 'time', 'distance'], default: 'pace' },
		lastResult: { type: 'object', nullable: true, default: null },
		tabStates: {
			type: 'object',
			default: () => ({
				pace: { inputs: {}, validationStates: {}, result: null, presetSelection: '' },
				time: { inputs: {}, validationStates: {}, result: null, presetSelection: '' },
				distance: { inputs: {}, validationStates: {}, result: null, presetSelection: '' }
			})
		}
	},
	settings: {
		distanceUnit: { type: 'string', enum: ['km', 'miles'], default: 'km' },
		theme: { type: 'string', enum: ['light', 'dark', 'system'], default: 'system' },
		defaultDistance: { type: 'string', nullable: true, default: null },
		accentColor: { type: 'string', default: 'indigo' }
	},
	autoAdvance: {
		enabledInputs: { type: 'set', default: () => new Set() },
		previousValues: { type: 'weakmap', default: () => new WeakMap() }
	},
	touch: {
		startX: { type: 'number', default: 0 },
		startY: { type: 'number', default: 0 },
		startTime: { type: 'number', default: 0 },
		isTracking: { type: 'boolean', default: false }
	},
	prManagement: {
		editingPR: { type: 'object', nullable: true, default: null }
	}
};

class StateManager {
	constructor() {
		this._state = this._initializeState();
		this._listeners = new Map();
		this._persistenceConfig = new Map();

		// Setup persistence configuration before hydration
		this._setupPersistence();
		this.hydrate();
	}

	_setupPersistence() {
		// Configure which state paths should persist to localStorage
		this.persist('settings.distanceUnit', 'pace-calculator-settings-unit');
		this.persist('settings.theme', 'pace-calculator-settings-theme');
		this.persist('settings.defaultDistance', 'pace-calculator-settings-default-distance');
		this.persist('settings.accentColor', 'pace-calculator-settings-accent-color');
	}

	_initializeState() {
		const state = {};

		for (const [category, fields] of Object.entries(STATE_SCHEMA)) {
			state[category] = {};
			for (const [field, config] of Object.entries(fields)) {
				if (typeof config.default === 'function') {
					state[category][field] = config.default();
				} else {
					state[category][field] = config.default;
				}
			}
		}

		return state;
	}

	_parsePath(path) {
		return path.split('.');
	}

	_getNestedValue(obj, pathArray) {
		return pathArray.reduce((current, key) => current?.[key], obj);
	}

	_setNestedValue(obj, pathArray, value) {
		const newObj = this._deepClone(obj);
		let current = newObj;

		for (let i = 0; i < pathArray.length - 1; i++) {
			const key = pathArray[i];
			if (!(key in current)) {
				current[key] = {};
			}
			current = current[key];
		}

		current[pathArray[pathArray.length - 1]] = value;
		return newObj;
	}

	_deepClone(obj) {
		if (obj === null || typeof obj !== 'object') {
			return obj;
		}

		if (obj instanceof Set || obj instanceof WeakMap) {
			return obj;
		}

		if (obj instanceof Date) {
			return new Date(obj);
		}

		if (Array.isArray(obj)) {
			return obj.map(item => this._deepClone(item));
		}

		const cloned = {};
		for (const key in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, key)) {
				cloned[key] = this._deepClone(obj[key]);
			}
		}

		return cloned;
	}

	_validateValue(path, value) {
		const pathArray = this._parsePath(path);

		if (pathArray.length !== 2) {
			return { valid: false, message: 'Invalid path format. Use "category.field"' };
		}

		const [category, field] = pathArray;
		const schema = STATE_SCHEMA[category]?.[field];

		if (!schema) {
			return { valid: false, message: `Unknown state path: ${path}` };
		}

		if (value === null && !schema.nullable) {
			return { valid: false, message: `${path} cannot be null` };
		}

		if (value !== null) {
			if (schema.enum && !schema.enum.includes(value)) {
				return { valid: false, message: `${path} must be one of: ${schema.enum.join(', ')}` };
			}

			if (schema.type === 'string' && typeof value !== 'string') {
				return { valid: false, message: `${path} must be a string` };
			}

			if (schema.type === 'number' && typeof value !== 'number') {
				return { valid: false, message: `${path} must be a number` };
			}

			if (schema.type === 'boolean' && typeof value !== 'boolean') {
				return { valid: false, message: `${path} must be a boolean` };
			}

			if (schema.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
				return { valid: false, message: `${path} must be an object` };
			}

			if (schema.type === 'set' && !(value instanceof Set)) {
				return { valid: false, message: `${path} must be a Set` };
			}

			if (schema.type === 'weakmap' && !(value instanceof WeakMap)) {
				return { valid: false, message: `${path} must be a WeakMap` };
			}
		}

		return { valid: true };
	}

	get(path) {
		const pathArray = this._parsePath(path);
		const value = this._getNestedValue(this._state, pathArray);
		return this._deepClone(value);
	}

	getState() {
		return this._deepClone(this._state);
	}

	set(path, value) {
		const validation = this._validateValue(path, value);
		if (!validation.valid) {
			logger.error(`State validation error: ${validation.message}`);
			throw new Error(validation.message);
		}

		const pathArray = this._parsePath(path);
		const oldValue = this._getNestedValue(this._state, pathArray);

		if (oldValue === value) {
			return;
		}

		this._state = this._setNestedValue(this._state, pathArray, value);

		this._notifyListeners(path, value, oldValue);

		if (this._persistenceConfig.has(path)) {
			this._persistValue(path, value);
		}
	}

	update(path, updater) {
		const currentValue = this.get(path);
		const newValue = updater(currentValue);
		this.set(path, newValue);
	}

	subscribe(path, callback) {
		if (!this._listeners.has(path)) {
			this._listeners.set(path, new Set());
		}
		this._listeners.get(path).add(callback);

		return () => this.unsubscribe(path, callback);
	}

	unsubscribe(path, callback) {
		const listeners = this._listeners.get(path);
		if (listeners) {
			listeners.delete(callback);
			if (listeners.size === 0) {
				this._listeners.delete(path);
			}
		}
	}

	_notifyListeners(path, newValue, oldValue) {
		const listeners = this._listeners.get(path);
		if (listeners) {
			listeners.forEach(callback => {
				try {
					callback(newValue, oldValue);
				} catch (error) {
					logger.error(`Error in state listener for ${path}:`, error);
				}
			});
		}

		const pathArray = this._parsePath(path);
		if (pathArray.length > 1) {
			const parentPath = pathArray.slice(0, -1).join('.');
			const parentListeners = this._listeners.get(parentPath);
			if (parentListeners) {
				const parentValue = this.get(parentPath);
				parentListeners.forEach(callback => {
					try {
						callback(parentValue, parentValue);
					} catch (error) {
						logger.error(`Error in parent listener for ${parentPath}:`, error);
					}
				});
			}
		}
	}

	persist(path, storageKey) {
		this._persistenceConfig.set(path, storageKey);

		// Only persist current value if there's no existing stored value
		// This prevents overwriting existing localStorage during initialization
		const existing = localStorage.getItem(storageKey);
		if (!existing) {
			const currentValue = this.get(path);
			if (currentValue !== null && currentValue !== undefined) {
				this._persistValue(path, currentValue);
			}
		}
	}

	_persistValue(path, value) {
		const storageKey = this._persistenceConfig.get(path);
		if (!storageKey) return;

		try {
			if (value instanceof Set || value instanceof WeakMap) {
				logger.warn(`Cannot persist ${path}: Sets and WeakMaps are not serializable`);
				return;
			}

			localStorage.setItem(storageKey, JSON.stringify(value));
		} catch (error) {
			logger.error(`Failed to persist ${path} to localStorage:`, error);
		}
	}

	hydrate() {
		for (const [path, storageKey] of this._persistenceConfig.entries()) {
			try {
				const stored = localStorage.getItem(storageKey);
				if (stored) {
					const value = JSON.parse(stored);
					const pathArray = this._parsePath(path);
					this._state = this._setNestedValue(this._state, pathArray, value);
				}
			} catch (error) {
				logger.warn(`Failed to hydrate ${path} from localStorage:`, error);
			}
		}
	}

	reset(path) {
		const pathArray = this._parsePath(path);

		if (pathArray.length !== 2) {
			logger.error('Reset requires a full path (category.field)');
			return;
		}

		const [category, field] = pathArray;
		const schema = STATE_SCHEMA[category]?.[field];

		if (!schema) {
			logger.error(`Unknown state path: ${path}`);
			return;
		}

		const defaultValue = typeof schema.default === 'function'
			? schema.default()
			: schema.default;

		this.set(path, defaultValue);
	}

	resetAll() {
		this._state = this._initializeState();

		this._listeners.forEach((listeners, path) => {
			const value = this.get(path);
			listeners.forEach(callback => {
				try {
					callback(value, undefined);
				} catch (error) {
					logger.error(`Error in reset listener for ${path}:`, error);
				}
			});
		});
	}
}

const stateManager = new StateManager();

export { stateManager };
export default stateManager;
