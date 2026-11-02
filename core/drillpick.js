// Drill picking (language-agnostic, shared with Latin 1400): free practice weighted toward weak spots, no schedule.
// Stats are kept per form combination ("paradigm|key", e.g. "vare|imp.1p", "art|def.m.p.z", "agr:o|f.p").
(function (root, factory) {
  const P = factory();
  if (typeof module === 'object' && module.exports) module.exports = P; else root.DrillPick = P;
})(typeof self !== 'undefined' ? self : this, function () {
  const DECAY = 0.75;            // each new attempt counts fully; older ones fade (0.75, 0.56, 0.42…)
  const DAY = 864e5;
  // st = { r: decayed right, n: decayed attempts, a: attempts, ok: right answers, t: last seen (ms), q: answer counter when last seen }
  function record(st, right, now, q) {
    st = Object.assign({ r: 0, n: 0, a: 0, ok: 0 }, st || {});
    st.r = st.r * DECAY + (right ? 1 : 0); st.n = st.n * DECAY + 1; st.a++; if (right) st.ok++;
    st.t = now; st.q = q;
    return st;
  }
  const acc = st => st && st.n > 0 ? st.r / st.n : null;
  // how much a combo wants to be asked: low accuracy and unseen up, just-asked down, long-unseen slightly up
  function weight(st, now, q) {
    if (!st || !(st.n > 0)) return st && st.q != null && q - st.q < 4 ? 0.2 : 2;   // unseen (or tried only before stats existed)
    const p = (st.r + 0.5) / (st.n + 1);                       // smoothed: one right answer isn't "mastered"
    let w = 0.25 + 3 * (1 - p) * (1 - p) + 1.5 * (1 - p);
    const since = q - (st.q == null ? -1e9 : st.q);
    if (since < 4) w *= 0.1; else if (since < 15) w *= 0.3 + 0.7 * (since - 4) / 11;
    const days = (now - (st.t || 0)) / DAY;
    w *= 1 + 0.5 * Math.min(1, Math.max(0, days) / 30);
    return w;
  }
  // base share of each combo, so verbs (hundreds of combos) don't crowd out nouns and adjectives, and small irregular
  // paradigms don't get as much as the big conjugations: each word type gets an equal share, split among paradigm
  // groups by sqrt(number of words), then equally among that group's combos. entries: [{ c, kind, g, nw }]
  function masses(entries) {
    const kinds = {}, m = new Map();
    for (const e of entries) { const k = kinds[e.kind] = kinds[e.kind] || { g: {}, tot: 0 }; if (!k.g[e.g]) { k.g[e.g] = { n: 0, s: Math.sqrt(e.nw || 1) }; k.tot += k.g[e.g].s; } k.g[e.g].n++; }
    const nk = Object.keys(kinds).length;
    for (const e of entries) { const k = kinds[e.kind], g = k.g[e.g]; m.set(e.c, (1 / nk) * (g.s / k.tot) / g.n); }
    return m;
  }
  function wpick(items, wf, rnd) {
    let tot = 0; const ws = items.map(x => { const w = Math.max(0, wf(x)); tot += w; return w; });
    if (!(tot > 0)) return items.length ? items[Math.floor(rnd() * items.length)] : null;
    let r = rnd() * tot;
    for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r < 0) return items[i]; }
    return items[items.length - 1];
  }
  // entries as for masses(); stats: { combo: st }; opts: { now, q, rnd, exclude: Set }
  function pickCombo(entries, stats, opts) {
    const o = Object.assign({ now: Date.now(), q: 0, rnd: Math.random }, opts || {});
    const m = masses(entries), list = entries.filter(e => !(o.exclude && o.exclude.has(e.c)));
    const e = wpick(list.length ? list : entries, x => m.get(x.c) * weight(stats[x.c], o.now, o.q), o.rnd);
    return e ? e.c : null;
  }
  // a word for the combo: mild preference for frequent words and words already met as flashcards; avoid recent ones
  // cands: [{ id, r: frequency rank or null, fc: seen as flashcard }]
  function pickWord(cands, avoid, rnd) {
    rnd = rnd || Math.random;
    const ok = avoid && avoid.size ? cands.filter(c => !avoid.has(c.id)) : cands;
    const c = wpick(ok.length ? ok : cands, x => (x.fc ? 2 : 1) * (1 + 1 / (1 + (x.r || 2000) / 250)), rnd);
    return c ? c.id : null;
  }
  // lowest-accuracy combos that have been tried (below maxAcc, if given); ties -> more attempts first
  function weakest(stats, n, allow, maxAcc) {
    return Object.keys(stats).filter(c => stats[c].n > 0 && (!allow || allow.has(c)) && !(acc(stats[c]) >= maxAcc))
      .sort((x, y) => acc(stats[x]) - acc(stats[y]) || stats[y].a - stats[x].a || (x < y ? -1 : 1)).slice(0, n);
  }
  return { DECAY, record, acc, weight, masses, pickCombo, pickWord, weakest };
});
