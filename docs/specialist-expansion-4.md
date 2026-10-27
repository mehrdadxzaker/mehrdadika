# Specialist vocabulary batch 4

Release `2026-10-preview-9` adds **24 distinct English entries**: 12 medical and 12 engineering. Each priority category grows from 74 to **86 of 500**, with 414 remaining in each. The atlas contains **330 English words and 331 meanings**, with complete Persian, Brazilian Portuguese and Latin American Spanish support. Each Portuguese and Spanish edition contains 662 translated examples, 990 collocations and 330 usage notes.

| Coverage | New vocabulary |
| --- | --- |
| Skeletal anatomy | skull, pelvis, sternum, clavicle, scapula, patella |
| Specimen collection and care supplies | specimen cup, swab, tourniquet, suture, IV bag, IV pole |
| Pipes and fluid connections | pipe, hose, elbow, tee, coupling, flange |
| Fluid and heat-transfer equipment | duct, filter, impeller, manifold, reservoir, heat exchanger |

Each addition has one explicit sense, UK/US IPA, an original English learner definition, Persian support, two contextual examples, three collocations and useful distinctions. Both native overlays bind to the exact English source. CEFR labels remain approximate editorial estimates. Vocabulary uses the existing Atlas, learning, spaced-review and practice flows; lexical and sense identities, recordings, the existing science course and learner progress are preserved.

## Pictures and review

All 24 new words have distinct 512px WebP illustrations made with the built-in image tool. Medicine uses precise clinical forms on cool white/mint; engineering uses slate, silver and amber technical rendering. Actual generated sources and converted 512px/120px pictures receive an author inspection followed by a second AI review of the exact accepted assets. Prompts, rights, byte hashes, semantic findings and current category-profile bindings are recorded in [media provenance](../content/media-provenance.json) and the [illustration audit](../content/illustration-audit.json).

Anatomy illustrations use an isolated bone or a highlighted bone in skeletal context, so the target can be distinguished from neighboring structures. Equipment illustrations identify the selected medical supply without drug names, doses, treatment instructions or clinical claims. Engineering illustrations distinguish flexible hose from rigid pipe, curved elbow from three-port tee, joining coupling from bolted flange, and separate inner-tube and annular fluid paths in a double-pipe heat exchanger. Cutaways expose the teaching relation while retaining connected physical parts.

The older **circuit** image is replaced with a closed-switch, illuminated-lamp illustration whose wires trace one complete loop through proper terminals. This corrects the inherited open-switch/lit-lamp contradiction. **Engine** receives a focused technical assembly illustration in place of the older mechanic scene. Both use new sibling files; all prior source and immutable media remain available. Image corrections do not add to the English word count.

All content remains an **AI-assisted editorial preview**. Independent human language and qualified specialist review are pending. Software checks completeness and exact bindings; it does not establish semantic truth or professional approval. New words without licensed recordings use device English speech where available and remain excluded from recording-only exercises.

The coupling picture was corrected once because the isolated sleeve resembled a nut. A second AI review found a disconnected oval in the first suture picture; a targeted edit removed that extra loop, and the final continuous needle-attached strand passed full-size and thumbnail read-back. Rejected candidates remain private. Impeller notes describe the visible rear plate and exposed blades without depending on varying open/semi-open subtype terminology.

## Publication

The [campaign ledger](../content/expansion-campaign.json) counts 24 additions separately from two image refreshes. The [production protocol](vocabulary-production.md) continues toward 500 entries in each priority category before returning to the remaining category queue.

```sh
npm run campaign:status
npm run check:content
npm test
ATLAS_BASE=/mehrdadika/ npm run build
```

## Validation

The batch passed 164 unit/integration tests, the complete content/native/illustration/style/campaign checks and a production build under `/mehrdadika/`. Browser checks covered Persian patella and Portuguese heat-exchanger cards at 1280px, plus Spanish corrected-suture and Persian manifold cards at 390px. All checked images loaded at 512px; phone pages had no horizontal overflow, and no relevant console errors appeared. All 306 earlier English records and native overlays, recorded audio identities, the science course and prior immutable media are preserved.
