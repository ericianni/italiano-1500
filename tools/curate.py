#!/usr/bin/env python3
"""Step 3: hand curation on top of the computed candidates.
REDIRECT moves a headword's count onto the right headword (spurious lemmas left by homographs);
None drops it (vulgarities, English words, names, subtitle credits, interjections that are only sounds).
Run: python3 tools/curate.py [build/candidates.tsv] > build/ranked.tsv"""
import sys
import collections
REDIRECT = {
 # homograph leftovers
 'sconoscere': 'sconosciuto', 'libare': 'libero', 'bianca': 'bianco', 'piena': 'pieno', 'gelare': 'gelato', 'peccare': 'peccato',
 'solere': 'solito', 'privare': 'privato', 'scorrere': 'scorso', 'esigere': 'esatto', 'addossare': 'addosso', 'eccoci': 'ecco',
 'eccoti': 'ecco', 'dannare': 'dannato', 'cavare': None, 'incinto': 'incinta', 'spiacere': 'dispiacere', 'mila': 'mille',
 'disperare': 'disperato', 'complicare': 'complicato', 'arrabbiare': 'arrabbiato', 'innamorato': 'innamorare', 'fidanzato': 'fidanzato',
 'appassionare': 'appassionato', 'sposato': 'sposare', 'occhiale': 'occhiali', 'pantalone': 'pantaloni', 'capello': 'capelli',
 'soldo': 'soldi', 'congratulazione': 'congratulazioni', 'contante': 'contanti', 'malapena': None, 'frattempo': None,
 'pero': 'però', 'citta': 'città', 'meta': 'metà', 'pur': 'pure', 'sedere': 'sedere', 'conta': None, 'tratta': 'trattare',
 'previsto': 'prevedere', 'liso': None, 'fallo': None, 'caccia': 'caccia', 'finta': 'finta', 'scomparsa': 'scomparire',
 'compitare': 'compito', 'contrattare': 'contratto', 'isolare': 'isola', 'qualcun': 'qualcuno', 'eccolo': 'ecco',
 'universo': 'universo', 'seduta': 'seduta', 'drogare': 'droga', 'assassinare': 'assassinare', 'tornata': None,
 'fallare': None, 'cristo': None, 'sia': 'essere', 'fosse': 'essere', 'esercire': 'esercito', 'compire': 'compito', 'contrarre': 'contratto', 'rodere': None, 'alare': 'ala',
 'scopare': None, 'don': None, 'menu': 'menù', 'universo': 'universo',
 # vulgar / English / names / credits / pure sounds
 'tetta': None, 'lady': None, 'city': None, 'baby': None, 'team': None, 'band': None, 'lord': None, 'killer': None, 'partner': None,
 'weekend': None, 'internet': 'internet', 'super': None, 'okay': None, 'boss': None, 'sir': None, 'york': None, 'los': None, 'jack': None,
 'beh': 'beh', 'mamma_mia': None, 'gay': None, 'cazzata': None, 'stronzo': None, 'puttana': None, 'bastardo': None, 'sbirro': None,
 'figo': None, 'casino': 'casino', 'cavolo': 'cavolo', 'diavolo': 'diavolo', 'glielo': None, 'ehi': None, 'uh': None, 'bla': None, 'hey': None,
}
rows = [l.rstrip('\n').split('\t') for l in open(sys.argv[1] if len(sys.argv) > 1 else 'build/candidates.tsv', encoding='utf-8')]
count = collections.Counter(); info = {}
for r in rows:
    hw = REDIRECT.get(r[1], r[1])
    if hw is None: continue
    count[hw] += int(r[3])
    if hw not in info or hw == r[1]: info[hw] = r
for i, (hw, n) in enumerate(count.most_common()):
    r = info[hw]
    print(f'{i+1}\t{hw}\t{r[2]}\t{n}\t{r[4]}\t{r[5] if len(r) > 5 else ""}')
