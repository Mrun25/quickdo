/**
 * QuickDo — modal.js
 *
 * Manages:
 *   • Input modal (typed mode)
 *   • Live date-parse preview
 *   • Date ambiguity prompt
 *   • Direct saving
 */

'use strict';

const Modal = (() => {

  // Shared pending-task state set by this module and Voice module
  let pendingTask = null;   // { text, date, dateLabel }

  // ── Public API ─────────────────────────────────────────────

  function openTyped() {
    document.getElementById('input-modal').classList.add('open');
    _switchMode('type');
    setTimeout(() => document.getElementById('task-input').focus(), 50);
  }

  function closeModal() {
    document.getElementById('input-modal').classList.remove('open');
    document.getElementById('task-input').value = '';
    _hideParsedPreview();
    _hideDatePrompt();
    pendingTask = null;
  }

  function closeAll() {
    closeModal();
    // Collapse HUD back to pill
    if (typeof Bubble !== 'undefined') Bubble.collapse();
  }

  /** Called by Voice module to set the pending task externally. */
  function setPending(taskObj) {
    pendingTask = taskObj;
  }

  function getPending() { return pendingTask; }

  // ── Live parsed preview ────────────────────────────────────

  function updateParsedPreview(rawText) {
    if (!rawText.trim()) {
      _hideParsedPreview();
      _hideDatePrompt();
      pendingTask = null;
      return;
    }

    const parsed = DateParser.parse(rawText);
    if (parsed) {
      const clean = parsed.clean || rawText;
      pendingTask = { text: clean, date: parsed.date, dateLabel: parsed.label };

      document.getElementById('parsed-task-text').textContent = clean;
      document.getElementById('parsed-date-text').textContent = parsed.label;
      _showParsedPreview();
      _hideDatePrompt();
    } else {
      const clean = DateParser.stripFiller(rawText);
      pendingTask = { text: clean, date: null, dateLabel: null };
      _hideParsedPreview();
      // Don't show date-prompt while typing — only on Confirm
    }
  }

  // ── Date prompt ────────────────────────────────────────────

  function pickDate(choice, customDateStr = null) {
    let d;
    let label;
    const t = DateUtils.today();
    
    if (choice === 'today') {
      d = t;
      label = 'Today';
    } else if (choice === 'tomorrow') {
      d = DateUtils.addDays(t, 1);
      label = 'Tomorrow';
    } else if (choice === 'custom' && customDateStr) {
      // Input date is YYYY-MM-DD
      const parts = customDateStr.split('-');
      d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      label = DateUtils.labelForDate(d);
    } else {
      return;
    }

    if (!pendingTask) return;

    pendingTask.date = d;
    pendingTask.dateLabel = label;

    document.getElementById('parsed-task-text').textContent = pendingTask.text;
    document.getElementById('parsed-date-text').textContent = label;
    _hideDatePrompt();
    _showParsedPreview();
    
    // Automatically save right after picking the date
    saveTask();
  }

  // ── Confirm / Save ─────────────────────────────────────────

  function saveTask() {
    // In typed mode, first process whatever is in the textarea
    const modeEl = document.getElementById('type-mode');
    if (modeEl && modeEl.style.display !== 'none') {
      const raw = document.getElementById('task-input').value.trim();
      if (!raw) { Toast.show('Type something first'); return; }
      updateParsedPreview(raw);
    }

    if (!pendingTask) { Toast.show('Type your task first'); return; }
    if (!pendingTask.date) { _showDatePrompt(); return; }

    const task = TaskStore.addTask(pendingTask.text, pendingTask.date);
    pendingTask = null;
    Calendar.render();
    if (typeof App !== 'undefined' && App.updateStats) App.updateStats();
    Toast.show('✓ Task saved — ' + DateUtils.labelForDate(task.date));
    
    closeAll();
  }

  // ── Mode switch (Typed / Voice) ────────────────────────────

  function switchMode(mode) { _switchMode(mode); }

  function _switchMode(mode) {
    document.getElementById('tab-type').classList.toggle('active', mode === 'type');
    document.getElementById('tab-voice').classList.toggle('active', mode === 'voice');
    document.getElementById('type-mode').style.display  = mode === 'type'  ? '' : 'none';
    document.getElementById('voice-mode').style.display = mode === 'voice' ? '' : 'none';
    _hideParsedPreview();
    _hideDatePrompt();
  }

  // ── Private helpers ────────────────────────────────────────

  function _showParsedPreview() {
    document.getElementById('parsed-preview').classList.add('visible');
  }
  function _hideParsedPreview() {
    document.getElementById('parsed-preview').classList.remove('visible');
  }
  function _showDatePrompt() {
    document.getElementById('date-prompt').classList.add('visible');
  }
  function _hideDatePrompt() {
    document.getElementById('date-prompt').classList.remove('visible');
  }

  // ── Event binding ──────────────────────────────────────────

  function init() {
    // Textarea live input
    document.getElementById('task-input').addEventListener('input', e => {
      updateParsedPreview(e.target.value);
    });

    // Textarea keyboard shortcuts
    document.getElementById('task-input').addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveTask(); }
      if (e.key === 'Escape') closeModal();
    });

    // Mode tabs
    document.getElementById('tab-type').addEventListener('click',  () => _switchMode('type'));
    document.getElementById('tab-voice').addEventListener('click', () => {
      _switchMode('voice');
      if (typeof Voice !== 'undefined') Voice.start();
    });

    // Date option buttons
    document.querySelectorAll('[data-pick]').forEach(btn => {
      btn.addEventListener('click', () => pickDate(btn.dataset.pick));
    });
    
    // Custom date picker
    const datePicker = document.getElementById('custom-date-picker');
    if (datePicker) {
      datePicker.addEventListener('change', (e) => {
        if (e.target.value) {
          pickDate('custom', e.target.value);
          e.target.value = ''; // Reset for next time
        }
      });
    }

    // Modal actions
    document.getElementById('btn-save-task').addEventListener('click', saveTask);
    document.getElementById('btn-cancel-modal').addEventListener('click', closeAll);
  }

  return {
    init,
    openTyped,
    closeModal,
    closeAll,
    saveTask,
    switchMode,
    updateParsedPreview,
    setPending,
    getPending,
    pickDate,
  };
})();
