/**
 * QuickDo — toast.js
 * Phase 6: Lightweight toast notification system.
 */

'use strict';

const Toast = (() => {
  let hideTimer = null;

  /**
   * Display a toast message.
   * @param {string} msg
   * @param {number} duration  ms before auto-hide (default 2200)
   */
  function show(msg, duration = 2200) {
    const el = document.getElementById('toast');
    if (!el) return;

    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }

    el.textContent = msg;
    el.classList.add('show');

    hideTimer = setTimeout(() => {
      el.classList.remove('show');
      hideTimer = null;
    }, duration);
  }

  return { show };
})();
