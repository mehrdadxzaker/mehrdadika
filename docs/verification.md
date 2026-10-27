# Local verification

Checked on October 26, 2026, on macOS in the Codex in-app browser. The initial checks and later milestones below record local and hosted verification separately. They do not establish independent editorial approval.

## Automated checks

- `npm run build`: passes TypeScript and the Vite production build.
- `npm test`: 69 passing tests at the latest full run, covering publication gates, review digests, draft exclusion, reader validation and resume, independent meaning progress, stable galaxy geometry, FSRS, duplicate grading, backups, Unicode typing, inline lookup, CSS asset discovery and service-worker response/cache matching.
- `npm run check:content`: validates 56 lexical entries, 57 meanings and all 32 domains in the preview channel.
- `node scripts/build-content.mjs --channel stable --check`: deliberately fails with `Stable release requires recorded human approval: library:meaning-1`. This is the required result for the current unreviewed preview.
- `ATLAS_BASE=/mehrdadika/ npm run build`: passes. A production browser smoke test loaded the cooking collection, full `bake` card and its 512-pixel content-addressed illustration beneath the repository path.
- `git diff --cached --check`: passes before the final verification-document update.

The current content pointer targets `content/releases/2026-10-preview-1-3471bac36b45/manifest.json`, SHA-256 `3471bac36b45ea924e33400d0b0c668b4fa7ae90152967a06adb345dfcd2ffe9`.

## Browser checks

- Completed onboarding with level A1 and a five-meaning daily target.
- Opened all-category discovery, selected cooking, and checked an unpublished category's explicit upcoming state and Persian subcategory labels.
- Confirmed normalized Persian search accepts Arabic letter variants.
- Opened illustrated word details with bilingual examples, collocations, families and separate UK/US controls. Checked inflection lookup and Escape closing only the active popup.
- Completed a five-meaning introduction/recall session, including wrong answers and bounded retries. Reloaded during answer feedback; the session retained its position and did not duplicate grading. The summary reported five new meanings and first-answer accuracy.
- Answered all three short-passage comprehension questions; the UI showed three correct answers and explanations.
- Opened the book's chapter map, bilingual chapter and listening presentation. Set a paragraph bookmark and sentence position; both survived reload.
- Checked a typing answer advancing to the next prompt, a correct paraphrase answer with Persian feedback, and the recipe/receipt comparison and quiz feedback.
- Inspected desktop and 390-pixel phone layouts. The phone word sheet and document both measured 390 pixels wide, with no horizontal overflow. Checked both light and dark presentation.
- Inspected the galaxy renderer and its zoom, reset and learned-star controls. Automated tests separately verify that new words and reordered categories preserve existing star coordinates and colors.

Local screenshots are under `docs/evidence/app/` and intentionally excluded from version control. They are inspection evidence, not additional redistributed content assets.

## Offline verification

The production installer successfully downloaded and verified 199 files, approximately 3.8 MB. Failed installations did not report completion. Browser checks uncovered and led to regression fixes for nested SVG URL parsing, partial HTTP responses and `Vary: Origin` matching for public static assets.

After installation, the preview server was stopped and `lsof` confirmed that nothing listened on port 5188. A cold reload of `#/me` succeeded with the styled Persian application and saved progress. Navigation to the `pressure` word card loaded its separate medical/engineering meanings and complete 512-pixel illustration. Its pronunciation control entered playback state. A previously unopened chapter in the production tab loaded through the lazy reader chunk, including its image, English text and Persian translation. A new tab also opened the cooking grid with the server still stopped. Screenshots include `offline-pressure-card.png`, `offline-book-reader.png` and `finished-cooking-atlas.png`.

This establishes a bounded local cold-reload and navigation result. It does not establish every browser's cache behavior, perceptual audio quality or all update/quota/eviction scenarios.

## Limits

The original local checks above preceded public publication. Cross-browser/device qualification and a learning-outcome study were not performed. Automated backup validation and transactional merge tests pass; a complete manual cross-device import/export exercise was not performed. Audio controls were exercised, but perceptual pronunciation quality was not independently reviewed. The starter corpus remains an AI-assisted preview, including healthcare and engineering vocabulary.

Storage eviction, low quota, arbitrary release-update interruption and rollback combinations still need a broader release qualification run. These checks are deliberately bounded functional checks, not load or stress testing.

## Public publishing and Portuguese milestone

The public repository is [mehrdadxzaker/mehrdadika](https://github.com/mehrdadxzaker/mehrdadika), and the site is hosted at [mehrdadxzaker.github.io/mehrdadika](https://mehrdadxzaker.github.io/mehrdadika/). The first public source revision was `294096582341601d1052dfd330f90f5e9fe71dcd`: its [Checks run](https://github.com/mehrdadxzaker/mehrdadika/actions/runs/40431571195) and [Pages run](https://github.com/mehrdadxzaker/mehrdadika/actions/runs/40431591162) both succeeded. The workflow's live `build-info.json` check and a separate public HTTP read returned the same revision. Browser verification opened the public cooking collection and complete bilingual `bake` card, including its 512-pixel illustration.

The Portuguese milestone passes 83 local tests, content/locale snapshot checks, TypeScript and the production build under `/mehrdadika/`. The original content CLI still accepts `npm run build:content -- --check --channel preview`; separate locale generation preserves that argument forwarding. Tests include draft/withdrawn translation exclusion, exact-English source binding, unknown nested field exclusion and generated snapshot consistency. A service-worker regression verifies that opening JSON metadata or an image as a document cannot replace the offline HTML app shell.

Local browser checks on `#/pt-BR` confirmed:

- Portuguese metadata and computed LTR direction, then restoration to Persian/RTL when switching back.
- Searching `pressao` finds `pressure`, while displaying the correctly accented Portuguese text.
- Distinct medical and engineering definitions, English–Portuguese examples, collocations and usage guidance.
- Saving a word, retaining it after reload, showing it in the saved collection, and removing it.
- All 32 category choices and the explicit upcoming state for gaming/digital culture.
- Native-dialog Escape handling and a 390-pixel phone dialog with no horizontal document overflow.
- Persian study history remaining present after visiting the separately namespaced Portuguese collection.
- A fresh visitor choosing Portuguese from the welcome screen with the keyboard, without completing the Persian onboarding flow.

Screenshots include `portuguese-pressure-desktop.png` and `portuguese-pressure-phone.png` under the ignored evidence folder. The [Pages workflow](https://github.com/mehrdadxzaker/mehrdadika/actions/workflows/pages.yml) verifies the source revision on each explicit deployment. The site's `build-info.json` identifies the currently served build.

Portuguese currently covers vocabulary discovery, cards, search, categories, pronunciation and saved words. Its reading and spaced-review flows are not localized. Translations are an unreviewed AI-assisted preview, and European Portuguese is planned separately.

## Science through English local verification

October 26, 2026: the local Water and Weather implementation passes 145 source tests, `npm run check:content` (including illustration bindings for all 91 words) and `npm run build`. The science course includes eight complete English lessons, all three source-bound support overlays, 32 closed activities, eight writing prompts and 22 target senses. The integration preserves the separately completed atlas illustration updates.

Bounded Playwright Chromium checks used one localhost production-preview server, sequential browser contexts and 1440 × 1000 desktop and 390 × 844 Persian phone viewports. The flow was Library → Courses → course overview → lesson → translation → vocabulary sheet → practice → writing and self-review → completion. The first and final lessons were completed in each edition. The checks verified preserved first incorrect attempts after correction, translation preferences and drafts after reload, exact English lesson identities, no vocabulary cards created by course completion, and no relevant browser console/page errors or horizontal overflow. Separate source regressions cover locale isolation, backup compatibility, exact older-release handoff, unavailable pinned content and inactive-edition updates from another tab.

The Portuguese edition also passed a real browser backup export, reset, and file-import round trip, preserving its two completed lessons and writing. Starting normal vocabulary review from a completed lesson created the canonical three-word session without overwriting an existing session in source regressions. The Portuguese phone overview was checked in the actual dark theme.

A production offline pack was installed through Me. With the browser context offline, the app cold-navigated to a previously unopened lesson and rendered English readings in Portuguese, Spanish and Persian editions. This verifies the bounded installed-pack course path in Chromium, not every browser, storage-eviction or release-update combination. Optional device narration was not perceptually qualified.

The generated course cover and the eight editable diagrams retain honest AI-assisted provenance. The 19 new vocabulary illustrations were rendered as a contact sheet and received source/hash-bound AI inspection records; the pre-existing 72 illustration records and 26 replacements remain preserved. These records are not independent human or specialist approval. Course and translation review, learner-outcome evaluation and public deployment remain separate from these implementation checks.


## Cooking foundation expansion

October 26, 2026: the cooking expansion preserves the published Water and Weather course and all 91 previous lexical identities, then adds 36 original entries. The combined preview contains **127 English words, 128 meanings, 256 bilingual examples and 381 collocations** in each supported native edition. Cooking has **50 words**. No independent language, culinary or other specialist approval is claimed.

- All **150 tests** pass with four bounded test workers, including old-word/sense preservation, complete source-bound overlays, real media references, category-overlap counting, queue integrity and multiword cloze examples.
- `npm run check:content` passes English, both vocabulary overlays, both reading overlays, course validation, all 127 illustration bindings and the category ledger. The audit records 26 earlier replacements and 36 newly added images.
- `ATLAS_BASE=/mehrdadika/ npm run build` passes TypeScript and production compilation. The English cards now span two 100-entry shards; the separate science-course artifact remains present.
- All 36 generated pictures were inspected at full size and at 120px. A second AI thumbnail pass and cross-batch text review found no blocking defects. These are editorial AI assessments; hashes and test results cannot establish semantic correctness or human review.
- The production browser preview showed 127 total words and 50 cooking words in Persian, Portuguese and Spanish. The Persian `drain` and Portuguese `measuring cup` cards loaded their new 512px pictures, meanings, examples and collocations. Portuguese search for `porcao` returned `portion` with its native `porção` label.
- At 390px, Spanish `frying pan` and Persian `knead` cards retained complete square illustrations, native copy and correct text direction. Both the document and viewport measured 390px; no horizontal overflow or relevant console errors were observed.

New cooking entries have no packaged pronunciation recordings. Device English voice availability and perceptual quality were not independently qualified. The unchanged offline installation lifecycle was not requalified for this content expansion; earlier offline evidence remains scoped to its recorded revisions.

The expanded pointer targets `content/releases/2026-10-preview-4-35a11cd7aa63/manifest.json`, SHA-256 `35a11cd7aa63201cd3f5692a7318c674af391985364275e4e338d0bced9bbcef`. Current category counts and the next category are available through `npm run content:coverage`; the [category queue](category-expansion.md) describes future coverage.


## Visual foundations across all 32 categories

October 26, 2026: release `2026-10-preview-5` adds **64 original entries**, two per category. The combined atlas has **191 English entries, 192 meanings, 384 examples and 573 collocations** in each supported native edition. Cooking has 52 words. Existing lexical/sense IDs, native overlays, reading catalogs, the Water and Weather course and supported immutable releases remain intact.

- All **155 tests** pass with four bounded workers. New regressions cover taxonomy-wide brief coverage, exact brief/audit/provenance bindings, missing style inspections, unsupported human-review claims, prior identity preservation and all 64 native example/collocation bindings.
- `npm run check:content` passes English, vocabulary and reading overlays, course validation, all 191 illustration bindings, the category ledger and 64 new visual-language assessments across 32 categories. Checks establish integrity and staleness guarantees, not semantic or artistic truth.
- The production build under `/mehrdadika/` passes TypeScript and Vite. A local dependency-cache write restriction required running the existing test/build tools with cache-write permission; no dependency installation or source workaround was needed.
- Every new asset was read back as a 512px WebP and inspected at full size and 120px, followed by a second AI thumbnail pass with targeted full-size checks. Revisions corrected brake pad geometry, an inconsistent spring inset, a mismatched pixel zoom patch, and style drift in the basket and swimming images. Rejected candidates and obsolete unpublished release artifacts were excluded from publication; private QA copies were retained.
- Browser checks loaded the Persian stethoscope card, Portuguese gear card, Spanish peninsula phone card and Persian fire-extinguisher phone card. Distinct medical, engineering, map and safety artwork rendered completely; the new English examples, native translations and collocations were present. The phone layouts measured 390px document and viewport width, with 350px square pictures, no horizontal overflow, no oversized buttons and no relevant console errors.
- A separate read-only integration review confirmed structural preservation of all 127 prior source entries, both native overlays, prior audit/provenance records and science/reading sources. All 326 artifacts referenced by the final manifest were locally hash/size-correct; all four generated locale references select the same final manifest.

The pointer selects `content/releases/2026-10-preview-5-402e0d2089d7/manifest.json`, SHA-256 `402e0d2089d7fc3b2f2e8d8d75cae0ae2f7368f5286d0f97f486abe9b05cfe1d`. The [visual foundations guide](category-visual-foundations.md) lists the 32 category briefs and 64 words. Full generation prompts, accepted asset paths and hashes are in `content/media-provenance.json`; generation used the built-in image tool.

All new content and image assessments remain AI-assisted editorial previews pending independent language and specialist review. No finished pronunciation recordings were invented; device English speech is used where available. This content-only release did not repeat the full offline installation or cross-browser qualification campaign.
