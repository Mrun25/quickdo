# QuickDo — Floating Task Widget

> Capture tasks in under 3 seconds. No app switching. No friction.

![QuickDo](assets/screenshot-placeholder.png)

QuickDo is a lightweight, always-on-top Windows desktop widget. It floats quietly on your screen. Press a hotkey, speak or type your task, confirm it — and it's gone. Your task lands in a built-in scrollable calendar, automatically sorted by the date you mentioned.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Floating bubble** | Always visible, draggable to any corner, zero branding |
| **Typed input** | `Ctrl+Shift+W` — minimal input bar, Enter to confirm |
| **Voice input** | `Ctrl+Shift` — live transcription, say "done" to confirm |
| **AI date parsing** | Understands "next Monday", "in 3 days", "June 15", and more |
| **Confirmation window** | Review task + date before saving |
| **Built-in calendar** | Scrollable timeline: past → today → upcoming |
| **Task management** | Check off, delete, or move tasks to any date |
| **Local storage** | All data stored on-device — no cloud, no account |
| **Open source** | MIT licence, GitHub-distributed |

---

## 🚀 Installation (Windows)

1. Download `QuickDo-setup.exe` from the [Releases](../../releases) page
2. Run the installer — no terminal, no dependencies
3. QuickDo starts automatically and appears in your system tray

> QuickDo starts with Windows on login (toggle in Settings).

---

## ⌨️ Hotkeys

| Hotkey | Action |
|---|---|
| `Ctrl + Shift` | Open voice input mode |
| `Ctrl + Shift + W` | Open typed input mode |
| `Enter` | Confirm and save task |
| `Esc` | Dismiss without saving |

---

## 🗣️ Voice commands

```
"Add milk to groceries"           → saves to Today
"Dentist appointment on Friday"   → saves to this Friday
"Submit report next Monday"       → saves to next Monday
"Team meeting June 15"            → saves to June 15
"Call dentist"                    → prompts: Today / Tomorrow / Pick date
```

---

## 📅 Smart date parsing

All input — voice or typed — passes through the same parser:

| Input | Resolved |
|---|---|
| `today` / `tonight` | Today |
| `tomorrow` | Tomorrow |
| `next Monday` | Following Monday |
| `this Thursday` / `Thursday` | Nearest Thursday |
| `in 5 days` | +5 days from today |
| `June 15` / `June 15th` | June 15 (next occurrence) |
| `15/06` | 15 June (next occurrence) |
| *(no date)* | Prompt: Today / Tomorrow / Pick date |

---

## 🏗️ Build Phases

| Phase | What was built | Status |
|---|---|---|
| 1 | App shell: floating bubble, always-on-top, draggable, tray icon | ✅ |
| 2 | Typed input, input bar UI, local task storage, task list | ✅ |
| 3 | Voice input, live transcription, confirmation window | ✅ |
| 4 | AI date parsing, smart calendar placement, ambiguity prompt | ✅ |
| 5 | Full calendar UI, scrollable timeline, task management | ✅ |
| 6 | Polish: animations, settings, edge cases, GitHub release | ✅ |

---

## 🗂️ Project Structure

```
quickdo/
├── index.html                  # Main entry point
├── src/
│   ├── core/
│   │   ├── app.js              # Main app controller
│   │   ├── dateParser.js       # NLP date parser (Phase 4)
│   │   └── taskStore.js        # Task CRUD + localStorage
│   ├── ui/
│   │   ├── bubble.js           # Floating bubble + drag + hotkeys
│   │   ├── calendar.js         # Calendar renderer (Phase 5)
│   │   ├── modal.js            # Input modal + confirmation
│   │   ├── voice.js            # Voice input (Phase 3)
│   │   └── styles.css          # Full stylesheet
│   └── utils/
│       ├── dateUtils.js        # Date helpers
│       └── toast.js            # Toast notifications
├── assets/                     # Icons, screenshots
├── installer/                  # Electron build config
│   ├── main.js                 # Electron main process
│   ├── preload.js              # Preload bridge
│   └── package.json            # Electron build manifest
├── docs/
│   ├── PRD.md                  # Product Requirements Document
│   └── ARCHITECTURE.md         # Technical architecture notes
├── package.json
└── README.md
```

---

## 🔧 Development

```bash
# Clone
git clone https://github.com/your-username/quickdo.git
cd quickdo

# Install dependencies
npm install

# Run in development (Electron)
npm run dev

# Build Windows installer
npm run build
```

---

## 🛣️ Roadmap (V2)

- [ ] PC notifications — remind at task time
- [ ] Recurring tasks — "every Monday"
- [ ] Tags / categories — work, personal, shopping
- [ ] Dark / light theme toggle
- [ ] Cross-platform — Mac and Linux
- [ ] Cross-device sync

---

## 📄 Licence

MIT — see [LICENSE](LICENSE)

---

## 🙌 Contributing

Pull requests welcome. Please open an issue first to discuss what you'd like to change.
