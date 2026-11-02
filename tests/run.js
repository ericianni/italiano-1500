// Test suite: node tests/run.js (or npm test). Exits non-zero on any failure.
'use strict';
const M = require('../lang/it/morph.js');
const D = require('../lang/it/drills.js');
const SRS = require('../core/srs.js'), DP = require('../core/drillpick.js'), DS = require('../core/drillsession.js');
const Store = require('../core/store.js'), Packs = require('../core/packs.js');
const LESSONS = require('../lang/it/lessons.js');
const WORDS = require('../data/packs/core/words.json');
let pass = 0, fail = 0; const fails = [];
const eq = (got, want, msg) => { const g = JSON.stringify(got), w = JSON.stringify(want); if (g === w) pass++; else { fail++; fails.push(msg + '\n    got  ' + g + '\n    want ' + w); } };
const ok = (c, msg) => eq(!!c, true, msg);
const BY = {}; WORDS.forEach(w => { BY[w.it] = BY[w.it] || w; });
const V = it => BY[it] && BY[it].pos === 'v' ? BY[it] : { it, conj: M.cls(it), aux: 'a' };
const conj = (it, t, want) => eq(M.tense(V(it), t), want.split(' '), it + ' ' + t);

// ---------- articles ----------
const ART = [['libro', 'm', 'il', 'i', 'un'], ['studente', 'm', 'lo', 'gli', 'uno'], ['zaino', 'm', 'lo', 'gli', 'uno'], ['gnomo', 'm', 'lo', 'gli', 'uno'],
  ['psicologo', 'm', 'lo', 'gli', 'uno'], ['xilofono', 'm', 'lo', 'gli', 'uno'], ['yogurt', 'm', 'lo', 'gli', 'uno'], ['amico', 'm', "l'", 'gli', 'un'],
  ['uomo', 'm', "l'", 'gli', 'un'], ['sbaglio', 'm', 'lo', 'gli', 'uno'], ['spazio', 'm', 'lo', 'gli', 'uno'], ['treno', 'm', 'il', 'i', 'un'], ['sport', 'm', 'lo', 'gli', 'uno'],
  ['pneumatico', 'm', 'lo', 'gli', 'uno'], ['casa', 'f', 'la', 'le', 'una'], ['amica', 'f', "l'", 'le', "un'"], ['zia', 'f', 'la', 'le', 'una'], ['scuola', 'f', 'la', 'le', 'una'],
  ['isola', 'f', "l'", 'le', "un'"], ['ora', 'f', "l'", 'le', "un'"], ['idea', 'f', "l'", 'le', "un'"], ['hotel', 'm', "l'", 'gli', 'un'], ['psicologa', 'f', 'la', 'le', 'una']];
for (const [w, g, d, p, i] of ART) { eq(M.defArt(w, g, 's'), d, 'def sg ' + w); eq(M.defArt(w, g, 'p'), p, 'def pl ' + w); eq(M.indefArt(w, g), i, 'indef ' + w); }
eq(M.withArt("l'", 'amico'), "l'amico", 'withArt elision'); eq(M.withArt("un'", 'amica'), "un'amica", 'withArt un\''); eq(M.withArt('il', 'libro'), 'il libro', 'withArt space');
eq(M.defArt('ieri', 'm', 's'), 'lo', 'i+vowel takes lo (lo iato)');
eq(M.defArt('dei', 'm', 'p'), 'gli', 'gli dei');

// ---------- noun plurals ----------
const N = (it, g, extra) => M.nounPlural(Object.assign({ it, g }, BY[it] && BY[it].pos === 'n' ? BY[it] : {}, extra || {}));
const PL = [['libro', 'm', 'libri'], ['casa', 'f', 'case'], ['padre', 'm', 'padri'], ['notte', 'f', 'notti'], ['problema', 'm', 'problemi'], ['città', 'f', 'città'], ['caffè', 'm', 'caffè'],
  ['film', 'm', 'film'], ['bar', 'm', 'bar'], ['foto', 'f', 'foto'], ['auto', 'f', 'auto'], ['radio', 'f', 'radio'], ['crisi', 'f', 'crisi'], ['serie', 'f', 'serie'], ['specie', 'f', 'specie'],
  ['parco', 'm', 'parchi'], ['gioco', 'm', 'giochi'], ['lago', 'm', 'laghi'], ['albergo', 'm', 'alberghi'], ['amico', 'm', 'amici'], ['medico', 'm', 'medici'], ['psicologo', 'm', 'psicologi'],
  ['nemico', 'm', 'nemici'], ['greco', 'm', 'greci'], ['porco', 'm', 'porci'], ['amica', 'f', 'amiche'], ['banca', 'f', 'banche'], ['collega', 'm', 'colleghi'], ['camicia', 'f', 'camicie'],
  ['valigia', 'f', 'valigie'], ['arancia', 'f', 'arance'], ['spiaggia', 'f', 'spiagge'], ['faccia', 'f', 'facce'], ['provincia', 'f', 'province'], ['figlio', 'm', 'figli'], ['zio', 'm', 'zii'],
  ['occhio', 'm', 'occhi'], ['studio', 'm', 'studi'], ['uomo', 'm', 'uomini'], ['dio', 'm', 'dei'], ['mano', 'f', 'mani'], ['moglie', 'f', 'mogli'], ['ala', 'f', 'ali'], ['bue', 'm', 'buoi'],
  ['re', 'm', 're'], ['virtù', 'f', 'virtù'], ['cinema', 'm', 'cinema'], ['papà', 'm', 'papà'], ['programma', 'm', 'programmi'], ['poeta', 'm', 'poeti'], ['tema', 'm', 'temi'], ['analisi', 'f', 'analisi']];
for (const [w, g, p] of PL) eq(N(w, g).pl, p, 'plural ' + w);
eq(N('uovo', 'm'), { pl: 'uova', g: 'f' }, 'uovo -> le uova'); eq(N('paio', 'm'), { pl: 'paia', g: 'f' }, 'paio -> le paia');
eq(N('braccio', 'm'), { pl: 'braccia', g: 'f' }, 'braccio -> le braccia'); eq(N('dito', 'm'), { pl: 'dita', g: 'f' }, 'dito -> le dita');
eq(N('labbro', 'm'), { pl: 'labbra', g: 'f' }, 'labbro'); eq(N('ginocchio', 'm'), { pl: 'ginocchia', g: 'f' }, 'ginocchio'); eq(N('centinaio', 'm'), { pl: 'centinaia', g: 'f' }, 'centinaio');
eq(N('mille', 'm', { pl: 'mila', inv: 0 }).pl, 'mila', 'explicit plural wins');

// ---------- adjectives ----------
const A = (it, f) => eq(M.adjForms({ it }), f.split(' '), 'adj ' + it);
A('nuovo', 'nuovo nuova nuovi nuove'); A('grande', 'grande grande grandi grandi'); A('bianco', 'bianco bianca bianchi bianche'); A('lungo', 'lungo lunga lunghi lunghe');
A('simpatico', 'simpatico simpatica simpatici simpatiche'); A('vecchio', 'vecchio vecchia vecchi vecchie'); A('blu', 'blu blu blu blu'); A('rosa', 'rosa rosa rosa rosa');
A('ricco', 'ricco ricca ricchi ricche'); A('pratico', 'pratico pratica pratici pratiche'); A('largo', 'largo larga larghi larghe'); A('grigio', 'grigio grigia grigi grigie');
A('felice', 'felice felice felici felici'); A('ottimista', 'ottimista ottimista ottimisti ottimiste'); A('antico', 'antico antica antichi antiche'); A('pari', 'pari pari pari pari');
A('sporco', 'sporco sporca sporchi sporche'); A('stanco', 'stanco stanca stanchi stanche'); A('magnifico', 'magnifico magnifica magnifici magnifiche');
eq(M.adjAgree({ it: 'nuovo' }, 'f', 'p'), 'nuove', 'adjAgree f.p');

// ---------- present ----------
conj('parlare', 'pres', 'parlo parli parla parliamo parlate parlano'); conj('credere', 'pres', 'credo credi crede crediamo credete credono');
conj('dormire', 'pres', 'dormo dormi dorme dormiamo dormite dormono'); conj('capire', 'pres', 'capisco capisci capisce capiamo capite capiscono');
conj('finire', 'pres', 'finisco finisci finisce finiamo finite finiscono'); conj('preferire', 'pres', 'preferisco preferisci preferisce preferiamo preferite preferiscono');
conj('cercare', 'pres', 'cerco cerchi cerca cerchiamo cercate cercano'); conj('pagare', 'pres', 'pago paghi paga paghiamo pagate pagano');
conj('cominciare', 'pres', 'comincio cominci comincia cominciamo cominciate cominciano'); conj('mangiare', 'pres', 'mangio mangi mangia mangiamo mangiate mangiano');
conj('lasciare', 'pres', 'lascio lasci lascia lasciamo lasciate lasciano'); conj('studiare', 'pres', 'studio studi studia studiamo studiate studiano');
conj('inviare', 'pres', 'invio invii invia inviamo inviate inviano'); conj('sciare', 'pres', 'scio scii scia sciamo sciate sciano');
conj('conoscere', 'pres', 'conosco conosci conosce conosciamo conoscete conoscono'); conj('leggere', 'pres', 'leggo leggi legge leggiamo leggete leggono');
conj('essere', 'pres', 'sono sei è siamo siete sono'); conj('avere', 'pres', 'ho hai ha abbiamo avete hanno'); conj('fare', 'pres', 'faccio fai fa facciamo fate fanno');
conj('andare', 'pres', 'vado vai va andiamo andate vanno'); conj('venire', 'pres', 'vengo vieni viene veniamo venite vengono'); conj('dire', 'pres', 'dico dici dice diciamo dite dicono');
conj('potere', 'pres', 'posso puoi può possiamo potete possono'); conj('volere', 'pres', 'voglio vuoi vuole vogliamo volete vogliono');
conj('dovere', 'pres', 'devo devi deve dobbiamo dovete devono'); conj('sapere', 'pres', 'so sai sa sappiamo sapete sanno'); conj('stare', 'pres', 'sto stai sta stiamo state stanno');
conj('dare', 'pres', 'do dai dà diamo date danno'); conj('uscire', 'pres', 'esco esci esce usciamo uscite escono'); conj('bere', 'pres', 'bevo bevi beve beviamo bevete bevono');
conj('tenere', 'pres', 'tengo tieni tiene teniamo tenete tengono'); conj('rimanere', 'pres', 'rimango rimani rimane rimaniamo rimanete rimangono');
conj('morire', 'pres', 'muoio muori muore moriamo morite muoiono'); conj('piacere', 'pres', 'piaccio piaci piace piacciamo piacete piacciono');
conj('scegliere', 'pres', 'scelgo scegli sceglie scegliamo scegliete scelgono'); conj('salire', 'pres', 'salgo sali sale saliamo salite salgono');
conj('sedere', 'pres', 'siedo siedi siede sediamo sedete siedono'); conj('tradurre', 'pres', 'traduco traduci traduce traduciamo traducete traducono');
conj('porre', 'pres', 'pongo poni pone poniamo ponete pongono'); conj('ottenere', 'pres', 'ottengo ottieni ottiene otteniamo ottenete ottengono');
conj('aprire', 'pres', 'apro apri apre apriamo aprite aprono'); conj('spegnere', 'pres', 'spengo spegni spegne spegniamo spegnete spengono');

// ---------- imperfetto ----------
conj('parlare', 'imp', 'parlavo parlavi parlava parlavamo parlavate parlavano'); conj('credere', 'imp', 'credevo credevi credeva credevamo credevate credevano');
conj('capire', 'imp', 'capivo capivi capiva capivamo capivate capivano'); conj('essere', 'imp', 'ero eri era eravamo eravate erano');
conj('fare', 'imp', 'facevo facevi faceva facevamo facevate facevano'); conj('dire', 'imp', 'dicevo dicevi diceva dicevamo dicevate dicevano');
conj('bere', 'imp', 'bevevo bevevi beveva bevevamo bevevate bevevano'); conj('tradurre', 'imp', 'traducevo traducevi traduceva traducevamo traducevate traducevano');
conj('porre', 'imp', 'ponevo ponevi poneva ponevamo ponevate ponevano'); conj('avere', 'imp', 'avevo avevi aveva avevamo avevate avevano');
conj('stare', 'imp', 'stavo stavi stava stavamo stavate stavano'); conj('dare', 'imp', 'davo davi dava davamo davate davano');

// ---------- future ----------
conj('parlare', 'fut', 'parlerò parlerai parlerà parleremo parlerete parleranno'); conj('credere', 'fut', 'crederò crederai crederà crederemo crederete crederanno');
conj('dormire', 'fut', 'dormirò dormirai dormirà dormiremo dormirete dormiranno'); conj('cercare', 'fut', 'cercherò cercherai cercherà cercheremo cercherete cercheranno');
conj('pagare', 'fut', 'pagherò pagherai pagherà pagheremo pagherete pagheranno'); conj('cominciare', 'fut', 'comincerò comincerai comincerà cominceremo comincerete cominceranno');
conj('mangiare', 'fut', 'mangerò mangerai mangerà mangeremo mangerete mangeranno'); conj('sciare', 'fut', 'scierò scierai scierà scieremo scierete scieranno');
conj('essere', 'fut', 'sarò sarai sarà saremo sarete saranno'); conj('avere', 'fut', 'avrò avrai avrà avremo avrete avranno'); conj('fare', 'fut', 'farò farai farà faremo farete faranno');
conj('andare', 'fut', 'andrò andrai andrà andremo andrete andranno'); conj('venire', 'fut', 'verrò verrai verrà verremo verrete verranno');
conj('potere', 'fut', 'potrò potrai potrà potremo potrete potranno'); conj('volere', 'fut', 'vorrò vorrai vorrà vorremo vorrete vorranno');
conj('dovere', 'fut', 'dovrò dovrai dovrà dovremo dovrete dovranno'); conj('sapere', 'fut', 'saprò saprai saprà sapremo saprete sapranno');
conj('stare', 'fut', 'starò starai starà staremo starete staranno'); conj('dare', 'fut', 'darò darai darà daremo darete daranno');
conj('bere', 'fut', 'berrò berrai berrà berremo berrete berranno'); conj('tenere', 'fut', 'terrò terrai terrà terremo terrete terranno');
conj('rimanere', 'fut', 'rimarrò rimarrai rimarrà rimarremo rimarrete rimarranno'); conj('vedere', 'fut', 'vedrò vedrai vedrà vedremo vedrete vedranno');
conj('vivere', 'fut', 'vivrò vivrai vivrà vivremo vivrete vivranno'); conj('dire', 'fut', 'dirò dirai dirà diremo direte diranno'); conj('morire', 'fut', 'morirò morirai morirà moriremo morirete moriranno');

// ---------- participles and passato prossimo ----------
const PP = { parlare: 'parlato', credere: 'creduto', dormire: 'dormito', capire: 'capito', essere: 'stato', stare: 'stato', fare: 'fatto', dire: 'detto', vedere: 'visto', prendere: 'preso',
  mettere: 'messo', scrivere: 'scritto', leggere: 'letto', aprire: 'aperto', chiudere: 'chiuso', chiedere: 'chiesto', rispondere: 'risposto', perdere: 'perso', vincere: 'vinto', rompere: 'rotto',
  decidere: 'deciso', scegliere: 'scelto', correre: 'corso', scendere: 'sceso', nascere: 'nato', morire: 'morto', venire: 'venuto', rimanere: 'rimasto', bere: 'bevuto', vivere: 'vissuto',
  offrire: 'offerto', succedere: 'successo', uccidere: 'ucciso', piangere: 'pianto', ridere: 'riso', muovere: 'mosso', spegnere: 'spento', tradurre: 'tradotto', porre: 'posto',
  conoscere: 'conosciuto', piacere: 'piaciuto', avere: 'avuto', andare: 'andato', uscire: 'uscito', sapere: 'saputo', potere: 'potuto', tenere: 'tenuto', ottenere: 'ottenuto', permettere: 'permesso',
  accendere: 'acceso', spendere: 'speso', scoprire: 'scoperto', cuocere: 'cotto', apparire: 'apparso', esistere: 'esistito', dare: 'dato', mangiare: 'mangiato', cercare: 'cercato' };
for (const v in PP) eq(M.pastPart(V(v)), PP[v], 'pp ' + v);
const PASS = (v, i, g, a, want) => eq(M.passato(V(v), i, g, a), want, 'passato ' + v + ' ' + i + g + (a || ''));
PASS('parlare', 0, 'm', 'a', 'ho parlato'); PASS('parlare', 3, 'f', 'a', 'abbiamo parlato'); PASS('andare', 0, 'f', 'e', 'sono andata'); PASS('andare', 2, 'm', 'e', 'è andato');
PASS('andare', 3, 'm', 'e', 'siamo andati'); PASS('andare', 5, 'f', 'e', 'sono andate'); PASS('essere', 1, 'f', 'e', 'sei stata'); PASS('venire', 4, 'f', 'e', 'siete venute');
PASS('fare', 5, 'f', 'a', 'hanno fatto'); PASS('nascere', 2, 'f', 'e', 'è nata'); PASS('morire', 5, 'm', 'e', 'sono morti'); PASS('rimanere', 3, 'f', 'e', 'siamo rimaste');
for (const v of ['andare', 'venire', 'arrivare', 'partire', 'uscire', 'entrare', 'tornare', 'nascere', 'morire', 'restare', 'rimanere', 'diventare', 'essere', 'stare', 'cadere', 'succedere', 'piacere'])
  if (BY[v]) ok(D.auxes(BY[v]).includes('e'), 'aux essere: ' + v);
for (const v of ['avere', 'fare', 'dire', 'parlare', 'mangiare', 'vedere', 'prendere', 'mettere', 'scrivere', 'dormire', 'capire', 'lavorare', 'dare', 'bere'])
  if (BY[v]) eq(D.auxes(BY[v]), ['a'], 'aux avere: ' + v);
for (const v of ['correre', 'cambiare', 'finire', 'cominciare', 'passare', 'salire', 'scendere', 'vivere']) if (BY[v]) eq(D.auxes(BY[v]).length, 2, 'aux both: ' + v);
eq(D.ppAnswers(BY.correre, 0, 'f'), ['ho corso', 'sono corsa'], 'a/e verbs accept both');

// ---------- irregular flags and classes ----------
for (const v of ['essere', 'avere', 'fare', 'andare', 'venire', 'dire', 'potere', 'volere', 'dovere', 'sapere', 'stare', 'dare', 'uscire', 'bere', 'tenere', 'rimanere', 'morire', 'scegliere', 'salire', 'tradurre', 'porre'])
  { ok(BY[v], 'in list: ' + v); if (BY[v]) { ok(M.isIrregular(BY[v]), 'irregular: ' + v); ok(BY[v].irr, 'irr flag: ' + v); } }
eq(['parlare', 'credere', 'dormire', 'capire', 'finire', 'partire'].map(v => BY[v] && BY[v].conj), ['are', 'ere', 'ire', 'isc', 'isc', 'ire'], 'verb classes');

// ---------- answer checking ----------
eq(D.check('citta', ['città'], true).ok, false, 'strict accents'); eq(D.check('citta', ['città'], true).accent, true, 'accent-only miss flagged');
eq(D.check('citta', ['città'], false).ok, true, 'lenient accents'); eq(D.check('  Parlo ', ['parlo'], true).ok, true, 'trim/case');
eq(D.check('l’amico', ["l'amico"], true).ok, true, 'curly apostrophe'); eq(D.check("l' amico", ["l'amico"], true).ok, true, 'space after apostrophe');
eq(D.check('perche', ['perché'], false).ok, true, 'é lenient'); eq(D.check('io parlo', ['parlo'], true).ok, true, 'optional subject pronoun');

// ---------- data integrity ----------
eq(WORDS.length, 1500, 'word count'); eq(new Set(WORDS.map(w => w.id)).size, 1500, 'unique ids');
eq(new Set(WORDS.map(w => w.it + '|' + w.pos)).size, 1500, 'unique headword+pos');
ok(WORDS.every((w, i) => w.rank === i + 1), 'ranks 1..1500 in order');
ok(WORDS.every(w => w.en && w.en.trim() && !/[A-Z]{3,}|\bTODO\b|\?\?/.test(w.en)), 'every word has a clean gloss');
ok(WORDS.every(w => /^[a-zàèéìòù']+$/.test(w.it)), 'headwords lowercase Italian letters');
ok(WORDS.filter(w => w.pos === 'n').every(w => ['m', 'f', 'mf'].includes(w.g)), 'every noun has a gender');
ok(WORDS.filter(w => w.pos === 'adj').every(w => Array.isArray(w.forms) && w.forms.length === 4), 'every adjective has 4 forms');
ok(WORDS.filter(w => w.pos === 'v').every(w => ['are', 'ere', 'ire', 'isc'].includes(w.conj) && ['a', 'e', 'a/e'].includes(w.aux || 'a')), 'every verb has class + aux');
ok(WORDS.filter(w => w.pos === 'v').every(w => w.conj === 'isc' ? /ire$/.test(w.it) : w.it.endsWith(w.conj === 'ere' ? 'rre' : 'xx') || w.it.endsWith(w.conj === 'ere' ? 'ere' : w.conj === 'are' ? 'are' : 'ire') || /(rre|ere)$/.test(w.it)), 'verb class matches ending');
const dc = require('./datacheck.js').check(); eq(dc, [], 'cross-check vs Wiktionary + Morph-it: unreviewed discrepancies');

// ---------- drills: every combo × every word yields a sane question ----------
const UALL = D.buildUnits(WORDS, D.DF), CTX = { agrNouns: D.agrNouns(WORDS) }, BID = {}; WORDS.forEach(w => BID[w.id] = w);
let nq = 0, bad = [];
ok(CTX.agrNouns.length >= 8, 'agreement nouns available');
for (const c of Object.keys(UALL)) for (const id of UALL[c]) {
  const q = D.makeQ(c, BID[id], CTX, () => 0.37); nq++;
  if (!q) { bad.push(c + ' ' + id + ': null'); continue; }
  if (!q.answers.length || q.answers.some(a => !a)) bad.push(c + ' ' + id + ': empty answer');
  if (!q.answers.every(a => D.check(a, q.answers, true).ok)) bad.push(c + ' ' + id + ': answers rejected');
  if (!q.valid.length || !q.rows.length) bad.push(c + ' ' + id + ': no identify data');
  else { const want = q.valid[0]; if (!D.idRight(q, want)) bad.push(c + ' ' + id + ': idRight rejects valid'); }
  if (q.rows.some(r => !r.opts.some(([v]) => q.valid.some(x => x[r.key] === v)))) bad.push(c + ' ' + id + ': right chip missing');
}
eq(bad.slice(0, 10), [], 'drill questions (' + nq + ' checked)');
ok(nq > 10000, 'many drill questions generated: ' + nq);
for (const k of ['verb', 'art', 'agr']) ok(Object.keys(UALL).some(c => D.kindOf(c) === k), 'combos of kind ' + k);
for (const t of ['pres', 'pp', 'imp', 'fut']) for (const g of ['are', 'ere', 'ire', 'isc', 'irr']) ok(Object.keys(UALL).some(c => c.startsWith('v' + g + '|' + t + '.')), 'combos v' + g + '|' + t);
ok(Object.keys(UALL).every(c => D.comboLabel(c) && D.comboAnchor(c)), 'every combo has a label and cheat-sheet anchor');
// spot checks of generated questions
const Qf = (c, it) => D.makeQ(c, BY[it], CTX, () => 0.1);
eq(Qf('virr|pres.1s', 'essere').answers, ['sono'], 'drill: essere io'); eq(Qf('vare|fut.3p', 'parlare').answers, ['parleranno'], 'drill: parleranno');
const keyFor = (it, re) => Object.keys(UALL).find(c => re.test(c) && UALL[c].includes(BY[it].id));
ok(keyFor('andare', /\|pp\./), 'andare in pp drills');
const qa = D.makeQ(keyFor('andare', /\|pp\.1s/) || 'virr|pp.1s', BY.andare, CTX, () => 0.1); ok(qa && qa.answers.some(a => /^sono andat[oa]$/.test(a)), 'drill: sono andato/a');
const qart = D.makeQ(keyFor('studente', /^art\|def\.m\.s/), BY.studente, CTX, () => 0.1); eq(qart && qart.answers, ['lo studente'], 'drill: lo studente');
const qp = D.makeQ(keyFor('studente', /^art\|def\.m\.p/), BY.studente, CTX, () => 0.1); eq(qp && qp.answers, ['gli studenti'], 'drill: gli studenti');
for (const [it, re, want] of [['idea', /^art\|ind/, ["un'idea"]], ['amico', /^art\|ind/, ['un amico']], ['zio', /^art\|ind/, ['uno zio']], ['zio', /^art\|def\.m\.p/, ['gli zii']], ['uovo', /^art\|def\.m\.p|^art\|def\.f\.p/, ['le uova']]])
  if (BY[it]) { const k = keyFor(it, re); const q = k && D.makeQ(k, BY[it], CTX, () => 0.1); eq(q && q.answers, want, 'drill: ' + want[0]); }
// refl/impers verbs excluded
ok(!Object.values(UALL).some(ids => ids.some(id => BID[id].refl || BID[id].impers)), 'reflexive/impersonal verbs not drilled');

// ---------- lessons ----------
eq(LESSONS.length >= 10, true, 'at least 10 lessons');
for (const l of LESSONS) {
  ok(l.id && l.title && l.body && l.tables && l.tables.length && l.quiz, 'lesson complete: ' + l.id);
  if (l.drill) ok(Object.keys(UALL).some(c => new RegExp(l.drill.re).test(c)), 'lesson drill matches combos: ' + l.id);
  if (l.quiz.t === 'drill') ok(Object.keys(UALL).filter(c => new RegExp(l.quiz.re).test(c))
    .reduce((n, c) => n + UALL[c].length, 0) >= 5, 'lesson quiz has combos: ' + l.id);
  if (l.quiz.t === 'mc') ok(l.quiz.qs.every(([q, o, a]) => q && o.length >= 2 && o[a] != null && new Set(o).size === o.length), 'mc quiz well-formed: ' + l.id);
  for (const t of l.tables) if (t.t === 'verbs') for (const v of t.vs) ok(t.tense === 'pp' ? M.pastPart(V(v)) : M.tense(V(v), t.tense).length === 6, 'lesson verb table: ' + v);
}

// ---------- core: SRS ----------
{
  const ids = ['a', 'b', 'c'], cards = {}, t = 100; let d = SRS.dayState(null, t);
  eq(SRS.counts(cards, ids, t, 2, d), { due: 0, fresh: 2 }, 'srs: new per day');
  const q = SRS.session(cards, ids, t, 2, d); eq(q.items.map(x => x.k), ['r:a', 'r:b'], 'srs: session order');
  SRS.answer({ cards, day: d, queue: q }, q.items.shift(), true, t);
  eq(cards['r:a'], { box: 1, due: 101 }, 'srs: right -> box 1, tomorrow'); eq(cards['p:a'], { box: 0, due: 101 }, 'srs: production card unlocked');
  SRS.answer({ cards, day: d, queue: q }, q.items.shift(), false, t);
  eq(cards['r:b'], { box: 0, due: 100 }, 'srs: wrong -> box 0 today'); eq(q.items.map(x => x.k), ['r:b'], 'srs: missed card re-queued');
  eq(d.nv, 2, 'srs: new words counted once'); eq(SRS.counts(cards, ids, t, 2, d).fresh, 0, 'srs: daily new limit');
  let c = { box: 0, due: 0 }; const seen = []; for (let i = 0; i < 8; i++) { c = SRS.sched(c, true, 0); seen.push(c.due); } eq(seen, [1, 3, 7, 14, 30, 60, 120, 120], 'srs: intervals');
  eq(SRS.dayState({ d: 5, nv: 3 }, 6), { d: 6, nv: 0, extra: 0, dn: 0 }, 'srs: day rollover');
  // a card whose word left the list (pack update) is kept but never reviewed
  const oc = { 'r:gone': { box: 2, due: 1 }, 'r:a': { box: 1, due: 1 } }, od = SRS.dayState(null, t);
  eq(SRS.session(oc, ['a'], t, 0, od).items.map(x => x.k), ['r:a'], 'srs: orphaned card skipped in session');
  eq(SRS.counts(oc, ['a'], t, 0, od).due, 1, 'srs: orphaned card not counted as due'); eq(!!oc['r:gone'], true, 'srs: orphaned card kept');
}
// ---------- core: drill picking + sessions ----------
{
  let st; st = DP.record(st, false, 0, 1); st = DP.record(st, true, 0, 2); ok(DP.acc(st) > 0 && DP.acc(st) < 1, 'drillpick: accuracy');
  eq(DP.weakest({ a: DP.record(null, false, 0, 1), b: DP.record(null, true, 0, 1) }, 5, null, 0.85), ['a'], 'drillpick: weakest');
  const ents = [{ c: 'x', kind: 'k', g: 'g' }, { c: 'y', kind: 'k', g: 'g' }]; let nx = 0, ny = 0;
  let sx; for (let i = 1; i <= 5; i++) sx = DP.record(sx, true, Date.now(), i); const stats = { x: sx };
  for (let i = 0; i < 400; i++) (DP.pickCombo(ents, stats, { q: 101 }) === 'x' ? nx++ : ny++);
  ok(ny > nx, 'drillpick: untried/weak combos favored (' + nx + ' vs ' + ny + ')');
  eq(DP.pickWord([{ id: 'a' }, { id: 'b' }], new Set(['a'])), 'b', 'drillpick: avoid recent word');
  const Q = DS.create(4); let k = 0; const src = { pick: () => ({ c: 'c' + (k % 2), id: 'w' + k++ }), pickRedo: (c, av) => ({ c, id: 'redo' }) };
  const seenQ = []; let it; while ((it = DS.next(Q, src))) { seenQ.push(it.id); DS.answer(Q, it, it.id !== 'w0'); }
  eq(seenQ.length, 5, 'drillsession: one re-ask per miss'); ok(seenQ.includes('redo'), 'drillsession: miss re-asked with another word'); eq(Q.done, Q.total, 'drillsession: progress adds up');
}
// ---------- core: store + packs ----------
{
  const mem = { d: {}, getItem(k) { return this.d[k] || null; }, setItem(k, v) { this.d[k] = v; } };
  const s = Store.create('t.v1', x => Object.assign({ cards: {} }, x), mem);
  s.save({ cards: { 'r:a': { box: 2, due: 9 } } }); eq(s.load().cards['r:a'].box, 2, 'store: round trip');
  const txt = s.exportText(s.load()); eq(s.importText(txt).cards['r:a'].due, 9, 'store: export/import');
  let threw = false; try { s.importText('{"x":1}'); } catch (e) { threw = true; } ok(threw, 'store: rejects foreign files');
  threw = false; try { Store.create('other.v1', x => x, mem).importText(txt); } catch (e) { threw = true; } ok(threw, 'store: rejects other app exports');
}
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const pending = Packs.load('data/packs/', u => Promise.resolve(JSON.parse(fs.readFileSync(path.join(root, u), 'utf8'))), new Set()).then(r => {
  eq(r.words.length, 1500, 'packs: core loaded'); eq(r.packs.map(p => p.id), ['core'], 'packs: index'); ok(r.words.every(w => w.pack === 'core'), 'packs: tagged');
  eq(Packs.gid('rome', 'x'), 'rome/x', 'packs: non-core ids prefixed');
  // service worker precaches every file the page loads
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  ok(/const CACHE = 'italiano1500-v1'/.test(sw), 'sw: cache name');
  const assets = [...sw.matchAll(/'([^']+\.(?:js|css|json|png|html|webmanifest))'/g)].map(m => m[1]);
  for (const a of assets) ok(fs.existsSync(path.join(root, a)), 'sw asset exists: ' + a);
  for (const m of html.matchAll(/(?:src|href)="([^"#:]+)"/g)) ok(assets.includes(m[1]), 'index asset precached: ' + m[1]);
});

// ---------- hand spot-check sample (reviewed against Treccani/Wiktionary by hand; frozen here) ----------
const SPOT = { casa: ['f', 'case'], uomo: ['m', 'uomini'], mano: ['f', 'mani'], problema: ['m', 'problemi'], città: ['f', 'città'], amico: ['m', 'amici'], giorno: ['m', 'giorni'],
  notte: ['f', 'notti'], volta: ['f', 'volte'], tempo: ['m', 'tempi'], vita: ['f', 'vite'], padre: ['m', 'padri'], madre: ['f', 'madri'], figlio: ['m', 'figli'], occhio: ['m', 'occhi'],
  luogo: ['m', 'luoghi'], gioco: ['m', 'giochi'], medico: ['m', 'medici'], film: ['m', 'film'], foto: ['f', 'foto'], braccio: ['m', 'braccia'], dito: ['m', 'dita'], porta: ['f', 'porte'],
  acqua: ['f', 'acque'], cosa: ['f', 'cose'], posto: ['m', 'posti'], lavoro: ['m', 'lavori'], mondo: ['m', 'mondi'], parte: ['f', 'parti'], fine: ['f', 'fini'], amore: ['m', 'amori'] };
for (const it in SPOT) { const w = BY[it]; if (!w) { ok(false, 'spot: missing ' + it); continue; } eq([w.g, M.nounPlural(w).pl], SPOT[it], 'spot noun ' + it); }

pending.then(() => {
  console.log(fails.map(f => 'FAIL ' + f).join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}).catch(e => { console.error(e); process.exit(1); });
