# Pace Calculator

[![Tests](https://img.shields.io/badge/Tests-508%20passing-brightgreen.svg)](https://vitest.dev/)
[![Coverage](./badges/coverage-total.svg)](https://vitest.dev/)
[![Accessibility](https://img.shields.io/badge/WCAG-2.1%20AA-blue.svg)](https://www.w3.org/WAI/WCAG21/quickref/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)](https://github.com/actions)

A modern, accessible running pace calculator built with vanilla JavaScript and WCAG 2.1 AA compliance.

## Features

### Core Functionality
- **Tri-directional calculations**: Calculate pace, time, or distance from any two inputs
- **Flexible input formats**: Decimal, colon notation (MM:SS, H:MM:SS), and space-separated formats
- **Race splits generation**: Automatically calculate kilometer/mile splits for any distance
- **Quick preset distances**: One-click access to common race distances (5K, 10K, Half Marathon, Marathon)
- **Real-time validation** with immediate visual feedback and error recovery
- **Personal Records tracking** with localStorage persistence and CRUD operations

### User Experience
- **Copy-to-clipboard** functionality for easy result sharing
- **Input auto-advancement**: Automatic field progression for seamless data entry
- **Touch-optimized**: Mobile-friendly interactions and gestures
- **Keyboard navigation**: Full functionality without mouse required
- **Tab isolation**: Each calculation tab maintains independent state

### Theming & Accessibility
- **3 Theme System**: Light, Dark, System (auto-detect based on OS preference)
- **Semantic design tokens**: Automatic theme adaptation with WCAG AA contrast compliance
- **Screen reader support**: Comprehensive ARIA labels and live regions
- **Focus management**: Visible focus indicators and logical tab order
- **Keyboard navigation**: Full accessibility with arrow keys, Enter, and Escape
- **Responsive design**: Works at 200% zoom without horizontal scrolling
- **WCAG 2.1 AA compliant**: Meets accessibility standards for contrast and usability

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+ modules)
- **Build Tool**: Vite 7.x with hot module replacement
- **Styling**: TailwindCSS 4.x with semantic design token system
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Quality**: ESLint + Stylelint + custom design token validation

## Quick Start

```bash
git clone <repository-url>
cd pace-calculator
chmod +x update.sh
./update.sh              # Install, build, and test everything
./update.sh --dev        # Start development server
```

## Development Commands

```bash
# Development
npm run dev              # Start development server with HMR
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm run test             # Unit tests in watch mode
npm run test:run         # Unit tests once (CI mode)
npm run test:e2e         # Essential E2E tests
npm run test:all         # Run all tests (unit + E2E)

# Code Quality
npm run lint             # Run all linting (ESLint + Stylelint)
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

## Project Structure

```
pace-calculator/
├── src/                         # Source code
│   ├── main.js                 # Application entry point and initialization
│   ├── calculator.js           # Core calculation logic and validation
│   ├── ui.js                   # UI interactions and DOM manipulation
│   ├── settings.js             # Settings, modals, and preferences
│   ├── state.js                # Application state management
│   ├── pr.js                   # Personal records functionality
│   ├── distances.js            # Distance configuration and utilities
│   ├── splits.js               # Race splits generation and display
│   ├── auto-advance.js         # Input auto-advancement logic
│   ├── touch.js                # Touch and mobile interactions
│   ├── dom-ready.js            # DOM initialization utilities
│   ├── modal-positioning.js    # Modal positioning system
│   └── style.css               # Global styles and design tokens
├── tests/                       # Testing infrastructure
│   ├── unit/                   # Unit tests (Vitest) - 115+ passing tests
│   │   ├── setup.js           # Test setup and configuration
│   │   ├── calculator.test.js # Core calculation tests
│   │   ├── pr.test.js         # Personal records tests
│   │   ├── tabs.test.js       # Tab functionality tests
│   │   ├── auto-advance.test.js # Auto-advancement tests
│   │   ├── splits.test.js     # Race splits tests
│   │   ├── quick-presets.test.js # Quick preset tests
│   │   └── default-distance.test.js # Default distance tests
│   └── e2e/                    # End-to-end tests (Playwright)
│       ├── smoke.spec.js      # Basic smoke tests
│       ├── essential-flows.spec.js # Core user workflows
│       ├── tabs.spec.js       # Tab switching and state
│       ├── modals.spec.js     # Modal interactions
│       ├── accessibility.spec.js # A11Y features
│       └── themes.spec.js     # Theme switching
├── scripts/                     # Utility scripts
│   └── validate-tokens.js      # Design token validation script
├── .husky/                      # Git hooks
│   └── pre-commit             # Pre-commit validation
├── .vscode/                     # VSCode configuration
│   ├── settings.json          # Editor settings
│   ├── extensions.json        # Recommended extensions
│   ├── launch.json            # Debug configurations
│   └── tasks.json             # Build tasks
├── index.html                   # Main HTML file
├── package.json                 # Project configuration and dependencies
├── vite.config.js              # Vite build configuration
├── vitest.config.js            # Unit test configuration
├── playwright.config.js        # E2E test configuration
├── eslint.config.js            # ESLint configuration (flat config)
├── stylelint.config.cjs        # Stylelint configuration
├── tailwind.config.js          # TailwindCSS configuration
├── update.sh                    # Development utility script
├── CLAUDE.md                    # Development guidelines
├── AGENTS.md                    # Repository structure for AI agents
└── README.md                    # Project documentation (this file)
```

## Architecture

### Design Token System
Semantic CSS custom properties that automatically adapt to all themes:

```css
/* Semantic tokens that change based on theme */
--color-interactive-primary    /* Primary interactive elements */
--color-surface               /* Background surfaces */
--color-text-primary          /* Primary text color */
--color-border-subtle         /* Subtle borders */
--color-status-success        /* Success states */
--color-status-error          /* Error states */
```

**Theme Architecture**:
- **3 themes**: Light, Dark, System (auto-detects OS preference)
- **Automatic switching**: System theme responds to OS dark mode changes
- **WCAG AA compliance**: All themes meet 4.5:1 contrast ratio minimum
- **Automated validation**: `npm run validate:tokens` checks for hardcoded colors

### Modular JavaScript Architecture

**Core Logic Modules**:
- `calculator.js` - Pure calculation functions, input validation, unit conversions
- `distances.js` - Distance presets, custom distance validation, utilities
- `splits.js` - Race split calculations based on pace and distance

**UI Layer Modules**:
- `ui.js` - Main UI controller, tab switching, result display, clipboard operations
- `auto-advance.js` - Automatic input field advancement for better UX
- `touch.js` - Touch-specific interactions and mobile optimizations
- `modal-positioning.js` - Dynamic modal positioning system

**State & Settings Modules**:
- `state.js` - Centralized application state (minimal, focused)
- `settings.js` - User preferences, theme management, localStorage persistence
- `pr.js` - Personal records CRUD operations and display

**Infrastructure Modules**:
- `main.js` - App initialization, event listener setup, module coordination
- `dom-ready.js` - DOM readiness utilities and initialization helpers

### Event System
Custom event-driven architecture for loose coupling between modules:

```javascript
// Cross-module communication
document.dispatchEvent(new CustomEvent('calculation-complete', {
  detail: { result, type }
}));
```

### Testing Strategy
- **115+ unit tests** with Vitest covering:
  - Core calculation logic and edge cases
  - UI interactions and state management
  - Personal records and splits functionality
  - Auto-advancement and input validation
- **Comprehensive E2E tests** with Playwright covering:
  - Critical user workflows (smoke tests)
  - Tab switching and state preservation
  - Modal interactions and keyboard navigation
  - Theme switching and accessibility features
- **Pre-commit hooks** with Husky:
  - Design token validation (non-blocking)
  - Linting with ESLint and Stylelint
  - Build verification on config changes
- **CI/CD pipeline**: Full validation, testing, and build process

## Development Guidelines

See [CLAUDE.md](CLAUDE.md) for comprehensive development guidelines including:
- Code style conventions
- Accessibility requirements
- Testing requirements
- Workflow guidelines
- Feature implementation process

## License

MIT License - See [LICENSE](LICENSE) for details.
