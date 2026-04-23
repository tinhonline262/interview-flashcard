/**
 * Spaced Repetition Algorithm Implementation
 *
 * Implements the SM-2 (SuperMemo-2) algorithm and Leitner system
 * for optimal memory retention and efficient learning.
 *
 * SM-2: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-learning-process
 */

/**
 * Quality rating scale (0-5)
 * 5 - Perfect, immediate recall
 * 4 - Correct response, slight hesitation
 * 3 - Correct response after significant effort
 * 2 - Incorrect response, but remembered something
 * 1 - Incorrect response, familiar concept
 * 0 - No recollection, complete blank
 */
export type QualityRating = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Represents a single review event
 */
export interface ReviewRecord {
  reviewedAt: number; // timestamp
  quality: QualityRating;
  interval?: number; // days until next review
  easeFactor?: number; // for SM-2
  repetitions?: number; // consecutive correct answers
}

/**
 * Core spaced repetition data for each flashcard
 */
export interface SpacedRepetitionData {
  id: number;
  reviewHistory: ReviewRecord[];
  nextReviewDate: number; // timestamp when next review is due
  interval: number; // days until next review
  easeFactor: number; // difficulty factor (SM-2)
  repetitions: number; // consecutive correct answers (SM-2)
  lapses: number; // incorrect answers after mastery
  totalReviews: number;
  lastReviewDate: number | null;
}

/**
 * Statistics for analysis
 */
export interface SpacedRepetitionStats {
  totalItemsTracked: number;
  itemsDueForReview: number;
  itemsMastered: number; // 250+ ease factor
  newItems: number; // never reviewed
  averageEaseFactor: number;
  currentStreak: number; // consecutive reviews with quality >= 3
  totalReviewsCompleted: number;
  daysSinceLastReview: number | null;
}

const INITIAL_EASE_FACTOR = 2.5;
const INITIAL_INTERVAL = 1; // days
const MASTERY_THRESHOLD = 250; // ease factor threshold for mastery
const LAPSE_THRESHOLD = 3; // lapses before considered difficult

/**
 * Initialize spaced repetition data for a new item
 */
export function initializeSpacedRepetition(id: number): SpacedRepetitionData {
  return {
    id,
    reviewHistory: [],
    nextReviewDate: Date.now(), // immediately available for review
    interval: INITIAL_INTERVAL,
    easeFactor: INITIAL_EASE_FACTOR,
    repetitions: 0,
    lapses: 0,
    totalReviews: 0,
    lastReviewDate: null,
  };
}

/**
 * SM-2 Algorithm Implementation
 * Updates spaced repetition data based on review quality
 *
 * @param data - Current spaced repetition data
 * @param quality - Quality rating (0-5)
 * @returns Updated spaced repetition data
 */
export function updateSpacedRepetition(
  data: SpacedRepetitionData,
  quality: QualityRating,
): SpacedRepetitionData {
  const now = Date.now();
  const newRecord: ReviewRecord = {
    reviewedAt: now,
    quality,
  };

  let newInterval = data.interval;
  let newEaseFactor = data.easeFactor;
  let newRepetitions = data.repetitions;
  let newLapses = data.lapses;

  if (quality < 3) {
    // Incorrect or insufficient response - reset progression
    newInterval = 1;
    newRepetitions = 0;
    newLapses = data.lapses + 1;
    // Ease factor decreases, but stays >= 1.3
    newEaseFactor = Math.max(1.3, data.easeFactor - 0.2);
  } else {
    // Correct response
    newLapses = 0;
    newRepetitions = data.repetitions + 1;

    // Calculate interval based on repetition count
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 3;
    } else {
      newInterval = Math.round(data.interval * data.easeFactor);
    }

    // Update ease factor based on quality
    // Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const q = quality;
    newEaseFactor = data.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    newEaseFactor = Math.max(1.3, newEaseFactor); // Ensure minimum ease factor
  }

  newRecord.interval = newInterval;
  newRecord.easeFactor = newEaseFactor;
  newRecord.repetitions = newRepetitions;

  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    ...data,
    reviewHistory: [...data.reviewHistory, newRecord],
    nextReviewDate: nextReviewDate.getTime(),
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: newRepetitions,
    lapses: newLapses,
    totalReviews: data.totalReviews + 1,
    lastReviewDate: now,
  };
}

/**
 * Check if an item is due for review
 */
export function isDueForReview(data: SpacedRepetitionData): boolean {
  return Date.now() >= data.nextReviewDate;
}

/**
 * Get days until next review (negative = overdue)
 */
export function getDaysUntilReview(data: SpacedRepetitionData): number {
  const msUntilReview = data.nextReviewDate - Date.now();
  return Math.ceil(msUntilReview / (1000 * 60 * 60 * 24));
}

/**
 * Calculate statistics from all spaced repetition data
 */
export function calculateStatistics(
  allData: SpacedRepetitionData[],
): SpacedRepetitionStats {
  const now = Date.now();
  let itemsDueForReview = 0;
  let itemsMastered = 0;
  let newItems = 0;
  let totalEaseFactor = 0;
  let totalReviewsCompleted = 0;
  let lastReviewDateGlobal: number | null = null;

  for (const item of allData) {
    if (item.totalReviews === 0) {
      newItems++;
    } else {
      totalReviewsCompleted += item.totalReviews;
      totalEaseFactor += item.easeFactor;

      if (item.easeFactor >= MASTERY_THRESHOLD) {
        itemsMastered++;
      }

      if (isDueForReview(item)) {
        itemsDueForReview++;
      }

      if (
        item.lastReviewDate &&
        (!lastReviewDateGlobal || item.lastReviewDate > lastReviewDateGlobal)
      ) {
        lastReviewDateGlobal = item.lastReviewDate;
      }
    }
  }

  const reviewedItems = allData.length - newItems;
  const averageEaseFactor =
    reviewedItems > 0 ? totalEaseFactor / reviewedItems : 0;
  const daysSinceLastReview = lastReviewDateGlobal
    ? Math.floor((now - lastReviewDateGlobal) / (1000 * 60 * 60 * 24))
    : null;

  return {
    totalItemsTracked: allData.length,
    itemsDueForReview,
    itemsMastered,
    newItems,
    averageEaseFactor: Math.round(averageEaseFactor * 100) / 100,
    currentStreak: 0, // Could be calculated if tracking consecutive sessions
    totalReviewsCompleted,
    daysSinceLastReview,
  };
}

/**
 * Get recommended items for review in priority order
 *
 * Priority:
 * 1. Overdue items
 * 2. Items mastering but not yet automated
 * 3. New items (never reviewed)
 * 4. Recently reviewed items
 */
export function getReviewQueue(
  allData: SpacedRepetitionData[],
  limit?: number,
): SpacedRepetitionData[] {
  const now = Date.now();

  // Categorize items
  const overdue: SpacedRepetitionData[] = [];
  const dueSoon: SpacedRepetitionData[] = [];
  const notReady: SpacedRepetitionData[] = [];

  for (const item of allData) {
    if (isDueForReview(item)) {
      overdue.push(item);
    } else {
      const daysUntil = getDaysUntilReview(item);
      if (daysUntil <= 1 && item.totalReviews > 0) {
        dueSoon.push(item);
      } else {
        notReady.push(item);
      }
    }
  }

  // Sort each category
  overdue.sort((a, b) => a.nextReviewDate - b.nextReviewDate);
  dueSoon.sort((a, b) => a.nextReviewDate - b.nextReviewDate);
  notReady.sort((a, b) => {
    // Prioritize items with lower ease factor (harder items)
    const easeDiff = a.easeFactor - b.easeFactor;
    if (easeDiff !== 0) return easeDiff;
    return a.nextReviewDate - b.nextReviewDate;
  });

  const queue = [...overdue, ...dueSoon, ...notReady];
  return limit ? queue.slice(0, limit) : queue;
}

/**
 * Export spaced repetition data for backup
 */
export function exportSpacedRepetitionData(
  allData: SpacedRepetitionData[],
): string {
  return JSON.stringify(allData, null, 2);
}

/**
 * Import spaced repetition data from backup
 */
export function importSpacedRepetitionData(
  jsonString: string,
): SpacedRepetitionData[] {
  try {
    const data = JSON.parse(jsonString);
    // Validate structure
    if (!Array.isArray(data)) throw new Error("Invalid format");
    return data as SpacedRepetitionData[];
  } catch (error) {
    console.error("Failed to import spaced repetition data:", error);
    return [];
  }
}

/**
 * Reset spaced repetition for specific items
 */
export function resetSpacedRepetition(
  items: SpacedRepetitionData[],
): SpacedRepetitionData[] {
  return items.map((item) => ({
    ...item,
    reviewHistory: [],
    nextReviewDate: Date.now(),
    interval: INITIAL_INTERVAL,
    easeFactor: INITIAL_EASE_FACTOR,
    repetitions: 0,
    lapses: 0,
    totalReviews: 0,
    lastReviewDate: null,
  }));
}

/**
 * Get difficulty level based on ease factor
 */
export function getDifficultyLevel(
  easeFactor: number,
): "easy" | "normal" | "hard" | "very-hard" {
  if (easeFactor >= 2.8) return "easy";
  if (easeFactor >= 2.2) return "normal";
  if (easeFactor >= 1.6) return "hard";
  return "very-hard";
}

/**
 * Format next review date for display
 */
export function formatNextReviewDate(data: SpacedRepetitionData): string {
  const daysUntil = getDaysUntilReview(data);

  if (daysUntil <= -1) {
    return `${-daysUntil} days overdue`;
  }
  if (daysUntil === 0) {
    return "Due today";
  }
  if (daysUntil === 1) {
    return "Due tomorrow";
  }

  return `In ${daysUntil} days`;
}
