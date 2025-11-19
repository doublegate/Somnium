/**
 * Create Source Icon - Generates a 512x512 source icon for Somnium
 * Uses Canvas to create a retro-styled EGA icon
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICON_DIR = path.join(__dirname, '..', 'assets', 'icons');
const SIZE = 512;

// EGA color palette
const EGA_COLORS = {
  BLACK: '#000000',
  BLUE: '#0000AA',
  GREEN: '#00AA00',
  CYAN: '#00AAAA',
  RED: '#AA0000',
  MAGENTA: '#AA00AA',
  BROWN: '#AA5500',
  LIGHT_GRAY: '#AAAAAA',
  DARK_GRAY: '#555555',
  LIGHT_BLUE: '#5555FF',
  LIGHT_GREEN: '#55FF55',
  LIGHT_CYAN: '#55FFFF',
  LIGHT_RED: '#FF5555',
  LIGHT_MAGENTA: '#FF55FF',
  YELLOW: '#FFFF55',
  WHITE: '#FFFFFF',
};

// Create SVG icon
const createIconSVG = () => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <!-- Background -->
  <rect width="${SIZE}" height="${SIZE}" fill="${EGA_COLORS.BLUE}"/>

  <!-- Border frame -->
  <rect x="32" y="32" width="448" height="448" fill="none" stroke="${EGA_COLORS.LIGHT_CYAN}" stroke-width="8"/>

  <!-- "S" letter design (stylized) -->
  <path d="M 150 120
           Q 100 120, 100 170
           Q 100 200, 130 200
           L 250 200
           Q 280 200, 280 230
           Q 280 260, 250 260
           L 180 260
           Q 150 260, 150 290
           L 150 310
           Q 150 340, 180 340
           L 380 340
           Q 410 340, 410 310
           Q 410 280, 380 280
           L 260 280
           Q 230 280, 230 250
           Q 230 220, 260 220
           L 330 220
           Q 360 220, 360 190
           L 360 170
           Q 360 140, 330 140
           L 150 140
           Z"
        fill="${EGA_COLORS.YELLOW}"
        stroke="${EGA_COLORS.LIGHT_GRAY}"
        stroke-width="4"/>

  <!-- Decorative stars -->
  <circle cx="100" cy="100" r="8" fill="${EGA_COLORS.WHITE}"/>
  <circle cx="412" cy="100" r="8" fill="${EGA_COLORS.WHITE}"/>
  <circle cx="100" cy="412" r="8" fill="${EGA_COLORS.WHITE}"/>
  <circle cx="412" cy="412" r="8" fill="${EGA_COLORS.WHITE}"/>

  <!-- Moon crescent -->
  <path d="M 400 150
           Q 420 170, 420 200
           Q 420 230, 400 250
           Q 430 240, 430 200
           Q 430 160, 400 150
           Z"
        fill="${EGA_COLORS.LIGHT_CYAN}"/>

  <!-- Small text "SOMNIUM" -->
  <text x="256" y="420"
        text-anchor="middle"
        fill="${EGA_COLORS.LIGHT_CYAN}"
        font-family="monospace, 'Courier New'"
        font-size="40"
        font-weight="bold">SOMNIUM</text>
</svg>`;
};

// Ensure icon directory exists
if (!fs.existsSync(ICON_DIR)) {
  fs.mkdirSync(ICON_DIR, { recursive: true });
}

console.log('[Source Icon] Creating 512x512 source icon...');

const svgBuffer = Buffer.from(createIconSVG());

// Generate PNG from SVG
sharp(svgBuffer)
  .png()
  .toFile(path.join(ICON_DIR, 'source-icon-512x512.png'))
  .then(() => {
    console.log('✓ Generated source-icon-512x512.png');
    console.log('[Source Icon] Source icon created successfully!');
  })
  .catch((err) => {
    console.error('Error generating source icon:', err);
    process.exit(1);
  });
