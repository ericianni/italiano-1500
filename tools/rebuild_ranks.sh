#!/bin/sh
# Rebuild build/ranked.tsv from the raw sources (see each script's header). SRC holds it_full.txt, morphit.txt,
# kaikki-it.jsonl and leipzig/ita_news_{2023,2024}_1M/*-words.txt.
set -e
SRC=${1:-/workspace/itsrc}
mkdir -p build
python3 tools/leipzig_forms.py "$SRC"/leipzig/*/*-words.txt > build/news_forms.txt
python3 tools/lemmatize.py "$SRC" > build/lemmas.tsv
python3 tools/lemmatize.py "$SRC" build/news_forms.txt news > build/news_lemmas.tsv
python3 tools/kaikki_extract.py "$SRC"/kaikki-it.jsonl build/lemmas.tsv build/news_lemmas.tsv > build/kaikki.json
python3 tools/candidates.py build/lemmas.tsv 8000 > build/sub_candidates.tsv
python3 tools/curate.py build/sub_candidates.tsv > build/sub_ranked.tsv
python3 tools/candidates.py build/news_lemmas.tsv 8000 > build/news_candidates.tsv
python3 tools/curate.py build/news_candidates.tsv > build/news_ranked.tsv
python3 tools/blend.py > build/ranked.tsv
