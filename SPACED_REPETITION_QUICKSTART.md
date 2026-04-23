# Spaced Repetition Quick Start Guide

## What You Get

A complete, production-ready spaced repetition system for flashcards using the proven **SM-2 algorithm**. Perfect for interview prep, language learning, or any flashcard-based study.

## Files Created

| File | Purpose |
|------|---------|
| `spaced-repetition.ts` | Core SM-2 algorithm & utilities |
| `use-spaced-repetition.ts` | React hook for integration |
| `spaced-repetition-ui.tsx` | Pre-built UI components |
| `spaced-repetition.css` | Styling for all components |
| `spaced-repetition-example.tsx` | Complete implementation examples |
| `spaced-repetition-example.css` | Styles for example components |
| `docs/SPACED_REPETITION.md` | Full documentation |

## 30-Second Integration

### 1. Import the hook
```typescript
import { useSpacedRepetition } from './interview/use-spaced-repetition'
```

### 2. Use in your component
```typescript
const sr = useSpacedRepetition(allQuestions)

// Record a review
sr.recordReview(questionId, 5) // Quality: 0-5

// Check statistics
console.log(sr.stats.itemsDueForReview)
```

### 3. Show UI components
```typescript
import { ReviewQualityButtons, ItemReviewInfo } from './interview/spaced-repetition-ui'

<ItemReviewInfo data={sr.getItemData(questionId)} />
<ReviewQualityButtons onQualitySelect={(quality) => sr.recordReview(questionId, quality)} />
```

### 4. Import styles
```typescript
import './interview/spaced-repetition.css'
```

## How It Works

Users rate each answer on quality **0-5**:
- **5**: Perfect recall, immediate
- **4**: Correct, slight hesitation  
- **3**: Correct, significant effort
- **0-2**: Incorrect or partial

The algorithm automatically:
- ✅ Increases review intervals for items you know
- ❌ Decreases intervals for items you struggle with
- 📊 Calculates an "ease factor" for each item
- 🎯 Prioritizes items due for review

## Key Functions

```typescript
// Recording reviews
sr.recordReview(itemId, quality)  // Quality: 0-5

// Getting data
sr.getItemData(itemId)            // Single item SR data
sr.getAllData()                   // All SR data as array

// Statistics
sr.stats.itemsDueForReview        // Count of items to review
sr.stats.itemsMastered           // Count of mastered items
sr.stats.totalReviewsCompleted   // Total reviews done

// Lists
sr.reviewQueue                    // Sorted items to review
sr.dueItems                       // Items overdue
sr.newItems                       // Never reviewed
sr.masteredItems                  // Ease factor >= 250

// Utilities
sr.isDueForReview(itemData)       // Boolean
sr.getDaysUntilReview(itemData)   // Number
sr.getDifficultyLevel(easeFactor) // 'easy'|'normal'|'hard'|'very-hard'
sr.formatNextReviewDate(itemData)  // Human readable string

// Data management
sr.exportData()                   // JSON for backup
sr.importData(jsonString)         // Restore from backup
sr.resetAll()                     // Clear all progress
sr.resetItems([ids])              // Reset specific items
```

## UI Components

### SpacedRepetitionStats
Shows overall learning statistics and controls:
```typescript
<SpacedRepetitionStats 
  stats={sr.stats}
  onResetClick={() => sr.resetAll()}
  onExportClick={() => alert(sr.exportData())}
/>
```

### ItemReviewInfo
Shows review details for an item:
```typescript
<ItemReviewInfo data={sr.getItemData(questionId)} />
// Displays: "Next review: In 3 days, Reviews: 5, Interval: 7 days"
```

### ReviewQualityButtons
5 buttons for rating recall quality:
```typescript
<ReviewQualityButtons 
  onQualitySelect={(quality) => sr.recordReview(itemId, quality)}
/>
```

### ItemDifficultyBadge
Visual indicator of item difficulty:
```typescript
<ItemDifficultyBadge easeFactor={sr.getItemData(id).easeFactor} />
// Shows: "Easy", "Normal", "Hard", or "Very Hard"
```

## Example: Basic Integration

```typescript
'use client'

import { useState } from 'react'
import { useSpacedRepetition } from './use-spaced-repetition'
import { 
  SpacedRepetitionStats, 
  ItemReviewInfo, 
  ReviewQualityButtons 
} from './spaced-repetition-ui'

export function InterviewFlashcards({ questions }) {
  const sr = useSpacedRepetition(questions)
  const [index, setIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  if (!sr.hydrated) return <div>Loading...</div>

  const question = questions[index]
  const srData = sr.getItemData(question.id)

  const handleRate = (quality) => {
    sr.recordReview(question.id, quality)
    // Move to next question
    if (index < questions.length - 1) {
      setIndex(index + 1)
      setIsFlipped(false)
    }
  }

  return (
    <div>
      <SpacedRepetitionStats stats={sr.stats} />
      
      <div onClick={() => setIsFlipped(!isFlipped)}>
        <h3>{isFlipped ? question.answer : question.question}</h3>
      </div>

      <ItemReviewInfo data={srData} />

      {isFlipped && (
        <ReviewQualityButtons onQualitySelect={handleRate} />
      )}

      <button onClick={() => setIndex(index + 1)}>Next</button>
    </div>
  )
}
```

## Data Storage

Everything is automatically saved to browser localStorage under key `iv_spaced_repetition`.

No server required—data persists across page refreshes!

## Export & Backup

```typescript
// Export as JSON
const jsonData = sr.exportData()

// Save to file
const blob = new Blob([jsonData], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'backup.json'
a.click()

// Later: Import from file
const imported = await file.text()
sr.importData(imported)
```

## Understanding the Algorithm

The **SM-2 algorithm** was created by SuperMemo and is proven by research:

1. **First review**: Next review in 1 day
2. **Second review**: Next review in 3 days
3. **Third+ review**: Next review in `interval × easeFactor` days

**Ease factor** starts at 2.5 and adjusts based on performance:
- Get it right? Ease factor increases → longer intervals
- Get it wrong? Ease factor decreases → shorter intervals

This ensures you spend time on what you don't know.

## Statistics Explained

```typescript
sr.stats = {
  totalItemsTracked: 150,       // Total items with SR data
  itemsDueForReview: 12,        // Need review today/soon
  itemsMastered: 45,            // Successfully mastered
  newItems: 30,                 // Never reviewed
  averageEaseFactor: 2.35,      // Mean difficulty (2.5 = normal)
  currentStreak: 8,             // Consecutive correct reviews
  totalReviewsCompleted: 342,   // Total reviews done
  daysSinceLastReview: 2        // Days since last review
}
```

## Common Patterns

### Show only items due for review
```typescript
const overduItems = sr.dueItems
const nextReview = sr.reviewQueue[0]
```

### Get weakest items (hardest to remember)
```typescript
const weakest = sr.getAllData()
  .sort((a, b) => a.easeFactor - b.easeFactor)
  .slice(0, 10)
```

### Show learning progress
```typescript
const percent = (sr.stats.itemsMastered / sr.stats.totalItemsTracked) * 100
```

### Implement study streak
```typescript
const lastReviewDate = sr.stats.daysSinceLastReview
const isStreak = lastReviewDate <= 1 // Reviewed in last 24 hours
```

## Performance Notes

- ⚡ Algorithm is O(1) for updates
- 💾 LocalStorage handles 1000+ items easily
- 🚀 Components are memoized for performance
- 📱 Works on mobile with touch support

## Troubleshooting

**Data not saving?**
- Check localStorage is enabled
- Check browser privacy settings

**Wrong review dates?**
- Verify system clock is correct
- Spaced repetition is timestamp-based

**Want to reset everything?**
```typescript
sr.resetAll()
localStorage.removeItem('iv_spaced_repetition')
```

## Next Steps

1. ✅ Copy the files to your project
2. ✅ Import the CSS files
3. ✅ Use the hook in your flashcard component
4. ✅ Add UI components
5. ✅ Test recording reviews
6. ✅ Verify stats update
7. ✅ Add export/backup feature
8. ✅ Share with users!

## Advanced Features (Optional)

Want to extend the system? Consider:

- Server sync (cloud backup)
- Learning curve graphs
- Custom algorithm parameters
- Category-specific statistics
- Session timers
- Study goals/streaks
- Pomodoro integration
- Mobile app sync

## Support

For detailed information, see `docs/SPACED_REPETITION.md`

Key sections:
- **How It Works**: Deep dive into SM-2 algorithm
- **Files Included**: What each file does
- **Integration Guide**: Step-by-step examples
- **API Reference**: Complete function documentation
- **Best Practices**: Tips for developers and users
- **Troubleshooting**: Common issues and solutions

## License

Same as the main project

---

**Happy learning!** 🚀📚

The spaced repetition system will significantly improve learning retention and make your interview prep more effective.
