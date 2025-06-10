# CLAUDE.md - Development Guidelines

This document outlines code style conventions and workflow guidelines for the Pace Calculator project to ensure consistency, maintainability, and ease of development.

## Project Overview

The Pace Calculator is a modern, accessible running pace calculator built with:
- **Vanilla JavaScript** (ES6+ modules)
- **Vite** (build tool and dev server)
- **TailwindCSS** (utility-first styling)
- **WCAG 2.1 AA** compliance for accessibility

## Code Style Guidelines

### JavaScript

#### Module Structure
- Use ES6 modules with explicit imports/exports
- Organize code into logical modules by functionality:
  - `calculator.js` - Core calculation logic and validation
  - `ui.js` - UI interactions and DOM manipulation
  - `settings.js` - Settings management and modals
  - `state.js` - Application state management
  - `main.js` - Application initialization

#### Naming Conventions
- **Functions**: camelCase, descriptive names
  ```javascript
  function validateTimeInput(timeStr) { ... }
  function calculatePace(totalSeconds, distance, unit) { ... }
  ```
- **Variables**: camelCase for regular variables, SCREAMING_SNAKE_CASE for constants
  ```javascript
  const METERS_PER_KM = 1000;
  const userInput = document.getElementById('input');
  ```
- **DOM Elements**: Use descriptive IDs with dashes
  ```javascript
  const timeInput = document.getElementById('pace-time-minutes');
  ```

#### Code Organization
- Group related constants at the top of files
- Use object literals for configuration and data structures
- Implement utility functions for reusable logic
- Keep functions focused and single-purpose
- Use early returns to reduce nesting

#### Error Handling
- Implement comprehensive input validation with user-friendly messages
- Use the centralized `ErrorManager` object for consistent error states
- Return validation objects with `{ valid: boolean, message?: string, value?: any }`
- Handle edge cases gracefully (empty inputs, invalid formats, etc.)

#### Comments and Documentation
- **NO comments unless specifically requested** - code should be self-documenting
- Use descriptive function and variable names instead of comments
- Exception: Complex calculations may have brief explanatory notes

### CSS/Styling

#### Design System & Theme Architecture

**Color Token System**
- Use semantic CSS custom properties that automatically adapt to themes:
  ```css
  /* Semantic tokens that change based on theme */
  --color-interactive-primary
  --color-surface
  --color-text-primary
  --color-border-subtle
  --color-status-success
  --color-status-error
  ```

**Theme Implementation**
- **Base themes**: light, dark, system (auto-detects preference)
- **Accessibility themes**: amoled, high-contrast, monochrome
- **Theme switching**: Apply via CSS classes on `<html>` element
  ```javascript
  document.documentElement.classList.add("dark");
  document.documentElement.classList.add("high-contrast");
  ```

**Accessibility Theme Behavior**
- **Accent colors disabled** for a11y themes to ensure contrast compliance
- **Neutral color palette** for high-contrast and monochrome themes
- **AMOLED theme** uses pure black backgrounds for OLED displays
- **Auto-fallback** to system theme if unsupported

**Design Token Usage Rules**
- **Always use semantic tokens** instead of raw color values:
  ```css
  /* ✅ Correct - adapts to all themes */
  color: var(--color-text-primary);
  background: var(--color-surface);
  
  /* ❌ Incorrect - breaks theme switching */
  color: #1f2937;
  background: white;
  ```
- **Inline styles for dynamic theming**:
  ```html
  <div style="background-color: var(--color-surface);">
  ```

#### TailwindCSS Usage
- Prefer utility classes over custom CSS
- Use component classes for reusable patterns:
  ```css
  .btn-primary, .input-base, .modal-content
  ```
- Leverage Tailwind's responsive prefixes: `sm:`, `md:`, `lg:`
- **Integrate design tokens** through Tailwind config for utility class support:
  ```javascript
  colors: {
    'surface': 'var(--color-surface)',
    'interactive-primary': 'var(--color-interactive-primary)',
  }
  ```

#### Component Patterns
- **Buttons**: Use consistent sizing and styling patterns
- **Inputs**: Implement segmented inputs for time/pace (HH:MM:SS, MM:SS)
- **Modals**: Use backdrop, focus management, and escape key handling
- **Cards**: Modern rounded corners with subtle shadows

### HTML Structure

#### Semantic HTML
- Use appropriate semantic elements (`<main>`, `<section>`, `<button>`)
- Implement proper heading hierarchy (`h1` → `h2` → `h3`)
- Use form elements with proper labels and associations

#### Accessibility (A11Y)
- **ARIA**: Implement comprehensive ARIA attributes
  ```html
  role="tablist", aria-selected, aria-controls, aria-describedby
  ```
- **Focus Management**: Logical tab order, focus indicators, focus trapping in modals
- **Screen Readers**: Use `sr-only` class for screen reader only content
- **Keyboard Navigation**: Full keyboard accessibility with arrow keys, Enter, Escape
- **Error States**: Use `role="alert"` for error messages
- **Loading States**: Provide `aria-live` regions for dynamic content

#### Mobile Optimization
- Touch-friendly target sizes (minimum 44px)
- Appropriate input types (`inputmode="numeric"`, `type="number"`)
- Responsive design with mobile-first approach
- Prevent zoom on input focus when appropriate

## Workflow Guidelines

### UI/UX Principles

#### Simplicity and Clarity
- **Single-purpose interface** - each tab handles one calculation type
- **Immediate feedback** - real-time validation and error states
- **Minimal cognitive load** - clear labels, consistent patterns
- **Progressive disclosure** - hide complexity until needed (e.g., accessibility options)

#### Error Prevention and Recovery
- **Proactive validation** - validate inputs on blur, provide hints
- **Gentle error handling** - soft pulse animations instead of aggressive shaking
- **Clear error messages** - specific, actionable feedback
- **Graceful degradation** - fallback for unsupported features

#### Consistency
- **Visual hierarchy** - consistent spacing, typography, color usage
- **Interaction patterns** - same gestures/keys work throughout app
- **State management** - preserve user input when switching tabs
- **Terminology** - consistent language across interface

### Accessibility-First Development

#### Design System A11Y Integration
- **Semantic color tokens** ensure proper contrast ratios across all themes
- **Theme-aware components** automatically adapt to accessibility requirements
- **Design token validation** - colors meet WCAG AA standards (4.5:1 minimum)
- **Accessibility theme enforcement**:
  ```javascript
  // Disable accent colors for a11y themes
  const isA11yTheme = ['amoled', 'high-contrast', 'monochrome'].includes(theme);
  if (isA11yTheme) {
    applyAccentColor('indigo'); // Safe neutral default
  }
  ```

#### Design Considerations
- **Color contrast** - meet WCAG AA standards (4.5:1 for normal text)
- **Font options** - OpenDyslexic font toggle for dyslexia support
- **Theme options** - multiple themes including high-contrast and monochrome
- **Responsive design** - works at 200% zoom without horizontal scrolling
- **Token-based theming** - ensures consistent accessibility across all themes

#### Implementation Requirements
- **Keyboard navigation** - full functionality without mouse
- **Screen reader support** - logical reading order, descriptive labels
- **Focus indicators** - visible focus states for all interactive elements
- **Error feedback** - multiple ways to convey errors (color, text, icons)
- **Theme-aware styling** - use design tokens exclusively for automatic a11y compliance

### State Management

#### Tab Isolation
- **Independent state** - each tab maintains its own input values and validation
- **Preserved context** - switching tabs preserves all user input
- **Result persistence** - calculations remain visible when returning to tabs

#### Settings Persistence
- **localStorage** - save user preferences (theme, units, accessibility options)
- **Instant application** - settings apply immediately without save button
- **Sensible defaults** - system theme, kilometers, standard accessibility

### Performance Considerations

#### Code Splitting
- **Modular architecture** - separate concerns into focused modules
- **Dynamic imports** - load features as needed (future consideration)
- **Efficient DOM updates** - batch operations, minimize reflows

#### User Experience
- **Fast feedback** - immediate input validation
- **Loading states** - brief loading animations for calculations
- **Smooth animations** - CSS transitions for state changes
- **Offline capable** - no external dependencies for core functionality

### Testing and Validation

#### Manual Testing Checklist
- **Cross-browser** - test in Chrome, Firefox, Safari, Edge
- **Mobile devices** - test on iOS and Android
- **Accessibility tools** - use screen readers, keyboard-only navigation
- **Zoom levels** - test up to 200% zoom
- **Theme switching** - verify all themes work correctly

#### Code Quality
- **Input validation** - comprehensive edge case handling
- **Error boundaries** - graceful failure modes
- **Performance** - no blocking operations, smooth interactions
- **Consistency** - follow established patterns throughout codebase

### Adding New Features

#### Before Implementation
1. **Assess impact** on existing UI simplicity
2. **Consider accessibility** implications and theme compatibility
3. **Plan state management** and data flow
4. **Design mobile experience** first
5. **Ensure design token usage** for automatic theme support

#### Implementation Process
1. **Update state management** if needed
2. **Implement core logic** with comprehensive validation
3. **Create UI components** following established patterns
4. **Use semantic design tokens** exclusively for styling:
   ```css
   /* Use tokens that work across all themes */
   background-color: var(--color-surface);
   color: var(--color-text-primary);
   border-color: var(--color-border-subtle);
   ```
5. **Add accessibility features** (ARIA, keyboard support)
6. **Test across all themes** including accessibility variants
7. **Verify contrast ratios** in high-contrast and monochrome themes
8. **Test thoroughly** across devices and accessibility modes
9. **Update this guide** if new patterns emerge

#### Design Token Checklist for New Features
- [ ] No hardcoded colors (use semantic tokens only)
- [ ] Works in all 6 themes (light, dark, system, amoled, high-contrast, monochrome)
- [ ] Maintains proper contrast ratios in accessibility themes
- [ ] Interactive elements use appropriate state tokens (hover, focus, active)
- [ ] Error and success states use semantic status tokens

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Full update (install, build, test)
./update.sh

# Development mode
./update.sh --dev
```

## File Organization

```
src/
├── main.js           # Application entry point and initialization
├── calculator.js     # Core calculation logic and validation
├── ui.js            # UI interactions and DOM manipulation
├── settings.js      # Settings, modals, and preferences
├── state.js         # Application state management
├── touch.js         # Touch and mobile interactions
├── auto-advance.js  # Input auto-advancement logic
├── pr.js           # Personal records functionality
└── style.css       # Global styles and design tokens
```

This architecture supports maintainable, accessible, and user-friendly development while keeping the codebase organized and extensible.