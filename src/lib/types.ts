// ─────────────────────────────────────────────
// Core domain types for breedhealth site
// Aligned with actual JSON file shapes in src/data/
// ─────────────────────────────────────────────

export type SizeCategory = 'small' | 'medium' | 'large' | 'giant';
export type ConditionSeverity = 'low' | 'moderate' | 'high';

// ─────────────────────────────────────────────
// Breed
// ─────────────────────────────────────────────

/**
 * Lightweight summary stored directly in index.json breeds array.
 * Used by listing pages and getStaticPaths() — no per-breed file read.
 */
export interface BreedSummary {
  name: string;
  slug: string;
  group: string;
  size: SizeCategory;
  popularity_rank: number;
}

/**
 * Full breed record sourced from src/data/breeds/<slug>.json.
 * conditions_detail, diet_recommendations, related_breeds, and
 * comparisons are pre-hydrated in the per-breed JSON by the data
 * pipeline and may also be enriched at load time.
 */
export interface Breed {
  name: string;
  slug: string;
  group: string;
  size: SizeCategory;
  weight_min_kg: number;
  weight_max_kg: number;
  height_min_cm: number;
  height_max_cm: number;
  lifespan_min: number;
  lifespan_max: number;
  temperament: string[];
  health_issues: string[];           // condition slugs
  exercise_level: number;            // 1–5
  grooming_level: number;            // 1–5
  shedding_level: number;            // 1–5
  trainability: number;              // 1–5
  good_with_children: boolean;
  good_with_dogs: boolean;
  apartment_friendly: boolean;
  popularity_rank: number;
  origin: string;
  coat_type: string;                 // e.g. "short double", "long", "wire"
  coat_colors: string[];
  description: string;
  // Pre-hydrated by pipeline; optional so partial reads are safe
  conditions_detail?: Condition[];
  diet_recommendations?: DietType[];
  related_breeds?: BreedSummary[];
  comparisons?: string[];            // comparison slugs
}

// ─────────────────────────────────────────────
// Health Conditions
// ─────────────────────────────────────────────

/**
 * Lightweight summary stored in index.json conditions array.
 */
export interface ConditionSummary {
  name: string;
  slug: string;
  category: string;
  severity: ConditionSeverity;
}

/**
 * Full condition record from src/data/conditions/<slug>.json.
 */
export interface Condition {
  name: string;
  slug: string;
  category: string;
  severity: ConditionSeverity;
  description: string;
  symptoms: string[];
  treatment_overview: string;
  prevention_tips: string[];
  affected_breeds: string[];         // breed slugs
  typical_onset: string;             // e.g. "1-2 years"
  hereditary: boolean;
  estimated_treatment_cost: string;  // e.g. "£1,500–£6,000"
  breeds_detail?: BreedSummary[];    // hydrated by pipeline
}

// ─────────────────────────────────────────────
// Diet / Nutrition
// ─────────────────────────────────────────────

export interface DietFeedingGuidelines {
  small?: { cups_per_day: string; frequency: string };
  medium?: { cups_per_day: string; frequency: string };
  large?: { cups_per_day: string; frequency: string };
  giant?: { cups_per_day: string; frequency: string };
}

/**
 * Full diet record from src/data/diets/<slug>.json.
 */
export interface DietType {
  name: string;
  slug: string;
  description: string;
  suitable_for: string[];
  benefits: string[];
  risks: string[];
  recommended_brands: string[];
  feeding_guidelines: DietFeedingGuidelines;
  suitable_breeds: string[];         // breed slugs
}

// ─────────────────────────────────────────────
// Toxic Foods
// ─────────────────────────────────────────────

export interface ToxicFood {
  name: string;
  slug: string;
  toxicity_level: 'mild' | 'moderate' | 'severe' | 'high' | 'fatal';
  toxic_compound?: string;
  symptoms: string[];
  dangerous_amount?: string;
  first_aid: string;
  source?: string;
}

// ─────────────────────────────────────────────
// Comparisons
// ─────────────────────────────────────────────

/**
 * Metadata entry stored in index.json comparisons array.
 */
export interface Comparison {
  slug: string;
  breed_a: string;    // breed slug
  breed_b: string;    // breed slug
}

/**
 * Full comparison record — both breeds fully hydrated.
 * Assembled at load time; not a stored JSON file.
 */
export interface ComparisonData {
  slug: string;
  breed_a: Breed;
  breed_b: Breed;
}

// ─────────────────────────────────────────────
// Guides / Articles
// ─────────────────────────────────────────────

export interface GuideSummary {
  slug: string;
  title: string;
  category?: string;
}

export interface Guide extends GuideSummary {
  description?: string;
  related_breeds?: string[];   // breed slugs
  published?: string;          // ISO date string
  updated?: string;            // ISO date string
  body?: string;               // Markdown or HTML
}

// ─────────────────────────────────────────────
// Site Index
// ─────────────────────────────────────────────

/**
 * Shape of src/data/index.json.
 * Listing pages read only this file; entity pages open per-slug files.
 */
export interface SiteIndex {
  breeds: BreedSummary[];
  conditions: ConditionSummary[];
  diets: { slug: string; name: string }[];
  comparisons: Comparison[];
  guides: GuideSummary[];
  toxic_foods: { slug: string; name: string; toxicity_level: ToxicFood['toxicity_level'] }[];
}
