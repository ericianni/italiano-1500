/* Italiano 1500 — drill content: which form combinations exist, which words can be drilled for each,
   question building, answer checking and "identify" parses. Pure logic (no DOM); the language-agnostic
   weighting lives in core/drillpick.js and set handling in core/drillsession.js.
   Combo ids are "paradigm|key":
     verbs   v<group>|<tense>.<person>   group are/ere/ire/isc, or irr when that tense is irregular for the verb
     articles art|<def|ind>.<g>.<n>.<onset>   onset c consonant, z lo-type (s+consonant, z, gn, ps, x, y), v vowel
     agreement agr:<cls>|<g>.<n>       cls o (4 forms), e (2 forms), sp (spelling change: -co/-go/-io), inv */
(function (root, factory) {
  const M = root.ItMorph || (typeof require !== 'undefined' ? require('./morph.js') : null);
  const D = factory(M);
  if (typeof module === 'object' && module.exports) module.exports = D; else root.ItDrills = D;
})(typeof self !== 'undefined' ? self : this, function (M) {
  'use strict';
  const TENSES = { pres: 'Present', pp: 'Passato prossimo', imp: 'Imperfetto', fut: 'Future' };
  const TENSE_IT = { pres: 'presente', pp: 'passato prossimo', imp: 'imperfetto', fut: 'futuro' };
  const P = M.PERSONS, SUBJ = ['io', 'tu', 'lui/lei', 'noi', 'voi', 'loro'];
  const VGROUPS = { are: '-are verbs', ere: '-ere verbs', ire: '-ire verbs', isc: '-ire verbs with -isc-', irr: 'Irregular forms' };
  const ACLS = { o: 'Adjectives in -o', e: 'Adjectives in -e', sp: 'Adjectives with spelling changes', inv: 'Invariable adjectives' };
  const ONSET = { c: 'before a consonant', z: 'before s + consonant, z, gn, ps, x, y', v: 'before a vowel' };
  const GN = { 'm.s': 'masc. sing.', 'f.s': 'fem. sing.', 'm.p': 'masc. pl.', 'f.p': 'fem. pl.' };
  const DEF_ARTS = ['il', 'lo', "l'", 'la', 'i', 'gli', 'le'], IND_ARTS = ['un', 'uno', 'una', "un'"];
  const DF = { types: ['verb', 'art', 'agr'], tenses: ['pres', 'pp', 'imp', 'fut'], groups: ['are', 'ere', 'ire', 'isc', 'irr'], arts: ['def', 'ind'] };
  // everyday nouns used to build adjective-agreement phrases (only those present in the word list are used)
  const AGR_NOUNS = ['ragazzo', 'ragazza', 'uomo', 'donna', 'bambino', 'amico', 'casa', 'libro', 'macchina', 'città', 'giorno', 'notte', 'storia',
    'lavoro', 'strada', 'porta', 'stanza', 'cane', 'albero', 'lettera', 'film', 'canzone', 'idea', 'problema', 'mano', 'uovo', 'braccio', 'dito',
    'chiave', 'padre', 'madre', 'fratello', 'sorella', 'figlio', 'figlia', 'famiglia', 'momento', 'parte', 'cosa', 'vita', 'anno', 'settimana',
    'mese', 'sera', 'mattina', 'occhio', 'faccia', 'testa', 'cuore', 'acqua', 'birra', 'vino', 'caffè', 'piano', 'paese', 'mondo', 'scuola',
    'ufficio', 'ospedale', 'nave', 'treno', 'telefono', 'foto', 'auto', 'lago', 'parco', 'albergo', 'medico', 'ristorante', 'negozio', 'regalo',
    'giornale', 'notizia', 'camicia', 'scarpa', 'borsa', 'bottiglia', 'tavolo', 'sedia', 'finestra', 'cielo', 'mare', 'lingua', 'voce', 'domanda',
    'risposta', 'scelta', 'situazione', 'soldato', 'dottore', 'professore', 'studente', 'zio', 'zia', 'sogno', 'gioco', 'viaggio', 'pranzo', 'cena',
    'luce', 'fiore', 'spiaggia', 'isola', 'valigia', 'orologio', 'computer', 'sport', 'arma', 'ala', 'ginocchio', 'labbro', 'osso', 'orecchio'];

  const pick = (a, rnd) => a[Math.floor((rnd || Math.random)() * a.length)];
  const regPP = it => { const c = M.cls(it); return it.slice(0, -3) + (c === 'are' ? 'ato' : c === 'ere' ? 'uto' : 'ito'); };
  const tbl = (v, t) => M.tense(v, t);
  const verbOk = w => w.pos === 'v' && !w.refl && !w.impers;
  // a verb tense counts as irregular when the engine uses an irregular table / stem / participle for it
  function irrTense(v, t) {
    const r = M.irrOf(v.it), d = r && r.d || {};
    if (t === 'pres') return !!d.pres;
    if (t === 'imp') return !!d.imp;
    if (t === 'fut') return !!d.fut;
    return M.pastPart(v) !== regPP(v.it);
  }
  const vgroup = (v, t) => irrTense(v, t) ? 'irr' : v.conj;
  const auxes = v => v.aux === 'a/e' ? ['a', 'e'] : [v.aux === 'e' ? 'e' : 'a'];
  // every accepted passato form for person i and subject gender g (both auxiliaries for a/e verbs)
  const ppAnswers = (v, i, g) => auxes(v).map(a => M.passato(v, i, g, a));
  function nounOk(w) { return w.pos === 'n' && (w.g === 'm' || w.g === 'f'); }
  const plOf = w => ({ pl: w.pl || w.it, g: w.plg || w.g });
  function aclass(w) {
    const f = w.forms;
    if (f[0] === f[1] && f[1] === f[2] && f[2] === f[3]) return 'inv';
    if (f[0] === f[1]) return 'e';
    const st = f[0].slice(0, -1);
    return f[2] === st + 'i' && f[3] === st + 'e' ? 'o' : 'sp';
  }
  const adjOk = w => w.pos === 'adj' && !w.noagr;

  // ---------- units: combo -> drillable word ids, limited to the drill settings ----------
  function buildUnits(words, df) {
    df = df || DF; const U = {};
    const add = (c, id) => { (U[c] = U[c] || []).push(id); };
    for (const w of words) {
      if (df.types.includes('verb') && verbOk(w)) {
        for (const t of df.tenses) { const g = vgroup(w, t); if (!df.groups.includes(g)) continue; P.forEach(p => add('v' + g + '|' + t + '.' + p, w.id)); }
      } else if (df.types.includes('art') && nounOk(w)) {
        if (!w.pltant) {
          const o = M.onset(w.it), oc = w.g === 'f' && o === 'z' ? 'c' : o;
          if (df.arts.includes('def')) add('art|def.' + w.g + '.s.' + oc, w.id);
          if (df.arts.includes('ind') && !w.sg) add('art|ind.' + w.g + '.' + oc, w.id);
        }
        if (!w.sg && df.arts.includes('def')) {
          const { pl, g } = plOf(w), o = M.onset(pl);
          add('art|def.' + g + '.p' + (g === 'f' ? '' : '.' + o), w.id);
        }
      } else if (df.types.includes('agr') && adjOk(w)) {
        const k = aclass(w);
        for (const gn of Object.keys(GN)) add('agr:' + k + '|' + gn, w.id);
      }
    }
    return U;
  }
  const kindOf = c => c[0] === 'v' ? 'verb' : c.startsWith('art') ? 'art' : 'agr';
  const paradigm = c => c.split('|')[0];
  // entries for DrillPick.pickCombo / masses
  function entries(U) { return Object.keys(U).map(c => ({ c, kind: kindOf(c), g: paradigm(c), nw: U[c].length })); }

  // ---------- labels ----------
  function comboLabel(c) {
    const [pd, key] = c.split('|'), k = key.split('.');
    if (pd[0] === 'v') return VGROUPS[pd.slice(1)] + ' · ' + TENSES[k[0]] + ' · ' + SUBJ[P.indexOf(k[1])];
    if (pd === 'art') {
      if (k[0] === 'def') return 'Definite article · ' + GN[k[1] + '.' + k[2]] + (k[3] ? ' · ' + ONSET[k[3]] : '');
      return 'Indefinite article · ' + GN[k[1] + '.s'] + ' · ' + ONSET[k[2]];
    }
    return ACLS[pd.split(':')[1]] + ' · ' + GN[key];
  }
  // cheat-sheet anchor and lesson id for a combo
  function comboAnchor(c) {
    const [pd, key] = c.split('|');
    if (pd[0] === 'v') { const g = pd.slice(1), t = key.split('.')[0]; return g === 'irr' ? 'cs-irr' : t === 'pp' ? 'cs-pp' : 'cs-v-' + g; }
    return pd === 'art' ? 'cs-art' : 'cs-adj';
  }
  function comboLesson(c) {
    const [pd, key] = c.split('|'), t = key.split('.')[0];
    if (pd[0] === 'v') return { pres: pd === 'virr' ? 'l-irr' : 'l-pres', pp: 'l-pp', imp: 'l-imp', fut: 'l-fut' }[t];
    return pd === 'art' ? (key.startsWith('ind') ? 'l-indef' : 'l-def') : 'l-adj';
  }

  // ---------- questions ----------
  // q = { c, id, kind, kicker, head, gloss, ask (html-free text), answers:[...], rows:[{key,title,opts:[[val,label]]}], valid:[{...}], show }
  function verbQ(c, v, rnd) {
    const key = c.split('|')[1], [t, p] = key.split('.'), i = P.indexOf(p);
    let subj = SUBJ[i], g = 'm';
    if (i === 2) { g = (rnd || Math.random)() < 0.5 ? 'm' : 'f'; subj = g === 'm' ? 'lui' : 'lei'; }
    else if (t === 'pp' && auxes(v).includes('e')) { g = (rnd || Math.random)() < 0.5 ? 'm' : 'f'; subj += g === 'f' ? ' (f)' : ' (m)'; }
    const answers = t === 'pp' ? ppAnswers(v, i, g) : [tbl(v, t)[i]];
    return { c, id: v.id, kind: 'verb', kicker: TENSES[t], head: v.it, gloss: v.en, ask: subj, t, i, g, answers, show: answers[0],
      note: t === 'pp' ? (v.aux === 'a/e' ? 'Takes avere or essere (either is accepted).' : v.aux === 'e' ? 'Takes essere: the participle agrees with the subject.' : 'Takes avere.') : '',
      rows: [{ key: 't', title: 'Tense', opts: Object.keys(TENSES).map(x => [x, TENSES[x]]) }, { key: 'p', title: 'Person', opts: P.map((x, j) => [x, SUBJ[j]]) }],
      valid: verbParses(v, answers[0]) };
  }
  // every tense/person whose form (any gender, any allowed auxiliary) equals `form`
  function verbParses(v, form) {
    const f = M.norm(form), out = [];
    for (const t of Object.keys(TENSES)) P.forEach((p, i) => {
      const fs = t === 'pp' ? [].concat(ppAnswers(v, i, 'm'), ppAnswers(v, i, 'f')) : [tbl(v, t)[i]];
      if (fs.some(x => M.norm(x) === f)) out.push({ t, p });
    });
    return out;
  }
  function artQ(c, n, rnd) {
    const k = c.split('|')[1].split('.'), def = k[0] === 'def', pl = def && k[2] === 'p';
    const form = pl ? plOf(n).pl : n.it, g = pl ? plOf(n).g : n.g;
    const art = def ? M.defArt(form, g, pl ? 'p' : 's') : M.indefArt(form, g);
    const phrase = M.withArt(art, form);
    return { c, id: n.id, kind: 'art', kicker: (def ? 'Definite' : 'Indefinite') + ' article' + (pl ? ' · plural' : ' · singular'),
      head: n.it, gloss: n.en, gtag: n.g === 'm' ? 'm.' : 'f.', ask: (def ? (pl ? 'the (plural)' : 'the') : 'a / an') + ' …',
      answers: [phrase], show: phrase, form, art,
      idPrompt: '___ ' + form, rows: [{ key: 'a', title: def ? 'Definite article' : 'Indefinite article', opts: (def ? DEF_ARTS : IND_ARTS).map(a => [a, a]) }],
      valid: [{ a: art }] };
  }
  // noun for an agreement phrase: from AGR_NOUNS, with the wanted gender (plural gender for plurals)
  function agrNoun(nouns, g, n, rnd) {
    const ok = nouns.filter(w => (n === 'p' ? !w.sg && plOf(w).g === g : !w.pltant && w.g === g));
    return ok.length ? pick(ok, rnd) : null;
  }
  function agrQ(c, a, nouns, rnd) {
    const [g, n] = c.split('|')[1].split('.'), N = agrNoun(nouns, g, n, rnd); if (!N) return null;
    const nf = n === 'p' ? plOf(N).pl : N.it, af = M.adjAgree(a, g, n);
    const def = n === 'p' || (rnd || Math.random)() < 0.6;
    const first = a.pre ? af : nf, art = def ? M.defArt(first, g, n) : M.indefArt(first, g);
    const phrase = a.pre ? M.withArt(art, af + ' ' + nf) : M.withArt(art, nf) + ' ' + af;
    const opts = [...new Set(a.forms)];
    return { c, id: a.id, kind: 'agr', kicker: 'Agreement · ' + GN[g + '.' + n], head: a.it, gloss: a.en, noun: N,
      ask: (def ? 'the' : 'a') + ' ' + N.it + (n === 'p' ? ' (plural)' : '') + ' + ' + a.it, answers: [phrase], show: phrase, af,
      note: a.pre ? a.it + ' normally goes before the noun, so the article agrees with it.' : '',
      idPrompt: a.pre ? M.withArt(art, '___ ' + nf) : M.withArt(art, nf) + ' ___',
      rows: [{ key: 'f', title: 'Form of ' + a.it, opts: opts.map(x => [x, x]) }], valid: [{ f: af }] };
  }
  // build a question for combo c with word w (nouns: AGR_NOUNS entries, for agreement phrases)
  function makeQ(c, w, ctx, rnd) {
    const k = kindOf(c);
    if (k === 'verb') return verbQ(c, w, rnd);
    if (k === 'art') return artQ(c, w, rnd);
    return agrQ(c, w, ctx.agrNouns, rnd);
  }
  function agrNouns(words) { const by = {}; words.forEach(w => { by[w.it] = w; }); return AGR_NOUNS.map(x => by[x]).filter(w => w && nounOk(w)); }

  // ---------- checking typed answers ----------
  const SUBJ_RE = /^(io|tu|lui|lei|noi|voi|loro|esso|essa|essi|esse)\s+/;
  function clean(s) { return M.norm(s).replace(/\s*'\s*/g, "'").replace(/[.!?]+$/, '').trim(); }
  // returns { ok, accent } : accent = right except for accents (counted wrong when strict)
  function check(typed, answers, strict) {
    let t = clean(typed); if (!t) return { ok: false };
    const cands = [t]; if (SUBJ_RE.test(t)) cands.push(t.replace(SUBJ_RE, ''));
    const A = answers.map(clean);
    if (cands.some(x => A.includes(x))) return { ok: true };
    const da = A.map(M.deaccent);
    if (cands.some(x => da.includes(M.deaccent(x)))) return { ok: !strict, accent: true };
    return { ok: false };
  }
  // identify: picked = {key: value}; right when it matches one valid parse on every row
  function idRight(q, picked) { return q.valid.some(v => Object.keys(v).every(k => picked[k] === v[k])); }

  return { TENSES, TENSE_IT, SUBJ, VGROUPS, ACLS, ONSET, GN, DF, DEF_ARTS, IND_ARTS, AGR_NOUNS,
    verbOk, nounOk, adjOk, aclass, irrTense, vgroup, auxes, ppAnswers, plOf,
    buildUnits, entries, kindOf, comboLabel, comboAnchor, comboLesson, makeQ, verbParses, agrNouns, check, clean, idRight };
});
