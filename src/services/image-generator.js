// Fabric.js v7 requires a DOM environment in Node.js — set it up first
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;
global.navigator = dom.window.navigator;

// Fabric.js v7 calls requestAnimationFrame internally — polyfill it on JSDOM's window
global.window.requestAnimationFrame =
  global.window.requestAnimationFrame ||
  ((cb) => setTimeout(() => cb(performance.now()), 16));
global.window.cancelAnimationFrame =
  global.window.cancelAnimationFrame ||
  ((id) => clearTimeout(id));

// Fabric v7 CommonJS: default export is the fabric namespace (not named exports)
const fabric = require('fabric');
const { createCanvas } = require('canvas');
const path = require('path');
const fs = require('fs-extra');

// Pick a color palette based on business type hints
const getPalette = (business) => {
  const types = (business.types || []).join(' ').toLowerCase();
  const name = (business.name || '').toLowerCase();

  // Coffee / food / restaurant — warm tones
  if (
    types.includes('cafe') ||
    types.includes('coffee') ||
    types.includes('restaurant') ||
    types.includes('food') ||
    types.includes('bakery') ||
    name.includes('coffee') ||
    name.includes('café') ||
    name.includes('cafe') ||
    name.includes('brew') ||
    name.includes('bake') ||
    name.includes('roast')
  ) {
    return {
      bgStart: '#2c1810',
      bgMid: '#3d2a1e',
      bgEnd: '#1a0f0a',
      accent1: '#d4a373',
      accent2: '#8b5e3c',
      accent3: '#e8c390',
    };
  }
  // Tech / corporate — cool dark tones
  if (
    types.includes('tech') ||
    types.includes('software') ||
    name.includes('tech') ||
    name.includes('digital') ||
    name.includes('code')
  ) {
    return {
      bgStart: '#0a0a1a',
      bgMid: '#0f0f2e',
      bgEnd: '#1a1a3e',
      accent1: '#4fc3f7',
      accent2: '#0288d1',
      accent3: '#81d4fa',
    };
  }
  // Default: premium cinematic dark
  return {
    bgStart: '#1a1a2e',
    bgMid: '#16213e',
    bgEnd: '#0f3460',
    accent1: '#e94560',
    accent2: '#533483',
    accent3: '#c23152',
  };
};

// Helper: create a gradient object for a rectangle fill
const makeGradient = (pal, w, h) =>
  new fabric.Gradient({
    type: 'linear',
    coords: { x1: 0, y1: 0, x2: w, y2: h },
    colorStops: [
      { offset: 0, color: pal.bgStart },
      { offset: 0.5, color: pal.bgMid },
      { offset: 1, color: pal.bgEnd },
    ],
  });

// Helper: rgba color string from hex + alpha
const rgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

// ─── Hero image (1920×1080) ──────────────────────────────────────────
const generateHeroImage = async (business, outputDir) => {
  const W = 1920;
  const H = 1080;
  const pal = getPalette(business);

  const nodeCanvas = createCanvas(W, H);
  // v7 StaticCanvas: pass nodeCanvas as the canvasEl option
  const canvas = new fabric.StaticCanvas(null, { canvasEl: nodeCanvas, width: W, height: H });

  // Background gradient
  const bg = new fabric.Rect({
    left: 0,
    top: 0,
    width: W,
    height: H,
    fill: makeGradient(pal, W, H),
    selectable: false,
  });
  canvas.add(bg);

  // Radial glow 1 (top-left)
  const glow1 = new fabric.Circle({
    left: W * 0.2,
    top: H * 0.2,
    radius: Math.max(W, H) * 0.5,
    fill: rgba(pal.accent1, 0.08),
    selectable: false,
  });
  canvas.add(glow1);

  // Radial glow 2 (bottom-right)
  const glow2 = new fabric.Circle({
    left: W * 0.8,
    top: H * 0.7,
    radius: Math.max(W, H) * 0.6,
    fill: rgba(pal.accent2, 0.06),
    selectable: false,
  });
  canvas.add(glow2);

  // Orbiting circle decorations (stroked, no fill)
  const rings = [
    { cx: 300, cy: 200, r: 120, color: pal.accent1, alpha: 0.08, sw: 1.5 },
    { cx: 310, cy: 190, r: 180, color: pal.accent2, alpha: 0.05, sw: 1 },
    { cx: 1580, cy: 850, r: 160, color: pal.accent1, alpha: 0.07, sw: 1.5 },
    { cx: 1560, cy: 830, r: 230, color: pal.accent2, alpha: 0.04, sw: 1 },
  ];
  rings.forEach((r) => {
    canvas.add(
      new fabric.Circle({
        left: r.cx,
        top: r.cy,
        radius: r.r,
        fill: 'transparent',
        stroke: rgba(r.color, r.alpha),
        strokeWidth: r.sw,
        selectable: false,
      })
    );
  });

  // Floating decorative dots
  const dots = [
    { cx: 450, cy: 150, r: 3, alpha: 0.3 },
    { cx: 1450, cy: 200, r: 4, alpha: 0.25 },
    { cx: 1720, cy: 600, r: 3, alpha: 0.2 },
    { cx: 250, cy: 750, r: 2, alpha: 0.3 },
    { cx: 900, cy: 100, r: 2, alpha: 0.2 },
  ];
  dots.forEach((d) => {
    canvas.add(
      new fabric.Circle({
        left: d.cx,
        top: d.cy,
        radius: d.r,
        fill: rgba(pal.accent3, d.alpha),
        selectable: false,
      })
    );
  });

  // Center accent glow (soft focal point where HTML text will overlay)
  const focalGlow = new fabric.Circle({
    left: W / 2,
    top: H / 2,
    radius: 300,
    fill: rgba(pal.accent1, 0.04),
    selectable: false,
  });
  canvas.add(focalGlow);

  // Vertical accent line
  const vLine = new fabric.Line([W / 2, 0, W / 2, 350], {
    stroke: rgba(pal.accent1, 0.08),
    strokeWidth: 2,
    selectable: false,
  });
  canvas.add(vLine);

  // Horizontal accent line
  const hLine = new fabric.Line([800, 350, 1120, 350], {
    stroke: rgba(pal.accent1, 0.12),
    strokeWidth: 1,
    selectable: false,
  });
  canvas.add(hLine);

  // Bottom gradient fade overlay (use rgba(x,0) instead of 'transparent')
  const fadeGrad = new fabric.Gradient({
    type: 'linear',
    coords: { x1: 0, y1: 0, x2: 0, y2: 180 },
    colorStops: [
      { offset: 0, color: rgba(pal.accent1, 0.18) },
      { offset: 1, color: rgba(pal.accent1, 0) },
    ],
  });
  const fadeRect = new fabric.Rect({
    left: 0,
    top: H - 180,
    width: W,
    height: 180,
    fill: fadeGrad,
    selectable: false,
  });
  canvas.add(fadeRect);

  canvas.renderAll();

  const buffer = nodeCanvas.toBuffer('image/jpeg', { quality: 82 });
  await fs.ensureDir(path.join(outputDir, 'images'));
  await fs.writeFile(path.join(outputDir, 'images', 'hero.jpg'), buffer);
};

// ─── Divider top (1920×160) ─────────────────────────────────────────
const generateDividerTop = async (business, outputDir) => {
  const W = 1920;
  const H = 160;
  const pal = getPalette(business);

  const nodeCanvas = createCanvas(W, H);
  const canvas = new fabric.StaticCanvas(null, { canvasEl: nodeCanvas, width: W, height: H });

  // Wave path 1
  const wave1 = new fabric.Path(
    'M0,80 C320,160 480,0 960,80 C1440,160 1600,0 1920,80 L1920,0 L0,0 Z',
    {
      fill: rgba(pal.bgStart, 0.18),
      selectable: false,
    }
  );
  canvas.add(wave1);

  // Wave path 2
  const wave2 = new fabric.Path(
    'M0,100 C400,180 560,0 960,100 C1360,200 1520,0 1920,100 L1920,0 L0,0 Z',
    {
      fill: rgba(pal.accent1, 0.06),
      selectable: false,
    }
  );
  canvas.add(wave2);

  canvas.renderAll();

  const buffer = nodeCanvas.toBuffer('image/png');
  await fs.ensureDir(path.join(outputDir, 'images'));
  await fs.writeFile(path.join(outputDir, 'images', 'divider-top.png'), buffer);
};

// ─── Divider bottom (1920×160) ──────────────────────────────────────
const generateDividerBottom = async (business, outputDir) => {
  const W = 1920;
  const H = 160;
  const pal = getPalette(business);

  const nodeCanvas = createCanvas(W, H);
  const canvas = new fabric.StaticCanvas(null, { canvasEl: nodeCanvas, width: W, height: H });

  // Wave path 1
  const wave1 = new fabric.Path(
    'M0,80 C480,-40 640,160 960,80 C1280,0 1440,160 1920,80 L1920,160 L0,160 Z',
    {
      fill: rgba(pal.accent1, 0.08),
      selectable: false,
    }
  );
  canvas.add(wave1);

  // Wave path 2
  const wave2 = new fabric.Path(
    'M0,100 C320,20 400,180 960,100 C1520,20 1600,180 1920,100 L1920,160 L0,160 Z',
    {
      fill: rgba(pal.bgEnd, 0.15),
      selectable: false,
    }
  );
  canvas.add(wave2);

  canvas.renderAll();

  const buffer = nodeCanvas.toBuffer('image/png');
  await fs.ensureDir(path.join(outputDir, 'images'));
  await fs.writeFile(path.join(outputDir, 'images', 'divider-bottom.png'), buffer);
};

// ─── Pattern tile (400×400) ─────────────────────────────────────────
const generatePattern = async (business, outputDir) => {
  const W = 400;
  const H = 400;
  const pal = getPalette(business);

  const nodeCanvas = createCanvas(W, H);
  const canvas = new fabric.StaticCanvas(null, { canvasEl: nodeCanvas, width: W, height: H });

  // Dot grid pattern (40px spacing)
  for (let x = 20; x < W; x += 40) {
    for (let y = 20; y < H; y += 40) {
      canvas.add(
        new fabric.Circle({
          left: x,
          top: y,
          radius: 1.5,
          fill: rgba(pal.accent1, 0.08),
          selectable: false,
        })
      );
    }
  }

  // Diagonal line grid pattern (80px spacing)
  for (let row = 0; row < H; row += 80) {
    for (let col = 0; col < W; col += 80) {
      canvas.add(
        new fabric.Line([col, row + 40, col + 40, row], {
          stroke: rgba(pal.accent2, 0.05),
          strokeWidth: 0.5,
          selectable: false,
        })
      );
    }
  }

  canvas.renderAll();

  const buffer = nodeCanvas.toBuffer('image/png');
  await fs.ensureDir(path.join(outputDir, 'images'));
  await fs.writeFile(path.join(outputDir, 'images', 'pattern.png'), buffer);
};

// ─── Generate all images for a business ─────────────────────────────
const generateAllImages = async (business, outputDir) => {
  console.log('Generating programmatic images for business.', { business: business.name });

  await Promise.all([
    generateHeroImage(business, outputDir),
    generateDividerTop(business, outputDir),
    generateDividerBottom(business, outputDir),
    generatePattern(business, outputDir),
  ]);

  console.log('All images generated.', { business: business.name });
};

module.exports = {
  generateAllImages,
};
