# ⚡ LEGACY - PIXY | ASCII Typography Visualizer

[![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Vanilla JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3 Scanlines](https://img.shields.io/badge/CSS3-CRT%20Overlay-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

> A real-time, high-definition colored ASCII art typography visualizer for **"LEGACY" by PIXY**, powered by a dual-canvas rasterization pipeline and retro CRT terminal aesthetics.

---

## ✨ Features

- **Dual-Canvas Raster Engine**: Renders high-fidelity kinetic typography onto an offscreen canvas, samples pixel luminance and RGB values, and transforms them into crisp monospace ASCII glyphs.
- **60 FPS Performance**: Optimized `requestAnimationFrame` loop with direct pixel buffer scanning (`willReadFrequently`) and zero heavy runtime dependencies.
- **Dynamic Kinetic Typography**:
  - `pop_in`, `italic_bold`, `zoom_in`
  - Subtle and intense glitch shake with character flickering (`!`, `?`, `$`, `&`, `X`, `§`, `¥`)
  - Smooth easing curves and seamless timeline synchronization.
- **Particle Physics System**: Velocity-driven dynamic particles and reactive kinetic bursts synchronized with explosive lyrics.
- **Retro CRT Atmosphere**: Pure CSS scanline overlays, subtle monitor curvature, radial vignette, and deep contrast styling.
- **Responsive & Adaptive Grid**: Automatically re-calculates column/row proportions and device pixel ratios (`devicePixelRatio`) across screen sizes.

---

## 🎮 Controls

| Action | Control |
| :--- | :--- |
| **Restart Visualizer** | Click anywhere on the screen |
| **Restart Visualizer** | <kbd>Space</kbd> or <kbd>R</kbd> |

---

## 🛠️ Tech Stack

- **Markup & Structure**: Semantic HTML5
- **Styling**: Vanilla CSS3 (scanline scan, vignette, CRT glow, full-viewport reset)
- **Logic & Visualizer**: Vanilla JavaScript (Canvas API, requestAnimationFrame)
- **Typography**: Google Fonts (*JetBrains Mono*, *Outfit*)

---

## 🚀 Getting Started

No build steps, node modules, or bundlers required!

### 1. Clone the repository
```bash
git clone https://github.com/TycamiTech/LEGACY---PIXY-ascii-typography-visualizer.git
cd LEGACY---PIXY-ascii-typography-visualizer
```

### 2. Run locally
You can open `index.html` directly in your browser:

- **Option A (Direct File)**: Double-click `index.html` or drag it into any web browser.
- **Option B (VS Code Live Server)**: Right-click `index.html` and choose **"Open with Live Server"**.
- **Option C (Local HTTP Server)**:
  ```bash
  # Using Python 3
  python -m http.server 3000

  # Or using Node.js npx serve
  npx serve .
  ```
  Open `http://localhost:3000` in your browser.

---

## 📂 Project Structure

```text
├── .agents/
│   └── skills/
│       └── ascii-typography-visualizer/   # Visualizer skill guide & specifications
├── index.html                             # Main HTML entry point & CRT overlays
├── style.css                              # Scanlines, vignette, and viewport styling
├── script.js                              # Dual-canvas engine, ASCII renderer & timeline
└── README.md                              # Project documentation
```

---

## 📜 License

This project is licensed under the MIT License - feel free to use and modify it for your own typography and music visualizer projects.
