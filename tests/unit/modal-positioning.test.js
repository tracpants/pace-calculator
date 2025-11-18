import { describe, it, expect, beforeEach } from 'vitest';
import { ensureModalPositioning, fixModalIssues, debugModalState } from '../../src/modal-positioning.js';

describe('Modal Positioning Module', () => {
	beforeEach(() => {
		// Reset DOM
		document.body.innerHTML = '';
		document.head.innerHTML = '';
	});

	describe('ensureModalPositioning', () => {
		it('should move modals from app container to body level', () => {
			// Setup: Create app container with modals inside
			document.body.innerHTML = `
				<div id="app">
					<div class="modal-container" id="modal-1"></div>
					<div class="modal-container" id="modal-2"></div>
				</div>
			`;

			const app = document.getElementById('app');
			const modal1 = document.getElementById('modal-1');
			const modal2 = document.getElementById('modal-2');

			// Verify modals are initially inside app container
			expect(app.contains(modal1)).toBe(true);
			expect(app.contains(modal2)).toBe(true);

			// Run positioning
			ensureModalPositioning();

			// Verify modals were moved to body level
			expect(modal1.parentElement).toBe(document.body);
			expect(modal2.parentElement).toBe(document.body);
			expect(app.contains(modal1)).toBe(false);
			expect(app.contains(modal2)).toBe(false);
		});

		it('should not move modals already at body level', () => {
			// Setup: Modals already at body level
			document.body.innerHTML = `
				<div class="modal-container" id="modal-1"></div>
				<div id="app"></div>
			`;

			const modal1 = document.getElementById('modal-1');

			// Verify modal is at body level
			expect(modal1.parentElement).toBe(document.body);

			// Run positioning
			ensureModalPositioning();

			// Verify modal stayed at body level
			expect(modal1.parentElement).toBe(document.body);
		});

		it('should apply modal CSS fixes', () => {
			document.body.innerHTML = '<div class="modal-container" id="modal-1"></div>';

			ensureModalPositioning();

			// Check that style element was added
			const styleElement = document.getElementById('modal-positioning-fix');
			expect(styleElement).toBeTruthy();
			expect(styleElement.tagName).toBe('STYLE');
			expect(styleElement.textContent).toContain('position: fixed !important');
			expect(styleElement.textContent).toContain('z-index: 9999 !important');
		});

		it('should not duplicate CSS fixes if called multiple times', () => {
			document.body.innerHTML = '<div class="modal-container" id="modal-1"></div>';

			ensureModalPositioning();
			ensureModalPositioning();
			ensureModalPositioning();

			// Should only have one style element
			const styleElements = document.querySelectorAll('#modal-positioning-fix');
			expect(styleElements.length).toBe(1);
		});

		it('should handle case where no modals exist', () => {
			document.body.innerHTML = '<div id="app"></div>';

			// Should not throw
			expect(() => ensureModalPositioning()).not.toThrow();
		});

		it('should handle case where app container does not exist', () => {
			document.body.innerHTML = '<div class="modal-container" id="modal-1"></div>';

			// Should not throw
			expect(() => ensureModalPositioning()).not.toThrow();

			const modal1 = document.getElementById('modal-1');
			expect(modal1.parentElement).toBe(document.body);
		});
	});

	describe('fixModalIssues', () => {
		it('should ensure modal-container class is present', () => {
			document.body.innerHTML = `
				<div class="some-modal" id="modal-1"></div>
			`;

			// Add modal-container class to selector for fixing
			const modal = document.getElementById('modal-1');
			modal.classList.add('modal-container');

			fixModalIssues();

			expect(modal.classList.contains('modal-container')).toBe(true);
		});

		it('should add hidden class to modals', () => {
			document.body.innerHTML = `
				<div class="modal-container" id="modal-1"></div>
				<div class="modal-container" id="modal-2" class="visible"></div>
			`;

			fixModalIssues();

			const modal1 = document.getElementById('modal-1');
			const modal2 = document.getElementById('modal-2');

			expect(modal1.classList.contains('hidden')).toBe(true);
			expect(modal2.classList.contains('hidden')).toBe(true);
		});

		it('should remove inline positioning styles', () => {
			document.body.innerHTML = `
				<div class="modal-container" id="modal-1"
					 style="position: absolute; top: 10px; left: 20px; z-index: 100;"></div>
			`;

			fixModalIssues();

			const modal1 = document.getElementById('modal-1');

			// Check that positioning styles were removed
			expect(modal1.style.position).toBe('');
			expect(modal1.style.top).toBe('');
			expect(modal1.style.left).toBe('');
			expect(modal1.style.zIndex).toBe('');
		});

		it('should call ensureModalPositioning', () => {
			document.body.innerHTML = `
				<div id="app">
					<div class="modal-container" id="modal-1"></div>
				</div>
			`;

			const app = document.getElementById('app');
			const modal1 = document.getElementById('modal-1');

			expect(app.contains(modal1)).toBe(true);

			fixModalIssues();

			// Modals should be moved to body level
			expect(modal1.parentElement).toBe(document.body);
		});
	});

	describe('debugModalState', () => {
		it('should not throw when logging modal state', () => {
			document.body.innerHTML = `
				<div class="modal-container" id="modal-1"></div>
				<div class="modal-container" id="modal-2"></div>
			`;

			// Should not throw
			expect(() => debugModalState()).not.toThrow();
		});

		it('should handle empty modal list', () => {
			document.body.innerHTML = '<div id="app"></div>';

			// Should not throw
			expect(() => debugModalState()).not.toThrow();
		});
	});

	describe('Window global functions', () => {
		it('should expose functions on window object', () => {
			expect(typeof window.ensureModalPositioning).toBe('function');
			expect(typeof window.fixModalIssues).toBe('function');
			expect(typeof window.debugModalState).toBe('function');
		});
	});

	describe('Edge Cases', () => {
		it('should handle modals with complex nesting', () => {
			document.body.innerHTML = `
				<div id="app">
					<div class="container">
						<div class="wrapper">
							<div class="modal-container" id="nested-modal"></div>
						</div>
					</div>
				</div>
			`;

			const nestedModal = document.getElementById('nested-modal');
			expect(document.body.contains(nestedModal)).toBe(true);
			expect(nestedModal.parentElement.classList.contains('wrapper')).toBe(true);

			ensureModalPositioning();

			// Should be moved to body level
			expect(nestedModal.parentElement).toBe(document.body);
		});

		it('should handle multiple modals with mixed states', () => {
			document.body.innerHTML = `
				<div class="modal-container" id="modal-body-level"></div>
				<div id="app">
					<div class="modal-container" id="modal-in-app"></div>
				</div>
			`;

			const modalBodyLevel = document.getElementById('modal-body-level');
			const modalInApp = document.getElementById('modal-in-app');

			ensureModalPositioning();

			// Both should be at body level
			expect(modalBodyLevel.parentElement).toBe(document.body);
			expect(modalInApp.parentElement).toBe(document.body);
		});

		it('should preserve modal content when moving', () => {
			document.body.innerHTML = `
				<div id="app">
					<div class="modal-container" id="modal-1">
						<div class="modal-content">
							<h2>Test Modal</h2>
							<p>Modal content here</p>
						</div>
					</div>
				</div>
			`;

			const modal = document.getElementById('modal-1');
			const modalContent = modal.querySelector('.modal-content');
			const heading = modal.querySelector('h2');

			ensureModalPositioning();

			// Content should be preserved
			expect(modal.parentElement).toBe(document.body);
			expect(modal.querySelector('.modal-content')).toBe(modalContent);
			expect(modal.querySelector('h2')).toBe(heading);
			expect(heading.textContent).toBe('Test Modal');
		});
	});
});
