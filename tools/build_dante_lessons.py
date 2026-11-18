#!/usr/bin/env python3
"""Build lang/it/dante_lessons.js. Verse lines are copied from data/dante/inferno.txt."""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEXT = {}
for raw in (ROOT / 'data/dante/inferno.txt').read_text(encoding='utf-8').splitlines():
    if not raw.strip():
        continue
    ref, verse = raw.split('\t', 1)
    c, n = ref.split('.')
    TEXT[(int(c), int(n))] = verse

ACC = str.maketrans('àèéìòùáíóúäëïöü', 'aeeiouaiouaeiou')

def norm(s):
    s = s.lower().replace('’', "'").replace('ï', 'i').replace('ë', 'e').replace('ü', 'u').replace('ö', 'o')
    return s.translate(ACC)

INFO = {}
for pack in ('core', 'dante'):
    for w in json.loads((ROOT / 'data/packs' / pack / 'words.json').read_text(encoding='utf-8')):
        INFO[norm(w['it'])] = w  # core loaded second, so it wins a tie

LINK_POS = {'n', 'v', 'adj', 'adv', 'int', 'num'}
WORD = re.compile(r"[A-Za-zÀ-ÿ0-9]+(?:['’][A-Za-zÀ-ÿ0-9]+)*|['’][A-Za-zÀ-ÿ0-9]+")
missing = []
thin = []

def row(s):
    out = []
    for part in s.split(' | '):
        if '=' not in part:
            sys.exit('bad gloss token: ' + part)
        t, rest = part.split('=', 1)
        lemma = ''
        if '@' in rest:
            rest, lemma = rest.rsplit('@', 1)
        item = {'t': t.replace("'", '\u2019'), 'e': rest}
        if lemma:
            w = INFO.get(norm(lemma))
            if not w:
                missing.append(lemma)
            elif w.get('name') or w.get('pos') in LINK_POS:
                item['to'] = w['it']
            else:
                missing.append(lemma + ' (not a content word: ' + w.get('pos', '') + ')')
        out.append(item)
    return out

def Q(start, en, *rows, note=None):
    gloss = [row(r) for r in rows]
    return {'start': start, 'en': en, 'gloss': gloss, 'note': note}

ROM = 'I II III IV V VI VII VIII IX X XI XII XIII XIV XV XVI XVII XVIII XIX XX XXI XXII XXIII XXIV XXV XXVI XXVII XXVIII XXIX XXX XXXI XXXII XXXIII XXXIV'.split()

def canto(n, summary, plot, quotes):
    built = []
    for q in quotes:
        lines = []
        for i in range(len(q['gloss'])):
            key = (n, q['start'] + i)
            if key not in TEXT:
                sys.exit('missing line %s.%s' % key)
            lines.append(TEXT[key])
            words = WORD.findall(TEXT[key])
            if len(q['gloss'][i]) + 1 < len(words):
                thin.append('%s.%s (%s toks, %s words) %s' % (n, q['start'] + i, len(q['gloss'][i]), len(words), TEXT[key]))
        item = {'canto': n, 'start': q['start'], 'lines': lines, 'gloss': q['gloss'], 'en': q['en']}
        if q.get('note'):
            item['note'] = q['note']
        built.append(item)
    if not (2 <= len(built) <= 3):
        sys.exit('canto %s has %s passages' % (n, len(built)))
    sents = re.findall(r'[.!?](?:\s|$)', plot)
    if not (1 <= len(sents) <= 2):
        sys.exit('plot sentences %s: %s :: %s' % (n, len(sents), plot))
    return {
        'id': 'd-%d' % n, 'read': True, 'canto': n, 'sec': 'Inferno',
        'title': 'Canto ' + ROM[n - 1], 'sum': summary, 'plot': plot, 'quotes': built,
    }

# Lessons are filled in by the rest of this file's DATA list below.
DATA = []

def emit():
    lang = {
        'id': 'd-lang', 'read': True, 'sec': 'Dante',
        'title': "Dante's Italian",
        'sum': 'Old verbs, longer endings, dropped vowels, and pronouns on the verb.',
        'body': (
            '<p>Dante writes the Italian of the early 1300s. Most of the words are ones you already study. A few habits are different.</p>'
            '<p><b>Old verb forms.</b> <i lang="it">fia</i> and <i lang="it">fie</i> mean sarà. <i lang="it">fue</i> means fu. <i lang="it">avea</i> and <i lang="it">avean</i> mean aveva and avevano. <i lang="it">veggio</i> and <i lang="it">veggendo</i> mean vedo and vedendo.</p>'
            '<p><b>Longer endings.</b> Where modern Italian has <i lang="it">-à</i> or <i lang="it">-ù</i>, Dante often writes <i lang="it">-ate</i>, <i lang="it">-ade</i>, or <i lang="it">-ute</i>. <i lang="it">pietate</i> is pietà, <i lang="it">virtute</i> is virtù, and <i lang="it">bontate</i> is bontà.</p>'
            '<p><b>Dropped vowels.</b> A word often loses its last vowel before the next word. <i lang="it">cammin</i> is cammino, <i lang="it">amor</i> is amore, <i lang="it">cor</i> is cuore, and <i lang="it">uom</i> is uomo.</p>'
            '<p><b>Pronouns on the verb.</b> A pronoun can stick to the end. <i lang="it">fecemi</i> is mi fece, <i lang="it">porsila</i> is la porsi, and <i lang="it">vagliami</i> is mi valga. It can also sit in front, joined by an apostrophe: <i lang="it">m’ha</i> is mi ha, and <i lang="it">ch’i’</i> is che io.</p>'
            '<p class="small muted">In the cantos, an underlined word opens that card.</p>'
        ),
        'tables': [{
            't': 'rows', 'title': 'Dante and modern',
            'head': ['Dante', 'Modern'],
            'rows': [['fia', 'sarà'], ['fue', 'fu'], ['avea', 'aveva'], ['veggio', 'vedo'],
                     ['pietate', 'pietà'], ['virtute', 'virtù'], ['cammin', 'cammino'], ['fecemi', 'mi fece']],
        }],
    }
    lessons = [lang] + DATA
    if len(lessons) != 35:
        sys.exit('expected 35 lessons, got %s' % len(lessons))
    if thin:
        sys.exit('thin glosses:\n' + '\n'.join(thin))
    if missing:
        sys.exit('unknown link lemmas:\n' + '\n'.join(sorted(set(missing))))
    out = ROOT / 'lang/it/dante_lessons.js'
    body = json.dumps(lessons, ensure_ascii=False, indent=1)
    out.write_text(
        '/* Dante readings for Learn. Shown only when the Dante pack is on.\n'
        '   Quoted lines are copied from data/dante/inferno.txt. */\n'
        '(function (root) {\n'
        "  'use strict';\n"
        '  const L = ' + body + ';\n'
        '  root.DANTE_LESSONS = L;\n'
        "  if (typeof module === 'object' && module.exports) module.exports = L;\n"
        "})(typeof self !== 'undefined' ? self : this);\n",
        encoding='utf-8')
    print('wrote', len(lessons), 'lessons,', sum(len(l.get('quotes', [])) for l in lessons), 'passages')

exec(compile((ROOT / 'tools/dante_lesson_gloss.py').read_text(encoding='utf-8'), 'dante_lesson_gloss.py', 'exec'), globals())
emit()
