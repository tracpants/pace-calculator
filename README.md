# Pace Calculator

[![Vitest](https://img.shields.io/badge/Tests-115%20passing-brightgreen.svg)](https://vitest.dev/)
[![Accessibility](https://img.shields.io/badge/WCAG-2.1%20AA-blue.svg)](https://www.w3.org/WAI/WCAG21/quickref/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)](https://github.com/actions)

A modern, accessible running pace calculator built with vanilla JavaScript and WCAG 2.1 AA compliance.

## Features

- **Tri-directional calculations**: Calculate pace, time, or distance from any two inputs
- **Flexible input formats**: Decimal, colon notation (MM:SS, H:MM:SS), and space-separated formats
- **Real-time validation** with immediate visual feedback
- **Personal Records tracking** with localStorage persistence
- **Copy-to-clipboard** functionality for easy result sharing
- **6 Theme System**: Light, Dark, System, AMOLED, High-Contrast, Monochrome
- **Accessibility-first**: Screen reader support, keyboard navigation, focus management
- **Mobile optimized**: Touch-friendly targets, input auto-advancement, responsive design

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
npm run test:e2e         # Full E2E test suite

# Code Quality
npm run lint             # Run all linting (ESLint + Stylelint)
npm run lint:fix         # Auto-fix linting issues
npm run validate:tokens  # Validate design token usage
```

## Project Structure

```
pace-calculator/
├── src/                    # Source code
│   ├── calculator.js       # Core calculation logic and validation
│   ├── ui.js              # UI interactions and DOM manipulation
│   ├── state.js           # Application state management
│   ├── settings.js        # Settings management and modals
│   ├── pr.js             # Personal records functionality
│   ├── distances.js      # Distance configuration and utilities
│   └── style.css         # Global styles and design tokens
├── tests/                  # Testing infrastructure
│   ├── unit/              # Unit tests (Vitest)
│   └── e2e/               # End-to-end tests (Playwright)
├── index.html             # Main HTML file
├── package.json           # Project configuration
└── CLAUDE.md              # Development guidelines
```

## Architecture

### Design Token System
Semantic CSS custom properties that automatically adapt to themes:

```css
/* Semantic tokens that change based on theme */
--color-interactive-primary
--color-surface
--color-text-primary
--color-border-subtle
--color-status-success
--color-status-error
```

### Modular JavaScript
- **ES6 modules** with explicit imports/exports
- **Separation of concerns** - calculator logic, UI, state, and settings in separate modules
- **Comprehensive input validation** with user-friendly error messages
- **Event-driven architecture** with custom event system

### Testing Strategy
- **115+ unit tests** covering core calculation logic, edge cases, and error conditions
- **E2E tests** for critical user paths and accessibility features
- **Automated accessibility auditing** with Lighthouse CI (95% threshold)
- **Pre-commit hooks** with multi-stage validation

## Development Guidelines

See [CLAUDE.md](CLAUDE.md) for comprehensive development guidelines including:
- Code style conventions
- Accessibility requirements
- Testing requirements
- Workflow guidelines
- Feature implementation process

## License

MIT License - See [LICENSE](LICENSE) for details.
