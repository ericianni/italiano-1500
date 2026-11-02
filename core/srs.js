/* Leitner spaced repetition with right/wrong grading only (shared core; same rules as Latin 1400).
   Pure functions: every date is a local day number passed in, so this is testable without a clock.
   Card keys are "<dir>:<id>": r = target language -> English, p = English -> target language (production). */
(function (root, factory) {
  const S = factory();
  if (typeof module === 'object' && module.exports) module.exports = S; else root.SRS = S;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const INT = [0, 1, 3, 7, 14, 30, 60, 120];     // days until the next review after reaching box n
  const REVIEW_CAP = 60;                          // most reviews offered in one day
  const REDO_AT = 3;                              // a missed card comes back after this many others
  // local day number (days since 1970-01-01 in the device's time zone)
  const dayNum = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
  const newCard = t => ({ box: 0, due: t });
  // right: up one box, next review INT[box] days out; wrong: back to box 0, due today
  function sched(c, right, t) {
    c = Object.assign({ box: 0, due: t }, c || {});
    if (!right) { c.box = 0; c.due = t; } else { c.box = Math.min(INT.length - 1, (c.box || 0) + 1); c.due = t + INT[c.box]; }
    return c;
  }
  function nextLabel(c) {
    const b = Math.min(INT.length - 1, ((c || {}).box || 0) + 1), n = INT[b];
    return n === 1 ? 'tomorrow' : n < 31 ? 'in ' + n + ' days' : 'in ' + Math.round(n / 30) + ' mo';
  }
  const split = k => { const i = k.indexOf(':'); return [k.slice(0, i), k.slice(i + 1)]; };
  // due keys matching prefixRe, oldest first
  function dueKeys(cards, prefixRe, t, cap, allow) {
    return Object.keys(cards).filter(k => prefixRe.test(k) && cards[k].due <= t && (!allow || allow.has(split(k)[1])))
      .sort((a, b) => cards[a].due - cards[b].due).slice(0, cap == null ? REVIEW_CAP : cap);
  }
  // the next n never-seen words, in list order
  function newKeys(ids, cards, n) { const out = []; for (const id of ids) { if (out.length >= n) break; if (!cards['r:' + id]) out.push('r:' + id); } return out; }
  // one new card after every two reviews
  function weave(rev, nw) {
    rev = rev.slice(); nw = nw.slice(); const out = [];
    while (rev.length || nw.length) { if (rev.length) out.push(rev.shift()); if (rev.length) out.push(rev.shift()); if (nw.length) out.push(nw.shift()); }
    return out;
  }
  // per-day counters: nv new words started, extra = "learn 5 more", dn drill answers
  function dayState(d, t) { return d && d.d === t ? d : { d: t, nv: 0, extra: 0, dn: 0 }; }
  const newLeft = (perDay, d) => Math.max(0, perDay + (d.extra || 0) - (d.nv || 0));
  // Apply one flashcard answer. Mutates cards/day/queue; returns the updated card.
  // The production card (p:) unlocks, due tomorrow, the first time the recognition card (r:) is answered right.
  function answer(st, item, right, t) {
    const k = item.k, first = !st.cards[k];
    st.cards[k] = sched(st.cards[k], right, t);
    if (first && item.isNew) st.day.nv = (st.day.nv || 0) + 1;
    const [dir, id] = split(k);
    if (dir === 'r' && right && !st.cards['p:' + id]) st.cards['p:' + id] = { box: 0, due: t + 1 };
    if (st.queue) {
      st.queue.done++;
      if (!right) { st.queue.items.splice(Math.min(REDO_AT, st.queue.items.length), 0, { k }); st.queue.total++; }
    }
    return st.cards[k];
  }
  // build today's flashcard session
  function session(cards, ids, t, perDay, d, allow) {
    const rev = dueKeys(cards, /^[rp]:/, t, REVIEW_CAP, allow).map(k => ({ k }));
    const nw = newKeys(ids, cards, newLeft(perDay, d)).map(k => ({ k, isNew: true }));
    const items = weave(rev, nw);
    return { kind: 'vocab', items, done: 0, total: items.length };
  }
  function counts(cards, ids, t, perDay, d) {
    return { due: dueKeys(cards, /^[rp]:/, t, REVIEW_CAP).length, fresh: newKeys(ids, cards, newLeft(perDay, d)).length };
  }
  return { INT, REVIEW_CAP, REDO_AT, dayNum, newCard, sched, nextLabel, split, dueKeys, newKeys, weave, dayState, newLeft, answer, session, counts };
});
