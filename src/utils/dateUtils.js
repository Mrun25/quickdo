/**
 * QuickDo — dateUtils.js
 * Low-level date helpers used across the app.
 */

'use strict';

const DateUtils = (() => {

  /** Return today at midnight (local time). */
  function today() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /** ISO date string YYYY-MM-DD for a given Date. */
  function dateKey(d) {
    return d.toISOString().slice(0, 10);
  }

  /** Return a new Date offset by n days from d. */
  function addDays(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  }

  /**
   * Short human label for a date relative to today.
   * "Today", "Tomorrow", "Yesterday", weekday name, or "Jun 15"
   */
  function labelForDate(d) {
    const t = today();
    const diff = Math.round((d - t) / 86400000);
    if (diff === 0)  return 'Today';
    if (diff === 1)  return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (diff > 1 && diff < 7) return names[d.getDay()];
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /**
   * Verbose label: "Mon, Jun 15"
   */
  function fullLabel(d) {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Day-of-week name (lowercase).
   * 0 = sunday … 6 = saturday
   */
  function dayName(d) {
    return ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][d.getDay()];
  }

  return { today, dateKey, addDays, labelForDate, fullLabel, dayName };
})();
