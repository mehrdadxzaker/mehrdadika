# Specialist vocabulary batch 10

Release `2026-10-preview-15` adds **24 distinct English entries**: 12 medical and 12 engineering. Both collections pass the 150-entry milestone, growing from 146 to **158 of 500**, with 342 remaining in each. The atlas contains **474 English words and 475 meanings** across 32 categories, with complete Persian, Brazilian Portuguese and Latin American Spanish support. Each Portuguese and Spanish edition contains 950 translated examples, 1422 collocations and 474 usage notes. The existing `pressure` card retains two meanings and four examples; translations and additional senses do not multiply the word count.

| Coverage | New vocabulary |
| --- | --- |
| Pharmaceutical containers and forms | ampoule, vial, syrup, lozenge, suppository, pill organizer |
| Clinical and oral-care aids | tongue depressor, hearing aid, eye patch, earplug, dental floss, denture |
| Valve types | ball valve, gate valve, butterfly valve, check valve |
| Fluid control and measurement | pressure regulator, pressure gauge, flowmeter, rotameter |
| Fluid-power components | hydraulic jack, hydraulic cylinder, accumulator, pneumatic actuator |

Each entry has an explicit selected sense, UK/US IPA, an original English learner definition, Persian scaffolding, two meaningful examples, three collocations and useful distinctions. Both native overlays bind to the exact English words, senses, examples and collocations. CEFR labels remain approximate editorial estimates. The cards use the established Atlas, daily learning, spaced-review and practice flows. Existing lexical/sense identities, recordings, science course and learner progress remain preserved.

## Pictures and review

Each new entry has an individual 512px WebP made with the built-in image tool. Clinical product studies use precise forms on cool white with restrained mint and pale blue. Technical cutaways and product studies use slate, silver and amber. Actual full generated pixels and final512px/120px conversions receive author inspection and a second AI review. Literal prompts, rights, current image hashes, category-profile hashes and actual findings are recorded in [media provenance](../content/media-provenance.json) and the [illustration audit](../content/illustration-audit.json).

Ampoule's fused glass neck differs from vial's stoppered opening and protective cap. Syrup and lozenge show generic dosage forms without identifying a medicine from its color or shape. Suppository is an isolated solid and protective packaging, without an administration scene. Pill organizer is empty and offers no medicine schedule. Hearing aid depicts an electronic behind-the-ear device, distinct from passive earplug protection. Eye patch covers one eye; dental floss and an upper removable denture have separate oral-care cues.

The valve pictures distinguish a bored rotating ball, a sliding gate, a supported rotating disc and a one-way hinged clapper. Pressure regulator controls downstream pressure; gauge indicates pressure. A generic flowmeter uses a qualified turbine example; rotameter shows an upright widening tube with a free float and upward flow. Hydraulic jack is an unloaded external bottle-jack study. Hydraulic cylinder and pneumatic actuator distinguish liquid-driven and air-driven linear movement. Accumulator depicts the selected gas-bladder example with gas inside the flexible separator and hydraulic fluid outside it. These are vocabulary illustrations, not rated designs, calibrated instruments or operating instructions.

Inspections produced corrections before publication. Four molar-like denture premolars were changed to smaller two-main-cusp crowns while preserving14 teeth and the upper palatal plate. Rotameter's initial disconnected upper ellipse was replaced by a continuous tapered passage joining both fittings. Accumulator's false external gas pocket/free liquid level was removed; the fluid now fills all space outside its bladder, with port internals simplified. Check-valve clapper direction and regulator flow path, spring freedom and poppet travel were corrected. Cylinder's exposed moving rod, turbine pickup clearance, pneumatic-actuator framing and eye-patch strap continuity were also corrected. A functional cloze check also caught a first example missing the complete ball valve headword; its English, Persian, Portuguese and Spanish bindings were corrected before publication. Rejected candidates and literal correction prompts remain private; failed assessments are preserved rather than presented as approval.

Two older engineering pictures receive new sibling assets: **material** retains distinct wood, metal, concrete and cloth samples in the current slate technical style; **mechanism** shows a connected slider-crank assembly with rotation and reciprocation cues. Their lexical/sense and audio identities stay intact, and earlier immutable media remain available. Illustration refreshes add no words.

All content remains an **AI-assisted editorial preview**, pending independent human language and qualified specialist review. Software establishes completeness, integrity and exact bindings; it cannot prove semantic truth or professional approval. There are no fabricated recordings, patient data, doses, treatment instructions, engineering settings or calibration claims. Entries without licensed recordings use an available device English voice and remain excluded from recording-only exercises.

## Publication

The [campaign ledger](../content/expansion-campaign.json) records 24 additions separately from two older-image refreshes. The [production protocol](vocabulary-production.md) continues toward 500 published entries in each priority category, then the existing remaining-category queue.

```sh
npm run campaign:status
npm run check:content
npm test
ATLAS_BASE=/mehrdadika/ npm run build
```

Local validation passed: all **164 tests**, complete content/native-vocabulary/native-reading/illustration/style/campaign checks and the production build under `/mehrdadika/`. Actual browser screenshots and card content were inspected in all three editions at both 1280px desktop and 390px phone widths: Persian denture and hearing aid, Portuguese pressure regulator and rotameter, and Spanish ball valve and hydraulic cylinder. Each card loaded its expected 512px immutable image with correct language direction, no horizontal overflow and no recorded warning/error messages. The corrected ball-valve first sentence visibly contains the full headword and its exact Spanish translation. Independent human language and specialist review remain pending.
