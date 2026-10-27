# Binding a review to exact content

Stable content needs recorded approval from a named human language reviewer. Medical and engineering content additionally needs a named, qualified domain reviewer. Review digests bind those records to the material that was inspected. A digest is an integrity check; maintainers still verify the named reviewers and their qualifications through the contribution review process.

## Vocabulary entries

After inspecting an entry and its actual image/audio assets, display its deterministic digest:

```sh
node scripts/build-content.mjs --review-hash pressure
```

The command only displays the lexical ID, expected `contentHash`, and affected sense IDs. It does not approve, publish, or modify content. Copy that hash into each approved sense's `review.contentHash` only as part of the human review record. The rest of the approval record includes `status: "approved"`, `humanReviewed: true`, and a nonempty `reviewer`. Medical/engineering meanings also require `domainQualified: true` and a nonempty `domainReviewer`.

The vocabulary digest covers the entry's publishable text, IDs, category membership, examples, relationships, usage notes, provenance and the source bytes of its declared media. Review metadata is excluded. Draft meanings and examples explicitly scoped to those draft meanings are excluded from the published material and digest. Text or media changes make the old approval stale; changing the release date or reviewer record does not alter the content digest.

A stable build rejects missing or stale digests and reports the expected hash and helper command. A changed hash is a reason to review the changed material; generating a fresh hash alone is not approval.

## Reading and exercise records

Display the digest for a passage, book, chapter, paraphrase level, or confusable group:

```sh
node scripts/build-content.mjs --review-reading-hash reading:library-afternoon
```

Record the displayed hash in that item's `review.contentHash`, alongside the named human approval. A specialist passage/chapter also needs qualified domain review. Reading digests include the record's authored material while excluding nested review and publication metadata. Each included record must satisfy its own approval gate.

## Release checks

```sh
npm test
npm run check:content
node scripts/build-content.mjs --channel stable --check
```

The current starter catalog is an AI-assisted preview and intentionally fails the stable gate. Keep preview metadata honest. When preparing a stable release, set the intended source release channel, record genuine approvals for included material, and retain the immutable previously published releases required by the support policy.
