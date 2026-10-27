# Science through English

Water and Weather is Mehrdadika's first science course for English learners. Eight illustrated lessons use everyday observations to practice describing, comparing, explaining causes and sequencing events. English is the main reading, activity and writing language. Persian, Brazilian Portuguese and Latin American Spanish supply optional translations, instructions, explanations and sentence starters.

Open **Library → Courses**, or follow the course card on Today. The course uses the same application shell and word sheets, with its own paper-cut field-guide cover and editable educational diagrams. Its approximate A2–early B1 level is an editorial target, and its content is an AI-assisted preview awaiting independent English, native-language and science review.

Each lesson has six stages: look, read, notice useful English, practice, explain, and keep useful language. The complete course contains eight English readings, 32 closed activities and eight writing prompts with two model responses each. Learners can compare examples, review their own writing, revise and save their explanation. Written work is self-reviewed; completion records participation rather than an automatic English or science grade.

The course uses 22 vocabulary senses, including 19 new canonical science words. “Review these words” starts the existing English learning/review flow. Reading or finishing a course lesson does not change vocabulary FSRS grades or imply mastery. Existing active vocabulary sessions are preserved.

## Local data and offline study

Course position, first attempts, later corrections, help use, translations, writing and completion stay on the current device. Each support-language edition has separate progress. Course data participates in the existing backup/import/reset controls; old version-2 backups remain importable. Export a backup before clearing browser data or moving to another device.

An active lesson pins its content release and native support so resuming does not silently substitute a changed question or answer. Old releases without a course remain usable. An unavailable pinned release produces a recovery message while retaining saved work.

The production offline pack includes the course, all three support overlays, its cover, diagrams and vocabulary assets. Device English narration is optional and depends on voice availability; all required activities have a text path. Offline controls require a production build.

## Authoring and checks

The English source is [science-water-weather.json](../content/courses/science-water-weather.json). Native support is authored in separate [Persian](../content/locales/courses.science-water-weather.fa.json), [Portuguese](../content/locales/courses.science-water-weather.pt-BR.json) and [Spanish](../content/locales/courses.science-water-weather.es-419.json) overlays. Shared English text, exercise choices and answer keys belong only to the English source.

After changing English content or diagram bytes, inspect the corresponding support and explicitly bind it to the new source revision:

```sh
node scripts/course-validation.mjs --bind
node scripts/course-validation.mjs
npm run build:content
npm run build:locales
npm run build:reading-locales
npm run check:content
npm test
npm run build
```

Rebinding is an author action, not a build side effect. It does not perform human review. Approved overlays require renewed review before rebinding. The normal content compiler validates course schema, references, media, review metadata and exact support bindings, then writes the hashed course bundle into the same immutable release as the atlas. Do not edit generated `public/content` artifacts or locale snapshots directly.

Course and support approval are separate from the surrounding atlas's preview status. Review must bind to the exact text and media revision; reviewed course content requires a named English-language reviewer, qualified science review, and review of the selected native support. Draft and withdrawn course material is excluded from learner releases.

See the [implementation plan](science-through-english-plan.md), [artwork and final cover prompt](science-course-artwork.md) and [content contribution rules](contributing-content.md).
