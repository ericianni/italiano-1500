#!/usr/bin/env python3
"""Step 0 (news side): turn Leipzig Corpora Collection word lists into a lowercase form-frequency list
in the same 'form count' format as FrequencyWords, so tools/lemmatize.py can read it.

Input:  one or more *-words.txt files (id, word, count) from Leipzig news corpora, e.g. ita_news_2023_1M and
        ita_news_2024_1M (https://wortschatz.uni-leipzig.de/en/download/Italian, CC BY 4.0).
Output: 'form count' lines sorted by count (stdout).

- Leipzig keeps elided articles and prepositions attached (l'uomo, dell'anno, c'è): they are split into
  the elided word (l', dell', c') and the following word, as the subtitle list already has them.
- Leipzig keeps case. A word's capitalized count (sentence starts, headlines) is added only up to its
  lowercase count, so surnames and places that are also common words (Meloni 'melons', Conte, Rossi, Monti)
  are not counted as the common word.
Run: python3 tools/leipzig_forms.py /workspace/itsrc/leipzig/*/*-words.txt > build/news_forms.txt"""
import sys, re, collections, unicodedata
low = collections.Counter(); cap = collections.Counter()
WORD = re.compile(r"^[a-zàèéìíòóùú]+'?$")
def add(tok, n, is_low):
    if WORD.match(tok): (low if is_low else cap)[tok] += n
for path in sys.argv[1:]:
    for line in open(path, encoding='utf-8', errors='replace'):
        p = line.rstrip('\n').split('\t')
        if len(p) != 3: continue
        w = unicodedata.normalize('NFC', p[1]).replace('’', "'").replace('`', "'").replace('´', "'")
        n = int(p[2])
        m = re.match(r"^([^\W\d_]+')([^\W\d_]+)$", w)
        for part in (m.groups() if m else (w,)):
            add(part.lower(), n, part == part.lower())
tot = collections.Counter()
for w in set(low) | set(cap):
    tot[w] = low[w] + min(cap[w], low[w])
for w, n in tot.most_common():
    if n >= 3: print(w, n)
