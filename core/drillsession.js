/* Drill sets (shared core): a fixed number of questions, each missed form re-asked once a few
   questions later with a different word, and the last few combos/words avoided.
   The language layer supplies pick(only, avoidCombos, avoidWords) -> {c, id, ...} and
   pickRedo(c, avoidId) -> item | null. Pure logic, no DOM. */
(function (root, factory) {
  const D = factory();
  if (typeof module === 'object' && module.exports) module.exports = D; else root.DrillSession = D;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const REDO_AFTER = 3, RECENT = 3;
  const create = (len, only) => ({ kind: 'drill', len, done: 0, total: len, asked: 0, ok: 0, redo: [], only: only || null, recent: [] });
  // next item, or null when the set is over
  function next(Q, src) {
    let it = null, i = Q.redo.findIndex(r => r.at <= Q.done);
    if (i < 0 && Q.asked >= Q.len && Q.redo.length) i = 0;              // finish re-asks before the set ends
    while (i >= 0 && !it) {
      const r = Q.redo.splice(i, 1)[0];
      it = src.pickRedo(r.c, r.avoid);
      if (it) it.redo = true; else Q.total--;
      i = Q.redo.findIndex(x => x.at <= Q.done); if (i < 0 && Q.asked >= Q.len && Q.redo.length) i = 0;
      if (it) break;
    }
    if (!it && Q.asked < Q.len) {
      it = src.pick(Q.only, new Set(Q.recent.map(x => x.c)), new Set(Q.recent.map(x => x.id)));
      if (it) Q.asked++; else { Q.total -= Q.len - Q.asked; Q.asked = Q.len; }
    }
    if (!it) return null;
    Q.recent = Q.recent.concat({ c: it.c, id: it.id }).slice(-RECENT);
    return it;
  }
  function answer(Q, item, right) {
    Q.done++; if (right) Q.ok++;
    if (!right && !item.redo) { Q.redo.push({ c: item.c, at: Q.done + REDO_AFTER, avoid: item.id }); Q.total++; }   // one re-ask per miss, so a set always ends
  }
  return { REDO_AFTER, create, next, answer };
});
