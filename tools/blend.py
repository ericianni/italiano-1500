#!/usr/bin/env python3
"""Step 3b: blend the subtitle and news headword frequencies into one ranking.

Input:  build/sub_ranked.tsv   OpenSubtitles 2018 (FrequencyWords, CC BY-SA 4.0), lemmatized and curated
        build/news_ranked.tsv  Leipzig Corpora Collection, Italian news 2023 + 2024 (CC BY 4.0), same pipeline
Output: build/ranked.tsv  rank, headword, pos labels, blended frequency (per million), forms, Wiktionary hint

Each source's counts are turned into frequency per million headword tokens (floor FLOOR for a word missing from one
list). The blended score is a weighted mean of the two log frequencies (a weighted geometric mean):
    score = W_SUB * log(sub) + (1 - W_SUB) * log(min(news, NEWS_CAP * sub))
- A word has to be reasonably common in both conversation and written news to rank high, so subtitle-only words
  (sceriffo, vampiro, detective, dannazione) fall back.
- Subtitles get the larger weight and news can raise a word to at most NEWS_CAP times its subtitle frequency, so
  the list doesn't tilt toward politics and economics (commissione, ministero, euro, elezione stay out).
- EVERYDAY: basic words for daily life (greetings, food, the body, family, home, clothes, getting around) that news
  rarely uses. A frequency blend can't tell them apart from subtitle oddities, so they are kept by hand, ranked by
  their subtitle frequency alone (so salve and arrivederci aren't the last words taught).
Run: python3 tools/blend.py > build/ranked.tsv"""
import math, sys
FLOOR = 0.5
W_SUB = 0.6
NEWS_CAP = 2
EVERYDAY = set('''salve buongiorno buonasera arrivederci congratulazioni colazione latte bicchiere gelato pollo uovo naso dente orecchio
schiena ginocchio zia cugino sedia doccia autobus taxi giacca camicia pantaloni tasca cappello valigia'''.split())
N_WORDS = 1500
def read(p):
    rows = [l.rstrip('\n').split('\t') for l in open(p, encoding='utf-8')]
    tot = sum(int(r[3]) for r in rows)
    return {r[1]: (int(r[3]) * 1e6 / tot, r) for r in rows}
S, N = read('build/sub_ranked.tsv'), read('build/news_ranked.tsv')
score = {}
for hw in set(S) | set(N):
    s = S[hw][0] if hw in S else 0; n = N[hw][0] if hw in N else 0
    s = max(s, FLOOR); n = min(max(n, FLOOR), NEWS_CAP * s)
    score[hw] = W_SUB * math.log(s) + (1 - W_SUB) * math.log(n)
order = sorted(score, key=lambda h: (-score[h], h))
# protected words take the place of the lowest-ranked words above the cut; everything else keeps blend order
keep = [h for h in order if h in EVERYDAY]
for h in keep: score[h] = max(score[h], math.log(max(S[h][0] if h in S else 0, FLOOR)))
top = [h for h in order if h not in EVERYDAY][:N_WORDS - len(keep)]
order = sorted(top + keep, key=lambda h: (-score[h], h)) + [h for h in order if h not in set(top) | set(keep)]
for i, hw in enumerate(order):
    sc = score[hw]
    r = (S.get(hw) or N.get(hw))[1]
    print(f'{i+1}\t{hw}\t{r[2]}\t{math.exp(sc):.1f}\t{r[4]}\t{r[5] if len(r) > 5 else ""}')
