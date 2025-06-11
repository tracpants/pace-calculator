/**
 * Robust DOM-ready utility for reliable initialization
 * Handles all timing scenarios and provides comprehensive error handling
 */

/**
 * Wait for DOM to be fully ready
 * @returns {Promise} Resolves when DOM is ready
 */
export function waitForDOM() {
  return new Promise((resolve) => {
    if (document.readyState === 'loading') {
      // DOM is still loading
      document.addEventListener('DOMContentLoaded', resolve, { once: true });
    } else {
      // DOM is already loaded
      resolve();
    }
  });
}

/**
 * Wait for a specific element to be available
 * @param {string} selector - CSS selector for the element
 * @param {number} timeout - Maximum time to wait in ms (default 5000)
 * @returns {Promise<Element>} Resolves with the element when found
 */
export function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Timeout fallback
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Wait for multiple elements to be available
 * @param {string[]} selectors - Array of CSS selectors
 * @param {number} timeout - Maximum time to wait in ms (default 5000)
 * @returns {Promise<Element[]>} Resolves with array of elements when all found
 */
export function waitForElements(selectors, timeout = 5000) {
  return Promise.all(
    selectors.map(selector => waitForElement(selector, timeout))
  );
}

/**
 * Safely get an element with error handling
 * @param {string} id - Element ID
 * @param {boolean} required - Whether element is required (default true)
 * @returns {Element|null} The element or null if not found and not required
 */
export function safeGetElement(id, required = true) {
  const element = document.getElementById(id);
  
  if (!element && required) {
    throw new Error(`Required element not found: ${id}`);
  }
  
  if (!element) {
    console.warn(`⚠️ Optional element not found: ${id}`);
  }
  
  return element;
}

/**
 * Safely get multiple elements with error handling
 * @param {string[]} ids - Array of element IDs
 * @param {boolean} allRequired - Whether all elements are required (default true)
 * @returns {Object} Object with element IDs as keys and elements as values
 */
export function safeGetElements(ids, allRequired = true) {
  const elements = {};
  const missing = [];
  
  for (const id of ids) {
    const element = document.getElementById(id);
    if (element) {
      elements[id] = element;
    } else {
      missing.push(id);
      elements[id] = null;
    }
  }
  
  if (missing.length > 0) {
    if (allRequired) {
      throw new Error(`Required elements not found: ${missing.join(', ')}`);
    } else {
      console.warn(`⚠️ Some elements not found: ${missing.join(', ')}`);
    }
  }
  
  return elements;
}

/**
 * Add event listener with error handling
 * @param {Element|null} element - The element to add listener to
 * @param {string} event - Event type
 * @param {Function} handler - Event handler
 * @param {string} elementName - Name for error reporting
 * @param {Object} options - Event listener options
 */
export function safeAddEventListener(element, event, handler, elementName = 'unknown', options = {}) {
  if (!element) {
    console.warn(`⚠️ Cannot add ${event} listener to ${elementName}: element is null`);
    return false;
  }
  
  try {
    element.addEventListener(event, handler, options);
    console.log(`✅ Added ${event} listener to ${elementName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to add ${event} listener to ${elementName}:`, error);
    return false;
  }
}

/**
 * Initialize with proper DOM readiness and error handling
 * @param {Function} initFunction - The initialization function to call
 * @param {Object} options - Configuration options
 * @returns {Promise} Resolves when initialization is complete
 */
export async function robustInit(initFunction, options = {}) {
  const {
    name = 'Application',
    timeout = 10000,
    requiredElements = [],
    retries = 3
  } = options;
  
  console.log(`🚀 Starting robust initialization for ${name}`);
  
  try {
    // Wait for DOM to be ready
    await waitForDOM();
    console.log('✅ DOM is ready');
    
    // Wait for required elements if specified
    if (requiredElements.length > 0) {
      await waitForElements(requiredElements, timeout);
      console.log('✅ All required elements found');
    }
    
    // Small delay to ensure everything is settled
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Call the initialization function
    const result = await initFunction();
    console.log(`✅ ${name} initialized successfully`);
    
    return result;
  } catch (error) {
    console.error(`❌ ${name} initialization failed:`, error);
    
    // Retry logic
    if (retries > 0) {
      console.log(`🔄 Retrying ${name} initialization (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 100));
      return robustInit(initFunction, { ...options, retries: retries - 1 });
    }
    
    throw error;
  }
}