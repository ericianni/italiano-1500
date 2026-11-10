# AGENTS.md — Italiano 1500

Offline PWA for the 1,500 most common Italian words (sister to Latin 1400). Tabs: Cards, Learn (11 lessons), Drills (Type / Identify / Mix), Cheat sheet, Words, About. Live at https://ericianni.github.io/italiano-1500/. No backend; progress in `localStorage` key `italiano1500.v1`. Core modules are language-agnostic UMD; Italian lives under `lang/it/`.

## File map

| Path | Purpose |
|------|---------|
| `index.html` | Shell; loads `core/*` then `lang/it/*` then `app.js`. Sentence scripts are not blocking tags: `app.js` lazy-loads them the first time Sentences in drills is on |
| `app.js` | App shell: tabs, Cards, Drills UI (including sentence items), Cheat sheet, Words, Settings, Test mode |
| `style.css` | Styles |
| `sw.js` | Service worker; **bump `CACHE` on every code/data release** |
| `manifest.webmanifest` | PWA manifest |
| `core/srs.js` | Leitner SRS (`SRS`) — right/wrong only |
| `core/drillpick.js` | Weak-spot picker (`DrillPick`) |
| `core/drillsession.js` | Fixed-length sets + one redo (`DrillSession`) |
| `core/store.js` | Versioned localStorage + export/import (`Store`) |
| `core/packs.js` | Pack loader (`Packs`) |
| `core/ui.js` | DOM helpers: accent keys, chips, overlay, RW buttons (`UI`) |
| `lang/it/morph.js` | Morphology (`ItMorph`) |
| `lang/it/drills.js` | Drill units / questions / checking (`ItDrills` via factory → used as `D` in app) |
| `lang/it/sentences_lexicon.js` | Hand-tagged Rome-trip lexicon for the sentence engine (`ItSentLex`) |
| `lang/it/sentences.js` | Rule-based sentence engine (`ItSentences`); no model, no network |
| `lang/it/lessons.js` | 11 lesson specs (`LESSONS`) |
| `data/packs/index.json` | Pack list |
| `data/packs/core/manifest.json` + `words.json` | Core 1,500-word pack |
| `tests/run.js` | Unit + data + drill generation tests (`npm test`) |
| `tests/smoke.js` | Headless Chrome smoke (`npm run smoke`) |
| `tests/datacheck.js` / `update.js` / `fixtures/` | Wiktionary / Morph-it! cross-checks |
| `tools/` | Word-list pipeline (blend, lemmatize, curate, build, …) |
| `icons/` | PWA icons |

### ItMorph (`lang/it/morph.js`)

- Articles: `onset`, `defArt`, `indefArt`, `withArt`
- Nouns/adjs: `nounPlural`, `pluralRule`, `adjForms`, `adjAgree`
- Verbs: `present`, `imperfect`, `future`, `pastPart`, `ppAgree`, `ppForms`, `passato`, `tense`, `isIrregular`, `irrOf`, `cls`
- Grading helpers: `norm` (dash/apostrophe folding; keeps accents), `deaccent`
- Tables: `PERSONS`, `SUBJ`; internals `_IRR`, `_PP`, `_NPL`

There is **no** `standard`/`accepts` split like Latin; Italian shows the generated form and `ItDrills.check` grades typed input.

### ItDrills (`lang/it/drills.js`)

`buildUnits`, `makeQ`, `check(typed, answers, strict)` → `{ok, accent?}`, `idRight`, `idSetup`, `andReadings`, `andGrade`, `andSpend`, `verbOk` / `nounOk` / `adjOk`, pools, combo labels, …

Accent rule: if letters match after `deaccent` but accents differ → `{ok: !strict, accent: true}` (wrong when accents count; soft note when optional).

### ItSentences (`lang/it/sentences.js`)

`generate` / `generateMany`, `gradeIt` / `gradeEn`, `pickDrill`, `mixNext`, `applyGrade`, `contract` / `artOf`. Built only from `ItSentLex` plus `ItMorph`. Subject pronouns are optional in the Italian; English always shows them. A wrong answer shows the model sentence.

### Core

- `SRS`: `session`, `answer`, `sched`, `counts`, … — card keys `r:<id>` / `p:<id>`
- `DrillPick`: same API as Latin (`record`, `pickCombo`, `pickWord`, `weakest`, …)
- `DrillSession`: `create`, `next`, `answer`
- `Packs.load` / `gid` — non-core ids prefixed `<pack>/`
- `Store.create(key, fix)` — load/save/export/import

## Data packs

`data/packs/index.json` lists packs. Each pack: `manifest.json` + `words.json`. Core entry fields:

| Field | Meaning |
|-------|---------|
| `id` | Lemma id (string); unique within pack |
| `it` | Headword |
| `en` | US-English gloss |
| `pos` | `n` `v` `adj` `adv` `pron` `prep` `conj` `art` `det` `num` `int` |
| `rank` / `freq` | Frequency rank / blended score |
| `g` | Gender `m`/`f`/`mf` (nouns) |
| `pl` / `plg` | Explicit plural / plural gender when irregular |
| `inv` / `pltant` / `sg` | Invariable / plural-only / singular-only |
| `fem` | Related feminine lemma (e.g. amico → amica) |
| `forms` | Adj `[ms,fs,mp,fp]` when listed |
| `conj` | Verb class `are`/`ere`/`ire`/`isc` |
| `aux` | `a` / `e` / `a/e` |
| `irr` | Marked irregular |
| `impers` / `refl` | Skip in finite verb drills |
| `noagr` | Adj skipped in agreement drills |
| `pre` | Adj normally before the noun (article agrees with it) |

Irregular verb paradigms and many plurals also live in `lang/it/morph.js` (`IRR`, `PP`, `NPL`, …).

Adding a pack: `data/packs/<id>/manifest.json` + `words.json`, list in `index.json`. Future packs (Dante, Rome/travel) should follow this layout.

## Architecture (brief)

- **Cards:** Leitner (same intervals as Latin); IT→EN then EN→IT; right/wrong; optional typed Italian checked with `D.check` + accent keys.
- **Drills:** Free practice via `DrillPick` + `DrillSession`. Units from `D.buildUnits(W, S.set.df)`. Modes `type` / `id` / `mix`. Weak spots list + reset. Optional sentences: see below.
- **And…?:** Ambiguous verb forms (e.g. *sono*); toggle `S.set.andMore` (default on).
- **Learn / Cheat sheet:** Tables generated from `ItMorph` (same engine that grades).
- **Test mode:** Per-word flashcards + drills; progress snapshotted, not saved.
- **Settings defaults:** `newPerDay: 10`, **`strict: true` (accents count)**, `dlen: 10`, `dmode: 'type'`, `andMore: true`.
- **SW:** Precache with `cache: 'reload'` on install (avoids GH Pages HTTP cache); bump `CACHE` name on release.

## Policies

- Accents **count by default**; Settings → “Accents optional” sets `S.set.strict = false`. Soft hyphens stripped; Unicode dashes/apostrophes folded to ASCII `-` / `'` (`ItMorph.norm`); a real hyphen still matters (`parlo` ≠ `par-lo`).
- Right/wrong grading only. US English UI and glosses.
- Linguistic accuracy is critical; prefer Wiktionary / Morph-it! checked forms.
- Keep word data in **packs** so expansion packs do not collide with core progress.

## Release / Git

- Every user-facing code or data change: bump `const CACHE = 'italiano1500-vN'` in `sw.js` (currently `italiano1500-v14`) and extend `ASSETS` if new files are needed. Sentence engine files are in `ASSETS` and are lazy-loaded, not blocking script tags.
- **Docs-only** commits do **not** need a cache bump.
- No Android wrapper in this repo today.
- Commit as `ericianni <ericianni@users.noreply.github.com>`; push straight to `main`; never rewrite pushed history.
  ```
  git -c credential.helper= -c credential.helper='!/usr/local/bin/gh auth git-credential' push
  ```

## Tests (all must pass before push)

| Command | ~time | Notes |
|---------|-------|-------|
| `node tests/run.js` (or `npm test`) | ~2s | morph, data, SRS, drills, lessons, packs, sentences (2,000 per tier), SW asset list |
| `node tests/smoke.js` (`npm run smoke`) | slower | headless Chrome; needs `google-chrome` |

## Gotchas

- Default **accents count** (opposite of Latin’s default macron-optional). UI copy: “Accents count” / “Accents optional”.
- `core/` is shared-design with Latin but **copied**, not linked — API-compatible changes may need a matching Latin update by hand.
- Verb drills skip `refl` and `impers`; agreement drills skip `noagr` adjs.
- Pack word ids outside `core` must use `Packs.gid` prefixing or progress keys collide.
- Rebuild curated data via `tools/` (see README); do not hand-edit huge slices of `words.json` without updating sources/tests.

## Sentences in drills

Off until the learner turns it on. Three settings, all on `S.set.df` (no mix %, length, or pattern list):

| Key | Values | Default |
|-----|--------|---------|
| `sent` | sentences in drills on / off | **off** (`false`) |
| `stype` | `tr` translate, `id` identify, `both` | `both` |
| `sdir` | `ie` Italian → English, `ei` English → Italian, `both` | `ie` |

`app.js` lazy-loads `lang/it/sentences_lexicon.js` and `lang/it/sentences.js` the first time this is on (they are in the service-worker precache).

**Mix.** `ItSentences.mixNext` draws how many ordinary drill items come before the next sentence from `[4, 5, 5, 6, 6, 7, 9]`. Each stretch is one sentence out of 5–10 items, so that stretch is 10–20% sentences. The mean gap is 6, so a long run is 1 sentence in 7 (about 14%). A sentence is never followed by another sentence. If the pool is too small, generation fails, or the drill filter cannot be matched, that slot is an ordinary drill item and the gap resets. Each sentence is one item in the set and adds **1** to the daily drill count (`S.day.dn`), whether it was right or wrong. A missed sentence is not re-asked.

**Words.** Only lemmas in `sentences_lexicon.js`. The pool is lexicon content words the learner has a flashcard for (`r:` / `p:`) or has met in a drill (`S.ds.w`). Articles, the prepositions the templates use, essere / avere / stare, subject pronouns, non, e, ma, and ci (in c’è) are helpers: always allowed, and not counted toward the tier. A helper whose entry is not in that seen set is shown with a short English gloss. Definite articles share the `il` entry; indefinite articles share `un`.

**Length tiers** use the count of seen lexicon content words (helpers do not count):

| Seen content words | What unlocks |
|--------------------|----------------|
| under 40 | `COP` (essere/stare + adjective), `SV` (intransitive), `CE` (c’è / ci sono). Present only |
| 40–79 | those, plus `SVO` (articles), `SVPP` (articulated di/a/da/in/su, and con; each verb+preposition lists only plausible prep objects, and the subject class has to match), `POSS` (la mia casa; no article on a singular unmodified family noun: mia madre) |
| 80–139 | those, plus imperfetto, futuro, and passato prossimo (aux from the word’s `aux`; essere participles agree), and `NADJ` (noun + adjective). Adjectives marked `pre` (and bello, buono, grande, piccolo, nuovo, vecchio, bravo) come before the noun, and the article agrees with that adjective. Masculine singular bello/buono stay after the noun so the sentence never needs bel/buon |
| 140 and up | those, plus `IO` (a + article), `COORD` (e / ma), `NEG` (non) |

**Weak spots and filters.** The sentence is biased toward the weakest engine-feasible combo in the current drill chips (`DrillPick.weakest`). The engine builds present, imperfetto, futuro, and passato prossimo, article gender/number/onset, and adjective gender/number. Identify asks for the tense and person, or the gender and number, using the same labels as the other drills, and records that combo with `DrillPick.record`. Translate does not write a form stat. If the chips restrict the drill, the sentence must contain a matching target; otherwise the slot falls back to an ordinary item.

Each sentence noun has one or more semantic classes (`person`, `animal`, `place`, `building`, `vehicle`, `food`, `drink`, `object`, `tool`, `water`, `time`, `abstract`, `text`). Adjectives and transitive verbs list the classes they can combine with, and that list is used both for a noun’s adjective and for a predicate adjective. Antonym pairs (and a few near-contradictions, such as *grande* with *corto*) are never an attributive plus the opposite predicate. If a template has no legal combination among the words already seen, generation returns nothing and the drill slot stays an ordinary item, the same as when there are too few words.

Noun subjects take the definite article (mia madre still has none). *stesso* is only the plain definite pattern (*lo stesso libro*, *la stessa ragazza*, *gli stessi libri*), never with a possessive. After *c’è* / *ci sono* the noun is indefinite or partitive (*un/una/uno*, *dei/delle/degli*, *del/della*), never *il/lo/la/i*. Partitive *dei/delle* is for c’è / ci sono and for objects, not for “some daughters get on…”. *dormire* is only at home, in a room, or at a hotel; *salire/scendere* take vehicles, singular unless the subject is plural. English is “gets on” a bus or train and “gets into” a car or taxi; “gets off” a bus, train, or plane and “gets out of” a car or taxi. Grading accepts either phrasing. *bello* is beautiful or handsome, not “nice.” *essere/stare* are not “at the store.”

**Grading.** Right/wrong only. English ignores a/an/the/some and expands contractions; a short synonym list comes from the lexicon glosses. The model sentence shows one English wording. *suo* also accepts his/her/its/your (formal Lei); *loro* accepts their/your. Bare *sono* accepts both “I am” and “they are” when nothing else shows the number (*Sono a casa*); *Sono stanchi* is only “they are,” *Sono stanco* only “I am.” Bare *è* with *lei/lui* also accepts formal “you are.” Italian uses the same accent and dash rules as `ItDrills.check` (accents count unless `S.set.strict` is false) and accepts the sentence with or without its subject pronouns. A wrong answer shows the model Italian and English.
