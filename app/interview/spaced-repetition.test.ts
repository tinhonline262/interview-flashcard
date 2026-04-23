/**
 * Test Suite for Spaced Repetition System
 * 
 * This file demonstrates how to test the spaced repetition functionality.
 * Can be adapted for your testing framework (Jest, Vitest, etc.)
 */

import {
  initializeSpacedRepetition,
  updateSpacedRepetition,
  isDueForReview,
  getDaysUntilReview,
  calculateStatistics,
  getReviewQueue,
  getDifficultyLevel,
  type SpacedRepetitionData,
  type QualityRating,
} from './spaced-repetition'

describe('Spaced Repetition System', () => {
  describe('Initialization', () => {
    test('should initialize with default values', () => {
      const data = initializeSpacedRepetition(1)
      
      expect(data.id).toBe(1)
      expect(data.easeFactor).toBe(2.5)
      expect(data.interval).toBe(1)
      expect(data.repetitions).toBe(0)
      expect(data.lapses).toBe(0)
      expect(data.totalReviews).toBe(0)
      expect(data.reviewHistory).toHaveLength(0)
    })

    test('should set next review date to now', () => {
      const now = Date.now()
      const data = initializeSpacedRepetition(1)
      
      // Should be very close to now (within 1 second)
      expect(Math.abs(data.nextReviewDate - now)).toBeLessThan(1000)
    })
  })

  describe('SM-2 Algorithm', () => {
    test('should handle perfect recall (quality 5)', () => {
      let data = initializeSpacedRepetition(1)
      
      // First review with perfect recall
      data = updateSpacedRepetition(data, 5)
      
      expect(data.repetitions).toBe(1)
      expect(data.easeFactor).toBeGreaterThan(2.5) // Should increase
      expect(data.interval).toBe(1) // First review interval
      expect(data.totalReviews).toBe(1)
      expect(data.lapses).toBe(0)
    })

    test('should handle good recall (quality 4)', () => {
      let data = initializeSpacedRepetition(1)
      
      data = updateSpacedRepetition(data, 4)
      
      expect(data.repetitions).toBe(1)
      expect(data.easeFactor).toBeGreaterThan(2.5)
      expect(data.totalReviews).toBe(1)
    })

    test('should handle moderate recall (quality 3)', () => {
      let data = initializeSpacedRepetition(1)
      
      data = updateSpacedRepetition(data, 3)
      
      expect(data.repetitions).toBe(1)
      expect(data.easeFactor).toBeLessThanOrEqual(2.5)
      expect(data.totalReviews).toBe(1)
    })

    test('should reset on poor recall (quality 0-2)', () => {
      let data = initializeSpacedRepetition(1)
      
      // First, mark as learned
      data = updateSpacedRepetition(data, 5)
      data = updateSpacedRepetition(data, 5)
      expect(data.repetitions).toBe(2)
      
      // Then fail
      data = updateSpacedRepetition(data, 1)
      
      expect(data.repetitions).toBe(0)
      expect(data.interval).toBe(1)
      expect(data.lapses).toBe(1)
      expect(data.easeFactor).toBeLessThan(2.5)
    })

    test('should follow correct interval progression', () => {
      let data = initializeSpacedRepetition(1)
      
      // First repetition: interval should be 1 day
      data = updateSpacedRepetition(data, 5)
      expect(data.interval).toBe(1)
      
      // Second repetition: interval should be 3 days
      data = updateSpacedRepetition(data, 5)
      expect(data.interval).toBe(3)
      
      // Third+ repetition: interval = previous interval * ease factor
      const easeBeforeThird = data.easeFactor
      data = updateSpacedRepetition(data, 5)
      expect(data.interval).toBe(Math.round(3 * easeBeforeThird))
    })

    test('should maintain minimum ease factor of 1.3', () => {
      let data = initializeSpacedRepetition(1)
      
      // Fail multiple times to drive ease factor down
      for (let i = 0; i < 10; i++) {
        data = updateSpacedRepetition(data, 0)
      }
      
      expect(data.easeFactor).toBeGreaterThanOrEqual(1.3)
    })
  })

  describe('Review Status', () => {
    test('should identify items due for review', () => {
      const data = initializeSpacedRepetition(1)
      
      // New item should be due immediately
      expect(isDueForReview(data)).toBe(true)
      
      // Update to future date
      data.nextReviewDate = Date.now() + 1000 * 60 * 60 // 1 hour from now
      
      expect(isDueForReview(data)).toBe(false)
    })

    test('should calculate days until review correctly', () => {
      const data = initializeSpacedRepetition(1)
      
      // Set to 3 days from now
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 3)
      data.nextReviewDate = futureDate.getTime()
      
      const daysUntil = getDaysUntilReview(data)
      expect(daysUntil).toBe(3)
      
      // Set to 2 days ago (overdue)
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 2)
      data.nextReviewDate = pastDate.getTime()
      
      const daysOverdue = getDaysUntilReview(data)
      expect(daysOverdue).toBeLessThan(0)
    })
  })

  describe('Difficulty Classification', () => {
    test('should classify difficulty correctly', () => {
      expect(getDifficultyLevel(3.0)).toBe('easy')
      expect(getDifficultyLevel(2.5)).toBe('normal')
      expect(getDifficultyLevel(1.8)).toBe('hard')
      expect(getDifficultyLevel(1.4)).toBe('very-hard')
    })
  })

  describe('Statistics', () => {
    test('should calculate statistics correctly', () => {
      const items = [
        initializeSpacedRepetition(1),
        initializeSpacedRepetition(2),
        initializeSpacedRepetition(3),
      ]
      
      // Mark first item as reviewed (mastered)
      items[0] = updateSpacedRepetition(items[0], 5)
      items[0] = updateSpacedRepetition(items[0], 5)
      items[0] = updateSpacedRepetition(items[0], 5)
      items[0].easeFactor = 260 // Mark as mastered
      
      // Mark second item as reviewed (not mastered)
      items[1] = updateSpacedRepetition(items[1], 4)
      
      // Third item never reviewed
      
      const stats = calculateStatistics(items)
      
      expect(stats.totalItemsTracked).toBe(3)
      expect(stats.newItems).toBe(1)
      expect(stats.totalReviewsCompleted).toBeGreaterThan(0)
      expect(stats.itemsMastered).toBe(1)
    })

    test('should identify items due for review in stats', () => {
      const items = [
        initializeSpacedRepetition(1),
        initializeSpacedRepetition(2),
      ]
      
      // First item is due (new)
      // Second item set to future date (not due)
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5)
      items[1].nextReviewDate = futureDate.getTime()
      
      const stats = calculateStatistics(items)
      
      expect(stats.itemsDueForReview).toBe(1)
    })
  })

  describe('Review Queue', () => {
    test('should prioritize overdue items', () => {
      const items = [
        initializeSpacedRepetition(1),
        initializeSpacedRepetition(2),
        initializeSpacedRepetition(3),
      ]
      
      // Item 1: overdue by 1 day
      items[0].nextReviewDate = Date.now() - 1000 * 60 * 60 * 24
      items[0].totalReviews = 1
      
      // Item 2: overdue by 2 days
      items[1].nextReviewDate = Date.now() - 1000 * 60 * 60 * 24 * 2
      items[1].totalReviews = 1
      
      // Item 3: due in 5 days
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5)
      items[2].nextReviewDate = futureDate.getTime()
      items[2].totalReviews = 1
      
      const queue = getReviewQueue(items)
      
      // Item 2 should be first (most overdue)
      expect(queue[0].id).toBe(2)
      // Item 1 should be second
      expect(queue[1].id).toBe(1)
      // Item 3 should be last
      expect(queue[2].id).toBe(3)
    })

    test('should limit queue size', () => {
      const items = Array.from({ length: 20 }, (_, i) => 
        initializeSpacedRepetition(i + 1)
      )
      
      const queue = getReviewQueue(items, 5)
      
      expect(queue).toHaveLength(5)
    })
  })

  describe('History Tracking', () => {
    test('should track review history', () => {
      let data = initializeSpacedRepetition(1)
      
      data = updateSpacedRepetition(data, 5)
      expect(data.reviewHistory).toHaveLength(1)
      expect(data.reviewHistory[0].quality).toBe(5)
      
      data = updateSpacedRepetition(data, 4)
      expect(data.reviewHistory).toHaveLength(2)
      expect(data.reviewHistory[1].quality).toBe(4)
    })

    test('should include timestamp in history', () => {
      const before = Date.now()
      let data = initializeSpacedRepetition(1)
      data = updateSpacedRepetition(data, 5)
      const after = Date.now()
      
      const record = data.reviewHistory[0]
      expect(record.reviewedAt).toBeGreaterThanOrEqual(before)
      expect(record.reviewedAt).toBeLessThanOrEqual(after)
    })
  })

  describe('Edge Cases', () => {
    test('should handle maximum quality ratings', () => {
      let data = initializeSpacedRepetition(1)
      
      // Rating 5 (perfect)
      data = updateSpacedRepetition(data, 5)
      const easeAfterMax = data.easeFactor
      
      // Keep rating 5
      for (let i = 0; i < 10; i++) {
        data = updateSpacedRepetition(data, 5)
      }
      
      // Ease should continue increasing
      expect(data.easeFactor).toBeGreaterThan(easeAfterMax)
    })

    test('should handle multiple lapses', () => {
      let data = initializeSpacedRepetition(1)
      
      // Get to 3 successful reps
      data = updateSpacedRepetition(data, 5)
      data = updateSpacedRepetition(data, 5)
      data = updateSpacedRepetition(data, 5)
      
      // Fail 3 times
      data = updateSpacedRepetition(data, 0)
      expect(data.lapses).toBe(1)
      
      data = updateSpacedRepetition(data, 0)
      expect(data.lapses).toBe(2)
      
      data = updateSpacedRepetition(data, 0)
      expect(data.lapses).toBe(3)
      
      // Should reset after each failure
      expect(data.repetitions).toBe(0)
    })
  })
})

// Example usage in tests
describe('Integration Examples', () => {
  test('should simulate a learning session', () => {
    // Start with 3 new items
    let items = [
      initializeSpacedRepetition(1),
      initializeSpacedRepetition(2),
      initializeSpacedRepetition(3),
    ]
    
    // User reviews item 1 (perfect)
    items[0] = updateSpacedRepetition(items[0], 5)
    
    // User reviews item 2 (good)
    items[1] = updateSpacedRepetition(items[1], 4)
    
    // User reviews item 3 (poor)
    items[2] = updateSpacedRepetition(items[2], 1)
    
    // Check stats
    const stats = calculateStatistics(items)
    expect(stats.totalReviewsCompleted).toBe(3)
    expect(stats.newItems).toBe(0)
    
    // Item 3 should be due sooner than items 1 and 2
    expect(items[2].nextReviewDate).toBeLessThan(items[1].nextReviewDate)
    expect(items[2].nextReviewDate).toBeLessThan(items[0].nextReviewDate)
  })

  test('should handle learning curve over time', () => {
    let data = initializeSpacedRepetition(1)
    const reviews: QualityRating[] = [3, 4, 4, 5, 5, 5, 4, 5]
    
    for (const quality of reviews) {
      data = updateSpacedRepetition(data, quality)
    }
    
    // After consistent good performance, ease factor should be high
    expect(data.easeFactor).toBeGreaterThan(2.5)
    
    // Interval should be increasing
    expect(data.interval).toBeGreaterThan(3) // More than 3rd review interval
    
    // Repetitions should reflect successes
    expect(data.repetitions).toBeGreaterThan(3)
    
    // No lapses from consistent success
    expect(data.lapses).toBe(0)
  })
})
