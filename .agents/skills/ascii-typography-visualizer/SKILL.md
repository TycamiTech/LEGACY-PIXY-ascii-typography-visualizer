---
name: ascii-typography-visualizer
description: >-
  Build, customize, and optimize real-time colored ASCII art typography visualizers,
  kinetic lyric displays, and retro CRT canvas animations using dual-canvas rasterization.
  Use when creating or modifying browser-based ASCII visualizers, synchronized text/lyric displays,
  retro terminal typography, or high-performance canvas pixelation effects.
---

# ASCII Typography & Lyric Visualizer Skill

A comprehensive guide and reference architecture for building ultra-smooth, high-performance, real-time colored ASCII art typography visualizers, lyric videos, and retro CRT screen experiences.

---

## 1. Architectural Overview

The engine relies on a **Dual-Canvas Pipeline** to convert dynamic 2D vector graphics into a high-DPI colored ASCII character matrix:

```
[ Timeline / Audio State ]
           │
           ▼
┌──────────────────────────────────────┐
│  Offscreen Canvas (Low Resolution)   │
│  - Grid Size: COLS x ROWS (e.g. 220) │
│  - Vector typography (Bold/Sans)     │
│  - Transformations (Scale/Skew/Jitter│
│  - Dynamic particles / Glitch slices │
└──────────────────┬───────────────────┘
                   │
                   ▼  ctx.getImageData() [Optimized pixel loop]
┌──────────────────────────────────────┐
│  High-DPI Display Canvas             │
│  - High-res buffer (DPR scaled)      │
│  - Monospace font (JetBrains Mono)   │
│  - Luminance to ASCII character ramp │
│  - Exact RGB color extraction        │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│  Post-Processing Overlays (CSS)      │
│  - CRT Scanlines (Linear Gradient)   │
│  - Vignette (Radial Gradient)        │
└──────────────────────────────────────┘
```

---

## 2. Core Implementation Patterns

### A. Dynamic Canvas Sizing & Monospace Ratio
Monospace characters are taller than they are wide (typically ~0.55 aspect ratio). Compute `ROWS` dynamically based on screen aspect ratio to maintain 1:1 square visual proportion:

```javascript
const COLS = 220;
let ROWS = 100;

function resizeCanvases() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const displayWidth = window.innerWidth;
  const displayHeight = window.innerHeight;

  // High-DPI physical buffer
  displayCanvas.width = Math.round(displayWidth * dpr);
  displayCanvas.height = Math.round(displayHeight * dpr);
  displayCanvas.style.width = displayWidth + "px";
  displayCanvas.style.height = displayHeight + "px";

  // Monospace character aspect compensation (~0.55 ratio)
  const screenAspect = displayHeight / displayWidth;
  const targetCharRatio = 0.55;
  ROWS = Math.max(80, Math.min(140, Math.round(COLS * screenAspect * (1 / targetCharRatio) * 0.5)));

  offscreenCanvas.width = COLS;
  offscreenCanvas.height = ROWS;
}
```

### B. High-Performance Display ASCII Renderer
**Crucial Performance Guardrails:**
- Never call `ctx.shadowBlur` or expensive context state changes inside the pixel loop.
- Use `{ willReadFrequently: true }` on the offscreen canvas context.
- Discard transparent pixels (`alpha === 0`) and dark background noise immediately.

```javascript
const ASCII_RAMP = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"];
const FLICKER_CHARS = ["!", "?", "$", "&", "X", "Z", "0", "1", "#", "%", "§", "¥"];

function renderAsciiDisplay() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const displayWidth = window.innerWidth;
  const displayHeight = window.innerHeight;

  // Clear display buffer to deep pitch-black
  displayCtx.save();
  displayCtx.setTransform(1, 0, 0, 1, 0, 0);
  displayCtx.fillStyle = "#050505";
  displayCtx.fillRect(0, 0, displayCanvas.width, displayCanvas.height);
  displayCtx.scale(dpr, dpr);

  const imgData = offscreenCtx.getImageData(0, 0, COLS, ROWS).data;
  const cellWidth = displayWidth / COLS;
  const cellHeight = displayHeight / ROWS;

  // Set font once outside loop
  const fontPixelSize = Math.ceil(cellHeight * 1.05);
  displayCtx.font = `800 ${fontPixelSize}px 'JetBrains Mono', monospace`;
  displayCtx.textAlign = "center";
  displayCtx.textBaseline = "middle";

  const rampLength = ASCII_RAMP.length - 1;

  for (let y = 0; y < ROWS; y++) {
    const posY = (y + 0.5) * cellHeight;
    const rowOffset = y * COLS;

    for (let x = 0; x < COLS; x++) {
      const idx = (rowOffset + x) * 4;
      const alpha = imgData[idx + 3];

      if (alpha === 0) continue; // Skip blank cells

      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];

      // Luminance with perceptual red compensation
      const redDominance = Math.max(0, r - Math.max(g, b));
      const luminance = Math.min(
        255,
        (0.299 * r + 0.587 * g + 0.114 * b + redDominance * 0.45) * (alpha / 255)
      );

      // Skip dark background noise
      if (luminance < 32) continue;

      // Select glyph (with CRT glitch flicker chance)
      let char;
      if (luminance > 125 && Math.random() < 0.035) {
        char = FLICKER_CHARS[Math.floor(Math.random() * FLICKER_CHARS.length)];
      } else {
        const rampIdx = Math.floor((luminance / 255) * rampLength);
        char = ASCII_RAMP[rampIdx];
      }

      displayCtx.fillStyle = `rgb(${r},${g},${b})`;
      displayCtx.fillText(char, (x + 0.5) * cellWidth, posY);
    }
  }

  displayCtx.restore();
}
```

---

## 3. Timeline & Kinetic Typography System

### Schema Definition
Define sequence data neutrally so any song, narration, or presentation can plug into it:

```javascript
const TIMELINE = [
  {
    start: 0.00,
    end: 2.50,
    line1: "FIRST LINE",
    line2: "SECOND LINE",       // optional
    color1: "#ffffff",
    color2: "#ffdd44",
    effect: "pop_in"            // pop_in | italic_bold | subtle_shake | zoom_in | glitch | fade_out
  }
];
```

### Kinetic Animation Recipes
Inside `renderOffscreen(timeSec)`:

1. **`pop_in`**: Cubic ease-out scale with rapid alpha fade-in.
   ```javascript
   const p = Math.min(t / 0.35, 1.0);
   const ease = 1 - Math.pow(1 - p, 3);
   scale = 0.72 + (1.0 - 0.72) * ease;
   alpha = ease;
   ```
2. **`italic_bold`**: 2D shear/skew matrix.
   ```javascript
   offscreenCtx.transform(1, 0, -0.22, 1, 0, 0); // horizontal skew
   scale = 1.05;
   ```
3. **`subtle_shake`**: High-frequency subtle jitter without scaling bounce.
   ```javascript
   shakeX = (Math.random() - 0.5) * 1.2;
   shakeY = (Math.random() - 0.5) * 1.2;
   ```
4. **`zoom_in`**: Steady scale progression.
   ```javascript
   scale = 0.96 + (1.04 - 0.96) * t;
   ```
5. **`glitch`**: Random horizontal slice dislocation.
   ```javascript
   const sliceY = Math.floor(Math.random() * (ROWS - 10));
   const sliceH = 2 + Math.floor(Math.random() * 6);
   const shiftX = Math.round((Math.random() - 0.5) * 8);
   const sliceData = offscreenCtx.getImageData(0, sliceY, COLS, sliceH);
   offscreenCtx.putImageData(sliceData, shiftX, sliceY);
   ```
6. **`fade_out`**: Non-linear power decay.
   ```javascript
   alpha = Math.max(0, 1.0 - Math.pow(t, 1.5));
   scale = 1.0 - t * 0.12;
   ```

### Auto-Fitting Typography
Prevent text overflowing the raster boundary:
```javascript
const maxAllowedWidth = COLS * 0.65;
const longestWidth = Math.max(
  offscreenCtx.measureText(line1Text).width,
  hasLine2 ? offscreenCtx.measureText(line2Text).width : 0
);
if (longestWidth > maxAllowedWidth) {
  const fitFactor = maxAllowedWidth / longestWidth;
  baseFontSize = Math.max(8, Math.floor(baseFontSize * fitFactor));
  offscreenCtx.font = `700 ${baseFontSize}px 'Outfit', sans-serif`;
}
```

---

## 4. CRT Post-Processing (CSS Overlays)

Add pure CSS overlays on top of the main canvas for CRT television warmth and aesthetic depth:

```html
<canvas id="display-canvas"></canvas>
<div class="scanlines" aria-hidden="true"></div>
<div class="vignette" aria-hidden="true"></div>
```

```css
/* CRT Scanline Striping */
.scanlines {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 10;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0) 50%,
    rgba(0, 0, 0, 0.42) 50%,
    rgba(0, 0, 0, 0.42) 100%
  );
  background-size: 100% 3px;
  opacity: 0.85;
}

/* Atmospheric Vignette */
.vignette {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 11;
  background: radial-gradient(
    circle at center,
    transparent 45%,
    rgba(5, 5, 5, 0.6) 80%,
    rgba(2, 2, 2, 0.95) 100%
  );
}
```

---

## 5. Particle Engine (Atmospheric Embers / Sparks)

Offscreen particles rendered before or behind text will automatically be digitized into colored ASCII glyphs:
```javascript
function spawnParticles(count, colorHex = "#ff3333") {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: COLS * 0.5 + (Math.random() - 0.5) * 30,
      y: ROWS * 0.5 + (Math.random() - 0.5) * 15,
      vx: (Math.random() - 0.5) * 1.8,
      vy: (Math.random() - 0.5) * 1.8,
      alpha: 1.0,
      decay: 0.025 + Math.random() * 0.035,
      color: colorHex
    });
  }
}
```

---

## 6. Recommended Fonts & Assets

- **Display Glyphs**: Google Font `JetBrains Mono` (weights `700`, `800`) or any strict monospace font.
- **Offscreen Typography**: Google Font `Outfit` (weights `700`, `800`, `900`) or heavy geometric grotesques (`Montserrat`, `Impact`, `Syne`).
- **Default Palette Tokens**:
  - Background: `#050505` (Deep CRT Black)
  - Text Primary: `#ffffff`
  - Highlighting Accent: `#ffdd44` (Gold), `#ff3a50` (Crimson), `#00ff66` (Neon Matrix Green)

---

## 7. Checklist for New Projects

When starting a new project based on this architecture:
- [ ] Set up HTML boilerplate with Google Fonts (`JetBrains Mono` and bold display font).
- [ ] Add `#display-canvas`, `.scanlines`, and `.vignette` in `index.html`.
- [ ] Copy CRT CSS into `style.css` (reset user-select, 100vw/100vh overflow hidden).
- [ ] Implement `offscreenCanvas` (`{ willReadFrequently: true }`) and `displayCanvas`.
- [ ] Implement dynamic `COLS`/`ROWS` calculation with monospace compensation.
- [ ] Define the project-specific `TIMELINE` array with durations and effects.
- [ ] Attach restart and keyboard navigation listeners (`Space`, `KeyR`, click).
- [ ] Verify 60 FPS performance: ensure zero `shadowBlur` inside the double loop.
