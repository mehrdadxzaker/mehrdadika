# Specialist vocabulary batch 2

Release `2026-10-preview-7` adds **24 distinct English entries**: 12 medical and 12 engineering. Medicine and healthcare and engineering each grow from 50 to **62 of 500**, leaving 438 entries in each priority category. The atlas contains **282 English entries and 283 meanings**. Both Portuguese and Spanish have 566 examples, 846 collocations and 282 usage notes, with complete support for all published words.

| Coverage | New vocabulary |
| --- | --- |
| Dentistry | tooth, gum, molar, dental mirror |
| Diagnostic laboratory equipment | microscope, test tube, pipette, centrifuge |
| Mobility and rehabilitation | cane, walker, splint, prosthesis |
| Manufacturing methods and tools | weld, solder, ingot, lathe, milling machine, anvil |
| Civil structures | truss, column, foundation, girder, rebar, scaffold |

Each addition has one explicit sense, UK/US IPA, an original English definition, Persian teaching text, two sense-bound examples, three collocations and usage distinctions. Brazilian Portuguese and Latin American Spanish provide matching native glosses, definitions, examples, collocations and tips. Approximate CEFR labels are editorial estimates. Existing app navigation, science courses, word/sense identities and edition-specific progress are preserved.

## Pictures and corrections

All 24 new images are distinct 512px WebP illustrations generated with the built-in image tool. Medical pictures use pale mint/ivory clinical rendering; engineering uses slate backgrounds with amber technical accents. Every generated source and its final 512px/120px output received actual visual inspection, followed by a second AI check of the final image. Prompts, rights, exact image hashes, semantic findings and category-profile hashes are recorded in [media provenance](../content/media-provenance.json) and the [illustration audit](../content/illustration-audit.json). Source assets live under `public/atlas/img/` using the entry ID, such as `dental-mirror.webp` or `milling-machine.webp`.

The reviews distinguish a single-root incisor from a two-root lower molar, gingiva from chewing gum, a cane from a walker, a supporting splint from a replacement prosthesis, fusion welding from soldering, a lathe's rotating workpiece from a milling machine's rotating cutter, and a primary girder from its supported beams. Machine connections, workpiece contact, dental anatomy, rotor/tube layout and structural supports are checked in the actual pixels. Unclear candidates are corrected and retained privately, outside release artifacts. Primary factual references are recorded alongside the new source entries.

Two older engineering pictures are refreshed as `force-v3.webp` and `current-v3.webp`. The force image shows hand-to-block contact and the applied-force direction. The closed electrical circuit shows conventional current from the positive terminal through the lamp toward the negative terminal, with separate connections and an insulating holder. Prior source images and immutable published media remain available for older sessions.

The existing **current** card now defines its selected noun sense as a flow of electric charge. Portuguese and Spanish definitions match that clarification; adjective-only synonyms, antonyms and the unrelated adverb family entry are removed. Its lexical/sense IDs, examples, recordings and learner progress are preserved.

These remain **AI-assisted editorial previews** awaiting independent human language and qualified specialist review. Software checks completeness, hashes and stale bindings; it cannot establish semantic truth or professional approval. New words without packaged recordings use the available device English voice and remain excluded from exercises that require recordings.

## Continuing publication

The [campaign ledger](../content/expansion-campaign.json) records 24 additions separately from two existing-word image corrections. The checker enforces that distinction and verifies both sets of image/native bindings. The [production protocol](vocabulary-production.md) continues toward 500 entries in each priority category before resuming the other 30 categories.

```sh
npm run campaign:status
npm run check:content
npm test
ATLAS_BASE=/mehrdadika/ npm run build
```

## Validation

The batch passed 164 unit/integration tests, all content/native/illustration/campaign checks and the production build under `/mehrdadika/`. Browser verification covered the corrected Persian current card and Portuguese centrifuge card at 1280px, plus Spanish scaffold and Persian milling-machine cards at 390px. All checked images loaded at 512px, phone pages had no horizontal overflow, and no relevant console errors appeared. Earlier immutable media and lexical/sense identities remain intact.
