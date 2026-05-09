// src/main/store.js
// Simple JSON-based local storage for tasks and app settings

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

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
      fs.writeFileSync(this.settingsPath, JSON.stringify(data, null, 2), 'utf-8');
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
    const tasks = this.getTasks();
    tasks.push(task);
    fs.writeFileSync(this.tasksPath, JSON.stringify(tasks, null, 2), 'utf-8');
  }

  updateTask(updated) {
    const tasks = this.getTasks();
    const idx = tasks.findIndex(t => t.id === updated.id);
    if (idx !== -1) {
      tasks[idx] = { ...tasks[idx], ...updated };
      fs.writeFileSync(this.tasksPath, JSON.stringify(tasks, null, 2), 'utf-8');
    }
  }

  deleteTask(id) {
    const tasks = this.getTasks().filter(t => t.id !== id);
    fs.writeFileSync(this.tasksPath, JSON.stringify(tasks, null, 2), 'utf-8');
  }
}

module.exports = Store;
