#!/usr/bin/env python3
"""Step 1 of the data build: lemma frequencies for Italian.

Input:  it_full.txt  OpenSubtitles 2018 Italian word-form counts (hermitdave/FrequencyWords, CC BY-SA 4.0)
        morphit.txt  Morph-it! 0.4.8 lexicon, UTF-8 (Baroni & Zanchetta, CC BY-SA 2.0 / LGPL)
Output: TSV  lemma  pos-labels  count  top-forms  (stdout)

Many Italian forms are ambiguous (lavoro = noun 'work' or 'I work'; era = 'was' or 'era').
Each form's count is split between its analyses with a small generative model fitted by EM:
  P(form) = sum over analyses (lemma, pos, cell) of  P(lemma, pos) * P(cell | pos)
where the cell is the inflectional slot (e.g. verb ind.pres.1s, noun plural). P(cell | pos) is
estimated from unambiguous forms, so a verb explains only as much of 'lavoro' as a typical verb's
1st-person-singular present would, and the rest goes to the noun. Forms Morph-it! doesn't know
(names, English words, fragments) are dropped.
Run: python3 tools/lemmatize.py SRC_DIR > build/lemmas.tsv                      (subtitles, SRC_DIR/it_full.txt)
     python3 tools/lemmatize.py SRC_DIR build/news_forms.txt news > build/news_lemmas.tsv   (Leipzig news forms)
For news text (which spells accents properly and means 'pope' by papa) the subtitle accent repairs are off.
"""
import sys, collections, unicodedata, re, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from wordlists import PROTECTED
src = sys.argv[1]
FORMS_FILE = sys.argv[2] if len(sys.argv) > 2 else src + '/it_full.txt'
NEWS = len(sys.argv) > 3 and sys.argv[3] == 'news'
TOP_FORMS = 80000

def analyse(tag):
    """-> (pos, gender, cell) or None"""
    t, _, infl = tag.partition(':')
    if t.startswith('NOUN-'): return 'noun', t[5].lower(), 'n:' + infl
    if t == 'ADJ': return 'adj', '', 'a:' + infl
    if t in ('VER', 'AUX', 'MOD', 'CAU', 'ASP'):
        f = infl.split('+')
        f = [x for x in f if x not in ('lo', 'la', 'li', 'le', 'gli', 'mi', 'ti', 'ci', 'vi', 'si', 'ne') and not re.match(r'^(me|te|ce|ve|se|glie)(lo|la|li|le|ne)$', x) and x not in ('cela','cele','celo','celi','cene','mela','mele','melo','meli','mene','tela','tele','telo','teli','tene','vela','vele','velo','veli','vene','sela','sele','selo','seli','sene','glielo','gliela','glieli','gliele','gliene')]
        return 'verb', '', 'v:' + '+'.join(f)
    if t in ('NPR', 'SYM', 'PON', 'SENT', 'ABL', 'SMI'): return None
    return t.lower(), '', 'x:' + t
M = collections.defaultdict(set)
for line in open(src + '/morphit.txt', encoding='utf-8'):
    p = line.rstrip('\n').split('\t')
    if len(p) != 3: continue
    form, lemma, tag = p
    a = analyse(tag)
    if a: M[form.lower()].add((lemma.lower(), a[0], a[1], a[2]))

# Drop analyses that are spurious for a frequency count:
#  - adjective/noun readings that are just a verb's past participle (preso, finito, sentito): count them for the verb,
#    except participles that are also everyday nouns/adjectives (fatto 'fact', stato 'state', passato 'past', ...)
#  - a few rare homographs that would otherwise swallow a common form (era 'era' vs essere, ancora 'anchor')
KEEP_PART = {'fatto', 'stato', 'passato', 'successo', 'dato', 'risultato', 'significato', 'vestito', 'morto', 'ferito', 'invitato',
             'sposato', 'avvocato', 'impiegato', 'soldato', 'mercato', 'piatto', 'fidanzato', 'innamorato', 'sospettato', 'aperto', 'chiuso',
             'posto', 'peccato', 'privato', 'solito', 'scorso', 'esatto', 'diretto', 'addosso', 'perfetto', 'contento', 'fermo', 'risposta',
             # everyday adjectives that share a form with a participle (found while blending in news text)
             'preferito', 'interessato', 'corretto', 'stretto', 'occupato', 'sbagliato'}
# everyday nouns that share a form with a participle: keep the noun reading but not the participle-adjective one
# (adjective 'corso' would also claim corsa 'race', 'volto' would claim volta 'time', 'partito' partita 'match')
KEEP_NOUN = {'letto', 'porto', 'peso', 'volto', 'sorriso', 'conflitto', 'campionato', 'mandato', 'partito', 'tratto', 'corso', 'percorso',
             'soccorso', 'permesso', 'prodotto', 'candidato', 'concorso', 'ricorso', 'contenuto', 'commesso', 'espresso', 'riso'}
BAD = {('era', 'noun'), ('saio', 'noun'), ('ancora', 'noun'), ('no', 'noun'), ('madre', 'adj'), ('sangue', 'adj'), ('vero', 'noun'),
       ('meglio', 'noun'), ('avanti', 'adj'), ('giusto', 'noun'), ('nuovo', 'noun'), ('stesso', 'noun'), ('primo', 'noun'), ('oggi', 'noun'),
       ('domani', 'noun'), ('ok', 'noun'), ('visto', 'noun'), ('detto', 'noun'), ('ucciso', 'noun'), ('voi', 'noun'), ('tratta', 'noun'), ('fallo', 'noun'),
       ('unica', 'noun'), ('ultima', 'noun'), ('vecchia', 'noun'), ('uccisa', 'noun'), ('tornata', 'noun'), ('fossa', 'noun'), ('pero', 'noun')}
# rare verbs in the lexicon that would claim common noun/adjective forms (visto, solo, posto, ultimo, secondo, capo, figlio ...)
BAD_LEMMA = {'vistare', 'solare', 'postare', 'figliare', 'capere', 'orare', 'ancorare', 'ultimare', 'secondare', 'compitare', 'discorrere',
             'contrattare', 'rodere', 'addossare', 'esercitare', 'scopare', 'menare', 'testare', 'agire_', 'mostrare_', 'capitanare', 'finanziare_',
             'nullo', 'tessere', 'pianare', 'pianire', 'regolare_', 'liberare_', 'calmare_', 'fiorire_', 'sedare', 'parare', 'ostare', 'cenare_', 'sciare_', 'anelare', 'corare'}
# participles Morph-it! lacks (visto is listed only under the rare verb vistare)
for verb, stem in {'vedere': 'vist', 'rivedere': 'rivist', 'prevedere': 'previst', 'discutere': 'discuss', 'concedere': 'conced_',
                   'seppellire': 'sepolt', 'riflettere': 'rifless'}.items():
    if stem.endswith('_'): stem = 'concess'
    for end, gn in (('o', 's+m'), ('a', 's+f'), ('i', 'p+m'), ('e', 'p+f')):
        M[stem + end].add((verb, 'verb', '', 'v:part+past+' + gn))
# everyday words Morph-it! lacks
M['buonanotte'].add(('buonanotte', 'int', '', 'x:INT'))
# Forms where the model gives (nearly) everything to a homograph because the other reading has no unambiguous forms to
# learn from: sale 'salt' vs salire 'goes up', riso 'rice' vs ridere 'laughed', data 'date' vs dare, fa 'ago' vs fare,
# sei 'six' vs essere. The protected reading gets at least this share of the form's count (rough hand estimates;
# they only affect the teaching order, since these words are kept in the list anyway).
MIN_SHARE = {'sale': (('sale', 'noun'), 0.3), 'riso': (('riso', 'noun'), 0.3), 'posta': (('posta', 'noun'), 0.8),
             'data': (('data', 'noun'), 0.6), 'stato': (('stato', 'noun'), 0.05), 'fa': (('fa', 'adv'), 0.1),
             'sei': (('sei', ''), 0.03)}
MSP = collections.defaultdict(set)          # verb lemma -> its masc. sg. past participle(s)
for form, an in M.items():
    for a in an:
        if a[1] == 'verb' and a[3] == 'v:part+past+s+m': MSP[a[0]].add(form)
for form, an in list(M.items()):
    pps = set()
    for a in an:
        if a[1] == 'verb' and a[3].startswith('v:part+past'): pps |= MSP[a[0]]
    keep = {a for a in an if not ((a[0], a[1]) in BAD or a[0] in BAD_LEMMA or (a[1] in ('adj', 'noun') and a[0] in pps and a[0] not in KEEP_PART and not (a[1] == 'noun' and a[0] in KEEP_NOUN)))}
    if keep: M[form] = keep

ACC = {'a': 'à', 'e': 'è', 'i': 'ì', 'o': 'ò', 'u': 'ù'}
def lookup(f):
    if f == 'papa' and not NEWS: return 'papà'    # subtitles often drop accents; papà (dad) is far more common there than papa (pope)
    if f in M: return f
    if f == "e'": return 'è'
    if f and f[-1] in ACC and f[:-1] + ACC[f[-1]] in M: return f[:-1] + ACC[f[-1]]
    if f.endswith('e') and f[:-1] + 'é' in M: return f[:-1] + 'é'
    if f + "'" in M: return f + "'"
    return None
# Subtitles often drop a final accent (citta, pero, faro for farò). If the accented spelling is also attested and is
# more than 3x as frequent, count the plain spelling as the accented word.
RAW = {}
for i, line in enumerate(open(FORMS_FILE, encoding='utf-8')):
    if i >= TOP_FORMS: break
    w, n = line.rsplit(' ', 1); RAW[unicodedata.normalize('NFC', w.lower())] = int(n)
def accented(w):
    if NEWS: return None
    # unaccented 1st-person future (faro, saro, diro): far more common in subtitles than faro 'lighthouse'
    if w.endswith('ro') and any(a[3] == 'v:ind+fut+1+s' for a in M.get(w[:-1] + 'ò', ())): return w[:-1] + 'ò'
    if w and w[-1] in ACC and w[:-1] + ACC[w[-1]] in M and RAW.get(w[:-1] + ACC[w[-1]], 0) > 3 * RAW.get(w, 0): return w[:-1] + ACC[w[-1]]
    if w and w[-1] == 'e' and w[:-1] + 'é' in M and RAW.get(w[:-1] + 'é', 0) > 3 * RAW.get(w, 0): return w[:-1] + 'é'
    return None
forms = []
for i, line in enumerate(open(FORMS_FILE, encoding='utf-8')):
    if i >= TOP_FORMS: break
    w, n = line.rsplit(' ', 1)
    w = unicodedata.normalize('NFC', w.lower())
    k = accented(w) or lookup(w)
    if k: forms.append((k, w, int(n)))

# P(cell | pos) from forms with a single (lemma, pos) reading
cellc = collections.defaultdict(collections.Counter)
for k, w, n in forms:
    lp = {(a[0], a[1]) for a in M[k]}
    if len(lp) == 1:
        cs = [a[3] for a in M[k]]
        for c in cs: cellc[next(iter(lp))[1]][c] += n / len(cs)
def pcell(pos, cell):
    c = cellc[pos]; tot = sum(c.values())
    return (c[cell] + 1) / (tot + len(c) + 1) if tot else 1.0

W = collections.Counter()
for k, w, n in forms:
    for a in M[k]: W[(a[0], a[1], a[2])] += n / len(M[k])
def split(k):
    """-> [(analysis, fraction of the form's count)]"""
    sc = [(a, (W[(a[0], a[1], a[2])] + 0.5) * pcell(a[1], a[3])) for a in M[k]]
    tot = sum(s for _, s in sc)
    fr = [(a, s / tot) for a, s in sc]
    if k in MIN_SHARE:
        (lem, p), want = MIN_SHARE[k]
        hit = lambda a: a[0] == lem and a[1].startswith(p)
        t = sum(f for a, f in fr if hit(a))
        if 0 < t < want: fr = [(a, f * want / t if hit(a) else f * (1 - want) / (1 - t)) for a, f in fr]
    return fr
for it in range(30):
    W2 = collections.Counter()
    for k, w, n in forms:
        for a, f in split(k): W2[(a[0], a[1], a[2])] += n * f
    W = W2
FORMS = collections.defaultdict(collections.Counter)
for k, w, n in forms:
    for a, f in split(k): FORMS[(a[0], a[1], a[2])][w] += n * f
# the most frequent lemmas, plus the hand-protected words (wordlists.py) however rare
for i, ((lemma, pos, g), n) in enumerate(W.most_common()):
    if (i >= 9000 or n < 50) and not (lemma in PROTECTED and n >= 1): continue
    top = ' '.join(f for f, _ in FORMS[(lemma, pos, g)].most_common(5))
    print(f'{lemma}\t{pos}{"-" + g if g else ""}\t{round(n)}\t{top}')
