# Mehrdadika implementation status

Implementation snapshot, October 27, 2026. Mehrdadika adapts the public Word Atlas application into a Persian-first English-learning website, with full shared application flows for Brazilian Portuguese and a first Latin American Spanish edition. It retains the reference’s visual foundation and five main destinations, with new reading and specialist practice features implemented over the public source.

The [public source repository](https://github.com/mehrdadxzaker/mehrdadika) and [GitHub Pages website](https://mehrdadxzaker.github.io/mehrdadika/) are available. The [implementation plan](../IMPLEMENTATION_PLAN.md) remains the broader requirements and continuing roadmap; this document distinguishes current implementation from corpus readiness and release qualification.

## Current inventory

| Item | Current scope |
| --- | --- |
| Vocabulary | 642 lexical items and 643 independently scheduled meanings. `pressure` has separate medical and engineering learning contexts under one public word card. |
| Subject taxonomy | All 32 domains, organized into six discovery groups, with category-specific visual briefs for the 64-word expansion. |
| Subcategory display | 348 native subcategory labels in each of Persian, Brazilian Portuguese and Latin American Spanish, parallel to the English catalog. |
| Starter focus | All 32 categories have two new visual-foundation entries; cooking has 52 words. Medicine and engineering now have 242 words each; the ongoing campaign targets 500 each before the remaining category queue. |
| Short reading | Three original bilingual passages with comprehension questions. |
| Book reading | One original short book with three chapters. |
| Additional exercises | Two paraphrase levels and three confusable-word groups. |
| Science through English | Water and Weather: eight lessons, 32 closed activities, eight writing tasks, 22 target senses and complete Persian/Portuguese/Spanish support. |
| Review channel | AI-assisted editorial preview. No independent human or specialist approval is claimed. |
| Portuguese and Spanish previews | Each edition has 642 words, 643 senses, 1286 translated examples, 1926 collocations, 642 usage notes, 32 category labels, 348 subcategory labels and six group labels, plus the reading/practice catalog above. |

The [category expansion ledger and queue](category-expansion.md) tracks coherent publication batches, with foundation/core/depth targets of 50/150/400 words per category. `npm run content:coverage` reports current unique word and category counts. The [specialist campaign](specialist-expansion.md) overrides the immediate medicine and engineering target to 500 each; `npm run campaign:status` measures the remaining work from the published release.

Category and subcategory presence describes intended coverage. It does not mean that every branch already contains authored lessons. A shared sense can appear through multiple category routes without becoming a second learning record.

## Implemented application surfaces

| Surface | Current implementation |
| --- | --- |
| Persian shell | RTL Persian interface, isolated LTR English and IPA, self-hosted Persian/English fonts, light/dark/system themes, responsive navigation and optional original synthesized UI ambience. |
| Portuguese and Spanish editions | The same full application flows as Persian, with native LTR guidance, locale-prefixed routes and independent learner state. Vocabulary and reading snapshots are filtered against the published English release before bundling. Existing Portuguese preview saved words migrate into the full Portuguese edition. |
| Welcome | Crisp HTML wordmark, a vector compass and decorative particles, with a visible entry button, keyboard entry, native language links, responsive geometry and reduced-motion support. |
| Onboarding and Today | Starting-level and daily-target preferences, optional exam settings, daily/resumable study entry, activity/progress summaries and links into reading and Atlas. |
| Atlas | Illustrated grid, compact list, search, category/level/status filters, the complete category chooser, word sheets, favorites and coverage information. |
| Word detail | Bilingual meanings/examples, collocations, forms, usage tips, separate UK/US controls, inline lookup and locally rendered share images. |
| Learning | Five-item introduction/recall flow, meaning/cloze/listening/spelling formats, FSRS scheduling per meaning, first-answer grading, bounded retries, pause/resume and summaries. |
| Progress | Local transactional progress storage and portable backup/restore scoped to each edition, separate practice/reading state, and aggregation of meaning progress into one public word/star. Persian storage identities are preserved. |
| Galaxy | Reference spiral renderer, domain labels, zoom/navigation/share controls, aggregate word state and positions/colors stable under new words or reordered categories. Empty primary clusters do not display labels. |
| Reading | Short passages and books, aligned translation, comprehension feedback, chapter constellation, bookmarks/resume, inline lookup, reader/listening presentations and device English narration. |
| Science course | Library course shelf, ordered lessons, optional native support, four exercise formats, saved writing and self-review, separate local progress, backups and course assets in the production offline pack. |
| Practice | Word typing, sentence copying, dictation, paraphrase questions and confusable-word comparisons, with independent exercise results. |
| Publishing | Validated preview/stable channels, draft/withdrawn exclusion, content-addressed immutable artifacts, exact-release pointers, asset hashes and contribution/review metadata. |
| Offline controls | Production-only pack installation, progress/cancel controls, integrity checking, failure handling and pack removal without intentionally deleting learning history. End-to-end browser qualification is a separate check below. |
| Project setup | MIT code notice, separate content licensing, upstream/asset/font attribution, English, Persian, Portuguese and Spanish READMEs, contribution/security/conduct documents, bounded CI and a manual-only Pages workflow. |

These are implementation statements, not a certification of every browser, asset or release scenario. The [local verification record](verification.md) reports browser and release-check evidence separately from the feature inventory.

## Quick start

Use Node.js 22 or newer and the committed npm lockfile:

```sh
npm ci
npm run dev
```

The app defaults to `http://127.0.0.1:5188`. The `predev` hook builds the current English release, vocabulary locale snapshots and reading locale snapshots automatically. Only one development/preview server should own that port.

```sh
npm test
npm run check:content
npm run build
```

`npm run build` compiles content, checks TypeScript and produces `dist/`. After stopping the development server, `npm run preview` serves the production build on the same local port. Offline-pack installation is deliberately unavailable in development mode.

For a static deployment under a subpath:

```sh
ATLAS_BASE=/mehrdadika/ npm run build
```

Use `/` for domain-root hosting. Retain the generated immutable content files when publishing updates and configure all app/content/media URLs under the same base path. The GitHub Pages workflow runs only when explicitly dispatched and verifies the live `build-info.json` source revision after deploying. It has been used for the public site; each later update still requires an explicit deployment.

## Content release workflow

The current source is `content/entries.json`, `content/readings.json` and the [category catalog](category-catalog.json), with media provenance recorded separately. The builder also accepts `content/taxonomy.json` if a maintainer moves the canonical catalog there while preserving IDs.

1. Add or correct a coherent module’s source records. Preserve lexical and sense identities when meanings are unchanged. Assign a new `releaseId` for a new editorial release.
2. Keep incomplete items as drafts. The compiler excludes them from learner output rather than depending on UI hiding.
3. Record sources, asset rights, AI assistance and review state honestly. A machine check is not a human review.
4. Validate without writing a new release:

```sh
npm run build:content -- --check --channel preview
```

5. Build the chosen preview release and the application:

```sh
npm run build:content -- --channel preview
npm run build:locales
npm run build:reading-locales
npm run check:content
npm run build
```

The source’s declared channel must match the intended application build: `prebuild` uses the channel in `content/entries.json`. A one-off CLI override is not a permanent channel switch.

The compiler writes content-addressed payloads/assets and an immutable manifest before replacing `public/content/current.json`. Existing release artifacts are retained. There is no separate hosted publishing service or dedicated rollback command; deployment and any compatible pointer rollback remain maintainer release operations.

Before a stable release, obtain actual human language review for each included vocabulary sense and appropriate domain review for specialist material. Reading and exercise records also need genuine approval. Validate the proposed stable channel without writing it:

```sh
npm run build:content -- --check --channel stable
```

The current preview vocabulary is expected to fail that stable gate because independent approval has not been recorded. Do not fabricate reviewer identities or change a label to make the gate pass. After actual reviews are complete, declare the stable source channel, assign a new release ID and build normally. See the [content contribution guide](contributing-content.md) for the review and rights requirements.

## Current limits and continuing work

- The catalog is comprehensive in structure, while the corpus is a small growing preview. All 32 categories are represented in navigation/coverage; most specialist subcategories still need content production and review.
- The healthcare and engineering examples are introductory vocabulary previews. They have not been independently qualified by clinical or engineering reviewers and are not a stable professional curriculum.
- Book and sentence narration currently uses the browser/device English voice where available. It is not a packaged, independently reviewed narration collection. No checked word-timing corpus is included, so device narration should not be described as verified word-by-word alignment.
- Local backups provide transfer between devices; there is no account service or automatic cross-device synchronization.
- The reference’s optional extra appearance presets and alternate illustration collections are not included. The core light/dark presentation and one licensed illustration per starter word form the current visual baseline.
- The current publisher builds a release from eligible source records. A separate content-authoring web interface, large editorial review operation and independent per-module publishing command remain future work.
- Offline installation/update/rollback paths, storage quota failures and cross-browser/device behavior require their own release evidence. Availability of the controls or a passing source test alone does not establish complete offline qualification.
- Portuguese and Spanish have the full core application flows, but remain AI-assisted translation previews awaiting native-language and domain review. Spanish is the first `es-419` edition; regional terminology and European Portuguese remain continuing editorial work.
- New original entries have sense-specific SVG or generated WebP illustrations and use device English pronunciation when no packaged recording is available. They are excluded from recorded-audio-only quiz modes until recordings are supplied. Availability and quality of a device voice depend on the browser and operating system.
- The site is hosted on GitHub Pages. A custom domain, independent external contributor review and real-world learning-outcome evaluation have not been completed.

## Verification record

The original Persian build passed 69 tests, local desktop/phone/offline checks and the first public CI/deployment runs. The earlier Portuguese vocabulary milestone passed 83 tests and content checks. The current multilingual milestone adds route/runtime translation, full taxonomy, source-bound reading, locale-state and new-word regressions; its final release validation is recorded separately. See the [verification record](verification.md) for deployment revisions, browser checks and remaining qualification limits.

## Science course local implementation

The [Water and Weather course](science-course.md) is implemented locally in the same application shell, with its own paper-cut field-guide artwork. The final local suite passes 145 tests, content/locale/illustration checks and the production build. Browser checks completed the first and final lessons in all three editions, including translations and draft restoration, word-sheet return, all four activity types, first-attempt preservation and writing self-review. The production offline pack loaded a previously unopened lesson in each edition. Desktop and Persian phone views had no horizontal overflow or relevant browser errors.

The course remains an AI-assisted editorial preview pending independent language and science review. The approximate English level is an editorial target. Publication uses the manual GitHub Pages workflow; the live site's `build-info.json` identifies its deployed source revision. See the [verification record](verification.md) for scope.
