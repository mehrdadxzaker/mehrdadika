# Visual foundations across all 32 categories

This editorial preview adds two original English entries in each of the 32 categories: **64 new entries**, taking the atlas from **127 to 191 entries** and **128 to 192 meanings**. Every entry has Persian, Brazilian Portuguese and Latin American Spanish text. The existing cooking foundation and Water and Weather science course remain available.

This broad pass improves coverage across the whole catalog. It does not complete the categories or replace the deeper foundation/core/depth targets. Medicine and engineering remain the next focused expansion priorities.

## Category visual languages

The shared Word Atlas page structure, typography and square cards remain consistent. Each subject receives a visual brief suited to its concepts. Pictures may differ in medium, palette and composition when that makes the word easier to understand.

| Category | New entries | Visual language |
| --- | --- | --- |
| Cooking, food and drink | ladle, sift | Warm natural culinary close-up, realistic tactile food and tool textures |
| Medicine and healthcare | stethoscope, thermometer | Clean clinical educational rendering, soft precise forms on cool white, restrained mint accents |
| Engineering | gear, spring | Precise technical product drawing with subtle cutaway shading, slate ground and amber highlights |
| Everyday life | umbrella, yawn | Warm observational gouache scene with gentle paper grain and terracotta highlights |
| Home, gardening and DIY | watering can, prune | Botanical home-workshop watercolor and pencil, cream paper with leafy greens |
| People and relationships | hug, neighbor | Soft character-led pastel editorial scene, peach and plum with expressive body language |
| Travel, tourism and hospitality | passport, suitcase | Travel-journal colored-pencil object study with light ink contours and muted teal accents |
| Transport and vehicles | bicycle, brake | Crisp transport catalog illustration, graphite contours and safety-orange accents |
| Computing and technology | keyboard, upload | Clean isometric digital explanatory illustration with cyan and indigo planes |
| Education and academic English | notebook, underline | Tactile classroom cut-paper collage with pencil details, cream, ochre and school blue |
| Natural sciences and mathematics | magnet, triangle | Precise textbook diagram on bright white with primary red/blue accents and minimal construction lines |
| Careers and workplace | clipboard, interview | Professional editorial ink-and-wash scene, restrained navy and rust |
| Business and management | invoice, negotiate | Structured corporate editorial geometry with teal and apricot blocks |
| Economics and finance | savings, coin | Restrained finance object still-life with emerald and brass, crisp simplified shading |
| Language and communication | alphabet, translate | Clear typographic editorial illustration with speech-shape geometry, cobalt and coral |
| Retail and e-commerce | shopping basket, barcode | Bright retail product illustration with cream, coral and charcoal contours |
| Safety and emergencies | fire extinguisher, evacuate | Calm high-contrast safety explainer with ivory, signal red and dark navy |
| Architecture and infrastructure | arch, staircase | Architectural pencil and pale stone wash, quiet elevations and spatial clarity |
| Trades and practical work | hammer, drill | Workshop technical gouache with visible wood/metal, ochre and steel gray |
| Manufacturing, logistics and supply chains | forklift, parcel | Industrial isometric logistics illustration with warehouse blue and amber |
| Energy, utilities and natural resources | solar panel, wind turbine | Luminous clean energy technical landscape with ultramarine and pale gold |
| Environment and agriculture | seedling, irrigate | Natural-history botanical watercolor with earth ochre and multiple greens |
| Geography, places and cultures | island, peninsula | Tactile topographic cut-paper map view, turquoise water and ochre terrain |
| Animals, pets and wildlife | owl, hoof | Accurate natural-history colored-pencil plate on quiet cream paper |
| Parenting and family care | stroller, bib | Gentle rounded nursery illustration with soft fabric texture, sage and muted peach |
| Wellbeing and daily habits | stretch, meditate | Airy minimal ink gesture with soft lavender and sand watercolor washes |
| Sports and recreation | racket, swim | Dynamic sports editorial illustration with clear motion and crisp cobalt/lime accents |
| Arts and media | palette, violin | Expressive studio gouache and visible brush texture, saturated pigments and warm wood |
| Humanities and society | artifact, festival | Museum-and-culture editorial woodcut with restrained clay, indigo and gold |
| Law and public affairs | ballot, courthouse | Civic editorial engraving with slate blue, parchment and burgundy accents |
| Fashion, beauty and personal care | comb, braid | Polished beauty editorial drawing with fine rose/charcoal contours and cream backdrop |
| Gaming and digital culture | joystick, pixel | Deliberate pixel-art and playful retro geometric shading with violet/cyan accents |

## Meaning before decoration

A visually attractive scene is accepted only when it supports the exact selected English sense. Actions must be visible, technical parts must connect, and geographic relationships must be clear. Contextual words such as neighbor, invoice, interview and artifact need examples and captions as well as a picture; an image alone cannot establish every social, legal or historical property.

The production process checks each generated asset at full size, then reads back the converted 512px WebP and inspects a 120px thumbnail. The recorded expected cue, semantic assessment and style assessment refer to those actual pixels. A second AI pass reviews the thumbnails and text across batches. Corrections preserve the English word and sense IDs when their meanings remain the same.

The category brief registry is `content/visual-languages.json`. Exact image bytes, original generation prompts and licensing declarations are stored in `content/media-provenance.json`; full prompts and final asset paths are available there. Images are generated with the built-in image generation tool and saved under `public/atlas/img/`; no generation API key is required to run the application.

## Integrity and limits

`content/category-expansion-5.json` records the baseline release and the two-word module in every category. `npm run check:visual-languages` verifies complete category coverage and binds each new image assessment and rights record to the exact category brief hash. Changing a brief invalidates the assessment until it is inspected again. The existing illustration checker separately binds the word, sense, examples, category, source file and published image hash. These checks detect mismatches and stale records; software does not establish semantic or stylistic truth.

The text, pictures and assessments remain AI-assisted editorial previews. No independent human language, clinical, engineering or other specialist approval is recorded. New entries use device English speech where available; no packaged recordings are invented. Prior immutable releases and progress identities remain available.

```sh
npm run content:coverage
npm run check:visual-languages
npm run check:content
npm test
```

Neutral medical-device function cross-checks used [MedlinePlus on auscultation](https://medlineplus.gov/ency/article/002226.htm) and [temperature measurement](https://medlineplus.gov/ency/imagepages/9961.htm). Definitions and illustrations are original; these references do not grant rights to copy the source artwork or imply that this atlas has clinical approval.
