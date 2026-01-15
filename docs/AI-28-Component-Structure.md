# IdeasList Component Structure

## Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Ideas                                     (4 ideas)             │
│                                                                  │
│  [All Ideas]  [New]  [Exploring]  [Parked]  [Done]             │
│  ▲ active     inactive                                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Build a mobile app for tracking habits                   │  │
│  │                                                           │  │
│  │ [product +1]  1/15/2024  View source log  [New ▼]       │  │
│  │  ▲ category   ▲ date     ▲ log link      ▲ status       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Explore AI-powered code review tools                     │  │
│  │                                                           │  │
│  │ [tech +1]  1/14/2024  View source log  [Exploring ▼]    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Write blog post about TypeScript best practices          │  │
│  │                                                           │  │
│  │ 1/13/2024  View source log  [Done ▼]                     │  │
│  │  ▲ no category badge                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Research GraphQL alternatives                             │  │
│  │                                                           │  │
│  │ [research]  1/12/2024  View source log  [Parked ▼]      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
IdeasList
├── StatusFilter
│   ├── Button: "All Ideas" (active)
│   ├── Button: "New"
│   ├── Button: "Exploring"
│   ├── Button: "Parked"
│   └── Button: "Done"
│
└── Ideas Container (role="list")
    ├── IdeaItem (id: 1)
    │   ├── Text Content
    │   ├── Metadata Row
    │   │   ├── CategoryBadge (tags)
    │   │   ├── ConfidenceIndicator (optional)
    │   │   ├── Source Log Link
    │   │   └── Creation Date
    │   └── Status Dropdown
    │       ├── Option: "New"
    │       ├── Option: "Exploring"
    │       ├── Option: "Parked"
    │       └── Option: "Done"
    │
    ├── IdeaItem (id: 2)
    │   └── [same structure]
    │
    ├── IdeaItem (id: 3)
    │   └── [same structure]
    │
    └── IdeaItem (id: 4)
        └── [same structure]
```

## State Flow Diagram

```
┌──────────────┐
│   Parent     │
│  Component   │
└──────┬───────┘
       │
       │ props: ideas[], onStatusChange, onViewLog
       │
       ▼
┌──────────────────────────────────────────┐
│          IdeasList Component              │
│                                           │
│  State:                                   │
│  - statusFilter: 'all' | 'new' | ...     │
│                                           │
│  Computed:                                │
│  - filteredIdeas (based on statusFilter)  │
└──────┬───────────────────────────────────┘
       │
       ├─── Filter Change ────┐
       │                      │
       │                      ▼
       │              Update statusFilter
       │              Re-filter ideas
       │
       ├─── Status Change ────┐
       │                      │
       │                      ▼
       │              Call onStatusChange(ideaId, newStatus)
       │              Parent updates database
       │              Parent updates ideas[] prop
       │              Component re-renders
       │
       └─── View Log ─────────┐
                              │
                              ▼
                       Call onViewLog(logId)
                       Parent handles navigation
```

## Data Flow

```
┌─────────────────┐
│  Renderer       │
│  (React)        │
└────────┬────────┘
         │
         │ ipcClient.getAllIdeas()
         ▼
┌─────────────────┐
│  IPC Client     │
│  ipc-client.ts  │
└────────┬────────┘
         │
         │ invoke('ideas:getAll')
         ▼
┌─────────────────┐
│  Main Process   │
│  ipc-handlers   │
└────────┬────────┘
         │
         │ databaseService.getAllIdeas()
         ▼
┌─────────────────┐
│  Database       │
│  SQLite         │
└────────┬────────┘
         │
         │ ideas[]
         ▼
┌─────────────────┐
│  IdeasList      │
│  Component      │
└─────────────────┘
```

## Status Update Flow

```
User clicks status dropdown
        │
        ▼
onChange event fires
        │
        ▼
handleStatusChange(ideaId, newStatus)
        │
        ├─── Map display status to DB status
        │    (new → raw, exploring → developing, etc.)
        │
        └─── Call onStatusChange callback
                    │
                    ▼
            Parent component handler
                    │
                    ├─── Optimistic UI update
                    │    (update local state immediately)
                    │
                    └─── ipcClient.updateIdeaStatus()
                                │
                                ▼
                        IPC: ideas:updateStatus
                                │
                                ▼
                        Database update
                                │
                                ├─── Success
                                │    └─── UI already updated
                                │
                                └─── Error
                                     └─── Rollback UI
                                          Show error
```

## Filter State Machine

```
                  ┌─────────┐
                  │   All   │ (initial state)
                  └────┬────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   ┌────────┐    ┌──────────┐   ┌────────┐
   │  New   │    │Exploring │   │ Parked │
   └────────┘    └──────────┘   └────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
                       ▼
                  ┌────────┐
                  │  Done  │
                  └────────┘

Any filter can transition to any other filter
All filters show count of matching ideas
Empty state shown if count = 0
```

## Props Interface

```typescript
interface IdeasListProps {
  // Required
  ideas: Idea[]

  // Optional callbacks
  onStatusChange?: (ideaId: number, newStatus: IdeaStatus) => void
  onViewLog?: (logId: number) => void
  onRetry?: () => void

  // Optional state
  loading?: boolean
  error?: string
}
```

## Component States

```
┌──────────────────────────────────────────┐
│          Component States                 │
├──────────────────────────────────────────┤
│                                           │
│  Normal State (has ideas)                │
│  ├─ Filter bar visible                   │
│  ├─ Ideas list visible                   │
│  └─ Interactions enabled                 │
│                                           │
│  Loading State                            │
│  ├─ Spinner visible                       │
│  ├─ "Loading ideas..." message           │
│  └─ List hidden                           │
│                                           │
│  Error State                              │
│  ├─ Error icon and message               │
│  ├─ Retry button (if onRetry provided)   │
│  └─ List hidden                           │
│                                           │
│  Empty State (no ideas)                  │
│  ├─ Empty state icon                     │
│  ├─ "No ideas yet" message               │
│  └─ Filter bar hidden                    │
│                                           │
│  Filtered Empty State                    │
│  ├─ "No ideas match filter" message      │
│  ├─ "Show all ideas" link                │
│  └─ Filter bar visible                   │
│                                           │
└──────────────────────────────────────────┘
```

## Color Scheme

```
Status Colors:
├─ New (raw)
│  ├─ Text: blue-700
│  ├─ Background: blue-50
│  └─ Border: blue-200
│
├─ Exploring (developing)
│  ├─ Text: purple-700
│  ├─ Background: purple-50
│  └─ Border: purple-200
│
├─ Parked (archived)
│  ├─ Text: gray-700
│  ├─ Background: gray-50
│  └─ Border: gray-200
│
└─ Done (actionable)
   ├─ Text: green-700
   ├─ Background: green-50
   └─ Border: green-200

Category Badge:
├─ Text: indigo-700
├─ Background: indigo-50
└─ Border: indigo-200

Confidence Indicator:
├─ High (70%+): green-600, green-100
├─ Medium (40-70%): yellow-600, yellow-100
└─ Low (<40%): red-600, red-100
```

## Responsive Behavior

```
Desktop (1024px+)
├─ Filter buttons: horizontal row
├─ Idea cards: full width
└─ All metadata visible in single row

Tablet (768px-1023px)
├─ Filter buttons: horizontal row with wrap
├─ Idea cards: full width
└─ Metadata wraps to multiple rows

Mobile (< 768px)
├─ Filter buttons: vertical stack
├─ Idea cards: full width
└─ Metadata wraps to multiple rows
```

## Accessibility Tree

```
IdeasList
├─ heading: "Ideas"
├─ text: "(4 ideas)"
├─ group (filter buttons)
│  ├─ button: "All Ideas" [aria-pressed="true"]
│  ├─ button: "New" [aria-pressed="false"]
│  ├─ button: "Exploring" [aria-pressed="false"]
│  ├─ button: "Parked" [aria-pressed="false"]
│  └─ button: "Done" [aria-pressed="false"]
└─ list [aria-label="Ideas list"]
   ├─ listitem (idea 1)
   │  ├─ text: "Build a mobile app..."
   │  ├─ link: "View source log" [aria-label="View source log 101"]
   │  └─ combobox [aria-label="Status for idea: Build a mobile app..."]
   ├─ listitem (idea 2)
   ├─ listitem (idea 3)
   └─ listitem (idea 4)
```

## File Organization

```
src/renderer/components/
├── IdeasList.tsx                    # Main component (367 lines)
│   ├── IdeasListProps               # Component props interface
│   ├── STATUS_CONFIG                # Status visual configuration
│   ├── mapDatabaseStatus()          # DB → Display mapping
│   ├── mapDisplayStatus()           # Display → DB mapping
│   ├── ConfidenceIndicator          # Sub-component
│   ├── CategoryBadge                # Sub-component
│   ├── StatusFilter                 # Sub-component
│   ├── IdeaItem                     # Sub-component
│   └── IdeasList                    # Main export
│
├── IdeasList.example.tsx            # Usage examples (167 lines)
│   ├── IdeasListContainer           # Full example with state
│   ├── FilteredIdeasListExample     # Pre-filtered example
│   ├── CustomHandlersExample        # Custom callbacks
│   └── ReadOnlyIdeasList            # Read-only mode
│
└── index.ts                         # Component exports
    ├── export { IdeasList }
    └── export type { IdeasListProps }

tests/
└── IdeasList.test.tsx               # Test suite (461 lines)
    ├── Rendering tests
    ├── Status dropdown tests
    ├── Category badge tests
    ├── Source log link tests
    ├── Filter tests
    ├── State tests (loading, error, empty)
    ├── Accessibility tests
    └── Visual styling tests

docs/
├── AI-28-IdeasList-Component.md     # Full documentation (396 lines)
└── AI-28-Component-Structure.md     # This file
```

## Performance Characteristics

```
Rendering:
├─ Initial render: O(n) where n = number of ideas
├─ Filter change: O(n) filtering + O(m) re-render where m = filtered count
├─ Status change: O(1) local update + async DB update
└─ View log click: O(1) callback invocation

Memory:
├─ Component state: ~100 bytes per idea
├─ Filter state: 10 bytes
└─ Total: O(n) linear with number of ideas

Recommended limits:
├─ Optimal: < 100 ideas (no virtual scrolling needed)
├─ Good: 100-1000 ideas (consider virtual scrolling)
└─ Requires optimization: > 1000 ideas (virtual scrolling required)
```

## Integration Example

```typescript
// In Dashboard.tsx
import { IdeasList } from './components';

function Dashboard() {
  const { ideas, loading, error, updateStatus, viewLog, reload } = useIdeas();

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {/* Ideas Section */}
      <section className="ideas-section">
        <IdeasList
          ideas={ideas}
          onStatusChange={updateStatus}
          onViewLog={viewLog}
          loading={loading}
          error={error}
          onRetry={reload}
        />
      </section>

      {/* Other dashboard sections */}
    </div>
  );
}
```
