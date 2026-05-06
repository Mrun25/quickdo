# QuickDo — Technical Architecture

## Overview

QuickDo is built as a vanilla JS + HTML/CSS frontend packaged inside an Electron shell for Windows distribution. There are no build steps for the frontend — the source runs directly in the Electron BrowserWindow.

---

## Module Map

```
┌─────────────────────────────────────────────────────────────┐
│                        index.html                           │
│  (DOM skeleton, script load order, all HTML structure)      │
└───────────────────────┬─────────────────────────────────────┘
                        │ loads in order
        ┌───────────────▼────────────────────┐
        │           src/utils/               │
        │  dateUtils.js   toast.js           │
        └───────────────┬────────────────────┘
                        │
        ┌───────────────▼────────────────────┐
        │            src/core/               │
        │  dateParser.js   taskStore.js      │
        └───────────────┬────────────────────┘
                        │
        ┌───────────────▼────────────────────┐
        │             src/ui/                │
        │  calendar.js  modal.js             │
        │  voice.js     bubble.js            │
        └───────────────┬────────────────────┘
                        │
        ┌───────────────▼────────────────────┐
        │          src/core/app.js           │
        │  (wires all modules, boots app)    │
        └────────────────────────────────────┘
```

---

## Module Responsibilities

### `src/utils/dateUtils.js`
Pure date helpers with no side effects:
- `today()` — midnight Date
- `dateKey(d)` — YYYY-MM-DD string
- `addDays(d, n)` — offset Date
- `labelForDate(d)` — "Today", "Tomorrow", weekday, or "Jun 15"
- `fullLabel(d)` — "Mon, Jun 15"

### `src/core/dateParser.js`
NLP date extraction (Phase 4). Stateless pure function:
- `parse(rawText)` → `{ date, label, clean }` | `null`
- `stripFiller(text)` → removes "add", "remind me to", etc.
- Handles: today/tomorrow/yesterday, next week, in N days,
  next/this weekday, Month Day, DD/MM

### `src/core/taskStore.js`
In-memory task store with localStorage persistence.
- CRUD: `addTask`, `toggleTask`, `deleteTask`, `moveTask`, `updateText`
- Queries: `getAll`, `getByDateKey`, `pendingCount`, `todayCount`
- Serializes `Date` objects to ISO strings for JSON storage

### `src/ui/bubble.js` (Phase 1)
The floating widget bubble.
- Mouse drag with canvas boundary clamping
- Click to open/close modal
- Keyboard hotkey simulation (browser) / global hotkeys (Electron)
- Integrates with Electron preload via `window.quickdoAPI`

### `src/ui/modal.js` (Phase 2 & 4)
Input modal + confirmation window.
- Live date-parse preview while typing
- Mode switching (typed ↔ voice)
- Date ambiguity prompt (Today / Tomorrow / Pick)
- Confirmation window (confirm / edit / cancel)
- Owns `pendingTask` shared state; Voice module writes via `setPending()`

### `src/ui/voice.js` (Phase 3)
Voice transcription input.
- Browser prototype: simulates live transcription character-by-character
- Real build: wraps `window.SpeechRecognition` or Whisper via IPC
- On transcript complete: runs `DateParser.parse()`, updates `Modal.setPending()`

### `src/ui/calendar.js` (Phase 5)
Scrollable timeline calendar.
- Renders 16 days starting from (today − 2 + offset)
- Per-day sections with sticky headers, task counts, task items
- Task actions: check-off, delete, move (3-option popover)
- `calendarOffset` state for scroll navigation

### `src/utils/toast.js`
Toast notifications (Phase 6).
- Single global `#toast` element
- Auto-hides after configurable duration
- Clears previous timer on rapid calls

### `src/core/app.js`
Boot controller.
- Calls `init()` on every module in the correct order
- Binds demo bar buttons
- Exposes `updateStats()` for status bar

---

## Data Flow

```
User speaks / types
        │
        ▼
  DateParser.parse(rawText)
        │
        ├─ date found ──► pendingTask = { text, date, dateLabel }
        │                 show parsed preview
        │
        └─ no date ─────► pendingTask = { text, date: null }
                          show ambiguity prompt
                                │
                                ▼
                        User picks: Today / Tomorrow / Pick
                                │
                                ▼
                     pendingTask.date assigned

User hits Confirm
        │
        ▼
  Confirmation window (task name + date)
        │
        ▼
  TaskStore.addTask(text, date)
        │
        ├─► localStorage saved
        ├─► Calendar.render()
        └─► App.updateStats()
```

---

## Storage

Tasks are persisted as JSON in `localStorage` under key `quickdo_tasks`:

```json
[
  {
    "id": 1,
    "text": "Buy groceries",
    "date": "2026-05-05T00:00:00.000Z",
    "done": false,
    "created": 1746403200000
  }
]
```

In the Electron build, `localStorage` maps to the app's userData directory on disk (`%APPDATA%\QuickDo\`). A future V2 migration could swap this for SQLite via `better-sqlite3`.

---

## Electron Architecture

```
┌─────────────────────────────────────────────┐
│              Main Process (Node.js)          │
│  installer/main.js                           │
│  • BrowserWindow (frameless, always-on-top)  │
│  • globalShortcut (Ctrl+Shift, Ctrl+Shift+W) │
│  • Tray icon + context menu                  │
│  • Login item (start with Windows)           │
└──────────────────┬──────────────────────────┘
                   │ contextBridge (IPC)
┌──────────────────▼──────────────────────────┐
│           Renderer Process (Browser)         │
│  installer/preload.js → window.quickdoAPI    │
│  • onHotkey(cb)                              │
│  • hideWindow()                              │
│  • setWindowPosition(x, y)                   │
└──────────────────┬──────────────────────────┘
                   │ DOM events
┌──────────────────▼──────────────────────────┐
│            index.html + src/**               │
│  (all UI modules described above)            │
└─────────────────────────────────────────────┘
```

---

## Future: Voice (Real Implementation)

For V1 shipping, replace the simulation in `voice.js` with:

```javascript
// Option A: Web Speech API (online, built-in to Chromium)
const recognition = new webkitSpeechRecognition();
recognition.continuous = false;
recognition.interimResults = true;
recognition.onresult = (e) => { /* update transcript */ };

// Option B: Whisper.cpp via Electron IPC (offline)
// Main process spawns whisper CLI, streams results back via ipcMain
ipcMain.handle('transcribe-audio', async (e, audioBuffer) => {
  // call local whisper model
});
```

The PRD specifies offline-first for privacy. Option B (Whisper) is recommended for V1 production.
