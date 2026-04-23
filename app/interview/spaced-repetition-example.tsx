/**
 * Example Integration: Using Spaced Repetition with Flashcards
 *
 * This file demonstrates how to integrate the spaced repetition system
 * into your existing flashcard components. Copy and adapt this code.
 */

"use client";

import { useState, useCallback } from "react";
import type { QAItem } from "./interview-data";
import { useSpacedRepetition } from "./use-spaced-repetition";
import {
  SpacedRepetitionStats,
  ItemReviewInfo,
  ReviewQualityButtons,
  ItemDifficultyBadge,
} from "./spaced-repetition-ui";
import type { QualityRating } from "./spaced-repetition";

interface EnhancedFlashcardViewProps {
  data: QAItem[];
  searchQuery?: string;
  bookmarks: Set<number>;
  learned: Set<number>;
  onToggleBookmark: (id: number) => void;
  onToggleLearned: (id: number) => void;
}

/**
 * Example: Enhanced flashcard view with spaced repetition
 *
 * Usage:
 * - Import this component
 * - Use it like: <EnhancedFlashcardView data={questions} ... />
 * - Import the CSS: spaced-repetition.css
 */
export function EnhancedFlashcardView({
  data,
  searchQuery,
  bookmarks,
  learned,
  onToggleBookmark,
  onToggleLearned,
}: EnhancedFlashcardViewProps) {
  const sr = useSpacedRepetition(data);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showRatingButtons, setShowRatingButtons] = useState(false);

  if (!sr.hydrated) {
    return <div>Loading...</div>;
  }

  if (data.length === 0) {
    return <div className="iv-empty">No questions found.</div>;
  }

  const item = data[index];
  const srData = sr.getItemData(item.id);
  const isBookmarked = bookmarks.has(item.id);
  const isLearned = learned.has(item.id);

  const handleRating = useCallback(
    (quality: QualityRating) => {
      sr.recordReview(item.id, quality);

      // Auto-mark as learned if rating is good (4-5)
      if (quality >= 4 && !isLearned) {
        onToggleLearned(item.id);
      }

      setShowRatingButtons(false);
      // Move to next item after brief delay
      setTimeout(() => {
        if (index < data.length - 1) {
          setIndex(index + 1);
          setIsFlipped(false);
        }
      }, 500);
    },
    [index, data.length, item.id, isLearned, onToggleLearned, sr],
  );

  return (
    <div className="enhanced-flashcard-container">
      {/* Statistics section */}
      <SpacedRepetitionStats
        stats={sr.stats}
        onResetClick={() => {
          if (confirm("Reset all spaced repetition data?")) {
            sr.resetAll();
          }
        }}
        onExportClick={() => {
          const data = sr.exportData();
          const blob = new Blob([data], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `flashcard-progress-${new Date().toISOString().split("T")[0]}.json`;
          a.click();
        }}
      />

      {/* Main flashcard */}
      <div className="enhanced-flashcard-card">
        <div className="enhanced-card-header">
          <div className="enhanced-card-progress">
            {index + 1} / {data.length}
          </div>
          <div className="enhanced-card-difficulty">
            <ItemDifficultyBadge easeFactor={srData.easeFactor} />
          </div>
        </div>

        <div
          className={`enhanced-flashcard ${isFlipped ? "flipped" : ""}`}
          onClick={() => setIsFlipped(!isFlipped)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsFlipped(!isFlipped);
            }
          }}
        >
          <div className="enhanced-flashcard-front">
            <div className="enhanced-flashcard-text">{item.q}</div>
            <div className="enhanced-flashcard-hint">
              Click or press Space to reveal
            </div>
          </div>

          <div className="enhanced-flashcard-back">
            <div className="enhanced-flashcard-text">{item.a}</div>
          </div>
        </div>

        {/* Review info */}
        <ItemReviewInfo data={srData} />

        {/* Action buttons */}
        <div className="enhanced-card-actions">
          <button
            onClick={() => onToggleBookmark(item.id)}
            className={`enhanced-action-btn ${isBookmarked ? "active" : ""}`}
            title="Bookmark"
          >
            ★
          </button>
          <button
            onClick={() => onToggleLearned(item.id)}
            className={`enhanced-action-btn ${isLearned ? "active" : ""}`}
            title="Mark as learned"
          >
            ✓
          </button>
          {isFlipped && (
            <button
              onClick={() => setShowRatingButtons(!showRatingButtons)}
              className="enhanced-action-btn"
              title="Rate your recall quality"
            >
              📊
            </button>
          )}
        </div>

        {/* Quality rating buttons */}
        {isFlipped && showRatingButtons && (
          <ReviewQualityButtons onQualitySelect={handleRating} />
        )}

        {/* Navigation */}
        <div className="enhanced-card-navigation">
          <button
            onClick={() => {
              if (index > 0) {
                setIndex(index - 1);
                setIsFlipped(false);
                setShowRatingButtons(false);
              }
            }}
            disabled={index === 0}
            className="enhanced-nav-btn"
          >
            ← Previous
          </button>

          <button
            onClick={() => {
              if (index < data.length - 1) {
                setIndex(index + 1);
                setIsFlipped(false);
                setShowRatingButtons(false);
              }
            }}
            disabled={index === data.length - 1}
            className="enhanced-nav-btn"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Study tips */}
      <div className="enhanced-study-tips">
        <h4>Spaced Repetition Tips:</h4>
        <ul>
          <li>Rate each card honestly based on how well you remembered it</li>
          <li>Items marked "Hard" will appear more frequently for review</li>
          <li>Consistency is more important than speed</li>
          <li>Your statistics update automatically as you review</li>
          <li>Export your progress regularly for backup</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Example: Simpler integration - just add rating to existing QACard
 *
 * Usage in existing qa-card.tsx:
 *
 * import { useSpacedRepetition } from './use-spaced-repetition'
 *
 * export const QACard = memo(function QACard({
 *   item,
 *   onToggleLearned,
 *   ...props
 * }: QACardProps) {
 *   const sr = useSpacedRepetition([item])
 *   const srData = sr.getItemData(item.id)
 *
 *   const handleLearned = (isLearned: boolean) => {
 *     if (isLearned) {
 *       // Record a good review (quality 4)
 *       sr.recordReview(item.id, 4)
 *     } else {
 *       // Reset if unmarking
 *       sr.resetItems([item.id])
 *     }
 *     onToggleLearned(item.id)
 *   }
 *
 *   return (
 *     <div>
 *       ...existing card content...
 *       <ItemReviewInfo data={srData} />
 *     </div>
 *   )
 * })
 */

/**
 * Example: Dashboard showing learning insights
 */
export function LearningDashboard({ allData }: { allData: QAItem[] }) {
  const sr = useSpacedRepetition(allData);

  if (!sr.hydrated) return <div>Loading...</div>;

  const { stats, dueItems, newItems, masteredItems, reviewQueue } = sr;

  const progressPercent = Math.round(
    (stats.itemsMastered / stats.totalItemsTracked) * 100,
  );

  return (
    <div className="learning-dashboard">
      <h2>Your Learning Progress</h2>

      {/* Progress bar */}
      <div className="progress-section">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p>
          {stats.itemsMastered} of {stats.totalItemsTracked} items mastered (
          {progressPercent}%)
        </p>
      </div>

      {/* Quick stats */}
      <div className="quick-stats">
        <div className="stat-box stat-due">
          <div className="stat-number">{stats.itemsDueForReview}</div>
          <div className="stat-label">Due Today</div>
          <button className="stat-btn">Start Review</button>
        </div>

        <div className="stat-box stat-new">
          <div className="stat-number">{newItems.length}</div>
          <div className="stat-label">New Items</div>
        </div>

        <div className="stat-box stat-reviews">
          <div className="stat-number">{stats.totalReviewsCompleted}</div>
          <div className="stat-label">Total Reviews</div>
        </div>
      </div>

      {/* Recommended next items */}
      {reviewQueue.length > 0 && (
        <div className="recommended-section">
          <h3>Recommended to Review:</h3>
          <ul className="recommended-list">
            {reviewQueue.slice(0, 5).map((item) => (
              <li key={item.id} className="recommended-item">
                <span className="item-difficulty">
                  {sr.getDifficultyLevel(item.easeFactor)}
                </span>
                <span className="item-review-date">
                  {sr.formatNextReviewDate(item)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
