# quickDo — Developer Setup

## Prerequisites

- **Node.js 18+** — https://nodejs.org
- **Windows 10/11** (required for native build; development can be on any OS)
- **Git**

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/your-repo/quickDo.git
cd quickDo

# 2. Install dependencies
npm install

# 3. Run in dev mode
npm start
```

## Building the .exe Installer

```bash
# Install electron-builder globally (optional)
npm install -g electron-builder

# Build Windows installer
npm run build
# Output: dist/quickDo-Setup-1.0.0.exe
```

## Project Structure

```
quickDo/
├── src/
│   ├── main/
│   │   ├── main.js          # Main process — windows, hotkeys, IPC
│   │   ├── preload.js       # Secure IPC bridge
│   │   ├── store.js         # Local JSON storage
│   │   └── dateParser.js    # Natural language date parsing
│   └── renderer/
│       ├── shared.css       # Design tokens & base styles
│       ├── shape.html       # Floating shape (always-on-top)
│       ├── input.html       # Typed input bar
│       ├── voice.html       # Voice input with live transcription
│       ├── confirm.html     # Task confirmation window
│       └── calendar.html    # Full calendar view
├── assets/                  # Icons
├── package.json
├── electron-builder.yml
└── README.md
```

## Key Technical Notes

### Floating Shape (Phase 1 / Issue 1)
- Fixed 56×56px minimum size, locked via `minWidth`/`minHeight`
- `alwaysOnTop: true` with `'floating'` level
- Position persisted in local settings JSON

### Voice Input (Phase 3 / Issue 2)
- Uses `SpeechRecognition` with `continuous = true` and `interimResults = true`
- Words appear in real-time as the user speaks
- 8-second timeout with graceful close
- Handles all error states: permission denied, no-speech, audio-capture

### Save Flow (Phase 2 / Issue 3)
- State: `inputText → parsedDate → userConfirmedDate → saveToStorage() → closeWindow()`
- Date always read from `selectedDate` state variable, never from UI
- Confirm button disabled until both `text` and `date` are non-empty
- `fs.writeFileSync` — synchronous write; window closes only after write completes
- On error: shows error message, window stays open

### Data Storage
- Settings: `%APPDATA%/quickDo/settings.json`
- Tasks: `%APPDATA%/quickDo/tasks.json`
- Schema: `{ id, text, date (YYYY-MM-DD), completed, createdAt }`

## Dependencies

| Package | Purpose |
|---------|---------|
| `electron` | Desktop app framework |
| `electron-builder` | .exe packaging |
| `chrono-node` | Natural language date parsing |
| `better-sqlite3` | (optional future: SQLite storage) |

## Microphone Setup (Windows)

Users must allow microphone access for voice input:
- Settings → Privacy & Security → Microphone → Allow desktop apps: **On**

## Contributing

PRs welcome. Keep the app fast, minimal, and friction-free.
