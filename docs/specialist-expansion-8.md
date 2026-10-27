# Specialist vocabulary batch 8

Release `2026-10-preview-13` adds **24 distinct English entries**: 12 medical and 12 engineering. Each priority category grows from 122 to **134 of 500**, with 366 remaining in each. The atlas contains **426 English words and 427 meanings** across 32 categories, with complete Persian, Brazilian Portuguese and Latin American Spanish support. Each Portuguese and Spanish edition contains 854 translated examples, 1278 collocations and 426 usage notes. The existing `pressure` card retains two meanings and four examples; translations and additional senses do not multiply the word count.

| Coverage | New vocabulary |
| --- | --- |
| Respiratory equipment | nebulizer, spacer, oxygen mask, nasal cannula, peak flow meter, spirometer |
| Care supplies and equipment | sharps container, kidney dish, bedpan, urinal, commode, transfer board |
| Cutting and hole-finishing tools | chisel, punch, reamer, tap, die, drill bit |
| Workshop tools and measurement | file, hacksaw, torque wrench, Allen key, feeler gauge, scriber |

Each entry has an explicit selected sense, UK/US IPA, an original English learner definition, Persian scaffolding, two meaningful examples, three collocations and useful distinctions. Both native overlays bind to the exact English words, senses, examples and collocations. CEFR labels remain approximate editorial estimates. New entries use the existing Atlas, daily learning, spaced-review and practice flows. Existing lexical/sense identities, recordings, course content and learner progress are preserved.

## Pictures and review

Each of the 24 additions has its own 512px WebP made with the built-in image tool. Medical pictures follow the clean cool-white/mint clinical brief, with translucent devices, simple object studies and small explanatory mannequin insets. Engineering uses precise slate/silver product drawings with restrained amber highlights. Actual full generated pixels and final 512px/120px conversions received author inspection and a second AI review. Literal prompts, licensing, current image hashes, category-profile hashes and actual findings are recorded in [media provenance](../content/media-provenance.json) and the [illustration audit](../content/illustration-audit.json).

Respiratory pictures distinguish the compressor and medicine chamber of a nebulizer, the chamber accessory of a spacer, a nose-and-mouth oxygen mask and the two short nasal prongs of a conventional cannula. A compact mechanical peak-flow meter differs from a diagnostic spirometer with a blank display and connected breathing path. The pictures supply no flow settings or invented diagnostic results. Bedpan, portable bottle urinal and commode have separate selected senses; a seated transfer board is distinct from a long lying-patient transport board. Container colors and individual device shapes are examples, not universal designs.

Tool cards distinguish a metalworking cold chisel from a pointed center punch, a straight-fluted hole-finishing reamer from a twist drill, and an internally cutting tap from an externally cutting die. The selected `file` is a metalworking hand tool; `die` is a threading tool. The Allen key uses a hexagonal end, and feeler-gauge leaves represent known thicknesses without displaying working values. A scriber point meets a physical scratch rather than a punch dimple.

Inspection led to concrete corrections. Decorative objects were removed from respiratory-device backgrounds. A punch candidate with an automatic-looking barrel was replaced by a solid manually struck tool matching its selected definition. A torque-wrench socket scene had ambiguous fastener engagement; a narrow edit did not resolve it, so the final illustration shows the adjustable wrench and bare square drive as a clear standalone product study. Rejected candidates and literal correction prompts remain private; their failed assessments are not presented as approval.

Two older medical illustrations receive sibling assets. **Patient** now depicts a person receiving a clinical consultation in the current cool clinical style. **Treatment** shows actual non-graphic dressing care to a supported forearm. Both lexical records and their audio identities are retained, along with the earlier source images and immutable published media. Illustration refreshes add no words.

All content remains an **AI-assisted editorial preview**, pending independent human language and qualified specialist review. Software establishes completeness, integrity and exact bindings; it cannot prove semantic truth or professional approval. These pictures teach vocabulary, with no fabricated recordings, patient data, doses, clinical procedures, engineering settings or calibration claims. Entries without licensed recordings use an available device English voice and stay excluded from recording-only exercises.

## Publication

The [campaign ledger](../content/expansion-campaign.json) records 24 additions separately from two older-image refreshes. The [production protocol](vocabulary-production.md) continues toward 500 published entries in each priority category, then the existing remaining-category queue.

```sh
npm run campaign:status
npm run check:content
npm test
ATLAS_BASE=/mehrdadika/ npm run build
```

Local validation passed: all **164 tests**, complete content/native-vocabulary/native-reading/illustration/style/campaign checks and the production build under `/mehrdadika/`. Actual browser checks covered Persian spacer and Portuguese feeler gauge at 1280px, plus Spanish transfer board and the corrected Persian punch at 390px. Each card loaded its expected 512px immutable image with the correct language direction, no horizontal overflow and no recorded warning/error messages. Independent human language and specialist review remain pending.
