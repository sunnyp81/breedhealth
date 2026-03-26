/**
 * build-data.mjs
 * Reads seed files and generates processed data for the breedhealth Astro site.
 * Run: node scripts/build-data.mjs
 */

import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_DIR = join(__dirname, 'seed');
const DATA_DIR = join(__dirname, '..', 'src', 'data');

// ─── Helpers ────────────────────────────────────────────────────────────────

async function readSeed(filename) {
  const filePath = join(SEED_DIR, filename);
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

async function writeJSON(filePath, data) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

async function clearDir(dir) {
  if (existsSync(dir)) {
    await rm(dir, { recursive: true, force: true });
  }
  await mkdir(dir, { recursive: true });
}

// ─── Diet recommendation logic ───────────────────────────────────────────────

/**
 * Returns an array of diet slugs appropriate for a breed based on
 * its size and exercise_level (1–5 scale).
 */
function computeDietRecommendations(breed, allDiets) {
  const { size, exercise_level, lifespan_min } = breed;
  const recommended = [];

  // Always include dry kibble as the baseline
  recommended.push('dry-kibble');

  // High-activity breeds benefit from high-protein
  if (exercise_level >= 4) {
    recommended.push('high-protein');
  }

  // Low-activity or overweight-prone breeds: weight management
  if (exercise_level <= 2) {
    recommended.push('weight-management');
  }

  // Large/giant breeds have breed-specific formulas
  if (size === 'large' || size === 'giant') {
    recommended.push('breed-specific');
  }

  // Senior consideration (breeds with shorter lifespans or giant breeds age faster)
  if (size === 'giant' || (lifespan_min && lifespan_min <= 8)) {
    recommended.push('senior');
  }

  // Wet food is broadly suitable — include as an option
  recommended.push('wet-food');

  // Deduplicate and return only slugs that exist in the diets array
  const dietSlugs = new Set(allDiets.map((d) => d.slug));
  const unique = [...new Set(recommended)].filter((slug) => dietSlugs.has(slug));

  return allDiets.filter((d) => unique.includes(d.slug)).map(({ name, slug }) => ({ name, slug }));
}

// ─── Related breeds logic ────────────────────────────────────────────────────

/**
 * Returns up to 5 breeds from the same group and similar size,
 * excluding the breed itself.
 */
function computeRelatedBreeds(breed, allBreeds) {
  const SIZE_ORDER = ['toy', 'small', 'medium', 'large', 'giant'];
  const breedSizeIdx = SIZE_ORDER.indexOf(breed.size);

  return allBreeds
    .filter((b) => {
      if (b.slug === breed.slug) return false;
      if (b.group !== breed.group) return false;
      const idx = SIZE_ORDER.indexOf(b.size);
      return Math.abs(idx - breedSizeIdx) <= 1;
    })
    .slice(0, 5)
    .map(({ name, slug, size, group }) => ({ name, slug, size, group }));
}

// ─── Comparison differences logic ────────────────────────────────────────────

/**
 * Computes a human-readable stat comparison between two breeds.
 * Returns an array of { category, breed_a_value, breed_b_value, winner } objects.
 */
function computeDifferences(breedA, breedB) {
  const comparisons = [];

  const numericStats = [
    { key: 'lifespan_min', label: 'Min Lifespan (years)', higherIsBetter: true },
    { key: 'lifespan_max', label: 'Max Lifespan (years)', higherIsBetter: true },
    { key: 'weight_min_kg', label: 'Min Weight (kg)', higherIsBetter: null },
    { key: 'weight_max_kg', label: 'Max Weight (kg)', higherIsBetter: null },
    { key: 'height_min_cm', label: 'Min Height (cm)', higherIsBetter: null },
    { key: 'height_max_cm', label: 'Max Height (cm)', higherIsBetter: null },
    { key: 'exercise_level', label: 'Exercise Level', higherIsBetter: null },
    { key: 'grooming_level', label: 'Grooming Level', higherIsBetter: null },
    { key: 'shedding_level', label: 'Shedding Level', higherIsBetter: false },
    { key: 'trainability', label: 'Trainability', higherIsBetter: true },
  ];

  for (const stat of numericStats) {
    const aVal = breedA[stat.key];
    const bVal = breedB[stat.key];
    if (aVal == null || bVal == null) continue;

    let winner = 'tie';
    if (stat.higherIsBetter === true) {
      if (aVal > bVal) winner = breedA.slug;
      else if (bVal > aVal) winner = breedB.slug;
    } else if (stat.higherIsBetter === false) {
      if (aVal < bVal) winner = breedA.slug;
      else if (bVal < aVal) winner = breedB.slug;
    }
    // higherIsBetter === null → informational only, no winner

    comparisons.push({
      category: stat.label,
      breed_a_value: aVal,
      breed_b_value: bVal,
      winner,
    });
  }

  const boolStats = [
    { key: 'good_with_children', label: 'Good with Children' },
    { key: 'good_with_dogs', label: 'Good with Dogs' },
    { key: 'apartment_friendly', label: 'Apartment Friendly' },
  ];

  for (const stat of boolStats) {
    const aVal = breedA[stat.key];
    const bVal = breedB[stat.key];
    if (aVal == null || bVal == null) continue;
    comparisons.push({
      category: stat.label,
      breed_a_value: aVal,
      breed_b_value: bVal,
      winner:
        aVal === bVal ? 'tie' : aVal === true ? breedA.slug : breedB.slug,
    });
  }

  // Health burden: fewer conditions is better
  const aHealth = breedA.health_issues?.length ?? 0;
  const bHealth = breedB.health_issues?.length ?? 0;
  comparisons.push({
    category: 'Number of Common Health Issues',
    breed_a_value: aHealth,
    breed_b_value: bHealth,
    winner:
      aHealth === bHealth
        ? 'tie'
        : aHealth < bHealth
        ? breedA.slug
        : breedB.slug,
  });

  return comparisons;
}

// ─── Diet suitability logic ───────────────────────────────────────────────────

/**
 * Determines which breeds are broadly suitable for a given diet.
 * Uses size and exercise_level heuristics matching computeDietRecommendations.
 */
function computeSuitableBreeds(diet, allBreeds) {
  return allBreeds
    .filter((breed) => {
      const recs = computeDietRecommendations(breed, [diet]);
      return recs.some((r) => r.slug === diet.slug);
    })
    .map(({ name, slug, size, group }) => ({ name, slug, size, group }));
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

async function main() {
  console.log('🐾 breedhealth — build-data starting...\n');

  // ── Load seed data ──────────────────────────────────────────────────────────
  console.log('Loading seed files...');
  const [breeds, conditions, diets, toxicFoods, comparisons, guides] =
    await Promise.all([
      readSeed('breeds.json'),
      readSeed('conditions.json'),
      readSeed('diets.json'),
      readSeed('toxic-foods.json'),
      readSeed('comparisons.json'),
      readSeed('guides.json'),
    ]);

  console.log(`  breeds: ${breeds.length}`);
  console.log(`  conditions: ${conditions.length}`);
  console.log(`  diets: ${diets.length}`);
  console.log(`  toxic_foods: ${toxicFoods.length}`);
  console.log(`  comparisons: ${comparisons.length}`);
  console.log(`  guides: ${guides.length}\n`);

  // ── Build lookup maps ───────────────────────────────────────────────────────
  const breedBySlug = new Map(breeds.map((b) => [b.slug, b]));
  const conditionBySlug = new Map(conditions.map((c) => [c.slug, c]));

  // Map breed slug → comparison slugs
  const breedComparisonsMap = new Map();
  for (const comp of comparisons) {
    for (const side of ['breed_a', 'breed_b']) {
      const slug = comp[side];
      if (!breedComparisonsMap.has(slug)) breedComparisonsMap.set(slug, []);
      breedComparisonsMap.get(slug).push(comp.slug);
    }
  }

  // ── Clear output directories ────────────────────────────────────────────────
  console.log('Clearing output directories...');
  await Promise.all([
    clearDir(join(DATA_DIR, 'breeds')),
    clearDir(join(DATA_DIR, 'conditions')),
    clearDir(join(DATA_DIR, 'comparisons')),
    clearDir(join(DATA_DIR, 'diets')),
  ]);

  // ── 1. Per-breed files ──────────────────────────────────────────────────────
  console.log('Generating per-breed files...');
  let breedWarnings = 0;

  for (const breed of breeds) {
    // Resolve condition details, skip missing slugs with a warning
    const conditions_detail = [];
    for (const condSlug of breed.health_issues ?? []) {
      const cond = conditionBySlug.get(condSlug);
      if (!cond) {
        console.warn(
          `  [WARN] breed "${breed.slug}" references unknown condition "${condSlug}" — skipping`
        );
        breedWarnings++;
        continue;
      }
      conditions_detail.push(cond);
    }

    const output = {
      ...breed,
      conditions_detail,
      diet_recommendations: computeDietRecommendations(breed, diets),
      related_breeds: computeRelatedBreeds(breed, breeds),
      comparisons: breedComparisonsMap.get(breed.slug) ?? [],
    };

    await writeJSON(join(DATA_DIR, 'breeds', `${breed.slug}.json`), output);
  }

  console.log(`  ✓ ${breeds.length} breed files written (${breedWarnings} cross-ref warnings)\n`);

  // ── 2. Per-condition files ──────────────────────────────────────────────────
  console.log('Generating per-condition files...');
  let conditionWarnings = 0;

  for (const condition of conditions) {
    // Collect all breed slugs that reference this condition, from both directions:
    //   a) breed.health_issues includes condition.slug
    //   b) condition.affected_breeds includes breed.slug
    const breedSlugsForCondition = new Set([
      ...(condition.affected_breeds ?? []),
      ...breeds
        .filter((b) => b.health_issues?.includes(condition.slug))
        .map((b) => b.slug),
    ]);

    const breeds_detail = [];
    for (const breedSlug of breedSlugsForCondition) {
      const breed = breedBySlug.get(breedSlug);
      if (!breed) {
        console.warn(
          `  [WARN] condition "${condition.slug}" references unknown breed "${breedSlug}" — skipping`
        );
        conditionWarnings++;
        continue;
      }
      breeds_detail.push({
        name: breed.name,
        slug: breed.slug,
        size: breed.size,
        group: breed.group,
      });
    }

    const output = {
      ...condition,
      breeds_detail,
    };

    await writeJSON(
      join(DATA_DIR, 'conditions', `${condition.slug}.json`),
      output
    );
  }

  console.log(
    `  ✓ ${conditions.length} condition files written (${conditionWarnings} cross-ref warnings)\n`
  );

  // ── 3. Per-comparison files ─────────────────────────────────────────────────
  console.log('Generating per-comparison files...');
  let compWarnings = 0;
  let compWritten = 0;

  for (const comp of comparisons) {
    const breedA = breedBySlug.get(comp.breed_a);
    const breedB = breedBySlug.get(comp.breed_b);

    if (!breedA) {
      console.warn(
        `  [WARN] comparison "${comp.slug}" references unknown breed_a "${comp.breed_a}" — skipping`
      );
      compWarnings++;
      continue;
    }
    if (!breedB) {
      console.warn(
        `  [WARN] comparison "${comp.slug}" references unknown breed_b "${comp.breed_b}" — skipping`
      );
      compWarnings++;
      continue;
    }

    const output = {
      slug: comp.slug,
      breed_a: breedA,
      breed_b: breedB,
      differences: computeDifferences(breedA, breedB),
    };

    await writeJSON(
      join(DATA_DIR, 'comparisons', `${comp.slug}.json`),
      output
    );
    compWritten++;
  }

  console.log(
    `  ✓ ${compWritten} comparison files written (${compWarnings} cross-ref warnings)\n`
  );

  // ── 4. Per-diet files ───────────────────────────────────────────────────────
  console.log('Generating per-diet files...');

  for (const diet of diets) {
    const output = {
      ...diet,
      suitable_breeds: computeSuitableBreeds(diet, breeds),
    };

    await writeJSON(join(DATA_DIR, 'diets', `${diet.slug}.json`), output);
  }

  console.log(`  ✓ ${diets.length} diet files written\n`);

  // ── 5. Master index ─────────────────────────────────────────────────────────
  console.log('Generating master index...');

  const index = {
    breeds: breeds.map(({ name, slug, group, size, popularity_rank }) => ({
      name,
      slug,
      group,
      size,
      popularity_rank,
    })),
    conditions: conditions.map(({ name, slug, category, severity }) => ({
      name,
      slug,
      category,
      severity,
    })),
    diets: diets.map(({ name, slug }) => ({ name, slug })),
    comparisons: comparisons.map(({ slug, breed_a, breed_b }) => ({
      slug,
      breed_a,
      breed_b,
    })),
    guides: guides.map(({ title, slug, description }) => ({
      title,
      slug,
      description,
    })),
    toxic_foods: toxicFoods,
  };

  await writeJSON(join(DATA_DIR, 'index.json'), index);
  console.log('  ✓ index.json written\n');

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('─────────────────────────────────');
  console.log('Build complete:');
  console.log(`  src/data/breeds/        ${breeds.length} files`);
  console.log(`  src/data/conditions/    ${conditions.length} files`);
  console.log(`  src/data/comparisons/   ${compWritten} files`);
  console.log(`  src/data/diets/         ${diets.length} files`);
  console.log(`  src/data/index.json     1 file`);
  console.log('─────────────────────────────────');
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
