<p align="center" dir="ltr">
  <a href="https://github.com/mehrdadxzaker/mehrdadika/stargazers"><img src="https://img.shields.io/github/stars/mehrdadxzaker/mehrdadika?style=for-the-badge&amp;logo=github&amp;label=Stars" alt="GitHub stars"></a>
  <a href="https://github.com/mehrdadxzaker/mehrdadika/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/mehrdadxzaker/mehrdadika/ci.yml?branch=main&amp;style=for-the-badge&amp;logo=githubactions&amp;logoColor=white&amp;label=Checks" alt="Checks on the main branch"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/code-MIT-blue?style=for-the-badge" alt="Code license: MIT"></a>
  <a href="CONTENT_LICENSE.md"><img src="https://img.shields.io/badge/content-license_guide-6f42c1?style=for-the-badge" alt="Educational content license guide"></a>
  <a href="https://mehrdadxzaker.github.io/mehrdadika/"><img src="https://img.shields.io/badge/open-web_app-00875a?style=for-the-badge" alt="Open the web app"></a>
</p>

<p align="center" dir="ltr">
  <a href="README.md"><strong>English</strong></a> ·
  <a href="README.fa.md">فارسی</a> ·
  <a href="README.pt-BR.md">Português (Brasil)</a> ·
  <a href="README.es-419.md">Español (Latinoamérica)</a>
</p>

# Mehrdadika · مهردادیکا

**Learn English through pictures, reading, and everyday subjects—with guidance in your language.**

Mehrdadika is a free, open-source English-learning web app for Persian, Brazilian Portuguese, and Latin American Spanish speakers. Explore illustrated words, build a daily study habit, and practice English through stories and science. Every edition teaches English; explanations and instructions support you in your chosen language.

[Try the app](https://mehrdadxzaker.github.io/mehrdadika/) · [Contribute](#contributing) · [Report a problem](https://github.com/mehrdadxzaker/mehrdadika/issues/new/choose)

## Recent changes

**October 27, 2026 · Development preview**

- **Latest vocabulary batch:** 24 illustrated entries add 12 medical and 12 engineering terms; the bandage and energy illustrations have also been refreshed. See the [latest specialist batch](docs/specialist-expansion-12.md).
- **Science through English:** _Water and Weather_ adds eight illustrated lessons, 32 practice activities, eight writing tasks, and 19 new science words, with Persian, Portuguese, and Spanish support.
- **Three shared language editions:** daily study, spaced review, reading, practice, settings, and backups use the same application, with separate progress for each edition.
- **A growing illustrated atlas:** the current corpus has 522 words and 523 meanings. All 32 categories have illustrated starter entries; cooking has 52 words, and medicine and engineering have 182 each. The earlier visual foundation pass added two entries per category, with category-specific illustration styles.

Content and translations are an **AI-assisted editorial preview** awaiting independent human review. Specialist material also needs review by people qualified in the subject. These highlights describe the current source; the hosted app follows the latest manual deployment. See the [implementation status](docs/implementation-status.md) and [verification record](docs/verification.md) for details.

## Start learning

| Edition                                          | Open the app                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------- |
| فارسی · Persian                                  | [Start in Persian](https://mehrdadxzaker.github.io/mehrdadika/)           |
| Português (Brasil) · Brazilian Portuguese        | [Start in Portuguese](https://mehrdadxzaker.github.io/mehrdadika/#/pt-BR) |
| Español (Latinoamérica) · Latin American Spanish | [Start in Spanish](https://mehrdadxzaker.github.io/mehrdadika/#/es-419)   |

No account, AI subscription, or API key is needed to study. The Persian interface reads right to left; English learning text stays left to right. Portuguese and Spanish use left-to-right layouts.

<p align="center">
  <img src="public/brand/hero.webp" alt="An illustrated open book becomes a landscape of islands, books, and paths to explore." width="640">
</p>

## What you can do

| Learning area              | What it offers                                                                                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Daily study                | Set a daily goal, learn small groups of words, practice active recall, and review with the FSRS spaced-repetition scheduler.                                                           |
| Illustrated atlas          | Browse word cards with meanings, examples, collocations, pronunciation, search, filters, saved words, and a galaxy of your progress.                                                   |
| Reading                    | Read three short passages and an original three-chapter book, with translations, comprehension questions, bookmarks, and inline word lookup.                                           |
| Practice                   | Try word typing, sentence copying, dictation, two paraphrase levels, and three groups of commonly confused words.                                                                      |
| Science through English    | Describe observations, compare ideas, and explain causes in _Water and Weather_, an introductory course aimed at approximately A2–early B1 learners. Find it in **Library → Courses**. |
| Progress and offline study | Save progress on your device, export or restore a backup, and install a study pack from a production build for offline access.                                                         |

The catalog maps **32 subject families and 348 subcategories**, from daily life and cooking to technology and healthcare. It is a coverage map: many areas still need lessons. Finishing a science lesson records course participation separately from English vocabulary mastery; writing tasks use saved drafts and self-review.

### Your progress and device

Progress, saved words, active sessions, and reading/course state are stored locally and kept separate for each language edition. There is no account service or automatic cross-device sync. Export a backup before moving devices or clearing browser storage.

Offline packs require a production build and available browser storage. Device English voices support narration and words without packaged recordings; availability depends on the browser and operating system. Paid content-generation tools are optional maintainer utilities.

## Contributing

**You can help without writing code.** Teachers, learners, translators, illustrators, subject reviewers, and developers are welcome.

| Your interest             | A useful first contribution                                                                                                   |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Language and teaching     | Review five explanations or examples in one lesson; suggest clearer Persian, Brazilian Portuguese, or Latin American Spanish. |
| Learning and testing      | Try a lesson on your phone and report a confusing step, layout issue, or accessibility problem.                               |
| Illustration and subjects | Check whether a picture teaches its intended meaning, or review one small subject module.                                     |
| Development and docs      | Improve a focused interface behavior, fix a reproducible bug, or clarify a setup instruction.                                 |

1. [Open an issue](https://github.com/mehrdadxzaker/mehrdadika/issues/new/choose) describing the correction or idea. Include the word or lesson, current and proposed text, and a reason. Add content IDs, revisions, and references when available; if you cannot find them, describe the screen and ask for help. Persian, Portuguese, Spanish, and English are welcome.
2. For a code or content change, read [CONTRIBUTING.md](CONTRIBUTING.md) and the [content guide](docs/contributing-content.md), then keep your pull request small and reviewable. The detailed contributor guides are currently in English.
3. Record sources, permissions, and review work honestly. Independent language and subject review is especially valuable for moving preview content toward stable publication.

Follow the [code of conduct](CODE_OF_CONDUCT.md). For security concerns, use the reporting instructions in [SECURITY.md](SECURITY.md).

## Run locally

**Requirements:** Node.js 22 or newer, npm, and Git. No database server or AI credentials are required.

```sh
git clone https://github.com/mehrdadxzaker/mehrdadika.git
cd mehrdadika
npm ci
npm run dev
```

Open the address printed in the terminal, normally `http://127.0.0.1:5188`. The development command builds the content and translation snapshots automatically. Keep one development or preview server running at a time.

### Check and build

```sh
npm test
npm run check:content
npm run campaign:status
npm run build
```

The production output is in `dist/`. After stopping the development server, run `npm run preview` to inspect it, including the production offline controls.

### Project layout

```text
src/               React + TypeScript application, study flows, and locale UI
content/           Vocabulary, readings, courses, translations, and provenance
public/            Static assets and generated, versioned content releases
scripts/           Content builders, validation, and regression checks
docs/              Authoring guides, plans, and verification records
```

Edit authoring sources in `content/`; regenerate published content and translation snapshots with the documented builders. Keep stable word and meaning IDs so corrections preserve learner progress.

## Deployment

Serve `dist/` from a static host. For GitHub Pages beneath the repository path:

```sh
ATLAS_BASE=/mehrdadika/ npm run build
```

Use `ATLAS_BASE=/` for a domain root. The repository includes a manually dispatched **Deploy GitHub Pages** workflow; pushes and pull requests do not deploy automatically. Retain versioned content artifacts when updating the site so saved sessions can still load their releases.

## Documentation and next steps

| Guide                                                                                                                                                                      | Purpose                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [Implementation status](docs/implementation-status.md) · [Verification](docs/verification.md)                                                                              | Current scope, recorded checks, and known limits.             |
| [Vocabulary expansion](docs/category-expansion.md) · [Visual foundations](docs/category-visual-foundations.md) · [Latest specialist batch](docs/specialist-expansion-12.md) | Category coverage and recent vocabulary/image additions.      |
| [Science course](docs/science-course.md)                                                                                                                                   | Course design, progress, authoring, and review.               |
| [Content contributions](docs/contributing-content.md) · [Illustrations](docs/illustration-guidelines.md)                                                                   | Editorial review, sources, asset rights, and teaching images. |
| [Vocabulary localization](docs/portuguese-content.md) · [Reading localization](docs/localized-reading-content.md)                                                          | Source-bound translations and the shared language editions.   |
| [Localization roadmap](docs/localization-roadmap.md) · [Implementation plan](IMPLEMENTATION_PLAN.md)                                                                       | Continuing work and planned coverage.                         |

Priorities include independent language and subject review, coherent new lesson collections, licensed recordings, and broader browser/device checks. The ongoing vocabulary campaign targets 500 words each in medicine and engineering before continuing other categories. Track published counts with `npm run content:coverage`, campaign progress with `npm run campaign:status`, and the [production protocol](docs/vocabulary-production.md). European Portuguese remains a planned, separate locale. The current preview does not establish learning outcomes or professional subject qualification.

## Licenses and acknowledgments

- **Application code:** [MIT](LICENSE).
- **Educational content:** see [CONTENT_LICENSE.md](CONTENT_LICENSE.md) for scope and CC BY 4.0 attribution requirements. Original adaptation material credits **Mehrdadika contributors**; reused and adapted upstream material retains **Word Atlas contributors — CC BY 4.0**, the license link, and an indication of modifications.
- **Fonts, dependencies, and individual assets:** retain their own terms; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Mehrdadika adapts the code and visual foundation of [Word Atlas](https://github.com/designfuchen/word-atlas), by designfuchen and contributors, initially inspected at [`e7b4462`](https://github.com/designfuchen/word-atlas/commit/e7b44629230a470e6b664826ced4af2c367b44c2). This is an independent project; attribution does not imply upstream endorsement. Material visible only on the hosted Word Atlas website is not automatically covered by the repository's content license.
