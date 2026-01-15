# AI-27: TodoList Component

## Overview

This document describes the TodoList component implementation for the Daily Thought Logger application. The component displays all todos from the database with filtering, completion toggle, priority indicators, confidence scores, and traceability to source logs.

## Components

### TodoList Component

Location: `src/renderer/components/TodoList.tsx`

The main TodoList component displays a filterable list of todos with rich metadata.

**Features:**
- ✅ List all todos from database
- ✅ Checkbox to mark complete/incomplete
- ✅ Priority indicator (color-coded badges)
- ✅ Confidence score indicator (color-coded percentages)
- ✅ Click to see source log
- ✅ Filter by completion status (All/Active/Completed)
- ✅ Summary statistics
- ✅ Loading and error states
- ✅ Accessibility (ARIA labels, keyboard navigation)

**Props:**
```typescript
interface TodoListProps {
  todos: TodoWithConfidence[];
  onToggleComplete?: (todoId: number, completed: boolean) => void;
  onViewLog?: (logId: number) => void;
  loading?: boolean;
  error?: string | null;
}
```

**Priority Colors:**
- High Priority (1): Red badge
- Medium Priority (2): Yellow badge
- Low Priority (3): Green badge

**Confidence Colors:**
- Very High (90%+): Green text
- High (70-89%): Blue text
- Medium (50-69%): Yellow text
- Low (<50%): Red text

### TodoListDemo Component

Location: `src/renderer/components/TodoListDemo.tsx`

Demo component showing how to use TodoList with the useTodos hook.

## Hooks

### useTodos Hook

Location: `src/renderer/hooks/useTodos.ts`

React hook for managing todo data with IPC communication.

**Features:**
- Fetches todos from database via IPC
- Optimistic UI updates for completion toggle
- Auto-refresh on analysis complete
- Error handling

**API:**
```typescript
const {
  todos,           // Array of todos with confidence scores
  loading,         // Loading state
  error,           // Error message
  refresh,         // Manually refresh todos
  toggleComplete,  // Toggle completion status
  viewLog          // View source log
} = useTodos(options);
```

## Backend Support

### IPC Handlers

Added to `src/main/ipc-handlers.ts`:

- `todos:getAll` - Fetch all todos with optional filtering
- `todos:toggleComplete` - Update todo completion status
- `todos:getLog` - Fetch source log for traceability

### StorageService Extensions

Added to `src/services/storage.ts`:

- `getAllTodos(options)` - Get todos with filtering
- `updateTodo(id, data)` - Update todo
- `getLogById(id)` - Get log by ID

## Types

### TodoWithConfidence

Extended Todo type that includes confidence score from AI classification:

```typescript
interface TodoWithConfidence extends Todo {
  confidence?: number;  // 0-1 confidence score
  logDate?: string;     // Date from source log
}
```

## Testing

Test file: `tests/TodoList.test.tsx`

**Test Coverage:**
- ✅ Basic rendering (37 tests total)
- ✅ Filter functionality (All/Active/Completed)
- ✅ Priority indicators (High/Medium/Low)
- ✅ Confidence scores with color coding
- ✅ Completion toggle
- ✅ Source log linking
- ✅ Summary statistics
- ✅ Accessibility (ARIA labels, keyboard navigation)
- ✅ Edge cases (missing fields, invalid data)
- ✅ Loading and error states

Run tests:
```bash
npm test -- TodoList.test.tsx
```

All 37 tests passing ✅

## Usage Examples

### Basic Usage

```tsx
import { TodoList } from './components/TodoList';
import { useTodos } from './hooks/useTodos';

function MyComponent() {
  const { todos, loading, error, toggleComplete, viewLog } = useTodos();

  return (
    <TodoList
      todos={todos}
      loading={loading}
      error={error}
      onToggleComplete={toggleComplete}
      onViewLog={viewLog}
    />
  );
}
```

### With Filtering

```tsx
import { useTodos } from './hooks/useTodos';

// Only show active todos
const { todos } = useTodos({ completed: false });

// Only show completed todos
const { todos } = useTodos({ completed: true });

// Show all todos with pagination
const { todos } = useTodos({ limit: 20, offset: 0 });
```

### Custom Event Handling

```tsx
function MyComponent() {
  const { todos, toggleComplete, viewLog } = useTodos();

  const handleToggle = async (todoId: number, completed: boolean) => {
    await toggleComplete(todoId, completed);
    // Custom logic after toggle
    console.log(`Todo ${todoId} ${completed ? 'completed' : 'uncompleted'}`);
  };

  const handleViewLog = (logId: number) => {
    viewLog(logId);
    // Navigate to log detail view
    router.push(`/logs/${logId}`);
  };

  return (
    <TodoList
      todos={todos}
      onToggleComplete={handleToggle}
      onViewLog={handleViewLog}
    />
  );
}
```

## Acceptance Criteria

All acceptance criteria have been met:

- ✅ All todos displayed
- ✅ Completion toggle works
- ✅ Priority visually indicated (color-coded badges)
- ✅ Confidence shown (color-coded percentages)
- ✅ Traceability link to source log (click to view)
- ✅ Filter by status (All/Active/Completed)

## Architecture

### Data Flow

```
┌─────────────────┐
│  TodoList       │
│  Component      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  useTodos Hook  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  IPC Layer      │
│  (Renderer)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  IPC Handlers   │
│  (Main)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  StorageService │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  DatabaseService│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SQLite DB      │
└─────────────────┘
```

### Confidence Score Integration

Confidence scores come from the AI classification process:

1. Audio/text is analyzed by Gemini API
2. Classification returns segments with confidence scores (0-1)
3. Scores are stored with todos during save
4. TodoList displays scores with color coding

Note: In the current implementation, confidence scores are stored in memory. For production, consider adding a `confidence` column to the todos table.

## Future Enhancements

Potential improvements for future iterations:

1. **Persistence**: Add `confidence` column to database schema
2. **Sorting**: Allow sorting by priority, due date, or confidence
3. **Bulk Actions**: Select multiple todos for bulk complete/delete
4. **Due Date Editing**: Allow users to set/edit due dates
5. **Priority Editing**: Allow users to change priority levels
6. **Search**: Filter todos by text content
7. **Tags**: Add custom tags to todos
8. **Notifications**: Remind users of high-priority todos
9. **Analytics**: Show completion rate and productivity metrics
10. **Export**: Export todos to CSV or other formats

## Files Changed

### New Files
- `src/renderer/components/TodoList.tsx` - Main component
- `src/renderer/components/TodoListDemo.tsx` - Demo component
- `src/renderer/hooks/useTodos.ts` - React hook for todos
- `tests/TodoList.test.tsx` - Comprehensive tests
- `docs/AI-27-TodoList-Component.md` - This documentation

### Modified Files
- `src/renderer/components/index.ts` - Export TodoList and TodoListDemo
- `src/renderer/hooks/index.ts` - Export useTodos hook
- `src/main/ipc-handlers.ts` - Add todo IPC handlers
- `src/services/storage.ts` - Add todo management methods

## Conclusion

The TodoList component is fully implemented with all required features and comprehensive test coverage. It provides a clean, accessible interface for managing todos with visual indicators for priority and confidence, plus full traceability to source logs.
