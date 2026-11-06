import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateIcons() {
  const svgBuffer = fs.readFileSync(path.resolve('./public/icon.svg'));
  const sizes = [
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'pwa-maskable-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon.ico', size: 48 },
  ];

  for (const item of sizes) {
    const outPath = path.resolve('./public', item.name);
    await sharp(svgBuffer)
      .resize(item.size, item.size)
      .png()
      .toFile(outPath);
    console.log(`Generated ${item.name}`);
  }
}

generateIcons().catch(console.error);
