# Specialist vocabulary batch 12

Release `2026-10-preview-17` adds **24 distinct English entries**: 12 medical and 12 engineering. Each priority collection grows from 170 to **182 of 500**, with 318 remaining. The atlas contains **522 English words and 523 meanings** across 32 categories, with complete Persian, Brazilian Portuguese and Latin American Spanish support. Each Portuguese and Spanish edition contains 1046 translated examples, 1566 collocations and 522 usage notes. The existing `pressure` card retains its two meanings and four examples; translations, inflections and extra senses do not multiply the English word count. Passing 500 total atlas words does not complete either specialist collection.

| Coverage | New vocabulary |
| --- | --- |
| Brain and spinal anatomy | cerebrum, cerebellum, brainstem, spinal cord |
| Musculoskeletal structures | vertebra, intervertebral disc, meniscus, Achilles tendon |
| Cells and signaling | neuron, synapse, red blood cell, white blood cell |
| Engineering metals | steel, aluminium, copper, brass, bronze, stainless steel, cast iron, alloy |
| Other engineering materials | composite, ceramic, polymer, plywood |

Each entry has an explicit selected sense, UK/US IPA, an original English learner definition, Persian scaffolding, two meaningful examples, three collocations and useful distinctions. The first example keeps its complete headword together for cloze practice. Both native overlays bind to the same English words, sense IDs, examples and collocations. CEFR labels are approximate editorial estimates. Existing Atlas, daily learning, spaced-review and practice flows consume the new content. Earlier lexical/sense identities, licensed recordings, science course and learner progress remain preserved.

## Pictures and review

Individual original images use the built-in image tool and are saved as 512px WebP assets. Medical anatomy uses precise organic clinical forms on cool white with restrained mint and pale blue selection cues. Engineering uses technical product studies and explanatory material cutaways on slate with silver and amber. Actual full generated pixels and final512px/120px conversions are inspected by their author and a second AI reviewer. Literal final prompts, exact asset hashes, category-profile hashes, rights and actual findings are recorded in [media provenance](../content/media-provenance.json) and the [illustration audit](../content/illustration-audit.json). These bindings support correction and accountability; software checks cannot establish anatomical or material truth.

Cerebrum highlights paired large hemispheres, while cerebellum highlights finer folded posterior-inferior tissue. Brainstem selects the midbrain/pons/medulla connection rather than the whole brain. Spinal cord is nervous tissue inside an opened vertebral canal, distinct from its bony protection. Vertebra shows one lumbar-type bone; regional shapes vary. The disc cutaway shows outer fibrous lamellae and a softer inner nucleus between vertebral bodies. Meniscus uses two open knee fibrocartilage crescents on the tibial plateau. Achilles tendon connects the calf muscle complex to the posterior heel. These are simplified normal educational models, not scans, surgical exposure or treatment instructions.

Neuron uses a typical myelinated multipolar cell with one axon; this morphology is not universal. The selected chemical synapse shows vesicle fusion releasing small transmitter dots across an open cleft toward receptors; whole vesicles do not cross. Mature human red blood cells have depressed continuous centers rather than through-holes or nuclei. The white-blood-cell illustration selects a neutrophil with fine granules and connected lobes of one nucleus; other white-cell types differ. All three native editions explain these selected examples.

Material examples include a steel I-section, an aluminium extrusion, a copper tube coil, a brass fitting, a bronze bushing, stainless sheet/fasteners and a cast-iron housing. Their colors and forms cannot prove material composition, purity, grade, strength or corrosion resistance; every native usage note preserves this limit. Aluminium retains the selected British-spelling headword while notes explain usual US aluminum. The alloy inset selects a substitutional mixed-atom example without claiming a formula or percentage. Composite selects bonded woven fibres in a resin matrix; its close crop is a material cutaway rather than a full component drawing. Polymer shows granules with schematic repeated-unit chains; beads represent repeat units, not an atomic formula, and the inset clips one chain at its lower edge. Ceramic and plywood show selected engineering examples. No dimensions, grades or tested performance are invented.

Two older illustrations receive new sibling assets. **Bandage** replaces an inherited warm flat roll and decorative medical cross with woven continuous bandage rolls in the cool clinical style. **Energy** replaces the inherited cream technical SVG with an ideal ball rolling down a supported track, equal-height potential/kinetic energy bars and a motion cue in the current slate/amber style. The inherited pendulum illustration was physically coherent; its replacement updates the visual language. The selected rolling example includes both translation and rotation in kinetic energy. Rejected generated pendulum attempts had unequal radii and were retained privately; a ramp candidate also had an ambiguous height annotation, removed by a focused edit before acceptance. No numerical readings, power rating or perpetual-motion claim is implied. Word/sense/audio identities stay intact, and older canonical and immutable media remain available. Image refreshes add no words. Other corrected private candidates include an ambiguous brainstem nub, vertebral/disc form and coarse or closed-ring neutrophil detail; actual final reviews bind to the corrected bytes.

All content remains an **AI-assisted editorial preview**, pending independent human language and qualified specialist review. No human or professional approval is implied. Entries without finished licensed recordings use an available device English voice and remain excluded from recording-only exercises. There are no fabricated recordings, patient records, doses, procedures or material test certificates.

## Publication

The [campaign ledger](../content/expansion-campaign.json) records 24 additions separately from two image refreshes. The [production protocol](vocabulary-production.md) continues toward 500 published entries in both priority categories, then the existing remaining-category queue and milestones.

```sh
npm run campaign:status
npm run check:content
npm test
ATLAS_BASE=/mehrdadika/ npm run build
```

Local validation passed: all **164 tests**, complete content/native-vocabulary/native-reading/illustration/style/campaign checks and the production build under `/mehrdadika/`. Actual screenshots and complete rendered card text were inspected across all three editions at1280px desktop and390px phone widths: Persian neuron and synapse, Portuguese alloy and plywood, Spanish cerebellum and white blood cell. Each card loaded its expected512px immutable image with correct language direction, no horizontal overflow and no recorded warning/error messages. Selected anatomical and material caveats remain visible in the native text. Independent human language and qualified specialist review remain pending.
