# AGENTS.md — Italiano 1500

Offline PWA for the 1,500 most common Italian words (sister to Latin 1400). Tabs: Cards, Learn (11 lessons), Drills (Type / Identify / Mix), Cheat sheet, Words, About. Live at https://ericianni.github.io/italiano-1500/. No backend; progress in `localStorage` key `italiano1500.v1`. Core modules are language-agnostic UMD; Italian lives under `lang/it/`.

## File map

| Path | Purpose |
|------|---------|
| `index.html` | Shell; loads `core/*` then `lang/it/*` then `app.js` |
| `app.js` | App shell: tabs, Cards, Drills UI, Cheat sheet, Words, Settings, Test mode |
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
- **Drills:** Free practice via `DrillPick` + `DrillSession`. Units from `D.buildUnits(W, S.set.df)`. Modes `type` / `id` / `mix`. Weak spots list + reset.
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

- Every user-facing code or data change: bump `const CACHE = 'italiano1500-vN'` in `sw.js` (currently `italiano1500-v8`) and extend `ASSETS` if new files are needed.
- **Docs-only** commits do **not** need a cache bump.
- No Android wrapper in this repo today.
- Commit as `ericianni <ericianni@users.noreply.github.com>`; push straight to `main`; never rewrite pushed history.
  ```
  git -c credential.helper= -c credential.helper='!/usr/local/bin/gh auth git-credential' push
  ```

## Tests (all must pass before push)

| Command | ~time | Notes |
|---------|-------|-------|
| `node tests/run.js` (or `npm test`) | ~0.3s | morph, data, SRS, drills, lessons, packs, SW asset list |
| `node tests/smoke.js` (`npm run smoke`) | slower | headless Chrome; needs `google-chrome` |

## Gotchas

- Default **accents count** (opposite of Latin’s default macron-optional). UI copy: “Accents count” / “Accents optional”.
- `core/` is shared-design with Latin but **copied**, not linked — API-compatible changes may need a matching Latin update by hand.
- Verb drills skip `refl` and `impers`; agreement drills skip `noagr` adjs.
- Pack word ids outside `core` must use `Packs.gid` prefixing or progress keys collide.
- Rebuild curated data via `tools/` (see README); do not hand-edit huge slices of `words.json` without updating sources/tests.
