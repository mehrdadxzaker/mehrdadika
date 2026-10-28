# Specialist vocabulary batch 14

Release `2026-10-preview-19` adds **24 distinct English entries**: 12 medical and 12 engineering. Each priority collection grows from 194 to **206 of 500**, with 294 remaining. The atlas contains **570 English words and 571 meanings** across 32 categories, with complete Persian, Brazilian Portuguese and Latin American Spanish scaffolding. Each Portuguese and Spanish edition contains 1142 translated examples, 1710 collocations and 570 usage notes. The existing `pressure` card retains its two meanings and four examples. Translations, inflections, extra senses and picture corrections do not increase the English word count.

| Coverage | New vocabulary |
| --- | --- |
| Respiratory and temperature symptoms | cough, sneeze, fever, shortness of breath |
| Reported sensations and discomfort | headache, dizziness, nausea, fatigue, itch, pain |
| Movement symptoms | tremor, stiffness |
| Motion and position control | actuator, encoder, servomotor, stepper motor |
| Industrial detection | limit switch, proximity sensor, photoelectric sensor |
| Control systems and interfaces | programmable logic controller, control panel, feedback, setpoint, emergency stop |

Each original entry has an explicit selected sense, UK/US IPA, approximate editorial CEFR, an English learner definition, Persian scaffolding, two meaningful examples, three collocations and useful distinctions. The first example keeps the complete headword together for cloze practice. Both native overlays bind to identical source words, sense IDs, examples and collocations. The Atlas, daily learning, spaced review and practice consume the shared content. Earlier lexical identities, native translations, licensed recordings, science course and learner identities remain preserved.

## Pictures and review

Original pictures use the built-in image tool and are encoded as 512px WebP assets. Clinical pictures use natural organic forms, cool white, mint and pale blue; engineering uses slate, silver and restrained amber product studies, cutaways or conceptual diagrams. Each author and a second AI reviewer inspect actual full-size pixels and final 512px/120px versions. Literal current generation prompts, rights and hashes are recorded in [media provenance](../content/media-provenance.json); semantic and style findings bind exact asset bytes to selected senses, examples and category-profile hashes in the [illustration audit](../content/illustration-audit.json). These evidence bindings do not constitute human approval or specialist validation.

Cough uses an elbow-covering posture; sneeze uses a tense nasal expression and tissue over nose and mouth. Neither posture proves a cause. Fever uses an explicitly qualitative elevated-body-temperature inset, without a numeric instrument reading; appearance alone cannot establish fever. Headache selects head discomfort, without implying that every headache is migraine. Dizziness uses supported sitting and schematic room outlines to suggest perceived instability; dizziness is broader than spinning vertigo and differs from fainting. Nausea uses a closed mouth, upper-abdomen gesture and empty basin, without depicting actual vomiting.

Fatigue depicts an awake person with depleted energy, distinguished from sleepiness and engineering material fatigue. Itch uses localized light scratching of intact skin; itch is the sensation and scratch the action. Pain selects bodily discomfort at an illustrative forearm site, without proving tissue injury or severity. Tremor uses temporal motion outlines of one hand, rather than additional fingers. Stiffness selects reduced ease of bodily movement, distinct from material stiffness. Shortness of breath is a reported respiratory sensation, not a measured oxygen value or proven cause. Symptom pictures explain selected experiences and do not supply clinical assessment, diagnosis or treatment instructions.

Actuator selects a screw-driven electric linear example: motor, screw, translating nut, guided hollow output rod and axial extension cue. Encoder selects a transmissive incremental optical example with a shaft-mounted slotted wheel between emitter and receiver and a conceptual pulse output. Limit switch requires actual cam-to-roller contact, whereas the inductive proximity example keeps a visible air gap to a metal target. Photoelectric sensor selects a through-beam example; the opaque target interrupts the aligned emitter/receiver path. These examples do not cover every actuator or sensor technology.

Servomotor includes an attached encoder and conceptual drive-to-motor command/encoder-to-drive feedback paths. Stepper motor uses successive discrete shaft positions about one common inset pivot, without a rated step angle. The programmable logic controller is a modular industrial controller with an input→logic→output explanation, distinct from a bare microcontroller chip. Control panel is a closed physical interface with mounted indicators, selectors and pushbuttons. Feedback selects a negative feedback example: measured process output returns through a sensor to the negative summing input before the controller. This does not claim that all feedback is negative or stable. Setpoint is the reference target, distinct from an illustrative actual response; the graph has no measured values or guaranteed performance. Emergency stop shows the red mushroom/yellow-background actuator without suggesting that releasing it restarts equipment or supplies a certified protective function.

Corrections are retained honestly. An initial encoder put the optical elements on the same side of the wheel; a built-in edit moved them to opposite sides and made the beam cross an open slot before acceptance. Initial actuator and limit-switch candidates required square reframing; the actuator also gained a coherent anti-rotation guide. A stepper inset was corrected to show successive positions around one shared pivot. A breathlessness picture had irrelevant room props removed to match the clinical brief. Rejected candidates remain private. Two older clinical illustrations, syringe and muscle, were actually inspected and retained because their teaching cues and current category style remained clear. This batch introduces **24 new pictures and no legacy replacements**; all old canonical and immutable assets remain available.

All content remains an **AI-assisted editorial preview**, pending independent human language and qualified specialist review. No human or professional approval is implied. Entries without finished licensed recordings use an available device English voice and remain excluded from recording-only exercises. There are no fabricated recordings, patient records, treatment thresholds or measured engineering results.

## Publication

The [campaign ledger](../content/expansion-campaign.json) records 24 additions and zero image refreshes for this batch. The [production protocol](vocabulary-production.md) continues toward 500 published entries in both priority categories, then the configured remaining-category queue and milestones.

```sh
npm run campaign:status
npm run check:content
npm test
ATLAS_BASE=/mehrdadika/ npm run build
```

Local validation passed: all **164 tests**, complete content/native-vocabulary/native-reading/illustration/style/campaign checks and the production build under `/mehrdadika/`. Actual screenshots and complete rendered card text were inspected in all three editions at 1280px desktop and 390px phone widths: Persian fever and encoder, Portuguese feedback and dizziness, Spanish programmable logic controller and shortness of breath. Each loaded the expected 512px immutable picture, with correct language direction, no horizontal overflow and no recorded warning/error messages. Independent human language and qualified specialist review remain pending.
