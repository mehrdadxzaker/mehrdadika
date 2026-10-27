# Word Atlas upstream source map

Inspected on October 26, 2026. All source references below are pinned to commit [`e7b44629230a470e6b664826ced4af2c367b44c2`](https://github.com/designfuchen/word-atlas/commit/e7b44629230a470e6b664826ced4af2c367b44c2), authored October 26, 2026 at 13:47:28 UTC. This map describes the public repository. Live website observations belong in the accompanying inspection report because the hosted product evolves separately.

The public app is a practical foundation for a close Persian adaptation. Preserve its React shell, illustrated entry presentation, learning interactions, FSRS adapter, typing workflow, visual design system, and galaxy. The main adaptation seams are localization, bidirectional layout, taxonomy and content schema, incremental publication, and persistent learning identity.

## Runtime and screen ownership

The [package manifest](https://github.com/designfuchen/word-atlas/blob/e7b44629230a470e6b664826ced4af2c367b44c2/package.json) specifies React 19.2, TypeScript 5.9, Vite 6.4, ts-fsrs 5.4.2, lucide-react, and Fraunces. The lockfile should be retained when establishing a runnable fork; these are manifest ranges rather than a separately audited installed dependency inventory.

[`src/App.tsx`](https://github.com/designfuchen/word-atlas/blob/e7b44629230a470e6b664826ced4af2c367b44c2/src/App.tsx) owns the application boot state, shared atlas context, theme, navigation, word detail sheet, global search palette, onboarding, splash, ambience, and toasts. Its page switch is explicit:

| Screen | Source owner | Existing behavior |
| --- | --- | --- |
| Today | `src/pages/Today.tsx` | Default page, represented by `#/` in navigation. |
| Atlas | `src/pages/Atlas.tsx` | `#/atlas`; difficulty/topic/status filtering; virtual grid/list and galaxy views. |
| Learn | `src/pages/Learn.tsx` | Focused session layout; shell navigation hidden; introduction, recall, feedback, summary. |
| Practice | `src/pages/Practice.tsx` | Dedicated practice destination linked from the shell. |
| Me | `src/pages/Me.tsx` | Local learner settings/progress destination. |
| About | `src/pages/About.tsx` | Open-source/about destination. |

The complete source tree and the inspected App route switch contain no Reading Room, story reader, or story content model. The live inspection also identified `#/paraphrase`, `#/confuse`, `#/read?tab=books`, and chapter routes under `#/books/<id>`; none appear in the public App page switch or source component tree. These hosted features require new code and content rather than enabling existing source components. The live inspection report is the source for their detailed behavior. Full-sentence dictation is a different case: the existing `TypingRound` type already includes `word`, `sentence`, and `dictation`, so it belongs with the reusable Practice workflow.

`src/lib/router.ts` owns routing; App uses `useLocation`, `go`, `openWord`, and `closeWord`. Word detail is a shared overlay over the current page, with previous/next entry controls and ArrowLeft/ArrowRight navigation. Preserve back/forward and deep-link semantics while making directional controls intentional under RTL.

## Data flow and schema

[`src/atlas/data.ts`](https://github.com/designfuchen/word-atlas/blob/e7b44629230a470e6b664826ced4af2c367b44c2/src/atlas/data.ts) fetches `atlas/index.json` relative to Vite's base path, builds a compact `WordRef` list and ID map, and loads complete entries lazily. Entry JSON is cached in memory, and simultaneous requests for the same chunk share one promise. Failed chunk promises are removed so a subsequent action can retry. There is no explicit request timeout or retry policy in the inspected loader.

[`src/atlas/types.ts`](https://github.com/designfuchen/word-atlas/blob/e7b44629230a470e6b664826ced4af2c367b44c2/src/atlas/types.ts) defines:

- Compact index rows as `[id, word, zh, ipa, cefr, topic, media]`.
- Entry definitions and example translations with `zh` fields.
- One string `topic` per entry and one numeric topic index per compact word reference.
- CEFR as the difficulty axis.
- A media bitmask for illustration, UK word audio, US word audio, first-example audio, and second-example audio.
- A dataset ID, ordered words, lookup map, entry loading, image lookup, and audio lookup behind the shared Atlas interface.

The adapter boundary is useful: evolve the canonical content model without forcing every UI component to read the contributor format directly. Replace language-specific fields deliberately, represent multi-category membership and stable meaning identity, and introduce source/reviewer/release metadata. Avoid treating changing array order or display numbers as persistent identity.

A legacy private catalog is loaded only in development through `.local/catalog.json`. The [Vite configuration](https://github.com/designfuchen/word-atlas/blob/e7b44629230a470e6b664826ced4af2c367b44c2/vite.config.ts) implements local catalog/media middleware. A Persian public project should omit this upstream-private content path unless a concrete local-authoring requirement warrants a separately scoped implementation.

## Presentation and localization

[`src/ui/EntryView.tsx`](https://github.com/designfuchen/word-atlas/blob/e7b44629230a470e6b664826ced4af2c367b44c2/src/ui/EntryView.tsx) is reused in detail, introduction, and reveal modes. It renders an illustration, CEFR/topic/status chips, specimen number, English headword, UK/US pronunciation, definitions, examples, collocations, word-family links, synonyms/antonyms, usage tips, notes, bookmarks, sharing, and memory status.

Localization is broader than replacing definitions:

- Navigation, buttons, prompts, error states, aria labels, interval strings, and status labels are hardcoded Chinese.
- Definitions, examples, and collocation parsing assume Chinese-specific names and string conventions.
- The second example is labeled IELTS context in the component. Professional examples need explicit context metadata instead of an index-based label.
- Quiz option language is hardcoded to `zh` or `en`.
- Brand text, splash glyphs, share card rendering, empty-state art, metadata, and installable-app names need a Persian adaptation.

[`src/styles/app.css`](https://github.com/designfuchen/word-atlas/blob/e7b44629230a470e6b664826ced4af2c367b44c2/src/styles/app.css) contains the design system: warm ivory `#f6f1e7`, dark navy `#0d1120`, terra/ochre/sage/sky accents, paper grain, rounded cards and pill controls, Fraunces English display typography, shadows, and transitions. The desktop top navigation begins at 760px, while smaller widths use a fixed bottom tab bar. Reduced-motion rules exist.

The stylesheet has numerous physical left/right declarations and no explicit RTL handling found in the inspected file. Virtual grid item transforms also position columns from the left in Atlas.tsx. Replace physical positioning where appropriate with logical layout, preserve LTR English/IPA/typing regions, and verify Persian text direction in overlay controls, chips, search results, pronunciation labels, numbers, and shared images. The English Fraunces treatment can remain while adding a separately licensed Persian font.

## Atlas browsing and galaxy

[`src/pages/Atlas.tsx`](https://github.com/designfuchen/word-atlas/blob/e7b44629230a470e6b664826ced4af2c367b44c2/src/pages/Atlas.tsx) owns search, filters, view switching, empty results, and virtualization. The difficulty and topic filters are flat chip rows. Status choices are all, new, learning, mastered, and bookmarked. View preference is persisted in localStorage. Topic, level, and view are reflected in route updates.

Reuse its virtualization, visual cards, and view-switching structure. A comprehensive taxonomy should adapt the flat topic row into family/subcategory navigation while retaining the same visual vocabulary. Galaxy ownership is in `src/galaxy/Galaxy.tsx`, with an engine, layout, and share module. Those files were enumerated but their implementation was not deeply inspected here; scale, keyboard fallback, and category layout require focused implementation checks.

## Learning and persistent progress

[`src/pages/Learn.tsx`](https://github.com/designfuchen/word-atlas/blob/e7b44629230a470e6b664826ced4af2c367b44c2/src/pages/Learn.tsx) renders four recall kinds: meaning choice, illustrated cloze, listening choice, and spelling. Introduction cards use EntryView. The session includes a progress indicator, keyboard shortcuts, hints, verdict/reveal feedback, and a summary with a mini galaxy, first-answer accuracy, reviewed/new counts, mistakes, retry action, and share card action. Typing practice and FSRS are distinct state streams.

[`src/store/store.ts`](https://github.com/designfuchen/word-atlas/blob/e7b44629230a470e6b664826ced4af2c367b44c2/src/store/store.ts) owns a small `useSyncExternalStore` state store. Settings and progress persist to localStorage with 250ms debounced writes, flush on page hide, and cross-tab storage-event adoption. Save failures are surfaced as state. Progress version 2 contains cards keyed by entry ID, bookmarks, day statistics, typing rounds, active session, and recent mistakes. Settings include accent, autoplay, new-word limit, retention, theme, sound, spelling, starting level, ambience/volume, and splash.

Backups identify the app, version, and dataset. Import validates and sanitizes data, requires the matching dataset, removes an active session, restores settings, and writes immediately. The active session tracks already graded IDs and pending feedback so reloads can avoid counting the same answer twice. A growing corpus needs stable dataset identity plus release metadata; changing the dataset ID for every content publication would create apparently empty learning histories.

[`src/store/srs.ts`](https://github.com/designfuchen/word-atlas/blob/e7b44629230a470e6b664826ced4af2c367b44c2/src/store/srs.ts) wraps ts-fsrs with serialized numeric timestamps and intervals. The default requested retention is 0.9; learning steps are 1m/10m and relearning is 10m. Upstream's UI mastery threshold is review state plus stability of at least 21 days. Preserve scheduler semantics initially; translating the UI does not require changing the algorithm. Meaning-level learning should introduce stable learnable-item IDs and tested backup migration rather than silently reinterpreting existing entry keys.

## Content production and gradual publication

The [pipeline documentation](https://github.com/designfuchen/word-atlas/blob/e7b44629230a470e6b664826ced4af2c367b44c2/docs/pipeline.md) describes headwords, generated text, generated illustrations, UK/US word audio, sentence audio, compilation, and validation. Intermediate artifacts live under ignored `.local/forge/`; credentials are read from environment variables or external locations. Structural checks do not establish semantic correctness, and the content is not fully manually reviewed.

[`scripts/atlas/build_atlas.py`](https://github.com/designfuchen/word-atlas/blob/e7b44629230a470e6b664826ced4af2c367b44c2/scripts/atlas/build_atlas.py) is the principal compiler. It hardcodes 19 Chinese-labeled topics, cleans Chinese fields, limits definitions to three senses and examples to two, generates slug IDs, sorts by CEFR plus deterministic ID hash, emits positional chunks of 100 entries, writes media bitmasks, and produces JSON/CSV exports. This compiler is a substantial adaptation seam for the full category map, reviewed publication state, stable sense IDs, and release artifacts.

Keep content generation an optional maintainer tool. Running the app or contributing a text correction should not require provider credentials or a paid model. Source licensing and review status should travel with new assets and text. Generation jobs should share a total outbound concurrency cap rather than starting independent groups of eight workers concurrently.

## Offline behavior and release risk

[`public/sw.js`](https://github.com/designfuchen/word-atlas/blob/e7b44629230a470e6b664826ced4af2c367b44c2/public/sw.js) uses a fixed `atlas-v1` cache namespace. Navigations and paths ending in `/index.json` are network-first; most other same-origin GETs are cache-first. Byte-range requests are skipped. The illustration/audio cache is trimmed to 1,500 requests. This supports revisiting cached material; it does not pre-download the whole library or guarantee that every learned entry's media remains offline.

Gradual publication exposes a compatibility risk: the network-first index can change entry order while old cache-first positional shards remain cached. Adding earlier-sorted entries can shift the shard containing a word. Use immutable release manifests and content-hashed or release-versioned shard/media URLs; activate a consistent release atomically. Preserve canonical learning IDs across releases, and test offline upgrades, rollback, quota errors, and removal/deprecation of content. Cache an explicitly chosen content pack before labeling it fully available offline.

## Tests and deployment

Current commands are `npm test`, `npm run check:atlas`, and `npm run build`; `npm run build:atlas` compiles content. Unit test files enumerated are `src/lib/text.test.ts`, `src/lib/typing.test.ts`, `src/store/srs.test.ts`, and `src/store/store.test.ts`. Playwright is a development dependency and screenshot/demo scripts exist. Existing test coverage was not executed or audited for completeness in this read-only source inspection.

The [deployment guide](https://github.com/designfuchen/word-atlas/blob/e7b44629230a470e6b664826ced4af2c367b44c2/docs/deployment.md) specifies static `dist/` hosting with an optional `ATLAS_BASE=/words/` subpath. GitHub Pages, Nginx, and other static hosts are supported deployment directions. Media accounts for several hundred MB according to that guide, so contributors should receive a small fixture/content pack rather than being forced to clone the entire library. A self-hostable static build preserves the open-source model without requiring an account server.

## Licensing

The [content license](https://github.com/designfuchen/word-atlas/blob/e7b44629230a470e6b664826ced4af2c367b44c2/CONTENT_LICENSE.md) states that source code and UI design are MIT, while designated vocabulary text, illustrations, brand images, and word/example recordings are offered under CC BY 4.0 to the extent of rights the maintainers can grant. Attribution is `Word Atlas contributors — CC BY 4.0`, accompanied by a license link and modification notice. The recording license concerns finished audio files, not underlying voice models or identities. Dependencies and fonts retain their own licenses.

Retain upstream notices, distinguish new project identity from upstream endorsement, and maintain per-asset provenance. The explicit content list does not name every UI sound/music file; inspect those assets' provenance before redistributing or assigning a blanket new content license.

## Safe implementation sequence

1. Establish a pinned, runnable upstream-derived baseline and screen comparison fixtures.
2. Extract translation strings and add Persian typography and direction handling while retaining design tokens and component layout.
3. Introduce stable meaning/item identity, the full taxonomy, reviewed content schema, and tested local-progress migrations behind the Atlas adapter.
4. Replace positional mutable publication with immutable release artifacts and consistent offline upgrades.
5. Adapt browsing, learning, typing, galaxy, backup, and sharing to the new model.
6. Recreate hosted-only features such as Reading Room from observed behavior using newly licensed content.
7. Add content release tooling, contributor checks, provenance/review gates, fixture-only developer mode, and static hosting documentation.

Additional targeted inspection is still needed before coding for the precise session-builder distractor logic, galaxy engine behavior, reading implementation design, complete share-image font handling, installability behavior, and upstream CI details. These are implementation checks, not reasons to replace the upstream application wholesale.
