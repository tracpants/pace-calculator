# Pace Calculator

A modern, responsive web application for calculating running pace, time, and distance. Built with vanilla JavaScript, Vite, and TailwindCSS.

## Features

- **Calculate Pace**: Enter time and distance to get your pace per km or mile
- **Calculate Time**: Enter pace and distance to get total time needed
- **Calculate Distance**: Enter time and pace to get distance covered
- **Unit Toggle**: Switch between kilometers and miles
- **Dark/Light Theme**: Toggle between light and dark modes
- **Popular Distances**: Quick select for common race distances (5K, 10K, Half Marathon, Marathon, 1-Mile)
- **Example Values**: Pre-filled realistic values for quick testing
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

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
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Select a calculation type**: Choose between Pace, Time, or Distance tabs
2. **Choose units**: Toggle between KM and Miles using the unit selector
3. **Enter values**: Fill in the required fields (or use the pre-filled examples)
4. **Use presets**: Select from popular race distances for quick input
5. **Calculate**: Click the Calculate button to see your result
6. **Clear**: Use the Clear button to reset all fields

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Icons**: Built-in emoji icons

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