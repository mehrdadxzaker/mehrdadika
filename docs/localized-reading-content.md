# Localized reading and practice content

The Portuguese (`pt-BR`) and Latin American Spanish (`es-419`) editions use the same reader, book navigation, listening controls, comprehension exercises, paraphrase questions and confusable-word comparisons as the Persian edition. They preserve the published English learning text, answer keys and stable content identities.

Both translated starter catalogs contain three short passages, one original book with three chapters, two paraphrase levels and three confusable-word groups. All 30 published reading sentences and all exercise explanations have native translations. These translations are AI-assisted editorial previews; no independent native-language or specialist approval is claimed.

## Authoring and publication

Author native material in `content/locales/readings.pt-BR.json` or `content/locales/readings.es-419.json`. Each translated sentence records its stable ID and exact English source. Comprehension explanations bind to the original statement and answer; practice explanations bind to the English question, option order and answer key. Native metadata such as titles, summaries and usage distinctions stays in the locale overlay.

After building the English content release, generate the locale snapshots:

```sh
node scripts/build-reading-locales.mjs
node scripts/build-reading-locales.mjs --check
```

The compiler follows `public/content/current.json`, verifies the manifest, index and entry-shard hashes, and reads only its published reading catalog. It excludes unavailable English material, draft or withdrawn translations, stale source bindings and unsupported author-only fields. Incomplete or stale passages/exercise sets are withheld as coherent items. A book can publish its translated chapters gradually.

The generated snapshots are `src/i18n/published/readings.pt-BR.json` and `src/i18n/published/readings.es-419.json`. Do not edit them directly. The client adapter imports these snapshots, never the raw authoring overlays, and checks their English bindings against the active published catalog before exposing content.

Translation publication cannot change English sentence IDs, question IDs, options, answer keys or chapter numbers. Native copy does not become an additional English meaning or a new voice recording. The original text, translation and optional English device narration retain the project's content license and honest provenance.

## Reader state and compatibility

The Persian reader keeps its existing `mehrdadika:reading:v1` key. Portuguese and Spanish use separate reader-state namespaces. Bookmarks, paragraph/sentence resume anchors, comprehension answers and practice results therefore remain separate across editions while retaining the same underlying content IDs. The active edition's reader state continues to participate in its normal backup/restore flow.

The runtime exports `localizeReadingCatalog` (also available as `adaptReadingCatalog`) from `src/i18n/reading.ts`, and `setReadingLocale` from `src/reading/state.ts`. The application switches reader locale alongside its learning dataset before rendering an edition.

Focused regression checks cover exact English identities and grading, native translation coverage, drafts and unknown metadata, stale sentence/answer/option bindings, generated snapshot integrity and independent reader-state namespaces. Automated checks do not establish linguistic or professional qualification.
