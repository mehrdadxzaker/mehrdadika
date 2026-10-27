# Specialist vocabulary batch 3

Release `2026-10-preview-8` adds **24 distinct English entries**: 12 medical and 12 engineering. Each priority category grows from 62 to **74 of 500**, with 426 remaining in each. The atlas contains **306 English words and 307 meanings**, with complete Persian, Brazilian Portuguese and Latin American Spanish support. Each Portuguese and Spanish edition contains 614 translated examples, 918 collocations and 306 usage notes.

| Coverage | New vocabulary |
| --- | --- |
| Pharmacy forms and devices | tablet, capsule, ointment, inhaler, blister pack, dropper |
| Skin changes and minor injury vocabulary | bruise, rash, blister, scar, scratch, swelling |
| Electrical parts and connections | fuse, relay, switch, battery, cable, wire, socket, plug |
| Conductivity and measurement | insulator, conductor, voltmeter, ammeter |

Each word has one explicit sense, UK/US IPA, an original English learner definition, Persian support, two contextual examples, three collocations and usage distinctions. Both native overlays match the published English source exactly. Approximate CEFR labels remain editorial estimates. New vocabulary uses the existing Atlas, learning, spaced-review and practice flows; no separate course navigation is introduced.

## Pictures and review

All 24 new words have distinct 512px WebP illustrations made with the built-in image tool. Medicine uses clean mint/ivory clinical rendering; engineering uses slate/amber technical illustrations. Actual generated sources and converted 512px/120px images are inspected, followed by a second AI review of the final assets. Prompts, rights, byte hashes, semantic findings and exact category-profile bindings are recorded in [media provenance](../content/media-provenance.json) and the [illustration audit](../content/illustration-audit.json). New source images are under `public/atlas/img/` using their lexical IDs, such as `blister-pack.webp` and `voltmeter.webp`.

Medical pictures distinguish a compressed tablet from a shell capsule, medicine packaging from a skin blister, and a medicine-bottle dropper from a laboratory pipette. Skin illustrations distinguish intact discoloration, raised rash bumps, a fluid-filled blister, healed scar tissue, a shallow scratch and diffuse swelling. They illustrate vocabulary without identifying a diagnosis, drug, dose or treatment. Definitions of dosage forms avoid assuming a route for every product of that type.

Electrical pictures distinguish a multi-conductor cable from a single-core wire, a female socket from its matching plug, and an insulating support from a conductive strip. Meter diagrams distinguish a voltmeter connected across a load from an ammeter connected in series. Connections, terminal counts, contact gaps and essential V/A letters are checked in the actual pixels. No invented numeric readings or qualification claims are supplied.

The older **friction** and **beam** images receive new sibling assets. Friction uses a visible surface-contact relationship with friction opposing motion; beam shows the load-bearing structural sense. Older source and immutable media remain available, and word/sense identities, recordings, existing science courses and learner progress are preserved. Image replacements do not add to the English word count.

All content remains an **AI-assisted editorial preview**. Independent human language and qualified specialist review are pending. Software validates completeness and binding integrity; it does not establish semantic truth or professional approval. New entries without licensed recordings use device English speech where available and remain excluded from recording-only exercises.

## Publication

The [campaign ledger](../content/expansion-campaign.json) records 24 new entries separately from two image refreshes. The [production protocol](vocabulary-production.md) continues toward 500 entries in each priority category before returning to the remaining 30-category queue.

```sh
npm run campaign:status
npm run check:content
npm test
ATLAS_BASE=/mehrdadika/ npm run build
```

## Validation

The batch passed 164 unit/integration tests, the complete content/native/illustration/campaign checks and the production build under `/mehrdadika/`. English cards now span four 100-entry-capacity shards, with old immutable files retained. Browser checks covered Persian voltmeter and Portuguese dropper cards at 1280px, plus Spanish ammeter and Persian blister-pack cards at 390px. All checked images loaded at 512px, phone pages had no horizontal overflow, and no relevant console errors appeared.
