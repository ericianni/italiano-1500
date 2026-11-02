/* Italiano 1500 — Learn lessons (about 5-10 minutes each). Prose lives here; every table is generated
   by the morphology engine (lang/it/morph.js) when the lesson opens, so tables and drills always agree.
   tables: {t:'verbs', vs:[...], tense}  {t:'nouns', list:[[it,g],...]}  {t:'art'} {t:'indef'} {t:'prep'}
           {t:'adj', list:[...]}  {t:'pp', list:[...]}  {t:'rows', title, head:[...], rows:[[...]]}
   quiz:   {t:'mc', qs:[[question, [options], answerIndex]]} and/or {t:'drill', re} (typed drill questions)
   drill:  {re, title}: "Practice this in Drills" starts a set limited to combos matching re. */
(function (root) {
  'use strict';
  const L = [
    { id: 'l-sounds', sec: 'Getting started', title: 'Sounds and spelling', sum: 'C and G, double letters, stress, and accent marks.',
      body: `<p>Italian is spelled almost exactly as it sounds. A few letter pairs do most of the work:</p>
      <ul><li><b>c</b> and <b>g</b> are soft before <b>e, i</b>: <i lang="it">cena</i> (“CHEH-na”), <i lang="it">gelato</i> (“jeh-LAH-toh”), and hard elsewhere: <i lang="it">casa, gatto</i>.</li>
      <li>An <b>h</b> keeps them hard before e, i: <i lang="it">che</i> (“keh”), <i lang="it">chiave</i>, <i lang="it">spaghetti</i>. An <b>i</b> makes them soft before a, o, u: <i lang="it">ciao, giorno</i> (the i isn’t sounded).</li>
      <li><b>sc</b> before e, i sounds like English <i>sh</i>: <i lang="it">scena, uscire</i>. <b>gn</b> is like the <i>ny</i> in canyon: <i lang="it">bagno</i>. <b>gli</b> is close to the <i>lli</i> in million: <i lang="it">figlio</i>.</li>
      <li><b>z</b> is “ts” or “dz”: <i lang="it">pizza, zero</i>. <b>h</b> alone is silent: <i lang="it">ho, hai, ha, hanno</i>.</li>
      <li><b>Double consonants</b> are held a little longer, and they change meaning: <i lang="it">pala</i> (shovel) / <i lang="it">palla</i> (ball), <i lang="it">caro</i> (dear) / <i lang="it">carro</i> (cart).</li></ul>
      <p><b>Stress</b> usually falls on the next-to-last syllable: <i lang="it">ra-GAZ-zo, par-LA-re</i>. When the <b>last</b> vowel is stressed, Italian writes an accent: <i lang="it">città, perché, così, però, più</i>. Most are grave (à è ì ò ù); <b>é</b> (closed e) appears in <i lang="it">perché, né, poiché</i>. Accents matter: <i lang="it">è</i> = is, <i lang="it">e</i> = and; <i lang="it">dà</i> = gives, <i lang="it">da</i> = from.</p>
      <p class="small muted">This app checks accents strictly in typed answers: use the à è é ì ò ù keys under the answer box.</p>`,
      tables: [{ t: 'rows', title: 'Letter pairs', head: ['Spelling', 'Sound', 'Example'], rows: [['ca co cu / ga go gu', 'hard k / g', 'casa, gonna'], ['ce ci / ge gi', 'ch / j', 'cena, cinema, gente, giro'], ['che chi / ghe ghi', 'hard k / g', 'perché, chiesa, spaghetti'], ['cia cio ciu / gia gio giu', 'ch / j + vowel', 'ciao, giorno, giusto'], ['sce sci', 'sh', 'scena, sciare'], ['gn', 'ny', 'bagno, sogno'], ['gli', 'lly', 'figlio, moglie']] }],
      quiz: { t: 'mc', qs: [['How is the c in <i lang="it">cena</i> pronounced?', ['like k', 'like ch in cheese', 'like s'], 1], ['Which word has a hard g (as in go)?', ['gelato', 'giorno', 'spaghetti'], 2], ['What does <i lang="it">è</i> mean (with the accent)?', ['and', 'is', 'from'], 1], ['Where is the stress in <i lang="it">parlare</i>?', ['PAR-la-re', 'par-LA-re', 'par-la-RE'], 1], ['Which pair differs only by a double consonant?', ['pala / palla', 'casa / cosa', 'pane / cane'], 0]] } },

    { id: 'l-nouns', sec: 'Nouns and articles', title: 'Nouns: gender and plural', sum: 'Masculine or feminine, and how the ending changes in the plural.',
      body: `<p>Every Italian noun is <b>masculine</b> or <b>feminine</b>. The ending is a strong hint:</p>
      <ul><li><b>-o</b> is almost always masculine: <i lang="it">il libro</i>. Exceptions: <i lang="it">la mano</i>, and short forms like <i lang="it">la foto, la radio, l’auto</i>.</li>
      <li><b>-a</b> is usually feminine: <i lang="it">la casa</i>. Many words from Greek in <b>-ma</b> are masculine: <i lang="it">il problema, il sistema, il programma</i>.</li>
      <li><b>-e</b> can be either: <i lang="it">il padre, la madre, il cane, la notte</i>. Learn these with their article.</li>
      <li><b>-zione, -tà, -tù</b> are feminine (<i lang="it">la stazione, la città</i>); <b>-ore</b> is masculine (<i lang="it">il dottore</i>).</li></ul>
      <p><b>Plural:</b> -o → <b>-i</b>, -a → <b>-e</b> (feminine) or <b>-i</b> (masculine: <i lang="it">problemi</i>), -e → <b>-i</b>.</p>
      <p><b>Invariable</b> (same in the plural): words ending in an accented vowel (<i lang="it">città</i>), a consonant (<i lang="it">film, bar, computer</i>), <b>-i</b> or <b>-ie</b> (<i lang="it">crisi, serie</i>), and shortened words (<i lang="it">foto, auto, cinema</i>). Only the article shows the number: <i lang="it">la città → le città</i>.</p>
      <p><b>Spelling changes:</b></p><ul>
      <li><b>-ca, -ga</b> → <b>-che, -ghe</b> (keeps the hard sound): <i lang="it">amica → amiche</i>.</li>
      <li><b>-co, -go</b> → <b>-chi, -ghi</b> when the stress is on the next-to-last syllable (<i lang="it">parco → parchi, lago → laghi</i>), but usually <b>-ci, -gi</b> when it falls earlier (<i lang="it">medico → medici</i>). Learn <i lang="it">amico → amici, nemico → nemici</i> as exceptions.</li>
      <li><b>-cia, -gia</b> (unstressed i): <b>-ce, -ge</b> after a consonant (<i lang="it">arancia → arance, spiaggia → spiagge</i>), <b>-cie, -gie</b> after a vowel (<i lang="it">camicia → camicie</i>).</li>
      <li><b>-io</b> → <b>-i</b> (<i lang="it">figlio → figli</i>), but <b>-ii</b> when the i is stressed (<i lang="it">zio → zii</i>).</li></ul>
      <p><b>Irregular:</b> <i lang="it">l’uomo → gli uomini</i>, <i lang="it">il dio → gli dei</i>, <i lang="it">la mano → le mani</i>. Some body parts and a few others switch to feminine <b>-a</b>: <i lang="it">l’uovo → le uova, il braccio → le braccia, il dito → le dita, l’osso → le ossa</i>.</p>`,
      tables: [{ t: 'nouns', title: 'Regular', list: [['libro', 'm'], ['casa', 'f'], ['padre', 'm'], ['notte', 'f'], ['problema', 'm']] },
        { t: 'nouns', title: 'Invariable', list: [['città', 'f'], ['film', 'm'], ['crisi', 'f'], ['foto', 'f']] },
        { t: 'nouns', title: 'Spelling changes', list: [['amica', 'f'], ['parco', 'm'], ['lago', 'm'], ['medico', 'm'], ['amico', 'm'], ['arancia', 'f'], ['camicia', 'f'], ['figlio', 'm'], ['zio', 'm']] },
        { t: 'nouns', title: 'Irregular', list: [['uomo', 'm'], ['mano', 'f'], ['uovo', 'm'], ['braccio', 'm'], ['dito', 'm']] }],
      quiz: { t: 'drill', re: '^art\\|def\\.[mf]\\.p' }, drill: { re: '^art\\|def\\.[mf]\\.p', title: 'Plural nouns with the article' } },

    { id: 'l-def', sec: 'Nouns and articles', title: 'The definite article (the)', sum: 'il, lo, l’, la, i, gli, le: which one and why.',
      body: `<p>“The” has seven forms. Pick by <b>gender</b>, <b>number</b>, and the <b>first sound of the next word</b>:</p>
      <ul><li><b>il / i</b>: masculine before most consonants: <i lang="it">il libro → i libri</i>.</li>
      <li><b>lo / gli</b>: masculine before <b>s + consonant</b>, <b>z</b>, <b>gn</b>, <b>ps</b>, <b>x</b>, <b>y</b> (and i + vowel): <i lang="it">lo studente → gli studenti, lo zio → gli zii, lo psicologo</i>.</li>
      <li><b>l’ / gli</b>: masculine before a vowel: <i lang="it">l’amico → gli amici, l’uomo → gli uomini</i>.</li>
      <li><b>la / le</b>: feminine before a consonant; <b>l’ / le</b> before a vowel: <i lang="it">la casa → le case, l’amica → le amiche</i>.</li></ul>
      <p>The article goes with the word right after it, which isn’t always the noun: <i lang="it">lo stesso giorno</i>, <i lang="it">l’ultima volta</i>. A silent h counts as a vowel: <i lang="it">l’hotel, gli hotel</i>.</p>
      <p>Italian uses the article more than English: with general nouns (<i lang="it">il vino è buono</i> = wine is good), with possessives (<i lang="it">la mia casa</i>) and with titles (<i lang="it">il dottor Rossi</i>). One fixed exception: <i lang="it">il dio → gli dei</i>.</p>`,
      tables: [{ t: 'art' }],
      quiz: { t: 'drill', re: '^art\\|def' }, drill: { re: '^art\\|def', title: 'Definite articles' } },

    { id: 'l-indef', sec: 'Nouns and articles', title: 'A / an, and of the, in the, to the', sum: 'un, uno, una, un’, plus del, nel, al and friends.',
      body: `<p>“A / an” has four forms, chosen like the definite article:</p>
      <ul><li><b>un</b>: masculine before a consonant <b>or a vowel</b>: <i lang="it">un libro, un amico</i>. Never an apostrophe here.</li>
      <li><b>uno</b>: masculine before s + consonant, z, gn, ps, x, y: <i lang="it">uno studente, uno zaino</i>.</li>
      <li><b>una</b>: feminine before a consonant: <i lang="it">una casa</i>. <b>un’</b>: feminine before a vowel: <i lang="it">un’amica, un’idea</i>.</li></ul>
      <p>The apostrophe tells you the gender: <i lang="it">un amico</i> (a male friend), <i lang="it">un’amica</i> (a female friend).</p>
      <p><b>Prepositions + the.</b> <i lang="it">di, a, da, in, su</i> merge with the definite article: <i lang="it">di + il = del</i>, <i lang="it">a + la = alla</i>, <i lang="it">in + gli = negli</i>. You’ll see them constantly: <i lang="it">vado al cinema, la casa del medico, nella stanza</i>. <i lang="it">con</i> and <i lang="it">per</i> stay separate in modern Italian (<i lang="it">con il, per la</i>).</p>`,
      tables: [{ t: 'indef' }, { t: 'prep' }],
      quiz: { t: 'drill', re: '^art\\|ind' }, drill: { re: '^art\\|ind', title: 'Indefinite articles' } },

    { id: 'l-adj', sec: 'Nouns and articles', title: 'Adjectives and agreement', sum: 'Matching gender and number: nuovo, nuova, nuovi, nuove.',
      body: `<p>Adjectives agree with their noun in gender and number, and usually come <b>after</b> it: <i lang="it">una casa nuova, i libri vecchi</i>.</p>
      <ul><li><b>-o adjectives</b> have four forms: <i lang="it">nuovo, nuova, nuovi, nuove</i>.</li>
      <li><b>-e adjectives</b> have two: <i lang="it">grande</i> (singular), <i lang="it">grandi</i> (plural), for both genders.</li>
      <li><b>Spelling changes</b> follow the noun rules: <i lang="it">bianco → bianchi, bianche</i>; <i lang="it">lungo → lunghi, lunghe</i>; but <i lang="it">simpatico, pubblico → pubblici, pubbliche</i>; <i lang="it">vecchio → vecchi</i>, <i lang="it">serio → seri</i>.</li>
      <li>A few never change: <i lang="it">blu, rosa, viola</i> (<i lang="it">le case blu</i>), and <i lang="it">qualsiasi</i>.</li></ul>
      <p>Agreement follows the noun’s real gender, even when the ending looks “wrong”: <i lang="it">il problema serio, la mano fredda</i>, and <i lang="it">le uova fresche</i> (feminine plural!). A mixed group takes the masculine plural: <i lang="it">un ragazzo e una ragazza simpatici</i>.</p>
      <p><b>Before the noun.</b> A few common adjectives normally come first: <i lang="it">stesso, primo, ultimo, prossimo, solito</i> (<i lang="it">la prossima volta</i>). Then the article agrees with the adjective’s first sound: <i lang="it">lo stesso uomo</i>. <i lang="it">bello, buono, grande</i> also go before nouns, with shortened forms (<i lang="it">un bel film, un buon vino, un gran giorno</i>); the drills keep them after the noun, where they’re regular.</p>`,
      tables: [{ t: 'adj', list: ['nuovo', 'grande', 'bianco', 'pubblico', 'vecchio', 'blu'] }],
      quiz: { t: 'drill', re: '^agr' }, drill: { re: '^agr', title: 'Adjective agreement' } },

    { id: 'l-pres', sec: 'Verbs', title: 'Present tense: regular verbs', sum: '-are, -ere, -ire and -isc- verbs, plus spelling rules.',
      body: `<p>Italian verbs fall into three groups by their infinitive: <b>-are</b> (<i lang="it">parlare</i>), <b>-ere</b> (<i lang="it">credere</i>), <b>-ire</b> (<i lang="it">dormire</i>). Drop the ending and add the person endings below.</p>
      <p>Subject pronouns (<i lang="it">io, tu, lui/lei, noi, voi, loro</i>) are usually left out, since the ending already shows the person: <i lang="it">parlo italiano</i> = I speak Italian. The polite “you”, <b>Lei</b>, uses the lui/lei form: <i lang="it">Lei parla inglese?</i></p>
      <p><b>-isc- verbs.</b> Many -ire verbs add <b>-isc-</b> in every form except noi and voi: <i lang="it">capisco, capisci, capisce, capiamo, capite, capiscono</i>. Others don’t (<i lang="it">dormire, partire, sentire, aprire</i>), so learn which: the Words tab marks them.</p>
      <p><b>Spelling rules</b> keep the sound of the stem:</p><ul>
      <li><b>-care, -gare</b> add an h before i: <i lang="it">cerchi, cerchiamo; paghi, paghiamo</i>.</li>
      <li><b>-ciare, -giare, -iare</b> don’t double the i: <i lang="it">cominci, mangi, studi</i> (not <i>mangii</i>). When the i is stressed it stays: <i lang="it">invio → invii</i>.</li></ul>
      <p>The present also covers “I am speaking” and the near future: <i lang="it">domani parto</i> = I’m leaving tomorrow.</p>`,
      tables: [{ t: 'verbs', vs: ['parlare', 'credere', 'dormire', 'capire'], tense: 'pres' }, { t: 'verbs', vs: ['cercare', 'pagare', 'cominciare', 'mangiare', 'studiare'], tense: 'pres', title: 'Spelling changes' }],
      quiz: { t: 'drill', re: '^v(are|ere|ire|isc)\\|pres' }, drill: { re: '^v(are|ere|ire|isc)\\|pres', title: 'Present tense, regular verbs' } },

    { id: 'l-irr', sec: 'Verbs', title: 'Irregular verbs in the present', sum: 'essere, avere, fare, andare and the other everyday irregulars.',
      body: `<p>The most common verbs are irregular. They’re worth learning by heart, since you’ll use them in every sentence, and two of them (<i lang="it">avere, essere</i>) build the passato prossimo.</p>
      <ul><li><b>essere</b> (to be) and <b>avere</b> (to have). The h of <i lang="it">ho, hai, ha, hanno</i> is silent; it tells them apart from <i lang="it">o</i> (or), <i lang="it">ai</i> (to the), <i lang="it">a</i> (to), <i lang="it">anno</i> (year).</li>
      <li><b>fare, andare, stare, dare</b> look like -are verbs but change their stem. <i lang="it">dà</i> (gives) has an accent; <i lang="it">da</i> (from) doesn’t.</li>
      <li><b>potere, volere, dovere</b> (can, want, must) are usually followed by an infinitive: <i lang="it">posso venire?</i></li>
      <li><b>sapere</b> = to know a fact or how to do something (<i lang="it">so nuotare</i>); <i lang="it">conoscere</i> (regular) = to know a person or place.</li>
      <li>Many add a <b>-g-</b> in the io and loro forms: <i lang="it">vengo, vengono; tengo; rimango; salgo; scelgo</i>.</li></ul>
      <p>Verbs built on these conjugate the same way: <i lang="it">ottenere, mantenere</i> like <i lang="it">tenere</i>; <i lang="it">riuscire</i> like <i lang="it">uscire</i>; <i lang="it">tradurre, produrre</i> (<i lang="it">traduco, produco</i>).</p>`,
      tables: [{ t: 'verbs', vs: ['essere', 'avere', 'fare', 'andare'], tense: 'pres' }, { t: 'verbs', vs: ['stare', 'dare', 'dire', 'venire'], tense: 'pres' }, { t: 'verbs', vs: ['potere', 'volere', 'dovere', 'sapere'], tense: 'pres' }, { t: 'verbs', vs: ['uscire', 'bere', 'tenere', 'rimanere'], tense: 'pres' }],
      quiz: { t: 'drill', re: '^virr\\|pres' }, drill: { re: '^virr\\|pres', title: 'Irregular present' } },

    { id: 'l-pp', sec: 'Verbs', title: 'Passato prossimo with avere', sum: 'The everyday past tense: ho parlato, ho fatto.',
      body: `<p>The <b>passato prossimo</b> is the normal way to say what happened: <i lang="it">ho mangiato</i> = I ate / I have eaten. It has two parts: the present of <b>avere</b> (or <b>essere</b>, next lesson) + the <b>past participle</b>.</p>
      <p><b>Regular participles:</b> -are → <b>-ato</b> (<i lang="it">parlato</i>), -ere → <b>-uto</b> (<i lang="it">creduto</i>), -ire → <b>-ito</b> (<i lang="it">dormito, finito</i>).</p>
      <p><b>Irregular participles</b> are common, especially for -ere verbs. Learn the most frequent ones in the table below.</p>
      <p>Most verbs take <b>avere</b>: every verb with a direct object (<i lang="it">ho letto il libro</i>) and many without one (<i lang="it">ho dormito, ho lavorato, ho riso</i>). With avere the participle <b>doesn’t change</b> for the subject: <i lang="it">Maria ha mangiato, loro hanno mangiato</i>.</p>
      <p class="small muted">Later on: with avere, the participle does agree with a direct-object pronoun before it (<i lang="it">l’ho vista</i> = I saw her). The drills don’t test this yet.</p>`,
      tables: [{ t: 'verbs', vs: ['parlare', 'credere', 'dormire', 'fare'], tense: 'pp' }, { t: 'pp', list: ['fare', 'dire', 'vedere', 'prendere', 'mettere', 'scrivere', 'leggere', 'aprire', 'chiudere', 'chiedere', 'rispondere', 'perdere', 'vincere', 'rompere', 'decidere', 'scegliere', 'bere', 'vivere', 'offrire', 'scoprire', 'piangere', 'ridere', 'spendere', 'uccidere'] }],
      quiz: { t: 'drill', re: '\\|pp\\.' }, drill: { re: '\\|pp\\.', title: 'Passato prossimo' } },

    { id: 'l-ppe', sec: 'Verbs', title: 'Passato prossimo with essere', sum: 'sono andato / andata: motion, change, and agreement.',
      body: `<p>Some verbs build the passato prossimo with <b>essere</b>. Most are about <b>motion</b>, <b>change of state</b>, or <b>staying</b>, and they don’t take a direct object:</p>
      <ul><li>motion: <i lang="it">andare, venire, arrivare, partire, entrare, uscire, tornare, cadere</i></li>
      <li>change: <i lang="it">diventare, nascere, morire, succedere</i></li>
      <li>staying and being: <i lang="it">essere, stare, restare, rimanere</i></li>
      <li>“it pleases / seems / is enough” verbs: <i lang="it">piacere, sembrare, bastare, costare, durare</i></li></ul>
      <p>With essere the participle <b>agrees with the subject</b>, like an adjective: <i lang="it">Marco è andato, Anna è andata, siamo andati</i> (a mixed or all-male group), <i lang="it">siamo andate</i> (all women). In the drills, <b>(f)</b> or <b>lei</b> tells you the subject is female.</p>
      <p><b>Both auxiliaries.</b> Verbs like <i lang="it">finire, cominciare, passare, cambiare, correre, salire, scendere</i> take <b>avere</b> with an object and <b>essere</b> without one: <i lang="it">ho finito il libro</i> / <i lang="it">il film è finito</i>. The drills accept either for these.</p>
      <p>Reflexive verbs (<i lang="it">alzarsi → mi sono alzato</i>) always take essere; they’ll get their own drills later.</p>`,
      tables: [{ t: 'verbs', vs: ['andare', 'venire', 'essere', 'nascere'], tense: 'pp', g: 'f', title: 'With essere (female subject)' }],
      quiz: { t: 'mc', qs: [['Which auxiliary does <i lang="it">arrivare</i> take?', ['avere', 'essere'], 1], ['Anna (to go, passato prossimo):', ['Anna ha andato', 'Anna è andato', 'Anna è andata'], 2], ['I read the book:', ['Ho letto il libro', 'Sono letto il libro', 'Ho letta il libro'], 0]], also: '\\|pp\\.' },
      drill: { re: '\\|pp\\.', title: 'Passato prossimo' } },

    { id: 'l-imp', sec: 'Verbs', title: 'The imperfetto', sum: 'Used to, was doing: the background past.',
      body: `<p>The <b>imperfetto</b> describes the past as ongoing or habitual: what <i>was happening</i>, what <i>used to</i> happen, and what things <i>were like</i>.</p>
      <p>It’s the most regular tense: take the infinitive, drop <b>-re</b>, and add <b>-vo, -vi, -va, -vamo, -vate, -vano</b>: <i lang="it">parla-vo, crede-vo, dormi-vo</i>. -isc- verbs don’t add -isc-: <i lang="it">capivo</i>.</p>
      <p>Only a handful are irregular: <b>essere</b> (<i lang="it">ero, eri, era…</i>), and verbs that use an older, longer stem: <i lang="it">fare → facevo, dire → dicevo, bere → bevevo, tradurre → traducevo, porre → ponevo</i>.</p>
      <p><b>Imperfetto or passato prossimo?</b></p><ul>
      <li>Habit: <i lang="it">da bambino giocavo a calcio</i> (as a kid I used to play soccer) vs. one event: <i lang="it">ieri ho giocato a calcio</i>.</li>
      <li>Background vs. event: <i lang="it">mentre leggevo, Marco è arrivato</i> (I was reading when Marco arrived).</li>
      <li>Descriptions, age, time, weather, feelings: <i lang="it">era tardi, avevo vent’anni, faceva freddo, ero stanco</i>.</li></ul>`,
      tables: [{ t: 'verbs', vs: ['parlare', 'credere', 'dormire', 'capire'], tense: 'imp' }, { t: 'verbs', vs: ['essere', 'fare', 'dire', 'bere'], tense: 'imp', title: 'Irregular' }],
      quiz: { t: 'drill', re: '\\|imp\\.' }, drill: { re: '\\|imp\\.', title: 'Imperfetto' } },

    { id: 'l-fut', sec: 'Verbs', title: 'The future', sum: 'parlerò, sarò, andrò: endings and short stems.',
      body: `<p>The future uses one set of endings for every verb: <b>-ò, -ai, -à, -emo, -ete, -anno</b>, added to the infinitive minus its final <b>-e</b>.</p>
      <ul><li>-are verbs change the a to <b>e</b>: <i lang="it">parlare → parlerò</i>.</li>
      <li>-care, -gare add an h: <i lang="it">cercherò, pagherò</i>. -ciare, -giare drop the i: <i lang="it">comincerò, mangerò</i>.</li>
      <li>-ere and -ire just drop the e: <i lang="it">crederò, dormirò, capirò</i>.</li></ul>
      <p><b>Short stems.</b> Some verbs lose a vowel: <i lang="it">andare → andrò, avere → avrò, dovere → dovrò, potere → potrò, sapere → saprò, vedere → vedrò, vivere → vivrò</i>. Others double the r: <i lang="it">venire → verrò, volere → vorrò, tenere → terrò, rimanere → rimarrò, bere → berrò</i>. And <i lang="it">essere → sarò; fare, dare, stare → farò, darò, starò</i>.</p>
      <p>Italians often use the present for plans (<i lang="it">domani vado a Roma</i>). The future also guesses about now: <i lang="it">saranno le tre</i> = it must be about three.</p>`,
      tables: [{ t: 'verbs', vs: ['parlare', 'credere', 'cercare', 'mangiare'], tense: 'fut' }, { t: 'verbs', vs: ['essere', 'avere', 'andare', 'venire'], tense: 'fut', title: 'Irregular stems' }],
      quiz: { t: 'drill', re: '\\|fut\\.' }, drill: { re: '\\|fut\\.', title: 'Future' } },
  ];
  root.LESSONS = L;
  if (typeof module === 'object' && module.exports) module.exports = L;
})(typeof self !== 'undefined' ? self : this);
