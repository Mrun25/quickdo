'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('quickdoAPI', {
  onHotkey: (callback) => {
    ipcRenderer.on('hotkey', (_event, mode) => callback(mode));
  },
  hideWindow: () => ipcRenderer.send('hide-window'),
  expandWindow: () => ipcRenderer.send('expand-window'),
  collapseWindow: () => ipcRenderer.send('collapse-window'),
  setWindowPosition: (x, y) => ipcRenderer.send('start-drag', { x, y }),
});
