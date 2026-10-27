# Mehrdadika · مهردادیکا

An open-source visual English-learning atlas for Persian, Brazilian Portuguese and Latin American Spanish speakers, adapted from [Word Atlas](https://github.com/designfuchen/word-atlas). The project follows Word Atlas’s illustrated vocabulary cards, daily learning, recall, spaced review, explorable galaxy and calm visual design, with a growing subject catalog.

[Use the website](https://mehrdadxzaker.github.io/mehrdadika/) · [Português](https://mehrdadxzaker.github.io/mehrdadika/#/pt-BR) · [Español](https://mehrdadxzaker.github.io/mehrdadika/#/es-419) · [راهنمای فارسی](README.fa.md) · [Guia em português](README.pt-BR.md) · [Guía en español](README.es-419.md) · [Implementation status](docs/implementation-status.md) · [Contributing](CONTRIBUTING.md)

## Interface languages

The Persian (`fa`), Brazilian Portuguese (`pt-BR`) and first Latin American Spanish (`es-419`) editions use the same application: onboarding and daily study, FSRS spaced review, illustrated Atlas and galaxy, reading and books, practice, settings and portable backups. The Persian layout is RTL; Portuguese and Spanish are LTR. All three teach **English**, with explanations and guidance in the learner's language.

The starter corpus contains **306 words and 307 meanings**. Each Portuguese and Spanish vocabulary overlay includes 614 translated examples, 918 collocations and 306 usage notes, plus all 32 category and 348 subcategory labels. Reading includes three passages, one original three-chapter book, two paraphrase levels and three confusable-word groups. These are AI-assisted editorial previews awaiting independent language and specialist review.

Editions share stable English identities and licensed media, while learner progress, active sessions, saved words and reading state remain separate. Existing saved words from the earlier Portuguese preview migrate into the Portuguese edition. Translation drafts are filtered against the published English release before entering the app bundle. European Portuguese remains a planned, separate locale.

See [vocabulary localization](docs/portuguese-content.md), [localized reading](docs/localized-reading-content.md), the [first word expansion](docs/word-expansion-2.md), the [category-by-category expansion](docs/category-expansion.md), the [localization roadmap](docs/localization-roadmap.md), the [implementation plan](IMPLEMENTATION_PLAN.md) and the [category catalog](docs/category-catalog.json).

## Run locally

Use Node.js 22 or newer and npm. Learners and ordinary contributors do not need an AI-provider account, API key or database server.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. Keep one development server running at a time. To bind a server explicitly to your own machine:

```sh
npm run dev -- --host 127.0.0.1
```

The default local address is `http://127.0.0.1:5188`. The development command compiles the current English content release and both vocabulary/reading locale snapshots before starting Vite.

## Check and build

```sh
npm test
npm run check:content
npm run campaign:status
npm run build
```

The production application is written to `dist/`. Serve that directory with any ordinary static host. The app is designed around local learning history and portable backups; clearing browser storage can remove local progress, so export a backup before moving devices or clearing data.

To inspect the production build locally, stop the development server and run `npm run preview`. Both commands use port 5188 and intentionally refuse to start a second server on an occupied port. Offline-pack installation is a production-build feature; the development server does not claim to install a complete offline application.

For hosting beneath a path, include the leading and trailing slash:

```sh
ATLAS_BASE=/mehrdadika/ npm run build
```

Use `ATLAS_BASE=/` for a domain root. Serve assets beneath the same base path. Hash-based application routes do not require a server-side route-rewrite service. Keep versioned content files available when publishing a new build, so existing sessions and cached releases can still load their content.

The repository includes a manual GitHub Pages workflow. Configure Pages to use GitHub Actions, then run **Deploy GitHub Pages** with the correct base path. A repository site normally uses `/REPOSITORY-NAME/`; a custom domain or account site normally uses `/`. The workflow is an optional deployment path and does not deploy on pushes or pull requests.

## Learning and catalog

Each edition retains five destinations, shown here in Persian: **امروز** (Today), **اطلس** (Atlas), **کتابخانه** (Reading), **تمرین** (Practice), and **من** (Me). English text remains left-to-right inside the Persian layout.

All 32 subject families belong to the catalog. They are organized into six discovery groups, with a searchable category chooser rather than additional primary navigation tabs:

- Daily living and relationships: everyday life; people and relationships; home, gardening and DIY; parenting and family care; fashion, beauty and personal care; wellbeing and daily habits.
- Food, travel and leisure: cooking, food and drink; travel, tourism and hospitality; transport and vehicles; sports and recreation; animals, pets and wildlife; gaming and digital culture.
- Learning, science and communication: education and academic English; natural sciences and mathematics; language and communication; geography, places and cultures.
- Health, society and culture: medicine and healthcare; law and public affairs; humanities and society; arts and media; safety and emergencies.
- Technology, industry and environment: engineering; computing and technology; architecture and infrastructure; environment and agriculture; trades and practical work; manufacturing, logistics and supply chains; energy, utilities and natural resources.
- Business and working life: business and management; economics and finance; retail and e-commerce; careers and workplace.

All 32 categories received two new illustrated entries in the [64-word visual foundation pass](docs/category-visual-foundations.md). Cooking now contains **52 words**. We combine catalog-wide breadth with deeper focused expansion; medicine and engineering now contain **74 words each**. The ongoing campaign targets **500 words in each** before continuing the other categories. See the [specialist expansion](docs/specialist-expansion.md) and [ongoing production protocol](docs/vocabulary-production.md). Run `npm run content:coverage` for current published counts and see the [32-category expansion queue](docs/category-expansion.md).

The [English/Persian category catalog](docs/category-catalog.json) is the source for the planned coverage map. Category presence does not imply that all its lessons are published. Published material, upcoming material and contributor drafts have different states. One word can belong to several subjects without duplicating its learning history; distinct meanings have separate learning records.

## Science through English

**Water and Weather** is an eight-lesson illustrated course for approximately A2–early B1 English learners, with complete Persian, Brazilian Portuguese and Latin American Spanish support. Open **Library → Courses** or the course card on Today. Read English explanations, explore diagrams, practice useful sentence patterns and write short explanations with optional native-language help.

The course includes 32 closed activities, eight writing tasks and 19 new shared science vocabulary words. Writing is saved for self-review; lesson completion and science understanding stay separate from English vocabulary mastery. Progress, backups and production offline packs include the course. Its paper-cut field-guide artwork has a distinct course identity within the existing app style. Content and translations remain AI-assisted editorial previews awaiting independent review. See the [course guide](docs/science-course.md).

## Gradual content publication

Vocabulary, passages, books and exercises are published in coherent, versioned modules. Content identity stays stable across releases. Corrections to spelling or explanations preserve existing progress; meaning changes and withdrawals require explicit migration rules.

The latest expansion adds **24 original illustrated words**: 12 in medicine and healthcare and 12 in engineering. Both categories reach 74 entries toward 500 each. It also refreshes the older friction and beam pictures. New words without packaged recordings use the available device English voice; recording-only exercises exclude them until licensed recordings are supplied. See the [latest specialist batch notes](docs/specialist-expansion-3.md).

Starter material is an **AI-assisted editorial preview**. It must not be presented as having independent human or medical/engineering expert approval. Preview releases allow the application and contributor workflow to be exercised while review continues. Stable publication requires recorded human language review, plus competent domain review for specialist content. Drafts are excluded from learner releases, including previews.

Contributors can propose text, translation, illustrations, pronunciation corrections, new subject modules or code. See the [content guide](docs/contributing-content.md) for review, provenance and publication rules. Paid generation tools are optional maintainer utilities, not prerequisites for running the website or submitting corrections.

Pictures must show the selected meaning and, for verbs, the action. The [illustration guide](docs/illustration-guidelines.md) sets category-specific visual standards. The current 306-word image audit includes 27 earlier-word replacements and 215 newly added pictures with [category-specific visual briefs](docs/category-visual-foundations.md), with exact meaning and image-hash bindings; `npm run check:illustrations` detects stale assessments. These are AI visual assessments, with independent human and specialist review still pending.

## Open source and attribution

Application code follows the [MIT license](LICENSE). Educational content follows the scope and conditions in [CONTENT_LICENSE.md](CONTENT_LICENSE.md), including CC BY 4.0 attribution where applicable. Fonts, dependencies and individual assets retain their own terms; see [third-party notices](THIRD_PARTY_NOTICES.md).

The code and visual foundation are adapted from **Word Atlas by designfuchen and contributors**, initially inspected at [`e7b44629230a470e6b664826ced4af2c367b44c2`](https://github.com/designfuchen/word-atlas/commit/e7b44629230a470e6b664826ced4af2c367b44c2). Reused designated vocabulary text, illustrations and recordings require the credit **Word Atlas contributors — CC BY 4.0**, a license link and an indication of modifications. The hosted Word Atlas website evolves separately; its visible books, music and other assets are not automatically covered by the public repository’s content license.

Mehrdadika is an independent adaptation. This attribution does not imply upstream endorsement.

Please read [CONTRIBUTING.md](CONTRIBUTING.md), the [code of conduct](CODE_OF_CONDUCT.md) and [security policy](SECURITY.md) before contributing.
