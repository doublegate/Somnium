/**
 * PWA Icon Generator Script
 * Generates all required icon sizes from a source image using sharp
 *
 * Usage: node scripts/generate-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes required for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

const ICON_DIR = path.join(__dirname, '..', 'assets', 'icons');
const SOURCE_ICON = path.join(ICON_DIR, 'source-icon-512x512.png');

// Create icons directory if it doesn't exist
if (!fs.existsSync(ICON_DIR)) {
  fs.mkdirSync(ICON_DIR, { recursive: true });
}

console.log('[Icon Generator] PWA Icon Generator');
console.log('[Icon Generator] ====================\n');

// Check if source icon exists
if (!fs.existsSync(SOURCE_ICON)) {
  console.log('[Icon Generator] Source icon not found!');
  console.log('[Icon Generator] Creating source icon first...\n');

  // Import and run create-source-icon
  import('./create-source-icon.js').then(() => {
    // Wait a bit for file to be created
    setTimeout(() => {
      generateAllIcons();
    }, 1000);
  });
} else {
  generateAllIcons();
}

async function generateAllIcons() {
  console.log('[Icon Generator] Generating PNG icons from source...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const size of ICON_SIZES) {
    try {
      const outputPath = path.join(ICON_DIR, `icon-${size}x${size}.png`);

      await sharp(SOURCE_ICON)
        .resize(size, size, {
          kernel: sharp.kernel.lanczos3,
          fit: 'cover',
        })
        .png({
          quality: 100,
          compressionLevel: 9,
        })
        .toFile(outputPath);

      console.log(`✓ Generated icon-${size}x${size}.png`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to generate icon-${size}x${size}.png:`, error.message);
      errorCount++;
    }
  }

  // Generate Apple Touch Icon (180x180)
  try {
    const appleTouchPath = path.join(ICON_DIR, 'apple-touch-icon.png');
    await sharp(SOURCE_ICON)
      .resize(180, 180, {
        kernel: sharp.kernel.lanczos3,
        fit: 'cover',
      })
      .png({ quality: 100 })
      .toFile(appleTouchPath);

    console.log('✓ Generated apple-touch-icon.png (180x180)');
    successCount++;
  } catch (error) {
    console.error('✗ Failed to generate apple-touch-icon.png:', error.message);
    errorCount++;
  }

  // Generate favicon (32x32, 16x16)
  try {
    const favicon32Path = path.join(ICON_DIR, 'favicon-32x32.png');
    await sharp(SOURCE_ICON)
      .resize(32, 32, {
        kernel: sharp.kernel.lanczos3,
        fit: 'cover',
      })
      .png({ quality: 100 })
      .toFile(favicon32Path);

    console.log('✓ Generated favicon-32x32.png');
    successCount++;
  } catch (error) {
    console.error('✗ Failed to generate favicon-32x32.png:', error.message);
    errorCount++;
  }

  try {
    const favicon16Path = path.join(ICON_DIR, 'favicon-16x16.png');
    await sharp(SOURCE_ICON)
      .resize(16, 16, {
        kernel: sharp.kernel.lanczos3,
        fit: 'cover',
      })
      .png({ quality: 100 })
      .toFile(favicon16Path);

    console.log('✓ Generated favicon-16x16.png');
    successCount++;
  } catch (error) {
    console.error('✗ Failed to generate favicon-16x16.png:', error.message);
    errorCount++;
  }

  console.log('\n[Icon Generator] ====================');
  console.log(`[Icon Generator] Success: ${successCount} icons generated`);
  if (errorCount > 0) {
    console.log(`[Icon Generator] Errors: ${errorCount} icons failed`);
  }
  console.log('[Icon Generator] Done!\n');

  console.log('Next steps:');
  console.log('1. Update manifest.json to reference these icons');
  console.log('2. Add <link> tags to index.html for favicons');
  console.log('3. Test PWA installation on mobile devices\n');
}
