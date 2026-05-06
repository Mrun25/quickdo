/**
 * QuickDo — bubble.js  (repurposed as Pill / HUD controller)
 *
 * Manages the collapsed pill and the expand/collapse lifecycle.
 * Public API matches what app.js expects: Bubble.init()
 * Extra: Bubble.expand() / Bubble.collapse() called by modal.js
 */

'use strict';

const Bubble = (() => {

  let _expanded = false;

  // ── Expand (pill → full panel) ─────────────────────────────

  function expand(mode) {
    if (_expanded) return;
    _expanded = true;
    document.getElementById('app-root').classList.add('expanded');
    if (window.quickdoAPI) window.quickdoAPI.expandWindow();

    // Default to typed mode unless told otherwise
    if (mode === 'voice') {
      Modal.switchMode('voice');
      Voice.start();
      // ensure input-modal is open
      document.getElementById('input-modal').classList.add('open');
    } else {
      Modal.openTyped();
    }
  }

  // ── Collapse (full panel → pill) ──────────────────────────

  function collapse() {
    if (!_expanded) return;
    _expanded = false;
    document.getElementById('app-root').classList.remove('expanded');
    if (window.quickdoAPI) window.quickdoAPI.collapseWindow();
  }

  // ── Pill click + hover ─────────────────────────────────────

  function _initPill() {
    const pill = document.getElementById('pill');
    if (!pill) return;

    // Click → expand (typed)
    pill.addEventListener('click', () => expand('typed'));

    // Hover → expand (typed)
    // Panel stays open once opened; hover is just a convenience trigger.
    pill.addEventListener('mouseenter', () => expand('typed'));
  }

  // ── Collapse button inside panel ──────────────────────────

  function _initCollapseBtn() {
    const btn = document.getElementById('btn-collapse');
    if (!btn) return;
    btn.addEventListener('click', () => {
      Modal.closeAll();
      collapse();
    });
  }

  // ── Electron hotkey IPC ───────────────────────────────────

  function _initHotkeyBridge() {
    if (!window.quickdoAPI) return;
    window.quickdoAPI.onHotkey(mode => {
      expand(mode);
    });
  }

  // ── In-page keyboard shortcuts (when window is focused) ───

  function _initKeyboard() {
    // Track whether the *only* keys held are Ctrl+Shift (no other key struck).
    // We fire voice-expand on keyup of the modifier pair when that's the case.
    let _ctrlShiftOnly = false;

    document.addEventListener('keydown', e => {
      // If both modifiers held and no other key — arm the flag
      if (e.ctrlKey && e.shiftKey && e.key === 'Shift') {
        _ctrlShiftOnly = true;
        return;
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'Control') {
        // _ctrlShiftOnly already set or not; keep as-is
        return;
      }

      // Ctrl+Shift+Space → typed/write
      if (e.ctrlKey && e.shiftKey && e.key === ' ') {
        e.preventDefault();
        _ctrlShiftOnly = false; // consumed by Space
        expand('typed');
        return;
      }

      // Any other key while Ctrl+Shift held → not a bare Ctrl+Shift combo
      if (e.ctrlKey || e.shiftKey) {
        _ctrlShiftOnly = false;
      }

      // Escape → collapse
      if (e.key === 'Escape' && _expanded) {
        Modal.closeAll();
        collapse();
      }
    });

    document.addEventListener('keyup', e => {
      // When either modifier is released, check if it was a bare Ctrl+Shift
      if ((e.key === 'Control' || e.key === 'Shift') && _ctrlShiftOnly) {
        _ctrlShiftOnly = false;
        expand('voice');
      } else {
        _ctrlShiftOnly = false;
      }
    });
  }

  // ── Init ──────────────────────────────────────────────────

  function init() {
    _initPill();
    _initCollapseBtn();
    _initHotkeyBridge();
    _initKeyboard();
  }

  return { init, expand, collapse };
})();
