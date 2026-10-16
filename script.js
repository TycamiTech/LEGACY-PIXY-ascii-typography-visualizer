/* ==========================================================================
   LEGACY - PIXY | HD Colored ASCII Art Real-Time Typography Visualizer
   ========================================================================== */

// --- Global Configuration & Performance Settings ---
const TOTAL_DURATION = 23.99;
const SPEED_MULTIPLIER = 1.0;

// Grid Resolution Parameters
const COLS = 220;
let ROWS = 100;

// ASCII Gliph Ramp & CRT Flicker Characters
const ASCII_RAMP = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"];
const FLICKER_CHARS = ["!", "?", "$", "&", "X", "Z", "0", "1", "#", "%", "§", "¥"];

// --- Timeline Data (Normalized from LRC 01:22.15 to 01:46.14) ---
const TIMELINE = [
  { start: 0.00, end: 1.10, line1: "Swords on", line2: "my back", color1: "#ffffff", color2: "#cccccc", effect: "pop_in" },
  { start: 1.10, end: 2.40, line1: "Serpents on", line2: "attack", color1: "#55ff55", color2: "#ffffff", effect: "italic_bold" },
  { start: 2.40, end: 4.20, line1: "Venom when", line2: "they smile,", color1: "#00ff66", color2: "#ffffff", effect: "subtle_shake" },
  { start: 4.20, end: 6.85, line1: "but my halo", line2: "keep me strapped", color1: "#ffdd44", color2: "#ffffff", effect: "zoom_in" },
  { start: 6.85, end: 8.64, line1: "But my halo", line2: "keep me strapped", color1: "#ffdd44", color2: "#ff3a50", effect: "italic_bold" },
  // 8.64 - 11.47 Instrumental Pause (Clean black screen)
  { start: 11.37, end: 12.80, line1: "I don't know", line2: "why they", color1: "#cccccc", color2: "#ffffff", effect: "pop_in" },
  { start: 12.80, end: 14.32, line1: "HATE ON ME", line2: "", color1: "#ff3a50", color2: "#ffffff", effect: "intense_shake_glitch" },
  { start: 14.32, end: 17.18, line1: "They can smell", line2: "the legacy", color1: "#ffffff", color2: "#ffdd44", effect: "zoom_in" },
  { start: 17.18, end: 19.76, line1: "I'm standing on", line2: "SUPREMACY", color1: "#ffffff", color2: "#ff3a50", effect: "subtle_shake" },
  { start: 19.76, end: 21.60, line1: "Got bitches", line2: "tryna come", color1: "#ffdd44", color2: "#ffffff", effect: "italic_bold" },
  { start: 21.60, end: 25.99, line1: "FOR ME", line2: "", color1: "#ff3a50", color2: "#ffffff", effect: "fade_out" }
];

// --- Engine State & Canvas Pipeline ---
const displayCanvas = document.getElementById("display-canvas");
const displayCtx = displayCanvas.getContext("2d");

// Offscreen Low-Res Raster Target
const offscreenCanvas = document.createElement("canvas");
const offscreenCtx = offscreenCanvas.getContext("2d", { willReadFrequently: true });

// Playback & Timing Variables
let playbackTime = 0.0;
let lastFrameTimestamp = performance.now();
let isPlaying = true;

// Background / Dynamic Particles System
const particles = [];
const MAX_PARTICLES = 60;

function spawnParticles(count, colorHex = "#ff3333") {
  for (let i = 0; i < count; i++) {
    if (particles.length >= MAX_PARTICLES) particles.shift();
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

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;
    if (p.alpha <= 0 || p.x < 0 || p.x >= COLS || p.y < 0 || p.y >= ROWS) {
      particles.splice(i, 1);
    }
  }
}

// --- Canvas Sizing & Dynamic Grid Ratio ---
function resizeCanvases() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const displayWidth = window.innerWidth;
  const displayHeight = window.innerHeight;

  // Set High-DPI display canvas buffer
  displayCanvas.width = Math.round(displayWidth * dpr);
  displayCanvas.height = Math.round(displayHeight * dpr);
  displayCanvas.style.width = displayWidth + "px";
  displayCanvas.style.height = displayHeight + "px";

  // Calculate dynamic ROWS based on aspect ratio and monospace char proportions
  const screenAspect = displayHeight / displayWidth;
  const targetCharRatio = 0.55; // Monospace aspect ratio (width / height)
  ROWS = Math.max(80, Math.min(130, Math.round(COLS * screenAspect * (1 / targetCharRatio) * 0.5)));

  offscreenCanvas.width = COLS;
  offscreenCanvas.height = ROWS;
}

window.addEventListener("resize", resizeCanvases);
resizeCanvases();

// --- Offscreen Rasterization (`Outfit` 700) ---
function renderOffscreen(timeSec) {
  // 1. Precise active item search
  const activeItem = TIMELINE.find(item => timeSec >= item.start && timeSec < item.end);

  // If activeItem is not found (such as instrumental pause 8.64s - 11.47s),
  // immediately clear offscreen canvas to pitch black and return.
  if (!activeItem) {
    offscreenCtx.fillStyle = "#000000";
    offscreenCtx.fillRect(0, 0, COLS, ROWS);
    return;
  }

  // Clear offscreen background
  offscreenCtx.fillStyle = "#000000";
  offscreenCtx.fillRect(0, 0, COLS, ROWS);

  // Calculate normalized progress within the segment [0, 1]
  const segmentDuration = Math.max(0.01, activeItem.end - activeItem.start);
  const t = Math.max(0, Math.min(1, (timeSec - activeItem.start) / segmentDuration));

  // Effect variables
  let scale = 1.0;
  let alpha = 1.0;
  let shakeX = 0;
  let shakeY = 0;
  let fontSizeMultiplier = 1.0;
  let isItalic = false;
  let isGlitch = false;
  let drawShockwave = false;

  switch (activeItem.effect) {
    case "pop_in": {
      // Cubic ease-out scaling (0.72 -> 1.0) with rapid fade-in
      const p = Math.min(t / 0.35, 1.0);
      const ease = 1 - Math.pow(1 - p, 3);
      scale = 0.72 + (1.0 - 0.72) * ease;
      alpha = ease;
      break;
    }
    case "italic_bold": {
      // Skew horizontal transform and slight scale up
      isItalic = true;
      scale = 1.05;
      alpha = 1.0;
      break;
    }
    case "subtle_shake": {
      // Microscopic random jitter
      shakeX = (Math.random() - 0.5) * 1.2;
      shakeY = (Math.random() - 0.5) * 1.2;
      scale = 1.0;
      alpha = 1.0;
      break;
    }
    case "zoom_in": {
      // Gentle subtle scale increase without bouncing
      scale = 0.96 + (1.04 - 0.96) * t;
      alpha = 1.0;
      break;
    }
    case "intense_shake_huge": {
      // Clean steady shake without forward/backward pulsing
      shakeX = (Math.random() - 0.5) * 1.5;
      shakeY = (Math.random() - 0.5) * 1.5;
      scale = 1.0;
      alpha = 1.0;
      break;
    }
    case "intense_shake_glitch": {
      // Horizontal glitch slicing with stable scale (no bouncing)
      shakeX = (Math.random() - 0.5) * 1.8;
      shakeY = (Math.random() - 0.5) * 1.8;
      scale = 1.0;
      isGlitch = true;
      break;
    }
    case "fade_out": {
      // Gradual alpha drop (1.0 - t^1.5) and soft shrink
      alpha = Math.max(0, 1.0 - Math.pow(t, 1.5));
      scale = 1.0 - t * 0.12;
      break;
    }
    case "dim_calm": {
      alpha = 0.65 + Math.sin(t * Math.PI * 2) * 0.15;
      scale = 0.96;
      break;
    }
    case "normal":
    default: {
      scale = 1.0;
      alpha = 1.0;
      break;
    }
  }

  // Draw Background Particles
  if (particles.length > 0) {
    offscreenCtx.save();
    particles.forEach(p => {
      offscreenCtx.fillStyle = p.color;
      offscreenCtx.globalAlpha = Math.max(0, p.alpha * 0.85);
      offscreenCtx.fillRect(Math.round(p.x), Math.round(p.y), 1.5, 1.5);
    });
    offscreenCtx.restore();
  }

  // --- Prepare Typography Text & Sizing ---
  const line1Text = (activeItem.line1 || "").toUpperCase();
  const line2Text = (activeItem.line2 || "").toUpperCase();
  const hasLine2 = line2Text.trim().length > 0;

  // Adaptive base font size based on grid ROWS (compact and balanced)
  let baseFontSize = Math.round(ROWS * (hasLine2 ? 0.125 : 0.165) * fontSizeMultiplier);

  // Set font for measurement
  offscreenCtx.save();
  offscreenCtx.font = `700 ${baseFontSize}px 'Outfit', sans-serif`;
  if ("letterSpacing" in offscreenCtx) {
    offscreenCtx.letterSpacing = "1.5px";
  }

  // Measure text and constrain to avoid taking too much screen real estate
  const maxAllowedWidth = COLS * 0.62;
  const w1 = offscreenCtx.measureText(line1Text).width;
  const w2 = hasLine2 ? offscreenCtx.measureText(line2Text).width : 0;
  const longestWidth = Math.max(w1, w2);

  if (longestWidth > maxAllowedWidth) {
    const fitFactor = maxAllowedWidth / longestWidth;
    baseFontSize = Math.max(8, Math.floor(baseFontSize * fitFactor));
    offscreenCtx.font = `700 ${baseFontSize}px 'Outfit', sans-serif`;
  }

  // Transform matrix for animations
  offscreenCtx.translate(COLS * 0.5 + shakeX, ROWS * 0.5 + shakeY);

  if (isItalic) {
    // Skew transformation horizontal (-0.22)
    offscreenCtx.transform(1, 0, -0.22, 1, 0, 0);
  }

  offscreenCtx.scale(scale, scale);
  offscreenCtx.globalAlpha = Math.max(0, Math.min(1, alpha));
  offscreenCtx.textAlign = "center";
  offscreenCtx.textBaseline = "middle";

  const lineSpacing = baseFontSize * 1.18;

  if (hasLine2) {
    const yOffset1 = -lineSpacing * 0.5;
    const yOffset2 = lineSpacing * 0.5;

    offscreenCtx.fillStyle = activeItem.color1 || "#ffffff";
    offscreenCtx.fillText(line1Text, 0, yOffset1);

    offscreenCtx.fillStyle = activeItem.color2 || "#ffffff";
    offscreenCtx.fillText(line2Text, 0, yOffset2);
  } else {
    offscreenCtx.fillStyle = activeItem.color1 || "#ffffff";
    offscreenCtx.fillText(line1Text, 0, 0);
  }

  offscreenCtx.restore();

  // Horizontal Canvas Slicing Glitch Effect
  if (isGlitch) {
    const numSlices = 2 + Math.floor(Math.random() * 3);
    for (let s = 0; s < numSlices; s++) {
      const sliceY = Math.floor(Math.random() * (ROWS - 10));
      const sliceH = 2 + Math.floor(Math.random() * 6);
      const shiftX = Math.round((Math.random() - 0.5) * 8);
      if (shiftX !== 0) {
        try {
          const sliceData = offscreenCtx.getImageData(0, sliceY, COLS, sliceH);
          offscreenCtx.putImageData(sliceData, shiftX, sliceY);
        } catch (e) {
          // ignore boundary anomalies
        }
      }
    }
  }
}

// --- High-DPI Display ASCII Rendering (`JetBrains Mono` 800) ---
// CRITICAL PERFORMANCE NOTE: Absolutely no shadowBlur calls inside the pixel loop!
function renderAsciiDisplay() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const displayWidth = window.innerWidth;
  const displayHeight = window.innerHeight;

  // Clear display canvas to pitch-black
  displayCtx.save();
  displayCtx.setTransform(1, 0, 0, 1, 0, 0);
  displayCtx.fillStyle = "#050505";
  displayCtx.fillRect(0, 0, displayCanvas.width, displayCanvas.height);

  // Scale display context for high-DPI
  displayCtx.scale(dpr, dpr);

  // Fetch low-res pixel data from offscreen canvas
  const imgData = offscreenCtx.getImageData(0, 0, COLS, ROWS).data;

  const cellWidth = displayWidth / COLS;
  const cellHeight = displayHeight / ROWS;

  // Monospace font configuration
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

      // Discard transparent pixels immediately
      if (alpha === 0) continue;

      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];

      // Luminance calculation with perceptual red compensation for bright, solid ASCII glyphs
      const redDominance = Math.max(0, r - Math.max(g, b));
      const luminance = Math.min(255, (0.299 * r + 0.587 * g + 0.114 * b + redDominance * 0.45) * (alpha / 255));

      // Threshold: Ignore dark noise below 32 to maintain deep black background
      if (luminance < 32) continue;

      // Select ASCII character or CRT flicker glyph
      let char;
      if (luminance > 125 && Math.random() < 0.035) {
        char = FLICKER_CHARS[Math.floor(Math.random() * FLICKER_CHARS.length)];
      } else {
        const rampIdx = Math.floor((luminance / 255) * rampLength);
        char = ASCII_RAMP[rampIdx];
      }

      const posX = (x + 0.5) * cellWidth;

      // Color rendering without shadowBlur
      displayCtx.fillStyle = `rgb(${r},${g},${b})`;
      displayCtx.fillText(char, posX, posY);
    }
  }

  displayCtx.restore();
}

// --- Main Animation Loop (60 FPS) ---
function animationLoop(timestamp) {
  const deltaSec = Math.min((timestamp - lastFrameTimestamp) / 1000, 0.1);
  lastFrameTimestamp = timestamp;

  if (isPlaying) {
    playbackTime += deltaSec * SPEED_MULTIPLIER;

    // Seamless loop when TOTAL_DURATION is reached
    if (playbackTime >= TOTAL_DURATION) {
      playbackTime = playbackTime % TOTAL_DURATION;
    }
  }

  // Update dynamic particle states
  updateParticles();

  // 1. Offscreen Low-Res Rasterization
  renderOffscreen(playbackTime);

  // 2. High-DPI Display ASCII Conversion
  renderAsciiDisplay();

  requestAnimationFrame(animationLoop);
}

// --- Navigation & Control Handlers ---
function restartVisualizer() {
  playbackTime = 0.0;
  particles.length = 0;
}

// Click Canvas to Restart
displayCanvas.addEventListener("click", () => {
  restartVisualizer();
});

// Keyboard shortcuts (Space = Restart, R = Restart)
window.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "KeyR") {
    e.preventDefault();
    restartVisualizer();
  }
});

// Kick off animation loop
requestAnimationFrame(animationLoop);
