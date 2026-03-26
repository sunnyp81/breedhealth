// ─────────────────────────────────────────────
// Data loader functions for breedhealth site
// All reads target src/data/ JSON files.
// Static listing functions use the index so
// individual entity files are only opened on
// demand (per-slug dynamic pages).
// ─────────────────────────────────────────────

import type {
  SiteIndex,
  BreedSummary,
  Breed,
  ConditionSummary,
  Condition,
  ComparisonData,
  DietType,
  ToxicFood,
  GuideSummary,
  SizeCategory,
} from './types';

// ─────────────────────────────────────────────
// Index
// ─────────────────────────────────────────────

let _indexCache: SiteIndex | null = null;

/**
 * Returns the site-wide index. Result is module-scope cached so the
 * JSON is only parsed once per build worker.
 */
export async function getIndex(): Promise<SiteIndex> {
  if (_indexCache) return _indexCache;
  const mod = await import('../data/index.json');
  _indexCache = mod.default as unknown as SiteIndex;
  return _indexCache;
}

// ─────────────────────────────────────────────
// Breeds
// ─────────────────────────────────────────────

/**
 * Returns all breed summaries from the index, sorted by popularity.
 * Suitable for listing pages and getStaticPaths() calls.
 */
export async function getAllBreeds(): Promise<BreedSummary[]> {
  const index = await getIndex();
  return index.breeds.slice().sort((a, b) => a.popularity_rank - b.popularity_rank);
}

/**
 * Returns a single fully-hydrated Breed from its per-slug JSON file.
 * Returns null if the file does not exist.
 */
export async function getBreed(slug: string): Promise<Breed | null> {
  try {
    const mod = await import(`../data/breeds/${slug}.json`);
    return mod.default as unknown as Breed;
  } catch {
    return null;
  }
}

/**
 * Returns all breed summaries for a specific group name (case-insensitive).
 */
export async function getBreedsByGroup(group: string): Promise<BreedSummary[]> {
  const index = await getIndex();
  return index.breeds
    .filter((b) => b.group.toLowerCase() === group.toLowerCase())
    .sort((a, b) => a.popularity_rank - b.popularity_rank);
}

/**
 * Returns all breed summaries for a specific size category.
 */
export async function getBreedsBySize(size: SizeCategory): Promise<BreedSummary[]> {
  const index = await getIndex();
  return index.breeds
    .filter((b) => b.size === size)
    .sort((a, b) => a.popularity_rank - b.popularity_rank);
}

/**
 * Returns all unique group names present in the index, sorted A–Z.
 */
export async function getAllGroups(): Promise<string[]> {
  const index = await getIndex();
  return [...new Set(index.breeds.map((b) => b.group))].sort();
}

/**
 * Returns the N most popular breed summaries.
 */
export async function getTopBreeds(limit = 10): Promise<BreedSummary[]> {
  const breeds = await getAllBreeds();
  return breeds.slice(0, limit);
}

// ─────────────────────────────────────────────
// Conditions
// ─────────────────────────────────────────────

/**
 * Returns all condition summaries from the index, sorted A–Z.
 */
export async function getAllConditions(): Promise<ConditionSummary[]> {
  const index = await getIndex();
  return index.conditions.slice().sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Returns a single fully-hydrated Condition from its per-slug JSON file.
 * Returns null if the file does not exist.
 */
export async function getCondition(slug: string): Promise<Condition | null> {
  try {
    const mod = await import(`../data/conditions/${slug}.json`);
    return mod.default as unknown as Condition;
  } catch {
    return null;
  }
}

/**
 * Returns all condition summaries for a given category (case-insensitive).
 */
export async function getConditionsByCategory(category: string): Promise<ConditionSummary[]> {
  const index = await getIndex();
  return index.conditions
    .filter((c) => c.category.toLowerCase() === category.toLowerCase())
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Returns breed summaries whose conditions_detail in the index
 * matches the given condition slug. Falls back to scanning affected_breeds
 * when breeds_detail is not available.
 */
export async function getBreedsForCondition(conditionSlug: string): Promise<BreedSummary[]> {
  const condition = await getCondition(conditionSlug);
  if (!condition) return [];

  const index = await getIndex();
  const affectedSet = new Set(condition.affected_breeds);

  return index.breeds
    .filter((b) => affectedSet.has(b.slug))
    .sort((a, b) => a.popularity_rank - b.popularity_rank);
}

// ─────────────────────────────────────────────
// Comparisons
// ─────────────────────────────────────────────

/**
 * Returns all comparison slugs from the index.
 */
export async function getAllComparisonSlugs(): Promise<string[]> {
  const index = await getIndex();
  return index.comparisons.map((c) => c.slug);
}

/**
 * Returns a ComparisonData object with both breeds fully hydrated.
 * Returns null if the slug is not in the index or either breed file is missing.
 */
export async function getComparison(slug: string): Promise<ComparisonData | null> {
  const index = await getIndex();
  const meta = index.comparisons.find((c) => c.slug === slug);
  if (!meta) return null;

  const [breedA, breedB] = await Promise.all([
    getBreed(meta.breed_a),
    getBreed(meta.breed_b),
  ]);

  if (!breedA || !breedB) return null;

  return { slug, breed_a: breedA, breed_b: breedB };
}

// ─────────────────────────────────────────────
// Diets
// ─────────────────────────────────────────────

/**
 * Returns all diet summaries from the index.
 */
export async function getAllDiets(): Promise<{ slug: string; name: string }[]> {
  const index = await getIndex();
  return index.diets;
}

/**
 * Returns a single fully-hydrated DietType from its per-slug JSON file.
 * Returns null if the file does not exist.
 */
export async function getDiet(slug: string): Promise<DietType | null> {
  try {
    const mod = await import(`../data/diets/${slug}.json`);
    return mod.default as unknown as DietType;
  } catch {
    return null;
  }
}

/**
 * Returns all diet types that are listed as suitable for the given breed slug.
 */
export async function getDietsForBreed(breedSlug: string): Promise<DietType[]> {
  const diets = await getAllDiets();
  const results = await Promise.all(diets.map((d) => getDiet(d.slug)));
  return results.filter(
    (d): d is DietType => d !== null && d.suitable_breeds.includes(breedSlug)
  );
}

// ─────────────────────────────────────────────
// Toxic Foods
// ─────────────────────────────────────────────

/**
 * Returns all toxic food summaries from the index.
 */
export async function getAllToxicFoods(): Promise<
  { slug: string; name: string; toxicity_level: ToxicFood['toxicity_level'] }[]
> {
  const index = await getIndex();
  return index.toxic_foods;
}

/**
 * Returns a single fully-hydrated ToxicFood from its per-slug JSON file.
 * Returns null if the file does not exist.
 */
export async function getToxicFood(slug: string): Promise<ToxicFood | null> {
  try {
    const mod = await import(`../data/toxic-foods/${slug}.json`);
    return mod.default as unknown as ToxicFood;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Guides
// ─────────────────────────────────────────────

/**
 * Returns all guide summaries from the index.
 */
export async function getAllGuides(): Promise<GuideSummary[]> {
  const index = await getIndex();
  return index.guides;
}
