/* Italiano 1500 — Italian morphology engine.
   Articles, noun plurals, adjective agreement, and verb forms for the present, imperfetto, future and
   passato prossimo. Pure functions, no DOM; runs in the browser (window.ItMorph) and in Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ItMorph = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VOW = 'aeiouàèéìíòóùú';
  function isV(c) { return !!c && VOW.indexOf(c) >= 0; }
  function last(s, n) { return s.slice(-(n || 1)); }
  function lower(s) { return String(s).toLowerCase(); }
  var ACC_FINAL = /[àèéìíòóùú]$/;

  /* ---------- articles ---------- */
  // "lo-type" onsets: s + consonant, z, gn, ps, pn, x, y, and i/j + vowel (lo iodio, lo yogurt).
  function onset(word) {
    var w = lower(word).replace(/^['’]/, '');
    var a = w[0], b = w[1];
    if (!a) return 'c';
    if (a === 'h') return isV(b) ? 'v' : 'c';            // l'hotel, l'hamburger: silent h
    if (a === 's' && b && !isV(b)) return 'z';
    if (a === 'z' || a === 'x' || a === 'y') return 'z';
    if (/^(gn|ps|pn)/.test(w)) return 'z';
    if ((a === 'i' || a === 'j') && isV(b)) return 'z';   // lo iato, lo ione, lo juventino
    if (isV(a)) return 'v';
    return 'c';
  }
  // g: 'm'|'f'; n: 's'|'p'. Returns the article as written before `word` (l' carries its apostrophe).
  function defArt(word, g, n) {
    var o = onset(word);
    if (g === 'f') return n === 'p' ? 'le' : (o === 'v' ? "l'" : 'la');
    if (n === 'p') return (o === 'c' && !/^d[eè]i$/.test(lower(word))) ? 'i' : 'gli';   // gli dei (fixed exception)
    return o === 'v' ? "l'" : (o === 'z' ? 'lo' : 'il');
  }
  function indefArt(word, g) {
    var o = onset(word);
    if (g === 'f') return o === 'v' ? "un'" : 'una';
    return o === 'z' ? 'uno' : 'un';
  }
  function withArt(art, word) { return /'$/.test(art) ? art + word : art + ' ' + word; }

  /* ---------- nouns ---------- */
  // irregular plurals: [plural, plural gender]
  var NPL = {
    uomo: ['uomini', 'm'], dio: ['dei', 'm'], bue: ['buoi', 'm'], mano: ['mani', 'f'], ala: ['ali', 'f'], arma: ['armi', 'f'],
    moglie: ['mogli', 'f'], tempio: ['templi', 'm'], uovo: ['uova', 'f'], braccio: ['braccia', 'f'], dito: ['dita', 'f'],
    ginocchio: ['ginocchia', 'f'], osso: ['ossa', 'f'], labbro: ['labbra', 'f'], lenzuolo: ['lenzuola', 'f'], paio: ['paia', 'f'],
    centinaio: ['centinaia', 'f'], migliaio: ['migliaia', 'f'], miglio: ['miglia', 'f'], ciglio: ['ciglia', 'f'], riso: ['risa', 'f'],
    orecchio: ['orecchie', 'f'], grido: ['grida', 'f'], urlo: ['urla', 'f'], sopracciglio: ['sopracciglia', 'f'], vestigio: ['vestigia', 'f'],
    amico: ['amici', 'm'], nemico: ['nemici', 'm'], greco: ['greci', 'm'], porco: ['porci', 'm'],
    carico: ['carichi', 'm'], incarico: ['incarichi', 'm'], strascico: ['strascichi', 'm'], valico: ['valichi', 'm'],
    zio: ['zii', 'm'], addio: ['addii', 'm'], rinvio: ['rinvii', 'm'], invio: ['invii', 'm'], pendio: ['pendii', 'm'], leggio: ['leggii', 'm'],
    obbligo: ['obblighi', 'm'], dialogo: ['dialoghi', 'm'], catalogo: ['cataloghi', 'm'], prologo: ['prologhi', 'm'], epilogo: ['epiloghi', 'm'],
    asparago: ['asparagi', 'm'], mago: ['maghi', 'm'], sindaco: ['sindaci', 'm'], monaco: ['monaci', 'm'], parroco: ['parroci', 'm'],
    medico: ['medici', 'm'], belga: ['belgi', 'm'], collega: ['colleghi', 'm'], specie: ['specie', 'f'], serie: ['serie', 'f'],
    superficie: ['superfici', 'f'], effigie: ['effigi', 'f'], cinema: ['cinema', 'm'], vaglia: ['vaglia', 'm'], gorilla: ['gorilla', 'm'],
    boa: ['boa', 'm'], sosia: ['sosia', 'm'], radio: ['radio', 'f'], foto: ['foto', 'f'], moto: ['moto', 'f'], auto: ['auto', 'f'],
    eco: ['echi', 'm'], video: ['video', 'm'], retro: ['retro', 'm'], detective: ['detective', 'm'], audio: ['audio', 'm'],
    stereo: ['stereo', 'm'], zoo: ['zoo', 'm'], dopo: ['dopo', 'm'], benvenuto: ['benvenuto', 'm'], euro: ['euro', 'm'], virus: ['virus', 'm'],
  };
  // vowel letters, so that via/zia/buio are not mistaken for monosyllables (re, gru, tè are)
  function syll(w) { var m = lower(w).match(/[aeiouàèéìíòóùú]/g); return m ? m.length : 0; }
  // Regular plural of a noun (or of an adjective's masc/fem singular). Returns null when invariable.
  function pluralRule(w, g) {
    var e = last(w), e2 = last(w, 2), e3 = last(w, 3), st = w.slice(0, -1);
    if (ACC_FINAL.test(w) || !isV(e) || syll(w) < 2) return w;                 // città, bar, re
    if (e === 'i') return w;                                                  // crisi, analisi
    if (e2 === 'ie') return w;                                                // specie, serie
    if (e === 'o') {
      if (g === 'f') return w;                                                // radio, foto (mano is listed)
      if (e2 === 'co') return (syll(w) >= 3 && /ico$/.test(w)) ? st.slice(0, -1) + 'ci' : st.slice(0, -1) + 'chi';
      if (e2 === 'go') return /olog$/.test(st) ? st.slice(0, -1) + 'gi' : st.slice(0, -1) + 'ghi';
      if (e2 === 'io') return st;                                             // figlio→figli, negozio→negozi
      return st + 'i';
    }
    if (e === 'a') {
      if (g === 'm') {                                                        // problema→problemi, poeta→poeti
        if (e2 === 'ca') return st.slice(0, -1) + 'chi';                      // monarca→monarchi
        if (e2 === 'ga') return st.slice(0, -1) + 'ghi';                      // collega→colleghi
        return st + 'i';
      }
      if (e2 === 'ca') return st.slice(0, -1) + 'che';
      if (e2 === 'ga') return st.slice(0, -1) + 'ghe';
      if (e3 === 'cia' || e3 === 'gia') {                                     // camicia→camicie, arancia→arance
        var before = w.slice(-4, -3);
        if (isV(before) || /(rgia|ergia|urgia)$/.test(w)) return st.slice(0, -1) + 'ie';
        return st.slice(0, -1) + 'e';
      }
      return st + 'e';
    }
    if (e === 'e') return st + 'i';
    if (e === 'u') return w;                                                  // tabù, guru
    return w;
  }
  // noun: {it, g:'m'|'f'|'mf', pl?, plg?, inv?, pltant?}
  function nounPlural(n) {
    if (n.pltant) return { pl: n.it, g: n.g === 'f' ? 'f' : 'm' };
    if (n.inv) return { pl: n.it, g: n.g === 'f' ? 'f' : 'm' };
    if (n.pl) return { pl: n.pl, g: n.plg || (n.g === 'f' ? 'f' : 'm') };
    var r = NPL[n.it];
    if (r) return { pl: r[0], g: r[1] };
    return { pl: pluralRule(n.it, n.g === 'f' ? 'f' : 'm'), g: n.g === 'f' ? 'f' : 'm' };
  }

  /* ---------- adjectives ---------- */
  var ADJ_INV = { blu: 1, rosa: 1, viola: 1, pari: 1, dispari: 1, marrone: 0, beige: 1, arancione: 0, ok: 1, super: 1, extra: 1, antiproiettile: 1, meglio: 1, peggio: 1, qualunque: 1, qualsiasi: 1, ogni: 1, perbene: 1, dabbene: 1 };
  var ADJ_IRR = {
    antico: ['antico', 'antica', 'antichi', 'antiche'], amico: ['amico', 'amica', 'amici', 'amiche'], nemico: ['nemico', 'nemica', 'nemici', 'nemiche'],
    greco: ['greco', 'greca', 'greci', 'greche'], carico: ['carico', 'carica', 'carichi', 'cariche'], porco: ['porco', 'porca', 'porci', 'porche'],
    pio: ['pio', 'pia', 'pii', 'pie'], rio: ['rio', 'ria', 'rii', 'rie'], restio: ['restio', 'restia', 'restii', 'restie'],
    natio: ['natio', 'natia', 'natii', 'natie'], belga: ['belga', 'belga', 'belgi', 'belghe'],
    mio: ['mio', 'mia', 'miei', 'mie'], tuo: ['tuo', 'tua', 'tuoi', 'tue'], suo: ['suo', 'sua', 'suoi', 'sue']
  };
  // Returns [ms, fs, mp, fp]. a: {it, cls?:'o'|'e'|'a'|'inv', forms?:[...4]}
  function adjForms(a) {
    if (a.forms) return a.forms.slice();
    var w = a.it;
    if (ADJ_IRR[w]) return ADJ_IRR[w].slice();
    if (a.cls === 'inv' || ADJ_INV[w] === 1 || ACC_FINAL.test(w) || !isV(last(w))) return [w, w, w, w];
    var e = last(w), st = w.slice(0, -1);
    if (e === 'o' || a.cls === 'o') {
      var mp = pluralRule(w, 'm'), fs = st + 'a', fp = pluralRule(fs, 'f');
      return [w, fs, mp, fp];
    }
    if (e === 'a') return [w, w, pluralRule(w, 'm'), pluralRule(w, 'f')];      // egoista: egoisti/egoiste
    if (e === 'e') return [w, w, st + 'i', st + 'i'];
    return [w, w, w, w];
  }
  function adjAgree(a, g, n) { var f = adjForms(a); return f[(g === 'f' ? 1 : 0) + (n === 'p' ? 2 : 0)]; }

  /* ---------- verbs ---------- */
  var P = ['1s', '2s', '3s', '1p', '2p', '3p'];
  var END = {
    pres: { are: ['o', 'i', 'a', 'iamo', 'ate', 'ano'], ere: ['o', 'i', 'e', 'iamo', 'ete', 'ono'], ire: ['o', 'i', 'e', 'iamo', 'ite', 'ono'] },
    imp: { are: ['avo', 'avi', 'ava', 'avamo', 'avate', 'avano'], ere: ['evo', 'evi', 'eva', 'evamo', 'evate', 'evano'], ire: ['ivo', 'ivi', 'iva', 'ivamo', 'ivate', 'ivano'] },
    fut: ['ò', 'ai', 'à', 'emo', 'ete', 'anno']
  };
  // Stressed-i -iare verbs keep the i before -i: invio, invii.
  var IA_STRESSED = { inviare: 1, sciare: 1, spiare: 1, avviare: 1, rinviare: 1, deviare: 1, obliare: 1, espiare: 1, ronzare: 0, scivolare: 0, alleviare: 0, sviare: 1, ravviare: 1 };

  // Irregular verbs. Each: pres[6], imp: stem (or [6]), fut: stem, pp, aux. Missing parts are regular.
  var IRR = {
    essere: { pres: ['sono', 'sei', 'è', 'siamo', 'siete', 'sono'], imp: ['ero', 'eri', 'era', 'eravamo', 'eravate', 'erano'], fut: 'sar', pp: 'stato', aux: 'e' },
    avere: { pres: ['ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno'], fut: 'avr', pp: 'avuto', aux: 'a' },
    fare: { pres: ['faccio', 'fai', 'fa', 'facciamo', 'fate', 'fanno'], imp: 'fac', impc: 'ere', fut: 'far', pp: 'fatto' },
    andare: { pres: ['vado', 'vai', 'va', 'andiamo', 'andate', 'vanno'], fut: 'andr' },
    stare: { pres: ['sto', 'stai', 'sta', 'stiamo', 'state', 'stanno'], fut: 'star', pp: 'stato' },
    dare: { pres: ['do', 'dai', 'dà', 'diamo', 'date', 'danno'], fut: 'dar' },
    dire: { pres: ['dico', 'dici', 'dice', 'diciamo', 'dite', 'dicono'], imp: 'dic', impc: 'ere', fut: 'dir', pp: 'detto' },
    venire: { pres: ['vengo', 'vieni', 'viene', 'veniamo', 'venite', 'vengono'], fut: 'verr', pp: 'venuto' },
    tenere: { pres: ['tengo', 'tieni', 'tiene', 'teniamo', 'tenete', 'tengono'], fut: 'terr', pp: 'tenuto' },
    potere: { pres: ['posso', 'puoi', 'può', 'possiamo', 'potete', 'possono'], fut: 'potr' },
    volere: { pres: ['voglio', 'vuoi', 'vuole', 'vogliamo', 'volete', 'vogliono'], fut: 'vorr' },
    dovere: { pres: ['devo', 'devi', 'deve', 'dobbiamo', 'dovete', 'devono'], fut: 'dovr' },
    sapere: { pres: ['so', 'sai', 'sa', 'sappiamo', 'sapete', 'sanno'], fut: 'sapr' },
    uscire: { pres: ['esco', 'esci', 'esce', 'usciamo', 'uscite', 'escono'] },
    bere: { pres: ['bevo', 'bevi', 'beve', 'beviamo', 'bevete', 'bevono'], imp: 'bev', impc: 'ere', fut: 'berr', pp: 'bevuto' },
    rimanere: { pres: ['rimango', 'rimani', 'rimane', 'rimaniamo', 'rimanete', 'rimangono'], fut: 'rimarr', pp: 'rimasto' },
    salire: { pres: ['salgo', 'sali', 'sale', 'saliamo', 'salite', 'salgono'] },
    morire: { pres: ['muoio', 'muori', 'muore', 'moriamo', 'morite', 'muoiono'], pp: 'morto' },
    sedere: { pres: ['siedo', 'siedi', 'siede', 'sediamo', 'sedete', 'siedono'] },
    piacere: { pres: ['piaccio', 'piaci', 'piace', 'piacciamo', 'piacete', 'piacciono'], pp: 'piaciuto' },
    tacere: { pres: ['taccio', 'taci', 'tace', 'tacciamo', 'tacete', 'tacciono'], pp: 'taciuto' },
    giacere: { pres: ['giaccio', 'giaci', 'giace', 'giacciamo', 'giacete', 'giacciono'], pp: 'giaciuto' },
    parere: { pres: ['paio', 'pari', 'pare', 'paiamo', 'parete', 'paiono'], fut: 'parr', pp: 'parso' },
    valere: { pres: ['valgo', 'vali', 'vale', 'valiamo', 'valete', 'valgono'], fut: 'varr', pp: 'valso' },
    dolere: { pres: ['dolgo', 'duoli', 'duole', 'doliamo', 'dolete', 'dolgono'], fut: 'dorr', pp: 'doluto' },
    cogliere: { pres: ['colgo', 'cogli', 'coglie', 'cogliamo', 'cogliete', 'colgono'], pp: 'colto' },
    togliere: { pres: ['tolgo', 'togli', 'toglie', 'togliamo', 'togliete', 'tolgono'], pp: 'tolto' },
    scegliere: { pres: ['scelgo', 'scegli', 'sceglie', 'scegliamo', 'scegliete', 'scelgono'], pp: 'scelto' },
    sciogliere: { pres: ['sciolgo', 'sciogli', 'scioglie', 'sciogliamo', 'sciogliete', 'sciolgono'], pp: 'sciolto' },
    spegnere: { pres: ['spengo', 'spegni', 'spegne', 'spegniamo', 'spegnete', 'spengono'], pp: 'spento' },
    porre: { pres: ['pongo', 'poni', 'pone', 'poniamo', 'ponete', 'pongono'], imp: 'pon', impc: 'ere', fut: 'porr', pp: 'posto' },
    trarre: { pres: ['traggo', 'trai', 'trae', 'traiamo', 'traete', 'traggono'], imp: 'tra', impc: 'ere', fut: 'trarr', pp: 'tratto' },
    durre: { pres: ['duco', 'duci', 'duce', 'duciamo', 'ducete', 'ducono'], imp: 'duc', impc: 'ere', fut: 'durr', pp: 'dotto' },
    parire: { pres: ['paio', 'pari', 'pare', 'pariamo', 'parite', 'paiono'], pp: 'parso' },   // only in ap-/com-/scom-parire
    riempire: { pres: ['riempio', 'riempi', 'riempie', 'riempiamo', 'riempite', 'riempiono'] },
    cuocere: { pres: ['cuocio', 'cuoci', 'cuoce', 'cuociamo', 'cuocete', 'cuociono'], pp: 'cotto' },
    vedere: { fut: 'vedr', pp: 'visto' }, vivere: { fut: 'vivr', pp: 'vissuto' }, cadere: { fut: 'cadr' }, godere: { fut: 'godr' },
    udire: { pres: ['odo', 'odi', 'ode', 'udiamo', 'udite', 'odono'] },
    // -ere infinitive, but imperfect and future go like compire (compivo, compirò)
    compiere: { pres: ['compio', 'compi', 'compie', 'compiamo', 'compite', 'compiono'], imp: 'comp', impc: 'ire', fut: 'compir', pp: 'compiuto' },
   
  };
  // prefixed compounds that conjugate like their base (only the listed ones: tradire is not a compound of dire!)
  var FAMILY = {
    fare: ['rifare', 'disfare', 'soddisfare', 'strafare', 'contraffare', 'liquefare'],
    dire: ['contraddire', 'disdire', 'predire', 'ridire', 'benedire', 'maledire'],
    venire: ['avvenire', 'divenire', 'convenire', 'intervenire', 'prevenire', 'svenire', 'rivenire', 'sovvenire', 'pervenire', 'provenire', 'contravvenire'],
    tenere: ['mantenere', 'ottenere', 'contenere', 'trattenere', 'sostenere', 'appartenere', 'ritenere', 'detenere', 'intrattenere', 'astenere', 'attenere', 'ottenere'],
    vedere: ['rivedere', 'prevedere', 'intravedere', 'stravedere'],
    stare: ['sovrastare'], dare: ['ridare'], uscire: ['riuscire'], scegliere: [], cogliere: ['accogliere', 'raccogliere'],
    togliere: ['distogliere'], sciogliere: [], porre: ['comporre', 'disporre', 'esporre', 'imporre', 'opporre', 'proporre', 'supporre', 'deporre', 'riporre', 'predisporre', 'presupporre', 'scomporre'],
    trarre: ['distrarre', 'attrarre', 'estrarre', 'sottrarre', 'contrarre', 'ritrarre'],
    durre: ['tradurre', 'produrre', 'condurre', 'ridurre', 'introdurre', 'dedurre', 'indurre', 'sedurre', 'riprodurre', 'ricondurre'],
    parire: ['apparire', 'scomparire', 'riapparire', 'comparire'], salire: ['risalire'], rimanere: [], piacere: ['dispiacere', 'compiacere'],
    sedere: ['possedere'], chiedere: ['richiedere'], riempire: [], tacere: [], valere: ['prevalere'], cuocere: [], vivere: ['sopravvivere', 'rivivere', 'convivere'],
    cadere: ['accadere', 'decadere', 'scadere'], morire: [], parere: [], godere: [], volere: [], spegnere: [], compiere: []
  };
  var FAM_OF = {};
  Object.keys(FAMILY).forEach(function (b) { FAMILY[b].forEach(function (v) { FAM_OF[v] = b; }); });
  // irregular past participles beyond the IRR table (Wiktionary-checked; compounds share the base's)
  var PP = {
    prendere: 'preso', mettere: 'messo', chiedere: 'chiesto', rispondere: 'risposto', leggere: 'letto', scrivere: 'scritto',
    rompere: 'rotto', chiudere: 'chiuso', decidere: 'deciso', uccidere: 'ucciso', correre: 'corso', nascere: 'nato', perdere: 'perso',
    muovere: 'mosso', vincere: 'vinto', piangere: 'pianto', aprire: 'aperto', offrire: 'offerto', soffrire: 'sofferto',
    coprire: 'coperto', scoprire: 'scoperto', succedere: 'successo', accendere: 'acceso', scendere: 'sceso', spendere: 'speso',
    difendere: 'difeso', offendere: 'offeso', ridere: 'riso', sorridere: 'sorriso', dividere: 'diviso', condividere: 'condiviso',
    discutere: 'discusso', esprimere: 'espresso', comprimere: 'compresso', reprimere: 'represso', assumere: 'assunto',
    presumere: 'presunto', giungere: 'giunto', raggiungere: 'raggiunto', aggiungere: 'aggiunto', dipingere: 'dipinto', fingere: 'finto',
    spingere: 'spinto', stringere: 'stretto', costringere: 'costretto', distruggere: 'distrutto', proteggere: 'protetto',
    correggere: 'corretto', reggere: 'retto', dirigere: 'diretto', eleggere: 'eletto', friggere: 'fritto', risolvere: 'risolto',
    rivolgere: 'rivolto', volgere: 'volto', sconvolgere: 'sconvolto', coinvolgere: 'coinvolto', svolgere: 'svolto',
    seppellire: 'sepolto', nascondere: 'nascosto', concludere: 'concluso', escludere: 'escluso', includere: 'incluso',
    illudere: 'illuso', deludere: 'deluso', accorgere: 'accorto', sorgere: 'sorto', porgere: 'porto', mordere: 'morso',
    fondere: 'fuso', confondere: 'confuso', diffondere: 'diffuso', invadere: 'invaso', persuadere: 'persuaso', evadere: 'evaso',
    rimuovere: 'rimosso', promuovere: 'promosso', commuovere: 'commosso', scuotere: 'scosso', permettere: 'permesso',
    ammettere: 'ammesso', promettere: 'promesso', commettere: 'commesso', scommettere: 'scommesso', smettere: 'smesso',
    trasmettere: 'trasmesso', rimettere: 'rimesso', compromettere: 'compromesso', sottomettere: 'sottomesso', emettere: 'emesso',
    comprendere: 'compreso', riprendere: 'ripreso', sorprendere: 'sorpreso', apprendere: 'appreso', intraprendere: 'intrapreso',
    sospendere: 'sospeso', dipendere: 'dipeso', appendere: 'appeso', attendere: 'atteso', estendere: 'esteso', fraintendere: 'frainteso',
    intendere: 'inteso', pretendere: 'preteso', stendere: 'steso', tendere: 'teso', arrendere: 'arreso', rendere: 'reso',
    concedere: 'concesso', riflettere: 'riflettuto', esistere: 'esistito', insistere: 'insistito',
    resistere: 'resistito', assistere: 'assistito', consistere: 'consistito', persistere: 'persistito',
    soccorrere: 'soccorso', percorrere: 'percorso', ricorrere: 'ricorso', occorrere: 'occorso', trascorrere: 'trascorso',
    accorrere: 'accorso', rincorrere: 'rincorso', scorrere: 'scorso', interrompere: 'interrotto', corrompere: 'corrotto',
    irrompere: 'irrotto', iscrivere: 'iscritto', descrivere: 'descritto', prescrivere: 'prescritto', trascrivere: 'trascritto',
    sottoscrivere: 'sottoscritto', riscrivere: 'riscritto', rileggere: 'riletto', convincere: 'convinto', avvincere: 'avvinto',
    stravincere: 'stravinto', rinascere: 'rinato', distinguere: 'distinto', estinguere: 'estinto', spargere: 'sparso',
    emergere: 'emerso', immergere: 'immerso', torcere: 'torto', storcere: 'storto', redigere: 'redatto', esigere: 'esatto',
    affliggere: 'afflitto', infliggere: 'inflitto', sconfiggere: 'sconfitto', trafiggere: 'trafitto', figgere: 'fitto',
    vivere: 'vissuto', ardere: 'arso', perdere: 'perso', alludere: 'alluso', ledere: 'leso',
    radere: 'raso', recidere: 'reciso', incidere: 'inciso', coincidere: 'coinciso', condurre: 'condotto',
    piovere: 'piovuto', espellere: 'espulso', respingere: 'respinto', tingere: 'tinto', spegnere: 'spento',
    rodere: 'roso', erodere: 'eroso', esplodere: 'esploso', annettere: 'annesso', connettere: 'connesso',
    riconnettere: 'riconnesso', sopprimere: 'soppresso', opprimere: 'oppresso', imprimere: 'impresso', deprimere: 'depresso',
    accludere: 'accluso', precludere: 'precluso', contundere: 'contuso', mungere: 'munto', pungere: 'punto', ungere: 'unto',
    fungere: 'funto', cingere: 'cinto', sorreggere: 'sorretto',
    corrispondere: 'corrisposto', riconoscere: 'riconosciuto', conoscere: 'conosciuto', crescere: 'cresciuto', mescere: 'mesciuto',
    riaprire: 'riaperto', ricoprire: 'ricoperto', riscoprire: 'riscoperto',
    morire: 'morto', venire: 'venuto', essere: 'stato', redimere: 'redento', deridere: 'deriso',
    rimpiangere: 'rimpianto', compiangere: 'compianto', cogliere: 'colto', fare: 'fatto', soffriggere: 'soffritto', sfuggire: 'sfuggito',
    risorgere: 'risorto', insorgere: 'insorto', scorgere: 'scorto', sporgere: 'sporto', assolvere: 'assolto', dissolvere: 'dissolto',
    evolvere: 'evoluto', devolvere: 'devoluto', travolgere: 'travolto', avvolgere: 'avvolto', capovolgere: 'capovolto',
    stravolgere: 'stravolto', scindere: 'scisso', prefiggere: 'prefisso', crocifiggere: 'crocifisso',
    dirimere: 'dirimuto', cedere: 'ceduto', procedere: 'proceduto', precedere: 'preceduto',
    accedere: 'acceduto', eccedere: 'ecceduto', ricevere: 'ricevuto', battere: 'battuto', combattere: 'combattuto'
  };
  // -ere verbs with no special past participle use -uto; -ire verbs -ito; -are -ato.
  function cls(inf) {
    if (/rre$/.test(inf)) return 'ere';
    return inf.slice(-3);
  }
  function irrOf(inf) {
    if (IRR[inf]) return { base: inf, pre: '', d: IRR[inf] };
    var b = FAM_OF[inf];
    if (b) return { base: b, pre: inf.slice(0, inf.length - b.length), d: IRR[b] || {} };
    return null;
  }
  // fut/pres helper for regular verbs (inf, conj class, isc flag)
  function regPres(inf, c, isc) {
    var st = inf.slice(0, -3), e = END.pres[c], out = [];
    for (var i = 0; i < 6; i++) {
      var en = e[i];
      if (isc && (i < 3 || i === 5)) { out.push(st + 'isc' + en); continue; }
      var s = st;
      if (c === 'are') {
        if (/[cg]$/.test(s) && (en[0] === 'i' || en[0] === 'e')) s += 'h';            // cerchi, paghiamo
        else if (/i$/.test(s) && en[0] === 'i') {                                   // studi, mangiamo, sbagli
          if (IA_STRESSED[inf] && en === 'i') s = s; else s = s.slice(0, -1);
        }
      } else if (/i$/.test(s) && en[0] === 'i' && c !== 'are') s = s.slice(0, -1);
      out.push(s + en);
    }
    return out;
  }
  function futStem(inf, c) {
    var st = inf.slice(0, -3);
    if (c === 'are') {
      if (/[cg]$/.test(st)) return st + 'her';                                     // cercherò, pagherò
      if (/[cg]i$/.test(st) && !IA_STRESSED[inf]) return st.slice(0, -1) + 'er';   // comincerò, mangerò (but sciare: scierò)
      return st + 'er';
    }
    return inf.slice(0, -1);                                                       // crederò, dormirò
  }
  function ppReg(inf, c) {
    var st = inf.slice(0, -3);
    return st + (c === 'are' ? 'ato' : c === 'ere' ? 'uto' : 'ito');
  }
  // Past participle (masc. sg). v: {it, pp?}
  function pastPart(v) {
    if (v.pp) return v.pp;
    var inf = v.it, r = irrOf(inf);
    if (r && r.d && r.d.pp) return r.pre + r.d.pp;
    if (PP[inf]) return PP[inf];
    if (FAM_OF[inf] && PP[FAM_OF[inf]]) return inf.slice(0, inf.length - FAM_OF[inf].length) + PP[FAM_OF[inf]];
    return ppReg(inf, cls(inf));
  }
  function ppAgree(pp, g, n) { var st = pp.slice(0, -1); return st + (g === 'f' ? (n === 'p' ? 'e' : 'a') : (n === 'p' ? 'i' : 'o')); }
  function ppForms(pp) { return [pp, ppAgree(pp, 'f', 's'), ppAgree(pp, 'm', 'p'), ppAgree(pp, 'f', 'p')]; }

  // v: {it, conj:'are'|'ere'|'ire'|'isc', aux:'a'|'e'|'a/e', pp?}
  function present(v) {
    var r = irrOf(v.it);
    if (r && r.d && r.d.pres) return r.d.pres.map(function (f, i) {
      // a prefix keeps the written accent only where the base needs it to stay distinct: rifà, ridà (but soddisfa)
      if (r.pre && i === 2 && (r.base === 'fare' || r.base === 'dare') && !/^(soddis|dis|stra|contraf|lique)/.test(r.pre)) return r.pre + f.replace(/a$/, 'à');
      return r.pre + f;
    });
    var c = cls(v.it), isc = v.conj === 'isc';
    return regPres(v.it, c, isc);
  }
  function imperfect(v) {
    var r = irrOf(v.it), c = cls(v.it);
    if (r && r.d && r.d.imp) {
      if (Array.isArray(r.d.imp)) return r.d.imp.map(function (f) { return r.pre + f; });
      return END.imp[r.d.impc].map(function (e) { return r.pre + r.d.imp + e; });
    }
    var st = v.it.slice(0, -3);
    return END.imp[c].map(function (e) { return st + e; });
  }
  function future(v) {
    var r = irrOf(v.it), stem;
    if (r && r.d && r.d.fut) stem = r.pre + r.d.fut; else stem = futStem(v.it, cls(v.it));
    return END.fut.map(function (e) { return stem + e; });
  }
  var AVERE_PRES = IRR.avere.pres, ESSERE_PRES = IRR.essere.pres;
  // Passato prossimo for person index i (0..5). g: subject gender for essere verbs ('m'|'f').
  // aux: 'a' or 'e' (for 'a/e' verbs pass the one wanted). Returns "sono andata" etc.
  function passato(v, i, g, aux) {
    aux = aux || (v.aux === 'e' ? 'e' : 'a');
    var pp = pastPart(v);
    if (aux === 'e') return ESSERE_PRES[i] + ' ' + ppAgree(pp, g || 'm', i >= 3 ? 'p' : 's');
    return AVERE_PRES[i] + ' ' + pp;
  }
  function tense(v, t) {
    if (t === 'pres') return present(v);
    if (t === 'imp') return imperfect(v);
    if (t === 'fut') return future(v);
    if (t === 'pp') return [0, 1, 2, 3, 4, 5].map(function (i) { return passato(v, i, 'm'); });
    throw new Error('tense ' + t);
  }
  function isIrregular(v) { return !!irrOf(v.it) || !!PP[v.it] || (FAM_OF[v.it] && !!PP[FAM_OF[v.it]]); }

  // Strip accents/apostrophe variants for lenient comparison; strict equality otherwise.
  function norm(s) { return lower(s).trim().replace(/[’`´]/g, "'").replace(/\s+/g, ' '); }
  function deaccent(s) { return norm(s).normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

  return {
    onset: onset, defArt: defArt, indefArt: indefArt, withArt: withArt,
    nounPlural: nounPlural, pluralRule: pluralRule, adjForms: adjForms, adjAgree: adjAgree,
    present: present, imperfect: imperfect, future: future, pastPart: pastPart, ppAgree: ppAgree, ppForms: ppForms,
    passato: passato, tense: tense, isIrregular: isIrregular, irrOf: irrOf, cls: cls,
    PERSONS: P, SUBJ: ['io', 'tu', 'lui/lei', 'noi', 'voi', 'loro'], norm: norm, deaccent: deaccent,
    _IRR: IRR, _PP: PP, _NPL: NPL
  };
});
