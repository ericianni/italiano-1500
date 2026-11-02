#!/usr/bin/env python3
"""Extract a compact reference from the Wiktextract dump of English Wiktionary (Italian entries, kaikki.org, CC BY-SA).
Used only to check our hand-written data (genders, plurals, conjugations) and as a reference when writing glosses.
Run: python3 tools/kaikki_extract.py /workspace/itsrc/kaikki-it.jsonl build/lemmas.tsv > build/kaikki.json"""
import sys, json, unicodedata
want = {l.split('\t')[0] for l in open(sys.argv[2], encoding='utf-8')}
KEEP_ACC = {'è', 'é', 'à', 'ì', 'ò', 'ù', 'í', 'ó', 'ú'}
def plain(w):
    """Strip Wiktionary stress marks: keep an accent only on the final vowel of a polysyllable (andrò, città),
    or on monosyllables that are written with one (è, dà, sì, già, può...)."""
    if not w: return w
    out = []
    for i, ch in enumerate(w):
        d = unicodedata.normalize('NFD', ch)
        if len(d) > 1 and d[0] in 'aeiou' and i != len(w) - 1: ch = d[0]
        out.append(ch)
    w = ''.join(out)
    vowels = sum(1 for c in unicodedata.normalize('NFD', w) if c in 'aeiou')
    if vowels == 1 and w not in MONO_ACC and w[-1] not in 'aeiou':
        w = w[:-1] + unicodedata.normalize('NFD', w[-1])[0]
    return w
MONO_ACC = {'è', 'é', 'dà', 'sì', 'sé', 'né', 'là', 'lì', 'più', 'già', 'può', 'ciò', 'giù', 'tè', 'scià', 'piè'}
out = {}
for line in open(sys.argv[1], encoding='utf-8'):
    d = json.loads(line)
    w = d.get('word')
    if w not in want or d.get('lang_code') != 'it': continue
    senses = [s for s in d.get('senses', []) if 'form_of' not in s and 'alt_of' not in s and s.get('glosses')]
    formof = [s for s in d.get('senses', []) if 'form_of' in s]
    e = {'pos': d['pos'], 'head': (d.get('head_templates') or [{}])[0].get('expansion', ''),
         'gl': [('(' + ', '.join(t for t in s.get('tags', []) if t not in ('masculine','feminine')) + ') ' if s.get('tags') else '') + s['glosses'][-1] for s in senses[:6]],
         'formof': [f['word'] for s in formof for f in s['form_of']][:3]}
    fs = {}
    for f in d.get('forms', []):
        t = tuple(sorted(f.get('tags', [])))
        if 'table-tags' in t or 'inflection-template' in t: continue
        fs.setdefault(' '.join(t), []).append(plain(f['form']))
    e['forms'] = fs
    if not senses and not formof: continue
    out.setdefault(w, []).append(e)
json.dump(out, sys.stdout, ensure_ascii=False)
