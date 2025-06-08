# Pace Calculator

A professional, accessible web application for calculating running pace, time, and distance. Built with vanilla JavaScript, Vite, and TailwindCSS with a focus on usability and accessibility.

## Features

### 🏃‍♂️ Core Calculations
- **Calculate Pace**: Enter time and distance to get your pace per km or mile
- **Calculate Time**: Enter pace and distance to get total time needed
- **Calculate Distance**: Enter time and pace to get distance covered
- **Unit Toggle**: Switch between kilometers and miles with instant conversion
- **Flexible Input Formats**: Accepts MM:SS, H:MM:SS, decimal minutes (4.5), and space-separated formats

### 🎨 User Experience
- **Real-time Validation**: Instant feedback with visual indicators and helpful error messages
- **Copy to Clipboard**: One-click copying of results with success animation
- **Loading States**: Professional loading animations during calculations
- **Smooth Animations**: Polished result animations and state transitions
- **Autocomplete**: Smart suggestions for common race distances
- **Smart Field Clearing**: Non-relevant fields cleared when switching tabs

### 📱 Mobile & Accessibility
- **Mobile Optimized**: Large touch targets, number pad inputs, optimized font sizes
- **Full Keyboard Support**: Tab navigation, Enter to calculate, Ctrl+1/2/3 shortcuts
- **Screen Reader Support**: Complete ARIA labels, live regions, semantic HTML
- **Focus Management**: Auto-focus inputs, logical tab order, visual focus indicators
- **Dark/Light Theme**: Toggle between light and dark modes

### 🏁 Quick Features
- **Popular Distances**: Quick select for 5K, 10K, Half Marathon, Marathon, 1-Mile
- **Pre-filled Examples**: Realistic default values for immediate testing
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm
- Git

### Quick Start with Update Script

We provide a convenient `update.sh` script for common development tasks:

```bash
# Clone the repository
git clone <repository-url>
cd pace-calculator

# Make script executable (first time only)
chmod +x update.sh

# Full setup: pull, install dependencies, build, and test
./update.sh

# Start development server
./update.sh --dev
```

### Manual Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pace-calculator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

```bash
npm run build
# or
./update.sh --build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Development Tools

### Update Script (`update.sh`)

A comprehensive script for managing the repository and build process:

```bash
# Show all available options
./update.sh --help

# Full update (default): pull, install, build, test
./update.sh

# Individual operations
./update.sh --pull          # Pull latest changes
./update.sh --install       # Install/update dependencies  
./update.sh --build         # Build the project
./update.sh --test          # Test the build
./update.sh --dev           # Start development server
./update.sh --clean         # Clean install dependencies
./update.sh --status        # Show project status

# Combine operations
./update.sh --pull --build  # Pull and build
./update.sh --clean --build # Clean install and build
```

**Features:**
- 🔄 Automatic git stashing/unstashing of uncommitted changes
- 📦 Dependency management with clean install option
- 🏗️ Build verification and testing
- 📊 Project status overview
- 🎨 Colored output for clear feedback
- ⚡ Quick development server startup

## Enhanced Features

### 🚀 Advanced Input Handling
- **Multiple Time Formats**: Enter times as "4:30", "1:23:45", "4.5" (decimal minutes), or "4 30" (space-separated)
- **Input Validation**: Real-time validation with green/red borders and helpful error messages
- **Autocomplete**: Type distances and get suggestions for common race distances
- **Smart Clearing**: Switch tabs and irrelevant fields automatically clear

### ⌨️ Keyboard Shortcuts
- **Enter**: Calculate from any input field
- **Ctrl/Cmd + 1**: Switch to Pace tab
- **Ctrl/Cmd + 2**: Switch to Time tab  
- **Ctrl/Cmd + 3**: Switch to Distance tab
- **Arrow Keys**: Navigate between tabs when focused
- **Tab**: Navigate through all interactive elements

### 📋 Copy & Share
- **One-Click Copy**: Copy results to clipboard with animated feedback
- **Cross-Browser**: Works with modern clipboard API and legacy fallback
- **Success Animation**: Visual confirmation when copy succeeds

## Usage

1. **Select calculation type**: Choose between Pace, Time, or Distance tabs (or use Ctrl+1/2/3)
2. **Choose units**: Toggle between KM and Miles using the unit selector
3. **Enter values**: Type in flexible formats - the app validates as you go
4. **Use shortcuts**: Press Enter to calculate, or use preset distances
5. **Copy results**: Click the copy button to share your results
6. **Clear & restart**: Use the Clear button to reset and start over

## Accessibility Features

This pace calculator is built with accessibility as a first-class citizen:

### ♿ Screen Reader Support
- **Semantic HTML**: Proper landmarks, headings, and form structure
- **ARIA Labels**: Comprehensive labeling for all interactive elements
- **Live Regions**: Results announced automatically to screen readers
- **Error Announcements**: Validation errors read aloud with context

### ⌨️ Keyboard Navigation
- **Full Keyboard Control**: Every feature accessible without a mouse
- **Logical Tab Order**: Intuitive navigation through all elements
- **Visual Focus Indicators**: Clear focus rings for keyboard users
- **Tab Roles**: Proper ARIA tab implementation for tab navigation

### 📱 Mobile Accessibility
- **Large Touch Targets**: Minimum 44px touch targets for easy interaction
- **Number Inputs**: Optimized input types show number pad on mobile
- **Zoom Support**: Works perfectly at 200%+ zoom levels
- **Voice Input**: Compatible with voice input on mobile devices

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Accessibility**: WCAG 2.1 AA compliant
- **Icons**: SVG icons with proper accessibility attributes

## Project Structure

```
src/
├── main.js          # Application entry point
├── calculator.js    # Core calculation functions
├── ui.js           # UI logic and event handlers
├── state.js        # Application state management
├── theme.js        # Dark/light theme functionality
└── style.css       # TailwindCSS and custom styles
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit your changes: `git commit -m 'Add some feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).