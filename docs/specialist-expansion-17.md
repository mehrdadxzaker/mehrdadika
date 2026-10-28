# Specialist vocabulary batch 17

Release `2026-10-preview-22` adds **24 distinct English entries**: 12 clinical laboratory terms and 12 engineering metrology terms. Medicine and healthcare and engineering each grow from 230 to **242 of 500**, with 258 remaining in each. The atlas contains **642 English words and 643 meanings** across 32 categories, with complete Persian, Brazilian Portuguese and Latin American Spanish scaffolding. Each Portuguese and Spanish edition contains 1286 translated examples, 1926 collocations and 642 usage notes. The earlier `pressure` card keeps its two meanings and four examples. Translations, extra senses, inflections and image corrections do not multiply the English word count.

| Coverage | New vocabulary |
| --- | --- |
| Laboratory observation and vessels | Petri dish, microscope slide, coverslip, cuvette, centrifuge tube |
| Specimen collection and handling | test tube rack, specimen bag, lancet, blood collection tube, capillary tube, inoculating loop, pipette tip |
| Dimensional inspection and references | vernier scale, dial indicator, gauge block, surface plate, straightedge, plumb bob |
| Sensing, force and dimensional relations | strain gauge, load cell, extensometer, torque, tolerance, clearance |

Every original entry includes a selected sense, UK/US IPA, approximate editorial CEFR, an English learner definition, Persian scaffolding, two meaningful examples, three collocations and useful distinctions. The first example keeps the full English headword for cloze practice. Both native overlays bind the same English words, sense IDs, examples and collocations. Atlas, daily learning, spaced review and practice share these identities. Earlier vocabulary, native overlays, licensed recordings, science course content and learner identities remain preserved.

## Pictures and review

All 24 new illustrations are original assets generated individually with the built-in image tool and encoded as 512px WebP images. The author and a second AI reviewer inspect actual full-size pixels plus final 512px and 120px versions. [Media provenance](../content/media-provenance.json) records current literal generation/edit prompts, licensing and hashes. The [illustration audit](../content/illustration-audit.json) binds semantic and style findings to final bytes, selected senses/examples and the exact category-profile hash. These are AI inspections, with independent human language and specialist review still pending.

Clinical artwork uses cool white with restrained mint and pale blue. The Petri dish has a separate shallow base and lid without organisms or culture instructions. The thin square coverslip is compared with its longer supporting microscope slide; no exact glass thickness is asserted. The cuvette has flat opposed faces and a rectangular cell body. Test tube rack shows tubes passing through aligned upper holes to the lower support. The specimen bag separates its enclosed sample tube and absorbent pad from a rear document pocket, without claiming certified transport compliance.

Lancet selects a traditional flat steel finger-prick instrument with a short triangular point and broader grip, distinguished from modern housed safety lancets. The closed blood collection tube uses an unmeasured illustrative red sample and a generic cap, with no additive/test color code. The capillary tube emphasizes a fine bore and red column; its enlarged opening is qualitative. The centrifuge tube has a closed conical base and seated cap. The inoculating loop has a continuous wire ending in one closed loop; the pipette tip is hollow with a wide open attachment collar and narrow open outlet. No diagnosis, collection instructions, sterility, calibrated volume or compatibility rating is supplied.

Engineering artwork uses precise silver technical forms, subtle shading, slate ground and restrained amber teaching cues. The vernier scale has adjacent fixed and sliding rows with slightly different visual pitch, without asserting an exact ratio or usable reading. The supported dial indicator has a plunger contacting a part. Gauge block, surface plate and straightedge select a length reference, flat reference surface and ungraduated checking edge respectively, without certified precision claims. The plumb bob has a taut cord attached through its top eye. A bonded serpentine strain-gauge patch has two separate connected leads.

The S-type load cell connects a supported upper clevis to a lower weight. An initial image was rejected because its upper eye did not carry load through its bore; a targeted built-in edit added a retained clevis pin through the eye. The extensometer has two separated specimen contacts, sensing arms and an output cable. Its author corrected an earlier rigid-looking external connection with narrowed flexure details. The accepted static illustration identifies the two-point sensing arrangement without certifying internal travel or a working tensile test.

Torque shows a perpendicular force arrow on a wrench handle and a consistent clockwise moment cue about the bolt axis; it supplies no measured torque or tightening procedure. Tolerance depicts permitted diameter limits as dashed MIN/MAX drawing overlays around a solid pin. An initial image placed the actual rim inside MIN and was rejected; a built-in edit moved the inner limit so the rim lies between MIN and MAX. All six letters were actually checked at full size and 512px; the 120px view preserves the limit-band relationship rather than readable tiny text. Clearance shows a positive gap between a shaft and sleeve, with a qualitative section inset. No numerical fit, uniform clearance at every axial position or mechanical approval is inferred.

Older pipette and test tube illustrations were actually inspected and retained because their distinguishing cues and current clinical style remain clear. This batch adds **24 new pictures and zero legacy replacements**. All older canonical and immutable media remain available. Rejected drafts and their negative inspection evidence remain private.

All content remains an **AI-assisted editorial preview**, pending independent human language and qualified specialist review. Entries without finished licensed recordings use an available device English voice and remain excluded from recording-only exercises. No named human reviewers, recordings, patient records or measured technical results are fabricated.

## Publication

The [campaign ledger](../content/expansion-campaign.json) records 24 additions and zero image refreshes for this batch. The [production protocol](vocabulary-production.md) continues toward 500 published English entries in both priority categories, followed by the configured remaining-category queue and milestones.

```sh
npm run campaign:status
npm run check:content
npm test
ATLAS_BASE=/mehrdadika/ npm run build
```

Local release validation passed all 164 tests, complete content/native snapshot/campaign/style checks and the production build under `/mehrdadika/`. Actual desktop (1280×720) and phone (390×844) browser checks covered Persian specimen bag/load cell, Portuguese tolerance/coverslip and Spanish extensometer/capillary tube. Each loaded the expected 512px immutable picture and complete English/native card text, with correct language direction, no horizontal overflow and no warning/error console logs. A separate AI preservation audit confirmed all 618 earlier records, 788 immutable media, 668 canonical pictures, five science-course files and 96 older release JSONs unchanged. Live publication is verified separately after deployment.
