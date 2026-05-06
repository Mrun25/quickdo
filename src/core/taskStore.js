/**
 * QuickDo — taskStore.js
 * Phase 2 / 5: In-memory task store with localStorage persistence.
 *
 * Each task:
 * {
 *   id:    number,
 *   text:  string,
 *   date:  Date,
 *   done:  boolean,
 *   created: number  (timestamp)
 * }
 */

'use strict';

const TaskStore = (() => {

  const STORAGE_KEY = 'quickdo_tasks';
  let tasks  = [];
  let nextId = 1;

  // ── Persistence ────────────────────────────────────────────

  function _serialize() {
    return JSON.stringify(
      tasks.map(t => ({
        ...t,
        date: t.date.toISOString(),
      }))
    );
  }

  function _deserialize(raw) {
    try {
      const arr = JSON.parse(raw);
      return arr.map(t => ({
        ...t,
        date: new Date(t.date),
      }));
    } catch {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, _serialize());
    } catch (e) {
      console.warn('QuickDo: could not save to localStorage', e);
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        tasks  = _deserialize(raw);
        nextId = tasks.reduce((max, t) => Math.max(max, t.id + 1), 1);
      }
    } catch (e) {
      console.warn('QuickDo: could not load from localStorage', e);
    }
  }

  // ── CRUD ───────────────────────────────────────────────────

  /**
   * Add a new task. Returns the created task object.
   * @param {string} text
   * @param {Date}   date
   * @returns {object}
   */
  function addTask(text, date) {
    const task = {
      id:      nextId++,
      text:    text.trim(),
      date:    new Date(date),
      done:    false,
      created: Date.now(),
    };
    tasks.push(task);
    save();
    return task;
  }

  /**
   * Toggle the done state of a task by id.
   * Returns the updated task or null if not found.
   */
  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return null;
    task.done = !task.done;
    save();
    return task;
  }

  /**
   * Delete a task by id.
   * Returns true if deleted, false if not found.
   */
  function deleteTask(id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return false;
    tasks.splice(idx, 1);
    save();
    return true;
  }

  /**
   * Move a task to a new date.
   * Returns the updated task or null.
   */
  function moveTask(id, newDate) {
    const task = tasks.find(t => t.id === id);
    if (!task) return null;
    task.date = new Date(newDate);
    save();
    return task;
  }

  /**
   * Update a task's text.
   */
  function updateText(id, newText) {
    const task = tasks.find(t => t.id === id);
    if (!task) return null;
    task.text = newText.trim();
    save();
    return task;
  }

  // ── Queries ────────────────────────────────────────────────

  /** All tasks (reference — do not mutate). */
  function getAll() { return tasks; }

  /** Tasks for a specific ISO date string key (YYYY-MM-DD). */
  function getByDateKey(key) {
    return tasks.filter(t => DateUtils.dateKey(t.date) === key);
  }

  /** Count of incomplete tasks. */
  function pendingCount() {
    return tasks.filter(t => !t.done).length;
  }

  /** Count of incomplete tasks due today. */
  function todayCount() {
    const key = DateUtils.dateKey(DateUtils.today());
    return tasks.filter(t => !t.done && DateUtils.dateKey(t.date) === key).length;
  }

  // ── Seed (demo data) ───────────────────────────────────────

  function seedDemo() {
    if (tasks.length > 0) return; // don't re-seed if data already exists
    const t = DateUtils.today();
    const samples = [
      { text: 'Review PRD doc',           date: DateUtils.addDays(t, -1), done: true  },
      { text: 'Set up project repo',      date: t,                        done: true  },
      { text: 'Build floating shell',     date: t,                        done: false },
      { text: 'Weekly sync with team',    date: DateUtils.addDays(t, 1),  done: false },
      { text: 'Submit design mockups',    date: DateUtils.addDays(t, 2),  done: false },
      { text: 'Write README',             date: DateUtils.addDays(t, 5),  done: false },
    ];
    samples.forEach(s => {
      tasks.push({ id: nextId++, ...s, created: Date.now() });
    });
    save();
  }

  // ── Init ───────────────────────────────────────────────────

  function init() {
    load();
    seedDemo();
  }

  return {
    init,
    addTask,
    toggleTask,
    deleteTask,
    moveTask,
    updateText,
    getAll,
    getByDateKey,
    pendingCount,
    todayCount,
  };
})();
