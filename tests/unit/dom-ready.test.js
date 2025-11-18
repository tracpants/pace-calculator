import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  waitForDOM,
  waitForElement,
  waitForElements,
  safeGetElement,
  safeGetElements,
  safeAddEventListener,
  robustInit
} from '../../src/dom-ready.js';

describe('DOM Ready Utilities', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('waitForDOM', () => {
    it('should resolve immediately if DOM is already loaded', async () => {
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete'
      });

      const startTime = Date.now();
      await waitForDOM();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50);
    });

    it('should resolve immediately if DOM is interactive', async () => {
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'interactive'
      });

      await waitForDOM();
      expect(true).toBe(true);
    });
  });

  describe('waitForElement', () => {
    it('should resolve immediately if element exists', async () => {
      document.body.innerHTML = '<div id="test-element"></div>';

      const element = await waitForElement('#test-element');
      expect(element).toBeTruthy();
      expect(element.id).toBe('test-element');
    });

    it('should wait for element to appear', async () => {
      const promise = waitForElement('#dynamic-element', 1000);

      setTimeout(() => {
        const div = document.createElement('div');
        div.id = 'dynamic-element';
        document.body.appendChild(div);
      }, 100);

      const element = await promise;
      expect(element).toBeTruthy();
      expect(element.id).toBe('dynamic-element');
    });

    it('should reject if element not found within timeout', async () => {
      await expect(
        waitForElement('#nonexistent', 100)
      ).rejects.toThrow('Element #nonexistent not found within 100ms');
    });

    it('should detect element added to nested structure', async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const promise = waitForElement('.nested-element', 500);

      setTimeout(() => {
        const nested = document.createElement('div');
        nested.className = 'nested-element';
        container.appendChild(nested);
      }, 50);

      const element = await promise;
      expect(element.className).toBe('nested-element');
    });
  });

  describe('waitForElements', () => {
    it('should wait for multiple elements', async () => {
      const promise = waitForElements(['#elem1', '#elem2', '#elem3'], 1000);

      setTimeout(() => {
        ['elem1', 'elem2', 'elem3'].forEach(id => {
          const div = document.createElement('div');
          div.id = id;
          document.body.appendChild(div);
        });
      }, 50);

      const elements = await promise;
      expect(elements).toHaveLength(3);
      expect(elements[0].id).toBe('elem1');
      expect(elements[1].id).toBe('elem2');
      expect(elements[2].id).toBe('elem3');
    });

    it('should resolve immediately if all elements exist', async () => {
      document.body.innerHTML = `
        <div id="a"></div>
        <div id="b"></div>
        <div id="c"></div>
      `;

      const elements = await waitForElements(['#a', '#b', '#c']);
      expect(elements).toHaveLength(3);
    });

    it('should reject if any element times out', async () => {
      document.body.innerHTML = '<div id="exists"></div>';

      await expect(
        waitForElements(['#exists', '#missing'], 100)
      ).rejects.toThrow();
    });
  });

  describe('safeGetElement', () => {
    it('should return element if it exists', () => {
      document.body.innerHTML = '<div id="test-div"></div>';
      const element = safeGetElement('test-div');
      expect(element).toBeTruthy();
      expect(element.id).toBe('test-div');
    });

    it('should throw error if required element not found', () => {
      expect(() => {
        safeGetElement('missing-element', true);
      }).toThrow('Required element not found: missing-element');
    });

    it('should return null if optional element not found', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const element = safeGetElement('optional-element', false);

      expect(element).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Optional element not found: optional-element'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should default to required=true', () => {
      expect(() => {
        safeGetElement('missing');
      }).toThrow('Required element not found: missing');
    });
  });

  describe('safeGetElements', () => {
    it('should return object with all elements', () => {
      document.body.innerHTML = `
        <div id="elem1"></div>
        <div id="elem2"></div>
        <div id="elem3"></div>
      `;

      const elements = safeGetElements(['elem1', 'elem2', 'elem3']);
      expect(elements.elem1).toBeTruthy();
      expect(elements.elem2).toBeTruthy();
      expect(elements.elem3).toBeTruthy();
    });

    it('should throw if any required element missing', () => {
      document.body.innerHTML = '<div id="elem1"></div>';

      expect(() => {
        safeGetElements(['elem1', 'missing'], true);
      }).toThrow('Required elements not found: missing');
    });

    it('should warn but not throw if optional elements missing', () => {
      document.body.innerHTML = '<div id="elem1"></div>';
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const elements = safeGetElements(['elem1', 'missing'], false);

      expect(elements.elem1).toBeTruthy();
      expect(elements.missing).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Some elements not found: missing'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle multiple missing elements', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const elements = safeGetElements(['missing1', 'missing2'], false);

      expect(elements.missing1).toBeNull();
      expect(elements.missing2).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('safeAddEventListener', () => {
    it('should add event listener successfully', () => {
      const element = document.createElement('button');
      const handler = vi.fn();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = safeAddEventListener(element, 'click', handler, 'test-button');

      expect(result).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Added click listener to test-button');

      element.click();
      expect(handler).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should warn if element is null', () => {
      const handler = vi.fn();
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = safeAddEventListener(null, 'click', handler, 'null-element');

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ Cannot add click listener to null-element: element is null'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle addEventListener errors', () => {
      const element = document.createElement('button');
      const handler = vi.fn();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.spyOn(element, 'addEventListener').mockImplementation(() => {
        throw new Error('Mock error');
      });

      const result = safeAddEventListener(element, 'click', handler, 'error-element');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should support event listener options', () => {
      const element = document.createElement('button');
      const handler = vi.fn();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      safeAddEventListener(element, 'click', handler, 'once-button', { once: true });

      element.click();
      element.click();

      expect(handler).toHaveBeenCalledTimes(1);

      consoleLogSpy.mockRestore();
    });

    it('should use "unknown" as default element name', () => {
      const element = document.createElement('button');
      const handler = vi.fn();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      safeAddEventListener(element, 'click', handler);

      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Added click listener to unknown');

      consoleLogSpy.mockRestore();
    });
  });

  describe('robustInit', () => {
    it('should initialize function successfully', async () => {
      const initFn = vi.fn(async () => 'initialized');
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await robustInit(initFn, { name: 'TestApp' });

      expect(result).toBe('initialized');
      expect(initFn).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '🚀 Starting robust initialization for TestApp'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ TestApp initialized successfully');

      consoleLogSpy.mockRestore();
    });

    it('should wait for required elements', async () => {
      document.body.innerHTML = '<div id="required-elem"></div>';
      const initFn = vi.fn(async () => 'done');
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await robustInit(initFn, {
        name: 'TestApp',
        requiredElements: ['#required-elem'],
        timeout: 1000
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('✅ All required elements found');

      consoleLogSpy.mockRestore();
    });

    it('should retry on failure', async () => {
      let attemptCount = 0;
      const initFn = vi.fn(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Initialization failed');
        }
        return 'success';
      });

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await robustInit(initFn, {
        name: 'RetryApp',
        retries: 3
      });

      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should throw after all retries exhausted', async () => {
      const initFn = vi.fn(async () => {
        throw new Error('Persistent failure');
      });

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        robustInit(initFn, { name: 'FailApp', retries: 2 })
      ).rejects.toThrow('Persistent failure');

      expect(initFn).toHaveBeenCalledTimes(3); // initial + 2 retries

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should use default options', async () => {
      const initFn = vi.fn(async () => 'ok');
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await robustInit(initFn);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '🚀 Starting robust initialization for Application'
      );

      consoleLogSpy.mockRestore();
    });

    it('should handle timeout when waiting for elements', async () => {
      const initFn = vi.fn(async () => 'done');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        robustInit(initFn, {
          name: 'TimeoutApp',
          requiredElements: ['#nonexistent'],
          timeout: 100,
          retries: 0
        })
      ).rejects.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });
});
