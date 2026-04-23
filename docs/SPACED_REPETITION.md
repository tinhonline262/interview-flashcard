# Spaced Repetition System Documentation

## Overview

This flashcard application includes a comprehensive spaced repetition system based on the **SM-2 (SuperMemo-2) algorithm**, a scientifically-proven method for optimizing long-term memory retention.

## How It Works

### The SM-2 Algorithm

SM-2 is a proven algorithm used by popular flashcard apps like Anki. It works by:

1. **Quality Rating**: User rates their recall quality (0-5) after each review
2. **Ease Factor**: The algorithm calculates difficulty dynamically based on performance
3. **Intervals**: Review intervals increase exponentially for items you know well
4. **Lapse Management**: Items you get wrong reset to shorter intervals

#### Key Metrics

- **Ease Factor (EF)**: Represents how difficult an item is to remember (ranges from 1.3 to ∞)
  - Higher EF = easier to remember = longer review intervals
  - Lower EF = harder to remember = shorter review intervals
  - Default: 2.5

- **Interval**: Days until the next review
  - 1st review: 1 day
  - 2nd review: 3 days
  - 3rd+ review: interval × ease factor

- **Repetitions**: Number of consecutive correct responses

- **Lapses**: Number of incorrect responses after mastery

### Quality Rating Scale (0-5)

Users rate their recall after seeing the answer:

| Rating | Meaning | Effect |
|--------|---------|--------|
| 0 | Complete blank, no recollection | Reset progression, decrease ease factor |
| 1 | Incorrect response, familiar concept | Reset progression, decrease ease factor |
| 2 | Incorrect response, remembered something | Reset progression, decrease ease factor |
| 3 | Correct response after significant effort | Continue progression, maintain ease factor |
| 4 | Correct response, slight hesitation | Continue progression, slightly increase ease factor |
| 5 | Perfect response, immediate recall | Continue progression, increase ease factor |

> **Tip**: Ratings 0-2 are treated as "failed" attempts, while 3-5 are "passed"

## Files Included

### Core Algorithm (`spaced-repetition.ts`)

Implements the SM-2 algorithm and utilities:

```typescript
// Key functions:
- initializeSpacedRepetition(id)     // Create new SR data for item
- updateSpacedRepetition(data, quality) // Record review and update
- isDueForReview(data)               // Check if item needs review
- getDaysUntilReview(data)           // Days until next review
- calculateStatistics(allData)       // Get overall stats
- getReviewQueue(allData, limit)     // Get prioritized review items
```

### React Hook (`use-spaced-repetition.ts`)

Integrates SR with React and localStorage:

```typescript
const sr = useSpacedRepetition(allData)

// Record a review
sr.recordReview(itemId, 5) // Quality 0-5

// Query data
sr.getItemData(itemId)     // Get SR data for one item
sr.getAllData()            // Get SR data for all items

// Access statistics
sr.stats                   // SpacedRepetitionStats
sr.reviewQueue            // Items to review today, sorted
sr.dueItems               // All items due for review
sr.newItems               // Never-reviewed items
sr.masteredItems          // Items with high ease factor

// Utilities
sr.getDaysUntilReview(data)
sr.getDifficultyLevel(easeFactor)
sr.formatNextReviewDate(data)

// Data management
sr.exportData()            // Export as JSON for backup
sr.importData(jsonString)  // Import from backup
sr.resetAll()              // Reset all progress
sr.resetItems([ids])       // Reset specific items
```

### UI Components (`spaced-repetition-ui.tsx`)

Pre-built components for displaying SR data:

1. **SpacedRepetitionStats**: Displays overall learning statistics
2. **ItemDifficultyBadge**: Visual indicator of item difficulty
3. **ItemReviewInfo**: Shows next review date and stats for an item
4. **ReviewQualityButtons**: 5-button interface for rating recall quality

### Styles (`spaced-repetition.css`)

Complete styling for all SR components with dark mode support.

## Integration Guide

### Basic Integration

1. **Import the hook**:
```typescript
import { useSpacedRepetition } from './use-spaced-repetition'
```

2. **Use it in your component**:
```typescript
export function MyComponent({ data }: Props) {
  const sr = useSpacedRepetition(data)
  
  // Use sr.recordReview, sr.stats, etc.
}
```

3. **Record reviews**:
```typescript
const handleReviewQuality = (quality: QualityRating) => {
  sr.recordReview(itemId, quality)
  // Move to next item
}
```

4. **Display statistics**:
```typescript
import { SpacedRepetitionStats } from './spaced-repetition-ui'

<SpacedRepetitionStats
  stats={sr.stats}
  onResetClick={() => sr.resetAll()}
  onExportClick={() => alert(sr.exportData())}
/>
```

5. **Get items to review**:
```typescript
// Get top 10 items for today
const todayItems = sr.reviewQueue.slice(0, 10)

// Get all overdue items
const overdueItems = sr.dueItems
```

### Advanced: Filtering by Status

```typescript
// New items (never reviewed)
const newItems = sr.newItems

// Mastered items (ease factor >= 250)
const masteredItems = sr.masteredItems

// Items due soon (within 1 day)
const dueSoon = sr.getAllData().filter(item => {
  const days = sr.getDaysUntilReview(item)
  return days <= 1 && days > -1
})
```

### Advanced: Custom Review Queue

```typescript
// Get items sorted by difficulty
const byDifficulty = sr.getAllData()
  .filter(item => sr.isDueForReview(item))
  .sort((a, b) => a.easeFactor - b.easeFactor)

// Get weakest items (lowest ease factor)
const weakest = sr.getAllData()
  .sort((a, b) => a.easeFactor - b.easeFactor)
  .slice(0, 10)
```

## Data Persistence

All spaced repetition data is automatically saved to localStorage under the key `iv_spaced_repetition`.

### Export/Backup

```typescript
// Export all data
const jsonData = sr.exportData()

// Save to file (client-side)
const blob = new Blob([jsonData], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'flashcard-progress.json'
a.click()
```

### Import/Restore

```typescript
// Import from file
const file = await getFileFromUser()
const jsonString = await file.text()
sr.importData(jsonString)
```

## Statistics Available

The `stats` object contains:

```typescript
interface SpacedRepetitionStats {
  totalItemsTracked: number       // Total items with SR data
  itemsDueForReview: number       // Items overdue or due today
  itemsMastered: number           // Items with ease >= 250
  newItems: number                // Never reviewed
  averageEaseFactor: number       // Mean difficulty across items
  currentStreak: number           // Consecutive successful reviews
  totalReviewsCompleted: number   // Total review events
  daysSinceLastReview: number | null  // Days since any review
}
```

## Understanding Difficulty Levels

Based on ease factor (EF):

| EF Range | Level | Next Interval Multiplier |
|----------|-------|--------------------------|
| ≥ 2.8 | Easy | Fast growth (2.8x+) |
| 2.2-2.79 | Normal | Moderate growth (2.2-2.79x) |
| 1.6-2.19 | Hard | Slow growth (1.6-2.19x) |
| < 1.6 | Very Hard | Minimal growth (1.3-1.59x) |

## Best Practices

### For Users

1. **Be honest with ratings**: Accuracy of self-assessment is crucial
2. **Consistency matters**: Review daily or regularly for best results
3. **Quality over quantity**: Understanding matters more than speed
4. **Don't ignore overdue items**: They're overdue for a reason

### For Developers

1. **Always hydrate**: Wait for `sr.hydrated` before rendering
2. **Batch updates**: Use `sr.recordReview()` which batches saves
3. **Show stats**: Help users understand their progress
4. **Offer reset**: Let users reset if they want fresh starts
5. **Support export**: Always provide backup/restore capability

## Example: Complete Review Component

```typescript
import { useState } from 'react'
import { useSpacedRepetition } from './use-spaced-repetition'
import { ReviewQualityButtons, ItemReviewInfo } from './spaced-repetition-ui'

export function ReviewCard({ item, allData }) {
  const sr = useSpacedRepetition(allData)
  const [isFlipped, setIsFlipped] = useState(false)
  
  const itemData = sr.getItemData(item.id)
  const isDue = sr.isDueForReview(itemData)
  
  const handleRate = (quality) => {
    sr.recordReview(item.id, quality)
    // Show next item
  }
  
  return (
    <div>
      <div onClick={() => setIsFlipped(!isFlipped)}>
        <div>{isFlipped ? item.answer : item.question}</div>
      </div>
      
      <ItemReviewInfo data={itemData} />
      
      {isFlipped && (
        <ReviewQualityButtons onQualitySelect={handleRate} />
      )}
    </div>
  )
}
```

## Algorithm Details

### SM-2 Formula

When quality ≥ 3:
```
EF' = EF + (0.1 - (5 - q) × (0.08 + (5 - q) × 0.02))
```

When quality < 3:
```
EF' = max(1.3, EF - 0.2)
interval = 1
repetitions = 0
```

### Interval Calculation

- After 1st successful rep: 1 day
- After 2nd successful rep: 3 days
- After 3rd+ successful rep: `interval × EF` days

## Troubleshooting

### Data Not Persisting

Check browser localStorage is enabled:
```javascript
localStorage.setItem('test', '1')
const val = localStorage.getItem('test')
```

### Wrong Next Review Dates

Ensure device time is correct. SR data is timestamp-based.

### Need to Clear Everything

```typescript
sr.resetAll()  // Resets all progress
localStorage.removeItem('iv_spaced_repetition')  // Clear storage
```

## Performance Considerations

- Algorithm is very lightweight (O(1) for updates)
- LocalStorage can handle 1000+ items easily
- Review queue sorting is O(n log n)
- Components are memoized for performance

## Future Enhancements

Potential improvements:

1. Server-side sync (cloud backup)
2. Anki deck import/export
3. Advanced statistics (learning curve graphs)
4. Customizable algorithm parameters
5. Multiple decks/categories
6. Study session planning
7. Forgetting curve visualization

## References

- [SM-2 Algorithm - SuperMemo](https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-learning-process)
- [Anki Manual - Spaced Repetition](https://docs.ankiweb.net/)
- [Ebbinghaus Forgetting Curve](https://en.wikipedia.org/wiki/Forgetting_curve)

## License

Same as the main project
