# Specialist vocabulary batch 11

Release `2026-10-preview-16` adds **24 distinct English entries**: 12 medical and 12 engineering. Each priority collection grows from 158 to **170 of 500**, with 330 remaining. The atlas contains **498 English words and 499 meanings** across 32 categories, with complete Persian, Brazilian Portuguese and Latin American Spanish support. Each Portuguese and Spanish edition contains 998 translated examples, 1494 collocations and 498 usage notes. The existing `pressure` card retains its two meanings and four examples; translations, inflections and extra senses do not multiply the English word count.

| Coverage | New vocabulary |
| --- | --- |
| Orthotic supports | orthosis, sling, walking boot, compression stocking, ankle brace, knee brace, wrist brace, cervical collar |
| Rehabilitation equipment | exercise band, balance board, parallel bars, goniometer |
| Heat and air-moving equipment | radiator, boiler, furnace, fan, blower |
| Temperature sensing and thermal movement | thermostat, thermocouple, thermistor, bimetallic strip, insulation, expansion joint |
| Heat rejection | cooling tower |

Each entry has an explicit selected sense, UK/US IPA, an original English learner definition, Persian scaffolding, two meaningful examples, three collocations and useful distinctions. The first example keeps its full headword together for cloze practice. Both native overlays bind to the same English words, sense IDs, examples and collocations. CEFR labels are approximate editorial estimates. The existing Atlas, daily learning, spaced-review and practice flows consume the new content. Earlier lexical/sense identities, licensed recordings, science course and learner progress remain preserved.

## Pictures and review

Individual images use the built-in image tool and are saved as 512px WebP assets. Clinical product studies use precise forms on cool white with restrained mint and pale blue. Engineering uses silver technical product drawings and explanatory cutaways on slate with amber cues. The actual full generated images and final512px/120px conversions are inspected by the author and a second AI reviewer. Literal prompts, current hashes, category-profile hashes, rights and actual findings are recorded in [media provenance](../content/media-provenance.json) and the [illustration audit](../content/illustration-audit.json). The checks bind assessments to exact words, meanings, examples and asset bytes; software cannot prove medical or mechanical truth.

Orthosis is an external support, with an ankle-foot example distinct from a prosthesis. Walking boot has a rigid medical base and padded supports rather than a hiking-shoe silhouette. Ankle, knee and wrist braces show their selected joints and structural support cues. Compression stocking is medical elastic clothing; conceptual pressure cues do not specify a prescription or pressure class. Sling supports a forearm, and cervical collar supports the neck. Exercise band is a resistance strip rather than adhesive tape. Balance board has an unstable rounded support; parallel bars provide two supported handrails around an open walkway. Goniometer has two arms and a shared angular pivot rather than a dynamometer or fixed school protractor. None of these illustrations supplies a fitting or exercise method.

Radiator is the room-heating water/steam sense, with a hydronic example. Boiler heats water, while the selected building furnace heats air separated from combustion gases. Fan uses an axial example and blower a centrifugal scroll example; the terminology overlaps in industry. Thermostat controls temperature, thermocouple has two different conductors joined at a sensing junction, and thermistor senses through temperature-dependent resistance. Thermocouple wording preserves the reference-junction distinction rather than treating the sensing bead alone as an absolute-temperature source. Bimetallic strip shows two continuously bonded layers with the expanding outer arc. Insulation reduces heat transfer around a pipe; expansion joint uses a hollow bellows connection. Cooling tower uses an induced-draft counterflow example: falling sprayed water meets rising air through fill and collects in a basin. These are original simplified vocabulary illustrations, not construction drawings, calibrated instruments or operating instructions.

Two older engineering illustrations receive new sibling assets. **Measure** retains hands actively aligning ruler endpoints with a beam and moves the scene into the current slate technical style; a targeted edit corrects small endpoint drift in the first generated candidate. **Valve** replaces an inherited warm flat SVG with a connected handwheel/stem/gate cutaway and a visible open flow passage. Their word/sense/audio identities stay intact, and earlier canonical and immutable media remain available. Illustration refreshes add no words. Boiler inspections also removed inconsistent water levels and an ambiguous shelf at the chamber-to-flue transition, leaving an open continuous throat. Furnace corrections replace untraceable serpentine passages with an explicit separated air/gas example; blower correction removes an ambiguous nested impeller. Rejected candidates and correction evidence remain private.

All content remains an **AI-assisted editorial preview**, pending independent human language and qualified specialist review. No human or professional approval is implied. Entries without finished licensed recordings use an available device English voice and remain excluded from recording-only exercises. There are no fabricated recordings, patient records, doses, exercise prescriptions, operating settings or numerical performance claims.

## Publication

The [campaign ledger](../content/expansion-campaign.json) records 24 additions separately from two image refreshes. The [production protocol](vocabulary-production.md) continues toward 500 published entries in both priority categories, then the existing remaining-category queue and milestones.

```sh
npm run campaign:status
npm run check:content
npm test
ATLAS_BASE=/mehrdadika/ npm run build
```

Local validation passed: all **164 tests**, complete content/native-vocabulary/native-reading/illustration/style/campaign checks and the production build under `/mehrdadika/`. Actual screenshots and card text were inspected across all three editions at1280px desktop and390px phone widths: Persian orthosis and cooling tower, Portuguese boiler and knee brace, Spanish goniometer and furnace. Each card loaded its expected512px immutable image with the correct language direction, no horizontal overflow and no recorded warning/error messages. Corrected boiler flue continuity and furnace air/gas separation visibly match the final reviewed assets. Independent human language and qualified specialist review remain pending.
