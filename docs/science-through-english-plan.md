# Science through English course plan

Proposed addition to Mehrdadika, October 26, 2026.

Add **Science through English 1: Water and Weather**, an illustrated course with Persian (`fa`), Brazilian Portuguese (`pt-BR`) and Latin American Spanish (`es-419`) support. English learning is the primary goal: learners use English to describe observations, compare properties, explain causes and sequence a process. Science supplies a coherent reason to read, listen and write.

The first course contains eight short lessons. It extends the existing application, its five main destinations and its local progress model. This plan has been implemented as an editorial preview. See the [course guide](science-course.md) and [verification record](verification.md) for delivered behavior and checks.

## Learners and scope

Use these defaults for the first course:

| Decision | First course |
| --- | --- |
| Learner | Teen and adult English learners interested in accessible school science |
| English | Approximately A2, with supported tasks approaching B1; an editorial target for review |
| Subject depth | Introductory school science, described separately from English proficiency |
| Structure | Eight ordered, self-paced lessons of approximately 8–12 minutes each |
| Support | The same complete course in all three existing support-language editions |
| Presentation | Existing illustrated cards, reader, word sheets, typography, spacing, colors and motion |
| Delivery | Static hosting, packaged content, local progress and portable backups |

Course completion describes completion of this material. It does not award a school qualification or establish a CEFR level. School year and national curriculum alignment can be added as explicit metadata after a particular curriculum is selected.

The educational approach draws on content and language integrated learning. The British Council describes using subjects and visual support to develop language in context, including explicit attention to the language needed for the subject. Mehrdadika will apply this approach with English communication as the leading product goal. [British Council overview](https://www.teachingenglish.org.uk/professional-development/teachers/teaching-knowledge-database/c/clil)

## Course sequence

Each lesson exposes two concrete goals: **Understand** a science idea and **Use English to** communicate about it. New language is reused in later lessons.

| Lesson | Science focus | English goal and reusable language | Learner output |
| --- | --- | --- | --- |
| 1. Water around us | Identify water in familiar places | Describe location using “There is…”, “There are…”, “in”, “on” and “under” | Describe an illustrated scene in two sentences |
| 2. Solid liquid and gas | Distinguish states through familiar water examples | Describe and compare properties using “is”, “can” and “unlike” | Compare two examples with a sentence frame |
| 3. Heating and cooling | Recognize melting and freezing | Describe change with “When…”, the present simple and change verbs | Explain what happens in two pictured situations |
| 4. Where puddles go | Introduce evaporation | Give a cause using “because” | Explain a drying puddle in two or three sentences |
| 5. Drops on a cold glass | Introduce condensation | Link observations and explanations using “but” and “because” | Describe the glass and explain the droplets |
| 6. Clouds and rain | Connect clouds and precipitation | Express a cause and result using “so” | Explain a simple illustrated sequence |
| 7. Following the water | Read a simplified water-cycle diagram | Sequence with “first”, “then”, “after that” and “finally” | Write a short process description |
| 8. Explain a new scene | Apply earlier ideas to an unfamiliar diagram | Combine description, cause and sequence; revise for clarity | Write and revise a four-to-six-sentence explanation |

Science references should include the [USGS water-cycle overview](https://www.usgs.gov/water-science-school/water-cycle), [evaporation explanation](https://www.usgs.gov/water-science-school/science/evaporation-and-water-cycle) and [condensation explanation](https://www.usgs.gov/water-science-school/science/condensation-and-water-cycle). A science reviewer checks the actual authored explanations and diagrams. In particular, the course must distinguish invisible water vapor from visible droplets, avoid implying evaporation requires boiling, and explain that droplets on a cold glass come from moisture in surrounding air. The water-cycle diagram must identify its simplifications.

### Content budget

Deliver eight English passages of roughly 100–160 words, eight main illustrations or diagrams, up to 24 distinct target vocabulary senses, and the eight language focuses above. Target senses recur across lessons; existing English lexical and sense IDs are reused whenever their meaning matches. Other unfamiliar words may have a short contextual gloss without becoming required new review items.

Inventory those senses against the published atlas first. Add missing canonical entries and senses to `content/entries.json`, with Persian support, Portuguese and Spanish vocabulary overlays, appropriate illustrations and honest audio capabilities. Course target words must resolve to usable word sheets in each edition. Include this vocabulary work in the course content budget and review; maintain one dictionary identity for each meaning.

Each lesson has four closed practice items and one short production task: 32 closed items and eight production prompts across the course. The last lesson uses its four items as a mixed recap. The final writing task is longer than the earlier tasks. Each production prompt needs at least two acceptable example responses and a short self-review checklist.

The three support editions cover every published lesson: titles, goals, instructions, optional sentence translations, contextual glosses, help, feedback, writing scaffolds and accessibility descriptions. English source sentences, exercise options, answer keys and model English responses remain shared.

## Lesson experience

Use one consistent sequence, with readable steps that can be resumed:

1. **Look and wonder.** Show the main illustration, one English question and the paired goals. Preview two or three useful words.
2. **Read and listen.** Show the short English explanation with optional English device narration, inline lookup and sentence-level translation on demand.
3. **Notice useful English.** Highlight the lesson's sentence pattern and its use in the passage. Offer a word bank or sentence frame.
4. **Check understanding.** Present the four practice items with immediate explanations. At least two must require interpreting a sentence or relationship, rather than matching an isolated term.
5. **Explain it.** Let the learner write a short English response, compare example responses, check their work and revise. An optional read-aloud prompt supports speaking practice.
6. **Keep useful language.** Offer a normal vocabulary learning or review session for the target words. Show a brief lesson summary and the next lesson.

The British Council's [CLIL lesson framework](https://www.teachingenglish.org.uk/professional-development/teachers/knowing-subject/clil-lesson-framework) informs the use of illustrations, diagrams, language functions and supported output. The exact steps and content budget above are product choices for this course.

For the first release, use a small set of activity types: multiple choice, cloze with a word bank, selecting a diagram label, and sequencing with accessible move controls. Closed items have explicit accepted answers and explanations. Open writing is saved and self-reviewed; it is not graded by exact-string matching. Existing true/false/not-given reading activities remain available where appropriate.

Optional device narration uses the app's current device-voice presentation. Every lesson remains completable through text. An unavailable voice must not produce an incorrect answer or block completion. A scored listening-only item requires a separately declared, packaged and checked recording; it is outside the required first-course inventory.

## Language support and feedback

English is the main reading, listening, exercise and output language. The chosen support language supplies interface guidance and optional help. Early lessons expose sentence frames prominently; later lessons offer them on demand. Learners can always reopen help, and their preferences persist within their edition.

Persian uses the existing RTL shell with explicit LTR English passages, answer inputs and diagram labels. Portuguese and Spanish use their current LTR shells. Preserve diagram geometry and scientific arrows across editions; translate the surrounding legend and help without automatically mirroring the diagram. Use Brazilian Portuguese and Latin American Spanish terminology consistently.

Separate three records in feedback:

| Record | What it represents |
| --- | --- |
| English practice | A response to a particular language activity, with first attempt and help used |
| Science understanding | A response to a specific conceptual question |
| Lesson completion | Finishing required steps, including attempting and reviewing the written response |

A missed English question does not by itself establish a science misconception. Every item identifies what it checks. When the cause is unclear, feedback explains the sentence and the science, and leaves the cause unclassified. A native-language conceptual check may be offered as help; its result stays separate from English performance.

The writing checklist asks whether the response communicates the science idea accurately, uses the target expression, makes its meaning understandable and connects ideas clearly. Example responses demonstrate more than one acceptable wording. Completion records participation and revision; it does not certify the quality of an unassessed explanation.

## Placement and visual continuity

Keep the five main destinations: Today, Atlas, Library, Practice and Me.

| Destination | Course addition |
| --- | --- |
| Today | A secondary course card showing the next lesson or “Continue”; retain the main daily English review entry |
| Atlas | Course vocabulary opens ordinary illustrated word sheets and links back to its lesson |
| Library | A Courses view alongside short readings and books, with one course cover, level, lesson count and progress |
| Practice | A compact entry to course language practice and previously difficult course items |
| Me | Course progress and local-data controls alongside existing English study records |

The course overview uses the existing panel and illustrated-cover treatment, with a clear ordered list of lessons. The lesson view follows the current reader's text width, type hierarchy and optional translation treatment. Vocabulary opens the existing sheet above the lesson and returns to the same position. Use the current primary button and feedback styles for progression.

Preserve the cream and dark surfaces, existing Persian and English fonts, rounded cards, restrained accents and reduced-motion behavior. Use original, coherent illustrations whose labels and causal arrows are reviewed for scientific accuracy. Reuse the current word galaxy for vocabulary progress; course completion does not create a second mastery constellation.

Cover loading, empty/unavailable content, missing audio, save failure, answer feedback, completion and older-release resume states in the first design. Provide text alternatives for diagrams, visible keyboard focus and button-based alternatives to dragging. Check mobile layouts with long translations and an open software keyboard.

Visual baselines are the existing Today view, desktop book reader and desktop/phone word sheets. Local reference captures are kept in the ignored `docs/evidence/app/` directory. The published source references are [Today](../src/pages/Today.tsx), [Reading](../src/pages/Reading.tsx) and [word detail](../src/ui/EntryView.tsx); fresh browser checks verify the implemented course.

## Content and application design

Add a small course layer alongside vocabulary and reading. Keep the vocabulary-specific `Entry` model intact. The current reading model offers useful presentation and lookup behavior, but its question types and embedded Persian fields do not represent the complete course contract.

### Proposed sources and ownership

| Area | Proposed files or existing integration point |
| --- | --- |
| English course | New `content/courses/science-water-weather.json` |
| Native support | New `content/locales/courses.science-water-weather.fa.json`, `.pt-BR.json` and `.es-419.json` |
| Model and validation | New `src/courses/types.ts` and `scripts/course-validation.mjs` |
| Release compilation | Extend [scripts/build-content.mjs](../scripts/build-content.mjs) and add a focused course compiler |
| Loading and support adaptation | New `src/courses/data.ts` and `src/courses/localize.ts`; extend [Atlas](../src/atlas/types.ts) with an optional course reference |
| Course views | New `src/pages/Course.tsx` and small components under `src/courses/`; reuse [reading helpers](../src/reading/shared.tsx), [inline lookup](../src/ui/InlineLookup.tsx), sheets and illustration components |
| Navigation | Extend [router](../src/lib/router.ts) and [App](../src/App.tsx); add entries in [Library](../src/pages/Reading.tsx), [Today](../src/pages/Today.tsx) and [Practice](../src/pages/Practice.tsx) |
| Course progress | New `src/courses/state.ts` and bounded state validation |
| Data controls | Extend [backup import and export and reset](../src/store/store.ts) and [offline manifest coverage](../src/atlas/offline.ts) |
| UI localization | Add course messages through the existing [message system](../src/i18n/messages.ts) and locale catalogs |

These new paths describe the intended implementation. Existing source links identify current owners, not completed course support.

### Course contract

Define a versioned catalog with stable course, lesson, text-block, diagram-label, activity and choice IDs. A course records its English level, subject depth, ordered lessons, publication state, provenance and review evidence. Each lesson records both learning goals, target sense references, English text, figure references, activities, accepted answers and production examples.

Native overlays supply support copy by stable IDs and bind to the exact English revision using content hashes. Include Persian in this contract alongside Portuguese and Spanish. An overlay cannot change English wording, answer IDs or diagram meaning. Publish an edition only when the complete lesson and its required help are valid; stale support withholds that lesson in that edition and presents an availability message.

Use the existing immutable content release as the single selection point. Add an optional course reference to its payload, with English course data and all three overlays in hashed `dataFiles`, and course media in the manifest's assets. Use a new release ID, write all artifacts before moving `current.json`, and retain supported older releases. A separate mutable course pointer would allow mismatched vocabulary, course and translations.

The course loader treats missing course references in older releases as normal. Existing vocabulary learning and reading remain usable. Load course data lazily when needed and keep it inside the existing offline installation mechanism.

### Progress and review

Store course state in a versioned namespace for the active dataset and support-language edition, consistent with the application's current separation between editions. Shared content IDs do not imply shared learner progress. Switch and flush course state alongside the vocabulary and reading edition before rendering the next locale.

Track lesson and step position, first attempts, help used, written drafts and revisions, and completion. Pin an active lesson to its manifest path and hash, course revision and support-overlay revision. Resume against that content. If it is unavailable, preserve completed records and the written draft, explain the interruption, and restart only work that can safely be reconstructed. Meaning-changing updates require explicit migration rules.

Course completion and course question answers do not update vocabulary FSRS. The “Review these words” action passes canonical sense IDs to the normal learning/review flow, where actual first attempts determine grades. Repeated course appearances use the same vocabulary cards. Sentence-pattern practice remains course practice in the first release. Preserve an already active vocabulary session when starting course-linked review; offer to resume it before starting another.

For a resumed older lesson, resolve review targets against that course's pinned vocabulary release and create the vocabulary session with the same manifest path and hash. Passing old IDs to the current atlas could silently omit withdrawn targets or use changed meanings. If the pinned content cannot be loaded, retain the lesson and show an availability message instead of substituting content.

Extend the existing version-2 backup envelope with optional versioned course-state data. Keep import of existing backups, reject mismatched dataset/edition ownership, and validate record counts and text lengths within the existing file-size bound. Export lesson drafts, completion and safe checkpoints; omit an in-flight answer transition unless its exact pinned content can be restored reliably. Importing an older backup without course data restores an empty course state rather than retaining unrelated records. Reset explicitly clears the active edition's course state as well as its existing learning state.

## Editorial and release requirements

Follow the existing [content contribution](contributing-content.md), [review digest](review-digests.md) and [localized reading](localized-reading-content.md) conventions for stable identity, rights, exact-source binding and honest review states.

The new course needs explicit science-review rules. Current specialist reading checks name medicine and engineering, and the existing Portuguese/Spanish reading-localization pipeline publishes unreviewed previews only. Course implementation must add its own reviewed-overlay path and qualified science review; it cannot inherit a stable-review guarantee from those existing paths.

Keep module review status distinct from the atlas release channel. A course shown as reviewed requires valid approval of its English text, science and diagrams, and the selected native overlay, even when the surrounding vocabulary release is a preview. Course approval does not promote unrelated atlas content. Draft and withdrawn records remain absent from learner course artifacts.

Before stable publication, obtain actual review of the exact revision by an English-language teaching editor, an appropriately qualified science reviewer, and a native-language reviewer for each support edition. Record reviewer identity, scope and digest; a changed source or translation invalidates the relevant approval. Until then, release eligible content only as a clearly identified editorial preview.

Course text and artwork need explicit provenance, compatible rights, credits, and accurate AI-assistance records. Referencing a source for scientific checking does not grant rights to all of its media. Device narration retains its existing synthesized-voice label.

## Delivery sequence

| Milestone | Work | Exit condition |
| --- | --- | --- |
| 1. Complete one sample lesson | Author lesson 4, “Where puddles go,” in English with all three support overlays; draft its figure, four items, writing prompt and examples | English and science goals are explicit; content, translation coverage and visual treatment can be reviewed as one complete lesson |
| 2. Build the course foundation | Implement schema, validation, immutable release integration, support adaptation, routes and course state | The sample lesson loads in all three editions; invalid IDs, stale overlays and unavailable content fail safely |
| 3. Complete the learner flow | Build Library overview, lesson runner, lookup return, feedback, writing revision, Today continuation and vocabulary-review handoff | A learner can finish and resume the sample lesson in each edition without changing vocabulary mastery through course completion |
| 4. Author the full course | Produce the other seven lessons and all native support; complete illustrations and planned practice inventory | Eight coherent lessons, 32 closed items, eight production prompts and complete required support are present with provenance and editorial status |
| 5. Finish compatibility and release checks | Complete backup/reset, older-release behavior, offline packaging, accessibility and desktop/mobile regression checks | Acceptance checks below pass for the declared preview or reviewed scope |
| 6. Run a small learner pilot | Observe a few intended learners in each support language using the course; compare initial and later English explanations | Document usability issues, science errors, help needs and English-output quality; resolve material problems before expanding the course catalog |

Milestones 2 and 3 establish the complete sample lesson before bulk content production. Start the course overview with lesson 1 in its intended syllabus position; the lesson-4 sample is a development slice. Release notes identify which lessons and editions are actually available. Publish all eight lessons with complete support before describing the starter course as complete.

## Acceptance checks

### English and content

- Every lesson has an English communication goal, contextual target language, four closed items and an English production prompt. At least two closed items per lesson check sentence meaning or relationships.
- The authored inventory matches the declared course metadata. All lexical/sense, figure, lesson, choice and answer references resolve against the selected release.
- Every edition uses identical English source text, stable identities and answer keys. Required native support is complete and matches its English revision.
- Science review checks the explanations, illustrations, distractors and example responses; language review checks level, naturalness and scaffolding. Review status accurately describes the actual review performed.
- Production tasks accept revision and comparison with alternative model responses. Help use and retries are visible separately from first-attempt results.

### State and compatibility

- Refresh during reading, an answer-feedback screen and writing revision; restore the correct step without lost drafts or duplicate attempts.
- Switch between Persian, Portuguese and Spanish; each edition restores its own course progress and the correct support text.
- Completing a lesson leaves FSRS unchanged. An explicit course-linked vocabulary review updates the canonical card once per first attempt, using the existing grading rules.
- Import an existing v2 backup, export and restore new course state, reject a mismatched edition, and verify reset and save-failure behavior. Validate oversized or malformed fields without partially overwriting valid learning state.
- Resume an older supported course release, including its vocabulary-review handoff after a target changes or is withdrawn in the current release. Test unavailable pinned content and confirm an atlas with no course reference still works.
- Changing an English block, answer or diagram binding invalidates stale support and relevant review evidence. Drafts and unqualified stable records are withheld.

### Interface and delivery

- Complete the sample lesson and one longer final lesson in all three editions on desktop and phone. Check light/dark themes, long native strings, keyboard focus, text zoom and software-keyboard layout.
- Persian UI stays RTL while English passages, inputs, units and diagram labels remain correctly ordered. Scientific diagram geometry is consistent across editions.
- Lookup opens and closes without losing the lesson position. Diagram tasks and ordering tasks work entirely by keyboard with meaningful text alternatives.
- Install one production offline pack, restart offline, and open the course in each edition. Course text, overlays, figures and required assets must be available from that installed pack. Missing device voices use the text path.
- Existing vocabulary sessions, reading/books, practice, locale routes and backup flows retain their behavior. No provider account is needed for course study.

After implementation, run `npm test`, `npm run check:content` and `npm run build`, extending their existing suites with focused course schema, release, state and locale regressions. Verify the browser flows above using one local server and mocked network dependencies in routine tests. Reuse the existing three-worker offline queue; keep other outbound HTTP work at or below eight concurrent requests, with explicit timeouts, bounded retries and cleanup. Deployment remains a separate release action after local verification.

## Pilot success measures

Evaluate whether learners can explain the illustrated process in understandable English, reuse the target phrases in a new scene, and find support without abandoning the English task. Compare short initial and final responses to prompts of similar difficulty using the same English-focused checklist, while recording conceptual accuracy and assistance used separately.

Track lesson completion, first-attempt language results, support use, successful resume, and qualitative feedback locally during the pilot. Any sharing of learner work for review is opt-in. A small pilot can identify problems and guide revisions; it does not establish a measured language-level gain. Expansion should follow resolved usability issues, reliable content review and useful English output, rather than card counts alone.
