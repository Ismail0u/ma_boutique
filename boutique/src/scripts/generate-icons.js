/**
 * Script pour générer les icônes PWA depuis une image source
 * Nécessite: npm install sharp
 * Usage: node scripts/generate-icons.js
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

// Recréer __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_IMAGE = path.join(__dirname, '../../public/logo.png');
const OUTPUT_DIR = path.join(__dirname, '../../public/icons');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Crée le dossier de sortie
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Génère les icônes
async function generateIcons() {
  console.log('🎨 Génération des icônes PWA...\n');

  for (const size of SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    
    try {
      await sharp(SOURCE_IMAGE)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Généré: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Erreur pour ${size}x${size}:`, error.message);
    }
  }

  console.log('\n🎉 Icônes générées avec succès !');
}

// Génère aussi un badge (72x72)
async function generateBadge() {
  const badgePath = path.join(OUTPUT_DIR, 'badge-72x72.png');
  
  try {
    await sharp(SOURCE_IMAGE)
      .resize(72, 72, {
        fit: 'contain',
        background: { r: 37, g: 99, b: 235, alpha: 1 } // theme color
      })
      .png()
      .toFile(badgePath);
    
    console.log('✅ Badge généré: badge-72x72.png');
  } catch (error) {
    console.error('❌ Erreur badge:', error.message);
  }
}

// Exécution
(async () => {
  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.error('❌ Fichier source introuvable: public/logo.png');
    console.log('💡 Créez d\'abord un fichier public/logo.png (512x512 recommandé)');
    process.exit(1);
  }

  await generateIcons();
  await generateBadge();
})();