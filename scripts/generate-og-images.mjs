/**
 * generate-og-images.mjs
 * Generates one 1200x630 SVG og:image per breed into public/og/{slug}.svg
 *
 * Usage: node scripts/generate-og-images.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const INDEX_PATH   = join(ROOT, 'src', 'data', 'index.json');
const BREEDS_DIR   = join(ROOT, 'src', 'data', 'breeds');
const OUT_DIR      = join(ROOT, 'public', 'og');

// ── Palette ──────────────────────────────────────────────────────────────────
const CREAM       = '#FDF6E3';
const GREEN_DARK  = '#2D5F2D';
const GREEN_MID   = '#3D7A3D';
const BROWN_DARK  = '#2C1810';
const BROWN_MID   = '#6B3A2A';
const AMBER       = '#D4A843';
const WHITE       = '#FFFFFF';
const MUTED       = '#7A6A5A';

// ── Paw print path (decorative, bottom-right) ────────────────────────────────
// Centred on 0,0 — will be translated via transform
const PAW_PATH = `
  M 0,-22
  C -8,-22 -14,-16 -14,-8
  C -14,2 -6,10 0,14
  C 6,10 14,2 14,-8
  C 14,-16 8,-22 0,-22 Z

  M -20,-30
  C -25,-30 -28,-25 -28,-20
  C -28,-15 -25,-11 -20,-11
  C -15,-11 -12,-15 -12,-20
  C -12,-25 -15,-30 -20,-30 Z

  M 20,-30
  C 15,-30 12,-25 12,-20
  C 12,-15 15,-11 20,-11
  C 25,-11 28,-15 28,-20
  C 28,-25 25,-30 20,-30 Z

  M -10,-38
  C -15,-38 -18,-34 -18,-29
  C -18,-24 -15,-21 -10,-21
  C -5,-21 -2,-24 -2,-29
  C -2,-34 -5,-38 -10,-38 Z

  M 10,-38
  C 5,-38 2,-34 2,-29
  C 2,-24 5,-21 10,-21
  C 15,-21 18,-24 18,-29
  C 18,-34 15,-38 10,-38 Z
`.trim();

// ── Size label helper ─────────────────────────────────────────────────────────
function sizeLabel(size) {
  const map = { small: 'Small', medium: 'Medium', large: 'Large', giant: 'Giant' };
  return map[(size || '').toLowerCase()] || 'Medium';
}

// ── Badge pill width (approximate, based on text length) ─────────────────────
function badgeWidth(label) {
  return label.length * 11 + 32;  // rough monospace estimate with padding
}

// ── Main SVG builder ──────────────────────────────────────────────────────────
function buildSVG(breed) {
  const name      = breed.name || 'Unknown Breed';
  const group     = breed.group || '';
  const size      = sizeLabel(breed.size);
  const lsMin     = breed.lifespan_min  ?? '?';
  const lsMax     = breed.lifespan_max  ?? '?';
  const lifespan  = `Lifespan: ${lsMin}–${lsMax} years`;

  // Badge geometry
  const bw        = badgeWidth(size);
  const bx        = 600 - bw / 2;   // centred horizontally
  const by        = 390;

  // Break very long breed names onto two lines (>22 chars)
  const nameParts = name.length > 22
    ? splitName(name)
    : [name];

  const nameY1    = nameParts.length === 1 ? 310 : 285;
  const nameY2    = 335;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <!-- Background -->
  <rect width="1200" height="630" fill="${CREAM}"/>

  <!-- Top bar -->
  <rect x="0" y="0" width="1200" height="80" fill="${GREEN_DARK}"/>

  <!-- Logo text in top bar -->
  <text x="40" y="52"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="26"
    font-weight="700"
    fill="${WHITE}"
    letter-spacing="1">BreedHealth</text>

  <!-- Tagline in top bar -->
  <text x="40" y="72"
    font-family="Arial, Helvetica, sans-serif"
    font-size="13"
    fill="rgba(255,255,255,0.75)"
    letter-spacing="0.5">Complete health guides for every breed</text>

  <!-- Amber accent line -->
  <rect x="0" y="80" width="1200" height="4" fill="${AMBER}"/>

  <!-- Decorative side stripe -->
  <rect x="0" y="84" width="6" height="546" fill="${GREEN_MID}" opacity="0.35"/>
  <rect x="1194" y="84" width="6" height="546" fill="${GREEN_MID}" opacity="0.35"/>

  <!-- Breed name -->
  ${nameParts.length === 1
    ? `<text x="600" y="${nameY1}"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="52"
        font-weight="700"
        fill="${BROWN_DARK}"
        text-anchor="middle"
        dominant-baseline="middle">${escXml(nameParts[0])}</text>`
    : `<text x="600" y="${nameY1}"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="48"
        font-weight="700"
        fill="${BROWN_DARK}"
        text-anchor="middle"
        dominant-baseline="middle">${escXml(nameParts[0])}</text>
      <text x="600" y="${nameY2}"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="48"
        font-weight="700"
        fill="${BROWN_DARK}"
        text-anchor="middle"
        dominant-baseline="middle">${escXml(nameParts[1])}</text>`
  }

  <!-- Amber divider under name -->
  <rect x="440" y="${nameParts.length === 1 ? 335 : 360}" width="320" height="3" fill="${AMBER}" rx="1.5"/>

  <!-- Lifespan stat -->
  <text x="600" y="${nameParts.length === 1 ? 365 : 390}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="22"
    fill="${MUTED}"
    text-anchor="middle"
    dominant-baseline="middle">${escXml(lifespan)}</text>

  <!-- Size badge pill -->
  <rect x="${bx}" y="${nameParts.length === 1 ? by : by + 35}" width="${bw}" height="38" rx="19" fill="${GREEN_DARK}"/>
  <text x="600" y="${nameParts.length === 1 ? by + 19 : by + 54}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="16"
    font-weight="600"
    fill="${WHITE}"
    text-anchor="middle"
    dominant-baseline="middle"
    letter-spacing="1">${escXml(size.toUpperCase())}</text>

  <!-- Group label -->
  <text x="600" y="${nameParts.length === 1 ? 470 : 505}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="18"
    fill="${BROWN_MID}"
    text-anchor="middle"
    dominant-baseline="middle"
    font-style="italic">${escXml(group)} Group</text>

  <!-- Paw print (decorative, bottom-right) -->
  <g transform="translate(1130, 575) scale(1.6)" opacity="0.18" fill="${GREEN_DARK}">
    <path d="${PAW_PATH}"/>
  </g>
  <g transform="translate(1090, 555) scale(1.0)" opacity="0.10" fill="${GREEN_DARK}">
    <path d="${PAW_PATH}"/>
  </g>

  <!-- Bottom amber bar -->
  <rect x="0" y="614" width="1200" height="16" fill="${AMBER}" opacity="0.6"/>

  <!-- URL watermark -->
  <text x="1160" y="607"
    font-family="Arial, Helvetica, sans-serif"
    font-size="13"
    fill="${MUTED}"
    text-anchor="end"
    opacity="0.7">breedhealth.co.uk</text>
</svg>`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function escXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Split a long breed name at the last space before the midpoint */
function splitName(name) {
  const mid = Math.floor(name.length / 2);
  // find the space nearest to the midpoint (search left then right)
  let splitAt = -1;
  for (let i = mid; i >= 0; i--) {
    if (name[i] === ' ') { splitAt = i; break; }
  }
  if (splitAt === -1) {
    for (let i = mid; i < name.length; i++) {
      if (name[i] === ' ') { splitAt = i; break; }
    }
  }
  if (splitAt === -1) return [name];
  return [name.slice(0, splitAt).trim(), name.slice(splitAt + 1).trim()];
}

// ── Entry point ───────────────────────────────────────────────────────────────
(function main() {
  // Ensure output directory exists
  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true });
    console.log(`Created directory: public/og/`);
  }

  // Read index
  const index = JSON.parse(readFileSync(INDEX_PATH, 'utf8'));
  const breeds = index.breeds || [];

  if (breeds.length === 0) {
    console.warn('No breeds found in src/data/index.json — nothing to generate.');
    process.exit(0);
  }

  let generated = 0;
  let skipped   = 0;

  for (const entry of breeds) {
    const { slug, name } = entry;

    if (!slug) {
      console.warn(`Skipping entry with no slug: ${JSON.stringify(entry)}`);
      skipped++;
      continue;
    }

    // Merge index entry with full breed file (for lifespan data)
    let breedData = { ...entry };
    const breedFile = join(BREEDS_DIR, `${slug}.json`);
    if (existsSync(breedFile)) {
      try {
        const full = JSON.parse(readFileSync(breedFile, 'utf8'));
        breedData = { ...breedData, ...full };
      } catch (err) {
        console.warn(`Could not parse breed file for ${slug}: ${err.message}`);
      }
    } else {
      console.warn(`No breed file found for ${slug} — lifespan will show as ?–?`);
    }

    const svg     = buildSVG(breedData);
    const outPath = join(OUT_DIR, `${slug}.svg`);
    writeFileSync(outPath, svg, 'utf8');
    generated++;
  }

  console.log(`\nOG image generation complete.`);
  console.log(`  Generated : ${generated}`);
  if (skipped > 0) console.log(`  Skipped   : ${skipped}`);
  console.log(`  Output    : public/og/\n`);
})();
