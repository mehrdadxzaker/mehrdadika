# Category-by-category vocabulary expansion

We grow through coherent small category modules. Catalog-wide passes increase breadth, while focused passes build depth in one subject at a time. The [64-word visual foundation pass](category-visual-foundations.md) adds two entries to every category. The first pass targets **50 words per category**, followed by later passes toward **150** and **400**. These are editorial milestones, not completed-course claims or scheduled publication dates. The [active specialist campaign](specialist-expansion.md) takes medicine and healthcare and engineering to **500 each first**, then resumes this queue.

## First module: cooking foundations

Release `2026-10-preview-4` adds **36 original words**, taking cooking from **14 to 50** words and the whole atlas from **91 to 127 unique English words** (**128 meanings**). This release preserves the concurrently published Water and Weather science course and its 19 new words. The shared word `measure` counts in cooking and other relevant categories but remains one English entry and one progress identity. Persian, Brazilian Portuguese and Latin American Spanish teach the same English vocabulary; their translations do not multiply word counts.

| Unit | New vocabulary |
| --- | --- |
| Preparation and methods | fry, grill, whisk, knead, grate, mash, pour, drain, rinse, season, marinate, serve |
| Equipment | oven, saucepan, frying pan, chopping board, colander, spatula, rolling pin, measuring cup |
| Ingredients | flour, dough, yeast, butter, garlic, onion, salt, black pepper |
| Taste | sweet, sour, salty, bitter |
| Dishes and servings | sauce, soup, salad, portion |

These five units describe editorial coverage. The current app exposes the words through its existing cooking collection, search, learning and practice flows; it does not yet offer a separate unit navigation screen.

Every added word has one explicit sense, UK/US IPA, an English definition, Persian text, two translated contextual examples, three collocations, a usage note, a matching Portuguese and Spanish record, and a distinct 512px illustration. Taste illustrations provide food context; a still image cannot directly establish flavor. Captions and examples carry that meaning. No human language or culinary approval is recorded. Original English text, translations and images are AI-assisted editorial previews under the project's content licensing terms.

The new words use a device English voice where available. They do not claim packaged pronunciation recordings and remain excluded from exercises that require recordings. Earlier lexical/sense IDs and immutable releases stay available for saved progress and pinned sessions.

Later cooking passes still need drinks, cuisines and dishes, dining, food storage, hygiene, dietary/allergen vocabulary and advanced baking. Reaching 50 words does not complete this category.

## Expansion queue

Medicine and healthcare and engineering now have 290 and 289 words respectively. They remain the active priorities until each reaches 500, before the remaining queue resumes. Each starts with useful everyday vocabulary and a distinct-sense plan before moving into specialist terminology. Specialist records need appropriate professional review before a stable professional curriculum can be claimed.

1. Cooking, food and drink
2. Medicine and healthcare
3. Engineering
4. Everyday life
5. Home, gardening and DIY
6. People and relationships
7. Travel, tourism and hospitality
8. Transport and vehicles
9. Computing and technology
10. Education and academic English
11. Natural sciences and mathematics
12. Careers and workplace
13. Business and management
14. Economics and finance
15. Language and communication
16. Retail and e-commerce
17. Safety and emergencies
18. Architecture and infrastructure
19. Trades and practical work
20. Manufacturing, logistics and supply chains
21. Energy, utilities and natural resources
22. Environment and agriculture
23. Geography, places and cultures
24. Animals, pets and wildlife
25. Parenting and family care
26. Wellbeing and daily habits
27. Sports and recreation
28. Arts and media
29. Humanities and society
30. Law and public affairs
31. Fashion, beauty and personal care
32. Gaming and digital culture

## Repeatable publishing process

1. Inspect the published coverage and choose the next category. Work toward its next milestone with small, coherent batches, at most 24 additions per automatic continuation (the initial user-triggered specialist milestone contains 67). Avoid duplicating existing English words; add a new sense identity when a genuinely different meaning is required.
2. Author original learner definitions, approximate editorial CEFR levels, examples, collocations and contrast notes in all three native editions together. Preserve exact English source bindings.
3. Create sense-specific pictures. Inspect the full image and a 120px thumbnail, checking visible action, relevant objects, physical plausibility and distinction from neighboring concepts. Use a visual style suited to the subject. Record byte hashes, prompts, rights and honest review status.
4. Keep incomplete content as drafts. Complete provenance and illustration audit records before including a word in a preview module. Obtain independent language and specialist review before promoting content to stable.
5. Build the versioned English release, vocabulary overlays and reading snapshots. Check IDs, source bindings, media integrity, old-word preservation, and the module's complete membership. Inspect the production app in Persian, Portuguese and Spanish, then publish and verify the exact deployed source revision.
6. Update the coverage report and select the next category. These modules share the existing publisher; there is no separate per-module publishing command. The approved recurring workflow follows the [bounded production protocol](vocabulary-production.md), and every published batch still passes the existing publisher and verification steps.

`content/category-expansion.json` is the machine-readable queue and module ledger. Its category IDs must cover all 32 taxonomy domains exactly once, and each published module must resolve to real published words. Inspect coverage with:

```sh
npm run content:coverage
npm run content:coverage -- --json
```

Category membership overlaps. Summing category counts overstates the number of unique English words. Empty planned collections remain visible as future coverage, not as already-authored vocabulary.

## Technical scaling checkpoints

The existing publisher splits full English cards into 100-entry shards, which the app loads on demand with four bounded metadata request slots and a 15-second timeout. That 127-word release was the first to span two entry shards. Locale catalogs load only for the selected native edition, but each selected catalog is still one complete vocabulary snapshot.

Before moving from foundation coverage to thousands of words, measure real initial payload size, card-load time, mobile memory, search responsiveness and offline-pack size. If those become limiting, split locale catalogs by published shard, virtualize long grids, and offer category-scoped offline packs with explicit size information. Keep immutable assets and stable word/sense identities through that work. These are future checkpoints; this content batch does not claim that those larger-corpus paths have been qualified.
