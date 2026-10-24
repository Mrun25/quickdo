// src/main/store.js
// Simple JSON-based local storage for tasks and app settings

const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { randomUUID } = require('crypto');

class Store {
  constructor() {
    const userDataPath = app.getPath('userData');
    this.settingsPath = path.join(userDataPath, 'settings.json');
    this.tasksPath = path.join(userDataPath, 'tasks.json');
    this._ensureFiles();
  }

  _ensureFiles() {
    if (!fs.existsSync(this.settingsPath)) {
      fs.writeFileSync(this.settingsPath, JSON.stringify({}), 'utf-8');
    }
    if (!fs.existsSync(this.tasksPath)) {
      fs.writeFileSync(this.tasksPath, JSON.stringify([]), 'utf-8');
    }
  }

  // Stage a complete document beside the target before replacing it. This
  // protects the previous file from partial writes, not from power loss.
  _writeJson(filePath, value) {
    const serialized = JSON.stringify(value, null, 2);
    const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
    try {
      fs.writeFileSync(temporaryPath, serialized, { encoding: 'utf-8', flag: 'wx' });
      fs.renameSync(temporaryPath, filePath);
    } finally {
      if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
    }
  }

  _readTasksForWrite() {
    const tasks = JSON.parse(fs.readFileSync(this.tasksPath, 'utf-8'));
    if (!Array.isArray(tasks)) throw new Error('Task storage must contain an array');
    return tasks;
  }

  // Settings

  get(key) {
    try {
      const data = JSON.parse(fs.readFileSync(this.settingsPath, 'utf-8'));
      return data[key];
    } catch {
      return undefined;
    }
  }

  set(key, value) {
    try {
      const data = JSON.parse(fs.readFileSync(this.settingsPath, 'utf-8'));
      data[key] = value;
      this._writeJson(this.settingsPath, data);
    } catch (e) {
      console.error('Store set error:', e);
    }
  }

  // Tasks — synchronous writes (Phase 3 fix: never close before write completes)

  getTasks() {
    try {
      return JSON.parse(fs.readFileSync(this.tasksPath, 'utf-8'));
    } catch {
      return [];
    }
  }

  addTask(task) {
    const tasks = this._readTasksForWrite();
    tasks.push(task);
    this._writeJson(this.tasksPath, tasks);
  }

  updateTask(updated) {
    const tasks = this._readTasksForWrite();
    const idx = tasks.findIndex(t => t.id === updated.id);
    if (idx !== -1) {
      tasks[idx] = { ...tasks[idx], ...updated };
      this._writeJson(this.tasksPath, tasks);
    }
  }

  deleteTask(id) {
    const tasks = this._readTasksForWrite().filter(t => t.id !== id);
    this._writeJson(this.tasksPath, tasks);
  }
}

module.exports = Store;
