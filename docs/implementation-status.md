# Mehrdadika implementation status

Local implementation snapshot, October 26, 2026. Mehrdadika adapts the public Word Atlas application into a Persian-first English-learning website. It retains the reference’s visual foundation and five main destinations, with new reading and specialist practice features implemented over the public source.

The application is available as local source and a static-build project. A public source repository, public URL and hosted deployment have not been created for this project. The [implementation plan](../IMPLEMENTATION_PLAN.md) remains the broader requirements and continuing roadmap; this document distinguishes current implementation from corpus readiness and release qualification.

## Current inventory

| Item | Current scope |
| --- | --- |
| Vocabulary | 56 lexical items and 57 independently scheduled meanings. `pressure` has separate medical and engineering learning contexts under one public word card. |
| Subject taxonomy | All 32 domains, organized into six discovery groups. |
| Subcategory display | 348 bilingual subcategory labels, with Persian labels parallel to the original English catalog. |
| Starter focus | General English, cooking, healthcare and introductory engineering, with cross-links into related categories. |
| Short reading | Three original bilingual passages with comprehension questions. |
| Book reading | One original short book with three chapters. |
| Additional exercises | Two paraphrase levels and three confusable-word groups. |
| Review channel | AI-assisted editorial preview. No independent human or specialist approval is claimed. |

Category and subcategory presence describes intended coverage. It does not mean that every branch already contains authored lessons. A shared sense can appear through multiple category routes without becoming a second learning record.

## Implemented application surfaces

| Surface | Current implementation |
| --- | --- |
| Persian shell | RTL Persian interface, isolated LTR English and IPA, self-hosted Persian/English fonts, light/dark/system themes, responsive navigation and optional original synthesized UI ambience. |
| Onboarding and Today | Starting-level and daily-target preferences, optional exam settings, daily/resumable study entry, activity/progress summaries and links into reading and Atlas. |
| Atlas | Illustrated grid, compact list, search, category/level/status filters, the complete category chooser, word sheets, favorites and coverage information. |
| Word detail | Bilingual meanings/examples, collocations, forms, usage tips, separate UK/US controls, inline lookup and locally rendered share images. |
| Learning | Five-item introduction/recall flow, meaning/cloze/listening/spelling formats, FSRS scheduling per meaning, first-answer grading, bounded retries, pause/resume and summaries. |
| Progress | Local transactional progress storage, portable backup/restore, separate practice/reading state and aggregation of meaning progress into one public word/star. |
| Galaxy | Reference spiral renderer, domain labels, zoom/navigation/share controls, aggregate word state and positions/colors stable under new words or reordered categories. Empty primary clusters do not display labels. |
| Reading | Short passages and books, aligned translation, comprehension feedback, chapter constellation, bookmarks/resume, inline lookup, reader/listening presentations and device English narration. |
| Practice | Word typing, sentence copying, dictation, paraphrase questions and confusable-word comparisons, with independent exercise results. |
| Publishing | Validated preview/stable channels, draft/withdrawn exclusion, content-addressed immutable artifacts, exact-release pointers, asset hashes and contribution/review metadata. |
| Offline controls | Production-only pack installation, progress/cancel controls, integrity checking, failure handling and pack removal without intentionally deleting learning history. End-to-end browser qualification is a separate check below. |
| Project setup | MIT code notice, separate content licensing, upstream/asset/font attribution, bilingual READMEs, contribution/security/conduct documents, bounded CI and a manual-only Pages workflow. |

These are implementation statements, not a certification of every browser, asset or release scenario. The [local verification record](verification.md) reports browser and release-check evidence separately from the feature inventory.

## Quick start

Use Node.js 22 or newer and the committed npm lockfile:

```sh
npm ci
npm run dev
```

The app defaults to `http://127.0.0.1:5188`. The `predev` hook builds the current content release automatically. Only one development/preview server should own that port.

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

Use `/` for domain-root hosting. Retain the generated immutable content files when publishing updates and configure all app/content/media URLs under the same base path. The included GitHub Pages workflow runs only when explicitly dispatched after a public repository and Pages settings exist. It has not been run for a public deployment here.

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
- No public hosting, repository publication, custom domain, external contributor review or real-world learning-outcome evaluation has occurred as part of this local implementation.

## Verification record

The production build, content validation and 69 automated tests pass. Desktop and phone browser checks cover the principal learning, discovery, reading and practice flows. A production offline pack installed 199 files (about 3.8 MB), and a cold reload and illustrated word-card lookup succeeded after the local server was stopped. See the [verification record](verification.md) for the exact scope, evidence and remaining qualification limits. GitHub Actions and public deployment have not run.
