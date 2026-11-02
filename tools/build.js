#!/usr/bin/env node
// Builds data/packs/core/words.json from tools/src/core.tsv (glosses, pos, overrides), build/ranked.tsv
// (frequency rank and counts) and tests/fixtures/wikt.json (Wiktionary gender, auxiliary, -isc- class).
// Noun plurals and adjective forms are produced by the morphology engine; tests check them against
// Wiktionary and Morph-it!. Usage: node tools/build.js [--report]
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const M = require(path.join(ROOT, 'lang/it/morph.js'));
const W = require(path.join(ROOT, 'tests/fixtures/wikt.json'));
const N = 1500;

function readSrc() {
  const out = new Map();
  for (const line of fs.readFileSync(path.join(ROOT, 'tools/src/core.tsv'), 'utf8').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const [it, pos, gram, en] = line.split('\t');
    if (!en) throw new Error('bad line: ' + line);
    if (out.has(it)) throw new Error('duplicate ' + it);
    out.set(it, { it, pos, gram: (gram || '').split(/\s+/).filter(Boolean), en });
  }
  return out;
}
function readRanked() {
  return fs.readFileSync(path.join(ROOT, 'build/ranked.tsv'), 'utf8').trim().split('\n').map(l => {
    const p = l.split('\t'); return { hw: p[1], count: +p[3] };
  });
}
const REFL = /^([a-z]+(?:arsi|ersi|irsi))\b/;
const IMPERSONAL = { bisognare: 1, accadere: 1, succedere: 1, capitare: 1, importare: 0, bastare: 0, sembrare: 0, parere: 0, avvenire: 1 };

function noun(e, warn) {
  const w = W[e.it], g0 = e.gram.find(x => /^(m|f|mf)$/.test(x));
  const entry = w && w.n ? w.n[0] : null;
  let g = g0 || (entry && entry.g);
  if (!g) { warn('noun without gender: ' + e.it); g = 'm'; }
  if (g === 'm|f' || g === 'mf' && !g0) g = 'mf';
  if (!/^(m|f|mf)$/.test(g)) { warn('odd gender ' + g + ' ' + e.it); g = g.split('|')[0]; }
  const o = { g };
  if (e.gram.includes('pl')) o.pltant = 1;
  if (e.gram.includes('inv')) o.inv = 1;
  if (e.gram.includes('sg')) o.sg = 1;            // mass noun: no everyday plural, kept out of plural drills
  const plo = e.gram.find(x => x.startsWith('pl:')); if (plo) o.plx = plo.slice(3);
  const r = M.nounPlural({ it: e.it, g: g === 'f' ? 'f' : 'm', inv: o.inv, pltant: o.pltant, pl: o.plx });
  if (!o.pltant && !o.sg) { o.pl = r.pl; if (r.g !== (g === 'f' ? 'f' : 'm')) o.plg = r.g; }
  if (entry && entry.head) {
    const m = /feminine ([a-zà-ù']+)/.exec(entry.head); if (m && g === 'm') o.fem = m[1];
  }
  return o;
}
function adj(e) {
  const inv = e.gram.includes('inv');
  const o = { forms: M.adjForms({ it: e.it, cls: inv ? 'inv' : undefined }) };
  if (e.gram.includes('noagr')) o.noagr = 1;      // kept out of agreement drills (incinta, qualsiasi, tale, santo)
  if (e.gram.includes('pre')) o.pre = 1;          // normally placed before the noun (lo stesso giorno, l'ultima volta)
  if (inv) o.inv = 1;
  return o;
}
function verb(e, warn) {
  const w = W[e.it] && W[e.it].v;
  const o = { conj: M.cls(e.it) };
  const isc = e.gram.includes('isc') || (w && (w.pres[0][0] || '').endsWith('isco') && !M.irrOf(e.it));
  if (isc) o.conj = 'isc';
  const ax = e.gram.find(x => x.startsWith('aux:'));
  if (ax) o.aux = ax.slice(4);
  else if (w && w.aux.length) {
    const a = w.aux.includes('avere'), s = w.aux.includes('essere');
    o.aux = a && s ? 'a/e' : s ? 'e' : 'a';
  } else { warn('verb without aux: ' + e.it); o.aux = 'a'; }
  if (M.isIrregular({ it: e.it })) o.irr = 1;
  const rm = REFL.exec(e.en);
  if (rm) o.refl = rm[1];
  if (IMPERSONAL[e.it]) o.impers = 1;
  return o;
}

function build() {
  const src = readSrc(), ranked = readRanked(), warns = [];
  const warn = s => warns.push(s);
  const words = [];
  for (const r of ranked) {
    if (words.length >= N) break;
    const e = src.get(r.hw);
    if (!e) throw new Error('ranked headword missing from core.tsv: ' + r.hw);
    const o = { id: e.it, it: e.it, en: e.en, pos: e.pos, rank: words.length + 1, freq: r.count };
    if (e.pos === 'n') Object.assign(o, noun(e, warn));
    else if (e.pos === 'adj') Object.assign(o, adj(e));
    else if (e.pos === 'v') Object.assign(o, verb(e, warn));
    if (e.pos === 'adj' && e.gram.includes('inv')) o.inv = 1;
    if (e.pos === 'n' && e.gram.includes('inv') && !o.inv) o.inv = 1;
    words.push(o);
  }
  if (words.length !== N) throw new Error('only ' + words.length + ' words');
  return { words, warns };
}

if (require.main === module) {
  const { words, warns } = build();
  const dir = path.join(ROOT, 'data/packs/core');
  fs.mkdirSync(dir, { recursive: true });
  const lines = words.map(w => JSON.stringify(w));
  fs.writeFileSync(path.join(dir, 'words.json'), '[\n' + lines.join(',\n') + '\n]\n');
  const counts = {}; words.forEach(w => counts[w.pos] = (counts[w.pos] || 0) + 1);
  console.log('wrote', words.length, 'words', JSON.stringify(counts));
  if (warns.length) console.log(warns.join('\n'));
}
module.exports = { build };
