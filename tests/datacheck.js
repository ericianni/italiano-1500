// Cross-checks every core-pack word against two independent sources: Wiktionary (tests/fixtures/wikt.json)
// and Morph-it! (tests/fixtures/morphit.json). Returns a list of discrepancies not covered by ALLOW.
'use strict';
const path = require('path');
const M = require('../lang/it/morph.js');
const W = require('./fixtures/wikt.json');
const MI = require('./fixtures/morphit.json');
const WORDS = require('../data/packs/core/words.json');

// Reviewed discrepancies: word -> reason (sources disagree, archaic/rare alternates, or a sense we did not pick).
const ALLOW = {
  agente: 'common gender (l\'agente, un\'agente donna); Wiktionary lists only m',
  idiota: 'common gender (un idiota / un\'idiota); Morph-it lists only M',
  cominciare: 'essere when intransitive (il film è cominciato); Wiktionary lists only avere',
  volare: 'avere for the activity, essere for motion (è volato via); both are standard',
  migliorare: 'avere transitive, essere intransitive (è migliorato); both are standard',
  accadere: 'impersonal, only 3rd-person forms exist; excluded from verb drills',
  accorgere: 'Wiktionary has only the reflexive lemma accorgersi; forms checked by hand (accorgo, accorto)',
  auto: 'feminine (l\'auto, short for automobile); the Wiktionary entry we read first is masculine',
  continuare: 'avere with an object or a + infinitive, essere when the subject is a thing (la pioggia è continuata)',
  riposare: 'avere in the everyday sense (ho riposato); Wiktionary lists the reflexive riposarsi',
  retro: 'invariable (il retro / i retro); Morph-it\'s retri is an error',
  avanzare: 'avere for advancing (hanno avanzato), essere for being left over (è avanzato del pane); both are standard',
  pilota: 'common gender (il pilota / la pilota, pl. piloti / pilote); Morph-it lists only M',
  moto: 'la moto (motorcycle, short for motocicletta) is f inv; Wiktionary\'s first entry is il moto (motion), m',
  stomaco: 'both plurals are standard (stomachi, stomaci); we teach stomachi, as Wiktionary does',
  piovere: 'impersonal; essere and avere are both standard (è piovuto / ha piovuto); excluded from verb drills',
};

function check() {
  const out = [];
  const bad = (w, msg) => { if (!ALLOW[w.it]) out.push(w.it + ' (' + w.pos + '): ' + msg); };
  for (const w of WORDS) {
    const wk = W[w.it] || {}, mi = MI[w.it] || { ng: [], npl: [], adj: [] };
    if (w.pos === 'n') {
      const gs = (wk.n || []).map(e => e.g);
      const gset = new Set([].concat(...gs.map(g => g === 'm|f' || g === 'mf' ? ['m', 'f', 'mf'] : [g])));
      const want = w.g === 'mf' ? ['m', 'f'] : [w.g];
      if (!w.pltant && !w.sg) {
        if (gs.length && !want.every(g => gset.has(g) || gset.has('mf'))) bad(w, 'gender ' + w.g + ' vs Wiktionary ' + gs.join(','));
        if (mi.ng.length && !want.every(g => mi.ng.includes(g.toUpperCase()))) bad(w, 'gender ' + w.g + ' vs Morph-it ' + mi.ng.join(','));
        // plural
        const ents = (wk.n || []).filter(e => w.g === 'mf' || e.g === w.g || e.g === 'mf' || e.g === 'm|f');
        if (ents.length) {
          const okW = ents.some(e => w.inv ? e.inv || e.pl.includes(w.it) : e.pl.includes(w.pl) || (e.inv && w.pl === w.it));
          const hasInfo = ents.some(e => e.inv || e.pl.length);
          if (hasInfo && !okW) bad(w, 'plural ' + w.pl + ' vs Wiktionary ' + ents.map(e => e.inv ? 'inv' : e.pl.join('/')).join(';'));
        }
        if (mi.npl.length) {
          const pls = mi.npl.map(x => x[0]);
          if (!pls.includes(w.pl)) bad(w, 'plural ' + w.pl + ' vs Morph-it ' + pls.join('/'));
        }
      }
    } else if (w.pos === 'adj') {
      const f = w.forms, a = wk.a;
      if (a) {
        const ok = a.inv ? f.every(x => x === w.it) : ((!a.fs.length || a.fs.includes(f[1])) && (!a.mp.length || a.mp.includes(f[2])) && (!a.fp.length || a.fp.includes(f[3])));
        if (!ok) bad(w, 'forms ' + f.join(',') + ' vs Wiktionary ' + (a.inv ? 'inv' : [a.fs, a.mp, a.fp].map(x => x.join('/')).join(',')));
      }
      if (mi.adj.length) {
        const keys = ['ms', 'fs', 'mp', 'fp'];
        keys.forEach((k, i) => {
          const fs = mi.adj.filter(x => x[1] === k).map(x => x[0]);
          if (fs.length && !fs.includes(f[i])) bad(w, k + ' ' + f[i] + ' vs Morph-it ' + fs.join('/'));
        });
      }
    } else if (w.pos === 'v') {
      const v = wk.v; if (!v) { bad(w, 'no Wiktionary conjugation'); continue; }
      for (const t of ['pres', 'imp', 'fut']) {
        const mine = M.tense(w, t);
        mine.forEach((f, i) => { const ref = v[t][i]; if (ref && ref.length && !ref.includes(f)) bad(w, t + '[' + i + '] ' + f + ' vs ' + ref.join('/')); });
      }
      const pp = M.pastPart(w); if (v.pp.length && !v.pp.includes(pp)) bad(w, 'participle ' + pp + ' vs ' + v.pp.join('/'));
      const auxW = v.aux.map(a => a[0]);
      w.aux.split('/').forEach(a => { if (auxW.length && !auxW.includes(a)) bad(w, 'aux ' + w.aux + ' vs ' + v.aux.join('/')); });
    }
  }
  return out;
}
module.exports = { check, ALLOW };
if (require.main === module) { const r = check(); console.log(r.join('\n')); console.log(r.length + ' discrepancies'); }
