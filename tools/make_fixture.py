#!/usr/bin/env python3
"""Extract Wiktionary (via kaikki.org, CC BY-SA) reference forms for the ranked headwords into
tests/fixtures/wikt.json, so the morphology tests can cross-check every word offline.
Run: python3 tools/make_fixture.py 1700"""
import json, re, sys
K = json.load(open('build/kaikki.json', encoding='utf-8'))
N = int(sys.argv[1]) if len(sys.argv) > 1 else 1700
heads = [l.split('\t')[1] for l in list(open('build/ranked.tsv', encoding='utf-8'))[:N]]
PERS = [('first-person', 'singular'), ('second-person', 'singular'), ('third-person', 'singular'),
        ('first-person', 'plural'), ('second-person', 'plural'), ('third-person', 'plural')]
def vforms(f, tense):
    out = [[] for _ in range(6)]
    for tag, vals in f.items():
        t = set(tag.split())
        if 'indicative' not in t or tense not in t or 'subjunctive' in t: continue
        if tense == 'present' and (t & {'imperfect', 'future', 'historic', 'past'}): continue
        for i, (p, n) in enumerate(PERS):
            if p in t and n in t: out[i] = list(dict.fromkeys(out[i] + vals))
    return out
def clean(v): return v.replace('’', "'")
out = {}
for hw in heads:
    rec = {}
    for e in K.get(hw, []):
        f = {k: [clean(x) for x in v] for k, v in e['forms'].items()}
        if e['pos'] == 'verb' and 'v' not in rec and f.get('participle past'):
            aux = sorted(set(f.get('auxiliary', [])))
            rec['v'] = {'aux': aux, 'pres': vforms(f, 'present'), 'imp': vforms(f, 'imperfect'), 'fut': vforms(f, 'future'),
                        'pp': list(dict.fromkeys(f.get('participle past', [])))}
        elif e['pos'] == 'noun':
            m = re.match(r'^\S+ (m or f by sense|m or f|m|f)( pl)?\b', e['head'])
            if not m: continue
            g = {'m or f by sense': 'mf', 'm or f': 'm|f'}.get(m.group(1), m.group(1))
            pl = f.get('plural', []) + f.get('masculine plural', []) + f.get('feminine plural', [])
            hd = e['head']
            plg = re.search(r'plural \S+ (m|f)\b', hd)
            rec.setdefault('n', []).append({'g': g, 'pltant': bool(m.group(2)), 'inv': 'invariable' in hd, 'pl': pl,
                                            'plg': plg.group(1) if plg else None, 'head': hd[:120]})
        elif e['pos'] == 'adj' and 'a' not in rec:
            fs = [clean(x) for k, v in e['forms'].items() for x in v]
            rec['a'] = {'inv': 'invariable' in e['head'], 'fs': f.get('feminine singular', []) or f.get('error-unrecognized-form feminine singular', []) or re.findall(r'feminine (?:singular )?(\w+)[,)]', e['head'])[:1],
                        'mp': f.get('masculine plural', []) or f.get('error-unrecognized-form masculine plural', []) or f.get('plural', []),
                        'fp': f.get('feminine plural', []) or f.get('plural', []), 'head': e['head'][:120]}
    if rec: out[hw] = rec
json.dump(out, open('tests/fixtures/wikt.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'), sort_keys=True)
print(len(out), 'headwords')
