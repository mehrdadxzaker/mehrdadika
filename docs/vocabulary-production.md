# Ongoing vocabulary production

The current campaign takes **medicine and healthcare to 500 published English entries and engineering to 500**, then continues the other 30 categories in the existing queue. For those later categories, the existing 50/150/400 milestones remain configured; only the first two categories currently have an explicit 500-entry target. These are corpus-size targets, not claims of a complete professional curriculum.

`content/expansion-campaign.json` records the targets, editorial topic allocations, publication ledger and resource limits. Planning slots, drafts, translations and additional meanings do not count as new English entries. Existing legitimate shared category memberships are counted once per category and once globally.

Medicine's 500 planning slots span anatomy, physiology, symptoms/examination, roles/communication, diagnostics, equipment, pharmacy, dentistry, rehabilitation and public health. Engineering spans measurement, mechanical systems, materials/manufacturing, electrical/electronics, civil structures, fluids, thermal/energy systems, control/automation and design/quality. These allocations guide balanced coverage; they are not already-authored vocabulary.

## Each automatic continuation

1. Reuse this chat's suitable isolated worktree. The primary checkout may contain unrelated work; do not reset, overwrite or stage it. Read Git status, fetch public main and preserve any new published work before editing.
2. Read this protocol, `content/expansion-campaign.json`, `docs/illustration-guidelines.md`, and the relevant profiles in `content/visual-languages.json`. Run `npm run campaign:status` against the actual hash-verified published release.
3. Resume `activeWorkBatchId` from the private `.local/vocabulary-production/` checkpoint before selecting another batch. Also inspect private `publication.json` checkpoints: a locally validated batch awaiting commit, CI or deployment must finish publication before another batch starts, even when its authoring draft is complete. Record `phase: "live-verified"` only after exact source-head CI, Pages and the live content pointer are verified. Local preview counts alone are not deployed counts. Select at most **24 new entries** per run, usually 12 medical and 12 engineering while both remain below 500. Cap each addition by its remaining target. After both reach 500, take the next under-target category from the configured queue/milestones. Do not pad counts with duplicate headwords, inflections, placeholder records or gratuitous phrases.
4. Author original English/Persian source and complete Brazilian Portuguese and Latin American Spanish overlays together: selected sense, IPA, approximate editorial CEFR, two meaningful examples, three collocations and usage distinctions. The first English example must include the full headword or a supported inflection so it can become a cloze prompt; keep a multiword term together. Preserve all prior word/sense identities, course content and learner progress. Keep unfinished records as drafts.
5. Refresh up to two older specialist illustrations per continuation when their inherited artwork lacks the current category style or a precise word cue. Preserve their lexical/sense identities and old immutable assets. Before either priority category is declared finished at 500, inspect its entire existing collection against the current brief, including starter artwork. Generate each new illustration with the built-in image tool, using its category's medium/palette and an exact semantic cue. Do not substitute generic icons or reuse unrelated pictures. Inspect the actual full image and the final 512px WebP and 120px thumbnail, then obtain a second AI check. Verify anatomy, part contact, wiring, force/flow direction and distinctions from neighboring terms. Correct failed candidates before publication; retain rejected drafts privately. Keep clinical and engineering examples neutral and check uncertain facts against primary authoritative sources. Do not copy protected dictionaries or artwork.
6. Record final prompts, rights, hashes, expected cues, actual semantic/style inspections and exact category-profile hash. Keep AI assistance and pending independent human/domain review explicit. No fake audio, review identities or stable-channel promotion.
7. Add the completed batch to this campaign ledger and the category expansion ledger. Use a fresh preview release ID, build the English release and both vocabulary/reading snapshots, then run the complete tests, `npm run check:content`, `npm run check:campaign` and a production build under `/mehrdadika/`. Verify representative new cards in all three editions and desktop/phone layouts. Software proves bindings and integrity, not semantic truth or human approval.
8. Commit only the coherent completed batch and required generated artifacts. Push without force, check CI on that exact source revision, dispatch the existing Pages workflow, then verify both live `build-info.json` revision and the published content pointer and actual new pictures. Do not report a source commit as a live deployment.
9. Report only a complete published batch/milestone or a problem requiring input. If no complete batch is available, preserve drafts and continue useful work on the next run. Do not manufacture progress by weakening checks.

Keep resource use bounded: maximum three concurrent agents, eight outbound requests across the task, one image request per worker, explicit timeouts and at most three backoff retries. Stop on repeated service failure or address exhaustion. Use one owned preview server and close it and temporary tabs after verification. No load tests or network tuning. Do not install or enable new skills without explicit user approval. Do not replace built-in image generation with a paid API/CLI path without the user's explicit choice.

The initial user-triggered milestone batch is larger than the recurring bound: 34 medical and 33 engineering additions, reaching 50 entries in each category. Future unattended runs use the 24-entry limit.

```sh
npm run campaign:status
npm run campaign:status -- --json
npm run check:campaign
```

Independent human language and specialist review remain required before stable publication. Automatic publication is limited to honestly labeled editorial previews. The recurring workflow should stop only on completion, an explicit user pause/stop, or a concrete condition that cannot be safely resolved; do not loop on the same failure or silently skip the image/language requirements.

## Persistent private production queue

Use the reusable queue to resume an interrupted draft without regenerating pictures or repeating unchanged checks. It is an authoring aid: it does not replace the corpus release, independent inspection, publication or live-verification gates above.

```sh
npm run production:queue -- import --batch specialist-500-batch-31
npm run production:queue -- status --batch specialist-500-batch-31
npm run production:queue -- board --batch specialist-500-batch-31
```

Import reads the existing private batch drafts and stages a queue under `.local/vocabulary-production/pipeline/<batchId>/queue.json`. The original source drafts, prior candidate files, published pointers and immutable releases must remain intact. Repeating import reuses matching cached assets and retains valid current receipts. Existing prose such as “accepted” or “inspected” in a legacy draft is historical evidence, not a newly issued inspection receipt. An image-less legacy draft is not evidence of zero prior requests. Imported generation history that cannot establish the number of attempts must be reconciled explicitly against preserved prompts, outputs and failures before another request is allowed; import must not reset the three-attempt limit. Resolve that history before a record can become ready or enter a prepared subgroup, even if its actual inspection receipts are otherwise complete. A held entry stays held until its unresolved issue is explicitly addressed within the authorized workflow. Do not retry the existing manual holds automatically.

The private review board is a read-only inspection aid. It shows source content, both native overlays, the actual original/512px/120px assets and existing findings. It has no approval or publication controls. Open each required image size and inspect the anatomy, device contact or mechanism itself; a board render, filename, hash, previous comment or attractive thumbnail is not evidence that the meaning is correct. Never record a pixel inspection from a prompt alone.

Keep content, generation and review states separate. A record can need complete content, an image, attempt reconciliation, an author inspection, an independent second inspection, a lexical review or a correction. “Ready” means only that its current private authoring gates are satisfied. Both native overlays must remain complete and tied to the current source examples, collocations and selected sense. The author and second image reviewer must have distinct identities; each actual-pixel receipt identifies the exact current binding, a timestamp, all three inspected sizes and a concrete finding. The lexical receipt instead records an actual-text review of the source and both overlays. AI review remains labeled as AI review, with independent human language and specialist review pending.

Bindings make cached reviews conditional. A changed meaning invalidates the related pixel and lexical receipts; a changed category brief, prompt or image invalidates the corresponding pixel receipts. A native wording change requires a current lexical review even when the picture still teaches the same meaning. Verify current file bytes as well as stored hashes when preparing a group. Preserve stale and rejected evidence in history rather than silently transferring approval to a replacement.

For a genuine derivative, register the specific inspected picture as a template with its source identity, current hashes, category brief and usage limits. A template is a starting point for a new built-in generation or edit, not permission to reuse an unrelated picture or inherit an earlier approval. Keep the exact derivative prompt and parent relationship; inspect every new original and its converted sizes and obtain a fresh independent second review. The same bounded generation and no-paid-API rules apply to template derivatives.

Prepare small coherent subgroups from ready entries, with an explicit group ID, preview release ID and automatic-run ID. An entry belongs to one prepared subgroup; aggregate additions for the same automatic run must still stay at or below 24, including across multiple groups. Held and incomplete records remain private and do not count. Group preparation produces a reviewable local artifact; it must not label the corpus or an entry as live. Finish the existing ledger, fresh English/native vocabulary and reading builds, tests/content/style/campaign checks, desktop/phone inspection, exact-head CI, manual Pages deployment and live revision/pointer/image verification before recording `live-verified` or reporting published counts.

Advanced commands take a private JSON input file instead of shell-embedded review text:

```sh
npm run production:queue -- reconcile-attempts --batch <batchId> --word <wordId> --input <attempt-evidence.json>
npm run production:queue -- begin-generation --batch <batchId> --word <wordId> --input <generation-request.json>
npm run production:queue -- intake --batch <batchId> --word <wordId> --input <candidate-paths.json>
npm run production:queue -- inspect --batch <batchId> --word <wordId> --receipt <inspection-receipt.json>
npm run production:queue -- template --batch <batchId> --word <wordId> --input <template-notes.json>
npm run production:queue -- prepare-group --batch <batchId> --input <group-request.json>
```

An attempt reconciliation supplies the verified `used` count and concrete `evidence`; a generation request supplies its literal `prompt`, `expectedCue` and optional `templateId`. Generation bookkeeping reserves a request token before the built-in tool is called. Candidate intake supplies the original `source` and, when already converted, its `card` and `thumbnail`; attach the matching token. A failed request uses `fail-generation` with that token and a concrete `reason`. These commands track work and validate local files; they do not call a paid image service or invent a tool result.

An inspection receipt names its `role` (`author`, `second` or `lexical`), `reviewerId`, honest `accepted` result, `humanReviewed: false`, actual review `basis`, concrete `finding`, ISO `inspectedAt` and the current `binding` returned by the queue library's `bindingFor(record, role)`. Pixel receipts list all inspected `sizes`, including the original width, 512 and 120. Record the result only after the corresponding actual review; fixture receipts in software tests are not content reviews. Template input includes `templateId` and `usageNotes`; a group request includes `groupId`, `releaseId`, `runId` and the distinct ready `wordIds`. Keep every request and its evidence private with the batch.

Original intake is limited to workspace files or the configured Codex `generated_images` tree used by the built-in image tool; arbitrary external paths and symlinks are rejected. Supplied card and thumbnail files must be inside the workspace. If those derivatives do not exist yet, supply an explicit already-installed Python/Pillow executable as `python` in the intake request; conversion is bounded to resizing/encoding. The queue does not install Pillow, invoke an image-generation API or treat successful conversion as inspection. Reimport after changing an on-disk category brief, and obtain fresh bound reviews before registering a template or preparing a group. An unchanged legacy import must preserve a newer candidate already produced through the queue.
