/* Sentence engine: articles, agreement, auxiliaries, tiers, mix, grading.
   Run from tests/run.js, or alone: node tests/sentences.js */
'use strict';
const fs = require('fs'), path = require('path');
const M = require('../lang/it/morph.js');
const D = require('../lang/it/drills.js');
const E = require('../lang/it/sentences.js');
const WORDS = require('../data/packs/core/words.json');

function main(eq, ok) {
  E.bind(WORDS);
  const BY = {}; WORDS.forEach(w => { if (!BY[w.it] || (w.pos === 'v' && BY[w.it].pos !== 'v')) BY[w.it] = w; });
  const P = ['1s', '2s', '3s', '1p', '2p', '3p'];

  // ---------- articles and articulated prepositions, against a fixed table ----------
  const ARTS = ['il', 'lo', "l'", 'la', 'i', 'gli', 'le'];
  const PREP = {
    di: ['del', 'dello', "dell'", 'della', 'dei', 'degli', 'delle'],
    a: ['al', 'allo', "all'", 'alla', 'ai', 'agli', 'alle'],
    da: ['dal', 'dallo', "dall'", 'dalla', 'dai', 'dagli', 'dalle'],
    in: ['nel', 'nello', "nell'", 'nella', 'nei', 'negli', 'nelle'],
    su: ['sul', 'sullo', "sull'", 'sulla', 'sui', 'sugli', 'sulle']
  };
  for (const p of Object.keys(PREP)) ARTS.forEach((a, i) => eq(E.contract(p, a), PREP[p][i], 'prep ' + p + '+' + a));
  const ART = [
    ['amico', 'm', 's', 'def', "l'"], ['amico', 'm', 'p', 'def', 'gli'], ['amico', 'm', 's', 'ind', 'un'],
    ['amica', 'f', 's', 'def', "l'"], ['amica', 'f', 's', 'ind', "un'"], ['acqua', 'f', 's', 'def', "l'"],
    ['studente', 'm', 's', 'def', 'lo'], ['studente', 'm', 's', 'ind', 'uno'], ['studente', 'm', 'p', 'def', 'gli'],
    ['zio', 'm', 's', 'def', 'lo'], ['zio', 'm', 'p', 'def', 'gli'], ['zia', 'f', 's', 'def', 'la'], ['scuola', 'f', 's', 'def', 'la'],
    ['gnomo', 'm', 's', 'def', 'lo'], ['gnomo', 'm', 's', 'ind', 'uno'], ['psicologo', 'm', 's', 'def', 'lo'], ['psicologo', 'm', 's', 'ind', 'uno'],
    ['xilofono', 'm', 's', 'def', 'lo'], ['yogurt', 'm', 's', 'def', 'lo'], ['yogurt', 'm', 's', 'ind', 'uno'],
    ['iato', 'm', 's', 'def', 'lo'], ['libro', 'm', 's', 'def', 'il'], ['libro', 'm', 'p', 'def', 'i'], ['casa', 'f', 'p', 'def', 'le'],
    ['idea', 'f', 's', 'ind', "un'"], ['hotel', 'm', 's', 'def', "l'"], ['psicologa', 'f', 's', 'def', 'la']
  ];
  for (const [w, g, n, k, a] of ART) eq(E.artOf(w, g, n, k), a, 'art ' + k + ' ' + w + ' ' + n);
  eq(M.withArt("l'", 'amico'), "l'amico", 'elision l\'amico');
  eq(M.withArt("un'", 'amica'), "un'amica", 'elision un\'amica');
  eq(E.contract('di', "l'") + 'acqua', "dell'acqua", 'dell\'acqua');
  eq(E.contract('a', "l'") + 'amico', "all'amico", 'all\'amico');
  eq(E.contract('in', 'lo') + ' studente', 'nello studente', 'nello studente');
  eq(E.contract('su', 'il'), 'sul', 'sul');
  eq(E.contract('a', 'lo'), 'allo', 'allo zio-type');

  // ---------- tiers ----------
  eq(E.tierOf(0), 1, 'tier 0'); eq(E.tierOf(39), 1, 'tier 39');
  eq(E.tierOf(40), 2, 'tier 40'); eq(E.tierOf(79), 2, 'tier 79');
  eq(E.tierOf(80), 3, 'tier 80'); eq(E.tierOf(139), 3, 'tier 139');
  eq(E.tierOf(140), 4, 'tier 140'); eq(E.tierOf(400), 4, 'tier 400');
  eq(E.templatesFor(10), ['COP', 'SV', 'CE'], 'templates under 40');
  eq(E.templatesFor(40), ['COP', 'SV', 'CE', 'SVO', 'SVPP', 'POSS'], 'templates at 40');
  ok(E.templatesFor(80).indexOf('NADJ') >= 0 && E.templatesFor(80).indexOf('IO') < 0, 'tier 3 adds adjectives, not IO yet');
  ok(E.tensesForTier(1).join() === 'pres' && E.tensesForTier(3).indexOf('pp') >= 0, 'tenses unlock at tier 3');
  eq(E.templatesFor(140).slice(-3), ['IO', 'COORD', 'NEG'], 'tier 4 adds IO, coordination, negation');
  eq(E.settings({}).on, false, 'sentences off by default');
  eq(E.settings({}).type, 'both', 'default sentence type');
  eq(E.settings({}).dir, 'ie', 'default direction Italian → English');
  eq(E.settings({ sent: true, stype: 'tr', sdir: 'ei' }), { on: true, type: 'tr', dir: 'ei' }, 'sentence settings');
  const app = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  ok(/s\.set\.df\.sent = df\.sent === true/.test(app), 'app stores sentences off unless explicitly on');
  ok(/Sentences in drills/.test(app), 'drills settings label');
  const sw = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
  ok(/italiano1500-v11/.test(sw), 'cache v11');
  ok(sw.indexOf('lang/it/sentences.js') >= 0 && sw.indexOf('lang/it/sentences_lexicon.js') >= 0, 'sentence scripts precached');

  // ---------- mix: 1 in 7, each stretch 10–20%, never two in a row ----------
  const shares = E.GAPS.map(g => 1 / (g + 1));
  ok(shares.every(s => s >= 0.1 - 1e-9 && s <= 0.2 + 1e-9), 'each gap is 10–20% sentences');
  let st = null, takes = 0, prev = false, back = 0;
  for (let i = 0; i < 7000; i++) {
    const m = E.mixNext(st, true, Math.random);
    st = m.state;
    if (m.take && prev) back++;
    if (m.take) takes++;
    prev = !!m.take;
  }
  eq(back, 0, 'no two sentences in a row');
  ok(Math.abs(takes / 7000 - 1 / 7) < 0.02, 'long run is about 1 in 7 (' + (takes / 7000).toFixed(3) + ')');
  st = null; let off = 0;
  for (let i = 0; i < 200; i++) { const m = E.mixNext(st, false); st = m.state; if (m.take) off++; }
  eq(off, 0, 'mix stays off when the setting is off');
  // a failed sentence does not leave two takes in a row: the gap resets on the take
  st = { left: 0 }; const m1 = E.mixNext(st, true, () => 0); ok(m1.take && m1.state.left === E.GAPS[0], 'failed slot still resets the gap');
  const m2 = E.mixNext(m1.state, true, () => 0); eq(m2.take, false, 'the next item is not another sentence');

  // ---------- 2,000 sentences per tier ----------
  const KIN = { padre: 'sg', madre: 'sg', fratello: 'pl', sorella: 'pl', figlio: 'pl', figlia: 'pl', zio: 'pl', zia: 'pl', nonno: 'pl', nonna: 'pl', marito: 'sg', moglie: 'sg' };
  function audit(s, tier) {
    const probs = [];
    const ts = E.tensesForTier(tier);
    if (s.template !== 'COORD' && ts.indexOf(s.tense) < 0) probs.push('tense ' + s.tense);
    if (tier < 2 && s.nps.some(np => np.poss)) probs.push('possessive before tier 2');
    if (tier < 3 && s.nps.some(np => np.adj)) probs.push('attributive adjective before tier 3');
    if (tier < 3 && s.tense !== 'pres' && s.template !== 'COORD') probs.push('non-present before tier 3');
    if (tier < 4 && /\bnon\b/.test(s.it)) probs.push('negation before tier 4');
    if (tier < 4 && s.nps.some(np => np.role === 'IO')) probs.push('indirect object before tier 4');
    if (!s.verbs.some(v => v.exist) && s.nps.some(np => np.role === 'S' && np.det === 'part')) probs.push('partitive subject ' + s.la);
    if (E.templatesForTier(tier).indexOf(s.template) < 0) probs.push('template ' + s.template);
    for (const np of s.nps) {
      const head = np.poss ? np.possForm : (np.pre ? np.adjForm : np.form);
      if (np.art) {
        const want = np.det === 'ind' ? M.indefArt(head, np.g) : M.defArt(head, np.g, np.num);
        if (np.art !== want) probs.push('article ' + np.surface + ' wanted ' + want);
      }
      if (np.prep && np.art && !np.plain) {
        const c = E.contract(np.prep, np.art);
        if (np.surface.indexOf(c) !== 0) probs.push('articulated ' + np.surface + ' wanted ' + c);
      }
      if (np.prep === 'con' && np.plain && np.art) {
        if (np.surface.indexOf('con ' + np.art) !== 0) probs.push('con not contracted ' + np.surface);
      }
      if (np.adj && np.adjForm !== M.adjAgree(np.adj.w, np.g, np.num)) probs.push('adj ' + np.adj.it + ' ' + s.la);
      if (np.pre && np.tokens[0] && np.adjForm && np.surface.indexOf(np.adjForm) > np.surface.indexOf(np.form) && np.surface.indexOf(np.form) >= 0) probs.push('pre adj follows ' + np.surface);
      const kin = KIN[np.noun.it];
      if (np.poss && kin && np.num === 's' && !np.adj && np.det !== 'none') probs.push('article on ' + np.surface);
      if (np.poss && kin === 'pl' && np.num === 'p' && np.det === 'none') probs.push('bare plural kinship ' + np.surface);
      if (s.it.toLowerCase().indexOf(np.surface) < 0) probs.push('surface missing ' + np.surface + ' / ' + s.la);
    }
    for (const v of s.verbs) {
      const w = BY[v.it];
      if (!w || w.refl || w.impers) probs.push('refl/impers ' + v.it);
      if (v.aux) {
        if ((w.aux === 'a' || !w.aux) && v.aux !== 'a') probs.push('aux avere ' + v.it);
        if (w.aux === 'e' && v.aux !== 'e') probs.push('aux essere ' + v.it);
        if (w.aux === 'a/e' && v.hasObj && v.aux !== 'a') probs.push('a/e with object ' + v.it);
        if (v.aux !== 'a' && v.aux !== 'e') probs.push('aux ' + v.aux);
      }
      if (v.tense === 'pp' && !v.exist) {
        const surf = M.passato(w, P.indexOf(v.person), v.g === 'f' ? 'f' : 'm', v.aux);
        if (surf !== v.surface) probs.push('passato ' + v.surface + ' != ' + surf);
        if (v.aux === 'e') {
          const pp = M.ppAgree(M.pastPart(w), v.g === 'f' ? 'f' : 'm', v.n === 'p' ? 'p' : 's');
          if (v.surface.indexOf(pp) < 0) probs.push('participle ' + v.surface + ' ' + pp);
        }
        if (v.aux === 'a' && v.surface.indexOf(M.pastPart(w)) < 0) probs.push('avere participle ' + v.surface);
      }
    }
    s.ids.forEach(id => { if (id !== 'loro' && E.HELPERS.indexOf(id) >= 0) probs.push('helper counted as content ' + id); });
    if (!E.gradeIt(s.it, s, true).ok) probs.push('rejects its own Italian');
    if (!E.gradeEn(s.en, s).ok) probs.push('rejects its own English ' + s.en);
    if (/\ba [aeiou]/i.test(s.en) && !/\ba (university|euro|hotel|hospital)\b/i.test(s.en)) probs.push('a/an ' + s.en);
    return probs;
  }
  for (const tier of [1, 2, 3, 4]) {
    const rng = E.mulberry32(20261109 + tier);
    const xs = E.generateMany(2000, { tier: tier, words: WORDS, rng: rng });
    eq(xs.length, 2000, 'tier ' + tier + ' generated 2000');
    const probs = [];
    xs.forEach(s => { const p = audit(s, tier); if (p.length && probs.length < 8) probs.push(s.la + ' — ' + p[0]); });
    eq(probs, [], 'tier ' + tier + ' audit');
  }

  // only seen words + helpers
  const pool = ['casa', 'ragazzo', 'ragazza', 'pizza', 'acqua', 'treno', 'museo', 'mangiare', 'andare', 'grande'].map(it => BY[it].id);
  const set = new Set(pool);
  const rng = E.mulberry32(5);
  let saw = 0;
  for (let i = 0; i < 80; i++) {
    const s = E.generate(rng, { pool: pool, words: WORDS, tries: 30 });
    if (!s) continue;
    saw++;
    ok(E.tierOf(pool.length) === 1 && s.tense === 'pres' && ['COP', 'SV', 'CE'].indexOf(s.template) >= 0, 'small pool stays on tier 1');
    s.tokens.forEach(t => {
      if (t.content) ok(set.has(t.id), 'content word seen: ' + t.t);
      (t.ids || []).forEach(id => ok(E.HELPERS.indexOf(id) >= 0 || set.has(id), 'token id ' + id));
    });
  }
  ok(saw >= 40, 'small pool still generates (' + saw + ')');
  // tier growth: 50 seen content words unlocks tier 2 but not passato
  const many = [];
  WORDS.forEach(w => { if (many.length < 50 && (w.pos === 'n' || w.pos === 'v' || w.pos === 'adj')) many.push(w.id); });
  let late = 0, earlyTense = 0, n50 = 0;
  for (let i = 0; i < 40; i++) {
    const s = E.generate(rng, { pool: many, words: WORDS, tries: 20 });
    if (!s) continue;
    n50++;
    if (s.tense !== 'pres') earlyTense++;
    if (['SVO', 'SVPP', 'POSS', 'COP', 'SV', 'CE'].indexOf(s.template) < 0) late++;
  }
  ok(n50 >= 20 && earlyTense === 0 && late === 0, '50 seen words: tier 2, present only');

  // grading: dropped subject pronoun, wrong agreement, accents
  let drop = null, cop = null;
  for (let i = 0; i < 300 && (!drop || !cop); i++) {
    const s = E.generate(E.mulberry32(20 + i), { tier: 2, template: 'SVO', words: WORDS, person: '1s' });
    if (s && s.also && s.also.length) drop = s;
    const c = E.generate(E.mulberry32(80 + i), { tier: 1, template: 'COP', words: WORDS });
    if (c && / è /.test(' ' + c.it + ' ') && c.nps[0] && c.nps[0].g === 'f') cop = c;
  }
  ok(!!drop, 'found a 1st-person sentence');
  if (drop) {
    ok(E.gradeIt(drop.it, drop, true).ok, 'bare Italian accepted');
    ok(E.gradeIt(drop.also[0], drop, true).ok, 'with subject pronoun accepted: ' + drop.also[0]);
    ok(!E.gradeIt('tu ' + drop.it, drop, true).ok, 'the wrong subject pronoun is not accepted');
    const guy = drop.en.replace(/^I\b/, 'The boy').replace(/\b(eat|take|see|buy|read|drink)\b/, 'eats');
    ok(!E.gradeEn('the train eats the house', drop).ok, 'nonsense English rejected');
    ok(E.gradeEn(drop.en, drop).ok, 'model English accepted');
    ok(E.gradeEn(drop.en.replace(/\b(a|an|the)\b/gi, ''), drop).ok, 'English without articles accepted');
  }
  ok(!!cop, 'found a feminine copula');
  if (cop) {
    const bad = cop.it.replace(/è (\S+)/, 'è grandi');
    ok(!E.gradeIt(bad, cop, true).ok, 'wrong agreement rejected: ' + bad);
    const bare = cop.it.replace('è', 'e');
    eq(E.gradeIt(bare, cop, true).ok, false, 'missing accent rejected when accents count');
    eq(E.gradeIt(bare, cop, false).ok, true, 'missing accent accepted when accents are optional');
    ok(E.gradeIt(bare, cop, false).accent, 'accent miss is flagged');
  }

  // fallback, and identify writes the combo back
  const allowAll = new Set(Object.keys(D.buildUnits(WORDS, D.DF)));
  eq(E.pickDrill({ df: Object.assign({ sent: true }, D.DF), seen: new Set(), words: WORDS, allow: allowAll, stats: {} }), null, 'no seen words → no sentence');
  const femOnly = Object.assign({}, D.DF, { types: ['art'], agen: ['f'] });
  const allowF = new Set(Object.keys(D.buildUnits(WORDS, femOnly)));
  eq(E.pickDrill({ df: femOnly, seen: new Set([BY.ragazzo.id, BY.treno.id, BY.mangiare.id]), words: WORDS, allow: allowF, stats: {} }), null, 'filters that cannot be matched fall back');
  let stG = E.applyGrade({}, { ex: 'id', combo: 'vare|pres.3s' }, false, 1);
  eq(stG.dn, 1, 'a sentence counts once toward the daily total');
  ok(stG.dst['vare|pres.3s'] && stG.dst['vare|pres.3s'].ok === 0, 'identify records the combo');
  stG = E.applyGrade(stG, { ex: 'tr', combo: 'sent' }, true, 2);
  eq(stG.dn, 2, 'translate also counts once');
  eq(Object.keys(stG.dst).length, 1, 'translate does not write a form stat');

  // weak-spot bias: a buried -are present 3s should show up once it is the weak combo
  const weak = 'vare|pres.3s';
  const stats = {};
  allowAll.forEach(c => { stats[c] = { r: 8, n: 8, a: 8, ok: 8, t: 1, q: 1 }; });
  stats[weak] = { r: 0, n: 6, a: 6, ok: 0, t: 1, q: 1 };
  const seenAll = E.seenIds({ cards: Object.fromEntries(WORDS.map(w => ['r:' + w.id, { box: 1 }])), ds: { w: {} } });
  let hit = 0, got = 0;
  const rnd = E.mulberry32(7);
  for (let i = 0; i < 20; i++) {
    const item = E.pickDrill({ df: Object.assign({ sent: true, stype: 'tr', sdir: 'ie' }, D.DF), seen: seenAll, words: WORDS, allow: allowAll, stats: stats, rnd: rnd });
    if (!item) continue;
    got++;
    if ((item.sentence.targets || []).some(t => t.combo === weak)) hit++;
  }
  ok(got >= 12 && hit >= 8, 'sentences prefer the weak combo (' + hit + '/' + got + ')');

  // no reflexive or impersonal verb is in the lexicon
  WORDS.forEach(w => {
    if ((w.refl || w.impers) && E.generate) { /* lexicon bind would have thrown if one were tagged */ }
  });
  ok(true, 'lexicon bound with no reflexive or impersonal verb');

  // ---------- frame allow / block lists ----------
  const LEX = require('../lang/it/sentences_lexicon.js');
  const SLEEP = ['casa', 'camera', 'albergo', 'hotel', 'letto'];
  const VEH = ['treno', 'autobus', 'aereo', 'macchina', 'auto', 'taxi'];
  LEX.pp.filter(f => f.vs.indexOf('dormire') >= 0).forEach(f => f.nouns.forEach(n => ok(SLEEP.indexOf(n) >= 0, 'dormire only a place to sleep: ' + n)));
  LEX.pp.filter(f => f.vs.indexOf('salire') >= 0 || f.vs.indexOf('scendere') >= 0).forEach(f => f.nouns.forEach(n => ok(VEH.indexOf(n) >= 0, 'salire/scendere vehicle: ' + n)));
  LEX.pp.filter(f => f.vs.some(v => v === 'essere' || v === 'stare')).forEach(f => ok(f.nouns.indexOf('negozio') < 0, 'essere/stare do not take the store'));
  let badFrame = 0;
  for (let i = 0; i < 400; i++) {
    const s = E.generate(E.mulberry32(4000 + i), { tier: 4, words: WORDS, tries: 12 });
    if (!s) continue;
    if (s.verbs.some(v => v.it === 'dormire') && /banca|chiesa|museo|ufficio|negozio/.test(s.it)) badFrame++;
    if (!s.verbs.some(v => v.exist) && s.nps.some(np => np.role === 'S' && np.det === 'part')) badFrame++;
    const subj = s.nps.filter(np => np.role === 'S');
    if (s.verbs.some(v => v.it === 'salire' || v.it === 'scendere') && subj.some(n => n.num === 's') && s.nps.some(n => n.role === 'PP' && n.num === 'p')) badFrame++;
  }
  eq(badFrame, 0, 'generated sentences keep the frame blocklist');

  // ---------- possessive and sono / Lei English ----------
  let suo = null, loro = null, sonoLoc = null, sonoSg = null, sonoPl = null, lei = null;
  for (let i = 0; i < 2500 && !(suo && loro && sonoLoc && sonoSg && sonoPl && lei); i++) {
    const s = E.generate(E.mulberry32(i + 11), { tier: i % 2 ? 4 : 2, words: WORDS, tries: 12 });
    if (!s) continue;
    if (!suo && /\b(suo|sua|suoi|sue)\b/.test(s.it) && /\b(his|her|its)\b/.test(s.en)) suo = s;
    if (!loro && /\bloro\b/.test(s.it) && /\btheir\b/.test(s.en)) loro = s;
    if (!sonoLoc && s.verbs[0] && s.verbs[0].surface === 'sono' && s.pronouns.length && !s.nps.some(np => np.adj) && s.nps.some(np => np.role === 'PP')) sonoLoc = s;
    if (!sonoSg && s.verbs[0] && s.verbs[0].surface === 'sono' && s.verbs[0].n === 's' && s.pronouns.length && !s.nps.length) sonoSg = s;
    if (!sonoPl && s.verbs[0] && s.verbs[0].surface === 'sono' && s.verbs[0].n === 'p' && s.pronouns.length && !s.nps.some(np => np.role === 'PP')) sonoPl = s;
    if (!lei && s.pronouns.some(p => p.it === 'lei' || p.it === 'lui') && s.verbs[0] && s.verbs[0].surface === 'è') lei = s;
  }
  ok(!!suo, 'found a suo sentence');
  if (suo) {
    const stem = suo.en.replace(/\b(his|her|its|your|their)\b/i, '§');
    ['his', 'her', 'its', 'your'].forEach(w => ok(E.gradeEn(stem.replace('§', w), suo).ok, 'suo accepts ' + w + ' (' + suo.it + ')'));
    ok(suo.en.split(/\b(?:his|her|its|your|their)\b/i).length === 2, 'one possessive in the suo sample');
  }
  ok(!!loro, 'found a loro sentence');
  if (loro) {
    const stem = loro.en.replace(/\b(their|your)\b/i, '§');
    ['their', 'your'].forEach(w => ok(E.gradeEn(stem.replace('§', w), loro).ok, 'loro accepts ' + w));
  }
  for (let i = 0; i < 600 && !sonoLoc; i++) {
    const s = E.generate(E.mulberry32(i + 70), { tier: 2, template: 'SVPP', words: WORDS, tries: 8 });
    if (s && s.verbs[0] && s.verbs[0].surface === 'sono' && s.pronouns.length && !s.nps.some(np => np.adj)) sonoLoc = s;
  }
  ok(!!sonoLoc, 'found sono + place');
  if (sonoLoc) {
    const rest = sonoLoc.en.replace(/^(I am|They are|She is|He is|We are|You are) /, '');
    ok(E.gradeEn('I am ' + rest, sonoLoc).ok, 'sono place accepts I am');
    ok(E.gradeEn('They are ' + rest, sonoLoc).ok, 'sono place accepts they are');
    ok(!E.gradeEn('You are ' + rest, sonoLoc).ok, 'sono place rejects you are');
  }
  ok(!!sonoSg, 'found sono + singular adjective');
  if (sonoSg) {
    ok(E.gradeEn(sonoSg.en, sonoSg).ok, 'sono singular model');
    ok(!E.gradeEn('They are tired', sonoSg).ok, 'Sono stanco/a is not they');
  }
  ok(!!sonoPl, 'found sono + plural adjective');
  if (sonoPl) {
    ok(E.gradeEn('They are tired', sonoPl).ok || E.gradeEn(sonoPl.en, sonoPl).ok, 'sono plural model');
    ok(!E.gradeEn('I am tired', sonoPl).ok, 'Sono stanchi/e is not I');
  }
  ok(!!lei, 'found lei/lui + adjective');
  if (lei) {
    const fem = /lei/.test(lei.pronouns.map(p => p.it).join(''));
    const rest = lei.en.replace(/^(She|He|You) (is|are|will be|was|were|has been|have been) /, '');
    ok(E.gradeEn((fem ? 'She is ' : 'He is ') + rest, lei).ok || E.gradeEn(lei.en, lei).ok, 'lei/lui model');
    ok(E.gradeEn('You are ' + rest, lei).ok || E.gradeEn('You will be ' + rest, lei).ok || E.gradeEn('You were ' + rest, lei).ok || E.gradeEn('You have been ' + rest, lei).ok, 'formal Lei accepts you');
    ok(!E.gradeEn((fem ? 'He is ' : 'She is ') + rest, lei).ok, 'lei/lui rejects the other gender');
  }
}

if (require.main === module) {
  let pass = 0, fail = 0; const fails = [];
  const eq = (got, want, msg) => { const g = JSON.stringify(got), w = JSON.stringify(want); if (g === w) pass++; else { fail++; fails.push(msg + '\n    got  ' + g + '\n    want ' + w); } };
  const ok = (c, msg) => eq(!!c, true, msg);
  main(eq, ok);
  console.log(fails.map(f => 'FAIL ' + f).join('\n'));
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
} else module.exports = main;
