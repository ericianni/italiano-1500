/* Hand-tagged lexicon for the rule-based sentence engine. Everyday spoken Italian for a trip to Rome.
   Only these lemmas are used. Semantic tags keep subjects, objects and adjectives from colliding
   ("the train eats", "the boy is open"). Helpers (articles, prepositions, essere/avere/stare,
   subject pronouns, non, e, ma, ci) are not listed here; the engine always allows them.
   No model output: this file is data. */
(function (root, factory) {
  const L = factory();
  if (typeof module === 'object' && module.exports) module.exports = L;
  else root.ItSentLex = L;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // sem: one or more of these. cls is the primary class (glosses and a few subject checks).
  // person, animal, place, building, vehicle, food, drink, object, tool, water, time, abstract, text.
  // kin: 'sg' singular kinship (mia madre, no article); 'pl' also natural in the plural (i miei fratelli).
  // mass: no plural, no "a" (unless cup). cup: a coffee / some coffee / the coffee.
  // tags are narrow properties no single class can name (open, free, fill, book, pay, drive, cook, high).
  const classes = ['person', 'animal', 'place', 'building', 'vehicle', 'food', 'drink', 'object', 'tool', 'water', 'time', 'abstract', 'text'];
  const narrow = ['open', 'free', 'fill', 'book', 'pay', 'drive', 'cook', 'high', 'hand', 'long'];
  const nouns = [
    { it: 'ragazzo', cls: 'person', sem: ['person'], en: 'boy', alts: ['guy', 'boyfriend'] },
    { it: 'ragazza', cls: 'person', sem: ['person'], en: 'girl', alts: ['girlfriend'] },
    { it: 'uomo', cls: 'person', sem: ['person'], en: 'man', alts: ['guy'], noposs: true },
    { it: 'donna', cls: 'person', sem: ['person'], en: 'woman', noposs: true },
    { it: 'bambino', cls: 'person', sem: ['person'], en: 'child', alts: ['little boy'] },
    { it: 'padre', cls: 'person', sem: ['person'], en: 'father', alts: ['dad'], kin: 'sg' },
    { it: 'madre', cls: 'person', sem: ['person'], en: 'mother', alts: ['mom'], kin: 'sg' },
    { it: 'fratello', cls: 'person', sem: ['person'], en: 'brother', kin: 'pl' },
    { it: 'sorella', cls: 'person', sem: ['person'], en: 'sister', kin: 'pl' },
    { it: 'figlio', cls: 'person', sem: ['person'], en: 'son', kin: 'pl' },
    { it: 'figlia', cls: 'person', sem: ['person'], en: 'daughter', kin: 'pl' },
    { it: 'zio', cls: 'person', sem: ['person'], en: 'uncle', kin: 'pl' },
    { it: 'zia', cls: 'person', sem: ['person'], en: 'aunt', kin: 'pl' },
    { it: 'nonno', cls: 'person', sem: ['person'], en: 'grandfather', kin: 'pl' },
    { it: 'nonna', cls: 'person', sem: ['person'], en: 'grandmother', kin: 'pl' },
    { it: 'marito', cls: 'person', sem: ['person'], en: 'husband', kin: 'sg' },
    { it: 'moglie', cls: 'person', sem: ['person'], en: 'wife', kin: 'sg' },
    { it: 'amico', cls: 'person', sem: ['person'], en: 'friend' },
    { it: 'cameriere', cls: 'person', sem: ['person'], en: 'waiter' },
    { it: 'studente', cls: 'person', sem: ['person'], en: 'student' },
    { it: 'medico', cls: 'person', sem: ['person'], en: 'physician', alts: ['doctor'] },
    { it: 'dottore', cls: 'person', sem: ['person'], en: 'doctor' },
    { it: 'professore', cls: 'person', sem: ['person'], en: 'professor', alts: ['teacher'] },
    { it: 'insegnante', cls: 'person', sem: ['person'], en: 'teacher' },
    { it: 'signore', cls: 'person', sem: ['person'], en: 'man', alts: ['gentleman'], noposs: true },
    { it: 'signora', cls: 'person', sem: ['person'], en: 'woman', alts: ['lady'], noposs: true },
    { it: 'cliente', cls: 'person', sem: ['person'], en: 'customer' },
    { it: 'persona', cls: 'person', sem: ['person'], en: 'person', noposs: true },
    { it: 'cane', cls: 'animal', sem: ['animal'], en: 'dog' },
    { it: 'gatto', cls: 'animal', sem: ['animal'], en: 'cat' },

    { it: 'treno', cls: 'vehicle', sem: ['vehicle'], en: 'train' },
    { it: 'autobus', cls: 'vehicle', sem: ['vehicle'], en: 'bus' },
    { it: 'taxi', cls: 'vehicle', sem: ['vehicle'], en: 'taxi', tags: ['drive'] },
    { it: 'aereo', cls: 'vehicle', sem: ['vehicle'], en: 'plane', alts: ['airplane'] },
    { it: 'macchina', cls: 'vehicle', sem: ['vehicle'], en: 'car', tags: ['drive'] },
    { it: 'auto', cls: 'vehicle', sem: ['vehicle'], en: 'car', tags: ['drive'] },

    { it: 'casa', cls: 'building', sem: ['building'], en: 'house', alts: ['home'], tags: ['open'] },
    { it: 'scuola', cls: 'building', sem: ['building'], en: 'school' },
    { it: 'città', cls: 'place', sem: ['place'], en: 'city', alts: ['town'] },
    { it: 'stazione', cls: 'building', sem: ['building'], en: 'station', tags: ['open'], noposs: true },
    { it: 'aeroporto', cls: 'building', sem: ['building'], en: 'airport', tags: ['open'], noposs: true },
    { it: 'albergo', cls: 'building', sem: ['building'], en: 'hotel', tags: ['open', 'book'] },
    { it: 'hotel', cls: 'building', sem: ['building'], en: 'hotel', tags: ['open', 'book'] },
    { it: 'museo', cls: 'building', sem: ['building'], en: 'museum', tags: ['open'], noposs: true },
    { it: 'chiesa', cls: 'building', sem: ['building'], en: 'church', tags: ['open'], noposs: true },
    { it: 'piazza', cls: 'place', sem: ['place'], en: 'square', alts: ['plaza'], tags: ['fill'] },
    { it: 'strada', cls: 'place', sem: ['place'], en: 'street', alts: ['road'], tags: ['long'] },
    { it: 'mercato', cls: 'place', sem: ['place'], en: 'market' },
    { it: 'negozio', cls: 'building', sem: ['building'], en: 'store', alts: ['shop'], tags: ['open'] },
    { it: 'ristorante', cls: 'building', sem: ['building'], en: 'restaurant', tags: ['open', 'book', 'fill'] },
    { it: 'bar', cls: 'building', sem: ['building'], en: 'café', alts: ['bar'], tags: ['open'] },
    { it: 'ufficio', cls: 'building', sem: ['building'], en: 'office', tags: ['open'] },
    { it: 'banca', cls: 'building', sem: ['building'], en: 'bank', tags: ['open'], noposs: true },
    { it: 'ospedale', cls: 'building', sem: ['building'], en: 'hospital', tags: ['open'], noposs: true },
    { it: 'parco', cls: 'place', sem: ['place'], en: 'park', tags: ['fill'] },
    { it: 'giardino', cls: 'place', sem: ['place'], en: 'garden' },
    { it: 'spiaggia', cls: 'place', sem: ['place'], en: 'beach' },
    { it: 'cucina', cls: 'building', sem: ['building'], en: 'kitchen', tags: ['open'] },
    { it: 'camera', cls: 'building', sem: ['building'], en: 'room', alts: ['bedroom'], tags: ['open', 'free', 'book'] },
    { it: 'bagno', cls: 'building', sem: ['building'], en: 'bathroom', tags: ['open', 'free', 'fill'] },
    { it: 'centro', cls: 'place', sem: ['place'], en: 'center' },
    { it: 'isola', cls: 'place', sem: ['place'], en: 'island' },
    { it: 'lago', cls: 'water', sem: ['water'], en: 'lake' },
    { it: 'montagna', cls: 'place', sem: ['place'], en: 'mountain', tags: ['high'] },
    { it: 'ponte', cls: 'place', sem: ['place'], en: 'bridge', tags: ['high', 'long'] },
    { it: 'fiume', cls: 'water', sem: ['water'], en: 'river' },
    { it: 'università', cls: 'building', sem: ['building'], en: 'university', tags: ['open'] },
    { it: 'palazzo', cls: 'building', sem: ['building'], en: 'palace', tags: ['high'] },
    { it: 'fermata', cls: 'place', sem: ['place'], en: 'stop' },
    { it: 'binario', cls: 'place', sem: ['place'], en: 'platform' },

    { it: 'libro', cls: 'object', sem: ['object', 'text'], en: 'book', tags: ['open'] },
    { it: 'chiave', cls: 'object', sem: ['object', 'tool'], en: 'key' },
    { it: 'telefono', cls: 'object', sem: ['object', 'tool'], en: 'phone' },
    { it: 'foto', cls: 'object', sem: ['object'], en: 'photo', tags: ['hand'] },
    { it: 'biglietto', cls: 'object', sem: ['object'], en: 'ticket', tags: ['book', 'pay', 'hand'] },
    { it: 'valigia', cls: 'object', sem: ['object'], en: 'suitcase', tags: ['hand'] },
    { it: 'passaporto', cls: 'object', sem: ['object'], en: 'passport', tags: ['hand'] },
    { it: 'documento', cls: 'object', sem: ['object', 'text'], en: 'document' },
    { it: 'conto', cls: 'abstract', sem: ['abstract'], en: 'bill', alts: ['check'], tags: ['pay'] },
    { it: 'prezzo', cls: 'abstract', sem: ['abstract'], en: 'price', tags: ['pay'] },
    { it: 'euro', cls: 'object', sem: ['object'], en: 'euro', tags: ['hand'] },
    { it: 'orologio', cls: 'object', sem: ['object', 'tool'], en: 'watch', alts: ['clock'] },
    { it: 'bicchiere', cls: 'object', sem: ['object'], en: 'glass', tags: ['fill', 'hand'] },
    { it: 'bottiglia', cls: 'object', sem: ['object'], en: 'bottle', tags: ['fill', 'open', 'hand'] },
    { it: 'lettera', cls: 'object', sem: ['object', 'text'], en: 'letter' },
    { it: 'viaggio', cls: 'time', sem: ['time', 'abstract'], en: 'trip', alts: ['journey'] },
    { it: 'posto', cls: 'object', sem: ['object'], en: 'seat', tags: ['free'] },
    { it: 'problema', cls: 'abstract', sem: ['abstract'], en: 'problem' },
    { it: 'idea', cls: 'abstract', sem: ['abstract'], en: 'idea' },
    { it: 'nome', cls: 'abstract', sem: ['abstract', 'text'], en: 'name' },
    { it: 'numero', cls: 'abstract', sem: ['abstract', 'text'], en: 'number' },
    { it: 'indirizzo', cls: 'abstract', sem: ['abstract', 'text'], en: 'address' },
    { it: 'appuntamento', cls: 'time', sem: ['time', 'abstract'], en: 'appointment' },
    { it: 'informazione', cls: 'abstract', sem: ['abstract'], en: 'information', mass: true },
    { it: 'giornale', cls: 'object', sem: ['object', 'text'], en: 'newspaper' },
    { it: 'film', cls: 'object', sem: ['object', 'time'], en: 'movie', alts: ['film'] },
    { it: 'lezione', cls: 'time', sem: ['time', 'abstract'], en: 'lesson', alts: ['class'] },
    { it: 'letto', cls: 'object', sem: ['object'], en: 'bed', tags: ['free'] },
    { it: 'tavolo', cls: 'object', sem: ['object'], en: 'table', tags: ['free', 'book', 'long'] },
    { it: 'sedia', cls: 'object', sem: ['object'], en: 'chair' },
    { it: 'finestra', cls: 'object', sem: ['object'], en: 'window', tags: ['open'] },
    { it: 'porta', cls: 'object', sem: ['object'], en: 'door', tags: ['open'] },
    { it: 'giorno', cls: 'time', sem: ['time'], en: 'day' },
    { it: 'notte', cls: 'time', sem: ['time'], en: 'night' },
    { it: 'scarpa', cls: 'object', sem: ['object'], en: 'shoe', tags: ['hand'] },

    { it: 'pizza', cls: 'food', sem: ['food'], en: 'pizza', tags: ['cook'] },
    { it: 'pasta', cls: 'food', sem: ['food'], en: 'pasta', mass: true, tags: ['cook'] },
    { it: 'pane', cls: 'food', sem: ['food'], en: 'bread', mass: true },
    { it: 'formaggio', cls: 'food', sem: ['food'], en: 'cheese', mass: true },
    { it: 'gelato', cls: 'food', sem: ['food'], en: 'ice cream', cup: true },
    { it: 'insalata', cls: 'food', sem: ['food'], en: 'salad' },
    { it: 'carne', cls: 'food', sem: ['food'], en: 'meat', mass: true, tags: ['cook'] },
    { it: 'pesce', cls: 'food', sem: ['food'], en: 'fish', tags: ['cook'] },
    { it: 'torta', cls: 'food', sem: ['food'], en: 'cake', tags: ['cook'] },
    { it: 'uovo', cls: 'food', sem: ['food'], en: 'egg', tags: ['cook'] },
    { it: 'frutta', cls: 'food', sem: ['food'], en: 'fruit', mass: true },
    { it: 'riso', cls: 'food', sem: ['food'], en: 'rice', mass: true, tags: ['cook'] },
    { it: 'colazione', cls: 'food', sem: ['food', 'time'], en: 'breakfast' },
    { it: 'pranzo', cls: 'food', sem: ['food', 'time'], en: 'lunch' },
    { it: 'cena', cls: 'food', sem: ['food', 'time'], en: 'dinner' },
    { it: 'zucchero', cls: 'food', sem: ['food'], en: 'sugar', mass: true },
    { it: 'sale', cls: 'food', sem: ['food'], en: 'salt', mass: true },
    { it: 'olio', cls: 'food', sem: ['food'], en: 'oil', mass: true },
    { it: 'vino', cls: 'drink', sem: ['drink'], en: 'wine', cup: true },
    { it: 'birra', cls: 'drink', sem: ['drink'], en: 'beer', cup: true },
    { it: 'acqua', cls: 'drink', sem: ['drink'], en: 'water', mass: true },
    { it: 'caffè', cls: 'drink', sem: ['drink'], en: 'coffee', cup: true },
    { it: 'tè', cls: 'drink', sem: ['drink'], en: 'tea', cup: true },
    { it: 'latte', cls: 'drink', sem: ['drink'], en: 'milk', mass: true }
  ];

  // subj / obj: classes or tags. io: 'to' (dare a) or 'for' (chiedere / comprare).
  // auxUse for a/e verbs when there is no object: 'a' or 'e'. auxMove 'e' prefers essere once a place phrase is attached.
  // needPP: only with a prepositional phrase. shapes are filled in by the engine from these flags.
  const verbs = [
    { it: 'essere', en: 'be', subj: classes.slice(), cop: true, loc: true },
    { it: 'stare', en: 'be', subj: ['person', 'animal', 'vehicle'], cop: true, loc: true, auxUse: 'e' },
    { it: 'avere', en: 'have', subj: ['person'], skip: true },

    { it: 'andare', en: 'go', subj: ['person', 'animal'], intr: true, pp: true },
    { it: 'venire', en: 'come', subj: ['person', 'animal'], intr: true, pp: true },
    { it: 'arrivare', en: 'arrive', subj: ['person', 'animal', 'vehicle'], intr: true, pp: true },
    { it: 'partire', en: 'leave', alts: ['depart'], subj: ['person', 'vehicle'], intr: true, pp: true },
    { it: 'uscire', en: 'leave', subj: ['person', 'animal'], intr: true, pp: true },
    { it: 'entrare', en: 'enter', subj: ['person', 'animal'], intr: true, pp: true },
    { it: 'tornare', en: 'return', alts: ['come back'], subj: ['person'], intr: true, pp: true },
    { it: 'restare', en: 'stay', subj: ['person', 'animal'], intr: true, pp: true },
    { it: 'rimanere', en: 'stay', alts: ['remain'], subj: ['person', 'animal'], intr: true, pp: true },
    { it: 'dormire', en: 'sleep', subj: ['person', 'animal'], intr: true, pp: true },
    { it: 'camminare', en: 'walk', subj: ['person'], intr: true },
    { it: 'lavorare', en: 'work', subj: ['person'], intr: true, pp: true },
    { it: 'vivere', en: 'live', subj: ['person'], intr: true, pp: true, needPP: true, auxUse: 'a' },
    { it: 'correre', en: 'run', subj: ['person', 'animal'], intr: true, pp: true, auxUse: 'a', auxMove: 'e' },
    { it: 'parlare', en: 'talk', alts: ['speak'], subj: ['person'], intr: true, pp: true },
    { it: 'ridere', en: 'laugh', subj: ['person'], intr: true },
    { it: 'piangere', en: 'cry', subj: ['person'], intr: true },
    { it: 'sorridere', en: 'smile', subj: ['person'], intr: true },
    { it: 'studiare', en: 'study', subj: ['person'], intr: true },
    { it: 'salire', en: 'get', subj: ['person'], intr: true, pp: true, needPP: true, auxMove: 'e' },
    { it: 'scendere', en: 'get', subj: ['person'], intr: true, pp: true, needPP: true, auxMove: 'e' },
    { it: 'passare', en: 'pass', subj: ['person'], intr: true, pp: true, needPP: true, auxUse: 'e' },
    { it: 'finire', en: 'end', alts: ['finish'], subj: ['time'], intr: true, auxUse: 'e' },
    { it: 'cominciare', en: 'start', alts: ['begin'], subj: ['time'], intr: true, auxUse: 'e' },
    { it: 'iniziare', en: 'start', alts: ['begin'], subj: ['time'], intr: true, auxUse: 'e' },

    { it: 'mangiare', en: 'eat', subj: ['person', 'animal'], intr: true, obj: ['food'] },
    { it: 'bere', en: 'drink', subj: ['person', 'animal'], intr: true, obj: ['drink'] },
    { it: 'prendere', en: 'take', alts: ['get'], subj: ['person'], obj: ['food', 'drink', 'tool', 'text', 'hand', 'vehicle'] },
    { it: 'portare', en: 'bring', alts: ['carry'], subj: ['person'], obj: ['tool', 'text', 'hand', 'food', 'drink'], io: 'to' },
    { it: 'dare', en: 'give', subj: ['person'], obj: ['tool', 'text', 'hand', 'food', 'drink'], io: 'to', ioOnly: true },
    { it: 'vedere', en: 'see', subj: ['person'], obj: ['person', 'animal', 'place', 'building', 'object', 'tool', 'text', 'vehicle', 'food', 'drink', 'water', 'abstract'] },
    { it: 'guardare', en: 'watch', alts: ['look at'], subj: ['person'], obj: ['person', 'animal', 'place', 'building', 'object', 'tool', 'text', 'vehicle', 'food', 'drink', 'water'] },
    { it: 'cercare', en: 'look for', subj: ['person'], obj: ['person', 'animal', 'place', 'building', 'object', 'tool', 'text', 'food', 'drink', 'water', 'abstract'] },
    { it: 'trovare', en: 'find', subj: ['person'], obj: ['person', 'animal', 'place', 'building', 'object', 'tool', 'text', 'food', 'drink', 'water', 'abstract'] },
    { it: 'comprare', en: 'buy', subj: ['person'], obj: ['food', 'drink', 'tool', 'text', 'hand', 'vehicle'], io: 'for' },
    { it: 'pagare', en: 'pay', subj: ['person'], obj: ['pay'] },
    { it: 'aprire', en: 'open', subj: ['person'], obj: ['open'] },
    { it: 'chiudere', en: 'close', alts: ['shut'], subj: ['person'], obj: ['open'] },
    { it: 'leggere', en: 'read', subj: ['person'], intr: true, obj: ['text'] },
    { it: 'scrivere', en: 'write', subj: ['person'], intr: true, obj: ['text'] },
    { it: 'capire', en: 'understand', subj: ['person'], obj: ['person', 'abstract', 'text'] },
    { it: 'conoscere', en: 'know', subj: ['person'], obj: ['person', 'place', 'building', 'water'] },
    { it: 'chiamare', en: 'call', subj: ['person'], obj: ['person', 'animal'] },
    { it: 'chiedere', en: 'ask for', subj: ['person'], obj: ['abstract', 'text', 'pay'], io: 'for', ask: true },
    { it: 'aiutare', en: 'help', subj: ['person'], obj: ['person', 'animal'] },
    { it: 'ascoltare', en: 'listen to', subj: ['person'], obj: ['person'] },
    { it: 'aspettare', en: 'wait for', subj: ['person'], obj: ['person', 'vehicle'] },
    { it: 'visitare', en: 'visit', subj: ['person'], obj: ['place', 'building', 'water'] },
    { it: 'prenotare', en: 'book', alts: ['reserve'], subj: ['person'], obj: ['book'] },
    { it: 'ordinare', en: 'order', subj: ['person'], obj: ['food', 'drink'] },
    { it: 'cucinare', en: 'cook', subj: ['person'], obj: ['cook'] },
    { it: 'preparare', en: 'prepare', subj: ['person'], obj: ['food', 'drink'] },
    { it: 'spiegare', en: 'explain', subj: ['person'], obj: ['abstract'], io: 'to' },
    { it: 'mostrare', en: 'show', subj: ['person'], obj: ['person', 'animal', 'place', 'building', 'object', 'tool', 'text'], io: 'to' },
    { it: 'usare', en: 'use', subj: ['person'], obj: ['tool', 'vehicle'] },
    { it: 'perdere', en: 'lose', subj: ['person'], obj: ['tool', 'text', 'hand', 'vehicle'], enFor: { vehicle: 'miss' } },
    { it: 'guidare', en: 'drive', subj: ['person'], obj: ['drive'] },
    { it: 'preferire', en: 'prefer', subj: ['person'], obj: ['food', 'drink', 'place', 'building'] },
    { it: 'offrire', en: 'offer', subj: ['person'], obj: ['food', 'drink'], io: 'to', ioOnly: true },
    { it: 'invitare', en: 'invite', subj: ['person'], obj: ['person'] },
    { it: 'ricordare', en: 'remember', subj: ['person'], obj: ['person', 'place', 'building', 'time', 'abstract'] },
    { it: 'dimenticare', en: 'forget', subj: ['person'], obj: ['person', 'place', 'building', 'time', 'abstract'] },
    { it: 'lasciare', en: 'leave', subj: ['person'], obj: ['person', 'animal', 'tool', 'text', 'hand', 'vehicle', 'food'] }
  ];

  // on: semantic classes, or a narrow tag. pred essere / stare / both. attr: may modify a noun.
  // The same `on` list is used for attributive nouns and for predicate adjectives.
  const adjs = [
    { it: 'grande', en: 'big', alts: ['large'], on: ['person', 'animal', 'place', 'building', 'vehicle', 'food', 'object', 'water', 'abstract'], notMass: true, pred: 'essere', attr: true, pre: true },
    { it: 'piccolo', en: 'small', alts: ['little'], on: ['person', 'animal', 'place', 'building', 'vehicle', 'food', 'object', 'water', 'abstract'], notMass: true, pred: 'essere', attr: true, pre: true },
    { it: 'buono', en: 'good', on: ['person', 'food', 'drink', 'abstract'], pred: 'essere', attr: true, pre: true },
    { it: 'bello', en: 'beautiful', alts: ['handsome'], on: ['person', 'animal', 'place', 'building', 'vehicle', 'object', 'water', 'food'], pred: 'essere', attr: true, pre: true },
    { it: 'brutto', en: 'ugly', on: ['person', 'animal', 'place', 'building', 'vehicle', 'object', 'water', 'food'], pred: 'essere', attr: true },
    { it: 'nuovo', en: 'new', on: ['object', 'vehicle', 'building', 'place', 'text'], pred: 'essere', attr: true, pre: true },
    { it: 'vecchio', en: 'old', on: ['person', 'animal', 'object', 'vehicle', 'building', 'place', 'text'], pred: 'essere', attr: true, pre: true },
    { it: 'giovane', en: 'young', on: ['person', 'animal'], pred: 'essere', attr: true, pre: true },
    { it: 'lungo', en: 'long', on: ['water', 'time', 'text', 'long'], pred: 'essere', attr: true },
    { it: 'corto', en: 'short', on: ['water', 'time', 'text', 'long'], pred: 'essere', attr: true },
    { it: 'caldo', en: 'hot', alts: ['warm'], on: ['food', 'drink', 'place', 'building', 'time', 'water'], pred: 'essere', attr: true },
    { it: 'freddo', en: 'cold', on: ['food', 'drink', 'place', 'building', 'time', 'water'], pred: 'essere', attr: true },
    { it: 'aperto', en: 'open', on: ['open'], pred: 'essere', attr: true },
    { it: 'chiuso', en: 'closed', on: ['open'], pred: 'essere', attr: true },
    { it: 'italiano', en: 'Italian', on: ['person', 'food', 'drink', 'place', 'building'], pred: 'essere', attr: true },
    { it: 'libero', en: 'free', alts: ['available'], on: ['person', 'free'], pred: 'essere', attr: true },
    { it: 'pieno', en: 'full', on: ['fill'], pred: 'essere', attr: true },
    { it: 'vuoto', en: 'empty', on: ['fill'], pred: 'essere', attr: true },
    { it: 'famoso', en: 'famous', on: ['person', 'place', 'building'], pred: 'essere', attr: true },
    { it: 'caro', en: 'expensive', on: ['building', 'object', 'vehicle', 'food', 'drink', 'text'], pred: 'essere', attr: true },
    { it: 'bravo', en: 'good', alts: ['skilled'], on: ['person', 'animal'], pred: 'essere', attr: true, pre: true },
    { it: 'tranquillo', en: 'calm', alts: ['quiet'], on: ['person', 'animal', 'place', 'building'], pred: 'both', attr: true },
    { it: 'comodo', en: 'comfortable', on: ['free'], pred: 'essere', attr: true },
    { it: 'stanco', en: 'tired', on: ['person', 'animal'], pred: 'essere', attr: true },
    { it: 'zitto', en: 'quiet', on: ['person'], pred: 'stare', attr: false },
    { it: 'alto', en: 'tall', alts: ['high'], on: ['person', 'animal', 'building', 'high'], pred: 'essere', attr: true },
    { it: 'basso', en: 'low', alts: ['short'], on: ['person', 'animal', 'building', 'high'], pred: 'essere', attr: true },
    { it: 'importante', en: 'important', on: ['person', 'abstract', 'time'], pred: 'essere', attr: true },
    { it: 'ottimo', en: 'excellent', alts: ['great'], on: ['food', 'drink'], pred: 'essere', attr: true },
    { it: 'interessante', en: 'interesting', on: ['person', 'place', 'building', 'text', 'abstract', 'time'], pred: 'essere', attr: true },
    { it: 'sporco', en: 'dirty', on: ['person', 'animal', 'object', 'vehicle', 'place', 'building'], pred: 'essere', attr: true },
    { it: 'primo', en: 'first', on: ['person', 'animal', 'place', 'building', 'vehicle', 'food', 'object', 'time', 'abstract'], notMass: true, pred: null, attr: true },
    { it: 'ultimo', en: 'last', on: ['person', 'animal', 'place', 'building', 'vehicle', 'food', 'object', 'time', 'abstract'], notMass: true, pred: null, attr: true },
    { it: 'prossimo', en: 'next', on: ['person', 'place', 'building', 'vehicle', 'object', 'time', 'abstract'], notMass: true, pred: null, attr: true },
    { it: 'stesso', en: 'same', on: classes.slice(), pred: null, attr: true },
    { it: 'solito', en: 'usual', on: ['person', 'place', 'building', 'food', 'drink', 'object', 'time'], pred: null, attr: true }
  ];
  // Antonym groups, and near-contradictions (size against length, size against height).
  const antonyms = [
    ['grande', 'piccolo'],
    ['lungo', 'corto'],
    ['vecchio', 'nuovo', 'giovane'],
    ['alto', 'basso'],
    ['bello', 'brutto'],
    ['caldo', 'freddo'],
    ['aperto', 'chiuso'],
    ['pieno', 'vuoto']
  ];
  const near = [
    ['grande', 'corto'],
    ['piccolo', 'lungo'],
    ['grande', 'basso'],
    ['piccolo', 'alto']
  ];

  const poss = [
    { it: 'mio', en: 'my' },
    { it: 'tuo', en: 'your' },
    { it: 'suo', en: 'his', alts: ['her', 'its', 'your'] },
    { it: 'nostro', en: 'our' },
    { it: 'vostro', en: 'your' },
    { it: 'loro', en: 'their', alts: ['your'] }
  ];

  const advs = [
    { it: 'bene', en: 'well', alts: ['fine'], stare: true },
    { it: 'male', en: 'sick', alts: ['unwell'], stare: true }
  ];
  // "sta male" = is sick / is unwell, not "is badly". Display uses enPred when set.

  // Prepositional frames. en: English after the verb; $ is the noun ("to the $"). No $ means the whole phrase ("home").
  // who: noun class allowed as the subject of this frame. plain: con does not contract.
  // Each verb+preposition lists only the prep objects that make sense for it.
  const PERS = ['person', 'animal'];
  const PEOPLE = nouns.filter(n => n.cls === 'person').map(n => n.it);
  const GO = ['museo', 'ristorante', 'mercato', 'parco', 'albergo', 'hotel', 'bar', 'aeroporto', 'ospedale', 'stazione'];
  const GO_IN = ['banca', 'chiesa', 'ufficio', 'cucina', 'camera', 'museo', 'ristorante', 'albergo', 'hotel', 'stazione'];
  const BE = ['museo', 'ristorante', 'parco', 'albergo', 'hotel', 'bar', 'aeroporto', 'ospedale', 'stazione', 'mercato', 'piazza', 'chiesa'];
  const SLEEP = ['camera', 'albergo', 'hotel', 'letto'];
  const WORK = ['ufficio', 'banca', 'ospedale', 'ristorante', 'museo', 'negozio'];
  const RIDE = ['treno', 'autobus', 'aereo'];
  const CAR = ['macchina', 'auto', 'taxi'];
  const pp = [
    { vs: ['andare', 'venire', 'tornare'], prep: 'a', art: true, nouns: GO, en: 'to the $', who: PERS },
    { vs: ['arrivare'], prep: 'a', art: true, nouns: ['stazione', 'aeroporto', 'museo', 'ristorante', 'albergo', 'hotel', 'ospedale'], en: 'at the $', who: PERS, sg: true },
    { vs: ['correre'], prep: 'a', art: true, nouns: ['parco', 'stazione', 'spiaggia'], en: 'to the $', who: PERS, sg: true },
    { vs: ['andare', 'venire', 'tornare', 'arrivare', 'correre'], prep: 'a', art: false, nouns: ['casa'], en: 'home', who: PERS },
    { vs: ['andare', 'venire', 'tornare', 'arrivare'], prep: 'a', art: false, nouns: ['scuola'], en: 'to school', who: ['person'] },
    { vs: ['andare', 'venire', 'tornare'], prep: 'in', art: true, nouns: GO_IN, en: 'to the $', who: PERS },
    { vs: ['arrivare'], prep: 'in', art: true, nouns: ['ufficio', 'stazione', 'aeroporto', 'città'], en: 'in the $', who: PERS, sg: true },
    { vs: ['entrare'], prep: 'in', art: true, nouns: GO_IN.concat(['casa', 'negozio']), en: 'the $', who: PERS },
    { vs: ['andare', 'venire', 'tornare'], prep: 'in', art: false, nouns: ['città'], en: 'to town', who: PERS },
    { vs: ['arrivare'], prep: 'in', art: false, nouns: ['città'], en: 'in town', who: PERS },
    { vs: ['andare', 'venire', 'tornare'], prep: 'in', art: false, nouns: ['spiaggia'], en: 'to the beach', who: PERS },
    { vs: ['andare', 'venire', 'tornare'], prep: 'in', art: false, nouns: ['montagna'], en: 'to the mountains', who: PERS },
    { vs: ['partire'], prep: 'da', art: true, nouns: ['museo', 'ristorante', 'stazione', 'aeroporto', 'ufficio', 'chiesa', 'albergo', 'hotel', 'banca', 'parco'], en: 'from the $', who: ['person'], sg: true },
    { vs: ['uscire'], prep: 'da', art: true, nouns: ['museo', 'ristorante', 'stazione', 'aeroporto', 'ufficio', 'chiesa', 'albergo', 'hotel', 'banca', 'parco'], en: 'the $', who: ['person'], sg: true },
    { vs: ['partire', 'arrivare'], prep: 'da', art: false, nouns: ['casa'], en: 'from home', who: PERS },
    { vs: ['uscire'], prep: 'da', art: false, nouns: ['casa'], en: 'home', who: PERS },
    { vs: ['partire', 'arrivare'], prep: 'da', art: false, nouns: ['scuola'], en: 'from school', who: ['person'] },
    { vs: ['uscire'], prep: 'da', art: false, nouns: ['scuola'], en: 'school', who: ['person'] },
    { vs: ['arrivare'], prep: 'a', art: true, nouns: ['stazione', 'aeroporto'], en: 'at the $', who: ['vehicle'] },
    { vs: ['arrivare'], prep: 'in', art: false, nouns: ['città'], en: 'in town', who: ['vehicle'] },
    { vs: ['partire'], prep: 'da', art: true, nouns: ['stazione', 'aeroporto'], en: 'from the $', who: ['vehicle'], sg: true },

    { vs: ['essere', 'stare', 'restare', 'rimanere'], prep: 'a', art: false, nouns: ['casa'], en: 'at home', who: PERS },
    { vs: ['essere', 'stare', 'restare', 'rimanere'], prep: 'a', art: false, nouns: ['scuola'], en: 'at school', who: ['person'] },
    { vs: ['essere', 'stare', 'restare', 'rimanere'], prep: 'a', art: true, nouns: ['parco'], en: 'at the $', who: ['animal'] },
    { vs: ['essere', 'stare', 'restare', 'rimanere'], prep: 'a', art: true, nouns: BE, en: 'at the $', who: ['person'] },
    { vs: ['essere', 'stare', 'restare', 'rimanere'], prep: 'in', art: true, nouns: ['cucina', 'camera', 'bagno', 'ufficio', 'banca', 'museo', 'chiesa'], en: 'in the $', who: ['person'] },
    { vs: ['essere', 'stare', 'restare', 'rimanere'], prep: 'in', art: false, nouns: ['città'], en: 'in town', who: PERS },
    { vs: ['essere', 'stare', 'restare', 'rimanere'], prep: 'in', art: false, nouns: ['spiaggia'], en: 'at the beach', who: PERS },
    { vs: ['essere', 'stare', 'restare', 'rimanere'], prep: 'in', art: false, nouns: ['montagna'], en: 'in the mountains', who: PERS },
    { vs: ['essere', 'stare', 'restare'], prep: 'a', art: true, nouns: ['stazione', 'aeroporto'], en: 'at the $', who: ['vehicle'], sg: true },
    { vs: ['essere', 'stare'], prep: 'in', art: false, nouns: ['città'], en: 'in town', who: ['vehicle'] },

    { vs: ['lavorare'], prep: 'a', art: false, nouns: ['casa'], en: 'at home', who: ['person'] },
    { vs: ['lavorare'], prep: 'a', art: false, nouns: ['scuola'], en: 'at school', who: ['person'] },
    { vs: ['lavorare'], prep: 'in', art: true, nouns: WORK, en: 'at the $', who: ['person'] },
    { vs: ['dormire'], prep: 'a', art: false, nouns: ['casa'], en: 'at home', who: PERS },
    { vs: ['dormire'], prep: 'in', art: true, nouns: SLEEP, en: 'in the $', who: PERS },
    { vs: ['vivere'], prep: 'a', art: false, nouns: ['casa'], en: 'at home', who: ['person'] },
    { vs: ['vivere'], prep: 'in', art: false, nouns: ['città'], en: 'in town', who: ['person'] },

    { vs: ['salire'], prep: 'su', art: true, nouns: RIDE, en: 'on the $', enAlt: ['into the $'], who: ['person'] },
    { vs: ['salire'], prep: 'in', art: false, nouns: CAR, en: 'into the $', enAlt: ['on the $'], who: ['person'] },
    { vs: ['scendere'], prep: 'da', art: true, nouns: RIDE, en: 'off the $', enAlt: ['out of the $'], who: ['person'] },
    { vs: ['scendere'], prep: 'da', art: true, nouns: CAR, en: 'out of the $', enAlt: ['off the $'], who: ['person'] },
    { vs: ['passare'], prep: 'da', art: true, nouns: ['museo', 'stazione', 'parco', 'piazza', 'chiesa', 'negozio'], en: 'by the $', who: ['person'] },
    { vs: ['parlare'], prep: 'con', art: true, plain: true, nouns: PEOPLE, en: 'with the $', who: ['person'] }
  ];

  return { nouns: nouns, verbs: verbs, adjs: adjs, poss: poss, advs: advs, pp: pp, classes: classes, narrow: narrow, antonyms: antonyms, near: near };
});
