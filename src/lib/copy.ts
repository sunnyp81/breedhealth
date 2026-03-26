// ─────────────────────────────────────────────
// Computed copy generators for breedhealth site
// All text is derived entirely from data fields.
// No hardcoded breed names or condition names.
// ─────────────────────────────────────────────

import type { Breed, Condition, DietType } from './types';

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

function cap(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function joinList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function weightRange(breed: Breed): string {
  return `${breed.weight_min_kg}–${breed.weight_max_kg}kg`;
}

function heightRange(breed: Breed): string {
  return `${breed.height_min_cm}–${breed.height_max_cm}cm`;
}

function lifespanRange(breed: Breed): string {
  return `${breed.lifespan_min}–${breed.lifespan_max} years`;
}

function exerciseLabel(level: number): string {
  const labels: Record<number, string> = {
    1: 'minimal',
    2: 'light',
    3: 'moderate',
    4: 'significant',
    5: 'very high',
  };
  return labels[Math.min(Math.max(Math.round(level), 1), 5)] ?? 'moderate';
}

function groomingLabel(level: number): string {
  const labels: Record<number, string> = {
    1: 'very low-maintenance',
    2: 'low-maintenance',
    3: 'moderate',
    4: 'high-maintenance',
    5: 'very demanding',
  };
  return labels[Math.min(Math.max(Math.round(level), 1), 5)] ?? 'moderate';
}

function sheddingLabel(level: number): string {
  const labels: Record<number, string> = {
    1: 'minimal',
    2: 'light',
    3: 'moderate',
    4: 'heavy',
    5: 'very heavy',
  };
  return labels[Math.min(Math.max(Math.round(level), 1), 5)] ?? 'moderate';
}

function trainabilityLabel(level: number): string {
  const labels: Record<number, string> = {
    1: 'challenging to train',
    2: 'requires patience to train',
    3: 'moderately trainable',
    4: 'quick to learn',
    5: 'exceptionally easy to train',
  };
  return labels[Math.min(Math.max(Math.round(level), 1), 5)] ?? 'moderately trainable';
}

function sizeAdjective(breed: Breed): string {
  const map: Record<string, string> = {
    small: 'compact',
    medium: 'mid-sized',
    large: 'large',
    giant: 'giant',
  };
  return map[breed.size] ?? breed.size;
}

function exerciseDuration(level: number): string {
  if (level >= 5) return 'at least 2 hours';
  if (level === 4) return 'around 90 minutes';
  if (level === 3) return 'at least an hour';
  if (level === 2) return '30–45 minutes';
  return '20–30 minutes';
}

function dailyCalories(breed: Breed): string {
  const midWeight = (breed.weight_min_kg + breed.weight_max_kg) / 2;
  // RER × activity multiplier (rough guide only)
  const rer = 70 * Math.pow(midWeight, 0.75);
  const multiplier = 1.2 + (breed.exercise_level - 1) * 0.2;
  const kcal = Math.round((rer * multiplier) / 50) * 50;
  const low = Math.round(kcal * 0.9 / 50) * 50;
  const high = Math.round(kcal * 1.1 / 50) * 50;
  return `${low}–${high} kcal`;
}

function feedingGuideForSize(diet: DietType, breed: Breed): string {
  const guide = diet.feeding_guidelines[breed.size];
  if (!guide) return 'Follow the manufacturer\'s portion guide for your dog\'s weight';
  return `approximately ${guide.cups_per_day} cups split across ${guide.frequency}`;
}

// ─────────────────────────────────────────────
// Breed intro paragraph
// ─────────────────────────────────────────────

/**
 * Returns a natural-language introductory paragraph for a breed page.
 * Incorporates size, group, origin, temperament, weight, height,
 * lifespan, exercise, and coat type — all from data.
 *
 * Example output: "The Golden Retriever is a large sporting breed from Scotland,
 * known for being friendly, intelligent, and devoted. Weighing 25–34kg and
 * standing 51–61cm, they typically live 10–12 years. Golden Retrievers require
 * significant daily exercise and moderate grooming to maintain their long, flowing coat.
 * They are well-regarded as a family breed and typically patient with children.
 * Access to a securely fenced garden is strongly recommended."
 */
export function generateBreedIntro(breed: Breed): string {
  const temperamentPhrase =
    breed.temperament.length > 0
      ? `, known for being ${joinList(breed.temperament.slice(0, 3).map((t) => t.toLowerCase()))}`
      : '';

  const coatDesc = breed.coat_type.includes('double')
    ? 'dense double coat'
    : breed.coat_type.includes('wire')
      ? 'wiry coat'
      : breed.coat_type.includes('curly')
        ? 'curly coat'
        : `${breed.coat_type} coat`;

  const apartmentNote = breed.apartment_friendly
    ? ` Their adaptable nature makes them a reasonable choice for apartment living, provided their exercise needs are met.`
    : ` Due to their ${sizeAdjective(breed)} build and ${exerciseLabel(breed.exercise_level)} energy levels, they generally thrive with access to outdoor space.`;

  const childNote = breed.good_with_children
    ? ` They are well-regarded as a family breed and typically patient with children.`
    : '';

  return (
    `The ${breed.name} is a ${sizeAdjective(breed)} ${breed.group.toLowerCase()} breed originating from ${breed.origin}${temperamentPhrase}. ` +
    `Weighing ${weightRange(breed)} and standing ${heightRange(breed)} at the shoulder, they typically live ${lifespanRange(breed)}. ` +
    `${cap(breed.name)}s require ${exerciseLabel(breed.exercise_level)} daily exercise and ${groomingLabel(breed.grooming_level)} grooming to maintain their ${coatDesc}.` +
    `${childNote}${apartmentNote}`
  );
}

// ─────────────────────────────────────────────
// Health overview paragraph
// ─────────────────────────────────────────────

/**
 * Returns an introductory health overview paragraph for a breed's
 * health page. References known conditions and lifespan data.
 */
export function generateHealthOverview(breed: Breed): string {
  const conditionCount = breed.health_issues.length;

  const conditionNames =
    breed.conditions_detail && breed.conditions_detail.length > 0
      ? joinList(breed.conditions_detail.slice(0, 3).map((c) => c.name))
      : null;

  const conditionSentence = conditionNames
    ? ` Like many pedigree breeds, the ${breed.name} is prone to certain hereditary and acquired health conditions, most notably ${conditionNames}.`
    : conditionCount > 0
      ? ` Like many pedigree breeds, the ${breed.name} has a number of documented health concerns worth understanding before ownership.`
      : ` The ${breed.name} is generally considered a robust breed with few major inherited conditions.`;

  const lifespanSentence =
    breed.lifespan_max - breed.lifespan_min >= 3
      ? ` Lifespan varies considerably — from ${breed.lifespan_min} to ${breed.lifespan_max} years — and is strongly influenced by diet, weight management, and early veterinary screening.`
      : ` With attentive care, most ${breed.name}s can be expected to live ${lifespanRange(breed)}.`;

  const sizeHealthNote =
    breed.size === 'giant'
      ? ` Giant breeds age faster than smaller dogs and are statistically more susceptible to orthopaedic issues and certain cancers; biannual vet checks are strongly recommended.`
      : breed.size === 'small'
        ? ` Smaller breeds often enjoy longer lifespans but can be prone to dental disease and patellar luxation; regular dental care and weight monitoring are particularly important.`
        : '';

  return (
    `Understanding the health profile of the ${breed.name} helps owners make informed decisions about screening, insurance, and preventive care.` +
    conditionSentence +
    lifespanSentence +
    sizeHealthNote
  );
}

// ─────────────────────────────────────────────
// Per-breed, per-condition copy
// ─────────────────────────────────────────────

/**
 * Returns a unique paragraph about a specific condition as it
 * presents in a specific breed. Uses both breed and condition data
 * so no two breed–condition pairs share identical text.
 */
export function generateConditionCopy(breed: Breed, condition: Condition): string {
  const prevalencePhrases: Record<string, string> = {
    high: 'is one of the most frequently diagnosed conditions in the breed',
    moderate: 'affects a notable proportion of the breed',
    low: 'is occasionally observed in the breed',
  };
  const prevalencePhrase =
    prevalencePhrases[condition.severity] ?? 'can affect members of the breed';

  const symptomIntro =
    condition.symptoms.length > 0
      ? ` Common indicators include ${joinList(condition.symptoms.slice(0, 3).map((s) => s.toLowerCase()))}.`
      : '';

  const sizeContext =
    breed.size === 'large' || breed.size === 'giant'
      ? ` The ${sizeAdjective(breed)} frame of the ${breed.name} can accelerate progression in weight-bearing conditions, making early diagnosis particularly valuable.`
      : breed.size === 'small'
        ? ` In smaller breeds like the ${breed.name}, early detection and prompt treatment generally lead to better long-term outcomes.`
        : '';

  const hereditaryNote = condition.hereditary
    ? ` This condition has a hereditary component — prospective owners should request documentation of health screening from the breeder.`
    : '';

  const costNote = condition.estimated_treatment_cost
    ? ` Treatment costs are estimated at ${condition.estimated_treatment_cost}, making comprehensive pet insurance a practical consideration.`
    : '';

  const onsetNote = condition.typical_onset
    ? ` It typically becomes apparent at ${condition.typical_onset}.`
    : '';

  return (
    `${condition.name} ${prevalencePhrase} within the ${breed.name}.${symptomIntro}` +
    ` ${condition.description}` +
    onsetNote +
    sizeContext +
    hereditaryNote +
    costNote
  );
}

// ─────────────────────────────────────────────
// Diet copy
// ─────────────────────────────────────────────

/**
 * Returns an introductory feeding guide paragraph for a breed.
 * Incorporates size, weight, exercise level, and calorie estimates.
 */
export function generateDietCopy(breed: Breed): string {
  const mealsPerDay = breed.size === 'giant' ? 'three smaller meals' : 'two meals';
  const calorieRange = dailyCalories(breed);

  const weightManagementNote =
    breed.exercise_level <= 2
      ? ` ${breed.name}s have relatively modest activity requirements, which means overfeeding is a real risk; consistent portion control and low-calorie treats are advised.`
      : breed.exercise_level >= 4
        ? ` Their high energy output means ${breed.name}s need a calorie-dense diet — look for a working- or active-dog formula with at least 25% protein content.`
        : '';

  const sizeNote =
    breed.size === 'large' || breed.size === 'giant'
      ? ` Feeding from an elevated bowl and avoiding vigorous exercise directly after meals can help reduce the risk of gastric dilatation-volvulus (bloat), which ${sizeAdjective(breed)} breeds are predisposed to.`
      : breed.size === 'small'
        ? ` Small breeds can experience hypoglycaemia if meals are skipped; regular feeding times are especially important for ${breed.name} puppies.`
        : '';

  return (
    `Nutrition is a cornerstone of ${breed.name} health. ` +
    `An adult ${breed.name} weighing ${weightRange(breed)} typically requires ${calorieRange} of high-quality food per day, ` +
    `split across ${mealsPerDay} to support consistent energy levels and healthy digestion.` +
    weightManagementNote +
    sizeNote +
    ` Always adjust portions based on your dog's individual weight, life stage, and activity level, and consult your vet before making significant dietary changes.`
  );
}

// ─────────────────────────────────────────────
// Exercise copy
// ─────────────────────────────────────────────

/**
 * Returns an introductory exercise requirements paragraph for a breed.
 */
export function generateExerciseCopy(breed: Breed): string {
  const duration = exerciseDuration(breed.exercise_level);
  const levelLabel = exerciseLabel(breed.exercise_level);

  const activityType =
    breed.exercise_level >= 4
      ? 'running, fetch, agility, or off-lead trail walking'
      : breed.exercise_level === 3
        ? 'brisk walks, play sessions, and occasional off-lead runs'
        : 'daily walks and light play sessions';

  const mentalNote =
    breed.trainability >= 4
      ? ` ${breed.name}s are highly intelligent and benefit considerably from mental stimulation alongside physical exercise — training games, scent work, and puzzle feeders can all help prevent boredom-related behaviours.`
      : breed.trainability <= 2
        ? ` While not the most trainable breed, regular exercise is still essential for ${breed.name}s to maintain a healthy weight and a stable temperament.`
        : ` Combining physical activity with basic obedience practice or interactive play sessions helps meet both the physical and mental needs of the ${breed.name}.`;

  const apartmentNote = breed.apartment_friendly
    ? ` Although they can adapt to apartment living, ${breed.name} owners without a garden should plan to provide ${duration} of outdoor exercise daily without fail.`
    : ` Access to a securely fenced garden is strongly recommended; ${breed.name}s do not thrive when confined without adequate outdoor access.`;

  return (
    `The ${breed.name} has ${levelLabel} exercise requirements. ` +
    `Plan for ${duration} of ${activityType} every day to keep your ${breed.name} physically healthy and mentally settled.` +
    mentalNote +
    apartmentNote
  );
}

// ─────────────────────────────────────────────
// Comparison summary
// ─────────────────────────────────────────────

/**
 * Returns a natural-language comparison summary for two breeds.
 * Highlights the most meaningful differences across key dimensions.
 */
export function generateComparisonSummary(a: Breed, b: Breed): string {
  const sizeDiff =
    a.size !== b.size
      ? ` In terms of size, the ${a.name} is ${a.size} while the ${b.name} is ${b.size}, which affects exercise space requirements, feeding costs, and average lifespan.`
      : ` Both breeds are ${a.size}-sized dogs, so their space and feeding requirements are broadly similar.`;

  const exerciseDiff =
    Math.abs(a.exercise_level - b.exercise_level) >= 2
      ? ` The ${a.exercise_level > b.exercise_level ? a.name : b.name} demands considerably more daily exercise than the ${a.exercise_level > b.exercise_level ? b.name : a.name}, making it better suited to active owners.`
      : ` Both breeds have comparable exercise needs, though individual dogs will vary.`;

  const groomingDiff =
    Math.abs(a.grooming_level - b.grooming_level) >= 2
      ? ` Grooming is a notable difference: the ${a.grooming_level > b.grooming_level ? a.name : b.name} requires considerably more coat maintenance than the ${a.grooming_level > b.grooming_level ? b.name : a.name}.`
      : '';

  const lifespanDiff =
    Math.abs(a.lifespan_max - b.lifespan_max) >= 2
      ? ` Lifespan is also worth considering — ${a.name}s typically live ${lifespanRange(a)}, whereas ${b.name}s average ${lifespanRange(b)}.`
      : '';

  const familyNote =
    a.good_with_children && b.good_with_children
      ? ` Both breeds are well-suited to families with children.`
      : !a.good_with_children && !b.good_with_children
        ? ` Neither breed is particularly recommended for households with young children without careful supervision.`
        : ` The ${a.good_with_children ? a.name : b.name} is generally the better choice for families with young children.`;

  return (
    `Choosing between the ${a.name} and the ${b.name} comes down to lifestyle fit, living space, and the time you can commit to training and grooming.` +
    sizeDiff +
    exerciseDiff +
    groomingDiff +
    lifespanDiff +
    familyNote
  );
}

// ─────────────────────────────────────────────
// Condition hub intro
// ─────────────────────────────────────────────

/**
 * Returns an introductory paragraph for a condition hub page,
 * derived entirely from the condition data.
 */
export function generateConditionHubIntro(condition: Condition): string {
  const breedCount = condition.affected_breeds.length;
  const breedNote =
    breedCount > 0
      ? ` It is documented across ${breedCount} breed${breedCount > 1 ? 's' : ''}, though prevalence and severity can differ significantly between them.`
      : '';

  const costNote = condition.estimated_treatment_cost
    ? ` When treatment is required, costs are estimated at ${condition.estimated_treatment_cost} depending on severity, location, and the specific intervention needed.`
    : '';

  const hereditaryNote = condition.hereditary
    ? ` ${condition.name} has a hereditary component, so health-screening certificates from the breeder are strongly recommended for predisposed breeds.`
    : '';

  const symptomNote =
    condition.symptoms.length > 0
      ? ` Early signs to watch for include ${joinList(condition.symptoms.slice(0, 4).map((s) => s.toLowerCase()))}.`
      : '';

  const onsetNote = condition.typical_onset
    ? ` It typically becomes apparent at ${condition.typical_onset}.`
    : '';

  return (
    `${condition.name} is a ${condition.severity}-severity ${condition.category.toLowerCase()} condition that can affect dogs of all ages and breeds.` +
    ` ${condition.description}` +
    breedNote +
    onsetNote +
    symptomNote +
    costNote +
    hereditaryNote +
    ` This page covers symptoms, treatment options, and preventive steps — along with breed-specific information where available.`
  );
}

// ─────────────────────────────────────────────
// Breed FAQs
// ─────────────────────────────────────────────

/**
 * Returns 5–8 FAQ pairs computed from breed data.
 * Questions are phrased as a prospective owner would ask them.
 * All answers are derived from data fields — no hardcoded content.
 */
export function generateBreedFAQs(
  breed: Breed
): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];

  // Q1 — Lifespan
  faqs.push({
    question: `How long do ${breed.name}s live?`,
    answer: `The average lifespan of a ${breed.name} is ${lifespanRange(breed)}. Longevity is influenced by genetics, diet, weight management, and the presence of hereditary conditions. Regular veterinary check-ups, appropriate exercise, and a balanced diet all contribute to a longer, healthier life.`,
  });

  // Q2 — Weight / size
  faqs.push({
    question: `How big does a ${breed.name} get?`,
    answer: `An adult ${breed.name} typically weighs ${weightRange(breed)} and stands ${heightRange(breed)} at the shoulder. They are classified as a ${breed.size} breed. Males tend to be at the upper end of these ranges, while females are usually slightly smaller.`,
  });

  // Q3 — Exercise
  faqs.push({
    question: `How much exercise does a ${breed.name} need?`,
    answer: `${breed.name}s have ${exerciseLabel(breed.exercise_level)} exercise requirements. Aim for ${exerciseDuration(breed.exercise_level)} of ${breed.exercise_level >= 4 ? 'vigorous activity such as running, off-lead fetch, or agility' : 'walks and active play'} each day. Without adequate exercise, ${breed.name}s may develop boredom-related behaviours.`,
  });

  // Q4 — Grooming
  faqs.push({
    question: `Are ${breed.name}s high-maintenance to groom?`,
    answer: `${breed.name}s are ${groomingLabel(breed.grooming_level)} when it comes to coat care. Their coat ${breed.shedding_level >= 4 ? `sheds ${sheddingLabel(breed.shedding_level)}ly, particularly during seasonal coat changes, and requires brushing several times a week to manage loose hair` : breed.shedding_level <= 2 ? `sheds ${sheddingLabel(breed.shedding_level)}ly and needs only occasional brushing to stay in good condition` : `sheds moderately and benefits from weekly brushing`}. Professional grooming every 6–12 weeks is advisable for longer or wire-coated breeds.`,
  });

  // Q5 — Health issues
  if (breed.health_issues.length > 0) {
    const conditionList =
      breed.conditions_detail && breed.conditions_detail.length > 0
        ? joinList(breed.conditions_detail.slice(0, 4).map((c) => c.name))
        : `${breed.health_issues.length} documented condition${breed.health_issues.length > 1 ? 's' : ''}`;
    faqs.push({
      question: `What health problems are ${breed.name}s prone to?`,
      answer: `Like all pedigree breeds, the ${breed.name} has a number of associated health concerns. The most commonly documented include ${conditionList}. Responsible breeders screen for these conditions, and prospective owners should request health certificates. Pet insurance that covers hereditary conditions is strongly recommended.`,
    });
  }

  // Q6 — Children / family suitability
  faqs.push({
    question: `Are ${breed.name}s good with children?`,
    answer: breed.good_with_children
      ? `Yes — the ${breed.name} is generally a good family dog and tends to be patient and gentle with children. As with any breed, early socialisation and teaching children how to interact respectfully with dogs is important.`
      : `The ${breed.name} can be managed in a family environment, but may not be the most natural fit with very young children. Close supervision and thorough early socialisation are essential.`,
  });

  // Q7 — Trainability
  faqs.push({
    question: `How easy is it to train a ${breed.name}?`,
    answer: `The ${breed.name} is ${trainabilityLabel(breed.trainability)}. ${breed.trainability >= 4 ? `They respond well to positive reinforcement and can master a wide range of commands and tasks. Consistency and reward-based methods work best.` : breed.trainability <= 2 ? `They can have an independent streak and may require more patience, repetition, and professional guidance than more biddable breeds.` : `They respond reasonably well to clear, consistent training using positive reinforcement, particularly when training begins in puppyhood.`}`,
  });

  // Q8 — Apartment suitability (only if worth noting)
  if (breed.apartment_friendly || breed.size === 'large' || breed.size === 'giant') {
    faqs.push({
      question: `Can ${breed.name}s live in an apartment?`,
      answer: breed.apartment_friendly
        ? `Yes — ${breed.name}s can adapt to apartment living provided their daily exercise requirements are reliably met. Access to nearby green space and a consistent exercise routine are essential to prevent restlessness.`
        : `The ${breed.name} is best suited to a home with outdoor space. Their ${sizeAdjective(breed)} size and ${exerciseLabel(breed.exercise_level)} energy levels mean apartment living without a garden is generally not recommended.`,
    });
  }

  return faqs;
}

// ─────────────────────────────────────────────
// Diet type copy (breed-contextualised)
// ─────────────────────────────────────────────

/**
 * Returns a short introductory paragraph for a diet type as applied
 * to a specific breed.
 */
export function generateDietTypeCopy(breed: Breed, diet: DietType): string {
  const breedFit = diet.suitable_breeds.includes(breed.slug)
    ? `well-suited to the ${breed.name}`
    : `an option some ${breed.name} owners consider`;

  const portionNote = ` For a ${breed.size} dog like the ${breed.name}, this typically means ${feedingGuideForSize(diet, breed)}.`;

  const riskNote =
    diet.risks.length > 0
      ? ` As with any dietary approach, there are potential drawbacks to be aware of: ${joinList(diet.risks.slice(0, 2).map((r) => r.toLowerCase()))}.`
      : '';

  return (
    `The ${diet.name} diet is ${breedFit}. ${diet.description}` +
    portionNote +
    riskNote +
    (diet.suitable_for.length > 0
      ? ` It is particularly recommended for ${joinList(diet.suitable_for.slice(0, 2).map((s) => s.toLowerCase()))}.`
      : '')
  );
}
