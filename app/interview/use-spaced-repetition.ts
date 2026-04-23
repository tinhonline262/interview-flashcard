'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { QAItem } from './interview-data'
import {
  type SpacedRepetitionData,
  type QualityRating,
  initializeSpacedRepetition,
  updateSpacedRepetition,
  calculateStatistics,
  getReviewQueue,
  isDueForReview,
  exportSpacedRepetitionData,
  importSpacedRepetitionData,
  resetSpacedRepetition,
  getDaysUntilReview,
  getDifficultyLevel,
  formatNextReviewDate,
} from './spaced-repetition'

const STORAGE_KEY_SR = 'iv_spaced_repetition'

/**
 * Hook for managing spaced repetition data
 * Integrates with localStorage for persistence
 */
export function useSpacedRepetition(allData: QAItem[]) {
  const [srData, setSrData] = useState<Map<number, SpacedRepetitionData>>(new Map())
  const [hydrated, setHydrated] = useState(false)

  // Initialize/load spaced repetition data on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEY_SR)
      const loaded: SpacedRepetitionData[] = stored ? JSON.parse(stored) : []
      const map = new Map(loaded.map(item => [item.id, item]))

      // Initialize missing items
      for (const item of allData) {
        if (!map.has(item.id)) {
          map.set(item.id, initializeSpacedRepetition(item.id))
        }
      }

      setSrData(map)
    } catch (error) {
      console.error('Failed to load spaced repetition data:', error)
      // Fallback: initialize all items
      const map = new Map(allData.map(item => [item.id, initializeSpacedRepetition(item.id)]))
      setSrData(map)
    }

    setHydrated(true)
  }, [allData])

  // Persist changes to localStorage
  useEffect(() => {
    if (!hydrated || srData.size === 0) return

    try {
      const dataArray = Array.from(srData.values())
      localStorage.setItem(STORAGE_KEY_SR, JSON.stringify(dataArray))
    } catch (error) {
      console.error('Failed to save spaced repetition data:', error)
    }
  }, [srData, hydrated])

  /**
   * Record a review for an item
   */
  const recordReview = useCallback((itemId: number, quality: QualityRating) => {
    setSrData(prev => {
      const item = prev.get(itemId) || initializeSpacedRepetition(itemId)
      const updated = updateSpacedRepetition(item, quality)
      const next = new Map(prev)
      next.set(itemId, updated)
      return next
    })
  }, [])

  /**
   * Get spaced repetition data for an item
   */
  const getItemData = useCallback((itemId: number): SpacedRepetitionData => {
    return srData.get(itemId) || initializeSpacedRepetition(itemId)
  }, [srData])

  /**
   * Get all spaced repetition data as array
   */
  const getAllData = useCallback((): SpacedRepetitionData[] => {
    return Array.from(srData.values())
  }, [srData])

  /**
   * Calculate statistics
   */
  const stats = useMemo(() => {
    return calculateStatistics(Array.from(srData.values()))
  }, [srData])

  /**
   * Get review queue (items to review today, prioritized)
   */
  const reviewQueue = useMemo(() => {
    return getReviewQueue(Array.from(srData.values()))
  }, [srData])

  /**
   * Get items due for review
   */
  const dueItems = useMemo(() => {
    const allItems = Array.from(srData.values())
    return allItems.filter(item => isDueForReview(item))
  }, [srData])

  /**
   * Get new items (never reviewed)
   */
  const newItems = useMemo(() => {
    const allItems = Array.from(srData.values())
    return allItems.filter(item => item.totalReviews === 0)
  }, [srData])

  /**
   * Get mastered items
   */
  const masteredItems = useMemo(() => {
    const allItems = Array.from(srData.values())
    return allItems.filter(item => item.easeFactor >= 250)
  }, [srData])

  /**
   * Export data for backup
   */
  const exportData = useCallback(() => {
    return exportSpacedRepetitionData(Array.from(srData.values()))
  }, [srData])

  /**
   * Import data from backup
   */
  const importData = useCallback((jsonString: string) => {
    const imported = importSpacedRepetitionData(jsonString)
    const map = new Map(imported.map(item => [item.id, item]))
    setSrData(map)
  }, [])

  /**
   * Reset all spaced repetition data
   */
  const resetAll = useCallback(() => {
    setSrData(new Map(
      allData.map(item => [item.id, initializeSpacedRepetition(item.id)])
    ))
  }, [allData])

  /**
   * Reset specific items
   */
  const resetItems = useCallback((itemIds: number[]) => {
    setSrData(prev => {
      const next = new Map(prev)
      for (const id of itemIds) {
        next.set(id, initializeSpacedRepetition(id))
      }
      return next
    })
  }, [])

  return {
    // Core operations
    recordReview,
    getItemData,
    getAllData,
    
    // Queries
    stats,
    reviewQueue,
    dueItems,
    newItems,
    masteredItems,
    
    // Utilities
    isDueForReview,
    getDaysUntilReview,
    getDifficultyLevel,
    formatNextReviewDate,
    
    // Data management
    exportData,
    importData,
    resetAll,
    resetItems,
    
    // State
    hydrated,
  }
}
