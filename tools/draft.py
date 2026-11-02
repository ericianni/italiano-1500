#!/usr/bin/env python3
"""One-off helper: draft rows for tools/src/core.tsv from Wiktionary heads, to be corrected by hand."""
import json, re, sys
K = json.load(open('build/kaikki.json', encoding='utf-8'))
N = int(sys.argv[1]) if len(sys.argv) > 1 else 1500
P = {'noun': 'n', 'verb': 'v', 'adj': 'adj', 'adv': 'adv', 'prep': 'prep', 'conj': 'conj', 'pron': 'pron', 'article': 'art', 'det': 'det',
     'num': 'num', 'intj': 'int', 'contraction': 'prep', 'phrase': 'phr', 'name': 'name'}
for line in list(open('build/ranked.tsv', encoding='utf-8'))[:N]:
    r = line.rstrip('\n').split('\t'); hw, mpos = r[1], r[2].split(',')[0]
    want = {'noun': 'noun', 'verb': 'verb', 'adj': 'adj', 'adv': 'adv'}.get(mpos.split('-')[0], None)
    es = K.get(hw, [])
    es2 = [e for e in es if e['pos'] == want] or [e for e in es if e['pos'] not in ('name',)] or es
    e = es2[0] if es2 else {'pos': mpos, 'head': '', 'gl': [], 'forms': {}}
    pos = P.get(e['pos'], e['pos']); g = ''
    if pos == 'n':
        h = e['head']
        m = re.match(r'^\S+ (m or f|m|f|mf)( pl)?\b', h)
        g = (m.group(1).replace('m or f', 'mf') + (' pl' if m.group(2) else '')) if m else '?'
        if 'invariable' in h: g += ' inv'
        else:
            pl = e['forms'].get('plural', [])
            if pl: g += ' pl:' + '/'.join(dict.fromkeys(pl))
    elif pos == 'v':
        aux = e['forms'].get('auxiliary', [])
        a = '/'.join(sorted(set('a' if x == 'avere' else 'e' if x == 'essere' else x for x in aux))) or '?'
        p1 = e['forms'].get('first-person indicative present singular', [''])[0]
        conj = 'isc' if p1.endswith('isco') and hw.endswith('ire') else hw[-3:] if hw[-3:] in ('are', 'ere', 'ire') else hw[-4:]
        pp = e['forms'].get('participle past', [''])[0]
        g = f'{conj} {a} pp:{pp} 1s:{p1}'
    elif pos == 'adj':
        h = e['head']
        g = 'inv' if 'invariable' in h else re.sub(r'^\S+ ', '', h)[:70]
    gl = '; '.join(e['gl'][:3])
    print(f"{r[0]}\t{hw}\t{pos}\t{g}\t{gl[:150]}")
