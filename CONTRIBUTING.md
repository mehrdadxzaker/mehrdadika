# Contributing to Mehrdadika

Contributions can improve Persian, Brazilian Portuguese and Latin American Spanish explanations, English examples, illustrations, pronunciation, accessibility, subject coverage and code. Start with a small, reviewable change. The [32-category catalog](docs/category-catalog.json) records intended coverage; unpublished branches are useful places to propose a coherent module.

## Development

1. Create a branch from the project’s current development branch.
2. Install the lockfile dependencies with `npm ci`.
3. Run one local server with `npm run dev`.
4. Make the change and run `npm test`, `npm run check:content`, and `npm run build`.
5. Submit a pull request explaining the learner-visible result and relevant validation.

Use Node.js 22 or newer. Ordinary builds and tests must not require AI-generation credentials. Do not include personal browser progress, API keys, local reference screenshots, `.skill-scout/`, build output or private source material in a pull request.

## Code changes

- Preserve the Word Atlas visual language and five primary destinations unless the change has an agreed product reason.
- Mark Persian RTL and English/Portuguese/Spanish LTR direction explicitly. Preserve native language links when switching editions. Check keyboard focus, narrow screens, text zoom and reduced motion for interface changes.
- Localize shared UI copy through `src/i18n/`; do not fork a reduced learning application for each language. Keep English learning text and IDs unchanged. Check edition-specific progress, reader state and backups when changing locale behavior.
- Keep lexical identity separate from meaning identity. Preserve existing progress when content or labels change.
- Use content release manifests rather than assuming mutable array positions identify entries.
- Add focused checks for a real behavior or failure mode. Mock network dependencies in routine tests.
- Explain schema migrations, cache changes, third-party assets and new dependencies in the pull request.

## Content changes

Read [the content contribution guide](docs/contributing-content.md). A source citation helps verify a statement; it does not grant permission to copy a dictionary, recording, image or translation. Include the rights basis and attribution for every reused item.

For vocabulary translations, read [vocabulary localization](docs/portuguese-content.md); for passages, books and exercise explanations, read [localized reading and practice](docs/localized-reading-content.md). Edit authoring overlays rather than generated snapshots, retain exact English source bindings, and rebuild both vocabulary and reading locale snapshots after changing the English release. The normal `predev` and `prebuild` hooks do this in order.

Starter content is an AI-assisted editorial preview. Do not mark a reviewer as human, domain-qualified, or independent without a real review and permission to attribute it. Stable publication needs human language approval and specialist approval where appropriate. Drafts remain outside learner release manifests.

For category expansion, follow the [category-by-category queue](docs/category-expansion.md) and inspect `npm run content:coverage`. Add a coherent module to `content/category-expansion.json` after its words, translations and illustrations are ready for preview. Keep all three native editions aligned in the same batch.

For new category illustrations, follow `content/visual-languages.json`, inspect the final full-size and thumbnail pixels, and record the expected meaning cue and actual style assessment. The [visual foundations guide](docs/category-visual-foundations.md) documents the brief bindings and their limits.

For a correction, include the lexical or sense ID, content revision, current text, proposed text, explanation and reference. For a new module, describe the audience, learning objective, category, scope, prerequisites and likely review needs.

## Network and process limits

- Use no more than eight outbound HTTP requests per task unless a maintainer explicitly authorizes a different bound. Prefer smaller batches for generation.
- Reuse clients/connections, set connection and request timeouts, honor `Retry-After`, and use no more than three retries with exponential backoff and jitter.
- Close clients and streams; stop owned development servers and background jobs when finished.
- Do not run load tests or continuous polling as ordinary verification. Stop creating connections on address exhaustion and investigate the resource state.
- Never terminate unrelated processes or modify network/firewall/kernel settings as a workaround.

## Pull request review

Keep scope understandable. Include screenshots for visible changes and a small reproduction for behavior fixes. Checks establish technical validity, not semantic correctness or clinical qualification. Content review attaches to the exact revision being published.

Changes follow the code and content licenses stated in this repository. Only contribute material you have authority to license. Do not relicense an upstream or third-party asset by changing its metadata.
