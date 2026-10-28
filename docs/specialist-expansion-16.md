# Specialist vocabulary batch 16

Release `2026-10-preview-21` adds **24 distinct English entries**: 12 dental and 12 civil engineering terms. Medicine and healthcare and engineering each grow from 218 to **230 of 500**, with 270 remaining in each. The atlas contains **618 English words and 619 meanings** across 32 categories, with complete Persian, Brazilian Portuguese and Latin American Spanish scaffolding. Each Portuguese and Spanish edition contains 1238 translated examples, 1854 collocations and 618 usage notes. The earlier `pressure` card keeps its two meanings and four examples. Translations, extra senses, inflections and picture corrections do not multiply the English word count.

| Coverage | New vocabulary |
| --- | --- |
| Dental restorations and orthodontics | dental crown, dental bridge, dental implant, orthodontic bracket, retainer |
| Dental structures and impressions | dental arch, dental impression, dental tray |
| Dental instruments and protection | dental drill, dental scaler, saliva ejector, mouthguard |
| Civil supports and structural surfaces | keystone, buttress, pier, footing, slab, deck, parapet |
| Civil passages, molds and connections | culvert, formwork, reinforcing mesh, gusset plate, anchor bolt |

Each original entry includes a selected sense, UK/US IPA, approximate editorial CEFR, an English learner definition, Persian scaffolding, two meaningful examples, three collocations and usage distinctions. The first example keeps the complete English headword for cloze practice. Both native overlays bind the same English words, sense IDs, examples and collocations. Atlas, daily learning, spaced review and practice share these content identities. Earlier vocabulary, native overlays, licensed recordings, science course content and learner identities remain preserved.

## Pictures and review

All 24 new illustrations are original assets made with the built-in image tool and encoded as 512px WebP images. The author and a second AI reviewer inspect actual full-size pixels plus the final 512px and 120px versions. [Media provenance](../content/media-provenance.json) records literal current generation/edit prompts, rights and hashes. The [illustration audit](../content/illustration-audit.json) binds actual semantic and style findings to the final bytes, selected senses/examples and exact category-profile hash. These are honest AI inspections, not independent human or professional approval.

Clinical images use clean educational renderings on cool white with restrained mint and pale blue. Crown selects an artificial hollow cap rather than the natural anatomical crown. The bridge is one connected replacement spanning a gap, while the implant selects the buried fixture beneath its connector and crown. The orthodontic bracket is the small tooth attachment holding an archwire. The removable acrylic-and-wire retainer has no replacement teeth; its pale-blue teeth are a fit-context ghost. A targeted edit embedded both anterior bow return ends beneath acrylic after the second reviewer rejected exposed cut wire tips. Plate coverage and wire designs vary among real retainers.

The dental arch shows one typical upper adult row of fourteen teeth without wisdom teeth. A correction gave the four premolars two dominant cusps; exact shape and tooth counts vary among people. The physical impression shows concave negative imprints, distinct from a positive cast; its holder is shown separately as an empty perforated lower dental tray. The drill selects a stationary rotary handpiece with a replaceable bur, and the scaler a manual curved instrument. Saliva ejector is the narrow low-volume suction tube rather than a spray or wide high-volume aspirator. Mouthguard selects a thick sports-type protective channel, distinct from the pictured wire retainer. These pictures identify vocabulary and selected examples, without treatment steps, patient-specific fit or certified outcomes.

Engineering pictures use precise technical drawings with subtle material and cutaway shading, slate ground, silver forms and controlled amber selection. Keystone selects the apex wedge in a masonry arch; buttress is the projecting wall support. Pier is the intermediate bridge support rather than the end abutment. Footing selects a widened base distributing load onto supporting ground, matching the selected Persian, Portuguese and Spanish terms; pile caps are distinguished separately. Slab is a broad structural plate, deck the bridge platform, and parapet its low solid edge wall. The deck image shortens a near edge wall to expose the deck layer as a teaching cutaway, rather than depicting a complete operating barrier arrangement.

Culvert shows one stream crossing below a perpendicular road, with aligned opposite openings and a cutaway exposing the passage. An earlier composition was rejected because its stream appeared parallel to the road. Formwork is a joined, externally braced empty mold. Reinforcing mesh shows two continuous wire families welded into a grid before concrete placement; a misleading enlarged joint inset was removed with a built-in edit. The gusset plate is one flat joining plate with separate bolt groups over the diagonal and chord; an earlier multi-cover-plate image was rejected. Its example describes only the visible diagonal-to-chord connection and does not infer a hidden chord splice. The anchor bolt shows a selected continuous L-shaped cast-in fastener below a base plate; concrete is cut away to reveal its buried end, rather than claiming an installed air void. Amber is selection, not proof of brass or another material. No dimensions, load calculations, installation procedures or buildable designs are supplied.

Older valve and motor illustrations were actually inspected and retained because their connections, distinguishing cues and current category style remained clear. This batch adds **24 new pictures and zero legacy replacements**. All old canonical and immutable media remain available. Rejected drafts and their negative inspection evidence remain private.

All content remains an **AI-assisted editorial preview**, pending independent human language and qualified specialist review. Entries lacking finished licensed recordings use an available device English voice and remain excluded from recording-only exercises. No recordings, named reviewers, patient records or measured technical results are fabricated.

## Publication

The [campaign ledger](../content/expansion-campaign.json) records 24 additions and zero image refreshes for this batch. The [production protocol](vocabulary-production.md) continues toward 500 published English entries in both priority categories, followed by the configured remaining-category queue and milestones.

```sh
npm run campaign:status
npm run check:content
npm test
ATLAS_BASE=/mehrdadika/ npm run build
```

Local release validation passed all 164 tests, complete content/native snapshot/campaign/style checks and the production build under `/mehrdadika/`. Actual desktop (1280×720) and phone (390×844) browser checks covered Persian dental implant/retainer, Portuguese gusset plate/dental impression and Spanish culvert/mouthguard. Each loaded the expected 512px immutable picture and complete English/native card text, with correct language direction, no horizontal overflow and no warning/error console logs. An independent AI preservation audit confirmed all 594 earlier records, 764 immutable media, 644 canonical pictures, five science-course files and 92 older release JSONs unchanged. Live publication is verified separately after deployment.
