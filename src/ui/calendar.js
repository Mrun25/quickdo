/**
 * QuickDo — calendar.js
 * Phase 5: Scrollable calendar renderer.
 *
 * Renders a timeline of days (past → today → upcoming)
 * with task lists per day. Supports:
 *   • Check-off tasks
 *   • Delete tasks
 *   • Move tasks to another date
 */

'use strict';

const Calendar = (() => {

  let calendarOffset = 0;   // days scrolled from "base" view
  let moveTargetId   = null;

  // ── Public API ─────────────────────────────────────────────

  function render() {
    const body = document.getElementById('cal-body');
    if (!body) return;
    body.innerHTML = '';

    const t     = DateUtils.today();
    const start = DateUtils.addDays(t, -2 + calendarOffset);

    for (let i = 0; i < 16; i++) {
      const day = DateUtils.addDays(start, i);
      body.appendChild(_buildDaySection(day, t));
    }

    // Scroll "Today" into view on initial render
    if (calendarOffset === 0) {
      setTimeout(() => {
        const sections = body.querySelectorAll('.cal-day-section');
        if (sections[2]) sections[2].scrollIntoView({ block: 'start', behavior: 'smooth' });
      }, 60);
    }
  }

  function scrollBy(direction) {
    calendarOffset += direction * 3;
    render();
  }

  function resetScroll() {
    calendarOffset = 0;
    render();
  }

  // ── Private helpers ────────────────────────────────────────

  function _buildDaySection(day, today) {
    const key     = DateUtils.dateKey(day);
    const isToday = key === DateUtils.dateKey(today);
    const isPast  = day < today;
    const tasks   = TaskStore.getByDateKey(key);

    const section = _el('div', 'cal-day-section');

    // Header
    const header  = _el('div', 'cal-day-header');
    const dayName = _el('div', 'cal-day-name' + (isToday ? ' today' : ''));
    dayName.textContent = isToday
      ? '▶ Today'
      : day.toLocaleDateString('en-US', { weekday: 'short' }) + (isPast ? ' (past)' : '');

    const right     = _el('div', 'day-right');
    const dateSpan  = _el('div', 'cal-day-date');
    dateSpan.textContent = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const countBadge = _el('div', 'day-count' + (tasks.length ? ' has-tasks' : ''));
    countBadge.textContent = tasks.length || '—';

    right.append(dateSpan, countBadge);
    header.append(dayName, right);
    section.appendChild(header);

    // Tasks list
    const list = _el('div', 'cal-tasks-list');
    if (tasks.length === 0) {
      const empty = _el('div', 'empty-day');
      empty.textContent = isToday
        ? 'No tasks — add one with Ctrl+Shift'
        : '—';
      list.appendChild(empty);
    } else {
      tasks.forEach(task => list.appendChild(_buildTaskItem(task)));
    }
    section.appendChild(list);

    return section;
  }

  function _buildTaskItem(task) {
    const item = _el('div', 'task-item' + (task.done ? ' done' : ''));
    item.dataset.id = task.id;

    // Checkbox
    const check = _el('div', 'task-check');
    check.title = task.done ? 'Mark incomplete' : 'Mark complete';
    check.addEventListener('click', () => {
      TaskStore.toggleTask(task.id);
      render();
      App.updateStats();
      Toast.show(task.done ? 'Marked incomplete' : '✓ Done!');
    });

    // Text
    const text = _el('div', 'task-text');
    text.textContent = task.text;

    // Move button
    const moveBtn = _el('button', 'task-move');
    moveBtn.textContent = '↻';
    moveBtn.title = 'Move to another date';
    moveBtn.addEventListener('click', e => {
      e.stopPropagation();
      _showMovePicker(task.id);
    });

    // Delete button
    const del = _el('button', 'task-del');
    del.textContent = '✕';
    del.title = 'Delete task';
    del.addEventListener('click', () => {
      TaskStore.deleteTask(task.id);
      render();
      App.updateStats();
      Toast.show('Task removed');
    });

    item.append(check, text, moveBtn, del);
    return item;
  }

  function _showMovePicker(taskId) {
    moveTargetId = taskId;
    const picker = document.getElementById('move-picker');
    picker.classList.add('open');
  }

  function _hidePicker() {
    const picker = document.getElementById('move-picker');
    picker.classList.remove('open');
    moveTargetId = null;
  }

  function _handleMoveOption(choice) {
    _hidePicker();
    if (choice === 'cancel_move' || !moveTargetId) return;

    const t = DateUtils.today();
    const dateMap = {
      today:     t,
      tomorrow:  DateUtils.addDays(t, 1),
      next_week: DateUtils.addDays(t, 7),
    };
    const newDate = dateMap[choice];
    if (!newDate) return;

    const task = TaskStore.moveTask(moveTargetId, newDate);
    if (task) {
      render();
      Toast.show('Task rescheduled → ' + DateUtils.labelForDate(task.date));
    }
    moveTargetId = null;
  }

  // ── Wire up move-picker buttons ────────────────────────────

  function _bindMovePicker() {
    document.getElementById('move-picker').addEventListener('click', e => {
      const opt = e.target.closest('[data-move]');
      if (opt) _handleMoveOption(opt.dataset.move);
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!e.target.closest('#move-picker') && !e.target.closest('.task-move')) {
        document.getElementById('move-picker').classList.remove('open');
        moveTargetId = null;
      }
    });

    // Calendar nav buttons
    document.getElementById('cal-up').addEventListener('click',   () => scrollBy(-1));
    document.getElementById('cal-down').addEventListener('click', () => scrollBy(1));
  }

  // ── Init ───────────────────────────────────────────────────

  function init() {
    _bindMovePicker();
    render();
  }

  // ── Tiny DOM helper ────────────────────────────────────────
  function _el(tag, cls) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    return el;
  }

  return { init, render, scrollBy, resetScroll };
})();
