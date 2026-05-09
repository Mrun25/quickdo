# quickDo

> Capture tasks in under 3 seconds. No switching. No friction.

**quickDo** is a lightweight Windows desktop app that lives as a floating shape on your screen. Press a hotkey, say or type your task, confirm it — and it's organised into your calendar. Then it disappears.

![quickDo Demo](assets/demo.gif)

---

## What It Does

- 🎯 **Always-on floating shape** — sits quietly in a corner, never in your way
- ⌨️ **Ctrl+Shift+W** → typed input bar
- 🎤 **Ctrl+Shift** → live voice transcription
- 🧠 **Smart date parsing** — understands "dentist Friday", "submit report next Monday", "June 15"
- 📅 **Built-in calendar** — scrollable timeline, Past → Today → Upcoming
- ✅ **Task management** — check off, delete, move to another date

---

## Installation

1. Download `quickDo-Setup.exe` from [Releases](https://github.com/your-repo/quickDo/releases)
2. Run the installer — one click, no dependencies
3. quickDo starts automatically and lives in your system tray

---

## Hotkeys

| Hotkey | Action |
|--------|--------|
| `Ctrl+Shift` | Voice input (speak your task) |
| `Ctrl+Shift+W` | Typed input |

---

## Voice Commands

| Say | Does |
|-----|------|
| "Add milk to groceries" | Saves to Today |
| "Dentist appointment on Friday" | Saves to Friday |
| "Submit report next Monday" | Saves to next Monday |
| "Team meeting June 15" | Saves to June 15 |
| "Mark dentist done" | Marks task complete |
| "Delete last task" | Removes most recent entry |
| "Show my list" | Opens the calendar |
| "done" (while speaking) | Confirms the task |

---

## Windows Microphone Permission

For voice input to work, ensure quickDo has microphone access:

1. Open **Windows Settings** → **Privacy & Security** → **Microphone**
2. Make sure "Let desktop apps access your microphone" is **On**
3. Restart quickDo

---

## Development

```bash
# Clone
git clone https://github.com/your-repo/quickDo
cd quickDo

# Install dependencies
npm install

# Run in development
npm start

# Build .exe installer
npm run build
```

**Requirements:** Node.js 18+, Windows 10/11

---

## Build Phases

| Phase | What Was Built |
|-------|---------------|
| **Phase 1** | Core shell — floating shape, always-on-top, system tray, .exe installer |
| **Phase 2** | Typed input (Ctrl+Shift+W), task saving to local storage |
| **Phase 3** | Voice input (Ctrl+Shift), live transcription |
| **Phase 4** | AI date parsing — "next Monday", "June 15", etc. |
| **Phase 5** | Full calendar UI — scrollable timeline, task management |
| **Phase 6** | Polish — animations, visual design, edge case handling |

---

## Known Issues Fixed

- ✅ **Floating shape size** — fixed to 56×56px minimum, DPI-aware, never shrinks
- ✅ **Voice input live transcription** — uses `continuous=true` + `interimResults=true`, streams words in real time
- ✅ **Save button after date selection** — proper state flow: `text → parsedDate → confirmedDate → saveToStorage() → closeWindow()`

---

## Tech Stack

- **Electron** — native Windows desktop
- **Web Speech API** — live voice transcription (offline-capable)
- **chrono-node** — natural language date parsing
- **JSON file storage** — tasks stored locally in `%APPDATA%/quickDo`

---

## Roadmap (V2)

- 🔔 PC notifications / reminders
- 🍎 Mac & Linux support
- 🔄 Cross-device sync
- 🔁 Recurring tasks
- 🏷️ Tags (work, personal, shopping)
- 🌙 Dark / light theme toggle

---

## License

MIT — free to use, fork, and contribute.

---

*Made for people who think of things mid-flow and don't want to lose them.*
