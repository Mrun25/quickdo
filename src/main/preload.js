// src/main/preload.js
// Secure bridge between main process and renderer windows

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('quickDo', {
  // Task operations
  parseTask: (text) => ipcRenderer.invoke('parse-task', text),
  saveTask: (data) => ipcRenderer.invoke('save-task', data),
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  updateTask: (task) => ipcRenderer.invoke('update-task', task),
  deleteTask: (id) => ipcRenderer.invoke('delete-task', id),

  // Window control
  resizeWidget: (expand, isConfirming) => ipcRenderer.send('resize-widget', expand, isConfirming),
  toggleWidget: () => ipcRenderer.send('toggle-widget'),
  hideWidget: () => ipcRenderer.send('hide-widget'),
  shapeRightClicked: () => ipcRenderer.send('shape-right-clicked'),
  moveShape: (x, y) => ipcRenderer.send('move-shape', x, y),

  // Listeners
  onTasksUpdated: (cb) => ipcRenderer.on('tasks-updated', cb),
  onTriggerVoice: (cb) => ipcRenderer.on('trigger-voice', cb),

  // Groq API Key
  getGroqKey: () => ipcRenderer.invoke('get-groq-key'),
  setGroqKey: (key) => ipcRenderer.invoke('set-groq-key', key),

  // Remove listener (optional, kept for compatibility if needed)
  removeTasksUpdatedListener: (cb) => ipcRenderer.removeListener('tasks-updated', cb),
});
