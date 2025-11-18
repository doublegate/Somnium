/**
 * PWA Icon Generator Script
 * Generates all required icon sizes from a source image
 *
 * Usage: node scripts/generate-icons.js [source-image.png]
 */

const fs = require('fs');
const path = require('path');

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

// Create a simple Node.js icon generator using Canvas if available
try {
  const { createCanvas } = require('canvas');

  console.log('');
  console.log('[Icon Generator] Canvas library detected! Generating PNG icons...');
  console.log('');

  ICON_SIZES.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0000AA';
    ctx.fillRect(0, 0, size, size);

    // Text
    ctx.fillStyle = '#FFFF55';
    ctx.font = `bold ${size / 6}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', size / 2, size / 2);

    // Save
    const buffer = canvas.toBuffer('image/png');
    const pngPath = path.join(ICON_DIR, `icon-${size}x${size}.png`);
    fs.writeFileSync(pngPath, buffer);
    console.log(`✓ Generated ${pngPath}`);
  });

  console.log('');
  console.log('[Icon Generator] PNG icons generated successfully!');
} catch (error) {
  console.log('');
  console.log('[Icon Generator] Canvas library not found.');
  console.log('[Icon Generator] Install with: npm install canvas');
  console.log('[Icon Generator] Or use placeholders and replace manually.');
}

console.log('');
console.log('[Icon Generator] Done!');
