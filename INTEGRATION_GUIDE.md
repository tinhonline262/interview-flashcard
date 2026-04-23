# Integration Checklist & Next Steps

## Files Added (8 total)

### Core Implementation (3 files)
- ✅ `app/interview/spaced-repetition.ts` - SM-2 algorithm core
- ✅ `app/interview/use-spaced-repetition.ts` - React hook
- ✅ `app/interview/spaced-repetition-ui.tsx` - UI components

### Styling (2 files)
- ✅ `app/interview/spaced-repetition.css` - Component styles
- ✅ `app/interview/spaced-repetition-example.css` - Example styles

### Examples & Tests (2 files)
- ✅ `app/interview/spaced-repetition-example.tsx` - Complete examples
- ✅ `app/interview/spaced-repetition.test.ts` - Test suite

### Documentation (3 files)
- ✅ `SPACED_REPETITION_QUICKSTART.md` - Quick reference
- ✅ `docs/SPACED_REPETITION.md` - Full documentation
- ✅ `IMPLEMENTATION_SUMMARY.md` - What was added

## Quick Integration Options

### Option 1: Minimal (5 minutes)
Just track reviews without UI:

```typescript
import { useSpacedRepetition } from './interview/use-spaced-repetition'

function MyFlashcard({ item }) {
  const sr = useSpacedRepetition([item])
  
  const handleReview = (quality) => {
    sr.recordReview(item.id, quality)
  }
  
  return (
    <div>
      {/* Your existing card */}
      <button onClick={() => handleReview(5)}>Good</button>
      <button onClick={() => handleReview(2)}>Bad</button>
    </div>
  )
}
```

### Option 2: With Statistics (15 minutes)
Add stats display:

```typescript
import { useSpacedRepetition } from './interview/use-spaced-repetition'
import { SpacedRepetitionStats } from './interview/spaced-repetition-ui'
import './interview/spaced-repetition.css'

function MyFlashcards({ items }) {
  const sr = useSpacedRepetition(items)
  
  if (!sr.hydrated) return <div>Loading...</div>
  
  return (
    <div>
      <SpacedRepetitionStats stats={sr.stats} />
      {/* Your flashcards */}
    </div>
  )
}
```

### Option 3: Full Integration (30 minutes)
Use complete example:

```typescript
// Copy EnhancedFlashcardView from spaced-repetition-example.tsx
// Import its CSS
// Use it in your page
import { EnhancedFlashcardView } from './interview/spaced-repetition-example'
import './interview/spaced-repetition-example.css'

export default function InterviewPage() {
  return (
    <EnhancedFlashcardView 
      data={allQuestions}
      bookmarks={bookmarks}
      learned={learned}
      // ... other props
    />
  )
}
```

## Step-by-Step Integration Guide

### Step 1: Choose Your Integration Level
- **Minimal**: Just tracking (no UI changes needed)
- **Medium**: Add stats display
- **Full**: Complete redesign with spaced repetition UI

### Step 2: Import Required Files
Depending on your choice:

```typescript
// Always needed
import { useSpacedRepetition } from './interview/use-spaced-repetition'

// For UI (Option 2+)
import { SpacedRepetitionStats, ReviewQualityButtons } from './interview/spaced-repetition-ui'
import './interview/spaced-repetition.css'
```

### Step 3: Add the Hook to Your Component
```typescript
function YourComponent({ allItems }) {
  const sr = useSpacedRepetition(allItems)
  
  // Wait for hydration
  if (!sr.hydrated) return <div>Loading...</div>
  
  // Now you can use sr.recordReview(), sr.stats, etc.
}
```

### Step 4: Record Reviews
When user confirms a review:
```typescript
const handleMarkAsLearned = (quality) => {
  sr.recordReview(itemId, quality)
}
```

### Step 5: Display Statistics (Optional)
```typescript
<SpacedRepetitionStats 
  stats={sr.stats}
  onResetClick={() => sr.resetAll()}
/>
```

## Testing the Integration

### Quick Test
1. Open your flashcard page
2. Review a few questions
3. Open browser DevTools (F12)
4. Run: `localStorage.getItem('iv_spaced_repetition')`
5. You should see JSON data with your reviews

### Verify Data Structure
```javascript
// In browser console:
const data = JSON.parse(localStorage.getItem('iv_spaced_repetition'))
console.log(data[0])
// Should see: { id, reviewHistory, nextReviewDate, easeFactor, ... }
```

## Common Integration Patterns

### Pattern 1: Auto-mark as learned
```typescript
const handleRate = (quality) => {
  sr.recordReview(itemId, quality)
  
  // Auto-mark good recalls as learned
  if (quality >= 4) {
    onToggleLearned(itemId)
  }
}
```

### Pattern 2: Show review schedule
```typescript
const srData = sr.getItemData(itemId)

<div>
  <ItemReviewInfo data={srData} />
  {/* Shows: "Next review: In 3 days, Reviews: 5" */}
</div>
```

### Pattern 3: Filter items by status
```typescript
// Only show new items
const newItems = sr.newItems.map(srData => 
  allItems.find(item => item.id === srData.id)
)

// Only show due items
const dueItems = sr.dueItems.map(srData =>
  allItems.find(item => item.id === srData.id)
)
```

### Pattern 4: Learning dashboard
```typescript
<div>
  <h2>Progress: {sr.stats.itemsMastered}/{sr.stats.totalItemsTracked}</h2>
  <p>Due today: {sr.stats.itemsDueForReview}</p>
  <p>Avg difficulty: {sr.stats.averageEaseFactor}</p>
</div>
```

## Customization Options

### Change Colors
Edit `spaced-repetition.css` or `spaced-repetition-example.css`:
```css
.sr-quality-5 {
  --quality-color: #22c55e; /* Change green to your color */
}
```

### Add More Languages
Edit `spaced-repetition-ui.tsx`:
```typescript
const translations = {
  en: { /* ... */ },
  vi: { /* ... */ },
  es: { /* ... */ },  // Add Spanish
  fr: { /* ... */ },  // Add French
}
```

### Custom Review Queue
```typescript
// Get items sorted by difficulty (hardest first)
const hardestFirst = sr.getAllData()
  .sort((a, b) => a.easeFactor - b.easeFactor)
  .filter(item => sr.isDueForReview(item))
```

## What Each File Does

| File | Purpose | When Needed |
|------|---------|-------------|
| `spaced-repetition.ts` | Algorithm | Always (imported by hook) |
| `use-spaced-repetition.ts` | React hook | Always (main integration point) |
| `spaced-repetition-ui.tsx` | UI components | If using stats/UI |
| `spaced-repetition.css` | Component styles | If using UI components |
| `spaced-repetition-example.tsx` | Full example | Reference/copy |
| `spaced-repetition-example.css` | Example styles | Reference/copy |
| `spaced-repetition.test.ts` | Tests | If running tests |
| Docs files | Documentation | Reference |

## Troubleshooting Integration

### Hook not updating state?
```typescript
// Make sure to wait for hydration
if (!sr.hydrated) return <Loading />

// Then use sr.stats, sr.recordReview, etc.
```

### Data not persisting?
```javascript
// Check localStorage is enabled
localStorage.setItem('test', '1')
const works = localStorage.getItem('test') === '1'
```

### Wrong review dates?
- Ensure system clock is correct (SR is timestamp-based)
- Check browser time zone settings

### Need to reset?
```typescript
// Reset all progress
sr.resetAll()

// Reset specific items
sr.resetItems([itemId1, itemId2])

// Clear all storage
localStorage.removeItem('iv_spaced_repetition')
```

## Performance Tips

1. **Memoize heavy components**
   ```typescript
   export const MyCard = memo(function MyCard(props) {
     // ...
   })
   ```

2. **Use reviewQueue instead of filtering**
   ```typescript
   // ❌ Bad - filters every render
   const due = getAllData().filter(isDueForReview)
   
   // ✅ Good - pre-sorted
   const due = sr.reviewQueue
   ```

3. **Batch updates**
   ```typescript
   // ❌ Bad - multiple saves
   sr.recordReview(id1, 5)
   sr.recordReview(id2, 5)
   
   // Okay - each saves to localStorage
   // Consider: save only once after session
   ```

## Next Steps After Integration

1. ✅ Test with real users
2. ✅ Collect feedback on difficulty
3. ✅ Add export/import UI
4. ✅ Create learning goals
5. ✅ Add progress graphs
6. ✅ Notify users about due items
7. ✅ Implement study streaks
8. ✅ Create leaderboards (optional)

## Support Resources

- **Quick Start**: `SPACED_REPETITION_QUICKSTART.md`
- **Full Docs**: `docs/SPACED_REPETITION.md`
- **Examples**: `spaced-repetition-example.tsx`
- **Tests**: `spaced-repetition.test.ts`

## Questions?

Refer to the documentation files for detailed information on:
- Algorithm details
- Data structures
- API reference
- Best practices
- Troubleshooting

---

**You're all set!** 🎉

The spaced repetition system is ready to use. Start with Option 1 (minimal) and gradually add features as needed.
