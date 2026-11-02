// Exploratory: engine vs Wiktionary with attributes guessed from Wiktionary itself.
const M = require('../lang/it/morph.js'); const W = require('../tests/fixtures/wikt.json');
const fs = require('fs');
const ranked = fs.readFileSync('build/ranked.tsv', 'utf8').trim().split('\n').slice(0, +process.argv[2] || 1600).map(l => l.split('\t'));
let bad = { v: [], n: [], a: [] };
for (const [rk, hw, pos] of ranked) {
  const w = W[hw]; if (!w) continue;
  if (w.v && pos.startsWith('verb')) {
    const v = { it: hw, conj: (w.v.pres[0][0] || '').endsWith('isco') ? 'isc' : '' };
    const errs = [];
    for (const t of ['pres', 'imp', 'fut']) {
      const mine = M.tense(v, t); const ref = w.v[t];
      mine.forEach((f, i) => { if (ref[i] && ref[i].length && ref[i][0] !== f) errs.push(t + i + ':' + f + '≠' + ref[i].join('/')); });
    }
    const pp = M.pastPart(v); if (w.v.pp.length && w.v.pp[0] !== pp) errs.push('pp:' + pp + '≠' + w.v.pp.join('/'));
    if (errs.length) bad.v.push(rk + ' ' + hw + ' ' + errs.slice(0, 4).join(' '));
  }
  if (w.n && pos.startsWith('noun')) {
    const e = w.n[0]; if (e.pltant || !e.pl.length && !e.inv) continue;
    const g = e.g === 'f' ? 'f' : 'm';
    const r = M.nounPlural({ it: hw, g });
    const ok = e.inv ? r.pl === hw : e.pl.includes(r.pl) && e.pl[0] === r.pl;
    if (!ok) bad.n.push(rk + ' ' + hw + ' ' + e.g + ' ' + r.pl + '≠' + (e.inv ? 'inv' : e.pl.join('/')) + (e.plg ? ' (' + e.plg + ')' : ''));
  }
  if (w.a && pos.startsWith('adj')) {
    const f = M.adjForms({ it: hw }); const a = w.a;
    const ok = a.inv ? f.every(x => x === hw) : ((!a.fs.length || a.fs.includes(f[1])) && (!a.mp.length || a.mp[0] === f[2]) && (!a.fp.length || a.fp[0] === f[3]));
    if (!ok) bad.a.push(rk + ' ' + hw + ' ' + f.join(',') + ' ≠ ' + (a.inv ? 'inv' : [a.fs, a.mp, a.fp].map(x => x.join('/')).join(',')));
  }
}
for (const k in bad) { console.log('== ' + k + ' ' + bad[k].length); console.log(bad[k].join('\n')); }
