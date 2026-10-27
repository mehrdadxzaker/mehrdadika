# Specialist vocabulary batch 6

Release `2026-10-preview-11` adds **24 distinct English entries**: 12 medical and 12 engineering. Each priority category grows from 98 to **110 of 500**, with 390 remaining in each. The atlas contains **378 English words and 379 meanings**, with complete Persian, Brazilian Portuguese and Latin American Spanish support. Each Portuguese and Spanish edition contains 758 translated examples, 1134 collocations and 378 usage notes.

| Coverage | New vocabulary |
| --- | --- |
| Imaging and laboratory examinations | X-ray, ultrasound, MRI, CT scan, blood test, urine test |
| Tooth forms and tissues | incisor, canine, premolar, enamel, dentine, root canal |
| Electrical protection and connections | circuit breaker, terminal block, connector, printed circuit board |
| Electrical components | inductor, LED, potentiometer, heat sink, busbar |
| Magnetism and signal observation | solenoid, electromagnet, oscilloscope |

Every entry has one explicit selected sense, UK/US IPA, an original English learner definition, Persian support, two contextual examples, three collocations and useful distinctions. Both native overlays bind to the exact English source. CEFR labels are approximate editorial estimates. The vocabulary uses the existing Atlas, daily learning, spaced-review and practice flows. Existing lexical and sense identities, audio paths, course content and learner progress are preserved.

## Pictures and review

All 24 additions have separate 512px WebP pictures generated with the built-in image tool. Medical images use clean cool-white/mint clinical rendering; engineering uses precise slate/silver/amber product drawings. Actual full generated pixels and final 512px/120px conversions receive an author inspection and a second AI review. Exact prompts, rights, image hashes, category-profile hashes and actual findings are recorded in [media provenance](../content/media-provenance.json) and the [illustration audit](../content/illustration-audit.json).

Imaging vocabulary distinguishes an X-ray image from a scanner or radiation itself, sound-wave ultrasound, a longer-bore MRI scanner and a shorter-ring CT scanner. Scanner designs vary; the pictures are illustrative examples. Laboratory cards show specimen analysis without interpreting clinical results. Dental images distinguish the flat-edged incisor, pointed canine, premolar chewing cusps, the outer crown enamel, underlying dentine and the anatomical root passage. Root canal here names a passage, while the usage note explains the common treatment meaning.

Engineering pictures emphasize actual contact, connected components and visible mechanisms. A solenoid actuator has a moving plunger; the electromagnet demonstrates attraction by an energized coil and iron core. The oscilloscope waveform is a teaching illustration without numerical readings. These pictures are vocabulary aids, not calibrated instruments, manufacturing drawings or practical wiring instructions.

Before acceptance, targeted edits corrected the LED’s conventional cup/lead layout, the solenoid’s return-spring position and an electromagnet washer link that obscured direct magnetic contact. Laboratory slide preparations were flattened, dental cusp shapes refined and a connector label artifact removed. Rejected candidates remain in the private production evidence; accepted prompts and findings describe the corrections honestly.

Two older pictures receive new sibling assets. **Doctor** now uses a precise cool clinical examination scene with a connected stethoscope. **Voltage** shows a voltmeter connected across two battery terminals. Targeted voltage edits removed ambiguous hidden lead routing and invented transparent battery internals, then clarified the unnumbered needle indication. Previous source and immutable media remain available; these refreshes do not increase the word count.

All content remains an **AI-assisted editorial preview** awaiting independent human language and qualified specialist review. Software checks completeness and exact bindings; it does not establish semantic truth or professional approval. There are no drug doses, patient data, diagnostic results or treatment instructions. New words without licensed recordings use an available device English voice and remain excluded from recording-only exercises.

## Publication

The [campaign ledger](../content/expansion-campaign.json) counts 24 additions separately from two older-image refreshes. The [production protocol](vocabulary-production.md) continues toward 500 published entries in each priority category before the remaining category queue.

```sh
npm run campaign:status
npm run check:content
npm test
ATLAS_BASE=/mehrdadika/ npm run build
```

Local validation passed: all **164 tests**, complete content/native-reading/illustration/style/campaign checks and the production build under `/mehrdadika/`. Actual browser checks covered Persian root canal and Portuguese printed circuit board at 1280px, plus Spanish ultrasound and Persian electromagnet at 390px. Each loaded its expected 512px immutable image with correct language direction, no page overflow and no recorded warning/error messages. These are delivery and layout checks; independent human language and specialist review remain pending.
