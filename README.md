<div align="center">
  <h1>Rajdhani Express Music Player</h1>
  <p>A beautifully crafted, immersive web-based music player with a unique audio-visual experience.</p>
  <br />
  <p>
    <strong><a href="https://rajdhani.asmit.tech/" target="_blank">Live Demo</a></strong>
    &nbsp;&middot;&nbsp;
    <strong><a href="https://github.com/asmitsharma-alt/rajdhani-express-player-v2" target="_blank">Repository</a></strong>
  </p>
</div>

## Features

- **Immersive Visuals**: Features a full-screen background video loop with an ambient gradient overlay.
- **Unique Audio Experience**: 
  - Dynamic Web Audio API integration with bandpass and distortion filters.
  - Background bus sound effect for a travel-like ambiance.
- **Custom Player UI**:
  - Rotating vinyl-style album art when playing.
  - Interactive progress bar and volume controls.
  - Play, Pause, Skip Forward, and Skip Backward functionality.
- **Media Session Support**: Control playback from your operating system's media controls or lock screen.
- **Minimalist Clock**: A sleek, real-time tabular clock overlay.
- **Restricted Interactions**: Non-scrollable layout with text selection and right-click disabled for an app-like feel.

## Technologies Used

- **React.js**: Frontend UI library.
- **Vite**: Next-generation frontend tooling.
- **Tailwind CSS**: Utility-first CSS framework for rapid styling.
- **Lucide React**: Beautiful and consistent iconography.
- **Web Audio API**: For real-time audio processing and effects.

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/asmitsharma-alt/rajdhani-express-player-v2.git
   cd rajdhani-express-player-v2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit `http://localhost:5173` to experience the player!

## Build for Production

To create a production-ready build, run:
```bash
npm run build
```
This will generate a `dist` folder containing the optimized static assets.

## License

This project is licensed under the MIT License.
