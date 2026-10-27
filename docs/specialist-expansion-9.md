# Specialist vocabulary batch 9

Release `2026-10-preview-14` adds **24 distinct English entries**: 12 medical and 12 engineering. Each priority category grows from 134 to **146 of 500**, with 354 remaining in each. The atlas contains **450 English words and 451 meanings** across 32 categories, with complete Persian, Brazilian Portuguese and Latin American Spanish support. Each Portuguese and Spanish edition contains 902 translated examples, 1350 collocations and 450 usage notes. The existing `pressure` card retains two meanings and four examples; translations and additional senses do not multiply the word count.

| Coverage | New vocabulary |
| --- | --- |
| Sense organs | eye, ear, nose, tongue |
| Eye and ear structures | eyelid, pupil, iris, retina, cornea, eardrum |
| Voice and breathing anatomy | larynx, diaphragm |
| Mechanical drives | chain, sprocket, belt, rack, pinion |
| Shaft supports and motion components | bushing, spindle, keyway, camshaft, crankshaft, connecting rod, flywheel |

Each entry has an explicit selected sense, UK/US IPA, an original English learner definition, Persian scaffolding, two meaningful examples, three collocations and useful distinctions. Both native overlays bind to the exact English words, senses, examples and collocations. CEFR labels remain approximate editorial estimates. The cards use the existing Atlas, daily learning, spaced-review and practice flows. Existing lexical/sense identities, recordings, science course and learner progress remain preserved.

## Pictures and review

Each addition has its own 512px WebP made with the built-in image tool. Clinical pictures use precise anatomy on cool white, with restrained mint and pale blue. Technical product studies use slate, silver and amber. Actual full generated pixels and final 512px/120px conversions receive author inspection and a second AI review. Literal prompts, rights, current image hashes, category-profile hashes and actual findings are recorded in [media provenance](../content/media-provenance.json) and the [illustration audit](../content/illustration-audit.json).

The medical cards distinguish the whole eye, upper eyelid, dark pupil opening, colored iris, posterior light-sensitive retina and transparent anterior cornea. The eyelid's pale mint overlay is an educational highlight, explained in all three editions. Ear depicts outer, middle and inner regions; eardrum focuses on the membrane closing the canal, with a medial malleus attachment. Larynx is distinct from the thyroid gland and the trachea. Diaphragm is shown beneath the lungs as a simplified location model, with no invented aperture map or dynamic pressure readings.

The chain and sprocket cards distinguish linked rollers from a toothed wheel that engages them. Belt uses a continuous flexible loop. Rack and pinion use complementary highlights for the straight toothed bar and circular gear. Bushing shows a plain sleeve, without balls or rollers. Spindle and keyway distinguish a machine-tool shaft from its recessed key slot. Camshaft lobes differ from the offset crankpin of a crankshaft; the connecting rod has separate small and split large ends. Flywheel emphasizes the thick inertial rim, without asserting speed or energy ratings.

Inspections led to corrections before publication. The ear's initial vestibular region had an extra apparent loop and was corrected to three semicircular canals. A cornea candidate colored too much of the anterior chamber and introduced an ambiguous thick rear crescent; the corrected image restricts teal to the thin outer corneal rim and leaves the chamber colorless. The rack was also reframed after its main bar was cropped at both ends. Rejected candidates and literal correction prompts remain private; their failed assessments are retained rather than presented as approval.

Two older clinical pictures receive new sibling assets: **medicine** now uses a clean generic tablet/capsule still life, and **recover** shows the same woman moving from tired bed rest to comfortable upright walking. Their lexical/sense and audio identities are retained, with all earlier immutable media available. Illustration refreshes add no words.

All content remains an **AI-assisted editorial preview**, pending independent human language and qualified specialist review. Software establishes completeness, integrity and exact bindings; it cannot prove semantic truth or professional approval. The pictures teach vocabulary, with no fabricated recordings, patient data, doses, treatment instructions, engineering settings or calibration claims. Entries without licensed recordings use an available device English voice and remain excluded from recording-only exercises.

## Publication

The [campaign ledger](../content/expansion-campaign.json) records 24 additions separately from two older-image refreshes. The [production protocol](vocabulary-production.md) continues toward 500 published entries in each priority category, then the existing remaining-category queue.

```sh
npm run campaign:status
npm run check:content
npm test
ATLAS_BASE=/mehrdadika/ npm run build
```

Local validation passed: all **164 tests**, complete content/native-vocabulary/native-reading/illustration/style/campaign checks and the production build under `/mehrdadika/`. Actual browser screenshots and card content were inspected in all three editions at both 1280px desktop and 390px phone widths: Persian cornea and diaphragm, Portuguese sprocket and spindle, and Spanish keyway and retina. Each card loaded the expected 512px immutable picture with correct language direction, no horizontal overflow and no recorded warning/error messages. Independent human language and specialist review remain pending.
