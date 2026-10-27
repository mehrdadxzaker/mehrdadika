# Local verification

Checked on October 26, 2026, on macOS in the Codex in-app browser. This records a local implementation check, not a hosted release or independent editorial approval.

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
