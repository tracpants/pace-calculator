# Pace Calculator

A modern, accessible running pace calculator built with vanilla JavaScript, Vite, and TailwindCSS.

## Features

- **Calculate pace, time, or distance** with flexible input formats (MM:SS, H:MM:SS, decimal)
- **Real-time validation** with visual feedback and helpful error messages
- **Mobile optimized** with large touch targets and number pad inputs
- **Full accessibility** support with keyboard navigation and screen readers
- **Copy results** to clipboard with one click
- **Dark/light theme** toggle
- **Common race distances** for quick input (5K, 10K, Half Marathon, Marathon)
- **Responsive design** that works on all devices

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm
- Git

### Quick Start

```bash
git clone <repository-url>
cd pace-calculator
chmod +x update.sh
./update.sh              # Install, build, and test
./update.sh --dev        # Start development server
```

### Manual Setup

```bash
npm install              # Install dependencies
npm run dev              # Start development server
npm run build            # Build for production
```

## Update Script

The `update.sh` script handles common development tasks:

```bash
./update.sh --help        # Show all options
./update.sh               # Full update (pull, install, build, test)
./update.sh --dev         # Start development server
./update.sh --build       # Build project
./update.sh --clean       # Clean install dependencies
./update.sh --status      # Show project status
```

## Usage

1. Select calculation type (Pace, Time, or Distance)
2. Choose units (KM or Miles)
3. Enter values in any format (4:30, 4.5, etc.)
4. Press Enter or click Calculate
5. Copy results with the copy button

### Keyboard Shortcuts
- **Enter**: Calculate from any input
- **Ctrl/Cmd + 1/2/3**: Switch between tabs
- **Tab**: Navigate through elements

## Accessibility

- **Screen readers**: Full ARIA support with semantic HTML
- **Keyboard navigation**: Complete keyboard control with logical tab order
- **Mobile friendly**: Large touch targets and optimized inputs
- **High contrast**: Works with zoom up to 200%

## Tech Stack

- Vanilla JavaScript (ES6+)
- Vite (build tool)
- TailwindCSS (styling)
- WCAG 2.1 AA compliant

## License

MIT License