/**
 * QuickDo — installer/main.js
 * Electron main process (Windows desktop build).
 *
 * Pill HUD mode:
 *   • Starts as a 300×52 pill (collapsed) — top-right of screen
 *   • Expands to 480×640 panel on hover / click / hotkey
 *   • Collapses back after save / cancel / Escape
 *
 * Fix: app.disableHardwareAcceleration() must be called BEFORE app.whenReady()
 * to make transparent frameless windows visible on Windows (DWM compositing bug).
 */

'use strict';

const {
  app,
  BrowserWindow,
  globalShortcut,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
} = require('electron');

const path = require('path');

// ── CRITICAL: disable GPU before app ready ─────────────────────
// Without this, transparent + frameless windows are completely
// invisible on many Windows systems due to DWM compositing failure.
app.disableHardwareAcceleration();

// ── Size constants ─────────────────────────────────────────────
const PILL = { w: 60, h: 60  };
const FULL = { w: 480, h: 640 };

let mainWindow = null;
let tray       = null;

// ── Window ─────────────────────────────────────────────────────

function createWindow() {
  const { screen } = require('electron');
  const { width } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width:       PILL.w,
    height:      PILL.h,
    x:           width - PILL.w - 20,
    y:           20,
    frame:       false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable:   false,
    movable:     true,
    hasShadow:   false,
    show:        false,       // show only after content loads
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  mainWindow.setAlwaysOnTop(true, 'screen-saver');

  // Show only once the page has fully painted — no blank flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Hotkeys ────────────────────────────────────────────────────

function registerHotkeys() {
  // Ctrl+Shift+A → Voice input  (bare Ctrl+Shift can't be registered globally)
  globalShortcut.register('CommandOrControl+Shift+A', () => {
    if (mainWindow) {
      _expandWindow();
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('hotkey', 'voice');
    }
  });

  // Ctrl+Shift+Space → Typed / Write input
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (mainWindow) {
      _expandWindow();
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('hotkey', 'typed');
    }
  });
}

// ── Tray ───────────────────────────────────────────────────────

function createTray() {
  let icon;
  try {
    const iconPath = path.join(__dirname, '..', 'assets', 'icon.ico');
    icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    if (icon.isEmpty()) throw new Error('empty icon');
  } catch (e) {
    // Fallback: 1×1 transparent PNG — tray creation never crashes
    icon = nativeImage.createFromDataURL(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    );
  }
  tray = new Tray(icon);
  tray.setToolTip('QuickDo');

  const menu = Menu.buildFromTemplate([
    { label: 'Show QuickDo',                    click: () => mainWindow && mainWindow.show()  },
    { label: 'Write input  (Ctrl+Shift+Space)',  click: () => { _expandWindow(); mainWindow && mainWindow.webContents.send('hotkey', 'typed'); } },
    { label: 'Voice input  (Ctrl+Shift+A)',      click: () => { _expandWindow(); mainWindow && mainWindow.webContents.send('hotkey', 'voice'); } },
    { type:  'separator' },
    { label: 'Start with Windows', type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => { app.setLoginItemSettings({ openAtLogin: item.checked }); }
    },
    { type:  'separator' },
    { label: 'Quit QuickDo', click: () => app.quit() },
  ]);

  tray.setContextMenu(menu);
  tray.on('click', () => mainWindow && mainWindow.show());
}

// ── Resize helpers ─────────────────────────────────────────────

function _expandWindow() {
  if (!mainWindow) return;
  const { screen } = require('electron');
  const { width } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow.setResizable(true);
  mainWindow.setSize(FULL.w, FULL.h);
  mainWindow.setResizable(false);
  mainWindow.setPosition(width - FULL.w - 20, 20);
}

function _collapseWindow() {
  if (!mainWindow) return;
  const { screen } = require('electron');
  const { width } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow.setResizable(true);
  mainWindow.setSize(PILL.w, PILL.h);
  mainWindow.setResizable(false);
  mainWindow.setPosition(width - PILL.w - 20, 20);
}

// ── IPC ────────────────────────────────────────────────────────

function bindIpc() {
  ipcMain.on('hide-window',      () => { if (mainWindow) mainWindow.hide(); });
  ipcMain.on('expand-window',    () => _expandWindow());
  ipcMain.on('collapse-window',  () => _collapseWindow());

  // Frameless drag: renderer sends desired screen coords
  ipcMain.on('start-drag', (e, { x, y }) => {
    if (mainWindow) mainWindow.setPosition(x, y);
  });
}

// ── App lifecycle ──────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();
  createTray();
  registerHotkeys();
  bindIpc();

  // Auto-start with Windows — always present like Wispr Flow
  app.setLoginItemSettings({ openAtLogin: true });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Keep running in tray when all windows closed
app.on('window-all-closed', e => e.preventDefault());
