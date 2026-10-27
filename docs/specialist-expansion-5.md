# Specialist vocabulary batch 5

Release `2026-10-preview-10` adds **24 distinct English entries**: 12 medical and 12 engineering. Each priority category grows from 86 to **98 of 500**, with 402 remaining in each. The atlas contains **354 English words and 355 meanings**, with complete Persian, Brazilian Portuguese and Latin American Spanish support. Each Portuguese and Spanish edition contains 710 translated examples, 1062 collocations and 354 usage notes.

| Coverage | New vocabulary |
| --- | --- |
| Clinical roles | pharmacist, dentist, paramedic, physiotherapist |
| Emergency transport and supplies | ambulance, first-aid kit |
| Care settings and arrival | pharmacy, clinic, hospital, ward, waiting room, reception |
| Measuring and drafting tools | ruler, tape measure, protractor, spirit level, set square, compass |
| Dimensions and circles | length, width, height, depth, diameter, radius |

Each entry has one explicit sense, UK/US IPA, an original English learner definition, Persian support, two contextual examples, three collocations and useful distinctions. Both native overlays bind to the exact English source. CEFR labels are approximate editorial estimates. Vocabulary continues through the existing Atlas, learning, spaced-review and practice flows. Earlier lexical and sense identities, recordings, course content and learner progress are preserved.

## Pictures and review

All 24 additions have separate 512px WebP pictures made with the built-in image tool. Clinical roles appear in recognizable work settings; a uniform portrait alone is insufficient. Care settings distinguish a dispensing pharmacy, outpatient clinic, larger hospital, inpatient ward, waiting seats and reception desk. Medical illustrations use clean cool-white/mint clinical rendering, while engineering uses precise slate/silver/amber technical product and dimension drawings.

Actual full generated images and final 512px/120px conversions receive an author inspection followed by a second AI review. Accepted image hashes, prompts, rights, semantic findings and current category-profile bindings appear in [media provenance](../content/media-provenance.json) and the [illustration audit](../content/illustration-audit.json). Picture inspections check hand/tool contact, connected equipment, profession-specific context, measurement-arrow endpoints and distinctions among neighboring words. Tool pictures omit invented numeric readings; they are educational illustrations, not calibrated instruments or manufacturing drawings.

Length, width and height indicate different dimensions of a block. Depth spans an opening to the inner floor rather than the outside bottom. Diameter crosses the center between opposite circle edges; radius spans only the center to one edge. The drawing compass has a connected point/pencil arrangement and an arc meeting the pencil tip; an initially ambiguous off-center arc was corrected before acceptance.

Two older pictures receive new sibling assets. **Heart** now focuses on an anatomical organ model rather than a consultation scene. A targeted correction clarified pulmonary arterial routing after two AI passes found an ambiguous same-side fork. **Structure** now shows how a complete wooden bridge frame and deck connect across two supports. All prior source and immutable media remain available; image refreshes do not increase the word count.

All content remains an **AI-assisted editorial preview**. Independent human language and qualified specialist review are pending. Software verifies completeness and exact bindings, not semantic truth or professional qualification. Clinical words are taught through neutral vocabulary examples, without drug doses, diagnostic readings or treatment instructions. New entries without licensed recordings use device English speech where available and remain excluded from recording-only exercises.

## Publication

The [campaign ledger](../content/expansion-campaign.json) counts 24 additions separately from two image refreshes. The [production protocol](vocabulary-production.md) continues toward 500 published entries in each priority category before the remaining category queue.

```sh
npm run campaign:status
npm run check:content
npm test
ATLAS_BASE=/mehrdadika/ npm run build
```

Local validation passed: all **164 tests**, complete content/native-reading/illustration/style/campaign checks and the production build under `/mehrdadika/`. Actual browser checks covered Persian physiotherapist and Portuguese compass cards at 1280px, plus Spanish width and Persian physiotherapist at 390px. Each loaded its expected 512px image with correct language direction, no page overflow and no recorded warnings or errors. These checks assess delivery and layout; independent human language and specialist review are still pending.
