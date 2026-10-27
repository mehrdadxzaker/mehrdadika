# Persian Word Atlas implementation plan

Create an open-source English-learning website for Persian speakers that stays very close to the live Word Atlas product in visual design, navigation, illustrated vocabulary, daily study, recall, spaced repetition, reading, practice, and progress. Support the complete 32-domain catalog from the outset and publish reviewed content modules over time.

This plan was prepared on October 26, 2026 and now serves as the requirements and continuing roadmap for **Mehrdadika / مهردادیکا**. A local Persian application and starter preview corpus have been implemented in this workspace. See the [implementation status](docs/implementation-status.md) for the current delivered scope, publication limits and remaining qualification; the requirements below should not be read as a claim that every launch gate has passed. Public repository creation, hosting and a final domain remain release decisions.

The plan is grounded in [live website inspection](docs/live-site-inspection.md), [the pinned public source map](docs/upstream-source-map.md), and [the detailed content and taxonomy appendix](docs/content-and-taxonomy-plan.md). Screenshots under `docs/evidence/` are local reference evidence, not reusable production assets.

## 1. Product decisions

| Area | Implementation decision |
| --- | --- |
| Product | A working browser learning application with the same five main destinations as the hosted reference. |
| Fidelity | Preserve composition, visual hierarchy, illustration-led cards, interactions, study loop, galaxy, and reading experience. Adapt language/direction and category navigation deliberately. |
| Foundation | Derive from the public React/Vite Word Atlas application, pinned initially to `e7b44629230a470e6b664826ced4af2c367b44c2`. Retain attribution and a small, documented upstream difference log. |
| Teaching direction | English vocabulary, phrases, listening and reading explained in Persian. Persian-language instruction for English speakers is outside this version. |
| Locale | Persian-first UI with English text explicitly marked LTR. Use Iranian Persian as a proposed editorial starting convention; record regional equivalents rather than silently treating them as identical. |
| Catalog | All 32 top-level domains have stable identities and coverage pages. Only released material is available to study. |
| Content | Reviewed modules published continually. A new category or correction must not reset learning history. |
| Open source | Proposed license split: MIT application code; CC BY 4.0 educational content, preserving upstream and third-party terms. Public contributor documentation and reproducible builds. |
| Runtime | Static, self-hostable application; local learning history; no required account, backend, AI API, or provider key to study. |
| Hosting | Document GitHub Pages and ordinary static hosting, including a subpath. A CDN/object store for larger media can be added without making one vendor mandatory. |

The first release should deliver the complete application experience with a growing catalog. Completion of the entire corpus is an ongoing publishing program, separate from completion of the website.

## 2. What stays close to Word Atlas

Retain the warm ivory/deep navy palette, restrained accent pigments, paper texture, rounded cards and chips, large English word headings, rich illustrations, compact pronunciation controls, and calm transitions. Preserve the prominent illustrated Today card and the three Atlas views. The Persian font should complement the reference's English typography without changing its overall character.

Retain five main navigation labels:

| Reference | Persian label | Main route |
| --- | --- | --- |
| Today | امروز | `#/` |
| Atlas | اطلس | `#/atlas` |
| Reading Room | کتابخانه | `#/read` |
| Practice | تمرین | `#/practice` |
| Me | من | `#/me` |

Keep desktop top navigation and the narrow-screen bottom bar. Keep focused study and immersive readers separate from general navigation. Put the expanded subject hierarchy inside Atlas, learning preferences, reading filters, and coverage pages; retain the five primary navigation destinations as the catalog grows.

Use a new Persian project identity with visible upstream credit. Recreate the particle introduction around that identity, retaining skip/replay controls and a reduced-motion alternative. Do not copy hosted-only brand illustrations, book texts, or soundtracks into the application merely because they are visible online.

## 3. Screens and functional requirements

### 3.1 Introduction and onboarding

- Short particle/illustrated opening, skippable and disabled under reduced-motion preferences.
- Four-step guide covering illustrated words, recall/review, the galaxy, and reading.
- A1–C2 starting level, adjustable daily new-item target, optional exam date, and a concise explanation of local progress.
- Optional subject selection that defaults to published general material. Unpublished subjects link to coverage information.
- Retain settings changes after reload. Replaying the guide must not reset progress.

### 3.2 Today

- Localized greeting/date, primary illustrated study/resume card, due review count, new material count, and estimated session length.
- Daily word, daily reading, weekly activity, level progression, galaxy preview, and category shortcuts.
- Due reviews precede new material. Existing due reviews remain available when the selected category changes.
- Resume the same session after route changes/reload; do not grade pending feedback twice.
- An exhausted or unpublished selection offers available reviews and other released material, with no invented counts.
- Exam planning is optional and labeled as a study estimate. It uses published eligible material, and must not imply exam-score guarantees.

### 3.3 Atlas and categories

- Preserve illustrated grid, compact list, galaxy, global search, deep-linked word sheet, level/status filters and favorites.
- Replace the fixed 19-topic row with a searchable nested selector for all 32 domains, grouped into six collapsible discovery sections, plus compact selected/recent chips. Keep top-level controls visually consistent with the reference and retain the five main tabs.
- Support multiple category memberships, one canonical navigation home, and stable filter URLs.
- Search English headwords, phrases, Persian glosses, common equivalents, and aliases. Normalize Arabic/Persian letter variants and spacing for matching while preserving editorial display text.
- Clearly separate published results from an optional coverage/roadmap view. Study buttons only use the active published release.
- Virtualize large grids/lists and load detail/media on demand. Changing a filter should preserve predictable focus and scrolling.

### 3.4 Word cards and sharing

- Preserve illustration-first composition, English word/phrase, IPA, UK/US playback, level/category badges, meanings, bilingual examples, collocations, forms, related words, notes, favorite, and previous/next controls. Match the observed two-column desktop sheet with a prominent illustration column and the stacked narrow-screen sheet.
- Keep a single public card for each word/phrase. Group meanings by domain/context and show only published meanings.
- Use a focused sense in category learning and recall. Learning one meaning must not mark all meanings learned.
- Examples carry explicit context labels such as everyday, academic, engineering, or clinical communication. Avoid assuming the second example is always IELTS content.
- Provide small inline lookup panels in examples and readers, followed by an optional full-card action.
- Support typed media: scene, diagram, process, comparison, chart. Technical diagrams require meaningful alt text and reviewed labels.
- Generate share images locally, with correctly shaped Persian, LTR English/IPA, credits, and no private progress unless the user chooses a progress-specific export.
- Only expose illustration variants when approved variants exist. Do not ship a nonfunctional style toggle.

### 3.5 Daily learning and spaced review

- Preserve the upstream five-item introduction followed by shuffled recall, due-review priority, answer feedback, first-answer accuracy, bounded retries, and session summary.
- Retain meaning choice, illustrated cloze, listening recognition, and spelling where the selected item has eligible assets and answer data.
- Keep the existing FSRS adapter semantics initially, including a 90% default retention target. Review any change to scheduling separately from localization.
- Schedule by stable sense ID; use one memory record per sense across all categories/paths. Independent exercises can contribute to one graded attempt under the session policy.
- Retried questions do not produce additional first-answer accuracy or repeated scheduling updates. Use deterministic session state and explicit grade-event IDs.
- Prevent ambiguous distractors: separate answer senses, match grammatical/context constraints, exclude equivalent accepted answers, and skip a mode when too few valid choices exist.
- Apply English typing normalization deliberately to case, apostrophes, spaces, and accepted spelling variants. Do not let Persian search normalization change English grading rules.
- Word recognition, short-reading comprehension, typing scores, and subject expertise remain different measurements.

### 3.6 Galaxy

- Preserve the interactive star field, topic labels, state legend, zoom/reset, constellation panel, and progress sharing.
- One star represents one published lexical item, matching the reference's word-based visual metaphor. Per-sense memory remains underneath it.
- Compute star status from relevant published senses in the active scope. Partial learning must be distinguishable from familiarity with all scoped meanings.
- Show separate labels for word/phrase counts and meaning counts. Overall headword totals deduplicate lexical IDs; meaning totals deduplicate sense IDs.
- Give each item one primary cluster and cross-category links. Category membership must not create duplicate stars or duplicate reviews.
- Seed stable positions from item IDs. New releases should add stars without reshuffling the entire familiar map.
- For the expanded hierarchy, start with domain clusters and focus into subcategories. Use level of detail and labels selectively rather than rendering every label at once.
- Provide keyboard-accessible selection, a list/grid alternative, reduced motion, and a fallback when WebGL is unavailable.
- Tie completion denominators and earned milestones to explicit content releases so catalog growth does not silently rewrite past achievements.

### 3.7 Reading Room and books

This is a new implementation over the public foundation because the hosted reader is absent from the pinned source.

- Preserve the short-text/books tabs, illustrated shelf, level/category filters, reading progress, and next-reading action.
- Short passages include aligned English/Persian paragraphs, target-word chips, font-size controls, inline lookup, and true/false/not-given comprehension with explanations.
- Books include a shelf page, introduction, chapter constellation, reader, chapter/paragraph bookmarks, and resume position.
- Implement illustrated listening mode, play/pause/previous/next sentence, playback speed, paragraph restart, and a reader/listening switch.
- Store stable sentence/paragraph IDs and checked timing data for narration. Enable word highlighting only with checked word timings, sentence highlighting only with checked sentence timings, and ordinary playback without synchronized highlighting when neither exists.
- Use the same lexical lookup and published sense references as Atlas. Unknown tokens must remain readable and must not trigger background AI calls.
- Treat original or appropriately licensed passages as the initial content source. A chapter is available only after its text/translation and every included illustration/audio asset have cleared rights. Approved text-only chapters remain publishable with unavailable media controls omitted; planned chapters are clearly identified.
- Reproduce the reading experience using independently licensed material. Matching the reference does not require republishing its specific hosted books.

### 3.8 Practice

- Retain word typing, sentence copying, and full-sentence dictation with recent/mistakes/favorites/selected-route scopes.
- Preserve independent practice statistics and the reference's stated WPM calculation; do not change FSRS memory implicitly.
- Add the live paraphrase mode: published level groups, numbered equivalent-expression questions, feedback/explanation, and independent completion history.
- Add confusable-word comparisons: concise Persian distinction, examples, pronunciation, memory aid, and short contextual quizzes.
- Use shared category and meaning references for specialist exercises. Do not present an empty group, missing audio question, or unreleased level as playable.

### 3.9 Progress and settings

- Preserve streak/activity history, heatmap, seven-day review forecast, first-answer accuracy, study time, and daily target.
- Include starting level, category/path preference, optional exam planning, retention, accent, autoplay, recall presentation, spelling, theme, fonts, sound, and intro replay.
- Light/dark/system themes are required. The live aurora/starlight presets are a secondary parity task after the core themes; expose them only when verified.
- Retain validated progress export/import, storage-failure notices, and a clear local-only explanation. Offer a backup before a destructive reset.
- Preserve a progress-transfer entry only if an actual reviewed transfer mechanism is implemented; a validated portable backup is the initial guaranteed transfer method.
- Add About, credits/licenses, content coverage, contribution guide, and correction links. Link reports to sense ID, revision and content release.

## 4. Complete category map

These 32 categories are part of the initial architecture. Their publication status is independent of their existence in the taxonomy. The [planning catalog](docs/category-catalog.json) preserves stable IDs and organizes them into six discovery groups; adding future categories is a data change rather than an application rewrite.

| Domain | Persian label | Representative branches |
| --- | --- | --- |
| Everyday life | زندگی روزمره | Time and dates; Daily routines; Errands; Household interactions; Public services; Appointments |
| People and relationships | افراد و روابط | Family relationships; Friendship; Emotions; Personality; Appearance; Social interaction |
| Education and academic English | آموزش و انگلیسی دانشگاهی | School; university; teaching and learning; assessment; research methods; academic reading |
| Medicine and healthcare | پزشکی و سلامت | Everyday health; anatomy; physiology; clinical communication; symptoms and examination; tests and investigations |
| Engineering | مهندسی | Shared engineering foundations; mechanical; electrical; electronics; civil and structural; chemical |
| Computing and technology | رایانش و فناوری | Digital literacy; Consumer devices; Hardware; Programming; Software engineering; Operating systems |
| Natural sciences and mathematics | علوم طبیعی و ریاضیات | Mathematics; statistics; measurement; physics; chemistry; biology |
| Business and management | کسب‌وکار و مدیریت | Entrepreneurship; Strategy; Management and organizations; Marketing; Sales; Human resources management |
| Economics and finance | اقتصاد و امور مالی | Everyday personal finance; microeconomics; macroeconomics; accounting; banking; payments |
| Law and public affairs | حقوق و امور عمومی | Legal foundations; Contracts; Civil law terminology; Criminal law terminology; Courts and procedure; Rights |
| Architecture and infrastructure | معماری و زیرساخت | Architecture; Building elements; Architectural drawings; Construction; Housing and property systems; Urban planning |
| Environment and agriculture | محیط زیست و کشاورزی | Physical geography; Geology; Climate and weather; Ecology; Conservation; Pollution |
| Arts and media | هنر و رسانه | Visual arts; Graphic design; Music; Film and television; Photography; Journalism |
| Humanities and society | علوم انسانی و جامعه | History; philosophy; literature; religion; linguistics; sociology |
| Trades and practical work | حرفه‌ها و کارهای فنی | Tools; Workshop practice; Automotive repair; Electrical installation; Plumbing; Welding |
| Sports and recreation | ورزش و تفریح | Individual sports; team sports; exercise; fitness equipment; games; outdoor activities |
| Cooking, food and drink | آشپزی، غذا و نوشیدنی | Ingredients and food groups; Preparation verbs; Cooking methods; Kitchen utensils and appliances; Baking, pastry and desserts; Drinks and beverage preparation |
| Travel, tourism and hospitality | سفر، گردشگری و هتلداری | Trip planning; Destinations and sightseeing; Accommodation and reservations; Hotels and guest services; Travel documents and border vocabulary; Tour guiding |
| Transport and vehicles | حمل‌ونقل و وسایل نقلیه | Walking and cycling; Public transit; Road travel and driving; Cars and motorcycles; Vehicle parts and operation; Railways |
| Home, gardening and DIY | خانه، باغبانی و تعمیرات خانگی | Rooms and furniture; Household appliances; Cleaning and laundry; Housing, renting and moving; Property services; Home organization |
| Fashion, beauty and personal care | مد، زیبایی و مراقبت شخصی | Clothing and accessories; Fabrics and materials; Sizes and fit; Footwear; Fashion design and tailoring; Hair and salon vocabulary |
| Parenting and family care | فرزندپروری و مراقبت از خانواده | Pregnancy and birth vocabulary; Infant care; Childcare and routines; Child development terminology; School-family communication; Parenting conversations |
| Animals, pets and wildlife | جانوران، حیوانات خانگی و حیات وحش | Animal groups; Animal anatomy and behavior; Pets and supplies; Feeding and care; Training terminology; Animal shelters and adoption |
| Language and communication | زبان‌ها و ارتباطات | Languages and scripts; Grammar terminology; Pronunciation terminology; Conversation and turn-taking; Questions and clarification; Telephone and video calls |
| Gaming and digital culture | بازی‌های رایانه‌ای و فرهنگ دیجیتال | Game genres; Gameplay and controls; Consoles and gaming hardware; Multiplayer and online communities; Esports; Game design terminology |
| Safety and emergencies | ایمنی و وضعیت‌های اضطراری | Hazard and warning signs; Protective equipment; Emergency services; Reporting an emergency; Fire and evacuation vocabulary; First-aid terminology |
| Manufacturing, logistics and supply chains | تولید، لجستیک و زنجیره تأمین | Production processes; Factories and workstations; Assembly and packaging; Quality inspection; Inventory and warehousing; Picking and fulfillment |
| Retail and e-commerce | خرده‌فروشی و تجارت الکترونیک | Shops and retail roles; Merchandising and displays; Product catalogs and descriptions; Online shopping; Checkout and payment language; Customer support |
| Careers and workplace | مسیر شغلی و محیط کار | Jobs and occupations; Job search; CVs and applications; Interviews; Hiring and onboarding; Meetings and teamwork |
| Wellbeing and daily habits | بهزیستی و عادت‌های روزانه | Sleep and rest; Daily self-care; Motivation and goals; Habits and routines; Time management; Everyday stress vocabulary |
| Energy, utilities and natural resources | انرژی، آب و منابع طبیعی | Electricity generation and distribution; Renewable energy; Oil and gas; Water supply and treatment; Utilities and meters; Energy use and efficiency |
| Geography, places and cultures | جغرافیا، مکان‌ها و فرهنگ‌ها | Continents, countries and regions; Cities and landmarks; Maps and directions; Landforms and places; Nationalities and languages; Customs and etiquette |

Cooking is a first-class domain covering ingredients, preparation verbs, methods, utensils/appliances, baking, drinks, textures, measurements, cuisines, serving and food hygiene. It can supply illustrated cards, recipe/menu reading, listening and recall exercises through the existing Word Atlas flows. Other newly explicit families include home/gardening, travel/hospitality, transport, fashion/beauty, parenting/caregiving, animals/pets, communication, gaming, safety, logistics, retail, careers, wellbeing, energy and geography/cultures.

The [taxonomy appendix](docs/content-and-taxonomy-plan.md) defines all 32 stable domain IDs, deeper branches, discovery groups, overlap rules, cross-domain links, roles, registers, paths, and independent language difficulty/domain depth. Specialist concepts do not receive invented CEFR labels merely to fit the interface; unknown level remains explicit.

## 5. Application architecture and reuse

Keep React, TypeScript, Vite, the upstream styling approach, icon library and FSRS adapter. Use the lockfile as the initial reproducible dependency baseline and update dependencies through ordinary tested changes. A switch to a full-stack framework is unnecessary for the planned local-first static product.

Retain an adapter between canonical contributor data and compact runtime data. The public source's `Atlas` interface and shared entry presentation are useful boundaries. Extend them before distributing new data assumptions throughout the UI.

| Upstream area | Planned change |
| --- | --- |
| `src/App.tsx` and router | Extract UI strings; add Persian shell and hosted-only routes; retain word overlay and history behavior. |
| `src/styles/app.css` | Preserve tokens and component geometry; add Persian typography, logical properties, bidirectional rules and responsive reference checks. |
| `src/atlas/types.ts`, `data.ts` | Introduce lexical/sense/category identities, release manifests, explicit capabilities and asset provenance. Preserve lazy loading and request deduplication. |
| `src/ui/EntryView.tsx` | Locale-aware fields, context labels, meaning grouping, typed media, inline lookup and correct export rendering. |
| `src/pages/Atlas.tsx` | Hierarchical categories, Persian/English search, sense-aware scopes and stable virtualized layout. |
| `src/pages/Today.tsx`, `Learn.tsx` | Published-only selection, sense scheduling, deterministic resume, shared release context and translated feedback. |
| `src/store/*` | Storage repository/migrations; preserve FSRS behavior; separate practice/reading/progress streams. |
| `src/galaxy/*` | Preserve renderer; adapt stable taxonomy layout, scoped aggregates, progressive disclosure and accessibility. |
| New reader/practice modules | Implement Reading Room, books/listening, paraphrases and confusables from the live inspection. |
| `scripts/atlas/*`, `public/sw.js` | Replace Chinese-only compilation and mutable positional publication with reviewed immutable release artifacts. |

Suggested new boundaries are `i18n`, `content`, `progress`, `reading`, and shared `audio`. These are implementation responsibilities; avoid a large folder restructuring before the reference application runs.

Retain preferences in a small local store. Put growing progress, review-event history, reader state and migrations behind a transactional IndexedDB adapter, with an explicit migration path from any earlier localStorage format. UI components should not know the storage engine. Validate quota/failure behavior and export availability. Cross-tab writes must use idempotent events/transactions rather than replacing a newer whole database with a stale tab's snapshot.

## 6. Persian localization and accessibility

- Extract navigation, onboarding, prompts, settings, errors, tooltips, aria labels, date/number/interval formatting and export-image text into a locale catalog. Scan production UI for leftover Chinese text.
- Use `lang="fa" dir="rtl"` at the application root, explicit `lang="en" dir="ltr"` for English definitions/examples/typing, and isolated IPA, symbols and units. Use `dir="auto"` for mixed search/input and appropriate inline isolation.
- Prefer logical CSS properties. Mirror navigation order intentionally; preserve standard media semantics and avoid mirroring diagrams or English reading order.
- Self-host a Persian font with verified redistribution terms and retain appropriate Latin typography. Wait for fonts before rendering export images.
- Test Persian/Arabic ی/ي and ک/ك, ZWNJ/spacing, Persian/Latin digits, punctuation, contractions, abbreviations, formulas, units and mixed-direction dropdowns.
- Date display should use Persian locale formatting. Store instants and day keys independently of presentation; test local-midnight/time-zone changes so a display-calendar choice cannot alter review scheduling.
- Require keyboard operation, visible focus, focus trapping/restoration in overlays, accessible names, contrast, touch targets, text zoom and reduced motion.
- For a canvas feature, rendered pixels and an equivalent accessible navigation path are both acceptance requirements.

These direction choices follow [W3C structural RTL guidance](https://www.w3.org/International/questions/qa-html-dir); precise inline handling should also follow its linked inline-bidirectional-text guidance during implementation.

## 7. Content model and incremental publication

Canonical content lives in version-controlled, schema-validated JSON/YAML with stable lexical IDs, stable sense IDs, taxonomy/path references, translations, explicit example contexts, review evidence, source/rights records, media IDs, capabilities and revision history. Reading material adds stable books/chapters/paragraphs/sentences, aligned translation, quizzes and optional checked narration timings.

Keep editorial approval separate from publication. The full state and example record are in the [content appendix](docs/content-and-taxonomy-plan.md). Draft source files may be visible to contributors, but must be absent from public learning indexes and production bundles. A content preview is visibly marked and separate from the production release.

Use an immutable publication layout such as:

```text
content/
  taxonomy/ entries/ paths/ modules/ readings/ books/
  sources/ media-manifests/ releases/
public/content/
  current.json
  releases/<release-id>/manifest.json
  indexes/<content-hash>.json
  entries/<content-hash>.json
  readings/<content-hash>.json
  media/<content-hash>.<extension>
```

`current.json` points to one compatible immutable manifest. The manifest declares schema/app compatibility, exact item revisions, hashes, indexes/shards, media, licenses and module counts. The app keeps one release context per active session. Fetch and validate the required release metadata/index before activation; do not combine a new index with old positional entry files. Large optional media stays lazy unless an offline pack is explicitly downloaded.

Changes follow these rules:

1. Publish content-addressed assets and immutable release artifacts first.
2. Validate references, hashes, review eligibility, licensing, exercise availability and counts.
3. Promote the current release pointer only after the entire release is available.
4. Existing sessions finish against their pinned release; activate a new release at a safe boundary with a concise notice.
5. On failure, retain the last compatible cached release. Rollback changes the pointer and preserves progress.
6. Corrections preserve identity when meaning is unchanged. Splits, merges, renames and withdrawals require a migration record, preserve old history, and never grant mastery to unrelated meanings.

Retain published immutable manifests, indexes and entry shards by default, and keep referenced assets while their releases remain supported. Define the support window in each release; initially retain the current and previous compatible releases for at least 90 days. Garbage collection must honor supported releases, rollback targets and locally pinned offline packs. If a paused session outlives support or a rights/safety withdrawal makes its content unavailable, preserve already committed grades and history, explain the change, and rebuild only ungraded work from the current release. Never resume with mismatched shards or replay a completed grade. A published withdrawal can override ordinary retention and must include a replacement/tombstone record.

Host media under the same origin by default, including a reverse-proxied static path where appropriate. Moving media to another origin requires explicit CORS configuration, public requests without credentials, acceptance of validated non-opaque CORS responses in the service worker, and verified hashes/availability. Test those paths before enabling an offline-pack guarantee; the upstream same-origin-only caching behavior cannot simply be retained with a new CDN URL.

Keep a stable corpus ID across publication releases. Backups include corpus ID, storage schema, app version and last content release. Import validates size, format, identity and allowed fields; presents a preview; preserves a recovery backup; and handles missing/retired IDs without silently discarding history. Any upstream-Chinese backup must remain a separate corpus unless there is an explicit reviewed mapping. Importing a word-level history must never mark every new specialist meaning familiar.

Offline support means cached material can be revisited. A downloadable pack is labeled fully available offline only after its index, entries and selected assets have been cached and verified. Report download progress, storage estimates and quota failures; allow cancellation and pack removal without deleting learning history. Cache namespaces and manifests must make mixed-release content impossible.

## 8. Open-source project and contributor workflow

Prepare a public-ready repository with `LICENSE`, `CONTENT_LICENSE.md`, upstream notices, `THIRD_PARTY_NOTICES`, README in English/Persian, setup/build/deploy instructions, `CONTRIBUTING`, code of conduct, security reporting, content style/review guides, correction templates, release notes and a contributor credits registry. The local implementation includes this project scaffolding. Public repository creation and hosted deployment remain separate release actions.

Recommend retaining MIT for code and using CC BY 4.0 for original/adapted educational content. Preserve asset-specific terms and modification notices. Upstream's designated vocabulary assets are offered under its content license; hosted-only reading material and music require their own verified rights. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) requires credit, a license link and modification indication, and does not grant unrelated third-party rights.

The app should generate a readable credits page and machine-readable asset/source export from the same records. A citation used to check accuracy is distinct from permission to redistribute text or media.

Make contribution possible without paid tools: a small fixture pack, ordinary package commands, schema checks and deterministic card previews. Large runtime media can be distributed as versioned releases/static downloads with hashes rather than requiring every contributor to clone a large media history.

Use pull requests for text, taxonomy, media and code. General language content needs bilingual review; specialist content also needs a competent domain reviewer. Reviews attach to exact content revisions and expire when a material change requires renewed review. Publish complete approved modules independently as they become ready, with clear category coverage and change logs.

AI generation is optional maintainer tooling, outside the learner runtime and ordinary correction workflow. Track AI assistance and asset provenance. Require pooled clients where possible, explicit connection/request timeouts, a total task-wide cap of eight outbound requests, at most three retries with backoff/jitter and Retry-After support, cancellation and cleanup. Stop new connections immediately on address exhaustion. Routine tests use mocked network dependencies; no load/stress campaign is required.

## 9. Verification and release acceptance

| Area | Required evidence before release |
| --- | --- |
| Reference fidelity | Side-by-side screenshots of Today, Atlas grid/list, word card, study prompt/feedback, galaxy, reading and Me at desktop and narrow widths; intentional Persian/category differences recorded. |
| Functional paths | Fresh onboarding → category/filter → card/audio → daily study → pause/resume → summary → progress; reading → lookup → return; practice → feedback; export → validated restore. |
| Scheduling | Deterministic time fixtures for due selection, first-answer-only grading, bounded retries, hints, session reload, cross-category deduplication and sense splits. |
| Publication | Draft exclusion, immutable manifest validation, consistent counts, missing asset capability handling, release switch, offline upgrade, failed download and rollback. |
| Persistence | Transactional writes, two-tab updates, quota/write failure, malformed/wrong-corpus/old-schema backup handling, migration recovery and retained retired-card history. |
| Content | Unique IDs, valid references, reviewed revisions, rights/credits, safe text/links, meaningful Persian, accurate examples/diagrams and verified audio. |
| RTL/accessibility | Mixed-direction golden cases, logical layout, no horizontal clipping, keyboard-only paths, focus restoration, zoom, contrast, reduced motion and canvas alternative. |
| Reader | Stable bookmark/resume IDs, translation alignment, lookup dismissal, quiz feedback, narration pause/seek/speed and graceful missing timing/audio states. |
| Performance | Record initial upstream baseline, then set explicit budgets; lazy-load galaxy/reader and detail data, virtualize lists, use responsive thumbnails, and avoid corpus-wide media prefetch. |
| Deployment | Reproducible clean checkout with fixture pack; production build at root and a subpath; direct route entry/refresh; correct cache headers and manifest activation. |

Use an explicit fixture where one lexical item has two meanings in different domains: verify one card/star, separate word/meaning totals, partial global state after one meaning is learned, and no unrelated mastery. Also exercise a paused session whose release is no longer supported and a cross-origin media pack when that hosting mode is enabled.

Use existing upstream tests where applicable. Add focused unit/content tests for identity, grading, manifests, migrations and RTL matching; browser tests cover genuine integration paths. Test the modified app in Chromium and WebKit, plus a small manual mobile check. Use local deterministic synthetic catalog fixtures for comprehensive-scale rendering checks, with network mocked and bounded resources. This is functional scalability verification, not authorization for network load testing.

Run CI in two tracks: code/schema/fixtures on every PR; validated changed-content/media checks for content PRs. Full corpus validation runs for a content release. Cache dependencies, cap CI concurrency, cancel superseded preview builds, and keep generation secrets out of untrusted contributor PR jobs. Do not require generation APIs for tests or builds.

## 10. Implementation milestones

Estimates below are provisional focused engineering days for one experienced developer using the public foundation. They exclude production of a comprehensive reviewed corpus and depend on focused source checks in M0. Content/editorial work can run alongside application work.

| Milestone | Work | Dependency | Acceptance | Estimate |
| --- | --- | --- | --- | --- |
| M0 Reference baseline | Establish licensed pinned source, fixture data, runnable commands, screenshots, feature-gap ledger; inspect session builder, galaxy internals, sharing, CI and installability | This plan | Existing public app runs reproducibly; baseline checks recorded; live-only work explicitly scoped | 2–3 days |
| M1 Persian shell | Locale extraction, font, RTL/LTR rules, five-tab shell, onboarding, light/dark/system design | M0 | Core screens resemble the reference at desktop/narrow widths; no Chinese UI strings | 3–5 days |
| M2 Content and storage foundation | All 32 domains, lexical/sense schema, runtime adapter, transactional progress, migration/backup contracts, release manifests | M0; coordinates with M1 | Deterministic fixtures include all domains, overlapping senses, a phrase, missing assets and a release update without lost progress | 5–8 days |
| M3 Atlas and galaxy | Grid/list/search, hierarchical categories, detailed cards, inline lookup, sharing, stable galaxy layout/counts | M1, M2 | Browse/filter/card/search/galaxy work from the same release and preserve the reference's presentation | 4–6 days |
| M4 Learning and practice | Today, FSRS sense queues, introduction/recall/feedback/summary, resume, typing/dictation, settings and stats | M1, M2; shared cards from M3 | End-to-end study and practice verified; first-answer scheduling and progress isolation pass | 5–8 days |
| M5 Hosted feature parity | Reading Room, books/chapter map, reader/listening, paraphrases, confusables; secondary appearance/audio refinements | M3, M4 | Each mode works with rights-cleared fixture/release material; no empty or fake controls | 6–10 days |
| M6 Open-source publication tools | Contribution docs/templates, review records, content/media compiler, credits, release/coverage commands and preview workflow | M2; content work can start earlier | A contributor can preview and propose a module without paid credentials; maintainer can publish/withdraw/rollback a validated module | 3–5 days |
| M7 Launch qualification | Responsive/RTL/accessibility fixes, offline packs/update tests, clean setup, static hosting, release notes and user documentation | M3–M6 | All release checks above pass; public site and self-hosted instructions work for the exact release | 4–6 days |

The total is approximately 32–51 focused engineering days, roughly 7–11 working weeks for one developer, before allowing for reviewer availability and content production. Re-estimate after M0; do not present this as a fixed delivery commitment.

M2 includes fixtures for all domains to validate breadth. Production content can start with coherent reviewed modules across available subjects, including cooking, medicine and engineering, then expand throughout the entire taxonomy. The first integration pack is an engineering aid, not a reduction of the comprehensive product scope. No calendar date or complete-corpus word count is promised before the editorial inventory exists.

## 11. Completion conditions

The website is implementation-complete when all five main destinations and the specified hosted-reference features are usable in Persian; the full category map exists; released modules populate learning consistently; progress survives content updates; the galaxy and readers work; public-source setup is reproducible; licenses/credits are correct; and the exact deployed build passes its release checks.

Public launch also needs a minimum real inventory, distinct from engineering fixtures: at least one coherent reviewed vocabulary module in each of general English, cooking, medicine and engineering; an approved bilingual passage with comprehension items; a rights-cleared book chapter with reviewed narration to exercise listening mode; a playable paraphrase level; and a reviewed confusable-word group. Every published vocabulary card needs an approved illustration or explanatory visual. Other categories remain visibly planned until their modules are ready. This gate demonstrates each promised mode with real content without requiring the comprehensive corpus to be finished before launch.

The corpus remains explicitly growing after website launch. Coverage reports distinguish available, in-review and planned material, and ongoing releases add trustworthy content without breaking the familiar Word Atlas experience or existing learner history.

Before public launch, finalize the new project name/domain, designate maintainers and editorial reviewers, choose the initial production modules from ready content, and verify the rights of each imported asset. The defaults in this plan allow engineering preparation to proceed without turning those naming/editorial decisions into prerequisites for a runnable application.
