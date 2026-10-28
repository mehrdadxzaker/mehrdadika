# Specialist vocabulary batch 15

Release `2026-10-preview-20` adds **24 distinct English entries**: 12 medical and 12 engineering. Both priority collections grow from 206 to **218 of 500**, with 282 remaining in each. The atlas contains **594 English words and 595 meanings** across 32 categories, with complete Persian, Brazilian Portuguese and Latin American Spanish scaffolding. Each Portuguese and Spanish edition has 1190 translated examples, 1782 collocations and 594 usage notes. The earlier `pressure` card keeps its two meanings and four examples. Translations, inflections, extra senses and picture corrections do not increase the English word count.

| Coverage | New vocabulary |
| --- | --- |
| Upper-limb surface anatomy | wrist, shoulder, palm, thumb, fingernail, forearm |
| Lower-limb surface anatomy | ankle, knee, hip, heel, calf, toe |
| Workholding and machine context | workpiece, chuck, collet, tailstock, tool holder |
| Machining and grinding tools | drill press, grinding wheel, cutting tool, boring bar, bench grinder |
| Joining tools | welding torch, soldering iron |

Each original entry has a selected sense, UK/US IPA, approximate editorial CEFR, an English learner definition, Persian scaffolding, two meaningful examples, three collocations and useful distinctions. The first example contains the complete headword for cloze practice. Both native overlays bind identical English words, sense IDs, examples and collocations. Atlas, daily learning, spaced review and practice share the content. All earlier word/sense identities, native overlays, licensed recordings, science course content and learner identities remain preserved.

## Pictures and review

Original illustrations use the built-in image tool and are encoded as 512px WebP assets. The author and a second AI reviewer inspect actual full-size pixels and final 512px/120px versions. [Media provenance](../content/media-provenance.json) records literal current prompts, rights and hashes. The [illustration audit](../content/illustration-audit.json) binds actual semantic/style findings to the precise image bytes, category-profile hashes, selected senses and examples. These bindings establish evidence identity, not human approval or specialist truth.

Clinical images use soft precise natural forms on cool white with restrained mint and pale blue. Surface selections identify normal body regions, rather than depicting pain, injury, swelling or exposed internal anatomy. The wrist lies between hand and forearm, and the ankle between lower leg and foot; their color boundaries are approximate location cues, not exact maps of every joint. Knee includes the joint region rather than only the kneecap. Shoulder is the upper-arm/trunk region, rather than the whole scapula. Hip selection is the approximate external thigh/pelvis junction; the joint itself lies deeper under tissue and clothing.

Heel selects the rounded rear/plantar part of the foot, distinct from ankle, Achilles tendon and shoe heel. Palm is the inner hand surface, distinct from the back of the hand and the palm tree. Thumb is the first hand digit, distinct from the big toe. Fingernail is the hard keratin plate, distinct from nail bed, toenail or hardware nail. Forearm is elbow-to-wrist rather than the entire upper limb. Calf is the muscular back of the lower leg, distinct from shin and young animal; its plural is calves. Toe can mean any foot digit, although the selected example highlights the big toe. The pictures depict typical anatomy; proportions, nails and skin creases vary among people.

Engineering illustrations use precise product drawings, slate ground, silver material shading and controlled amber cues. Drill press shows connected head, column, table and base, with a stationary bit above the table. Grinding wheel selects a substantial bonded abrasive wheel with granular porous texture and a central bore, distinct from toothed saw blades and thin cut-off discs. Its enlarged grain/bond/pore inset is conceptual, not measured microscopy. Cutting tool selects a single-point turning example with a seated insert; other cutting-tool types exist. Tool holder selects a tapered spindle holder gripping an end mill by its smooth shank, distinct from the cutter itself.

Workpiece is the processed material or part, shown as selected stepped stock held in a chuck, separate from the nearby parked cutting tool. Amber identifies the part and does not prove that every workpiece is brass. The static context does not validate a cutting position or an operating setup. Chuck selects a jawed workholding example; collet instead selects a connected split sleeve. Tailstock supports the opposite end of lathe work or can hold an axial tool, rather than being the powered headstock. Boring bar selects an internal-machining tool, distinct from a drill creating a new hole. Bench grinder is the complete stationary machine, while grinding wheel is its abrasive component. Welding torch selects an unpowered TIG example with ceramic cup and tungsten electrode; soldering iron is a distinct heated-tip soldering tool. The bench-grinder assembly plate adds two linked cutaway side details of the same installed wheel/rest assemblies. Visible background gaps distinguish each rest from the abrasive wheel; the supported brackets remain outside the wheels. Opposing side views are mirrored. These qualitative enlarged details explain an occluded relation and do not specify a clearance setting. Earlier perspective candidates were rejected privately because their rest edges merged visually with the wheels. Product pictures do not supply wiring, speed, temperature, assembly or operating instructions or certified safety claims.

Across this batch and its continuation, older engineering illustrations lathe, anvil, wrench and caliper were actually inspected and retained because their machine/object cues, support and current slate/silver/amber style remained clear. This batch adds **24 new pictures and zero legacy replacements**. All older canonical and immutable media remain available.

All content remains an **AI-assisted editorial preview**, pending independent human language and qualified specialist review. No human or professional approval is implied. Entries without finished licensed recordings use an available device English voice and remain excluded from recording-only exercises. No recordings, patient records, diagnostic readings or measured engineering results are fabricated.

## Publication

The [campaign ledger](../content/expansion-campaign.json) records 24 additions and zero image refreshes for this batch. The [production protocol](vocabulary-production.md) continues toward 500 published English entries in both priority categories, then the configured remaining-category queue and milestones.

```sh
npm run campaign:status
npm run check:content
npm test
ATLAS_BASE=/mehrdadika/ npm run build
```

Local release validation passed all 164 tests, complete content/native snapshot/campaign/style checks and the production build under `/mehrdadika/`. Actual desktop (1280×720) and phone (390×844) browser checks covered Persian wrist/bench grinder, Portuguese grinding wheel/palm and Spanish boring bar/toe. Each loaded the expected 512px immutable image and complete English/native card text with correct language direction, no horizontal overflow and no warning/error console logs. An independent AI preservation audit confirmed all 570 earlier records, 740 immutable media, 620 canonical pictures, five science-course files and 89 older release JSONs unchanged. Live publication is verified separately after deployment.
