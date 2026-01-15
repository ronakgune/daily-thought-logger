# AI-28: IdeasList Component Implementation

## Overview

The IdeasList component provides a complete interface for viewing and managing ideas extracted from voice logs. It includes status management, filtering, category badges, and traceability to source logs.

## Features

### 1. Display All Ideas
- Shows all ideas from the database
- Displays idea text, creation date, and metadata
- Responsive card-based layout with hover effects

### 2. Status Management
- Dropdown for each idea to change status
- Four status options:
  - **New** (raw in database)
  - **Exploring** (developing in database)
  - **Parked** (archived in database)
  - **Done** (actionable in database)
- Visual color-coding for each status
- Disabled dropdowns when read-only mode

### 3. Category Badge
- Displays primary category/tag from idea
- Shows additional tag count if multiple tags exist
- Hover tooltip for full tag list

### 4. Confidence Score Indicator
- Visual indicator for AI confidence (when available)
- Color-coded: green (70%+), yellow (40-70%), red (<40%)
- Percentage display

### 5. Source Log Traceability
- "View source log" link for each idea
- Callback to parent component for navigation
- ARIA-labeled for accessibility

### 6. Filter by Status
- Filter buttons for All, New, Exploring, Parked, Done
- Active filter highlighted
- Dynamic count updates
- Empty state message for no matches

### 7. Loading & Error States
- Loading spinner with message
- Error display with retry button
- Empty state for no ideas

## Component API

### Props

```typescript
interface IdeasListProps {
  /** Array of ideas to display */
  ideas: Idea[];

  /** Callback when idea status is changed */
  onStatusChange?: (ideaId: number, newStatus: IdeaStatus) => void;

  /** Callback when user clicks to view source log */
  onViewLog?: (logId: number) => void;

  /** Whether the component is in loading state */
  loading?: boolean;

  /** Error message to display */
  error?: string;

  /** Callback to retry loading ideas */
  onRetry?: () => void;
}
```

## Usage Examples

### Basic Usage

```tsx
import { IdeasList } from './components/IdeasList';

function MyDashboard() {
  const [ideas, setIdeas] = useState([]);

  useEffect(() => {
    // Load ideas from IPC
    const loadIdeas = async () => {
      const allIdeas = await ipcClient.getAllIdeas();
      setIdeas(allIdeas);
    };
    loadIdeas();
  }, []);

  return <IdeasList ideas={ideas} />;
}
```

### With Status Management

```tsx
function IdeasManager() {
  const [ideas, setIdeas] = useState([]);

  const handleStatusChange = async (ideaId, newStatus) => {
    // Update in database
    await ipcClient.updateIdeaStatus(ideaId, newStatus);

    // Update local state
    setIdeas(prev =>
      prev.map(idea =>
        idea.id === ideaId ? { ...idea, status: newStatus } : idea
      )
    );
  };

  return (
    <IdeasList
      ideas={ideas}
      onStatusChange={handleStatusChange}
    />
  );
}
```

### With Log Navigation

```tsx
function DashboardWithNavigation() {
  const navigate = useNavigate();

  const handleViewLog = (logId) => {
    navigate(`/logs/${logId}`);
  };

  return (
    <IdeasList
      ideas={ideas}
      onViewLog={handleViewLog}
    />
  );
}
```

### With Error Handling

```tsx
function RobustIdeasList() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();

  const loadIdeas = async () => {
    try {
      setLoading(true);
      setError(undefined);
      const data = await ipcClient.getAllIdeas();
      setIdeas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IdeasList
      ideas={ideas}
      loading={loading}
      error={error}
      onRetry={loadIdeas}
    />
  );
}
```

## IPC Integration

### Getting All Ideas

```typescript
// In renderer process
const ideas = await ipcClient.getAllIdeas();

// With filtering
const newIdeas = await ipcClient.getAllIdeas({ status: 'raw' });
```

### Updating Idea Status

```typescript
// In renderer process
const updatedIdea = await ipcClient.updateIdeaStatus(ideaId, 'developing');
```

### Main Process Handlers

The following IPC handlers are registered in `ipc-handlers.ts`:

- `ideas:getAll` - Retrieves all ideas from database
- `ideas:updateStatus` - Updates an idea's status

## Database Schema

Ideas are stored with the following structure:

```sql
CREATE TABLE ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  status TEXT DEFAULT 'raw' CHECK (status IN ('raw', 'developing', 'actionable', 'archived')),
  tags TEXT,  -- JSON array stored as string
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (log_id) REFERENCES logs(id) ON DELETE CASCADE
);
```

## Status Mapping

The component maps between user-friendly display statuses and database statuses:

| Display Status | Database Status | Color      |
|---------------|-----------------|------------|
| New           | raw             | Blue       |
| Exploring     | developing      | Purple     |
| Parked        | archived        | Gray       |
| Done          | actionable      | Green      |

## Accessibility

- ARIA labels on all interactive elements
- Status dropdowns have descriptive labels
- Filter buttons have `aria-pressed` state
- List has proper `role="list"` attribute
- Focus management with keyboard navigation
- Screen reader announcements for state changes

## Testing

Comprehensive test suite covers:

- ✓ Rendering all ideas
- ✓ Status dropdown functionality
- ✓ Category badge display
- ✓ Source log link behavior
- ✓ Status filtering
- ✓ Empty, loading, and error states
- ✓ Accessibility features
- ✓ Visual styling

Run tests:
```bash
npm test IdeasList.test.tsx
```

## File Structure

```
src/renderer/components/
├── IdeasList.tsx           # Main component
├── IdeasList.example.tsx   # Usage examples
└── index.ts                # Component exports

tests/
└── IdeasList.test.tsx      # Test suite

src/main/
└── ipc-handlers.ts         # IPC handlers for ideas

src/renderer/
└── ipc-client.ts           # IPC client with idea methods
```

## Performance Considerations

- Component uses local state for filtering (no re-fetching)
- Optimistic UI updates for status changes
- Minimal re-renders with proper React key usage
- Virtual scrolling recommended for 1000+ ideas (future enhancement)

## Future Enhancements

Potential improvements identified:

1. Inline editing of idea text
2. Bulk status updates
3. Advanced filtering (by category, date range)
4. Search/text filtering
5. Sort options (by date, status, category)
6. Drag-and-drop reordering
7. Keyboard shortcuts for status changes
8. Export to CSV/JSON
9. Archive/delete functionality
10. Confidence score editing

## Related Components

- `RecordingStatus` - Shows recording and analysis progress
- `ProgressIndicator` - Reusable progress indicator
- Future: `LogViewer` - Display source log details
- Future: `Dashboard` - Main app dashboard combining components

## Acceptance Criteria Status

- ✓ All ideas displayed
- ✓ Status can be changed via dropdown
- ✓ Category visually indicated
- ✓ Traceability link to source log
- ✓ Filter by status
- ✓ Tests passing
- ✓ Component integrated with IPC
- ✓ Accessibility support

## Implementation Notes

1. **Status Mapping**: The component uses a mapping layer to convert between user-friendly status names (New, Exploring, Parked, Done) and database statuses (raw, developing, archived, actionable). This provides better UX while maintaining database consistency.

2. **Tag Handling**: Tags are stored as JSON strings in the database. The component safely parses them and displays the first tag with a count of additional tags.

3. **Confidence Score**: While the current database schema doesn't include confidence scores for ideas, the component is prepared to display them when available (similar to todos).

4. **Filter State**: Filtering is handled entirely in the component using local state, avoiding unnecessary database queries.

5. **Error Handling**: The component provides clear error messages and retry functionality for better user experience.
