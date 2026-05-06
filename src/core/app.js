/**
 * QuickDo — app.js
 * Main application controller.
 *
 * Load order (see index.html):
 *   dateUtils.js → dateParser.js → taskStore.js →
 *   calendar.js → modal.js → voice.js → bubble.js → app.js
 */

'use strict';

const App = (() => {

  // ── Status bar ─────────────────────────────────────────────

  function updateStats() {
    const total   = TaskStore.pendingCount();
    const todayCt = TaskStore.todayCount();

    const el = document.getElementById('stat-total');
    if (el) el.textContent = total + ' task' + (total !== 1 ? 's' : '');

    const el2 = document.getElementById('stat-today');
    if (el2) el2.textContent = todayCt + ' task' + (todayCt !== 1 ? 's' : '');
  }

  // ── Boot ───────────────────────────────────────────────────

  function init() {
    TaskStore.init();   // load from localStorage, seed demo data
    Calendar.init();    // render calendar + bind nav
    Modal.init();       // bind modal events
    Voice.init();       // bind voice indicator
    Bubble.init();      // pill + hotkeys
    updateStats();
  }

  // Kick off once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { updateStats };
})();
