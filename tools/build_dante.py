#!/usr/bin/env python3
"""Build the Dante Inferno pack from the Project Gutenberg text + Morph-it!.

Usage:
  python3 tools/build_dante.py /path/to/morph-it_048.txt.utf8

Writes data/packs/dante/, data/dante/inferno.txt, data/dante-excluded.json,
and docs/dante-excluded.md. Morph-it! is a build input, not committed.
"""
import json, re, sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEXT = ROOT / 'data' / 'dante' / 'inferno.txt'
# allow the raw PG file via argv, else the cleaned file must already exist
MORPH = Path(sys.argv[1]) if len(sys.argv) > 1 else None
CORE = ROOT / 'data' / 'packs' / 'core' / 'words.json'

ACC = str.maketrans('àèéìòùáíóúäëïöü', 'aeeiouaiouaeiou')

def norm(s):
    s = s.lower().replace('’', "'").replace('´', "'")
    s = s.replace('ï', 'i').replace('ë', 'e').replace('ü', 'u').replace('ö', 'o')
    return s.translate(ACC)

# Form (norm) -> modern lemma norm that is in core, or a Dante headword.
# None drops the token (clitic fragment).
TO_CORE_OR_HEAD = {
    'de': 'di', 'ad': 'a', 'ed': 'e', 'od': 'o', 'd': 'di',
    'al': 'a', 'del': 'di', 'nel': 'in', 'dal': 'da', 'sul': 'su', 'col': 'con',
    'ai': 'a', 'dei': 'di', 'nei': 'in', 'dai': 'da', 'sui': 'su', 'coi': 'con',
    'alla': 'a', 'della': 'di', 'nella': 'in', 'dalla': 'da', 'sulla': 'su', 'colla': 'con',
    'allo': 'a', 'dello': 'di', 'nello': 'in', 'dallo': 'da', 'sullo': 'su',
    'alle': 'a', 'delle': 'di', 'nelle': 'in', 'dalle': 'da', 'sulle': 'su',
    'agli': 'a', 'degli': 'di', 'negli': 'in', 'dagli': 'da', 'sugli': 'su',
    'una': 'un', 'uno': 'un', 'un': 'un',
    'qual': 'quale', 'gran': 'grande', 'buon': 'buono', 'man': 'mano', 'ben': 'bene', 'pur': 'pure',
    'or': 'ora', 'pia': 'piede', 'pie': 'piede', 'piè': 'piede',
    'ogne': 'ogni', 'sanza': 'senza', 'allor': 'allora', 'foco': 'fuoco', 'loco': 'luogo',
    'uom': 'uomo', 'om': 'uomo', 'pria': 'prima', "me'": 'meglio',
    'elli': 'egli', 'ei': 'egli', 'el': 'egli',
    'fia': 'essere', 'fie': 'essere', 'fiano': 'essere', 'fian': 'essere',
    'saria': 'essere', 'sarien': 'essere', 'sarieno': 'essere', 'fora': 'essere', 'foran': 'essere',
    'avea': 'avere', 'avean': 'avere', 'aveano': 'avere', 'avëa': 'avere',
    'parea': 'parere', 'parean': 'parere', 'facea': 'fare', 'facean': 'fare', 'facëa': 'fare',
    'dovea': 'dovere', 'potea': 'potere', 'volea': 'volere', 'dicea': 'dire',
    'fé': 'fare', 'fe': 'fare', "fe'": 'fare',
    'rispuose': 'rispondere', 'rispuosemi': 'rispondere',
    'vidi': 'vedere', 'viddi': 'vedere',
    'lor': 'loro', 'cor': 'cuore', 'cuor': 'cuore', 'fuor': 'fuori',
    'amor': 'amore', 'dolor': 'dolore', 'pensier': 'pensiero', 'sapor': 'sapore',
    'signor': 'signore', 'segnor': 'signore', 'maggior': 'maggiore', 'minor': 'minore',
    'miglior': 'migliore', 'peggior': 'peggiore', 'dottor': 'dottore',
    'imperador': 'imperatore', 'pastor': 'pastore', 'valor': 'valore',
    'onor': 'onore', 'error': 'errore', 'calor': 'calore', 'odor': 'odore',
    'sovra': 'sopra', 'sovra': 'sopra', 'contra': 'contro', 'infino': 'fino',
    'giuso': 'giu', 'suso': 'su', 'giù': 'giu', 'sù': 'su',
    'co': 'con', 'etterno': 'eterno', 'aere': 'aria', 'omai': 'ormai',
    'quivi': 'qui', 'poscia': 'poi', 'com': 'come', 'ond': 'onde', 'quand': 'quando',
    'perch': 'perche', 'quell': 'quello', 'quest': 'questo', 'dov': 'dove',
    'diss': 'dire', 'vid': 'vedere', 'nol': 'non', 'ov': 'dove', 'vo': 'volere',
    'sen': 'se', 'ver': 'vero', 'men': 'meno', 'par': 'parere',
    'presso': 'presso', 'dimmi': 'dire', 'torre': 'torre',
    'tòrre': 'togliere', 'tor': 'togliere',
    'fiata': 'fiata', 'fiate': 'fiata',
    'margini': 'margine',
    'pesa': 'pesare',
    'converte': 'convertire', 'converti': 'convertire', 'conversi': 'convertire', 'convergere': 'convertire',
    'diserta': 'diserto', 'diserto': 'diserto', 'disertare': 'diserto',
    'veggia': 'vedere', 'veggiate': 'vedere', 'veggiam': 'vedere', 'veggiamo': 'vedere', 'veggion': 'vedere',
    'c': 'che', 'i': 'io',
    'indi': 'indi', 'die': 'dare', 'diè': 'dare', 'matera': 'materia',
    'piaggia': 'piaggia', 'casso': 'casso', 'bel': 'bello',
    'margine': 'margine', 'marginare': 'margine', 'stremo': 'stremo', 'stremare': 'stremo',
    'officio': 'officio', 'officiare': 'officio', 'cotali': 'cotal', 'cola': 'colà',
    'intrammo': 'entrare', 'avieno': 'avere',
    'ripa': 'ripa', 'esso': 'esso',
    'omo': 'uomo', 'vuo': 'volere', 'veggio': 'vedere', 'veggendo': 'vedere', 'vegna': 'venire', 'vegno': 'venire',
    'sanz': 'senza', 'inver': 'verso', 'rispuos': 'rispondere', 'rispuosi': 'rispondere', 'quai': 'quale',
    'fur': 'essere', 'furo': 'essere', 'fuoro': 'essere', 'fue': 'essere', 'sien': 'essere', 'sie': 'essere',
    'puose': 'porre', 'puote': 'potere', 'nova': 'nuovo', 'novo': 'nuovo', 'novi': 'nuovo',
    'esto': 'questo', 'dimando': 'domandare', 'tai': 'tale', 'cotai': 'tale',
    'venìa': 'venire', 'ntorno': 'intorno', 'aperse': 'aprire', 'sovr': 'sopra',
    'ten': 'tenere', 'move': 'muovere', 'segnore': 'signore', 'que': 'che', 'anco': 'anche',
    'carco': 'carico', 'diece': 'dieci', 'esta': 'questo', 'face': 'fare', 'saver': 'sapere',
    'intrare': 'entrare', 'gittò': 'gettare', 'davante': 'davanti', 'adunque': 'dunque',
    'dicer': 'dire', 'cu': 'cui', 'nferno': 'inferno', 'mei': 'mezzo',
    'giva': 'andare', 'gio': 'andare', 'avem': 'avere', 'siam': 'essere',
    'gentil': 'gentile', 'picciol': 'piccolo', 'picciola': 'piccolo',
    'etterna': 'eterno', 'etterne': 'eterno', 'etterne': 'eterno',
    'novi': 'nuovo', 'spirti': 'spirito', 'spirto': 'spirito',
    'duol': 'dolore', 'duolo': 'dolore', 'martiro': 'martirio',
    'imagine': 'immagine', 'cagion': 'cagione', 'figliuol': 'figlio',
    'peccator': 'peccatore', 'cittadin': 'cittadino', 'diavol': 'diavolo',
    'cavalier': 'cavaliere', 'traditor': 'traditore', 'barattier': 'barattiere',
    'orribil': 'orribile', 'supin': 'supino', 'aguta': 'acuto', 'fier': 'fiero',
    'bestial': 'bestiale', 'similmente': 'simile', 'similemente': 'simile',
    'fei': 'fare', 'fenno': 'fare', 'faccendo': 'fare', 'vuolsi': 'volere',
    'avria': 'avere', 'dienno': 'dare', 'tacer': 'tacere', 'pianger': 'piangere',
    'seder': 'sedere', 'prender': 'prendere', 'scender': 'scendere', 'intrar': 'entrare',
    'gir': 'andare', 'ir': 'andare', 'andavam': 'andare', 'temer': 'temere',
    'lagrimar': 'lagrimare', 'ristette': 'ristare', 'sentia': 'sentire',
    'uscia': 'uscire', 'convenia': 'convenire', 'convien': 'convenire',
    'aggiugne': 'aggiungere', 'appar': 'apparire', 'surge': 'sorgere', 'riede': 'riedere',
    'attender': 'attendere', 'guardommi': 'guardare', 'volsimi': 'volgere', 'dilli': 'dire',
    'ntese': 'intendere', 'nnanzi': 'innanzi', 'ogn': 'ogni', 'gliel': None,
    'v': 'vedere', "v'è": 'essere', "v'era": 'essere', "t'ho": 'avere',
}

# Dante headwords that must NOT collapse into a modern core word.
KEEP = {
    'lito': ('lito', 'n', 'shore', 'lito = lido'),
}

# Proper names (norm). Grouped separately; not drilled.
NAMES = set('''
virgilio minos minosse caronte cerbero pluto pluto flegias flegiàs argenti farinata
cavalcante francesca paolo ciacco beatrice lucifero gerione malebolge malebranche
cocito stige acheronte flegetonte baratro nesso chirone brunetto latini cavalcanti
bonifazio celestino ugolino ruggieri vanni fucci anteo nembrot briareo lucano
ovidio omero orazio orazio aristotile platone socrate tolomeo avicenna averrois
saladino elettra ettore enea cesare cammilla eurialo turno niso didone cleopatra
elena achille paride tristano lancialotto semiramis capaneo taide interminei
anastasio maometto bertran born mosca curio sinon alberigo belzebu belzebù giuda
bruto cassio caifas caifa tebe troia roma fiorenza firenze pistoia arezzo padova
italia francia navarra mantova pietrapiana guido latino barbariccia dante
ulisse diomede grifone griffolino capocchio mirra gianni schicchi potifar
fariseo israele faraone moise aronne davide maria cristo gesu gesù satana
luca giovanni matteo paolo pietro giuda iscariota semele alcide ercole teseo
arianna fedra pasife minotauro gerion giudecca tolomea antenora caina
malebolge cocito flegetonte leté lete dis dité pluto filippo argenti
pier della vigna capaneo bertran de born gianni schicchi
bocca degli abbati branca doria ugo doria conte ugolino
farfarello calcabrina libicocco draghignazzo ciriatto rubicante
malacoda scapiglio alichino calcabrina
omero orazio ovvidio
saladino
camilla cammilla
fiorenza
malebranche
stigie
nesso
flegias
gerione
anteo
effialte fialte
nembrotto
lucifero
beatrice
virgilio
minosse
caronte
cerbero
ciacco
francesca
farinata
cavalcante
brunetto
ulisse
ugolino
maometto
bertran
vanni
capaneo
pier
vignai
latini
guido
bonifazio
celestino
ruggieri
alberigo
giuda
bruto
cassio
cocito
malebolge
fiorentini
'''.split())

# normalize name set
NAMES = {norm(x) for x in NAMES if x}

CONTENT = {'VER', 'NOUN', 'ADJ', 'ADV', 'NPR'}
SKIP_POS = {'ART', 'ARTPRE', 'CLI', 'PON', 'SENT', 'SYM', 'NUM', 'ASP', 'AUX', 'CAU'}

def pos_rank(p):
    return {'VER': 0, 'NOUN': 1, 'ADJ': 2, 'ADV': 3, 'NPR': 4}.get(p, 8)

def load_morph(path):
    forms = defaultdict(list)
    with open(path, encoding='utf-8', errors='replace') as f:
        for line in f:
            p = line.rstrip('\n').split('\t')
            if len(p) < 3:
                continue
            form, lemma, feat = p[0], p[1], p[2]
            pos = feat.split(':')[0].split('-')[0]
            if pos in ('PON', 'SENT', 'SYM'):
                continue
            forms[norm(form)].append((norm(lemma), lemma, pos, feat))
    return forms

POSMAP = {'VER': 'v', 'NOUN': 'n', 'ADJ': 'adj', 'ADV': 'adv', 'PRO': 'pron', 'DET': 'det', 'PRE': 'prep', 'CON': 'conj', 'INT': 'int', 'WH': 'adv', 'NPR': 'n', 'UNK': 'n'}
FEM_EXCEPT = {'poeta', 'duca', 'collega', 'pianeta', 'sistema', 'problema'}

def write_pack(ge3, unk, low):
    gloss_path = ROOT / 'tools' / 'dante_en.tsv'
    gloss = {}
    if gloss_path.exists():
        for line in gloss_path.read_text(encoding='utf-8').splitlines():
            if not line.strip() or line.startswith('#'):
                continue
            p = line.split('\t')
            gloss[norm(p[0])] = p
    missing = []
    words = []
    seen = set()
    rows = list(ge3) + [o for o in unk if o.count >= 3]
    rows.sort(key=lambda o: (-o.count, o.surface.lower()))
    rank = 0
    for o in rows:
        key = norm(o.surface)
        if key in seen:
            continue
        seen.add(key)
        g = gloss.get(key)
        if not g:
            missing.append(o.surface)
            continue
        it, pos, en = g[0], g[1], g[2]
        note = g[3] if len(g) > 3 and g[3] not in ('', '-') else ''
        gender = g[4] if len(g) > 4 and g[4] not in ('', '-') else ''
        name = (len(g) > 5 and g[5] == 'name') or (o.name and o.pos == 'NPR')
        if name and o.pos == 'NPR' and key in ('ripa', 'esso'):
            name = False
        rank += 1
        w = {
            'id': it.replace(' ', '-'),
            'it': it,
            'en': en,
            'pos': pos,
            'rank': rank,
            'freq': o.count,
            'count': o.count,
            'ref': '%d.%d' % (o.first[0], o.first[1]),
            'canto': o.first[0],
            'line': o.first[1],
        }
        if note:
            w['note'] = note
            w['nodrill'] = True
        if name:
            w['name'] = True
            w['group'] = 'name'
            w['nodrill'] = True
        elif pos == 'n' and gender in ('m', 'f'):
            w['g'] = gender
        elif pos == 'n' and not name:
            if it.endswith('a') and norm(it) not in FEM_EXCEPT:
                w['g'] = 'f'
            elif it.endswith('o'):
                w['g'] = 'm'
        if w.get('nodrill') is not True and pos == 'v':
            w['conj'] = 'ere' if it.endswith('rre') else it[-3:]
            w['aux'] = 'a'
        words.append(w)
    if missing:
        print('MISSING GLOSSES', len(missing))
        print('\n'.join(missing[:80]))
        sys.exit(1)
    # nodrill verbs/adjs whose shape the engine cannot read; nouns with gender stay drillable
    for w in words:
        if w.get('nodrill'):
            continue
        if w['pos'] == 'v' and w.get('conj') not in ('are', 'ere', 'ire'):
            w['nodrill'] = True
        elif w['pos'] == 'adj':
            w['nodrill'] = True
        elif w['pos'] == 'n' and 'g' not in w:
            w['nodrill'] = True
        elif w['pos'] not in ('v', 'n'):
            w['nodrill'] = True
    pack = ROOT / 'data' / 'packs' / 'dante'
    pack.mkdir(parents=True, exist_ok=True)
    (pack / 'words.json').write_text(json.dumps(words, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    import subprocess
    subprocess.check_call(['node', str(ROOT / 'tools' / 'dante_drill.js'), str(pack / 'words.json')])
    words = json.loads((pack / 'words.json').read_text(encoding='utf-8'))
    man = {
        'id': 'dante',
        'title': 'Dante (Inferno)',
        'desc': 'Lemmas from the Inferno that are not in the core 1,500 and occur at least three times, plus names.',
        'lang': 'it',
        'version': 1,
        'words': 'words.json',
        'count': len(words),
        'license': 'CC BY-SA 4.0',
        'sources': [
            {'name': 'Inferno text: Project Gutenberg eBook #997 (public domain in the USA)', 'url': 'https://www.gutenberg.org/ebooks/997', 'license': 'Public domain in the USA'},
            {'name': 'Morph-it! 0.4.8 (lemmatization)', 'url': 'https://docs.sslmit.unibo.it/doku.php?id=resources:morph-it', 'license': 'CC BY-SA 2.0 / LGPL'},
            {'name': 'English glosses written for this app', 'license': 'CC BY-SA 4.0'}
        ]
    }
    (pack / 'manifest.json').write_text(json.dumps(man, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    excluded = []
    for o in low:
        if o.count < 1 or o.count > 2:
            continue
        if len(o.surface) < 3:
            continue
        key = norm(o.surface)
        if key in seen or key in {norm(w['it']) for w in json.load(open(CORE, encoding='utf-8'))}:
            continue
        g = gloss.get(key)
        item = {'it': g[0] if g else o.surface, 'count': o.count, 'ref': '%d.%d' % (o.first[0], o.first[1])}
        if g and len(g) > 2 and g[2]:
            item['en'] = g[2]
        excluded.append(item)
    # de-dupe excluded
    ex = []
    esk = set()
    for item in sorted(excluded, key=lambda x: (-x['count'], x['it'])):
        k = norm(item['it'])
        if k in esk:
            continue
        esk.add(k)
        ex.append(item)
    (ROOT / 'data' / 'dante-excluded.json').write_text(json.dumps(ex, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    lines = ['# Inferno lemmas left out (count 1–2)', '',
             'Lemmas attested in the Inferno that are not in the core 1,500 and occur only once or twice. They are not cards.',
             '', 'Count: %d.' % len(ex), '',
             '| Lemma | Count | First | Gloss |', '| --- | --- | --- | --- |']
    for item in ex:
        lines.append('| %s | %d | %s | %s |' % (item['it'], item['count'], item['ref'], item.get('en', '')))
    (ROOT / 'docs').mkdir(exist_ok=True)
    (ROOT / 'docs' / 'dante-excluded.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print('wrote', len(words), 'pack words;', len(ex), 'excluded')

def main():
    if MORPH is None or not MORPH.exists():
        sys.exit('pass the Morph-it! utf8 lexicon path')
    core = json.load(open(CORE, encoding='utf-8'))
    core_norm = {norm(w['it']): w for w in core}
    print('loading morph-it', MORPH)
    forms = load_morph(MORPH)
    print('forms', len(forms))

    raw = (ROOT / 'data' / 'dante' / 'pg997.txt').read_text(encoding='utf-8') if (ROOT / 'data' / 'dante' / 'pg997.txt').exists() else open(
        '/home/ubuntu/.cursor/projects/agent-repos-italiano-1500/agent-tools/e4436a00-ed62-4d82-9330-ec0ff14a9819.txt', encoding='utf-8').read()
    body = raw[raw.find('*** START'):raw.find('*** END')]
    m = re.search(r'\nInferno\s*\nCanto I\s*\n', body)
    body = body[m.start():]
    parts = re.split(r'\nInferno\s*\nCanto ([IVXLC]+)\s*\n', body)
    ROM = {r: i for i, r in enumerate(
        ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX',
         'XXI','XXII','XXIII','XXIV','XXV','XXVI','XXVII','XXVIII','XXIX','XXX','XXXI','XXXII','XXXIII','XXXIV'], 1)}
    WORD = re.compile(r"[A-Za-zÀ-ÿ]+(?:['’][A-Za-zÀ-ÿ]+)*|['’][A-Za-zÀ-ÿ]+")
    CLIT = re.compile(r"^(?:un|gl|ch|all|c|l|d|s|n|m)'(.+)$", re.I)

    class Info:
        def __init__(self, surface, pos):
            self.surface = surface
            self.pos = pos
            self.count = 0
            self.first = None
            self.forms = defaultdict(int)
            self.name = False

    lemmas = {}
    unknown = defaultdict(lambda: [0, None])

    def touch(key, surface, pos, canto, line, form, name=False):
        o = lemmas.get(key)
        if o is None:
            o = Info(surface, pos)
            lemmas[key] = o
        o.count += 1
        o.forms[form] += 1
        if name:
            o.name = True
        if o.first is None:
            o.first = (canto, line)

    def expansions(raw):
        t = raw.lower().replace('’', "'").replace('ï', 'i').replace('ë', 'e')
        out = [t]
        if t.endswith("'"):
            stem = t[:-1]
            out += [stem + s for s in 'eaio']
        base = t.strip("'")
        if base and base[-1] not in 'aeiouàèéìòù':
            out += [base + s for s in 'eoai']
        if base.endswith('ea'):
            out.append(base[:-2] + 'eva')
        if base.endswith('ia'):
            out.append(base[:-2] + 'iva')
        seen = []
        for x in out:
            if x not in seen:
                seen.append(x)
        return seen

    def resolve(token):
            raw = token.lower().replace('’', "'").replace('ï', 'i').replace('ë', 'e')
            if norm(raw) in TO_CORE_OR_HEAD or raw in TO_CORE_OR_HEAD:
                dest = TO_CORE_OR_HEAD.get(raw, TO_CORE_OR_HEAD.get(norm(raw)))
                if dest is None:
                    return None
                dn = norm(dest)
                if dn in core_norm:
                    return None
                return (dn, dest, None, dn in NAMES)
            cands_surf = expansions(raw)
            adopted = None
            for surf in cands_surf:
                n = norm(surf)
                if len(n) <= 1 and n not in ('e', 'a', 'o', 'i'):
                    continue
                if n in core_norm:
                    return None
                readings = forms.get(n) or []
                if any(c[0] in core_norm and c[2] in ('VER', 'NOUN', 'ADJ', 'ADV', 'AUX') for c in readings):
                    return None
                if adopted is None and readings and surf != raw:
                    content = [c for c in readings if c[2] in ('VER', 'NOUN', 'ADJ', 'ADV')]
                    if content:
                        content.sort(key=lambda c: (0 if c[0] == n else 1, pos_rank(c[2])))
                        adopted = content[0]
            if adopted and not forms.get(norm(raw.strip("'"))):
                lemma, display, pos, feat = adopted
                if lemma in core_norm:
                    return None
                name = lemma in NAMES or pos == 'NPR'
                return (lemma, display, pos, name)
            t = raw.strip("'")
            if not t or t.isdigit() or (len(norm(t)) <= 1 and norm(t) not in ('e', 'a', 'o', 'i')):
                return None
            n = norm(t)
            if n in TO_CORE_OR_HEAD:
                dest = TO_CORE_OR_HEAD[n]
                if dest is None:
                    return None
                dn = norm(dest)
                if dn in core_norm:
                    return None
                return (dn, dest, None, dn in NAMES)
            # trailing elision: com' -> come
            if t.endswith("'"):
                stem = t[:-1]
                for suf in ('e', 'a', 'i', 'o'):
                    hit = norm(stem + suf)
                    if hit in core_norm or hit in forms:
                        t = stem + suf
                        n = norm(t)
                        break
            # archaic imperfect avea -> aveva
            if n.endswith('ea') and norm(t[:-2] + 'eva') in forms:
                t = t[:-2] + 'eva'
                n = norm(t)
            if n in core_norm:
                return None
            cands = forms.get(n) or []
            if not cands:
                return ('UNK', t, 'UNK', n in NAMES)
            core_hits = [c for c in cands if c[0] in core_norm]
            if core_hits:
                return None
            # drop articles and articulated prepositions
            if all(c[2] in ('ART', 'ARTPRE') for c in cands):
                return None
            content = [c for c in cands if c[2] in ('VER', 'NOUN', 'ADJ', 'ADV', 'NPR')]
            use = content or cands
            use.sort(key=lambda c: (0 if c[0] == n else 1, pos_rank(c[2]), 0 if c[2] != 'NPR' else 1))
            # prefer a non-name reading when both exist (de = preposition)
            non = [c for c in use if c[2] != 'NPR']
            if non:
                use = non
            lemma, display, pos, feat = use[0]
            if pos in SKIP_POS or pos in ('CON', 'PRE', 'PRO', 'DET', 'INT', 'WH') and lemma in core_norm:
                return None
            if pos in ('ART', 'ARTPRE'):
                return None
            # function words that are just variants
            if pos in ('CON', 'CLI') and lemma in ('e', 'ed', 'o', 'che', 'se', 'ma'):
                return None
            name = lemma in NAMES or pos == 'NPR' and lemma not in core_norm and len(lemma) > 2
            # NPR that is really a common word we failed to map: skip short function-like
            if pos == 'NPR' and lemma in ('de', 'al', 'del', 'el', 'di'):
                return None
            return (lemma, display if display[:1].islower() or pos == 'NPR' else display, pos, name or lemma in NAMES)

    i = 1
    verses = []
    while i < len(parts):
        canto = ROM[parts[i]]
        chunk = parts[i + 1]
        i += 2
        lines = [ln.strip() for ln in chunk.splitlines() if ln.strip()]
        for ln, line in enumerate(lines, 1):
            verses.append(f'{canto}.{ln}\t{line}')
            for mtok in WORD.finditer(line):
                rawtok = mtok.group(0)
                low = rawtok.replace('’', "'")
                mm = CLIT.match(low)
                if mm:
                    low = mm.group(1)
                got = resolve(low)
                # Inf. 28.22 veggia is a cask, not the verb vedere.
                if canto == 28 and ln == 22 and norm(low) == 'veggia':
                    got = ('veggia', 'veggia', 'NOUN', False)
                if not got:
                    continue
                key, display, pos, name = got
                if key == 'UNK':
                    touch('unk:' + norm(display), display, 'UNK', canto, ln, norm(display), name)
                else:
                    touch(key, display, pos, canto, ln, norm(low), name)

    TEXT.parent.mkdir(parents=True, exist_ok=True)
    # don't overwrite a curated text here; verses written separately
    items = [o for k, o in lemmas.items() if not k.startswith('unk:')]
    unk = [o for k, o in lemmas.items() if k.startswith('unk:')]
    ge3 = sorted([o for o in items if o.count >= 3], key=lambda o: -o.count)
    print('known lemmas', len(items), '>=3', len(ge3), 'unknown types', len(unk))
    print('--- >=3 not core ---')
    for o in ge3:
        print(f'{o.count:4} {o.first[0]}.{o.first[1]:<4} {o.pos or "":5} {o.surface}')
    print('--- unknown >=3 ---')
    for o in sorted(unk, key=lambda o: -o.count):
        if o.count >= 3:
            print(f'{o.count:4} {o.first[0]}.{o.first[1]:<4} {o.surface}')
    print('unknown >=3', sum(1 for o in unk if o.count >= 3), 'unknown 1-2', sum(1 for o in unk if o.count < 3))
    def dump(oset):
        out = []
        for o in oset:
            out.append({'it': o.surface, 'pos': o.pos, 'count': o.count,
                        'canto': o.first[0], 'line': o.first[1], 'name': o.name,
                        'forms': o.forms})
        return out
    json.dump(dump(ge3), open('/tmp/dante_ge3.json','w'), ensure_ascii=False)
    json.dump(dump([o for o in items if o.count < 3] + [o for o in unk if o.count < 3]), open('/tmp/dante_lt.json','w'), ensure_ascii=False)
    json.dump(dump([o for o in unk if o.count >= 3]), open('/tmp/dante_unk.json','w'), ensure_ascii=False)
    # Verse text with standard line numbers (canto.line).
    (ROOT / 'data' / 'dante').mkdir(parents=True, exist_ok=True)
    (ROOT / 'data' / 'dante' / 'inferno.txt').write_text('\n'.join(verses) + '\n', encoding='utf-8')
    write_pack(ge3, unk, [o for o in items if o.count < 3] + [o for o in unk if o.count < 3])

if __name__ == '__main__':
    main()
