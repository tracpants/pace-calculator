export {
	waitForDOM,
	waitForElement,
	waitForElements,
	safeGetElement,
	safeGetElements,
	safeAddEventListener,
	robustInit
} from '../dom-ready.js';

export function showElement(element) {
	if (element) {
		element.classList.remove('hidden');
	}
}

export function hideElement(element) {
	if (element) {
		element.classList.add('hidden');
	}
}

export function toggleElement(element, show) {
	if (element) {
		if (show) {
			element.classList.remove('hidden');
		} else {
			element.classList.add('hidden');
		}
	}
}

export function addClass(element, ...classes) {
	if (element) {
		element.classList.add(...classes);
	}
}

export function removeClass(element, ...classes) {
	if (element) {
		element.classList.remove(...classes);
	}
}

export function hasClass(element, className) {
	return element?.classList.contains(className) || false;
}

export function setText(element, text) {
	if (element) {
		element.textContent = text;
	}
}

export function setHTML(element, html) {
	if (element) {
		element.innerHTML = html;
	}
}

export function getValue(inputId) {
	const input = document.getElementById(inputId);
	return input?.value || '';
}

export function setValue(inputId, value) {
	const input = document.getElementById(inputId);
	if (input) {
		input.value = value;
	}
}

export function clearInputs(selector) {
	const inputs = document.querySelectorAll(selector);
	inputs.forEach(input => {
		input.value = '';
		input.classList.remove('error', 'valid');
	});
}

export function scrollToElement(element, options = {}) {
	if (!element) return;

	const {
		behavior = 'smooth',
		block = 'start',
		inline = 'nearest'
	} = options;

	element.scrollIntoView({ behavior, block, inline });
}

export function isElementVisible(element) {
	if (!element) return false;

	const rect = element.getBoundingClientRect();
	return (
		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
		rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	);
}

export function focusElement(element, selectContent = false) {
	if (!element) return;

	element.focus();

	if (selectContent && typeof element.select === 'function') {
		element.select();
	}
}

export function disableElement(element) {
	if (element) {
		element.disabled = true;
		element.classList.add('opacity-50', 'cursor-not-allowed');
		element.classList.remove('cursor-pointer');
	}
}

export function enableElement(element) {
	if (element) {
		element.disabled = false;
		element.classList.remove('opacity-50', 'cursor-not-allowed');
		element.classList.add('cursor-pointer');
	}
}

export function createDOMElement(tag, options = {}) {
	const element = document.createElement(tag);

	if (options.className) {
		element.className = options.className;
	}

	if (options.id) {
		element.id = options.id;
	}

	if (options.text) {
		element.textContent = options.text;
	}

	if (options.html) {
		element.innerHTML = options.html;
	}

	if (options.attributes) {
		Object.entries(options.attributes).forEach(([key, value]) => {
			element.setAttribute(key, value);
		});
	}

	if (options.styles) {
		Object.entries(options.styles).forEach(([key, value]) => {
			element.style[key] = value;
		});
	}

	return element;
}
