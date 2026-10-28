# Specialist vocabulary batch 13

Release `2026-10-preview-18` adds **24 distinct English entries**: 12 medical and 12 engineering. Each priority collection grows from 182 to **194 of 500**, with 306 remaining. The atlas contains **546 English words and 547 meanings** across 32 categories, with complete Persian, Brazilian Portuguese and Latin American Spanish support. Each Portuguese and Spanish edition contains 1094 translated examples, 1638 collocations and 546 usage notes. The existing `pressure` card retains two independently identified meanings and four examples. Translations, inflections, extra meanings and image corrections do not increase the English word count.

| Coverage | New vocabulary |
| --- | --- |
| Heart chambers and major vessels | atrium, ventricle, aorta, vena cava, capillary |
| Heart valve and blood components | heart valve, platelet, plasma, haemoglobin |
| Cardiorespiratory physiology | pulse, circulation, respiration |
| Electronic signal conversion | rectifier, inverter, oscillator, amplifier, voltage regulator |
| Integrated components and prototyping | integrated circuit, microcontroller, breadboard, jumper wire |
| Logic and optical isolation | logic gate, operational amplifier, optocoupler |

Each original entry has an explicit selected sense, UK/US IPA, approximate editorial CEFR, an English learner definition, Persian scaffolding, two meaningful examples, three collocations and useful distinctions. The first example keeps the full headword together for cloze practice. Both native overlays bind to identical English words, sense IDs, examples and collocations. The existing Atlas, daily learning, spaced-review and practice flows consume the content. Earlier word/sense identities, licensed recordings, science course and learner progress remain preserved.

## Pictures and review

Each original image uses the built-in image tool and is saved as a 512px WebP. Medical models use precise organic clinical forms on cool white with restrained mint and pale blue selection cues. Engineering uses slate, silver and purposeful amber technical product studies, cutaways and diagrams. Each author and a second AI reviewer inspect actual full-size pixels and final512px/120px conversions. [Media provenance](../content/media-provenance.json) records literal final prompts, rights and hashes; the [illustration audit](../content/illustration-audit.json) records actual semantic/style findings bound to current asset bytes, category-profile hashes, selected meanings and examples. These checks establish identity and evidence bindings, not specialist truth or human approval.

Atrium highlights the right receiving chamber, while ventricle highlights the thicker-walled left pumping chamber. The aorta shows its main ascending/arch/descending route and three major arch-branch origins; the first branch bifurcates. Its gross external model does not expose the full intracardiac left-ventricular junction. Both venae cavae connect to the same right atrium. The capillary has a thin lining around a narrow lumen and red cells, without an arterial muscular wall. Aortic heart-valve views select three attached cusps opening and closing; other heart valves differ. Normal models are simplified and are not scans or surgical instructions.

Platelet is a human anucleate fragment with granules. Plasma is the upper straw-colored liquid in an anticoagulated separated sample, distinct from serum after clotting; layer proportions are schematic. Haemoglobin selects a conceptual adult four-subunit/four-haem model with red-cell context, not an atom-exact structure. The US spelling hemoglobin remains explained. Pulse uses finger pads at the thumb side of the wrist, without invented rate readings. Circulation traces two closed circuits through four heart chambers, lungs and body tissue. Blue/red denote relative oxygenation in the diagram; real venous blood is red. Respiration compares inhalation and exhalation with coherent lung volume, diaphragm position and airflow, while text distinguishes ventilation, external gas exchange and cellular respiration.

Rectifier shows alternating input becoming unidirectional pulsating output; smoothing and regulation are separate functions. Inverter selects DC-to-AC power conversion, rather than a Boolean NOT gate. Oscillator uses supplied energy to generate a periodic signal. Amplifier shows larger amplitude with the same illustrative signal frequency and a separate energy supply. Integrated circuit exposes one conceptual die and bond wires; microcontroller groups CPU, memory and I/O within one device rather than claiming a physical die floorplan. Breadboard exposes two independent five-contact strips across a central insulating trench and separate side rails; row counts and rail layouts vary. Jumper wire selects a male-to-male temporary connector. Voltage regulator selects a linear example with sufficient input headroom; output is not guaranteed under every load or temperature condition.

Logic gate selects a two-input AND example with logical states 1,1 to 1; these are not measured voltages or a claim that all gates are AND. The operational-amplifier symbol distinguishes two signal inputs, one output and two supply terminals. Optocoupler selects LED-to-phototransistor transfer across an electrically unconnected gap; other detectors exist. All electronic diagrams are qualitative vocabulary explanations, not construction circuits, pinouts, tested specifications or certified isolation ratings.

One older picture receives a new sibling asset: **pressure** now shows red blood acting radially against a vessel wall and a separate force-over-area platen example. The outlined top platen face projects its congruent underside contact footprint; the formula describes average force per area rather than a measured local stress distribution. Both published senses and all four examples remain intact, and prior SVG and immutable media remain available. Existing stethoscope and thermometer pictures were actually inspected and retained because their clinical style and teaching cues remain clear.

Corrections are recorded honestly. A circulation candidate incorrectly placed pulmonary outflow at the right atrium; a focused edit made the single trunk originate in the lower right ventricle and pass separately in front of the atrium. A pressure candidate labeled an unloaded block patch as contact area; this was corrected before acceptance. An optocoupler candidate shorted both inputs to the LED anode; a targeted edit restored separate anode/cathode routes and square framing. Other corrected private candidates include an ambiguous atrial vessel, an overly thick plasma buffy coat, an amplifier output artifact and inadequate regulator input headroom. Rejected candidates and prompts remain private.

All content remains an **AI-assisted editorial preview**, pending independent human language and qualified specialist review. No human or professional approval is implied. Entries without finished licensed recordings use an available device English voice and remain excluded from recording-only exercises. There are no fabricated recordings, patient records, diagnosis thresholds, treatment instructions or measured engineering results.

## Publication

The [campaign ledger](../content/expansion-campaign.json) records 24 additions separately from one image refresh. The [production protocol](vocabulary-production.md) continues toward 500 published English entries in both priority categories, then the configured remaining-category queue and milestones.

```sh
npm run campaign:status
npm run check:content
npm test
ATLAS_BASE=/mehrdadika/ npm run build
```

Local validation passed: all **164 tests**, complete content/native-vocabulary/native-reading/illustration/style/campaign checks and the production build under `/mehrdadika/`. Actual screenshots and complete rendered card text were inspected across all three editions at1280px desktop and390px phone widths: Persian circulation and pressure, Portuguese rectifier and breadboard, Spanish heart valve and plasma. Each card loaded its expected512px immutable image with correct language direction, no horizontal overflow and no recorded warning/error messages. The pressure card retains both meanings and all four examples. Independent human language and qualified specialist review remain pending.
