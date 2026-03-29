// ─────────────────────────────────────────────
// JSON-LD schema generator functions
// Each function returns a complete, valid
// JSON-LD object ready to be serialised into
// a <script type="application/ld+json"> tag.
// ─────────────────────────────────────────────

import type { Breed, Condition } from './types';

// ─────────────────────────────────────────────
// WebSite
// ─────────────────────────────────────────────

/**
 * Site-level WebSite schema with SearchAction.
 * Place once in the root layout.
 */
export function generateWebSiteSchema(siteUrl: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: siteUrl,
    name: 'BreedHealth',
    description:
      'Comprehensive dog breed health information: conditions, diet, exercise, and breed comparisons.',
    inLanguage: 'en-GB',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/breeds?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ─────────────────────────────────────────────
// Breed / Animal
// ─────────────────────────────────────────────

/**
 * WebPage schema describing a dog breed entity via additionalProperty.
 * Schema.org has no first-class DogBreed type, so we use Thing with
 * structured PropertyValue entries for all measurable breed attributes.
 */
export function generateAnimalSchema(breed: Breed, url: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url,
    name: `${breed.name} Dog Breed — Health, Diet & Care Guide`,
    description: breed.description,
    about: {
      '@type': 'Thing',
      name: breed.name,
      description: breed.description,
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'Breed Group',
          value: breed.group,
        },
        {
          '@type': 'PropertyValue',
          name: 'Size',
          value: cap(breed.size),
        },
        {
          '@type': 'PropertyValue',
          name: 'Weight',
          value: `${breed.weight_min_kg}–${breed.weight_max_kg} kg`,
        },
        {
          '@type': 'PropertyValue',
          name: 'Height',
          value: `${breed.height_min_cm}–${breed.height_max_cm} cm`,
        },
        {
          '@type': 'PropertyValue',
          name: 'Lifespan',
          value: `${breed.lifespan_min}–${breed.lifespan_max} years`,
        },
        {
          '@type': 'PropertyValue',
          name: 'Origin',
          value: breed.origin,
        },
        {
          '@type': 'PropertyValue',
          name: 'Coat Type',
          value: cap(breed.coat_type),
        },
        {
          '@type': 'PropertyValue',
          name: 'Coat Colours',
          value: breed.coat_colors.join(', '),
        },
        {
          '@type': 'PropertyValue',
          name: 'Temperament',
          value: breed.temperament.join(', '),
        },
      ],
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.breed-intro', '.breed-summary'],
    },
  };
}

// ─────────────────────────────────────────────
// Medical Condition
// ─────────────────────────────────────────────

/**
 * MedicalWebPage schema for a dog health condition.
 * Uses schema.org/MedicalCondition within a MedicalWebPage wrapper.
 */
export function generateMedicalConditionSchema(
  condition: Condition,
  url: string
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    url,
    name: `${condition.name} in Dogs — Symptoms, Causes & Treatment`,
    description: condition.description,
    specialty: 'Veterinary',
    about: {
      '@type': 'MedicalCondition',
      name: condition.name,
      description: condition.description,
      signOrSymptom: condition.symptoms.map((s) => ({
        '@type': 'MedicalSymptom',
        name: s,
      })),
      possibleTreatment: {
        '@type': 'MedicalTherapy',
        name: 'Veterinary Treatment',
        description: condition.treatment_overview,
      },
      typicalTest: condition.typical_onset
        ? `Typically presents at ${condition.typical_onset}`
        : undefined,
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'Hereditary',
          value: condition.hereditary ? 'Yes' : 'No',
        },
        {
          '@type': 'PropertyValue',
          name: 'Estimated Treatment Cost',
          value: condition.estimated_treatment_cost,
        },
        {
          '@type': 'PropertyValue',
          name: 'Category',
          value: condition.category,
        },
      ],
    },
    medicalAudience: {
      '@type': 'MedicalAudience',
      audienceType: 'Patient',
    },
  };
}

// ─────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────

/**
 * FAQPage schema from an array of Q&A pairs.
 * Accepts the same shape returned by generateBreedFAQs().
 */
export function generateFAQSchema(
  faqs: { question: string; answer: string }[]
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };
}

// ─────────────────────────────────────────────
// Breadcrumb
// ─────────────────────────────────────────────

/**
 * BreadcrumbList schema from an ordered array of name/url pairs.
 *
 * Example:
 *   generateBreadcrumbSchema([
 *     { name: 'Home', url: 'https://breedhealth.org/' },
 *     { name: 'Breeds', url: 'https://breedhealth.org/breeds/' },
 *     { name: 'Golden Retriever', url: 'https://breedhealth.org/breeds/golden-retriever/' },
 *   ])
 */
export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(({ name, url }, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: url,
    })),
  };
}

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

function cap(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
