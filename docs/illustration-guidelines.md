# Illustrations must teach the selected meaning

Mehrdadika keeps Word Atlas's calm illustrated-card presentation, but picture meaning takes priority over one uniform art style. A recognizable related object is not always a useful picture of the word. For a verb, show the action; for an abstract noun, show the relation or sequence that makes it understandable.

The current 72-word picture audit is recorded in [content/illustration-audit.json](../content/illustration-audit.json). It binds each assessment to the exact English headword, published meanings and examples, category, source image and SHA-256. The audit records AI visual inspection, including retained pictures; it is not independent human or professional approval. Software checks can detect stale bindings and missing coverage, not establish that an illustration is semantically correct.

## Match the word, not just its surroundings

- Show **slice** as a knife producing thin, flat pieces; a finished sliced loaf alone does not clearly teach the verb. Show **chop** as repeated cutting into small pieces, with a different visible result.
- Distinguish **boil**, **simmer** and **steam**. Boiling food is immersed in vigorously bubbling water. Simmering liquid has gentle small bubbles. Steaming food sits above water in a basket; a steaming kettle alone depicts steam, not cooking food by steaming.
- Show **recipe** as ingredient quantities and ordered instructions, rather than a person merely cooking.
- Give **improve** and **recover** visible transitions. Keep the same subject across stages, so a changed object or person cannot be mistaken for improvement or recovery. A person still ill in bed is not enough to show returning to health.
- Distinguish **habit**, repeated behavior across days, from **routine**, several different activities in a regular order. Give **answer** a visible reply; another raised hand would duplicate **question**.
- Bind specialist pictures to the selected sense. **Beam** is a structural member here, rather than a shaft of light. **Current** uses an electrical context. **Load** is transported cargo in this starter entry. Preserve multiple meanings: the **pressure** card covers both blood-vessel pressure and mechanical force over area.

## Category-specific visual language

**Cooking:** use close action scenes with hands, tools, food and cooking medium clearly connected. Keep bubbles, water level and food position comparable when teaching contrasting methods. Composition should remain readable in a small grid tile. Do not let decorative kitchens obscure the action.

**Engineering:** prefer precise simplified diagrams, cutaways and a restrained slate/amber palette. Arrows must refer to the physical quantity shown, and connections must be traceable. A voltmeter measures across two separate terminals; a lamp's wires attach to its base contacts, not the glass. Show connected moving parts for a mechanism and a ruler aligned with the measured object. Schematics remain illustrative previews until qualified review is recorded.

**Healthcare:** use clear, non-graphic educational scenes and controlled explanatory insets. Blood should be visibly red. Infection, symptoms and disease need different cues; a routine examination alone may not identify the intended concept. Avoid invented anatomy, diagnostic readings, dosage instructions, or visual claims of clinical approval. Specialist review is required before stable publication.

**Learning and daily life:** warm editorial scenes work well for concrete people and activities. Use consistent characters and small sequences for repetition, memory, understanding and change. Speech balloons or basic symbols can explain a relationship, but words, logos and decorative text should not become required translation work.

**Safety:** show the situation or protection in action. An emergency should be an actual urgent event with a response; a warning sign is a signal about danger. Shelter should visibly protect people from weather. Keep scenes calm and non-sensational.

Other categories may use object studies, scenes or symbols when the selected noun is unambiguous. Style variation should help recognition while retaining the square composition, clear focal subject and readable scale of the atlas.

## Inspect the actual output

Inspect the final asset at full card size and at approximately 120–256 pixels. Check anatomy, tool contact, arrows, wiring, physical support, repeated-character identity and the distinguishing visual cue. Reject attractive images that depict a neighboring word or the wrong sense. Review the exact rendered file after conversion, not only its generation prompt. Prompts and file hashes are evidence of intent and identity, not evidence of correctness by themselves.

## Publish corrections without losing learning history

1. Preserve lexical IDs and sense IDs when correcting only the illustration. Create a new sibling filename such as `slice-v2.webp`; retain prior source files and immutable published media for saved sessions.
2. Record the new creator/generation method, compatible license, attribution, modifications, description and actual file hash in media provenance. Keep AI assistance and pending human review explicit. Do not copy machine-local generation paths into tracked content.
3. Update the source entry's image path and its audit record. The record must describe the expected cue and explain whether the image was retained or replaced. Bind it to exact English meanings and examples, not translated display strings or a loosely related category.
4. Build the new versioned English release, then rebuild vocabulary and reading locale snapshots. The shared licensed image follows the same English identity into Persian, Portuguese and Spanish.
5. Run `node scripts/check-illustrations.mjs`, the content checks and tests, then inspect affected cards in the actual app before deployment. The checker follows the hash-verified published release; incomplete authoring drafts do not need learner-facing audit records, while every published word does.

Changing a source image, its published bytes, its meaning/example bindings or its provenance hash invalidates the recorded assessment until it is updated after inspection. Stable publication continues to require real named human language review and qualified specialist review where applicable, bound to the exact content and media revision.
