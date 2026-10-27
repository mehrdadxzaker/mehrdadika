# Localization roadmap

Mehrdadika teaches English. Each interface locale supplies explanations, examples, discovery labels and learning guidance in the learner's language while preserving stable English lexical and sense identities.

## Current milestones

- **Persian (`fa`):** the full initial learning, review, reading and practice application.
- **Brazilian Portuguese (`pt-BR`):** an explicitly unreviewed preview for illustrated vocabulary discovery, bilingual cards, category browsing, search, pronunciation and saved words. Reading and spaced-review localization follow later.
- **European Portuguese (`pt-PT`):** planned separately. Add reviewed terminology and an edition route before enabling its registry entry.

## Suggested languages after Portuguese

This order is an editorial and implementation recommendation, not a measured market ranking. A committed native editor and qualified specialist reviewers can move a language ahead of a larger language without an editorial owner.

| Priority | Locale starting point | Reason and scope |
| --- | --- | --- |
| 1 | Spanish, initially `es-419` | Reuse the Portuguese LTR presentation while translating independently. Spanish is among the largest non-English first-language groups taking the Duolingo English Test, a relevant but selective English-learning audience signal. Add regional overrides rather than claiming all professional terminology is universal. |
| 2 | Arabic, initially Modern Standard Arabic | Reuse tested RTL mechanics from Persian, with independent Arabic copy, typography checks and domain review. Arabic has the same English-assessment audience signal; dialect and country-specific terminology need explicit treatment. |
| 3 | French, with regional overrides | A useful edition across several regions. Recruit an editor who can distinguish broadly shared vocabulary from country-specific medical, legal and professional usage. |
| 4 | Indonesian (`id`) | A practical LTR pilot when a native editor is available. Its position here reflects implementation fit and reviewer capacity, not a demonstrated demand estimate. |
| 5 | Turkish (`tr`) | Another focused LTR expansion. Test locale-aware casing/search and independently review technical vocabulary. |

Hindi and Urdu should be separate projects with their own reviewers. Mandarin deserves consideration, but collaboration with the original Chinese Word Atlas may offer more value than immediately duplicating that edition.

The [Duolingo 2025 Language Report](https://blog.duolingo.com/2025-duolingo-language-report/) identifies Mandarin, Spanish and Arabic among its largest non-English first-language groups taking the English Test. These are selected test takers, not the whole English-learning population. The [OIF 2026 report](https://www.francophonie.org/sites/default/files/2026-03/La_langue_francaise_dans_le_monde_Edition_2026.pdf) supplies geographic context for French; speaker reach alone is not product demand.

## Release approach

Start each language with a coherent module and honest preview labeling. Require native language review and appropriate medicine/engineering review before stable claims. Bind translations to their exact English source and revision, exclude drafts from learner bundles, preserve existing progress, and test LTR/RTL navigation, search, audio, dialogs and mobile layouts. Expand based on actual usage and contributor capacity.
