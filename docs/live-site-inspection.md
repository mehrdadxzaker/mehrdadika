# Word Atlas live website inspection

Inspected October 26, 2026 at [the live Word Atlas website](https://0xlei.tech/words/). This report records observed interface behavior. The accompanying [source map](upstream-source-map.md) describes the separately versioned public repository at commit `e7b44629230a470e6b664826ced4af2c367b44c2`.

The live website is a complete learning application with five primary destinations: Today, Atlas, Reading Room, Practice, and Me. A Persian adaptation that closely follows the hosted product needs all five, including the reading and specialist exercise features absent from the public source.

## Inspection conditions

- Used a dedicated browser tab and a new local onboarding flow; selected B1 and ten new words per day without an exam date.
- Inspected the natural narrow viewport, approximately 508 × 700, an explicit desktop viewport of 1440 × 1000, and the card/grid at 390 × 844. Viewport overrides are responsive references, not physical-device tests. The desktop and phone card checkpoints reported document widths equal to viewport widths, with no document-level horizontal overflow at those checkpoints.
- Entered sample public search terms, opened cards, changed theme, answered one reading question and one vocabulary question, and paused the resulting local study session.
- Captured local screenshots under `docs/evidence/`. These references are excluded from version control and are not assets for the Persian application.
- No account creation, external sharing, payment, uploads, destructive reset, or public changes were performed.

## Screen and interaction inventory

| Surface | Observed live behavior | Persian implementation consequence |
| --- | --- | --- |
| Animated introduction | Dark, star-like particle branding; skip control; entry into the application | Recreate the motion language with an original Persian project identity, a visible skip button, and reduced-motion support. |
| Feature guide | Four steps covering illustrated words, active recall, galaxy progress, and reading | Preserve a short, skippable guide. Include the Reading Room in the promise. |
| Starting point | A1–C2 choices, optional exam date, daily target choices and custom quantity; local-progress explanation | Translate the flow and retain its simplicity. Add an optional published-category choice without creating a long onboarding questionnaire. |
| Shared shell | Brand, search, ambience, theme; five navigation destinations. Desktop uses a horizontal header; narrow layout uses a bottom bar | Preserve the same hierarchy, recognizable icons, and compact controls with deliberate RTL adaptation. |
| Today | Greeting/date, exam-plan prompt, large illustrated study/resume card, daily word, daily reading, weekly activity, level route, galaxy preview, topic shortcuts | Keep the illustrated learning dashboard as the main entry point. All counts and recommendations must follow available Persian releases. |
| Atlas grid | Illustrated cards; difficulty, topic and learning-state filters; search; grid/list/galaxy selector | Retain the grid and controls. Replace the fixed topic list with the expanded domain catalog and a nested category selector using the same visual style; see the current implementation plan for its category count. |
| Combined filtering | B1 plus Health returned a filtered collection and reflected the selections in the URL | Support shareable filter state and back/forward navigation for level, domain, subcategory, status, and view. |
| Atlas list | Compact word/translation rows with pronunciation controls | Keep as a fast alternative to the image grid. |
| Word detail | Responsive overlay with illustration, illustration-style toggle, favorite, share-card generation, level/topic badges, English headword, IPA and UK/US controls, multiple meanings, examples, collocations, forms, synonyms/antonyms, usage note, previous/next navigation | Preserve the layout and information order. Add accurate Persian content and sense-specific context without turning the card into a different product. |
| Inline lookup | Clicking a word in an example opened a small definition/pronunciation panel and a route to its full card | Reuse this interaction in examples and readers. Lookup should not discard the reader or current session. |
| Pronunciation | Clicking a UK pronunciation control changed it to a stop state | Preserve playback feedback and accent selection. Audible accuracy was not assessed. |
| Share card | The word-card control produced a rendered image preview with save and share options | Implement local image generation with Persian font shaping and attribution. No external share was submitted during inspection. |
| Galaxy | Rendered star field; category labels, learned-state legend, zoom/reset controls, topic constellation panel, counters and share control | Keep this central visual feature. Use stable coordinates and a readable list/grid alternative. |
| Short reading | Level-filtered passage collection, target words with learning state, optional bilingual paragraphs, font-size controls, inline lookup, three true/false/not-given items, next passage | Build a new reading module because it is absent from the pinned public source. Short reading is a required parity feature. |
| Reading feedback | Toggling translation displayed aligned Chinese paragraphs; choosing a correct answer locked that question and displayed an explanation | Translate aligned paragraphs and explanations into Persian. Keep comprehension history separate from FSRS word memory. |
| Books | Bookshelf, a published book, upcoming titles, illustrated introduction, chapter constellation and chapter progress | Reproduce the shelf and chapter navigation with original or rights-cleared works; observed availability does not grant content redistribution rights. |
| Chapter reader | Illustrated heading, bilingual text, inline word lookup, per-paragraph narration entry, bookmarks, settings, next chapter and target-word links | Use stable chapter/paragraph/sentence identities and preserve reading position. |
| Listening mode | Illustrated sentence presentation, previous/play/next controls, sentence position, dynamic-illustration toggle, switch to reading; chapter narration also exposes speed control | Include a dedicated listening presentation. Timing/alignment must be validated before highlighting individual words. |
| Practice | Word typing, sentence typing and sentence dictation; recent/mistake/favorite/learning-route scopes; separately recorded practice results | Retain the existing modes and separation from spaced review. A sample round was opened; no complete typing score was verified. |
| Paraphrases | Level-based map, continuing level, question progress, original sentence, numbered possible equivalent expressions, independent completion/star counters | Recreate as an additional practice mode; it has no route in the pinned public app. |
| Confusable words | Searchable/level-filtered pairs, side-by-side distinctions and examples, pronunciation, memory tip, three-item cloze quiz | Recreate using reviewed Persian explanations and source-controlled comparison records. |
| Me | Activity statistics, 20-week heatmap, seven-day review forecast, daily target, exam plan, starting level, study route, retention, accent, appearance, fonts, illustration preference, playback and sound settings | Preserve recognizable controls. Optional appearance variations should only be shown when implemented. |
| Data controls | Visible local-only progress notice, transfer progress, export, import, clear records | Guarantee validated export/import and disclose local storage. Transfer and destructive reset were not exercised. |
| Global search | Header opens a focused overlay, initial suggestions, typed English query returns a matching entry | Add Persian matching/aliases while preserving quick keyboard-driven lookup. |
| Ambience | Several named music/environment tracks, quiet option, volume, explanation of ducking during pronunciation | Preserve optional ambience using audio with verified redistribution rights. Selected quiet at the end of the sample inspection. |

The site displayed 7,298 vocabulary entries, 19 topic constellations, 732 short passages, 400 paraphrase levels, and 226 confusable groups. These are observed interface counts on the inspection date, not audited content inventories or target quantities for the Persian project.

## Visual characteristics to preserve

- A useful application appears immediately after onboarding; the main experience is not preceded by a separate marketing flow.
- Light mode uses warm paper tones; dark mode uses deep navy with restrained warm accents and subtle stars/grain.
- Illustrations dominate vocabulary and study cards. Rounded rectangles, pill controls, ample spacing, and editorial headings create a consistent atmosphere.
- The large daily-study illustration is a major part of the dashboard, with a clear primary study/resume action.
- Desktop spreads content across a bounded central column and uses top navigation. Narrow screens stack content and use a fixed five-item bottom bar.
- Desktop word detail uses a two-column sheet with illustration on one side and definitions/examples on the other. Narrow word detail stacks the illustration above the text. Focused learning reuses the content presentation and hides general navigation.
- The galaxy and book chapter map make progress explorable; straightforward lists remain essential alternatives.

## Public source and live product differences

The pinned repository supplies the app shell, Today, illustrated Atlas, grid/list/galaxy, word detail, FSRS learning, typing/dictation, Me, and About. The source map records Chinese-specific assumptions and the content-cache compatibility issue that matters for gradual publication.

The live Reading Room, bookshelf, chapter reader/listening mode, paraphrase route, and confusable-word route have no corresponding route/components in the inspected source tree. They need new implementations based on observed interactions and separately licensed content. Additional live refinements such as alternate image styles, appearance presets, and progress transfer need targeted verification when implementing them; the source inspection did not certify every setting.

## Limits of this inspection

This was a representative product inspection, not an exhaustive quality or security audit. It did not establish long-term scheduling behavior, every question type, session completion summaries, data-transfer correctness, restore/reset behavior, full offline availability, PWA installation, all reader settings, every theme, all supported browsers, or media accuracy. Future implementation acceptance checks cover these behaviors. No claim of exact hosted-source parity is made.

At the galaxy checkpoint, the browser's captured warning/error log was empty. That single checkpoint does not certify every visited screen's console health.

## Local reference images

These screenshots document the reference product and are not Persian mockups. Some intermediate captures include the site's route transitions; stable desktop and final narrow captures should be preferred for visual comparison.

- `01-today.png`, `02-atlas-grid.png`, `03-word-card.png`, `04-share-card.png`
- `05-atlas-list.png`, `06-galaxy.png`, `07-reading-library.png`, `08-short-reading.png`
- `09-book-reader.png`, `10-practice.png`, `11-paraphrase.png`, `12-confusable-words.png`
- `13-progress-light.png`, `14-learn-introduction.png`, `15-recall.png`, `16-answer-feedback.png`, `17-global-search.png`
- `18-desktop-today.png`, `19-desktop-galaxy.png`, `20-desktop-atlas-grid.png`, `21-desktop-word-card.png`, `22-phone-word-card.png`, `23-phone-atlas-grid.png`

The [local evidence index](evidence/index.json) records file hashes and image dimensions. Use `20-desktop-atlas-grid.png`, `21-desktop-word-card.png` and `22-phone-word-card.png` as the clearest stable layout references. Local accessibility snapshots are supplementary observations, not the production dataset.

## Sources

- [Live website](https://0xlei.tech/words/), inspected through the browser on October 26, 2026.
- [Repository README at the inspected revision](https://github.com/designfuchen/word-atlas/blob/e7b44629230a470e6b664826ced4af2c367b44c2/README.en.md), including the explicit distinction between repository and hosted versions.
- [Pinned source map](upstream-source-map.md), including individual source and license links.
