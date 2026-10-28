# Medicine and engineering expansion

The latest published batch is documented in [Specialist batch 13](specialist-expansion-13.md), taking each priority category to 194. This page records the first 50-word milestone.

The active goal is **500 published English entries in medicine and healthcare and 500 in engineering**, with full Persian, Brazilian Portuguese and Latin American Spanish teaching content. The first milestone, release `2026-10-preview-6`, adds **67 entries** and takes medicine from 16 to **50** and engineering from 17 to **50**. The atlas grows from 191 to **258 distinct English entries and 259 meanings**. Reaching 50 is progress toward the goal; that milestone left 450 in each category.

All three editions teach the same English words. Every addition has one explicit sense, UK/US IPA, an original English definition, a Persian gloss and usage distinction, two contextual examples and three collocations. Portuguese and Spanish have matching glosses, definitions, examples, collocations and usage notes. In that release, each edition has 518 examples, 774 collocations and 258 usage notes. Translation counts do not multiply the English vocabulary count. Existing lexical/sense IDs, the science course and immutable releases are preserved.

| Medical unit | New vocabulary |
| --- | --- |
| Tools, equipment and mobility | syringe, medical mask, surgical glove, gauze, adhesive plaster, crutch, wheelchair, stretcher, hospital bed, examination table, otoscope, blood pressure cuff, pulse oximeter, reflex hammer, scalpel, forceps, medicine bottle |
| Body structures | brain, lung, kidney, liver, stomach, intestine, bone, joint, muscle, tendon, ligament, artery, vein, nerve, skin, spine, rib |

| Engineering unit | New vocabulary |
| --- | --- |
| Fasteners | bolt, nut, washer, screw, rivet |
| Motion and support | bearing, shaft, pulley, lever, piston |
| Machines, interfaces and tools | cylinder, pump, compressor, turbine, nozzle, seal, gasket, hinge, clamp, vise, wrench, screwdriver, caliper, micrometer, multimeter |
| Electrical parts and control | resistor, capacitor, diode, transistor, transformer, motor, generator, sensor |

The units record editorial coverage. Learners use the existing category chooser, search, word cards, daily study, review and practice; no separate unit navigation is introduced. New entries without licensed recordings use the available device English voice and stay excluded from exercises that require a packaged recording.

## Illustration and factual review

Medicine uses clinical illustrations on pale mint/ivory with clear anatomy and clean equipment. Engineering uses precise technical close-ups and cutaways on slate with amber teaching accents. Each of the 67 additions has a distinct original 512px WebP, a recorded generation prompt, rights and byte hash, an inspection of the generated source and converted 512px/120px pixels, and a second AI visual check. The audit binds each assessment to its exact word, sense, examples, image and category-profile hash. Rejected candidates remain private and are excluded from release artifacts.

Medical distinctions include cuff versus complete pressure monitor, tendon versus ligament, artery away from the heart versus vein toward it, nerve bundle versus neuron, and bony spine versus spinal cord. Venous blood remains red; direction is not taught as an oxygen-color rule. Engineering distinguishes a flat gasket from a shaft seal, nuts from washers, a measuring caliper from a brake caliper, a motor's electrical-to-mechanical conversion from a generator's reverse conversion, and separate coils coupled through a transformer core. Facts were checked against primary references such as [NIH anatomy training](https://training.seer.cancer.gov/anatomy/), [NIDDK digestive anatomy](https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works), [FDA pulse oximeter information](https://www.fda.gov/consumers/consumer-updates/pulse-oximeters-and-oxygen-concentrators-what-know-about-home-oxygen-therapy) and [EIA electricity generation](https://www.eia.gov/energyexplained/electricity/how-electricity-is-generated.php). Definitions and illustrations are independently authored; reference artwork and prose are not copied.

These are **AI-assisted editorial previews**, awaiting independent human language and qualified specialist review. Software checks integrity, translation completeness and stale bindings; it cannot establish semantic truth or professional qualification. The cards teach English terminology with neutral examples. They do not constitute a clinical or engineering procedure course.

## Continuing toward 500 and beyond

`content/expansion-campaign.json` holds the two 500-entry targets, the completed-batch ledger, balanced topic allocations and the remaining 30-category queue. Anatomy is only one part of medicine: future batches cover physiology, examination, communication, diagnostics, equipment, pharmacy, dentistry, rehabilitation and public health. Engineering expands through measurement, mechanics, materials, electronics, civil structures, fluids, energy, automation and design/quality.

The user-approved recurring workflow resumes private checkpoints, completes at most 24 additions per run, usually 12 from each priority category, then builds, checks, publishes and verifies the coherent batch. Once both categories reach 500, it continues the other categories through their configured 50/150/400 milestones. These milestones are corpus-size targets, not a claim that every professional subject is covered.

```sh
npm run campaign:status
npm run check:campaign
npm run content:coverage
```

The campaign checks verify the immutable starting manifest, require every later published word to appear in a completed batch, enforce the automatic batch limit, and reject duplicate normalized English headwords, inflated planning counts, premature completion, missing native content and stale category-style bindings. Publication follows the existing content-addressed pipeline; source commits, CI success and live deployment are verified separately. See the [production protocol](vocabulary-production.md).

## Batch validation

The local release passed 163 unit/integration tests, the full content/localization/illustration/campaign checks and the production build under `/mehrdadika/`. Browser checks confirmed the new Persian blood-pressure-cuff card and Portuguese transformer card at 1280px, plus the Spanish examination-table and Persian cuff cards at 390px. Images loaded at their native 512px size and the phone pages had no horizontal overflow. These checks cover the first 67 additions; they do not qualify a future 500-entry collection.
