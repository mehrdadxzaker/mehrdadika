# Content contributions and gradual publication

Mehrdadika publishes coherent learning modules across a 32-domain catalog. A subject can be planned before any of its lessons are published. The learner interface must distinguish available content from planned coverage and must never create an exercise from an unpublished draft.

## Content identity

Use a stable lexical item ID for each English word or phrase and a stable sense ID for each meaning. A medical and electrical meaning of `discharge` are separate senses. A sense shared by several categories references the same learning record. Renaming a category or correcting Persian punctuation does not create new identity.

Words, phrases, abbreviations and specialist expressions can have full entries. Examples should state their context: everyday, academic, professional, patient-facing, cooking, engineering or another relevant register. Difficulty of English and depth of subject knowledge are different dimensions.

## Propose a module

Before drafting a large set, open a content proposal identifying:

- The target learner and a practical learning objective.
- The category and existing related material.
- Proposed words/phrases, meanings and reading material.
- References, rights and assets already available.
- Language and domain reviewers needed before stable release.

Prefer a complete small objective over a large unrelated word list. Cooking modules might cover ingredient preparation, a set of cooking methods or reading a recipe. The catalog’s ownership rules prevent copies across cooking, hospitality, agriculture and healthcare.

## Draft and provenance

Write natural Persian explanations and original English examples. Record the author or generation method, source locators, licenses, modifications and asset credits. Preserve display spelling while adding alternate spellings/loanwords as search aliases.

Do not copy commercial dictionary definitions, book translations, stock images or recordings without a compatible rights basis. Public accessibility is not a license. Original text and properly licensed adaptations are suitable starting points. Hosted-only Word Atlas books and music need their own permission; their presence on the website does not extend the repository’s content license.

Record AI assistance accurately. AI drafting and automated consistency checks do not establish human approval. Do not fabricate reviewer names, credentials, reviews, recording provenance or rights.

## Review states and release channels

Editorial readiness and publication are independent:

- **Draft:** incomplete or unreviewed contribution; excluded from all learner release manifests.
- **Editorial preview:** an explicit pre-release revision with traceable provenance, suitable for exercising the application and gathering corrections. It is not represented as independently human-reviewed.
- **Human language approved:** a real bilingual reviewer approved the exact revision.
- **Domain approved:** an appropriately competent reviewer approved the specialist meaning, examples, diagram or pronunciation where applicable.
- **Published:** an eligible exact revision belongs to a selected versioned release manifest.
- **Withdrawn:** unavailable for new learning, with a retained identity/history record and an explanation.

A preview channel can contain eligible editorial-preview content, but must identify that channel honestly. A stable release requires recorded human language approval, and domain approval for specialist content. Switching a label from preview to stable is not a substitute for those records. Runtime release selection must not fall back to arbitrary draft files.

## Media and reading

Every media record needs its source, creator, license, modifications, hash, content association and accessibility description. Check whether an illustration teaches the selected meaning. For technical diagrams, review labels and structure. Record whether speech is synthesized or human-recorded and verify correspondence to the displayed text.

Reading contributions need stable passage/chapter/paragraph/sentence IDs, aligned Persian text, target sense IDs, comprehension items, answer explanations and rights for text and included assets. Audio and synchronization are optional capabilities. Enable sentence/word highlighting only when checked timings exist. A text-only chapter should not show nonfunctional narration controls.

## Validate, review and publish

1. Run `npm run check:content` and preview the affected card, exercise or reader.
2. Submit a pull request with the exact changed IDs/revisions, references, rights and review needs.
3. Resolve bilingual language and required domain review against that revision.
4. Add eligible records to a versioned module/release manifest. Draft source presence does not publish it.
5. Verify all references, assets, exercise capabilities, counts and attributions before promoting a release pointer.
6. Retain supported immutable releases and preserve learning identity on updates or rollback.

The compiler should reject duplicate or dangling IDs, unpublishable records, missing required rights/review evidence and impossible exercises. It should not invent approval records to make a build pass. Preview builds and stable-release checks must report their different guarantees clearly.

Corrections that preserve meaning retain learning history. Splits, merges, changed meanings and withdrawals require explicit migration entries. If an older session cannot be resumed, retain committed grades and rebuild only ungraded work; do not silently replay answers or transfer mastery to unrelated meanings.

## Release checklist

- Exact revision and declared release channel are recorded.
- References, language and required domain approvals are valid for that revision.
- All included text/media have an explicit compatible rights record and attribution.
- The grid, search, study queue, reading links and galaxy use the same published manifest.
- Empty/planned categories remain visible as coverage information and cannot start an empty lesson.
- Audio and quiz modes match actual content capabilities.
- Content changes preserve stable IDs and have any necessary migration/withdrawal records.
- Release notes describe added modules, corrections and withdrawals accurately.

## Actual release commands and review fields

The current source snapshot is `content/entries.json`, the bilingual taxonomy is `docs/category-catalog.json`, and reading/exercise sources are in `content/readings.json`. Keep IDs stable when editing. Set a new `releaseId` for a new editorial release, then run:

```sh
npm run check:content
npm run build:content
npm run build:locales
npm run build
```

The compiler writes an immutable hashed manifest, compact index, entry shards and copied media under `public/content/`, and changes `current.json` only after all release files are present. Retain old supported releases when deploying. Draft and withdrawn meanings/items are excluded. A static release snapshot can include newly completed modules while other categories remain planned. `build:locales` then filters translation overlays against that published snapshot; it never imports the authoring vocabulary into the client. Both development and production prebuild hooks run the two stages in order. The original `build:content -- --channel … --check` argument forwarding remains available.

The preview channel records AI-assisted content honestly. To qualify a vocabulary sense for the stable channel, its `review` must include `status: "approved"`, `human: true`, a named `reviewer`, and a matching `contentHash`. Medicine and engineering meanings additionally require `domainQualified: true` and a named `domainReviewer`. Review declarations must represent real review; adding flags does not perform that review. The reading schema uses `humanReviewed` for its language review record and the same qualified-domain fields for specialist material. Follow the [exact-content review digest workflow](review-digests.md) to bind approval to the inspected text and media; later edits invalidate that approval.

Check a proposed stable release with `node scripts/build-content.mjs --channel stable --check`. The supplied starter content intentionally fails that gate until genuine reviews are recorded. Existing upstream generation/demo scripts have been replaced with the local compiler; app builds make no generation calls. The optional starter-media fetcher uses four reusable connections and is not part of builds or tests.
