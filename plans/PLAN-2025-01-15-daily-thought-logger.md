# Plan: Daily Thought Logger

## Metadata
- **Created**: 2025-01-15
- **Project**: main-project
- **Status**: In Progress
- **Linear Epic**: [AI-7](https://linear.app/aiagentworkspace/issue/AI-7)

---

## Overview

A Mac desktop application for capturing daily voice-based thought dumps with AI-powered organization. Users trigger a floating window via global shortcut, speak their thoughts (accomplishments, ideas, learnings), and the app transcribes, analyzes, and organizes everything automatically.

In the age of AI where life moves fast, ideas fizzle out if not captured. This app is a **thoughts and life organizer** that ensures nothing slips through the cracks.

## Problem Statement

- Ideas and thoughts get lost in the daily rush
- Manual journaling is friction-heavy and often abandoned
- No easy way to capture thoughts in the moment and have them organized automatically
- Weekly/monthly reflection requires manually reviewing scattered notes

**Who needs this**: Knowledge workers, creatives, anyone who wants to capture and organize their thinking without friction.

## Goals

- One-shortcut thought capture (< 2 seconds to start recording)
- Automatic transcription and AI-powered classification
- Extract actionable todos, ideas, and learnings from voice dumps
- Full traceability - every extracted item links back to source log
- Historical view of past logs with search
- Weekly AI-generated summaries
- Zero-friction UX - speak and forget, find later

## Non-Goals

- Mobile app (desktop Mac only for v1)
- Multi-user / collaboration features
- Cloud sync (local-first for v1)
- Calendar integration
- Real-time collaboration

---

## Research Findings

### Tech Stack Decision

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Framework | **Electron** | TypeScript/Node.js compatible, mature ecosystem, good for rapid development |
| Frontend | **React + Tailwind** | Fast UI development, component-based |
| Database | **SQLite (better-sqlite3)** | Local-first, no server needed, fast |
| AI Provider | **Gemini API** | User-provided key, supports audio input, good for analysis |
| Global Shortcut | **Electron globalShortcut** | Native support |
| Audio Recording | **Web Audio API + MediaRecorder** | Browser-native, works in Electron |

### Architecture Decision

**Electron with React** - allows us to:
- Use TypeScript throughout (matches AGENTS.md)
- Access native Mac features (shortcuts, system tray, floating window)
- Ship as a standalone .app
- Use existing Node.js ecosystem

---

## Solution Design

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ELECTRON APP                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  Main Process   │    │ Renderer Process │                    │
│  │  (Node.js)      │    │ (React)          │                    │
│  │                 │    │                  │                    │
│  │  - Global       │    │  - Floating      │                    │
│  │    Shortcut     │◄──►│    Recorder      │                    │
│  │  - System Tray  │    │  - Dashboard     │                    │
│  │  - SQLite DB    │    │  - Log History   │                    │
│  │  - Analysis     │    │  - Weekly Summary│                    │
│  │    Pipeline     │    │                  │                    │
│  │                 │    │                  │                    │
│  └─────────────────┘    └─────────────────┘                     │
│           │                      │                               │
│           ▼                      ▼                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      SQLite Database                         ││
│  │  - logs (transcript, audio_path, raw_analysis)              ││
│  │  - todos (log_id FK, text, priority, confidence)            ││
│  │  - ideas (log_id FK, text, status, confidence)              ││
│  │  - learnings (log_id FK, text, topic, confidence)           ││
│  │  - accomplishments (log_id FK, text, confidence)            ││
│  │  - summaries (week_start, content)                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Analysis Pipeline (CORE FEATURE)

This is the brain of the app - not just transcription, but intelligent classification.

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANALYSIS PIPELINE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STAGE 1: CAPTURE                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  User speaks → Audio recorded (webm/opus)                │   │
│  │  Audio saved locally immediately (even before analysis)  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  STAGE 2: TRANSCRIPTION + CLASSIFICATION                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Audio → Gemini API (single call)                        │   │
│  │                                                          │   │
│  │  Prompt: "Transcribe this audio and classify content:    │   │
│  │   - ACCOMPLISHMENTS: things completed/achieved           │   │
│  │   - IDEAS: new concepts, things to explore               │   │
│  │   - TODOS: action items, reminders, tasks                │   │
│  │   - LEARNINGS: new knowledge, insights gained            │   │
│  │                                                          │   │
│  │   Return JSON with confidence scores for each item."     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  STAGE 3: STRUCTURED OUTPUT                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  {                                                       │   │
│  │    "transcript": "Today I finally shipped...",           │   │
│  │    "segments": [                                         │   │
│  │      {                                                   │   │
│  │        "type": "accomplishment",                         │   │
│  │        "text": "Shipped the API integration",            │   │
│  │        "confidence": 0.95                                │   │
│  │      },                                                  │   │
│  │      {                                                   │   │
│  │        "type": "idea",                                   │   │
│  │        "text": "Chrome extension for webpage summary",   │   │
│  │        "confidence": 0.90,                               │   │
│  │        "category": "product"                             │   │
│  │      },                                                  │   │
│  │      {                                                   │   │
│  │        "type": "todo",                                   │   │
│  │        "text": "Call the dentist",                       │   │
│  │        "confidence": 0.98,                               │   │
│  │        "priority": "medium"                              │   │
│  │      },                                                  │   │
│  │      {                                                   │   │
│  │        "type": "learning",                               │   │
│  │        "text": "TypeScript infer keyword",               │   │
│  │        "confidence": 0.88,                               │   │
│  │        "topic": "typescript"                             │   │
│  │      }                                                   │   │
│  │    ]                                                     │   │
│  │  }                                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  STAGE 4: STORAGE WITH RELATIONSHIPS                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. Insert into `logs` → get log_id                      │   │
│  │  2. For each segment:                                    │   │
│  │     - Insert into appropriate table (todos/ideas/etc)    │   │
│  │     - Set log_id foreign key (TRACEABILITY)              │   │
│  │     - Store confidence score                             │   │
│  │  3. Trigger dashboard refresh                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Raw logs from voice recordings
CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  transcript TEXT NOT NULL,
  raw_analysis TEXT,     -- Full Gemini JSON response
  audio_path TEXT,       -- Path to saved audio file
  duration_seconds INTEGER
);

-- Extracted accomplishments
CREATE TABLE accomplishments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id INTEGER REFERENCES logs(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  confidence REAL,       -- AI confidence 0-1
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Extracted todos
CREATE TABLE todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id INTEGER REFERENCES logs(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium',  -- high, medium, low
  confidence REAL,
  user_reclassified BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Extracted ideas
CREATE TABLE ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id INTEGER REFERENCES logs(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  status TEXT DEFAULT 'new',  -- new, exploring, parked, done
  category TEXT,
  confidence REAL,
  user_reclassified BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Extracted learnings/insights
CREATE TABLE learnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id INTEGER REFERENCES logs(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  topic TEXT,
  confidence REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Weekly summaries
CREATE TABLE summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  content TEXT NOT NULL,
  highlights TEXT,
  stats TEXT,            -- JSON: {todos_completed, ideas_generated, etc}
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_todos_log_id ON todos(log_id);
CREATE INDEX idx_ideas_log_id ON ideas(log_id);
CREATE INDEX idx_learnings_log_id ON learnings(log_id);
CREATE INDEX idx_accomplishments_log_id ON accomplishments(log_id);
```

### Traceability UI

Every extracted item links back to its source:

**Viewing an Idea:**
```
┌─────────────────────────────────────────────────────────────────┐
│  💡 IDEA                                                         │
│                                                                  │
│  "Chrome extension that summarizes any webpage"                  │
│                                                                  │
│  Status: [New ▼]    Category: [Product ▼]                       │
│  Confidence: 90%                                                 │
│                                                                  │
│  ────────────────────────────────────────────────────────────── │
│  SOURCE: Jan 15, 2025 at 10:30 PM                   [View Log →]│
│                                                                  │
│  "...Oh, I had this idea for a Chrome extension that            │
│  summarizes any webpage - could be useful..."                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Viewing a Log:**
```
┌─────────────────────────────────────────────────────────────────┐
│  📝 LOG - Jan 15, 2025 at 10:30 PM                    [▶ Play]  │
│                                                                  │
│  TRANSCRIPT                                                      │
│  "Today I finally shipped the API integration, took way longer  │
│  than expected. Oh, I had this idea for a Chrome extension..."  │
│                                                                  │
│  ────────────────────────────────────────────────────────────── │
│  EXTRACTED FROM THIS LOG:                                        │
│                                                                  │
│  ✅ Accomplishments (1)                                          │
│     • Shipped the API integration                                │
│                                                                  │
│  💡 Ideas (1)                                          [View →] │
│     • Chrome extension for webpage summary                       │
│                                                                  │
│  ☐ Todos (1)                                          [View →] │
│     • Call the dentist                                          │
│                                                                  │
│  📚 Learnings (1)                                     [View →] │
│     • TypeScript infer keyword                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Daily Thought Logger                              [_] [□] [X]  │
├─────────────────┬───────────────────────────────────────────────┤
│                 │                                               │
│  HISTORY        │  DASHBOARD                                    │
│                 │                                               │
│  ┌───────────┐  │  ┌─────────────────────────────────────────┐ │
│  │ Today     │  │  │ WEEKLY SUMMARY                          │ │
│  │ > Log 3   │  │  │ This week you accomplished 12 tasks,    │ │
│  │ > Log 2   │  │  │ generated 5 ideas, learned 8 things...  │ │
│  │ > Log 1   │  │  └─────────────────────────────────────────┘ │
│  ├───────────┤  │                                               │
│  │ Yesterday │  │  ┌──────────────────┐ ┌──────────────────┐   │
│  │ > Log 2   │  │  │ TODOS (5)        │ │ IDEAS (3)        │   │
│  │ > Log 1   │  │  │ ☐ Review PR  [→] │ │ 💡 App idea  [→] │   │
│  ├───────────┤  │  │ ☐ Call dentist   │ │ 💡 Blog post     │   │
│  │ Jan 13    │  │  │ ☑ Send email     │ │ 💡 Feature...    │   │
│  │ > Log 1   │  │  └──────────────────┘ └──────────────────┘   │
│  └───────────┘  │                                               │
│                 │  ┌─────────────────────────────────────────┐ │
│  [+ New Log]    │  │ RECENT LEARNINGS                        │ │
│                 │  │ • TypeScript generics pattern...    [→] │ │
│                 │  │ • Electron IPC best practices...        │ │
│                 │  └─────────────────────────────────────────┘ │
│                 │                                               │
└─────────────────┴───────────────────────────────────────────────┘

[→] = Click to see source log (traceability)

FLOATING RECORDER (separate window):
┌─────────────────────────────┐
│  🎤 Recording... (0:15)     │
│                             │
│  [Done] or press ⌘⇧L again  │
└─────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation
**Goal**: Basic Electron app structure with database and Gemini service

**Tasks**:
1. Initialize Electron + React + TypeScript project - S
2. Set up SQLite database with full schema - S
3. Create DatabaseService with CRUD for all tables - M
4. Set up Gemini API service with API key config - S
5. Create type definitions for all data models - S

**Dependencies**: None
**Estimated Phase Effort**: M

---

### Phase 2: Analysis Pipeline
**Goal**: The brain - transcription, classification, and structured storage

**Tasks**:
1. Design and implement Gemini classification prompt - M
2. Build AnalysisService (audio → structured JSON) - M
3. Implement segment extraction and confidence scoring - S
4. Build storage pipeline (log + related items with FK) - M
5. Add error handling and retry logic for API failures - S
6. Create "pending analysis" state for offline/failed requests - S

**Dependencies**: Phase 1
**Estimated Phase Effort**: L

---

### Phase 3: Core Recording Flow
**Goal**: Working voice capture → analysis pipeline → storage

**Tasks**:
1. Implement global shortcut registration (Cmd+Shift+L) - S
2. Create FloatingRecorder window component - M
3. Implement audio recording with MediaRecorder - S
4. Add text input mode for testing (bypass audio, direct text → analysis) - S
5. Wire recording/text to analysis pipeline - M
6. Show recording status and analysis progress - S

**Dependencies**: Phase 2
**Estimated Phase Effort**: M

> **Testing Note**: Text input mode allows testing the full analysis pipeline without requiring actual voice recording. Toggle via a dev flag or UI button.

---

### Phase 4: Dashboard UI
**Goal**: Main dashboard with todos, ideas, learnings, and traceability

**Tasks**:
1. Create main window layout (sidebar + main area) - M
2. Build LogHistory sidebar with date grouping - M
3. Build TodoList component with completion toggle - S
4. Build IdeasList component with status management - S
5. Build LearningsList component - S
6. Build AccomplishmentsList component - S
7. Implement LogDetailView (full transcript + extracted items) - M
8. Add item→log traceability links throughout - M
9. Implement user reclassification (move items between types) - M

**Dependencies**: Phase 3
**Estimated Phase Effort**: XL

---

### Phase 5: Weekly Summary
**Goal**: AI-generated weekly summaries

**Tasks**:
1. Design weekly summary Gemini prompt - S
2. Implement summary generation service - M
3. Create WeeklySummary dashboard component - S
4. Add automatic weekly regeneration - S
5. Include stats (todos completed, ideas generated, etc) - S

**Dependencies**: Phase 4
**Estimated Phase Effort**: M

---

### Phase 6: Polish & UX
**Goal**: Production-ready experience

**Tasks**:
1. System tray integration with quick-record menu - S
2. App startup on login option - S
3. Keyboard navigation throughout app - S
4. Loading states and error handling UI - S
5. Settings panel (shortcut customization, API key management) - M
6. Search across all logs and items - M
7. App packaging for Mac distribution (.dmg) - M

**Dependencies**: Phase 5
**Estimated Phase Effort**: L

---

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Microphone permission denied | Show clear permission dialog, link to System Preferences |
| Gemini API failure | Save audio locally, show "pending analysis", retry later |
| No internet connection | Save audio, analyze when online, show offline indicator |
| Very long recording (>10 min) | Warn user, chunk if needed |
| Empty/silent recording | Detect silence, prompt to try again |
| Low confidence classification | Show "needs review" badge, allow reclassification |
| Database corruption | Auto-backup daily, recovery option |

## Security Considerations

- **API Key Storage**: Store Gemini key in macOS Keychain via `keytar`
- **Audio Files**: Store in app sandbox (`~/Library/Application Support/`)
- **No Cloud Sync**: All data stays local (v1)
- **Input Validation**: Sanitize displayed content to prevent XSS

## Performance Considerations

- **Audio Compression**: webm/opus before API call
- **Lazy Loading**: Load log history on scroll
- **Background Processing**: Analysis doesn't block UI
- **SQLite Indexes**: On timestamp, log_id for fast queries
- **Caching**: Cache weekly summary until new logs added

---

## Testing Strategy

- **Unit Tests**: DatabaseService, AnalysisService, GeminiService
- **Component Tests**: React components with Testing Library
- **Integration Tests**: Full recording → analysis → storage flow
- **Manual Testing**:
  - Global shortcut works from any app
  - Classification accuracy across different speech styles
  - Traceability links work correctly
  - Offline behavior

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Gemini classification errors | Medium | High | Confidence scores + user reclassification |
| API costs | Medium | Medium | Track usage, warn on high use |
| Electron app size | High | Low | Accept ~150MB, optimize later |
| Audio quality issues | Medium | High | Test various mics, add noise tips |

## Open Questions

- [x] Classification approach - RESOLVED: Gemini with confidence scores
- [ ] Should we support multiple audio input devices?
- [ ] Export functionality (JSON, Markdown)?
- [ ] Full-text search implementation?

---

## Summary

**Total Phases**: 6
**Total Tasks**: 36
**Estimated Total Effort**: XL (3-4 weeks)
**Ready for Distiller**: Yes

## File Structure

```
main-project/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts
│   │   ├── shortcuts.ts
│   │   ├── tray.ts
│   │   ├── windows.ts
│   │   └── ipc-handlers.ts
│   ├── renderer/                # React frontend
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── FloatingRecorder.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── LogHistory.tsx
│   │   │   ├── LogDetailView.tsx
│   │   │   ├── TodoList.tsx
│   │   │   ├── IdeasList.tsx
│   │   │   ├── LearningsList.tsx
│   │   │   ├── AccomplishmentsList.tsx
│   │   │   ├── WeeklySummary.tsx
│   │   │   ├── ItemCard.tsx         # Reusable with traceability
│   │   │   └── Settings.tsx
│   │   ├── hooks/
│   │   │   ├── useAudioRecorder.ts
│   │   │   ├── useDatabase.ts
│   │   │   └── useAnalysis.ts
│   │   └── styles/
│   │       └── tailwind.css
│   ├── services/
│   │   ├── database.ts
│   │   ├── gemini.ts
│   │   ├── analysis.ts              # The classification brain
│   │   └── storage.ts               # Save with relationships
│   ├── types/
│   │   └── index.ts
│   └── prompts/
│       ├── classification.ts        # Gemini prompt for analysis
│       └── weekly-summary.ts        # Gemini prompt for summaries
├── database/
│   └── schema.sql
├── assets/
│   └── icons/
├── package.json
├── electron-builder.json
├── tsconfig.json
└── tailwind.config.js
```

## Gemini API Key

```
AIzaSyBle923OdX4igLHDGBI0HIel-93ySvsj3c
```
(To be stored securely in app settings, not hardcoded)
