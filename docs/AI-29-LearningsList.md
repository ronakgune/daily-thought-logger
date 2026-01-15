# AI-29: LearningsList Component

## Overview

The LearningsList component is a React component for displaying and managing learnings extracted from daily logs in the Daily Thought Logger application. It provides a comprehensive UI for viewing, filtering, and navigating to the source logs of each learning.

## Features

### Core Features
- **Display All Learnings**: Shows all learnings from the database in a clean, organized list
- **Category/Topic Badges**: Visual indicators for each learning's category with consistent color coding
- **Confidence Score Indicator**: Ready for integration with confidence scores from AI analysis (schema supports it)
- **Source Log Traceability**: Click to view the source log where the learning was captured
- **Filter by Category**: Dropdown filter to show learnings from specific categories
- **Search Functionality**: Search learnings by text content or category name
- **Loading States**: Spinner animation during data fetch
- **Error States**: User-friendly error messages with retry options
- **Empty States**: Helpful messaging when no learnings exist

### Accessibility
- Full keyboard navigation support
- ARIA labels and roles for screen readers
- Focus indicators on interactive elements
- Semantic HTML structure

### Performance
- Efficient filtering using React useMemo
- Handles large datasets (tested with 100+ items)
- Smooth animations and transitions

## Usage

### Basic Usage

```tsx
import { LearningsList } from '@components';
import type { LearningWithLog } from '@components';

function MyComponent() {
  const learnings: LearningWithLog[] = [
    {
      id: 1,
      logId: 10,
      text: 'React hooks allow functional components to manage state',
      category: 'Programming',
      createdAt: '2024-01-15T10:00:00Z',
      logDate: '2024-01-15',
    },
  ];

  const handleViewLog = (logId: number) => {
    // Navigate to log detail
    console.log(`Viewing log ${logId}`);
  };

  return (
    <LearningsList
      learnings={learnings}
      onViewLog={handleViewLog}
      showFilter={true}
    />
  );
}
```

### With Database Integration

```tsx
import { LearningsList } from '@components';
import type { LearningWithLog } from '@components';
import { useEffect, useState } from 'react';

function LearningsPage() {
  const [learnings, setLearnings] = useState<LearningWithLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    loadLearnings();
  }, []);

  const loadLearnings = async () => {
    try {
      setIsLoading(true);
      // Call your database service via IPC
      const result = await window.electron.ipcRenderer.invoke(
        'database:getAllLearnings'
      );
      setLearnings(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LearningsList
      learnings={learnings}
      onViewLog={(logId) => window.location.href = `/logs/${logId}`}
      isLoading={isLoading}
      error={error}
    />
  );
}
```

## Component API

### Props

#### `learnings: LearningWithLog[]` (required)
Array of learning objects to display. Each learning must have:
- `id: number` - Unique identifier for the learning
- `logId: number` - ID of the source log
- `text: string` - The learning text content
- `category: string | null` - Optional category/topic
- `createdAt: string` - ISO 8601 date string
- `logDate?: string` - Optional log date for display
- `logSummary?: string` - Optional log summary preview

#### `onViewLog?: (logId: number) => void`
Callback function called when user clicks "View source log" button.
If not provided, the view log buttons won't be rendered.

#### `isLoading?: boolean`
When `true`, displays a loading spinner instead of the list.
Default: `false`

#### `error?: string`
Error message to display. When provided, shows an error state with the message.

#### `showFilter?: boolean`
Controls visibility of the filter controls (search and category dropdown).
Default: `true`

## Data Flow

### Database Schema
The learnings table has the following structure:

```sql
CREATE TABLE learnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  category TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (log_id) REFERENCES logs(id) ON DELETE CASCADE
);
```

Note: The legacy schema (`database/schema.sql`) also includes a `topic` field (similar to `category`) and a `confidence` field (0.0-1.0) which can be displayed in future enhancements.

### Fetching Learnings

To fetch learnings from the database with log information:

1. Add an IPC handler in the main process:

```typescript
// src/main/ipc-handlers.ts
ipcMain.handle('database:getAllLearningsWithLogs', async () => {
  const db = getDatabaseService();
  const learnings = db.getAllLearnings();

  // Optionally enrich with log data
  const learningsWithLogs = learnings.map(learning => {
    const log = db.getLogById(learning.logId);
    return {
      ...learning,
      logDate: log?.date,
      logSummary: log?.summary,
    };
  });

  return learningsWithLogs;
});
```

2. Call from renderer process:

```typescript
const learnings = await window.electron.ipcRenderer.invoke(
  'database:getAllLearningsWithLogs'
);
```

## Styling

The component uses Tailwind CSS for styling with a clean, modern design:

- **Category Badges**: Automatically color-coded based on category name hash
- **Hover Effects**: Cards lift and change border color on hover
- **Transitions**: Smooth 200ms transitions for all interactive elements
- **Responsive**: Adapts to container width

### Color Palette

Category badges use the following colors (rotated based on hash):
- Blue (Programming, Tech)
- Green (Health, Growth)
- Purple (Learning, Education)
- Yellow (Ideas, Creativity)
- Pink (Personal)
- Indigo (Business)
- Red (Important, Critical)
- Orange (Goals, Productivity)

## Filtering

### Category Filter
- Dropdown shows all unique categories with counts
- Selecting a category filters the list
- "All categories" option resets the filter

### Search Filter
- Case-insensitive text search
- Searches both learning text and category name
- Updates results in real-time as you type

### Combined Filters
- Search and category filters work together
- Active filter count displayed
- "Clear filters" button to reset all

## Accessibility Features

### ARIA Attributes
- `role="list"` on the learnings container
- `role="status"` for loading and error states
- `aria-label` for all interactive elements
- `aria-live` for dynamic content updates

### Keyboard Navigation
- Tab through all interactive elements
- Focus indicators on buttons and inputs
- Enter key to activate buttons

### Screen Readers
- Descriptive labels for all controls
- Status updates announced
- Error messages marked as assertive

## Testing

The component has comprehensive test coverage (45 tests):

### Test Categories
- Loading State (2 tests)
- Error State (2 tests)
- Empty State (2 tests)
- Learnings Display (6 tests)
- View Log Functionality (4 tests)
- Category Filtering (6 tests)
- Search Functionality (5 tests)
- Clear Filters (3 tests)
- No Results State (2 tests)
- Accessibility (5 tests)
- Visual Styling (3 tests)
- Edge Cases (4 tests)
- Performance (2 tests)

### Running Tests

```bash
npm test -- LearningsList.test.tsx
```

## Future Enhancements

### Planned Features
1. **Confidence Score Display**: Show AI confidence level for each learning
2. **Sorting Options**: Sort by date, category, or confidence
3. **Bulk Operations**: Select multiple learnings for export or categorization
4. **Inline Editing**: Edit learning text or category without navigation
5. **Export Functionality**: Export learnings to CSV, Markdown, or JSON
6. **Category Management**: Add, rename, or merge categories
7. **Related Learnings**: Show similar or related learnings
8. **Learning Timeline**: Visualize learnings over time

### Integration Points
- **Dashboard**: Display recent or important learnings
- **Log Detail View**: Show learnings extracted from specific log
- **Weekly Summary**: Include top learnings in summary generation
- **Search**: Global search across all learnings

## File Structure

```
src/renderer/components/
├── LearningsList.tsx              # Main component
├── LearningsList.example.tsx      # Usage examples
└── index.ts                       # Export declarations

tests/
└── LearningsList.test.tsx         # Component tests

docs/
└── AI-29-LearningsList.md         # This documentation
```

## Acceptance Criteria

- [x] All learnings displayed from database
- [x] Topic/category visually indicated with color-coded badges
- [x] Traceability link to source log with "View source log" button
- [x] Filter by topic/category works with dropdown
- [x] Comprehensive test coverage (45 passing tests)
- [x] Accessibility features implemented
- [x] Loading, error, and empty states
- [x] Search functionality
- [x] Responsive design

## Related Tasks

- **AI-10**: DatabaseService with CRUD operations (provides data source)
- **AI-18**: Pending analysis queue (learnings can be pending)
- **AI-23**: Analysis pipeline (extracts learnings from logs)
- **AI-24**: Recording status component (similar UI patterns)

## Support

For questions or issues with the LearningsList component:
1. Check this documentation
2. Review the example files
3. Run the test suite for expected behavior
4. Check the component source code for inline comments
