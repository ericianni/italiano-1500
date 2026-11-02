#!/usr/bin/env python3
"""Step 2: merge lemma readings into headwords, drop junk, print candidates with a Wiktionary hint.
Run: python3 tools/candidates.py [build/lemmas.tsv] > build/candidates.tsv"""
import sys
import collections, json, re
# (lemma, tag-prefix) -> headword.  Articles, articulated prepositions, elided / apocopated forms, clitic variants.
MAP = {
 ('il','art'):'il', ('la','art'):'il', ("l'",'art'):'il', ('lo','art'):'il', ('i','art'):'il', ('gli','art'):'il', ('le','art'):'il',
 ('un','art'):'un', ('una','art'):'un', ("un'",'art'):'un', ('uno','art'):'un', ('una','pro-indef'):'uno',
 ('del','artpre'):'di', ('della','artpre'):'di', ("dell'",'artpre'):'di', ("dell'",'art'):'di', ('della','art'):'di', ("d'",'pre'):'di',
 ('al','artpre'):'a', ('alla','artpre'):'a', ("all'",'artpre'):'a', ('ad','pre'):'a',
 ('dal','artpre'):'da', ('dalla','artpre'):'da', ("dall'",'artpre'):'da',
 ('nel','artpre'):'in', ('nella','artpre'):'in', ("nell'",'artpre'):'in',
 ('sul','artpre'):'su', ('sulla','artpre'):'su', ("sull'",'artpre'):'su',
 ('col','artpre'):'con', ('ed','con'):'e', ('od','con'):'o',
 ("l'",'pro'):'lo', ("c'",'adv'):'ci', ('ce','pro'):'ci', ('ce','ce'):'ci', ('ci','ci'):'ci', ('ci','adv'):'ci',
 ('se','pro'):'si', ('si','si'):'si', ('ve','pro'):'vi', ('vi','adv'):'vi', ('ne','ne'):'ne',
 ('nessun','det'):'nessuno', ('alcun','det'):'alcuno', ('buon','adj'):'buono', ('bel','adj'):'bello', ('qual','adj'):'quale',
 ('ben','adv'):'bene', ("anch'",'adv'):'anche', ('gran','adj'):'grande', ('tal','adj'):'tale', ('san','adj'):'santo',
 ('signor','noun'):'signore', ("po'",'pro'):"po'", ('mo','adv'):None, ('okay','adv'):None,
 ('del','art'):'di', ("n'",'ne'):'ne', ('fin','pre'):'fino', ('qualcun','adj'):'qualcuno', ("be'",'int'):'beh', ('miglior','adj'):'migliore',
 ('eccolo','adv'):'ecco', ('eccola','adv'):'ecco', ('eccoli','adv'):'ecco', ('eccomi','adv'):'ecco', ('dimmi','verb'):'dire', ('caffo','adj'):'caffè',
 ('unica','noun'):'unico', ('ultima','noun'):'ultimo', ('vecchia','noun'):'vecchio', ('incinto','adj'):'incinta', ('glielo','pro'):None,
 ('amica','noun'):'amico', ('bambina','noun'):'bambino', ('citta','noun'):'città', ('diro','adj'):'dire', ('sant','adj'):'santo',
 ('quel','det'):'quello', ('quest','det'):'questo', ('grand','adj'):'grande', ('com','wh'):'come', ('dov','wh'):'dove',
}
DROP = set('''ok okay oh ah eh ehi uh uhm hm mh wow hey ehm oddio cazzo merda stronzo stronza fottere fottuto cazzata puttana bastardo
traduzione sottotitolo revisione synchro subsfactory italiansubs resync tv mr mrs miss sir mamma_mia
o.k. yeah yes hi culo stronzata coglione fanculo vaffanculo porco cazzone troia figa sfigato incazzare fottutamente
de new bob mister college show dna sexy uhm mmm'''.split())
best = collections.defaultdict(float); pos = collections.defaultdict(collections.Counter); forms = collections.defaultdict(collections.Counter)
for line in open(sys.argv[1] if len(sys.argv) > 1 else 'build/lemmas.tsv', encoding='utf-8'):
    l, p, n, fs = line.rstrip('\n').split('\t'); n = int(n)
    t = p.split('-')[0] if not p.startswith(('pro', 'det', 'art')) else p.rsplit('-', 0)[0]
    hw = l
    for (ml, mp), h in MAP.items():
        if ml == l and p.startswith(mp): hw = h; break
    if hw is None or hw in DROP: continue
    best[hw] += n; pos[hw][p] += n
    for f in fs.split(): forms[hw][f] += 1
K = json.load(open('build/kaikki.json', encoding='utf-8'))
for i, (hw, n) in enumerate(sorted(best.items(), key=lambda x: -x[1])[:int(sys.argv[2]) if len(sys.argv) > 2 else 2600]):
    ps = ','.join(p for p, _ in pos[hw].most_common(3))
    k = K.get(hw, [])
    hint = ' || '.join(f"{e['pos']}: {e['head'][:60]} :: {'; '.join(e['gl'][:2])[:110]}" for e in k[:3])
    print(f"{i+1}\t{hw}\t{ps}\t{round(n)}\t{' '.join(list(forms[hw])[:4])}\t{hint}")
