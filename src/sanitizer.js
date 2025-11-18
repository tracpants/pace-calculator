import DOMPurify from 'dompurify';

export function sanitizeHTML(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'div', 'br', 'button', 'svg', 'path', 'h3', 'p'],
    ALLOWED_ATTR: [
      'class', 'style', 'id', 'role', 'title',
      'aria-expanded', 'aria-controls', 'aria-hidden', 'aria-label', 'aria-describedby',
      'fill', 'stroke', 'viewBox', 'stroke-linecap', 'stroke-linejoin', 'stroke-width', 'd'
    ],
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false
  });
}

export function sanitizeText(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function stripHTML(text) {
  if (!text) return '';
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true
  });
}

export function escapeHTML(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
