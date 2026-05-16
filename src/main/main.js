// src/main/main.js
// quickDo — Main Process
// Unified Widget Edition

const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, screen, nativeImage, session } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('./store');
const DateParser = require('./dateParser');
const Scheduler = require('./scheduler');

let floatingShape = null;
let widgetWindow = null;
let tray = null;
const store = new Store();
const scheduler = new Scheduler(store);

// ─── App Ready ───────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true); // Allow microphone access
    } else {
      callback(false);
    }
  });

  createFloatingShape();
  createWidgetWindow();
  createTray();
  registerHotkeys();

  scheduler.start();
  // Delay startup summary slightly so Windows notification system is ready
  setTimeout(() => scheduler.triggerStartupSummary(), 2000);
});

app.on('window-all-closed', (e) => {
  e.preventDefault(); // Keep running in tray
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// ─── Floating Hub ────────────────────────────────────────────────────────────

function createFloatingShape() {
  let savedPos = store.get('shapePosition') || { x: null, y: null };
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;

  // Safety boundary check: if off-screen, reset position
  if (savedPos.x !== null && (savedPos.x < 0 || savedPos.x > sw || savedPos.y < 0 || savedPos.y > sh)) {
    savedPos = { x: sw - 60, y: sh - 60 };
  }

  const x = savedPos.x ?? sw - 60;
  const y = savedPos.y ?? sh - 60;

  floatingShape = new BrowserWindow({
    width: 46,
    height: 46,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  floatingShape.loadFile(path.join(__dirname, '../renderer/shape.html'));
  floatingShape.setAlwaysOnTop(true, 'floating');
  floatingShape.setVisibleOnAllWorkspaces(true);

  // Save position on move
  floatingShape.on('moved', () => {
    const [nx, ny] = floatingShape.getPosition();
    store.set('shapePosition', { x: nx, y: ny });
  });
}

// ─── Unified Widget ──────────────────────────────────────────────────────────

function createWidgetWindow() {
  const savedPos = store.get('widgetPosition') || { x: null, y: null };
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;

  const w = 400;
  const h = 60; // compact height

  const x = savedPos.x ?? sw - w - 20;
  const y = savedPos.y ?? sh - h - 20;

  widgetWindow = new BrowserWindow({
    width: w,
    height: h,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    icon: path.join(__dirname, '../../assets/icon.png'),
    resizable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  widgetWindow.loadFile(path.join(__dirname, '../renderer/widget.html'));
  widgetWindow.setAlwaysOnTop(true, 'floating');
  widgetWindow.setVisibleOnAllWorkspaces(true);

  // Save position on move
  widgetWindow.on('moved', () => {
    const [nx, ny] = widgetWindow.getPosition();
    store.set('widgetPosition', { x: nx, y: ny });
  });
}

// ─── System Tray ─────────────────────────────────────────────────────────────

function createTray() {
  const iconPath = path.join(__dirname, '../../assets/icon.png');
  let trayIcon = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : nativeImage.createEmpty();

  tray = new Tray(trayIcon);
  tray.setToolTip('quickDo');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Widget', click: () => { if (widgetWindow) widgetWindow.show(); } },
    { type: 'separator' },
    { label: 'Start with Windows', type: 'checkbox', checked: store.get('startWithWindows') || false,
      click: (item) => {
        store.set('startWithWindows', item.checked);
        app.setLoginItemSettings({ openAtLogin: item.checked });
      }
    },
    { type: 'separator' },
    { label: 'Quit quickDo', click: () => { app.exit(0); } }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => { if (widgetWindow) widgetWindow.show(); });
}

// ─── Hotkeys ─────────────────────────────────────────────────────────────────

function registerHotkeys() {
  // Focus Widget / Expand
  globalShortcut.register('CommandOrControl+Shift+W', () => {
    if (widgetWindow) {
      if (!widgetWindow.isVisible()) widgetWindow.show();
      widgetWindow.focus();
    }
  });

  globalShortcut.register('CommandOrControl+Shift+V', () => {
    if (widgetWindow) {
      if (!widgetWindow.isVisible()) widgetWindow.show();
      widgetWindow.focus();
      widgetWindow.webContents.send('trigger-voice');
    }
  });
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

ipcMain.on('toggle-widget', () => {
  if (widgetWindow) {
    if (widgetWindow.isVisible()) {
      widgetWindow.hide();
    } else {
      if (floatingShape) {
        const [hx, hy] = floatingShape.getPosition();
        const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
        const ww = widgetWindow.getBounds().width;
        const wh = widgetWindow.getBounds().height;
        
        // Position slightly above and aligned right with the hub
        let newX = hx - ww + 30;
        let newY = hy - wh - 10;

        newX = Math.max(10, Math.min(newX, sw - ww - 10));
        newY = Math.max(10, Math.min(newY, sh - wh - 10));

        widgetWindow.setPosition(newX, newY);
      }
      widgetWindow.show();
      widgetWindow.focus();
    }
  }
});

ipcMain.on('hide-widget', () => {
  if (widgetWindow) widgetWindow.hide();
});

ipcMain.on('shape-right-clicked', () => {
  if (tray) tray.popUpContextMenu();
});

ipcMain.on('move-shape', (event, x, y) => {
  if (floatingShape) {
    floatingShape.setPosition(x, y);
  }
});

// Resize widget (compact vs calendar)
ipcMain.on('resize-widget', (event, expand, isConfirming) => {
  if (!widgetWindow) return;
  const [x, y] = widgetWindow.getPosition();
  if (!expand && !isConfirming) {
    widgetWindow.setBounds({ x, y, width: 400, height: 60 });
  } else if (isConfirming && !expand) {
    widgetWindow.setBounds({ x, y, width: 400, height: 260 });
  } else {
    const height = isConfirming ? 660 : 460;
    widgetWindow.setBounds({ x, y, width: 400, height });
  }
});

ipcMain.handle('parse-task', async (event, text) => {
  return DateParser.parse(text);
});

ipcMain.handle('save-task', async (event, { text, date, exactTime }) => {
  if (!text || !date) return { success: false, error: 'Missing text or date' };
  try {
    const task = {
      id: Date.now().toString(),
      text: text.trim(),
      date,
      exactTime: exactTime || null,
      completed: false,
      createdAt: new Date().toISOString()
    };
    store.addTask(task);
    return { success: true, task };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-tasks', async () => {
  return store.getTasks();
});

ipcMain.handle('update-task', async (event, task) => {
  store.updateTask(task);
  return { success: true };
});

ipcMain.handle('delete-task', async (event, id) => {
  store.deleteTask(id);
  return { success: true };
});

ipcMain.handle('get-groq-key', async () => {
  const userKey = store.get('groqApiKey');
  if (userKey) return userKey;
  const k1 = "gsk_aHnTkqR8SJWruqo";
  const k2 = "4DQrxWGdyb3FYkTEOdukk9R8LUaeWKurVgkRV";
  return k1 + k2;
});

ipcMain.handle('set-groq-key', async (event, key) => {
  store.set('groqApiKey', key);
  return { success: true };
});
