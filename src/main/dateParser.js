// src/main/dateParser.js
// Phase 4 — Smart date parsing for natural language task input
// Uses chrono-node for robust relative/absolute date parsing

let chrono;
try {
  chrono = require('chrono-node');
} catch {
  chrono = null;
}

class DateParser {
  /**
   * Parse a natural language task string.
   * Returns: { text: string, date: string|null, hasDate: boolean }
   * date is ISO date string (YYYY-MM-DD) or null if ambiguous
   */
  static parse(input) {
    if (!input || typeof input !== 'string') {
      return { text: input, date: null, hasDate: false };
    }

    const now = new Date();
    const today = this._toDateStr(now);

    // Handle special voice commands
    const lower = input.trim().toLowerCase();

    if (lower.startsWith('mark ') && lower.includes(' done')) {
      return { text: input, date: null, hasDate: false, command: 'mark-done', target: lower.replace('mark ', '').replace(' done', '').trim() };
    }
    if (lower === 'delete last task') {
      return { text: input, date: null, hasDate: false, command: 'delete-last' };
    }
    if (lower === 'show my list' || lower === 'show list') {
      return { text: input, date: null, hasDate: false, command: 'open-calendar' };
    }

    if (!chrono) {
      // Fallback: simple keyword parsing
      return this._fallbackParse(input, today);
    }

    // Use chrono-node to find date references
    const results = chrono.parse(input, now, { forwardDate: true });

    if (results.length === 0) {
      return { text: input.trim(), date: null, hasDate: false };
    }

    const result = results[0];
    const parsedDate = result.start.date();
    const dateStr = this._toDateStr(parsedDate);

    let exactTime = null;
    if (result.start.isCertain('hour')) {
      exactTime = parsedDate.toISOString();
    }

    // Remove the date phrase from the task text
    const before = input.slice(0, result.index).trim();
    const after = input.slice(result.index + result.text.length).trim();
    let cleanText = [before, after].filter(Boolean).join(' ').trim();

    // Clean up common prepositions left over
    cleanText = cleanText.replace(/\s+(on|for|by|at|this|next)\s*$/i, '').trim();
    if (!cleanText) cleanText = input.trim();

    return {
      text: cleanText,
      date: dateStr,
      exactTime,
      hasDate: true,
      parsedFrom: result.text
    };
  }

  static _fallbackParse(input, today) {
    const lower = input.toLowerCase();
    const now = new Date();

    if (lower.includes('today')) {
      return { text: input.replace(/today/i, '').trim(), date: today, hasDate: true };
    }
    if (lower.includes('tomorrow')) {
      const tom = new Date(now);
      tom.setDate(tom.getDate() + 1);
      return { text: input.replace(/tomorrow/i, '').trim(), date: this._toDateStr(tom), hasDate: true };
    }
    if (lower.includes('next week')) {
      const nw = new Date(now);
      nw.setDate(nw.getDate() + 7);
      return { text: input.replace(/next week/i, '').trim(), date: this._toDateStr(nw), hasDate: true };
    }

    const daysOfWeek = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    for (let i = 0; i < daysOfWeek.length; i++) {
      if (lower.includes(daysOfWeek[i])) {
        const target = new Date(now);
        const curDay = now.getDay();
        let diff = i - curDay;
        if (diff <= 0) diff += 7;
        target.setDate(now.getDate() + diff);
        return { text: input.replace(new RegExp(daysOfWeek[i], 'i'), '').replace(/\s+on\s+$/i,'').trim(), date: this._toDateStr(target), hasDate: true };
      }
    }

    return { text: input.trim(), date: null, hasDate: false };
  }

  static _toDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  static todayStr() {
    return this._toDateStr(new Date());
  }

  static tomorrowStr() {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return this._toDateStr(t);
  }

  static formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const target = new Date(y, m - 1, d);

    if (target.getTime() === today.getTime()) return 'Today';
    if (target.getTime() === tomorrow.getTime()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
}

module.exports = DateParser;
