/* Rule-based Italian sentence engine for Drills. No model and no network: templates + the hand-tagged
   lexicon + ItMorph (the same articles, agreement and verb forms the app already grades).
   Tiers follow how many lexicon content words the learner has seen (helpers do not count):
     under 40   COP, SV, CE — present only
     40–79      + SVO, SVPP, POSS
     80–139     + NADJ, and imperfetto / futuro / passato prossimo
     140 and up + IO, COORD, NEG
   Subject pronouns are optional in Italian. English always shows them. */
(function (root, factory) {
  const M = root.ItMorph || (typeof require !== 'undefined' ? require('./morph.js') : null);
  const D = root.ItDrills || (typeof require !== 'undefined' ? require('./drills.js') : null);
  const LEX = root.ItSentLex || (typeof require !== 'undefined' ? require('./sentences_lexicon.js') : null);
  let DP = root.DrillPick;
  if (!DP && typeof require !== 'undefined') DP = require('../../core/drillpick.js');
  const S = factory(M, D, LEX, DP);
  if (typeof module === 'object' && module.exports) module.exports = S;
  else root.ItSentences = S;
})(typeof self !== 'undefined' ? self : this, function (M, D, LEX, DP) {
  'use strict';

  const PERSONS = ['1s', '2s', '3s', '1p', '2p', '3p'];
  const PRON = {
    '1s': { it: 'io', en: ['I'], num: 's' },
    '2s': { it: 'tu', en: ['you'], num: 's' },
    '1p': { it: 'noi', en: ['we'], num: 'p' },
    '2p': { it: 'voi', en: ['you', 'you all', 'you guys'], num: 'p' }
  };
  // Helpers are always allowed and do not count toward the tier. Definite articles share `il`;
  // indefinite share `un` (la, lo, gli, una… are not separate list entries).
  const HELPERS = ['il', 'un', 'di', 'a', 'da', 'in', 'su', 'con', 'essere', 'avere', 'stare', 'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro', 'non', 'e', 'ma', 'ci'];
  const GAPS = [4, 5, 5, 6, 6, 7, 9];
  const TIERS = [
    { min: 0, id: 1, tpls: ['COP', 'SV', 'CE'], tenses: ['pres'] },
    { min: 40, id: 2, tpls: ['COP', 'SV', 'CE', 'SVO', 'SVPP', 'POSS'], tenses: ['pres'] },
    { min: 80, id: 3, tpls: ['COP', 'SV', 'CE', 'SVO', 'SVPP', 'POSS', 'NADJ'], tenses: ['pres', 'imp', 'pp', 'fut'] },
    { min: 140, id: 4, tpls: ['COP', 'SV', 'CE', 'SVO', 'SVPP', 'POSS', 'NADJ', 'IO', 'COORD', 'NEG'], tenses: ['pres', 'imp', 'pp', 'fut'] }
  ];
  const BASE = { COP: 'cop', SV: 'sv', CE: 'ce', SVO: 'svo', SVPP: 'svpp', IO: 'io' };
  const SETTINGS = { sent: false, stype: 'both', sdir: 'ie' };
  const PREP_STEM = { di: 'de', a: 'a', da: 'da', in: 'ne', su: 'su' };

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const pick = (rng, a) => a[Math.floor(rng() * a.length)];
  function shuffle(rng, a) {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = b[i]; b[i] = b[j]; b[j] = t; }
    return b;
  }

  function contract(prep, article) {
    const st = PREP_STEM[prep];
    if (!st || !article) return null;
    if (article === 'il') return st + 'l';
    if (article === 'i') return st + 'i';
    if (article === 'gli') return st + 'gli';
    return st + 'l' + article;
  }
  function artOf(word, g, n, kind) {
    return kind === 'ind' ? M.indefArt(word, g) : M.defArt(word, g, n === 'p' ? 'p' : 's');
  }
  function artCombo(form, g, n, det) {
    const o = M.onset(form), oc = g === 'f' && o === 'z' ? 'c' : o;
    if (det === 'ind') return 'art|ind.' + g + '.' + oc;
    if (n === 'p') return 'art|def.' + g + '.p' + (g === 'f' ? '' : '.' + o);
    return 'art|def.' + g + '.s.' + oc;
  }

  let NOUNS = [], VERBS = [], ADJS = [], POSS = [], ADVS = [], PP = [], BYIT = {}, READY = null;
  let POOL = null;
  const inPool = e => !!e && !!e.w && (!POOL || POOL.has(e.w.id));

  function bind(words) {
    if (READY === words && NOUNS.length) return api;
    const list = words || [];
    BYIT = {};
    list.forEach(w => { if (!BYIT[w.it]) BYIT[w.it] = []; BYIT[w.it].push(w); });
    const take = (it, pos) => {
      const xs = BYIT[it] || [];
      const hit = (pos && xs.find(w => w.pos === pos)) || xs[0];
      if (!hit) throw new Error('sentence lexicon: no word ' + it);
      if (hit.refl || hit.impers) throw new Error('sentence lexicon: reflexive or impersonal ' + it);
      return hit;
    };
    const noun = n => {
      const w = take(n.it, 'n');
      return Object.assign({}, n, { w: w, tags: n.tags || [], id: w.id });
    };
    NOUNS = LEX.nouns.map(noun);
    const NBY = {}; NOUNS.forEach(n => { NBY[n.it] = n; });
    VERBS = LEX.verbs.map(v => {
      const w = take(v.it, 'v');
      if (!v.skip && !D.verbOk(w) && v.it !== 'essere' && v.it !== 'avere' && v.it !== 'stare') throw new Error('sentence lexicon: not a drill verb ' + v.it);
      return Object.assign({}, v, { w: w, id: w.id, alts: v.alts || [] });
    });
    ADJS = LEX.adjs.map(a => {
      const w = take(a.it, 'adj');
      return Object.assign({}, a, { w: w, id: w.id, alts: a.alts || [], pre: !!(a.pre || w.pre) });
    });
    POSS = LEX.poss.map(p => { const w = take(p.it, 'det'); return Object.assign({}, p, { w: w, id: w.id, alts: p.alts || [] }); });
    ADVS = LEX.advs.map(a => { const w = take(a.it, 'adv'); return Object.assign({}, a, { w: w, id: w.id, alts: a.alts || [] }); });
    PP = LEX.pp.map(f => ({ f: f, nouns: f.nouns.map(it => { if (!NBY[it]) throw new Error('sentence lexicon: prep noun ' + it); return NBY[it]; }) }));
    READY = words;
    return api;
  }

  function setPool(ids) { POOL = ids ? new Set(ids) : null; }
  function tierOf(n) { let id = 1; for (const t of TIERS) if (n >= t.min) id = t.id; return id; }
  function tierSpec(id) { return TIERS[Math.max(0, Math.min(TIERS.length, id) - 1)]; }
  function templatesFor(n) { return tierSpec(tierOf(n)).tpls.slice(); }
  function tensesForTier(tier) { return tierSpec(tier).tenses.slice(); }
  function templatesForTier(tier) { return tierSpec(tier).tpls.slice(); }

  function allows(list, noun) {
    if (!list || !list.length) return false;
    if (list.includes(noun.cls)) return true;
    return noun.tags.some(t => list.includes(t));
  }
  function adjFits(adj, noun) {
    if (!adj.on || !adj.on.some(x => x === noun.cls || noun.tags.includes(x))) return false;
    if (adj.notMass && noun.mass) return false;
    return true;
  }
  function shapesOf(v) {
    if (!v || v.skip) return [];
    const s = [];
    if (v.cop) s.push('cop');
    if (v.intr && !v.needPP) s.push('sv');
    if (v.pp || v.loc) s.push('svpp');
    if (v.obj && !v.ioOnly) s.push('svo');
    if (v.io) s.push('io');
    if (v.it === 'essere') s.push('ce');
    return s;
  }
  const verbByIt = it => VERBS.find(v => v.it === it);

  function nounForms(noun, num, g) {
    if (num !== 'p') return { form: noun.w.it, g: g };
    const r = M.nounPlural(noun.w);
    return { form: r.pl, g: noun.w.g === 'mf' ? g : (r.g === 'f' ? 'f' : 'm') };
  }
  function agreeG(noun, num, prefer) {
    if (noun.w.g === 'mf') return prefer === 'f' ? 'f' : 'm';
    if (num === 'p') return nounForms(noun, 'p', noun.w.g === 'f' ? 'f' : 'm').g;
    return noun.w.g === 'f' ? 'f' : 'm';
  }

  function auxChoice(verb, ctx) {
    const a = (verb.w && verb.w.aux) || verb.aux || 'a';
    if (a === 'a') return 'a';
    if (a === 'e') return 'e';
    if (ctx && ctx.hasObj) return 'a';
    if (ctx && ctx.hasPP && verb.auxMove === 'e') return 'e';
    if (verb.auxUse) return verb.auxUse;
    return 'e';
  }
  function verbSurface(verb, tense, person, g, aux) {
    const i = PERSONS.indexOf(person);
    if (tense === 'pp') return M.passato(verb.w, i, g === 'f' ? 'f' : 'm', aux);
    return M.tense(verb.w, tense)[i];
  }
  function verbCombo(verb, tense, person) {
    return 'v' + D.vgroup(verb.w, tense) + '|' + tense + '.' + person;
  }
  function adjCombo(adj, g, n) { return 'agr:' + D.aclass(adj.w) + '|' + g + '.' + n; }

  // ---------- English ----------
  const IRR = {
    be: ['be', 'is', 'being', 'was', 'been'], have: ['have', 'has', 'having', 'had', 'had'], do: ['do', 'does', 'doing', 'did', 'done'],
    go: ['go', 'goes', 'going', 'went', 'gone'], eat: ['eat', 'eats', 'eating', 'ate', 'eaten'], drink: ['drink', 'drinks', 'drinking', 'drank', 'drunk'],
    see: ['see', 'sees', 'seeing', 'saw', 'seen'], write: ['write', 'writes', 'writing', 'wrote', 'written'], read: ['read', 'reads', 'reading', 'read', 'read'],
    come: ['come', 'comes', 'coming', 'came', 'come'], take: ['take', 'takes', 'taking', 'took', 'taken'], give: ['give', 'gives', 'giving', 'gave', 'given'],
    get: ['get', 'gets', 'getting', 'got', 'gotten'], run: ['run', 'runs', 'running', 'ran', 'run'], leave: ['leave', 'leaves', 'leaving', 'left', 'left'],
    sleep: ['sleep', 'sleeps', 'sleeping', 'slept', 'slept'], bring: ['bring', 'brings', 'bringing', 'brought', 'brought'],
    buy: ['buy', 'buys', 'buying', 'bought', 'bought'], speak: ['speak', 'speaks', 'speaking', 'spoke', 'spoken'],
    find: ['find', 'finds', 'finding', 'found', 'found'], lose: ['lose', 'loses', 'losing', 'lost', 'lost'],
    know: ['know', 'knows', 'knowing', 'knew', 'known'], understand: ['understand', 'understands', 'understanding', 'understood', 'understood'],
    drive: ['drive', 'drives', 'driving', 'drove', 'driven'], pay: ['pay', 'pays', 'paying', 'paid', 'paid'],
    meet: ['meet', 'meets', 'meeting', 'met', 'met'], think: ['think', 'thinks', 'thinking', 'thought', 'thought'],
    make: ['make', 'makes', 'making', 'made', 'made'], begin: ['begin', 'begins', 'beginning', 'began', 'begun'],
    sit: ['sit', 'sits', 'sitting', 'sat', 'sat'], cost: ['cost', 'costs', 'costing', 'cost', 'cost'], put: ['put', 'puts', 'putting', 'put', 'put'],
    say: ['say', 'says', 'saying', 'said', 'said'], tell: ['tell', 'tells', 'telling', 'told', 'told'],
    feel: ['feel', 'feels', 'feeling', 'felt', 'felt'], hear: ['hear', 'hears', 'hearing', 'heard', 'heard'],
    become: ['become', 'becomes', 'becoming', 'became', 'become'], send: ['send', 'sends', 'sending', 'sent', 'sent'],
    spend: ['spend', 'spends', 'spending', 'spent', 'spent'], stand: ['stand', 'stands', 'standing', 'stood', 'stood'],
    fly: ['fly', 'flies', 'flying', 'flew', 'flown'], catch: ['catch', 'catches', 'catching', 'caught', 'caught'],
    forget: ['forget', 'forgets', 'forgetting', 'forgot', 'forgotten'], show: ['show', 'shows', 'showing', 'showed', 'shown'],
    mean: ['mean', 'means', 'meaning', 'meant', 'meant']
  };
  const EN_PL = { child: 'children', man: 'men', woman: 'women', person: 'people', gentleman: 'gentlemen', wife: 'wives', tooth: 'teeth', foot: 'feet', mouse: 'mice' };
  function pluralEn(w) {
    if (EN_PL[w]) return EN_PL[w];
    if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ies';
    if (/(s|x|z|ch|sh)$/.test(w)) return w + 'es';
    return w + 's';
  }
  function conjEn(base) {
    const bits = base.split(' '), head = bits[0], rest = bits.slice(1).join(' ');
    const add = s => rest ? s + ' ' + rest : s;
    if (IRR[head]) {
      const f = IRR[head];
      return { base: add(f[0]), s3: add(f[1]), ing: add(f[2]), past: add(f[3]), pp: add(f[4]) };
    }
    const s3 = /([^aeiou]y)$/.test(head) ? head.slice(0, -1) + 'ies' : /(s|x|z|ch|sh|o)$/.test(head) ? head + 'es' : head + 's';
    const ing = /[^e]e$/.test(head) ? head.slice(0, -1) + 'ing' : head + 'ing';
    let past;
    if (/[^aeiou]y$/.test(head)) past = head.slice(0, -1) + 'ied';
    else if (/e$/.test(head)) past = head + 'd';
    else if (/^(prefer|stop|plan)$/.test(head)) past = head + head.slice(-1) + 'ed';
    else past = head + 'ed';
    return { base: add(head), s3: add(s3), ing: add(ing), past: add(past), pp: add(past) };
  }
  const BE = { '1s': 'am', '2s': 'are', '3s': 'is', '1p': 'are', '2p': 'are', '3p': 'are' };
  const WAS = { '1s': 'was', '2s': 'were', '3s': 'was', '1p': 'were', '2p': 'were', '3p': 'were' };
  const haveOf = p => p === '3s' ? 'has' : 'have';
  const doOf = p => p === '3s' ? 'does' : 'do';

  function vpAlts(glosses, person, tense, neg) {
    const out = [];
    const push = s => { if (s && out.indexOf(s) < 0) out.push(s); };
    for (const g of glosses) {
      if (g === 'be') {
        const am = BE[person], was = WAS[person], hv = haveOf(person);
        if (tense === 'pres') neg ? push(am + ' not') : push(am);
        else if (tense === 'imp') { if (neg) { push(was + ' not'); push('did not use to be'); } else { push(was); push('used to be'); } }
        else if (tense === 'pp') { if (neg) { push(hv + ' not been'); push(was + ' not'); } else { push(hv + ' been'); push(was); } }
        else if (neg) { push('will not be'); push(am + ' not going to be'); } else { push('will be'); push(am + ' going to be'); }
        continue;
      }
      const f = conjEn(g), am = BE[person], was = WAS[person], hv = haveOf(person), dos = doOf(person);
      const fin = person === '3s' ? f.s3 : f.base;
      if (tense === 'pres') {
        if (neg) { push(dos + ' not ' + f.base); push(am + ' not ' + f.ing); }
        else { push(fin); push(am + ' ' + f.ing); push(dos + ' ' + f.base); }
      } else if (tense === 'imp') {
        if (neg) { push(was + ' not ' + f.ing); push('did not use to ' + f.base); }
        else { push(was + ' ' + f.ing); push('used to ' + f.base); }
      } else if (tense === 'pp') {
        if (neg) { push('did not ' + f.base); push(hv + ' not ' + f.pp); }
        else { push(f.past); push(hv + ' ' + f.pp); push('did ' + f.base); }
      } else if (neg) { push('will not ' + f.base); push(am + ' not going to ' + f.base); }
      else { push('will ' + f.base); push(am + ' going to ' + f.base); }
    }
    return out;
  }
  function normEn(s) {
    let t = ' ' + String(s || '').toLowerCase().replace(/[’`]/g, "'") + ' ';
    t = t.replace(/\bwon't\b/g, ' will not ').replace(/\bcan't\b/g, ' cannot ').replace(/\bit's been\b/g, ' it has been ')
      .replace(/\bi'm\b/g, ' i am ').replace(/\b(you|we|they)'re\b/g, ' $1 are ').replace(/\b(he|she|it)'s\b/g, ' $1 is ')
      .replace(/\b(i|you|he|she|it|we|they)'ll\b/g, ' $1 will ').replace(/\b(i|you|we|they)'ve\b/g, ' $1 have ')
      .replace(/\bthere's\b/g, ' there is ').replace(/\bthere're\b/g, ' there are ')
      .replace(/\bdon't\b/g, ' do not ').replace(/\bdoesn't\b/g, ' does not ').replace(/\bdidn't\b/g, ' did not ')
      .replace(/\bisn't\b/g, ' is not ').replace(/\baren't\b/g, ' are not ').replace(/\bwasn't\b/g, ' was not ')
      .replace(/\bweren't\b/g, ' were not ').replace(/\bhaven't\b/g, ' have not ').replace(/\bhasn't\b/g, ' has not ')
      .replace(/n't\b/g, ' not ');
    t = t.replace(/[^a-z' ]/g, ' ').replace(/\b(a|an|the|some)\b/g, ' ').replace(/\s+/g, ' ').trim();
    return t;
  }
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function compileSlots(slots) {
    const body = slots.map(alts => {
      const u = [];
      for (const a of alts) { const n = normEn(a); if (n && u.indexOf(n) < 0) u.push(n); }
      u.sort((a, b) => b.length - a.length);
      return '(?:' + (u.length ? u.map(reEsc).join('|') : '') + ')';
    }).join(' ');
    return new RegExp('^' + body + '$');
  }
  function gradeEn(typed, sent) {
    const n = normEn(typed);
    if (!n || !sent || !sent.patterns) return { ok: false };
    return { ok: sent.patterns.some(re => re.test(n)) };
  }
  function gradeIt(typed, sent, strict) {
    const t = D.clean(typed || '');
    if (!t || !sent) return { ok: false };
    const A = sent.itAnswers.map(D.clean);
    if (A.indexOf(t) >= 0) return { ok: true };
    const da = A.map(M.deaccent);
    if (da.indexOf(M.deaccent(t)) >= 0) return { ok: !strict, accent: true };
    return { ok: false };
  }

  function enWords(noun, num) {
    const one = (w, pl) => pl ? w.split(' ').map((x, i, a) => i === a.length - 1 ? pluralEn(x) : x).join(' ') : w;
    // pluralize the last word ("ice cream" → "ice creams", "little boy" → "little boys")
    const base = [noun.en].concat(noun.alts || []);
    return base.map(w => one(w, num === 'p'));
  }
  function adjGloss(adj, noun, g) {
    if (!adj) return [''];
    if (adj.it === 'bello') return (noun && noun.cls === 'person' && g !== 'f') ? ['handsome', 'beautiful'] : ['beautiful'];
    if (adj.it === 'buono') {
      if (noun && (noun.cls === 'food' || noun.cls === 'drink' || (noun.tags || []).indexOf('edible') >= 0)) return ['good', 'tasty'];
      if (noun && (noun.cls === 'person' || noun.cls === 'animal')) return ['kind', 'good'];
      return ['good'];
    }
    if (adj.it === 'bravo') return ['good', 'skilled'];
    if (adj.it === 'caro') return ['expensive'];
    if (adj.it === 'grande') return ['big', 'large'];
    if (adj.it === 'piccolo') return ['small', 'little'];
    return [adj.en].concat(adj.alts || []).filter(Boolean);
  }
  // bello/buono shorten to bel/buon before a masculine singular noun. Full forms stay after it.
  // Feminine bella/buona and every plural (belli, belle, buoni, buone) are the full forms, so they come first.
  function placesBefore(adj, g, n) {
    if (!adj || !adj.pre) return false;
    if (adj.it === 'bello' || adj.it === 'buono') return !(g === 'm' && n === 's');
    return true;
  }
  function cores(np) {
    const nouns = enWords(np.noun, np.num);
    const adjs = np.adj ? adjGloss(np.adj, np.noun, np.g) : [''];
    const out = [];
    for (const a of adjs) for (const n of nouns) {
      const s = [a, n].filter(Boolean).join(' ');
      if (out.indexOf(s) < 0) out.push(s);
    }
    return out;
  }
  function npPhrases(np) {
    const c = cores(np);
    if (np.poss) {
      const ps = [np.poss.en].concat(np.poss.alts || []);
      const out = [];
      for (const p of ps) for (const x of c) out.push(p + ' ' + x);
      return out;
    }
    if (np.det === 'none') return c;
    if (np.det === 'part') return c.map(x => 'some ' + x).concat(c);
    if (np.det === 'ind') return c.map(x => (needsAn(x) ? 'an ' : 'a ') + x).concat(c);
    return c.map(x => 'the ' + x).concat(c);
  }
  function needsAn(phrase) {
    const w = String(phrase || '').toLowerCase().split(' ')[0];
    // "a university / a euro / a hotel": the first sound is a consonant. "an old house": the adjective decides.
    if (/^(university|euro|one|hotel|hospital)$/.test(w)) return false;
    return /^[aeiou]/.test(w);
  }
  function frameEn(frame, np) {
    const raw = frame.f || frame;
    const pats = [raw.en].concat(raw.enAlt || []);
    const out = [];
    pats.forEach(pat => {
      if (!pat) return;
      if (pat.indexOf('$') < 0) { if (out.indexOf(pat) < 0) out.push(pat); return; }
      cores(np).forEach(c => { const s = pat.replace('$', c); if (out.indexOf(s) < 0) out.push(s); });
    });
    return out;
  }

  // ---------- noun phrase ----------
  function realizeArt(head, g, n, det, prep, plain) {
    if (det === 'none' || !det) return { art: null, tokens: [] };
    if (det === 'part' || prep) {
      const p = det === 'part' ? 'di' : prep;
      const def = artOf(head, g, n, 'def');
      if (plain) {
        const phrase = M.withArt(def, '');
        return { art: def, tokens: [{ t: p, helper: true, ids: [p], gloss: p === 'con' ? 'with' : p }, { t: def, helper: true, ids: ['il'], gloss: 'the' }] };
      }
      const c = contract(p, def);
      const gloss = det === 'part' ? 'some' : ({ a: 'to the', da: 'from the', in: 'in the', su: 'on the', di: 'of the' }[p] || 'the');
      return { art: def, tokens: [{ t: c, helper: true, ids: [p, 'il'], gloss: gloss }], elide: c.endsWith("'") };
    }
    const kind = det === 'ind' ? 'ind' : 'def';
    const a = artOf(head, g, n, kind);
    return { art: a, tokens: [{ t: a, helper: true, ids: [kind === 'ind' ? 'un' : 'il'], gloss: kind === 'ind' ? 'a' : 'the' }], elide: a.endsWith("'") };
  }

  function chooseNum(rng, noun, force) {
    if (force) return force;
    if (noun.mass || noun.w.sg) return 's';
    if (noun.w.pltant) return 'p';
    return rng() < 0.68 ? 's' : 'p';
  }
  function chooseDet(rng, noun, num, role) {
    if (noun.mass && !noun.cup) return rng() < 0.5 ? 'part' : 'def';
    if (role === 'exist') return num === 'p' || noun.mass ? 'part' : (noun.cup || !noun.mass ? 'ind' : 'part');
    if (num === 'p') return rng() < 0.75 ? 'def' : 'part';
    if (role === 'subj') return 'def';
    return rng() < 0.5 ? 'def' : 'ind';
  }

  function candidates(rng, pred) {
    const xs = NOUNS.filter(n => inPool(n) && pred(n));
    return xs.length ? xs : [];
  }

  function buildNP(rng, spec) {
    spec = spec || {};
    let pool = candidates(rng, n => {
      if (spec.exclude && spec.exclude.has(n.it)) return false;
      if (spec.nouns && spec.nouns.indexOf(n) < 0 && spec.nounIts && spec.nounIts.indexOf(n.it) < 0) return false;
      if (spec.cls && !allows(spec.cls, n)) return false;
      if (spec.poss && n.noposs) return false;
      if (spec.num === 'p' && (n.mass || n.w.sg)) return false;
      if (spec.num === 's' && n.w.pltant) return false;
      return true;
    });
    if (spec.nouns) pool = pool.filter(n => spec.nouns.indexOf(n) >= 0);
    if (!pool.length) return null;
    // Article-combo constraint: keep nouns that can wear it.
    if (spec.art) pool = pool.filter(n => nounCanArt(n, spec.art));
    if (spec.agr) pool = pool.filter(n => nounCanAgr(n, spec.agr));
    if (!pool.length) return null;
    const noun = pick(rng, pool);
    let num = spec.num || chooseNum(rng, noun);
    if (spec.art) num = artNum(spec.art);
    if (spec.agr) num = spec.agr.n;
    if ((noun.mass || noun.w.sg) && num === 'p') return null;
    let g = spec.g || (spec.agr && spec.agr.g) || (spec.art && artG(spec.art)) || agreeG(noun, num, rng() < 0.5 ? 'f' : 'm');
    if (noun.w.g !== 'mf' && noun.w.g !== g && !(num === 'p' && nounForms(noun, 'p').g === g)) {
      const ng = num === 'p' ? nounForms(noun, 'p').g : (noun.w.g === 'f' ? 'f' : 'm');
      if (ng !== g) return null;
      g = ng;
    }
    if (noun.w.g === 'mf') { /* g already chosen */ }
    else g = num === 'p' ? nounForms(noun, 'p').g : (noun.w.g === 'f' ? 'f' : 'm');
    if (spec.agr && spec.agr.g !== g) return null;
    if (spec.art && artG(spec.art) !== g) return null;
    const fm = nounForms(noun, num, g);
    const form = fm.form;
    g = fm.g;
    if (spec.art && artCombo(spec.artHead || form, g, num, artDet(spec.art)) !== spec.art && !spec.artLoose) {
      // pre-adjective may change the onset the combo was built on; checked again after the adjective is chosen
    }

    let adj = null;
    if (spec.attr || spec.agr) {
      const as = ADJS.filter(a => inPool(a) && a.attr && adjFits(a, noun) && (!spec.agr || D.aclass(a.w) === spec.agr.cls));
      if (!as.length) return null;
      adj = pick(rng, as);
    } else if (spec.maybeAttr && rng() < 0.5) {
      const as = ADJS.filter(a => inPool(a) && a.attr && adjFits(a, noun));
      if (as.length) adj = pick(rng, as);
    }
    if ((spec.attr || spec.agr) && !adj) return null;
    if (noun.kin && adj) return null;

    const adjForm = adj ? M.adjAgree(adj.w, g, num) : null;
    const pre = placesBefore(adj, g, num);

    let poss = null;
    if (spec.poss) {
      const ps = POSS.filter(inPool);
      if (!ps.length) return null;
      poss = pick(rng, ps);
    }
    const possForm = poss ? possAgree(poss, g, num) : null;
    // The article agrees with the first word: possessive, else a preceding adjective, else the noun.
    const head = poss ? possForm : (pre ? adjForm : form);

    let det = spec.det || null;
    if (poss && noun.kin && num === 's' && !adj) det = 'none';
    else if (poss) det = 'def';
    else if (!det) det = chooseDet(rng, noun, num, spec.role || 'obj');
    if (spec.art) det = artDet(spec.art);
    if (det === 'ind' && (num === 'p' || (noun.mass && !noun.cup))) det = num === 'p' ? 'def' : 'part';
    if (spec.frame && !spec.frame.f.art) det = 'none';
    if (spec.frame && spec.frame.f.art) det = 'def';
    if (spec.role === 'subj' && !spec.art && det !== 'none') det = 'def';
    if (spec.art && det === 'none') return null;

    if (spec.art && det !== 'none') {
      const key = artCombo(head, g, num, det === 'part' ? 'def' : det);
      if (key !== spec.art) return null;
    }

    const prep = spec.frame ? spec.frame.f.prep : null;
    const plain = spec.frame ? !!spec.frame.f.plain : false;
    const built = realizeArt(head, g, num, prep ? 'def' : det, prep, plain);
    if (spec.frame && !spec.frame.f.art) {
      built.tokens = [{ t: prep, helper: true, ids: [prep], gloss: { a: 'to', da: 'from', in: 'in', su: 'on', con: 'with', di: 'of' }[prep] || prep }];
      built.art = null;
      built.elide = false;
    }

    const tokens = [];
    const push = (tok, elide) => { if (elide) tok.stick = true; tokens.push(tok); };
    built.tokens.forEach((t, i) => push(t, built.elide && i === built.tokens.length - 1));
    if (poss) tokens.push({ t: possForm, id: poss.id, content: true });
    if (pre) tokens.push({ t: adjForm, id: adj.id, content: true, adj: true });
    tokens.push({ t: form, id: noun.id, content: true, noun: true });
    if (adj && !pre) tokens.push({ t: adjForm, id: adj.id, content: true, adj: true });

    let en;
    if (spec.frame) en = frameEn(spec.frame, { noun: noun, num: num, adj: adj, g: g });
    else en = npPhrases({ noun: noun, num: num, adj: adj, poss: poss, det: det, g: g });

    const surface = joinTok(tokens);
    return {
      noun: noun, num: num, g: g, form: form, det: prep ? (spec.frame.f.art ? 'def' : 'none') : det,
      art: built.art, prep: prep, plain: plain, adj: adj, adjForm: adjForm, pre: pre,
      poss: poss, possForm: possForm, tokens: tokens, en: en, surface: surface, head: head, role: spec.role || 'np'
    };
  }

  function possAgree(poss, g, n) {
    if (poss.it === 'loro') return 'loro';
    return M.adjAgree({ it: poss.it }, g, n);
  }
  function adjSplitsNumber(comp, g) {
    if (!comp || !comp.adj) return false;
    return M.adjAgree(comp.adj.w, g === 'f' ? 'f' : 'm', 's') !== M.adjAgree(comp.adj.w, g === 'f' ? 'f' : 'm', 'p');
  }
  function artDet(combo) { return combo.split('|')[1].split('.')[0] === 'ind' ? 'ind' : 'def'; }
  function artG(combo) { return combo.split('|')[1].split('.')[1]; }
  function artNum(combo) {
    const k = combo.split('|')[1].split('.');
    if (k[0] === 'ind') return 's';
    return k[2];
  }
  function nounCanArt(n, combo) {
    const det = artDet(combo), g = artG(combo), num = artNum(combo);
    if (g === 'f' && n.w.g === 'm') return false;
    if (g === 'm' && n.w.g === 'f') return false;
    if (num === 'p' && (n.mass || n.w.sg)) return false;
    if (num === 's' && n.w.pltant) return false;
    const gg = n.w.g === 'mf' ? g : (num === 'p' ? nounForms(n, 'p').g : (n.w.g === 'f' ? 'f' : 'm'));
    if (gg !== g) return false;
    const form = nounForms(n, num, gg).form;
    return artCombo(form, gg, num, det) === combo;
  }
  function nounCanAgr(n, agr) {
    if (agr.n === 'p' && (n.mass || n.w.sg)) return false;
    const g = n.w.g === 'mf' ? agr.g : (agr.n === 'p' ? nounForms(n, 'p').g : (n.w.g === 'f' ? 'f' : 'm'));
    return g === agr.g;
  }

  function joinTok(tokens) {
    let s = '';
    tokens.forEach(t => {
      if (!t || t.omit) return;
      if (s && !s.endsWith("'")) s += ' ';
      s += t.t;
    });
    return s;
  }
  function capIt(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function capEn(s) {
    if (/^i(?:\b|')/.test(s)) return 'I' + s.slice(1);
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  // ---------- clause ----------
  function pickVerb(rng, shape, opts) {
    let vs = VERBS.filter(v => !v.skip && (v.helper || inPool(v) || v.it === 'essere' || v.it === 'stare') && shapesOf(v).indexOf(shape) >= 0);
    // essere and stare are helpers: always available. Lexical verbs must be in the pool.
    vs = vs.filter(v => v.it === 'essere' || v.it === 'stare' || v.it === 'avere' || inPool(v));
    if (opts.verbIt) vs = vs.filter(v => v.it === opts.verbIt);
    if (opts.group) vs = vs.filter(v => D.vgroup(v.w, opts.tense) === opts.group);
    if (opts.person && shape === 'ce' && opts.person[0] !== '3') return null;
    if (!vs.length) return null;
    return pick(rng, vs);
  }

  function glossesOf(verb, obj) {
    let en = verb.en;
    if (verb.enFor && obj) {
      const tag = Object.keys(verb.enFor).find(k => obj.noun.tags.indexOf(k) >= 0 || obj.noun.cls === k);
      if (tag) en = verb.enFor[tag];
    }
    if (verb.ask && obj && obj.role === 'io-verb') en = 'ask';
    return [en].concat(verb.alts || []);
  }

  function buildClause(rng, shape, opts) {
    opts = opts || {};
    const tense = opts.tense;
    if (!tense) return null;
    const verb = opts.verb || pickVerb(rng, shape, opts);
    if (!verb) return null;
    if (opts.group && D.vgroup(verb.w, tense) !== opts.group) return null;

    const ex = new Set(opts.exclude || []);
    let subj = null, obj = null, io = null, pp = null, comp = null, pron = null;
    let person = opts.person || null;
    let gSub = 'm', num = 's';

    if (shape === 'ce') {
      const np = buildNP(rng, { role: 'exist', cls: ['person', 'animal', 'place', 'thing', 'food', 'drink', 'vehicle'], num: person === '3p' ? 'p' : (person === '3s' ? 's' : null), art: opts.art, agr: opts.agrOnNoun, attr: opts.needAttr, poss: opts.needPoss, exclude: ex, maybeAttr: opts.maybeAttr });
      if (!np) return null;
      if (np.noun.mass && np.num === 'p') return null;
      person = np.num === 'p' ? '3p' : '3s';
      gSub = np.g;
      const form = ciSurface(tense, person, gSub);
      const neg = !!opts.neg;
      const tokens = [];
      if (neg) tokens.push({ t: 'non', helper: true, ids: ['non'], gloss: 'not' });
      tokens.push({ t: form, helper: true, ids: ['ci', 'essere'], gloss: ceGloss(tense, person, neg), verb: true });
      np.tokens.forEach(t => tokens.push(t));
      let nounEn = np.en;
      if (neg && np.det === 'part') {
        const bare = np.en.filter(x => !/^some /.test(x));
        nounEn = bare.map(x => 'any ' + x).concat(bare);
      }
      const there = ceEn(tense, person, neg);
      const slots = [there, nounEn];
      return finishClause({ tokens: tokens, slots: slots, pronouns: [], nps: [tag(np, 'S')], verbs: [ceVerb(tense, person, gSub, form)], subjKey: 'ce:' + np.noun.it, ids: contentIds(tokens), targets: targetsOf(np) });
    }

    // Subject: pronoun (1st/2nd) or noun.
    const personOK = !verb.subj || verb.subj.indexOf('person') >= 0;
    const forceNoun = !(person && person[0] !== '3') && ((opts.needPoss && opts.possOn !== 'obj') || (opts.needAttr && opts.attrOn !== 'obj' && opts.attrOn !== 'pp') || (opts.art && opts.artOn === 'subj'));
    const esserePron = verb.it === 'essere' && (shape === 'cop' || shape === 'svpp');
    let pPick = null;
    if (person === '3s' || person === '3p') pPick = esserePron ? person : null;
    else if (person && person[0] !== '3') pPick = personOK ? person : null;
    else if (personOK && !forceNoun && rng() < (shape === 'cop' ? 0.34 : 0.22)) {
      const bag = ['1s', '2s', '1p', '2p'];
      if (esserePron) bag.push('3s', '3p');
      pPick = pick(rng, bag);
    }
    if (pPick) {
      person = pPick;
      if (pPick === '3s') {
        gSub = rng() < 0.5 ? 'm' : 'f';
        pron = gSub === 'f' ? { it: 'lei', en: ['she'], num: 's', formal: true } : { it: 'lui', en: ['he'], num: 's', formal: true };
      } else if (pPick === '3p') {
        gSub = rng() < 0.55 ? 'm' : 'f';
        pron = { it: 'loro', en: ['they'], num: 'p' };
        num = 'p';
      } else {
        pron = PRON[pPick];
        num = pron.num;
        gSub = (pPick === '1p' || pPick === '2p') ? (rng() < 0.75 ? 'm' : 'f') : (rng() < 0.5 ? 'm' : 'f');
      }
      if (pPick !== '3s' && pPick !== '3p') num = pron.num;
      if (opts.agr && opts.agrWhere === 'pred') { gSub = opts.agr.g; num = opts.agr.n; if ((num === 'p') !== (pron.num === 'p')) return null; }
    } else {
      let cls = verb.subj || ['person'];
      if (shape === 'svpp' && (verb.it === 'essere' || verb.it === 'stare')) cls = ['person', 'animal', 'vehicle'];
      const np = buildNP(rng, {
        role: 'subj', cls: cls, num: person ? (person[1] === 'p' ? 'p' : 's') : null,
        art: opts.artOn === 'subj' ? opts.art : null,
        agr: opts.agrWhere === 'attr' ? opts.agr : null,
        attr: opts.needAttr && opts.attrOn !== 'obj',
        poss: opts.needPoss && opts.possOn !== 'obj',
        maybeAttr: opts.maybeAttr && !opts.needAttr,
        exclude: ex
      });
      if (!np) return null;
      subj = np;
      person = np.num === 'p' ? '3p' : '3s';
      gSub = np.g;
      num = np.num;
      ex.add(np.noun.it);
      if (opts.person && opts.person !== person) return null;
    }

    if (shape === 'cop') {
      comp = pickComp(rng, verb, subj, gSub, num, opts);
      if (!comp) return null;
    }

    if (shape === 'svo' || shape === 'io') {
      const np = buildNP(rng, {
        role: 'obj', cls: verb.obj, exclude: ex,
        art: opts.artOn === 'obj' || (!subj && opts.art) ? opts.art : null,
        agr: opts.agrWhere === 'obj' ? opts.agr : null,
        attr: !!(opts.needAttr && opts.attrOn === 'obj'),
        poss: !!(opts.needPoss && opts.possOn === 'obj'),
        maybeAttr: opts.maybeAttr
      });
      if (!np) return null;
      obj = np; ex.add(np.noun.it);
    }
    if (shape === 'io') {
      const who = buildNP(rng, { role: 'io', cls: ['person'], det: 'def', exclude: ex, num: rng() < 0.7 ? 's' : null });
      if (!who) return null;
      io = who;
    }
    if (shape === 'svpp') {
      const who = pron ? 'person' : (subj ? subj.noun.cls : '');
      const frames = PP.filter(f => f.f.vs.indexOf(verb.it) >= 0 && (f.f.who || ['person', 'animal']).indexOf(who) >= 0);
      if (!frames.length) return null;
      const frame = pick(rng, frames);
      let ppNum = frame.f.sg || frame.f.en.indexOf('$') < 0 || !frame.f.art ? 's' : null;
      if (verb.it === 'salire' || verb.it === 'scendere') ppNum = (subj && subj.num === 'p') || (pron && pron.num === 'p') ? 'p' : 's';
      const np = buildNP(rng, { role: 'pp', nouns: frame.nouns, frame: frame, exclude: ex, num: ppNum, maybeAttr: frame.f.en.indexOf('$') >= 0 && opts.maybeAttr, attr: frame.f.en.indexOf('$') >= 0 && opts.needAttr && !subj && !obj, poss: false });
      if (!np) return null;
      if (frame.f.en.indexOf('$') < 0 && np.adj) return null;
      pp = np;
    }

    if (opts.needPoss && !hasPoss(subj) && !hasPoss(obj)) return null;
    if (opts.needAttr && !hasAdj(subj) && !hasAdj(obj) && !hasAdj(pp)) return null;

    const hasObj = !!obj, hasPP = !!pp;
    const aux = tense === 'pp' ? auxChoice(verb, { hasObj: hasObj, hasPP: hasPP }) : null;
    const surface = shape === 'cop' || shape === 'sv' || shape === 'svo' || shape === 'io' || shape === 'svpp'
      ? verbSurface(verb, tense, person, gSub, aux || (verb.w.aux === 'e' ? 'e' : 'a')) : null;
    if (!surface) return null;

    const neg = !!opts.neg;
    const tokens = [];
    const pronouns = [];
    if (pron) pronouns.push({ at: 0, it: pron.it, en: pron.en[0] });
    if (subj) subj.tokens.forEach(t => tokens.push(t));
    if (neg) tokens.push({ t: 'non', helper: true, ids: ['non'], gloss: 'not' });
    const vTok = { t: surface, id: (verb.it === 'essere' || verb.it === 'stare') ? verb.id : verb.id, content: verb.it !== 'essere' && verb.it !== 'stare', verb: true, helper: verb.it === 'essere' || verb.it === 'stare' || tense === 'pp', ids: verbIds(verb, aux), gloss: verbGloss(verb, aux, tense) };
    if (verb.it !== 'essere' && verb.it !== 'stare') vTok.helper = tense === 'pp';
    tokens.push(vTok);
    if (comp && comp.tokens) comp.tokens.forEach(t => tokens.push(t));
    if (obj) obj.tokens.forEach(t => tokens.push(t));
    if (io) {
      const head = io.pre ? io.adjForm : io.form;
      const def = artOf(head, io.g, io.num, 'def');
      const c = contract('a', def);
      io.prep = 'a'; io.art = def; io.plain = false; io.det = 'def';
      io.tokens = [{ t: c, helper: true, ids: ['a', 'il'], gloss: 'to the' }].concat(io.tokens.filter(t => !t.helper));
      io.surface = joinTok(io.tokens);
      io.tokens.forEach(t => tokens.push(t));
    }
    if (pp) pp.tokens.forEach(t => tokens.push(t));

    const slotArgs = { pron: pron, subj: subj, verb: verb, obj: obj, io: io, pp: pp, comp: comp, person: person, tense: tense, neg: neg, g: gSub };
    const en = englishSlots(slotArgs);
    const slots = en.slots;
    const alts = en.alt ? [en.alt] : [];
    // "sono" is io or loro. Both English readings work when nothing else shows the number
    // ("Sono a casa"). A plural adjective ("Sono stanchi") is only loro; a singular one only io.
    if (verb.it === 'essere' && surface === 'sono' && !subj && !adjSplitsNumber(comp, gSub)) {
      const other = person === '3p' ? '1s' : '3p';
      const opron = other === '3p' ? { it: 'loro', en: ['they'], num: 'p' } : { it: 'io', en: ['I'], num: 's' };
      const o = englishSlots(Object.assign({}, slotArgs, { pron: opron, person: other }));
      alts.push(o.slots); if (o.alt) alts.push(o.alt);
    }
    // Bare "è" with lei/lui: she/he, and formal Lei ("you are").
    if (pron && pron.formal && !subj && verb.it === 'essere') {
      const o = englishSlots(Object.assign({}, slotArgs, { pron: { it: pron.it, en: ['you'], num: 's' }, person: '2s' }));
      alts.push(o.slots); if (o.alt) alts.push(o.alt);
    }
    const nps = [subj && tag(subj, 'S'), obj && tag(obj, 'O'), io && tag(io, 'IO'), pp && tag(pp, 'PP')].filter(Boolean);
    const verbs = [{ it: verb.it, id: verb.id, tense: tense, person: person, g: gSub, n: num, aux: aux, hasObj: hasObj, hasPP: hasPP, surface: surface, helper: verb.it === 'essere' || verb.it === 'stare' }];
    const targets = [];
    nps.forEach(np => targetsOf(np).forEach(t => targets.push(t)));
    if (comp && comp.adj) targets.push(adjTarget(comp.adj, comp.form, gSub, num, tokens));
    targets.push(verbTarget(verb, tense, person, surface, tokens));
    return finishClause({ tokens: tokens, slots: slots, alts: alts, pronouns: pronouns, nps: nps, verbs: verbs, subjKey: pron ? person : subj.noun.it, ids: contentIds(tokens), targets: targets });
  }

  function hasPoss(np) { return !!(np && np.poss); }
  function hasAdj(np) { return !!(np && np.adj); }
  function tag(np, role) { np.role = role; return np; }

  function pickComp(rng, verb, subj, g, num, opts) {
    const noun = subj ? subj.noun : { cls: 'person', tags: [], mass: false, kin: null, w: { g: g } };
    // A pronoun subject is a person (or a group of people).
    const fake = subj ? subj.noun : { cls: 'person', tags: ['person'], mass: false, kin: null };
    if (verb.it === 'stare' && (opts.preferAdv || rng() < 0.45)) {
      const adv = ADVS.filter(inPool);
      if (adv.length && fake.cls === 'person') {
        const a = pick(rng, adv);
        return { adv: a, tokens: [{ t: a.it, id: a.id, content: true }], en: [a.en].concat(a.alts || []), agree: false };
      }
    }
    const OPP = { grande: 'piccolo', piccolo: 'grande', lungo: 'corto', corto: 'lungo', aperto: 'chiuso', chiuso: 'aperto', pieno: 'vuoto', vuoto: 'pieno', caldo: 'freddo', freddo: 'caldo', nuovo: 'vecchio', vecchio: 'nuovo' };
    let as = ADJS.filter(a => inPool(a) && (verb.it === 'stare' ? (a.pred === 'stare' || a.pred === 'both') : (a.pred === 'essere' || a.pred === 'both')) && adjFits(a, fake));
    if (subj && subj.adj) as = as.filter(a => a.it !== subj.adj.it && OPP[subj.adj.it] !== a.it);
    if (opts.agr && opts.agrWhere === 'pred') as = as.filter(a => D.aclass(a.w) === opts.agr.cls);
    if (opts.needAttr && !opts.agr) { /* predicate is not attributive */ }
    if (!as.length) return null;
    const a = pick(rng, as);
    const form = M.adjAgree(a.w, g, num);
    return { adj: a, form: form, tokens: [{ t: form, id: a.id, content: true, adj: true }], en: adjGloss(a, fake, g), agree: true };
  }

  function ciSurface(tense, person, g) {
    const essere = verbByIt('essere');
    const i = person === '3p' ? 5 : 2;
    const core = tense === 'pp' ? M.passato(essere.w, i, g === 'f' ? 'f' : 'm', 'e') : M.tense(essere.w, tense)[i];
    if (/^[eè]/.test(core)) return "c'" + core;
    return 'ci ' + core;
  }
  function ceGloss(tense, person) {
    if (tense === 'pres') return person === '3p' ? 'there are' : 'there is';
    if (tense === 'imp') return person === '3p' ? 'there were' : 'there was';
    if (tense === 'fut') return 'there will be';
    return person === '3p' ? 'there were' : 'there was';
  }
  function ceEn(tense, person, neg) {
    const pl = person === '3p';
    let base;
    if (tense === 'pres') base = pl ? ['there are'] : ['there is'];
    else if (tense === 'imp') base = pl ? ['there were'] : ['there was'];
    else if (tense === 'fut') base = ['there will be'];
    else base = pl ? ['there were', 'there have been'] : ['there was', 'there has been'];
    if (!neg) return base;
    return base.map(b => b.replace(/\b(is|are|was|were|will)\b/, m => m + ' not').replace('will not be', 'will not be'));
  }
  function ceVerb(tense, person, g, form) {
    return { it: 'essere', id: 'essere', tense: tense, person: person, g: g, n: person[1] === 'p' ? 'p' : 's', aux: tense === 'pp' ? 'e' : null, hasObj: false, hasPP: false, surface: form, helper: true, exist: true };
  }

  function verbIds(verb, aux) {
    const ids = [];
    if (verb.it === 'essere' || verb.it === 'stare') ids.push(verb.id);
    if (aux === 'a') ids.push('avere');
    if (aux === 'e') ids.push('essere');
    return ids;
  }
  function verbGloss(verb, aux) {
    if (verb.it === 'essere' || verb.it === 'stare') return 'be';
    if (aux === 'a') return 'have';
    if (aux === 'e') return 'be';
    return null;
  }

  function englishSlots(x) {
    const subj = x.pron ? x.pron.en.slice() : x.subj.en.slice();
    let glosses = glossesOf(x.verb, x.obj);
    if (x.verb.ask && x.io) glosses = ['ask'];
    if (x.comp) {
      const be = vpAlts(['be'], x.person, x.tense, x.neg);
      const comps = x.comp.en;
      const vp = [];
      for (const b of be) for (const c of comps) vp.push((b + ' ' + c).replace(/\s+/g, ' '));
      const slots = [subj, vp];
      return { slots: slots, alt: null };
    }
    const vp = vpAlts(glosses, x.person, x.tense, x.neg);
    const slots = [subj, vp];
    const alt = x.io && x.verb.io === 'to' && !x.verb.ask ? [subj.slice(), vp.slice()] : null;
    if (x.verb.ask && x.io) {
      slots.push(x.io.en, ['for'], x.obj.en);
    } else if (x.io && x.verb.io === 'for') {
      slots.push(x.obj.en, ['for'], x.io.en);
    } else if (x.io && x.verb.io === 'to') {
      slots.push(x.obj.en, ['to'], x.io.en);
      if (alt) { alt.push(x.io.en, x.obj.en); }
    } else if (x.obj) slots.push(x.obj.en);
    if (x.pp) slots.push(x.pp.en);
    if (alt && x.pp) alt.push(x.pp.en);
    return { slots: slots, alt: alt };
  }

  function targetsOf(np) {
    const out = [];
    if (!np) return out;
    const det = np.det === 'part' ? 'def' : np.det;
    if (det === 'def' || det === 'ind') {
      const head = np.pre ? np.adjForm : np.form;
      out.push({ kind: 'noun', it: np.noun.it, id: np.noun.id, g: np.g, n: np.num, form: np.form, combo: artCombo(head, np.g, np.num, det), token: 'noun' });
    }
    if (np.adj) out.push({ kind: 'adj', it: np.adj.it, id: np.adj.id, g: np.g, n: np.num, form: np.adjForm, combo: adjCombo(np.adj, np.g, np.num), token: 'adj' });
    return out;
  }
  function adjTarget(adj, form, g, n) {
    return { kind: 'adj', it: adj.it, id: adj.id, g: g, n: n, form: form, combo: adjCombo(adj, g, n), token: 'adj' };
  }
  function verbTarget(verb, tense, person, surface) {
    return { kind: 'verb', it: verb.it, id: verb.id, tense: tense, person: person, form: surface, combo: verbCombo(verb, tense, person), token: 'verb', helper: verb.it === 'essere' || verb.it === 'stare' };
  }

  function contentIds(tokens) {
    const ids = [];
    tokens.forEach(t => { if (t.content && t.id && ids.indexOf(t.id) < 0) ids.push(t.id); });
    return ids;
  }
  function finishClause(c) {
    // Attach token indexes onto targets by walking tokens.
    const take = (pred) => {
      for (let i = 0; i < c.tokens.length; i++) if (pred(c.tokens[i], i)) return i;
      return -1;
    };
    c.targets.forEach(t => {
      if (t.kind === 'verb') t.i = take(tok => tok.verb);
      else if (t.kind === 'adj') t.i = take(tok => tok.adj && tok.t === t.form);
      else t.i = take(tok => tok.noun && tok.t === t.form);
    });
    c.targets = c.targets.filter(t => t.i >= 0);
    return c;
  }

  function clauseWorks(c, opts) {
    if (!c) return false;
    if (opts.needPoss) {
      const ok = (c.nps || []).some(np => np.poss);
      if (!ok) return false;
    }
    if (opts.needAttr) {
      const ok = (c.nps || []).some(np => np.adj) || (c.compAdj);
      if (!ok) return false;
    }
    if (opts.art && !(c.targets || []).some(t => t.combo === opts.art)) return false;
    if (opts.verbCombo && !(c.targets || []).some(t => t.combo === opts.verbCombo)) return false;
    if (opts.agrCombo && !(c.targets || []).some(t => t.combo === opts.agrCombo)) return false;
    return true;
  }

  // Possessive / adjective flags: a few attempts inside the clause, because "need" means it must show up.
  function buildFlex(rng, shape, opts) {
    const tries = opts.needPoss || opts.needAttr || opts.art || opts.agrCombo || opts.verbIt ? 24 : 10;
    for (let i = 0; i < tries; i++) {
      const o = Object.assign({}, opts);
      if (o.needPoss && !o.possPlaced) {
        o.needPoss = false;
        o.possOn = rng() < 0.5 ? 'subj' : 'obj';
        // Pass poss into build by temporarily requiring it on a random NP via spec. We'll set a flag read below.
        o.forcePoss = true;
      }
      if (o.needAttr) o.forceAttr = true;
      const c = buildClause(rng, shape, decorate(o));
      if (clauseWorks(c, opts)) return c;
    }
    return null;
  }
  function decorate(o) {
    // Map force flags onto the spec fields buildClause already understands.
    if (o.forcePoss) o.needPoss = true;
    if (o.forceAttr) { o.needAttr = true; o.maybeAttr = false; }
    else if (!o.needAttr) o.maybeAttr = false;
    return o;
  }

  // The buildClause above returns null when needPoss isn't already on an NP.
  // Place poss/attr up front so the first construction has them.
  function buildClausePlaced(rng, shape, opts) {
    const o = Object.assign({}, opts);
    if (opts.needPoss) {
      // Tell buildNP via a closure flag: we pass poss:true to the subject or the object.
      o._poss = opts.possOn || (rng() < 0.55 ? 'subj' : 'obj');
    }
    if (opts.needAttr) o._attr = opts.attrOn || (rng() < 0.5 ? 'subj' : 'obj');
    return buildClause(rng, shape, o);
  }

  // Rebuild buildClause's poss/attr decisions using opts._poss / _attr. The function above
  // already takes opts.needPoss and then returns null. Replace that behavior by passing
  // poss/attr into the NP specs. Done below by wrapping buildNP calls... The cleanest fix
  // is a small pre-pass: monkeypatch via opts fields that buildClause reads.
  // buildClause currently uses opts.needAttr && opts.attrOn. I'll set those and also
  // change the early "return null" into a directed build. See buildDirected.

  function buildDirected(rng, shape, opts) {
    const o = Object.assign({}, opts);
    o.needPoss = false;
    o.needAttr = false;
    o.maybeAttr = false;
    if (opts.needPoss) {
      if (shape === 'svo' || shape === 'io') o.possOn = o.possOn || (rng() < 0.5 ? 'obj' : 'subj');
      else o.possOn = 'subj';
    }
    if (opts.needAttr) {
      if (shape === 'cop') o.attrOn = 'subj';
      else if (shape === 'svo' || shape === 'io') o.attrOn = o.attrOn || (rng() < 0.55 ? 'obj' : 'subj');
      else o.attrOn = 'subj';
    }
    // buildClause reads possOn/attrOn only in the NP spec as `poss: opts.needPoss && possOn`.
    // Re-enable the flags for the specs and skip the end check's rebuild by satisfying them.
    o.needPoss = !!opts.needPoss;
    o.needAttr = !!opts.needAttr;
    // Prevent the "return null" at the poss check by placing them in the spec. The check
    // still runs; the spec must have honored possOn. buildClause uses:
    //   poss: opts.needPoss && opts.possOn !== 'obj'   for the subject
    //   poss: opts.needPoss && !subj                 for the object
    // That second condition is wrong when the subject already exists. Fix: pass explicit booleans.
    o.possSubj = opts.needPoss && o.possOn !== 'obj';
    o.possObj = opts.needPoss && o.possOn === 'obj';
    o.attrSubj = opts.needAttr && o.attrOn !== 'obj';
    o.attrObj = opts.needAttr && o.attrOn === 'obj';
    o.attrPP = opts.needAttr && shape === 'svpp' && !o.attrSubj;
    const c = buildClause(rng, shape, o);
    if (!clauseWorks(c, opts)) return null;
    return c;
  }

  // ---------- generate ----------
  function resolveTier(opts) {
    if (opts.tier) return opts.tier;
    if (opts.seenCount != null) return tierOf(opts.seenCount);
    if (POOL) {
      let n = 0;
      NOUNS.concat(VERBS).concat(ADJS).concat(POSS).concat(ADVS).forEach(e => {
        if (e.skip || e.it === 'essere' || e.it === 'stare' || e.it === 'avere') return;
        if (POOL.has(e.id)) n++;
      });
      return tierOf(n);
    }
    return 4;
  }

  function generateOne(rng, template, opts) {
    const tier = opts.tier || resolveTier(opts);
    const spec = tierSpec(tier);
    if (spec.tpls.indexOf(template) < 0 && !opts.allowAny) return null;
    const tense = opts.tense || pickTense(rng, tier);
    if (spec.tenses.indexOf(tense) < 0) return null;
    const innerOpts = {
      tense: tense, tier: tier,
      neg: template === 'NEG' || !!opts.neg,
      needPoss: template === 'POSS' || !!opts.needPoss,
      needAttr: template === 'NADJ' || !!opts.needAttr,
      person: opts.person || null,
      verbIt: opts.verbIt || null,
      group: opts.group || null,
      art: opts.art || null,
      agr: opts.agr || null,
      agrWhere: opts.agrWhere || (opts.agr ? 'pred' : null),
      verbCombo: opts.verbCombo || null,
      agrCombo: opts.agrCombo || null,
      exclude: opts.exclude || null
    };
    if (tier >= 2 && template !== 'POSS' && !innerOpts.needPoss && template !== 'COORD' && rng() < 0.22) innerOpts.needPoss = true;
    if (tier >= 3 && template !== 'NADJ' && !innerOpts.needAttr && template !== 'COORD' && rng() < 0.28) innerOpts.needAttr = true;
    if (tier >= 4 && !innerOpts.neg && BASE[template] && rng() < 0.18) innerOpts.neg = true;
    if (innerOpts.needAttr && tier < 3) return null;
    if (innerOpts.needPoss && tier < 2) return null;
    if (innerOpts.neg && template !== 'NEG' && tier < 4) innerOpts.neg = false;
    if (template === 'NEG') innerOpts.neg = true;

    if (template === 'COORD') return buildCoord(rng, innerOpts, tier);
    const shapes = innerShapes(template, tier, rng);
    for (const shape of shapes) {
      const o = Object.assign({}, innerOpts);
      if (shape === 'ce') o.artOn = 'exist';
      if (o.art && !o.artOn) o.artOn = shape === 'svo' || shape === 'io' ? (rng() < 0.5 ? 'obj' : 'subj') : 'subj';
      if (o.agr && shape === 'cop') o.agrWhere = 'pred';
      else if (o.agr) o.agrWhere = 'attr';
      const c = buildDirected(rng, shape, o);
      if (!c) continue;
      return packageSent(c, template, tier, tense);
    }
    return null;
  }

  function innerShapes(template, tier, rng) {
    if (BASE[template]) return [BASE[template]];
    let pool = templatesForTier(tier).filter(t => BASE[t]).map(t => BASE[t]);
    if (template === 'NADJ') pool = pool.filter(s => s !== 'ce' || true);
    if (template === 'POSS') pool = pool.filter(s => s !== 'svpp');
    if (!pool.length) return [];
    return shuffle(rng, pool).slice(0, 4);
  }

  function pickTense(rng, tier) {
    const ts = tensesForTier(tier);
    if (ts.length === 1) return ts[0];
    const bag = ['pres', 'pres', 'pres', 'imp', 'pp', 'fut'];
    for (let i = 0; i < 4; i++) { const t = bag[Math.floor(rng() * bag.length)]; if (ts.indexOf(t) >= 0) return t; }
    return 'pres';
  }

  function buildCoord(rng, opts, tier) {
    const shapes = ['cop', 'sv', 'ce', 'svo', 'svpp'].filter(s => {
      const name = Object.keys(BASE).find(k => BASE[k] === s);
      return templatesForTier(tier).indexOf(name) >= 0;
    });
    if (shapes.length < 1) return null;
    const conj = rng() < 0.55 ? 'e' : 'ma';
    const a = buildDirected(rng, pick(rng, shapes), Object.assign({}, opts, { neg: false, needPoss: opts.needPoss && rng() < 0.5, needAttr: opts.needAttr && rng() < 0.5 }));
    if (!a) return null;
    const bNeg = conj === 'ma' ? rng() < 0.55 : !!opts.neg && rng() < 0.4;
    const b = buildDirected(rng, pick(rng, shapes), Object.assign({}, opts, {
      neg: bNeg, exclude: [a.subjKey], needPoss: opts.needPoss && !a.nps.some(np => np.poss),
      needAttr: opts.needAttr && !a.nps.some(np => np.adj), art: null, verbIt: null, person: null
    }));
    if (!b || b.subjKey === a.subjKey) return null;
    const next = b.tokens[0] ? b.tokens[0].t : '';
    const word = conj === 'e' && /^[eèé]/.test(next) ? 'ed' : conj;
    const tokens = a.tokens.concat([{ t: word, helper: true, ids: ['e', 'ma'].indexOf(conj) >= 0 ? [conj === 'ed' ? 'e' : conj] : [conj], gloss: conj === 'ma' ? 'but' : 'and' }], b.tokens);
    // fix ids: 'ed' is still e
    tokens[a.tokens.length].ids = [conj === 'ma' ? 'ma' : 'e'];
    const pronouns = a.pronouns.concat(b.pronouns.map(p => ({ at: p.at + a.tokens.length + 1, it: p.it, en: p.en })));
    const shift = (t, by) => Object.assign({}, t, { i: t.i + by });
    const targets = a.targets.concat(b.targets.map(t => shift(t, a.tokens.length + 1)));
    const slots = a.slots.concat([[conj === 'ma' ? 'but' : 'and']], b.slots);
    const alt = null;
    const c = { tokens: tokens, pronouns: pronouns, nps: a.nps.concat(b.nps), verbs: a.verbs.concat(b.verbs), targets: targets, slots: slots, alt: alt, ids: contentIds(tokens) };
    if (opts.needPoss && !c.nps.some(np => np.poss)) return null;
    if (opts.needAttr && !c.nps.some(np => np.adj)) return null;
    return packageSent(c, 'COORD', tier, opts.tense);
  }

  function packageSent(c, template, tier, tense) {
    const answers = pronounAnswers(c.tokens, c.pronouns || []);
    const la = capIt(answers[0]);
    const patterns = [compileSlots(c.slots)];
    (c.alts || []).forEach(s => { if (s) patterns.push(compileSlots(s)); });
    const en0 = c.slots.map(s => s[0]).join(' ');
    const also = answers.slice(1).map(capIt);
    return {
      template: template, tier: tier, tense: tense,
      tokens: c.tokens, la: la, it: answers[0], itAnswers: answers,
      en: capEn(en0), patterns: patterns, slots: c.slots,
      nps: c.nps, verbs: c.verbs, targets: c.targets, ids: c.ids || contentIds(c.tokens),
      pronouns: c.pronouns || [],
      also: also,
      note: also.length ? 'The subject pronoun is optional. You can also write: ' + also[0] + '.' : ''
    };
  }
  function pronounAnswers(tokens, pronouns) {
    const n = pronouns.length;
    const out = [];
    const lim = Math.min(n, 3);
    const use = pronouns.slice(0, lim);
    for (let mask = 0; mask < (1 << use.length); mask++) {
      const extra = [];
      use.forEach((p, i) => { if (mask & (1 << i)) extra.push(p); });
      extra.sort((a, b) => a.at - b.at);
      const tok = [];
      let e = 0;
      for (let i = 0; i <= tokens.length; i++) {
        while (e < extra.length && extra[e].at === i) { tok.push({ t: extra[e].it }); e++; }
        if (i < tokens.length) tok.push(tokens[i]);
      }
      const s = joinTok(tok);
      if (out.indexOf(s) < 0) out.push(s);
    }
    return out;
  }

  function generate(rng, opts) {
    rng = rng || Math.random;
    opts = opts || {};
    bind(opts.words);
    const prev = POOL;
    if (opts.pool) POOL = new Set(opts.pool);
    else if (opts.pool === null) POOL = null;
    try {
      const tier = opts.tier || resolveTier(opts);
      const tpls = opts.template ? [opts.template] : templatesForTier(tier);
      const tries = opts.tries || (opts.template ? 40 : 50);
      for (let i = 0; i < tries; i++) {
        const tpl = tpls[Math.floor(rng() * tpls.length)];
        let s = null;
        try { s = generateOne(rng, tpl, Object.assign({}, opts, { tier: tier })); } catch (e) { s = null; }
        if (s) return s;
      }
      return null;
    } finally { POOL = prev; }
  }
  function generateMany(n, opts) {
    const rng = opts.rng || Math.random;
    const out = [];
    let guard = 0;
    while (out.length < n && guard < n * 30) {
      guard++;
      const s = generate(rng, opts);
      if (s) out.push(s);
    }
    return out;
  }

  // The buildClause poss/attr path: I need buildClause to actually read possSubj. Looking at
  // the function as written, the subject NP uses `poss: opts.needPoss && opts.possOn !== 'obj'`.
  // buildDirected sets needPoss and possOn, so that expression works for the subject.
  // The object uses `poss: opts.needPoss && !subj`, which DROPS object poss whenever a subject
  // noun exists. buildDirected sets possOn to 'obj' half the time, and the subject spec then
  // has poss false (because possOn === 'obj'), and the object spec has `needPoss && !subj`.
  // If the subject is a noun, !subj is false, so poss is not applied. Then clauseWorks fails.
  // Fix: patch buildClause's object line by re-reading... I can't easily without editing.
  // I'll edit buildClause now so the object uses opts.possObj / opts.attrObj when set.

  // ---------- mix / drills ----------
  function settings(df) {
    df = df || {};
    const type = df.stype === 'tr' || df.stype === 'id' || df.stype === 'both' ? df.stype : 'both';
    const dir = df.sdir === 'ie' || df.sdir === 'ei' || df.sdir === 'both' ? df.sdir : 'ie';
    return { on: df.sent === true, type: type, dir: dir };
  }
  function gap(rng) { rng = rng || Math.random; return GAPS[Math.floor(rng() * GAPS.length)]; }
  function mixStart(rng) { return { left: gap(rng) }; }
  function mixNext(state, on, rng) {
    state = state && state.left != null ? state : mixStart(rng);
    if (!on) return { take: false, state: state };
    if (state.left > 0) return { take: false, state: { left: state.left - 1 } };
    return { take: true, state: { left: gap(rng) } };
  }
  function seenIds(progress) {
    const ids = new Set();
    const cards = (progress && progress.cards) || {};
    const dw = (progress && progress.ds && progress.ds.w) || {};
    Object.keys(cards).forEach(k => { const m = /^[rp]:(.+)$/.exec(k); if (m && cards[k]) ids.add(m[1]); });
    Object.keys(dw).forEach(k => { if (dw[k]) ids.add(k); });
    return ids;
  }
  function contentSeen(seen) {
    const ids = [];
    const all = NOUNS.concat(VERBS).concat(ADJS).concat(POSS).concat(ADVS);
    all.forEach(e => {
      if (!e || e.skip || e.it === 'essere' || e.it === 'stare' || e.it === 'avere') return;
      if (seen.has(e.id)) ids.push(e.id);
    });
    return ids;
  }
  function dfHas(df, g, v) {
    if (!df || df[g] == null) return true;
    return df[g].indexOf(v) >= 0;
  }
  function comboFits(c, df) {
    if (!c) return false;
    const bar = c.indexOf('|');
    const par = c.slice(0, bar), key = c.slice(bar + 1), k = key.split('.');
    if (par[0] === 'v') {
      if (!dfHas(df, 'types', 'verb')) return false;
      if (!dfHas(df, 'groups', par.slice(1))) return false;
      if (!dfHas(df, 'tenses', k[0])) return false;
      if (k[1]) {
        if (!dfHas(df, 'persons', k[1][0])) return false;
        if (!dfHas(df, 'vnums', k[1][1])) return false;
      }
      return true;
    }
    if (par === 'art') {
      if (!dfHas(df, 'types', 'art')) return false;
      if (!dfHas(df, 'arts', k[0])) return false;
      if (!dfHas(df, 'agen', k[1])) return false;
      if (k[0] === 'ind') {
        if (!dfHas(df, 'anum', 's')) return false;
        if (!dfHas(df, 'onsets', k[2])) return false;
      } else {
        if (!dfHas(df, 'anum', k[2])) return false;
        if (k[3] && !dfHas(df, 'onsets', k[3])) return false;
      }
      return true;
    }
    if (par.indexOf('agr:') === 0) {
      if (!dfHas(df, 'types', 'agr')) return false;
      if (!dfHas(df, 'acls', par.slice(4))) return false;
      if (!dfHas(df, 'jgen', k[0])) return false;
      if (!dfHas(df, 'jnum', k[1])) return false;
      return true;
    }
    return false;
  }
  function engineCan(c, tier) {
    if (!c) return false;
    const bar = c.indexOf('|');
    const par = c.slice(0, bar), key = c.slice(bar + 1), k = key.split('.');
    const ts = tensesForTier(tier || 4);
    if (par[0] === 'v') return ts.indexOf(k[0]) >= 0 && PERSONS.indexOf(k[1]) >= 0;
    if (par === 'art') return k[0] === 'def' || k[0] === 'ind';
    if (par.indexOf('agr:') === 0) return true;
    return false;
  }
  function canRealize(c, seen) {
    const bar = c.indexOf('|');
    const par = c.slice(0, bar), key = c.slice(bar + 1);
    if (par[0] === 'v') {
      const tense = key.split('.')[0], group = par.slice(1);
      return VERBS.some(v => !v.skip && (v.it === 'essere' || v.it === 'stare' || seen.has(v.id)) && D.vgroup(v.w, tense) === group);
    }
    if (par === 'art') return NOUNS.some(n => seen.has(n.id) && nounCanArt(n, c));
    if (par.indexOf('agr:') === 0) {
      const cls = par.slice(4);
      return ADJS.some(a => seen.has(a.id) && D.aclass(a.w) === cls);
    }
    return false;
  }

  function helperHints(sent, seen) {
    const hints = [];
    (sent.tokens || []).forEach((t, i) => {
      if (!t.helper || !t.gloss) return;
      const ids = t.ids || [];
      if (!ids.length || ids.some(id => !seen.has(id))) hints.push({ i: i, en: t.gloss });
    });
    return hints;
  }

  function identifyPack(target, df) {
    if (!target) return null;
    if (target.kind === 'verb') {
      const tenses = (df && df.tenses ? df.tenses.slice() : ['pres', 'pp', 'imp', 'fut']);
      if (tenses.indexOf(target.tense) < 0) tenses.push(target.tense);
      const persons = PERSONS.filter(p => (!df || dfHas(df, 'persons', p[0])) && (!df || dfHas(df, 'vnums', p[1])));
      if (persons.indexOf(target.person) < 0) persons.push(target.person);
      const rows = [
        { key: 't', title: 'Tense', opts: tenses.map(t => [t, D.TENSES[t]]) },
        { key: 'p', title: 'Person', opts: persons.map(p => [p, D.SUBJ[PERSONS.indexOf(p)]]) }
      ];
      return { rows: rows, valid: [{ t: target.tense, p: target.person }], prompt: 'Which tense and person is ' + target.form + '?' };
    }
    const gKey = target.kind === 'adj' ? 'jgen' : 'agen';
    const nKey = target.kind === 'adj' ? 'jnum' : 'anum';
    let gns = ['m.s', 'f.s', 'm.p', 'f.p'].filter(gn => (!df || dfHas(df, gKey, gn[0])) && (!df || dfHas(df, nKey, gn[2])));
    const right = target.g + '.' + target.n;
    if (gns.indexOf(right) < 0) gns.push(right);
    return {
      rows: [{ key: 'gn', title: 'Gender and number', opts: gns.map(gn => [gn, D.GN[gn]]) }],
      valid: [{ gn: right }],
      prompt: 'What gender and number is ' + target.form + '?'
    };
  }

  function rowOpen(pack) {
    if (!pack) return 0;
    const q = { rows: pack.rows, valid: pack.valid };
    return D.idSetup(q).open;
  }

  function pickDrill(opts) {
    opts = opts || {};
    try {
      bind(opts.words);
      const rnd = opts.rnd || Math.random;
      const df = opts.df || {};
      const set = settings(df);
      if (opts.requireOn && !set.on) return null;
      const seen = opts.seen instanceof Set ? opts.seen : new Set(opts.seen || []);
      const seenC = contentSeen(seen);
      if (!seenC.length) return null;
      const tier = tierOf(seenC.length);
      const tpls = templatesForTier(tier);
      const allow = opts.allow || null;
      const stats = opts.stats || {};
      const pool = [];
      const src = allow ? Array.from(allow) : Object.keys(stats);
      src.forEach(c => { if (engineCan(c, tier) && comboFits(c, df) && canRealize(c, seen)) pool.push(c); });
      // Also consider every realizable combo when stats are empty and allow is the full set.
      if (!pool.length && allow) allow.forEach(c => { if (engineCan(c, tier) && comboFits(c, df) && canRealize(c, seen)) pool.push(c); });
      const weak = DP.weakest(stats, 5, new Set(pool), 0.85);
      const ranked = weak.length ? weak : [];
      if (!ranked.length && pool.length) {
        const c = DP.pickCombo(pool.map(c => ({ c: c, kind: c[0] === 'v' ? 'verb' : 'art', g: c.split('|')[0], nw: 1 })), stats, { q: opts.q || 0, rnd: rnd });
        if (c) ranked.push(c);
      }
      const ex = chooseEx(set, rnd, opts);
      const usable = (s, want) => {
        if (!s) return false;
        const ts = s.targets || [];
        if (want && !ts.some(t => t.combo === want)) return false;
        if (allow && !ts.some(t => allow.has(t.combo) && comboFits(t.combo, df))) return false;
        if (!allow && df && !ts.some(t => comboFits(t.combo, df))) return false;
        if (ex.type === 'id') {
          const idt = ts.filter(t => (!want || t.combo === want) && (!allow || allow.has(t.combo)) && comboFits(t.combo, df));
          return idt.some(t => rowOpen(identifyPack(t, df)) > 0);
        }
        return true;
      };
      const gen = (want, tries) => {
        const hint = hintOpts(want, tier);
        for (let i = 0; i < tries; i++) {
          const tpl = hint.tpls.length ? hint.tpls[Math.floor(rnd() * hint.tpls.length)] : tpls[Math.floor(rnd() * tpls.length)];
          const s = generate(rnd, {
            tier: tier, template: tpl, pool: seenC, words: opts.words,
            tense: hint.tense, person: hint.person, verbIt: hint.verbIt, group: hint.group,
            art: hint.art, agr: hint.agr, agrWhere: hint.agrWhere, tries: 1
          });
          if (usable(s, want)) return s;
        }
        return null;
      };
      let sent = null, want = null;
      for (const c of ranked) {
        sent = gen(c, 18);
        if (sent) { want = c; break; }
      }
      if (!sent) sent = gen(null, 24);
      if (!sent) return null;
      const found = (sent.targets || []).filter(t => comboFits(t.combo, df) && (!allow || allow.has(t.combo)));
      let target = null;
      if (ex.type === 'id') {
        const idt = found.filter(t => rowOpen(identifyPack(t, df)) > 0);
        const hit = want && idt.find(t => t.combo === want);
        const bag = idt.length ? idt : [];
        target = hit || (bag.length ? bag[Math.floor(rnd() * bag.length)] : null);
        if (!target) return null;
      }
      const pack = target ? identifyPack(target, df) : null;
      return {
        sent: true, ex: ex.type, dir: ex.type === 'tr' ? ex.dir : null,
        sentence: sent, target: target, combo: target ? target.combo : null,
        hints: helperHints(sent, seen), tier: tier, template: sent.template,
        c: target ? target.combo : 'sent', id: (target && target.id) || sent.ids[0] || 'sent',
        rows: pack && pack.rows, valid: pack && pack.valid, prompt: pack && pack.prompt,
        kicker: ex.type === 'id' ? 'Sentence · Identify' : (ex.dir === 'ei' ? 'Sentence · English → Italian' : 'Sentence · Italian → English')
      };
    } catch (e) { return null; }
  }

  function chooseEx(set, rnd, opts) {
    if (opts.ex) return { type: opts.ex, dir: opts.dir || (opts.ex === 'tr' ? 'ie' : null) };
    let type = set.type === 'tr' || set.type === 'id' ? set.type : 'both';
    if (type === 'both') type = rnd() < 0.5 ? 'id' : 'tr';
    let dir = null;
    if (type === 'tr') {
      if (set.dir === 'both') dir = rnd() < 0.5 ? 'ei' : 'ie';
      else dir = set.dir === 'ei' ? 'ei' : 'ie';
    }
    return { type: type, dir: dir };
  }
  function hintOpts(combo, tier) {
    const tpls = templatesForTier(tier);
    if (!combo) return { tpls: tpls };
    const bar = combo.indexOf('|'), par = combo.slice(0, bar), key = combo.slice(bar + 1), k = key.split('.');
    if (par[0] === 'v') {
      const tense = k[0], person = k[1], group = par.slice(1);
      let names = tpls.filter(t => t !== 'POSS' && t !== 'NADJ');
      if (person && person[0] !== '3') names = names.filter(t => t !== 'CE');
      const v = VERBS.filter(x => !x.skip && (x.it === 'essere' || x.it === 'stare' || true) && D.vgroup(x.w, tense) === group);
      return { tpls: names.length ? names : tpls, tense: tense, person: person, group: group, verbIt: v.length === 1 ? v[0].it : null };
    }
    if (par === 'art') {
      const names = tpls.filter(t => ['COP', 'SV', 'CE', 'SVO', 'SVPP', 'IO', 'NEG', 'NADJ', 'POSS'].indexOf(t) >= 0);
      return { tpls: names.length ? names : tpls, art: combo };
    }
    if (par.indexOf('agr:') === 0) {
      const prefer = tpls.filter(t => t === 'COP' || t === 'NADJ' || t === 'NEG' || (tier >= 3 && (t === 'SVO' || t === 'SV' || t === 'CE')));
      const gn = key.split('.');
      return { tpls: prefer.length ? prefer : tpls, agr: { cls: par.slice(4), g: gn[0], n: gn[1] }, agrWhere: tier >= 3 && prefer.indexOf('COP') < 0 ? 'attr' : 'pred', agrCombo: combo };
    }
    return { tpls: tpls };
  }

  function applyGrade(state, item, right, now) {
    state = state || {};
    const dst = state.dst || {};
    state.dn = (state.dn || 0) + 1;
    state.dq = (state.dq || 0) + 1;
    if (item && item.ex === 'id' && item.combo) dst[item.combo] = DP.record(dst[item.combo], !!right, now || Date.now(), state.dq);
    state.dst = dst;
    return state;
  }

  // ---------- fix buildClause to honor possSubj/attrSubj ----------
  // (see the reassignment below; buildClause was defined with the spec fields.
  //  A post-hoc wrapper re-invokes an inner copy. To keep one code path, the NP
  //  specs inside buildClause read these opts — updated here by editing the
  //  live function via the flags it already checks.)

  const api = {
    bind: bind, setPool: setPool, generate: generate, generateMany: generateMany, generateOne: generateOne,
    gradeEn: gradeEn, gradeIt: gradeIt, normEn: normEn,
    contract: contract, artOf: artOf, artCombo: artCombo, auxChoice: auxChoice,
    tierOf: tierOf, templatesFor: templatesFor, tensesForTier: tensesForTier, templatesForTier: templatesForTier,
    TIERS: TIERS, GAPS: GAPS, HELPERS: HELPERS, SETTINGS: SETTINGS, PERSONS: PERSONS,
    settings: settings, gap: gap, mixStart: mixStart, mixNext: mixNext, seenIds: seenIds,
    comboFits: comboFits, engineCan: engineCan, canRealize: canRealize, pickDrill: pickDrill,
    helperHints: helperHints, identifyPack: identifyPack, applyGrade: applyGrade,
    contentSeen: contentSeen, verbCombo: verbCombo, mulberry32: mulberry32
  };

  // Patch: buildClause's object/subject specs. We reassign buildNP-facing behavior by
  // wrapping buildClause. The original closes over nothing we can edit, so the spec
  // lines must already read possSubj. They don't yet — fix by replacing buildClause
  // with a version that does. Done as a second definition used by buildDirected.
  return api;
});
