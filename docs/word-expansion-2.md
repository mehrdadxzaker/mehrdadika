# First vocabulary expansion

The second editorial preview adds 16 original illustrated words, bringing the authoring corpus to **72 lexical entries and 73 independently identified meanings**. Existing English lexical and sense IDs remain unchanged, including the separate medical and engineering senses of `pressure`.

| Collection | New words |
| --- | --- |
| Law and public affairs | law, judge, contract |
| Arts and media | painting, sculpture, melody |
| Gaming and digital culture | game, player, controller |
| Safety and emergencies | emergency, shelter, warning |
| Cooking | simmer |
| Healthcare | bandage |
| Engineering | valve, voltage |

Each new entry includes a Persian explanation, two bilingual examples, three collocations, a usage note, and matching Brazilian Portuguese and Latin-American Spanish text. These are original AI-assisted editorial previews. Independent language and specialist review has not been recorded.

The new media are original, self-contained SVG teaching illustrations in the atlas's warm palette. Their actual byte hashes, creators, rights and descriptions are recorded in `content/media-provenance.json`. They do not impersonate upstream recordings: where no finished licensed English recording exists, the application can use the device's English voice and avoids recorded-audio-only quiz modes.

The new law, arts, gaming and safety collections seed areas that previously had no vocabulary. Presence of these starter words does not imply that the categories or their subcategories are complete. Clinical and legal entries teach neutral vocabulary and examples; they are not treatment or legal instructions.

`content/new-word-batch.json` records this batch's identities. Additions preserve history; meaningful sense changes need new identities rather than transferring mastery to unrelated content. The existing versioned publisher retains old immutable artifacts while the current pointer moves only after a complete new release is built.

Vocabulary translations in `content/locales/pt-BR.json` and `content/locales/es-419.json` use exact English source bindings. The locale compiler emits only records present in the actual hash-verified English release, excludes translation drafts, and generates a separate client snapshot for each language. The CLI builds or checks both supported locales; the `buildLocales({ root, check, locale })` API can target one locale and retains the previous `pt-BR` default.

Both locale overlays include native labels for all 32 categories and all 348 subcategories. Subcategory translations bind to their exact published English labels and compile in taxonomy order. Unknown, stale, draft and withdrawn translation pairs cannot enter the client snapshot. A missing native label falls back to its public English source at the same position, so a partial translation never shifts labels onto unrelated subcategories. Complete labels describe the planned taxonomy, not a claim of complete vocabulary coverage.
