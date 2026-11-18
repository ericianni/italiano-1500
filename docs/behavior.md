# What Italiano 1500 does

A phone-first study app for frequent Italian, with an optional Dante pack. Progress stays on the device (`localStorage` key `italiano1500.v1`). There is no account and no server. You mark answers right or wrong only.

## Cards

Each word has two cards: Italian to English, then English to Italian. On the second card you can type the Italian; the box says “Type Italian (optional).” Nouns are shown with their article. Right and wrong follow a Leitner schedule: a right answer waits longer each time (1, 3, 7, 14, 30, 60, then 120 days); a wrong answer comes back soon. New words arrive in frequency order, 10 a day unless you change that. A session stops at 30 cards.

## Today’s goals

The Cards tab shows two daily counts: new words, and drill answers as N / 20. The drill line is only a count. It is not a link.

## Learn

Eleven short grammar lessons. Tables are built by the same morphology engine that grades drills. A lesson can send you into a matching drill set.

With the Dante pack on, Learn adds a short reading first, “Dante’s Italian,” then one reading for each canto of the Inferno. Each canto has a sentence or two of plot, then two or three tercets quoted from the stored text, with a word-by-word gloss and a plain English line. An underlined word opens that card. These readings have no quick check.

## Drills

Free practice, separate from the card schedule.

- **Type:** you type the form.
- **Identify:** you tap tense and person, or gender and number.
- **Mix:** half of each.

Questions lean toward forms you miss, have not tried, or have not seen lately. A miss can come back once later in the same set, with another word. Weak spots lists the lowest recent accuracy (under 85%).

**Sentences in drills** stay off until you turn them on. Then about one question in seven is a short Rome-trip sentence made only from words you have already seen. The sentence is never followed by another sentence.

**Ask “And…?”** lives under Drills → What to drill. Some forms have more than one reading (*sono*: io or loro). Any one is right. If the setting is on, you can name the others; skipping is free.

**Accents** are a setting on About. With Accents count, *citta* for *città* is wrong. You can still tap Count as correct.

## Cheat sheet

The same tables as the lessons, in one place: articles, plurals, adjectives, verb groups, and irregulars.

## Words

Search Italian or English. Filter by type, including Articles (*il*, *un*, and the other articles). Sort by frequency or A–Z. Tap a word to test it without saving. With the Dante pack on, those words sit under a Dante heading, names under Names, and you can sort by canto (first appearance).

## Settings

About keeps new words per day, the accent switch, and the pack choice. Export, import, and reset are on the same tab.

**Pack** is one choice, not a switch per pack:

- Modern Italian (core only). This is the default, including for anyone who already has progress.
- Modern Italian + Dante (Inferno).

Core stays on either way. A future pack such as Rome would be another choice in the same list.

## Dante pack

When that choice is on, cards add lemmas from the Inferno that are not already in the core 1,500 and that occur at least three times, plus names (Virgilio, Caronte, and the rest) in their own group. Each card has an English gloss in Dante’s sense, the Inferno count, and the first canto and line. An archaic spelling can carry a short modern note (*disio* = desiderio).

Drills use a Dante word only when the morphology engine can build the form. Other Dante words are marked not in form drills, instead of showing a made-up form. Names are not drilled.

About shows the Dante text and dictionary credits, and the line “Dante adds words from the Inferno, and a short reading for each canto,” only while the pack is on.

Learn, while the pack is on, adds Dante’s Italian and cantos I–XXXIV. The lines are quoted from the stored Inferno text.

Lemmas that occur once or twice, and are not in the core list, are written out in `docs/dante-excluded.md`. They are not cards.

## Offline and the installed site

The site is a PWA. A service worker precaches the app, including the Dante pack files, so it opens with no network. The cache name changes when the app changes, and the new copy takes over on the next open. The live site is https://ericianni.github.io/italiano-1500/.

## Android

The same files can be wrapped as an Android app (`io.github.ericianni.italiano1500`, versionCode 1, versionName `v14-android-1`). The APK is built and signed on the maintainer’s computer. This web release does not build a new APK. Inside the wrapper the service worker is not used, because the pages are already in the app.

## Known gaps

- The Inferno text is Project Gutenberg eBook #997, public domain in the United States, checked against the standard 4,720-line numbering. It is not Petrocchi’s critical edition.
- 204 Dante words are marked not in form drills. Those are names, adjectives, and spellings the morphology engine would grade with a modern pattern the line does not use.
- A few cards still mix two uses. *scorta* is both “escort” and “seen.” *lasso* is both “weary” and “alas.” *latino* also includes the surname Latino. The title Count occurs only twice, so it is not a card. *là ’ve* is *dove*, “where,” and is not a separate card.
- Sentence drills use the Rome-trip lexicon only. They do not draw Dante pack words.
- Words that occur only once or twice in the Inferno are listed, not taught.

## Not built yet

- Audio
- Purgatorio and Paradiso
- A Rome pack
