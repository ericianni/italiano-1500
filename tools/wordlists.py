"""Hand-kept word lists shared by the build scripts (lemmatize.py, candidates.py, blend.py).

EVERYDAY / ADDED: words kept in the 1,500 whatever their corpus frequency. A frequency count misses closed sets
(months, weekdays, numbers), everyday words that subtitles and news both rarely write (food, travel, shopping, the
body), and words whose forms the lemmatizer gives to a commoner homograph (sale salt / sale 'goes up', riso rice /
riso 'laughed'). ADDED came from a gap check of the v2 list against published basic-vocabulary lists, used only as a
checklist (no list content is copied here beyond these individual everyday words).
DROPPED: news-, crime- or politics-heavy words that the blend ranked just inside the cut; they make room for ADDED.
Protected words are ranked by max(blend score, subtitle frequency), so they are taught in a sensible order."""
EVERYDAY = set('''salve buongiorno buonasera arrivederci congratulazioni colazione latte bicchiere gelato pollo uovo naso dente orecchio
schiena ginocchio zia cugino sedia doccia autobus taxi giacca camicia pantaloni tasca cappello valigia'''.split())
ADDED_BY_TOPIC = {
 'calendar': 'gennaio febbraio marzo aprile maggio giugno luglio agosto settembre ottobre novembre dicembre martedì mercoledì giovedì primavera autunno inverno',
 'numbers': 'sei undici dodici tredici quattordici quindici sedici diciassette diciotto diciannove venti trenta quaranta cinquanta sessanta settanta ottanta novanta',
 'homographs': 'sale riso posta data fa menù buonanotte',
 'restored': 'mica stanotte torta bugia bacio sigaretta viso scatola fumare parente',
 'food': 'pane pizza pasta olio formaggio frutta verdura insalata zucchero tè panino cioccolato cameriere mancia',
 'travel': 'albergo museo piazza fermata passaporto prenotare partenza binario',
 'shopping': 'euro cassa scontrino costo gratis chilo',
 'body': 'stomaco pancia gola febbre sonno sete',
 'time': 'mezzogiorno mezzanotte piovere neve',
 'other': 'sporco corto giallo grigio azzurro marrone simpatico abbracciare',
}
ADDED = {w for v in ADDED_BY_TOPIC.values() for w in v.split()}
DROPPED = set('''inferno cancro includere furgone picchiare aggredire rimuovere combinare presumere federale fallire professionista magia
funerale fiamma sospendere pilota rotta legame confessare caduta copertura donare furto esplodere procuratore puntata prestito colpevole
socio seduta attivare dipartimento protezione arresto completare rilasciare armare criminale comandante messa allarme indagare minaccia
bomba concedere sindaco catturare pista comando mandato innocente club talento mossa lottare
eseguire vicenda verificare giungere produrre comunità tecnologia sviluppare dedicare limitare disponibile assistere elettrico sostituire
fase risorsa commissione inserire nominare visione operare compiere crisi basare concludere intervento proposta investire autorità formare
avanzare contenere media confronto opporre scientifico materiale epoca figurare teoria universo sfuggire
esprimere'''.split())
PROTECTED = EVERYDAY | ADDED
# parente is everyday family vocabulary; it fell just outside the cut when the noun stato took a slot.
# esprimere is the lowest-frequency word the news corpus lifts into the cut (its spoken rank falls outside), so it makes room.
assert len(ADDED) == 99 and len(DROPPED) == 99 and not (PROTECTED & DROPPED)
