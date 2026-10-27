# Specialist vocabulary batch 7

Release `2026-10-preview-12` adds **24 distinct English entries**: 12 medical and 12 engineering. Each priority category grows from 110 to **122 of 500**, with 378 remaining in each. The atlas contains **402 English words and 403 meanings**, with complete Persian, Brazilian Portuguese and Latin American Spanish support. Each Portuguese and Spanish edition contains 806 translated examples, 1206 collocations and 402 usage notes. The preserved word `pressure` has two meanings and four examples; translations and additional meanings do not multiply word counts.

| Coverage | New vocabulary |
| --- | --- |
| Limb bones and joint tissue | femur, tibia, fibula, humerus, ulna, cartilage |
| Internal organs and passages | bladder, pancreas, spleen, gallbladder, oesophagus, trachea |
| Construction materials | concrete, cement, mortar, brick, aggregate, asphalt |
| Structural supports | lintel, joist, rafter, pile, retaining wall, abutment |

Each entry has one explicit selected sense, UK/US IPA, an original English learner definition, Persian support, two meaningful examples, three collocations and useful distinctions. Both native overlays bind to the exact English source. CEFR labels are approximate editorial estimates. The words use the existing Atlas, daily learning, spaced-review and practice flows. Existing lexical/sense IDs, recordings, course content and learner progress are preserved.

## Pictures and review

All 24 additions have separate 512px WebP images made with the built-in image tool. Medical images use clean cool-white/mint clinical models, with faint anatomical context where needed to identify a bone. Engineering uses precise slate/silver/amber material studies and supported structural cutaways. Actual full generated pixels and final 512px/120px conversions receive an author inspection followed by a second AI review. Exact prompts, rights, image hashes, category-profile hashes and actual findings appear in [media provenance](../content/media-provenance.json) and the [illustration audit](../content/illustration-audit.json).

Bone pictures distinguish the thigh, upper arm, medial weight-bearing tibia, slender lateral fibula and little-finger-side ulna. The cartilage example highlights separate joint surfaces rather than covering the tibial central eminence. Organ context distinguishes urinary bladder from gallbladder, food passage from airway, and the positions of the pancreas and spleen.

The trachea image deliberately shows a **short mid-tracheal segment**, with five C-shaped supports and a posterior soft-tissue bridge. A small smooth locator provides whole-airway context. Initial whole-airway candidates were rejected for misleading ring counts and bronchial support details; a partial segment with a non-quantitative locator teaches the actual tissue relationship without implying a complete anatomical count. The learner usage notes explain this scope. This is an introductory teaching model, with specialist review still pending.

Construction pictures distinguish fine dry cement binder, hardened concrete with embedded aggregate, fresh mortar and masonry joints, loose aggregate and dark asphalt mixture. Structural images show actual bearing/contact relationships and distinguish a lintel over an opening, repeated horizontal joists, sloping rafters, a deep foundation pile, retained ground and a bridge-end abutment. These are vocabulary models, not construction specifications, calibrated diagrams or qualified designs.

Two older pictures receive sibling assets. **Nurse** now shows connected bedside care in the current clinical style. **Load** preserves its existing transported-cargo sense through timber carried on a truck, with the goods as the main focus. Both earlier source assets and immutable media remain available; refreshing their pictures does not add words.

All content remains an **AI-assisted editorial preview** awaiting independent human language and qualified specialist review. Software checks completeness and exact bindings, not semantic truth or professional approval. No fabricated recordings, diagnosis, patient data, drug doses or treatment instructions are supplied. New words without licensed recordings use an available device English voice and remain excluded from recording-only exercises.

## Publication

The [campaign ledger](../content/expansion-campaign.json) counts 24 new entries separately from two older-image refreshes. The [production protocol](vocabulary-production.md) continues toward 500 published entries in each priority category before the remaining category queue.

```sh
npm run campaign:status
npm run check:content
npm test
ATLAS_BASE=/mehrdadika/ npm run build
```

Local validation passed: all **164 tests**, complete content/native-reading/illustration/style/campaign checks and the production build under `/mehrdadika/`. Actual browser checks covered Persian trachea and Portuguese retaining wall at 1280px, plus Spanish corrected spleen and Persian abutment at 390px. The Persian trachea note was also scrolled into view to verify its partial-section explanation beside the picture. Each card loaded its expected 512px immutable image with correct language direction, no page overflow and no recorded warning/error messages. Independent human language and specialist review remain pending.
