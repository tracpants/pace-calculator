# CLAUDE.md - Development Guidelines

This document outlines code style conventions and workflow guidelines for the Pace Calculator project to ensure consistency, maintainability, and ease of development.

## Project Overview

The Pace Calculator is a modern, accessible running pace calculator built with:
- **Vanilla JavaScript** (ES6+ modules)
- **Vite 7.x** (build tool and dev server with HMR)
- **TailwindCSS 4.x** (utility-first styling with semantic design tokens)
- **WCAG 2.1 AA** compliance for accessibility
- **Comprehensive testing** (Vitest unit tests + Playwright E2E tests)
- **Quality tooling** (ESLint, Stylelint, design token validation)

## Code Style Guidelines

### JavaScript

#### Module Structure
- Use ES6 modules with explicit imports/exports
- Organize code into logical modules by functionality:
  - `calculator.js` - Core calculation logic and validation
  - `ui.js` - UI interactions and DOM manipulation
  - `settings.js` - Settings management and modals
  - `state.js` - Application state management
  - `main.js` - Application entry point and initialization
  - `pr.js` - Personal records functionality
  - `distances.js` - Distance configuration and utilities
  - `splits.js` - Race splits generation and display
  - `auto-advance.js` - Input auto-advancement logic
  - `touch.js` - Touch and mobile interactions
  - `dom-ready.js` - DOM initialization utilities
  - `modal-positioning.js` - Modal positioning system

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
- **Files**: kebab-case for all files
  - Source files: `*.js`
  - Unit tests: `*.test.js`
  - E2E tests: `*.spec.js`

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

**Design Token Validation**
- Automated validation via `npm run validate:tokens`
- Script: `scripts/validate-tokens.js` - checks for hardcoded colors in CSS/HTML
- Runs in pre-commit hook (non-blocking warning)
- Enforced in CI pipeline

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

#### Unit Testing Requirements
- **Mandatory unit tests** - All new features and changes MUST include comprehensive unit tests
- **Test coverage** - Cover core business logic, edge cases, and error conditions
- **Passing tests required** - All unit tests must pass before committing and pushing code
- **Test framework** - Use Vitest for fast, modern JavaScript testing
- **Test commands**:
  ```bash
  npm run test        # Run tests in watch mode during development
  npm run test:run    # Run tests once for CI/verification
  npm run test:all    # Run both unit and E2E tests
  ```

#### Unit Testing Guidelines
- **Test file naming** - Use `.test.js` suffix (e.g., `calculator.test.js`)
- **Test organization** - Group related tests in `describe` blocks with clear hierarchies
- **Mock dependencies** - Mock external modules and DOM APIs appropriately
- **Real-world scenarios** - Include tests for actual use cases, not just isolated functions
- **Precision handling** - Account for floating-point precision in calculations
- **Boundary conditions** - Test edge cases, limits, and error conditions

#### E2E Testing Requirements
- **Test file naming** - Use `.spec.js` suffix (e.g., `tabs.spec.js`)
- **Critical paths** - Tag important flows with `@smoke` or `@critical` annotations
- **Framework** - Use Playwright for cross-browser E2E testing
- **Test suites**:
  - `smoke.spec.js` - Basic functionality and page loading
  - `essential-flows.spec.js` - Core user workflows
  - `tabs.spec.js` - Tab switching and state preservation
  - `modals.spec.js` - Modal interactions and accessibility
  - `accessibility.spec.js` - A11Y features and keyboard navigation
  - `themes.spec.js` - Theme switching and visual consistency

#### Testing Workflow
1. **Before starting** - Run existing tests to ensure clean baseline
2. **During development** - Write tests alongside code (TDD encouraged)
3. **Before committing** - Ensure all tests pass with `npm run test:run`
4. **Feature completion** - Verify comprehensive test coverage for new functionality

#### Code Quality Tools

**Linting**
- **ESLint** - JavaScript linting with modern ES2022 configuration
  - Config: `eslint.config.js` (flat config format)
  - Plugins: import, jsdoc
  - Rules: enforces best practices, import ordering, JSDoc validation
- **Stylelint** - CSS linting for style consistency
  - Config: `stylelint.config.cjs`
  - Plugins: stylelint-order
  - Rules: enforces property ordering, naming conventions
- **Commands**:
  ```bash
  npm run lint       # Run all linters
  npm run lint:fix   # Auto-fix linting issues
  ```

**Design Token Validation**
- Custom script validates CSS custom property usage
- Detects hardcoded colors and non-semantic tokens
- Run with: `npm run validate:tokens`
- Integrated into pre-commit hook (non-blocking)

**Git Hooks (Husky)**
- Pre-commit hook runs:
  1. Design token validation (non-blocking warning)
  2. Lint-staged for changed files (non-blocking)
  3. Build check if config files changed (blocking on failure)
- Located in `.husky/pre-commit`
- Keeps local development fast while maintaining quality

#### Manual Testing Checklist
- **Cross-browser** - test in Chrome, Firefox, Safari, Edge
- **Mobile devices** - test on iOS and Android
- **Accessibility tools** - use screen readers, keyboard-only navigation
- **Zoom levels** - test up to 200% zoom
- **Theme switching** - verify all 6 themes work correctly

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
3. **Write unit tests** for new functionality (TDD approach recommended)
4. **Create UI components** following established patterns
5. **Use semantic design tokens** exclusively for styling:
   ```css
   /* Use tokens that work across all themes */
   background-color: var(--color-surface);
   color: var(--color-text-primary);
   border-color: var(--color-border-subtle);
   ```
6. **Add accessibility features** (ARIA, keyboard support)
7. **Test across all themes** including accessibility variants
8. **Verify contrast ratios** in high-contrast and monochrome themes
9. **Run unit tests** to ensure all functionality works correctly (`npm run test:run`)
10. **Write E2E tests** for critical user workflows
11. **Run linters** and fix any issues (`npm run lint:fix`)
12. **Validate design tokens** (`npm run validate:tokens`)
13. **Test thoroughly** across devices and accessibility modes
14. **Update this guide** if new patterns emerge

#### Feature Completion Checklist
- [ ] **Unit tests written** - Comprehensive test coverage for new functionality
- [ ] **E2E tests added** - Critical workflows covered
- [ ] **All tests passing** - `npm run test:all` completes successfully
- [ ] **Linting clean** - `npm run lint` reports no errors
- [ ] **Tokens validated** - `npm run validate:tokens` passes
- [ ] **No hardcoded colors** - Use semantic tokens only
- [ ] **Multi-theme support** - Works in all 6 themes (light, dark, system, amoled, high-contrast, monochrome)
- [ ] **Accessibility compliance** - Maintains proper contrast ratios in accessibility themes
- [ ] **Interactive states** - Elements use appropriate state tokens (hover, focus, active)
- [ ] **Status indicators** - Error and success states use semantic status tokens
- [ ] **Manual testing** - Cross-browser and device testing completed

### Development Commands

```bash
# Development
npm run dev              # Start Vite dev server with HMR

# Building
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm run test             # Run unit tests in watch mode
npm run test:run         # Run unit tests once (CI mode)
npm run test:e2e         # Run essential E2E tests
npm run test:all         # Run all tests (unit + E2E)

# Code Quality
npm run lint             # Run ESLint + Stylelint
npm run lint:fix         # Auto-fix linting issues
npm run validate:tokens  # Validate design token usage
npm run validate:all     # Run all validation (lint + tokens)

# Maintenance
npm run clean            # Remove dist, coverage, test results
npm run reset            # Clean + remove node_modules + fresh install
npm run audit:security   # Check for security vulnerabilities
npm run audit:fix        # Auto-fix security issues
npm run outdated         # Check for outdated dependencies

# CI/CD
npm run ci               # Full CI pipeline (install, validate, test, build)
npm run prepare          # Initialize Husky (runs on npm install)

# Utility Scripts
./update.sh              # Full update (install, build, test)
./update.sh --dev        # Start development server
```

**Important**: Always run `npm run test:run` before committing to ensure all tests pass.

## File Organization

```
pace-calculator/
├── src/                    # Source code
│   ├── main.js            # Application entry point and initialization
│   ├── calculator.js      # Core calculation logic and validation
│   ├── ui.js              # UI interactions and DOM manipulation
│   ├── settings.js        # Settings, modals, and preferences
│   ├── state.js           # Application state management
│   ├── pr.js              # Personal records functionality
│   ├── distances.js       # Distance configuration and utilities
│   ├── splits.js          # Race splits generation and display
│   ├── auto-advance.js    # Input auto-advancement logic
│   ├── touch.js           # Touch and mobile interactions
│   ├── dom-ready.js       # DOM initialization utilities
│   ├── modal-positioning.js # Modal positioning system
│   └── style.css          # Global styles and design tokens
├── tests/                  # Testing infrastructure
│   ├── unit/              # Unit tests (run with Vitest)
│   │   ├── setup.js       # Test setup and configuration
│   │   ├── calculator.test.js    # Tests for calculation functions
│   │   ├── pr.test.js            # Tests for Personal Records
│   │   ├── tabs.test.js          # Tests for UI tab functionality
│   │   ├── auto-advance.test.js  # Tests for input auto-advancement
│   │   ├── splits.test.js        # Tests for race splits
│   │   └── default-distance.test.js # Tests for default distance behavior
│   └── e2e/               # End-to-end tests (run with Playwright)
│       ├── smoke.spec.js         # Basic smoke tests
│       ├── essential-flows.spec.js # Core user workflows
│       ├── tabs.spec.js          # Tab switching and state
│       ├── modals.spec.js        # Modal interactions
│       ├── accessibility.spec.js # A11Y features
│       └── themes.spec.js        # Theme switching
├── scripts/                # Utility scripts
│   └── validate-tokens.js # Design token validation script
├── public/                 # Static assets
│   ├── favicon.svg
│   └── vite.svg
├── .husky/                 # Git hooks
│   └── pre-commit         # Pre-commit validation
├── .vscode/                # VSCode configuration
│   ├── settings.json      # Editor settings
│   ├── extensions.json    # Recommended extensions
│   ├── launch.json        # Debug configurations
│   └── tasks.json         # Build tasks
├── .github/                # GitHub configuration
│   └── workflows/         # CI/CD workflows
├── dist/                   # Build output (generated)
├── node_modules/           # Dependencies (generated)
├── coverage/               # Test coverage reports (generated)
├── test-results/           # E2E test results (generated)
├── playwright-report/      # Playwright HTML reports (generated)
├── index.html             # Main HTML file
├── package.json           # Project configuration and dependencies
├── package-lock.json      # Dependency lock file
├── vite.config.js         # Vite build configuration
├── vitest.config.js       # Unit test configuration
├── playwright.config.js   # E2E test configuration
├── eslint.config.js       # ESLint configuration (flat config)
├── stylelint.config.cjs   # Stylelint configuration
├── tailwind.config.js     # TailwindCSS configuration
├── postcss.config.js      # PostCSS configuration
├── update.sh              # Development utility script
├── CLAUDE.md              # Development guidelines (this file)
├── AGENTS.md              # Repository structure for AI agents
├── README.md              # Project documentation
└── LICENSE                # MIT License
```

### Testing Structure

- **Unit Tests** (`tests/unit/`): Fast, isolated tests for individual functions and modules
  - Currently 115+ passing tests
  - Cover calculation logic, UI interactions, state management, and utilities
  - Mock DOM and external dependencies as needed

- **E2E Tests** (`tests/e2e/`): Browser-based tests for complete user workflows
  - Test critical paths and accessibility features
  - Run in multiple browsers (Chromium, Firefox, WebKit)
  - Include visual regression and interaction testing

- **Test Commands**:
  ```bash
  npm run test           # Run unit tests in watch mode
  npm run test:run       # Run unit tests once
  npm run test:e2e       # Run E2E tests
  npm run test:all       # Run all tests
  ```

## Architecture Deep Dive

### Module Responsibilities

**Core Logic**
- `calculator.js` - Pure calculation functions, input validation, unit conversions
- `distances.js` - Distance presets, custom distance validation, distance utilities
- `splits.js` - Race split calculations based on pace and distance

**UI Layer**
- `ui.js` - Main UI controller, tab switching, result display, clipboard operations
- `auto-advance.js` - Automatic input field advancement for better UX
- `touch.js` - Touch-specific interactions and mobile optimizations
- `modal-positioning.js` - Dynamic modal positioning system

**State & Settings**
- `state.js` - Centralized application state (minimal, focused)
- `settings.js` - User preferences, theme management, localStorage persistence
- `pr.js` - Personal records CRUD operations and display

**Infrastructure**
- `main.js` - App initialization, event listener setup, module coordination
- `dom-ready.js` - DOM readiness utilities and initialization helpers
- `style.css` - Design token definitions, global styles, theme implementations

### Event System

The app uses a custom event system for loose coupling:
```javascript
// Emit events for cross-module communication
document.dispatchEvent(new CustomEvent('calculation-complete', {
  detail: { result, type }
}));

// Listen for events
document.addEventListener('calculation-complete', handleResult);
```

### State Management Pattern

- Minimal centralized state in `state.js`
- Tab-specific state stored in DOM elements
- User preferences in localStorage
- No external state management library needed

## Additional Documentation

- **AGENTS.md** - Concise repository structure guide for AI agents
- **README.md** - User-facing project documentation
- **.vscode/** - VSCode workspace configuration and recommended extensions

## Development Best Practices

### Performance
- Debounce expensive operations (validation, calculations)
- Use event delegation for dynamic elements
- Minimize DOM queries with caching
- Batch DOM updates to prevent reflows

### Accessibility
- Test with keyboard only
- Use screen reader to verify experience
- Ensure 4.5:1 contrast ratio minimum
- Provide text alternatives for visual information

### Code Review
- Verify tests pass and cover new code
- Check design token usage (no hardcoded colors)
- Ensure accessibility features are implemented
- Validate cross-browser compatibility

### Maintenance
- Keep dependencies updated regularly (`npm run outdated`)
- Run security audits (`npm run audit:security`)
- Monitor test coverage trends
- Update documentation when patterns change

---

This clean, organized architecture supports maintainable, accessible, and user-friendly development while keeping concerns properly separated. The comprehensive test suite and quality tooling ensure code quality and prevent regressions.
