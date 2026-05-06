/**
 * QuickDo — dateParser.js
 * Phase 4: Smart natural-language date parser.
 *
 * Understands:
 *   • today / tomorrow / yesterday / tonight
 *   • next week
 *   • in N days
 *   • next <weekday>  /  this <weekday>  /  bare <weekday>
 *   • <Month> <Day>   e.g. "June 15" / "June 15th"
 *   • DD/MM           e.g. "15/06"
 *
 * Returns: { date: Date, label: string, clean: string } | null
 *   clean = original text with the date expression stripped out.
 *   null  = no date found (caller should prompt the user).
 */

'use strict';

const DateParser = (() => {

  const DAYS = [
    'sunday','monday','tuesday','wednesday','thursday','friday','saturday'
  ];

  const MONTHS = [
    'january','february','march','april','may','june',
    'july','august','september','october','november','december'
  ];

  // Ordinal words → day-of-month number (1–31)
  const ORDINALS = {
    first:1, second:2, third:3, fourth:4, fifth:5, sixth:6, seventh:7,
    eighth:8, ninth:9, tenth:10, eleventh:11, twelfth:12, thirteenth:13,
    fourteenth:14, fifteenth:15, sixteenth:16, seventeenth:17, eighteenth:18,
    nineteenth:19, twentieth:20, 'twenty-first':21, 'twenty-second':22,
    'twenty-third':23, 'twenty-fourth':24, 'twenty-fifth':25,
    'twenty-sixth':26, 'twenty-seventh':27, 'twenty-eighth':28,
    'twenty-ninth':29, thirtieth:30, 'thirty-first':31,
  };

  // Pre-compiled regex patterns for ordinal-word month parsing
  const _ordinalKeys = Object.keys(ORDINALS).join('|');
  const _ordinalOfMonthRx = new RegExp(
    '\\b(?:the )?(' + _ordinalKeys + ')\\s+of\\s+(' + MONTHS.join('|') + ')\\b'
  );
  const _monthOrdinalRx = new RegExp(
    '\\b(' + MONTHS.join('|') + ')\\s+(?:the )?(' + _ordinalKeys + ')\\b'
  );

  /**
   * Find the next occurrence of a given weekday index (0–6)
   * strictly after `from` (or on it if allowSame=true).
   */
  function nextWeekday(from, targetDow, allowSame = false) {
    const d = new Date(from);
    d.setDate(d.getDate() + (allowSame ? 0 : 1));
    while (d.getDay() !== targetDow) d.setDate(d.getDate() + 1);
    return d;
  }

  /**
   * Strip leading filler verbs so the task text is clean.
   * "add milk to list" → "milk to list"
   * "remind me to call John" → "call John"
   */
  function stripFiller(text) {
    return text
      .replace(/^(add|remind me to|remind me|schedule|don't forget to|don't forget)\s+/i, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /**
   * Core parse function.
   * @param {string} raw  Raw user input (typed or transcribed).
   * @returns {{ date: Date, label: string, clean: string } | null}
   */
  function parse(raw) {
    if (!raw || !raw.trim()) return null;

    const t   = DateUtils.today();
    const low = raw.toLowerCase();

    // Helper: remove matched portion and clean up
    const cleaned = (original, regex) =>
      stripFiller(original.replace(regex, '').replace(/\s{2,}/g, ' ').trim());

    // ── today / tonight ──────────────────────────────────────
    if (/\b(today|tonight)\b/.test(low)) {
      return { date: t, label: 'Today', clean: cleaned(raw, /\b(today|tonight)\b/gi) };
    }

    // ── tomorrow ─────────────────────────────────────────────
    if (/\btomorrow\b/.test(low)) {
      return {
        date: DateUtils.addDays(t, 1),
        label: 'Tomorrow',
        clean: cleaned(raw, /\btomorrow\b/gi),
      };
    }

    // ── yesterday ────────────────────────────────────────────
    if (/\byesterday\b/.test(low)) {
      return {
        date: DateUtils.addDays(t, -1),
        label: 'Yesterday',
        clean: cleaned(raw, /\byesterday\b/gi),
      };
    }

    // ── next week ────────────────────────────────────────────
    if (/\bnext week\b/.test(low)) {
      const d = DateUtils.addDays(t, 7);
      return { date: d, label: 'Next week', clean: cleaned(raw, /\bnext week\b/gi) };
    }

    // ── in N days ────────────────────────────────────────────
    const inDaysMatch = low.match(/\bin (\d+) days?\b/);
    if (inDaysMatch) {
      const d = DateUtils.addDays(t, parseInt(inDaysMatch[1], 10));
      return {
        date: d,
        label: DateUtils.labelForDate(d),
        clean: cleaned(raw, /\bin \d+ days?\b/gi),
      };
    }

    // ── next <weekday> ───────────────────────────────────────
    const nextDayMatch = low.match(
      /\bnext (sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/
    );
    if (nextDayMatch) {
      const dow = DAYS.indexOf(nextDayMatch[1]);
      // "next Monday" = at least 8 days out (skip this week)
      let d = nextWeekday(t, dow, false);
      if ((d - t) / 86400000 < 7) d = DateUtils.addDays(d, 7);
      const label = 'Next ' + nextDayMatch[1].charAt(0).toUpperCase() + nextDayMatch[1].slice(1);
      return {
        date: d, label,
        clean: cleaned(raw, /\bnext (sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi),
      };
    }

    // ── this <weekday> / bare <weekday> ──────────────────────
    const thisDayMatch = low.match(
      /\b(?:this )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/
    );
    if (thisDayMatch) {
      const dow = DAYS.indexOf(thisDayMatch[1]);
      const d   = nextWeekday(t, dow, false);
      const label = thisDayMatch[1].charAt(0).toUpperCase() + thisDayMatch[1].slice(1);
      return {
        date: d, label,
        clean: cleaned(raw, /\b(?:this )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi),
      };
    }

    // ── Month Day  e.g. "June 15" / "June 15th" ─────────────
    const monthDayRx = new RegExp(
      '\\b(' + MONTHS.join('|') + ')\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b'
    );
    const monthDayMatch = low.match(monthDayRx);
    if (monthDayMatch) {
      const m  = MONTHS.indexOf(monthDayMatch[1]);
      let   d  = new Date(t.getFullYear(), m, parseInt(monthDayMatch[2], 10));
      if (d < t) d.setFullYear(d.getFullYear() + 1);  // roll to next year if past
      const label = monthDayMatch[1].charAt(0).toUpperCase() + monthDayMatch[1].slice(1)
                    + ' ' + monthDayMatch[2];
      return {
        date: d, label,
        clean: cleaned(raw, new RegExp('\\b' + monthDayMatch[1] + '\\s+\\d{1,2}(?:st|nd|rd|th)?\\b', 'gi')),
      };
    }

    // ── Ordinal-word month  e.g. "fifth of May" / "May fifth" ─
    const ordOfMonthMatch = low.match(_ordinalOfMonthRx);
    const monOrdMatch     = low.match(_monthOrdinalRx);
    const ordMatch = ordOfMonthMatch || monOrdMatch;
    if (ordMatch) {
      const dayNum = ordOfMonthMatch
        ? ORDINALS[ordMatch[1]]
        : ORDINALS[ordMatch[2]];
      const monthStr = ordOfMonthMatch ? ordMatch[2] : ordMatch[1];
      const m = MONTHS.indexOf(monthStr);
      let d = new Date(t.getFullYear(), m, dayNum);
      if (d < t) d.setFullYear(d.getFullYear() + 1);
      const label = monthStr.charAt(0).toUpperCase() + monthStr.slice(1) + ' ' + dayNum;
      const cleanRx = ordOfMonthMatch ? _ordinalOfMonthRx : _monthOrdinalRx;
      return { date: d, label, clean: cleaned(raw, cleanRx) };
    }

    // ── DD/MM  e.g. "15/06" ──────────────────────────────────
    const slashMatch = low.match(/\b(\d{1,2})\/(\d{1,2})\b/);
    if (slashMatch) {
      let d = new Date(t.getFullYear(), parseInt(slashMatch[2], 10) - 1, parseInt(slashMatch[1], 10));
      if (d < t) d.setFullYear(d.getFullYear() + 1);
      const label = slashMatch[1] + '/' + slashMatch[2];
      return { date: d, label, clean: cleaned(raw, /\b\d{1,2}\/\d{1,2}\b/g) };
    }

    // No date found
    return null;
  }

  return { parse, stripFiller };
})();
