/**
 * PWA Icon Generator Script
 * Generates all required icon sizes from a source image
 *
 * Usage: node scripts/generate-icons.js [source-image.png]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes required for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

const ICON_DIR = path.join(__dirname, '..', 'assets', 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(ICON_DIR)) {
  fs.mkdirSync(ICON_DIR, { recursive: true });
}

console.log('[Icon Generator] PWA Icon Generator');
console.log('[Icon Generator] ====================');
console.log('');
console.log('This script requires a source image to generate icons.');
console.log('');
console.log('Manual Steps:');
console.log('1. Create a 512x512px PNG image for your app icon');
console.log('2. Save it as assets/icons/icon-512x512.png');
console.log('3. Use an online tool to generate other sizes:');
console.log('   - https://realfavicongenerator.net/');
console.log('   - https://www.pwabuilder.com/imageGenerator');
console.log('');
console.log('Required sizes:');
ICON_SIZES.forEach(size => {
  console.log(`  - ${size}x${size}`);
});
console.log('');
console.log('Or use ImageMagick to generate automatically:');
console.log('');
console.log('# Install ImageMagick');
console.log('# Ubuntu: sudo apt-get install imagemagick');
console.log('# Mac: brew install imagemagick');
console.log('');
console.log('# Generate all sizes');
ICON_SIZES.forEach(size => {
  console.log(`convert assets/icons/source.png -resize ${size}x${size} assets/icons/icon-${size}x${size}.png`);
});
console.log('');

// Generate placeholder SVG icons
const generatePlaceholderSVG = (size) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0000AA"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#FFFF55" font-family="monospace" font-size="${size / 8}">Somnium</text>
</svg>`;
};

console.log('[Icon Generator] Generating placeholder SVG icons...');
console.log('');

ICON_SIZES.forEach(size => {
  const svgContent = generatePlaceholderSVG(size);
  const svgPath = path.join(ICON_DIR, `placeholder-icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  console.log(`✓ Generated ${svgPath}`);
});

console.log('');
console.log('[Icon Generator] Placeholder SVG icons generated!');
console.log('[Icon Generator] Replace them with PNG versions for production.');
console.log('');
console.log('[Icon Generator] For PNG generation, use ImageMagick or online tools.');
console.log('[Icon Generator] SVG icons will work in most modern browsers.');
console.log('');
console.log('[Icon Generator] Done!');
