# QuickDo — Product Requirements Document

**Version 1.0 · Windows Desktop · Open Source**

| Field | Value |
|---|---|
| Status | Draft |
| Platform | Windows (V1) |
| Distribution | .exe installer — GitHub open source |
| Last Updated | May 2026 |

---

## 1. Product Overview

The Floating Task Widget is a lightweight, always-on Windows desktop application. It lives as a small, subtle floating shape on your screen at all times. A hotkey activates it instantly. You speak or type a task, confirm it, and it logs to a built-in calendar — then disappears. No app switching, no open windows, no friction.

The core insight is simple: every other to-do tool makes you go to it. This one comes to you in under a second, captures what you need, and gets out of the way.

---

## 2. Goals & Non-Goals

### Goals
- Capture tasks in under 3 seconds without breaking focus
- Support both voice and typed input equally — neither is a fallback
- Auto-organise tasks into a scrollable calendar by parsed date
- Be visually minimal — present but never distracting
- Ship as a simple .exe installer — no setup, no dependencies
- Publish as open source on GitHub

### Non-Goals (V1)
- No cloud sync or cross-device support in V1
- No due-time reminders in V1 (V2 feature)
- Not a full project management or note-taking tool
- No mobile app in V1

---

## 3. Target User

Anyone who works at a PC and frequently thinks of things they need to do — but doesn't want to break their current task to open a planner. Developers, designers, writers, students, remote workers.

**Primary motivations:**
- They lose track of ideas and tasks mid-flow
- Existing tools feel too heavy to open just to add one item
- They want something that captures fast and organises quietly

---

## 4. Core Features

### 4.1 The Floating Shape
- Always visible on top of other windows
- Small, subtle — circle, pill, or soft rounded square
- No branding, no label, no logo on the shape itself
- Draggable to any corner or position on screen
- Opacity adjusts slightly on hover to signal interactivity

### 4.2 Activation Hotkeys

| Hotkey | Action |
|---|---|
| Ctrl + Shift | Activate voice input mode |
| Ctrl + Shift + W | Activate typed input mode |

### 4.3 Voice Input
- Press Ctrl+Shift — a small floating window appears near the shape
- A subtle recording indicator shows the app is listening
- Speech is transcribed live — user can see the text forming
- User says a natural phrase: task + optional date
- Say "done" or press Enter to confirm and save
- The window shows the confirmed task before closing

**Supported voice commands:**
- "Add milk to groceries" → saves to Today
- "Dentist appointment on Friday" → parses and saves to Friday
- "Submit report next Monday" → saves to next Monday
- "Team meeting June 15" → saves to June 15
- "Mark dentist done" → marks matching task complete
- "Delete last task" → removes most recent entry
- "Show my list" → opens the calendar view

### 4.4 Typed Input
- Press Ctrl+Shift+W — a minimal input bar appears near the shape
- User types their task naturally, same date-language as voice
- Press Enter to confirm — same parsing logic, same calendar placement
- Esc or click away to dismiss without saving

### 4.5 Smart Date Parsing
All input — voice or typed — passes through the same AI date parser. It understands:
- Relative dates: today, tomorrow, next week, in 3 days, in 5 days
- Named days: Monday, Friday, this Thursday
- Absolute dates: June 15, December 3rd, 15/06
- No date mentioned → soft prompt: Today / Tomorrow / Pick a date
- Every task date is editable at any time inside the calendar

### 4.6 Confirmation Window
- After speaking or typing, a small floating window shows the captured task
- User cross-checks: task name + assigned date
- Options: Confirm / Edit / Cancel
- On confirm — task saves, window closes cleanly

### 4.7 Built-in Calendar
- Opens as a floating window — clean, minimal design
- Scrollable timeline: Past → Today → Upcoming (no date limit)
- Each day shows its tasks as a simple list
- Tasks can be checked off, deleted, or moved to another date
- Past days are read-only reference — not editable
- Today's view is the default when calendar opens

---

## 5. Date Handling Logic

**Layer 1 — Auto-parse:** If a date is clearly mentioned in the input, place the task there silently.

**Layer 2 — Gentle prompt on ambiguity:** If no date is mentioned, the confirmation window asks: "When should this be scheduled?" → Today / Tomorrow / Pick a date

**Layer 3 — Always editable:** Every task shows its date tag inside the calendar. The user can tap it to reassign to any date at any time.

---

## 6. Build Phases

| Phase | What Gets Built | Goal |
|---|---|---|
| 1 | Core shell: floating shape, always-on-top, draggable, system tray, .exe | Working app that lives on desktop |
| 2 | Typed input (Ctrl+Shift+W), input bar UI, local storage, task list | You can add and see tasks |
| 3 | Voice input (Ctrl+Shift), live transcription, confirmation window | Both input modes work |
| 4 | AI date parsing, smart calendar placement, ambiguity prompt, date edit | Tasks land on the right day |
| 5 | Full calendar UI, scrollable timeline, task management (check, delete, move) | Calendar is fully usable |
| 6 | Polish: animations, visual design, settings, edge cases | Ready for GitHub release |
| V2 | PC notifications, cross-platform, cross-device sync | Scale up |

---

## 7. Technical Notes
- Native Windows executable — no browser, no terminal
- Voice transcription works offline where possible (Whisper)
- AI date parsing uses lightweight local logic — speed over sophistication
- All task data stored locally — JSON / localStorage (SQLite in V2)
- Starts on Windows startup (optional toggle)
- Minimal memory footprint — lives in background 24/7

---

## 8. Distribution
- Packaged as a standard Windows .exe installer
- Published on GitHub as open-source
- README includes: what it is, how to install, screenshots/GIF demo

---

## 9. Future Roadmap (Post V1)
- PC notifications — remind at set time
- Cross-platform — Mac and Linux
- Cross-device sync
- Recurring tasks — "every Monday"
- Tags / categories
- Dark / light theme toggle
