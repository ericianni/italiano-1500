"""Extract Morph-it! noun genders/plurals and adjective forms for the core headwords into a small test fixture.
Morph-it! (Zanchetta & Baroni) is dual-licensed CC BY-SA 2.0 / LGPL. Usage: python3 tools/make_morphit_fixture.py /path/morphit.txt"""
import sys, json, collections
words = set(l.split('\t')[0] for l in open('tools/src/core.tsv', encoding='utf-8') if l.strip() and not l.startswith('#'))
out = collections.defaultdict(lambda: {'ng': [], 'npl': [], 'adj': []})
for line in open(sys.argv[1], encoding='utf-8', errors='replace'):
    p = line.rstrip('\n').split('\t')
    if len(p) != 3: continue
    form, lem, tag = p
    if lem not in words: continue
    if tag.startswith('NOUN-'):
        g = tag[5]; num = tag.split(':')[1] if ':' in tag else ''
        d = out[lem]
        if num == 's' and form == lem and g not in d['ng']: d['ng'].append(g)
        if num == 'p' and [form, g] not in d['npl']: d['npl'].append([form, g])
    elif tag.startswith('ADJ:pos+'):
        gn = tag.split('+')[1] + tag.split('+')[2]
        if [form, gn] not in out[lem]['adj']: out[lem]['adj'].append([form, gn])
json.dump({k: v for k, v in sorted(out.items())}, open('tests/fixtures/morphit.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(out))
