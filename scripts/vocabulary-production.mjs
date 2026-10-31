#!/usr/bin/env node
import { parseArgs } from "node:util";
import {
  importBatch,
  loadQueue,
  stateOf,
  buildBoard,
  readInputJson,
  intakeCandidate,
  recordInspection,
  beginGeneration,
  failGeneration,
  reconcileAttempts,
  registerTemplate,
  prepareGroup,
} from "./lib/vocabulary-production.mjs";

const usage =
  "Usage: node scripts/vocabulary-production.mjs <import|status|board|intake|inspect|begin-generation|fail-generation|reconcile-attempts|template|prepare-group|prepare-image-correction> --batch ID [--root PATH] [--word ID] [--input PRIVATE_JSON|--receipt PRIVATE_JSON]";
const select = (value, keys) =>
  Object.fromEntries(
    keys.filter((k) => Object.hasOwn(value, k)).map((k) => [k, value[k]]),
  );
async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    strict: true,
    options: {
      batch: { type: "string" },
      root: { type: "string" },
      word: { type: "string" },
      input: { type: "string" },
      receipt: { type: "string" },
      help: { type: "boolean" },
    },
  });
  if (values.help) {
    process.stdout.write(usage + "\n");
    return;
  }
  const command = positionals[0];
  if (positionals.length !== 1 || !values.batch) throw new Error(usage);
  const common = { root: values.root || process.cwd(), batchId: values.batch };
  const word = { ...common, wordId: values.word };
  let result;
  if (command === "import") result = await importBatch(common);
  else if (command === "status") {
    const q = await loadQueue(common),
      counts = {};
    for (const r of q.records) {
      const s = stateOf(r);
      counts[s] = (counts[s] || 0) + 1;
    }
    result = {
      batchId: q.batchId,
      publication: q.publication,
      counts,
      groups: q.groups,
      records: q.records.map((r) => ({
        id: r.id,
        word: r.word,
        state: stateOf(r),
        generation: r.generation,
      })),
    };
  } else if (command === "board") result = await buildBoard(common);
  else {
    const inputFile =
      command === "inspect" ? values.receipt || values.input : values.input;
    if (!inputFile)
      throw new Error(
        "This command requires --input (inspect also accepts --receipt)",
      );
    const input = await readInputJson({ root: common.root, file: inputFile });
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new Error("Input must be a JSON object");
    if (command === "intake")
      result = await intakeCandidate({
        ...word,
        ...select(input, ["source", "card", "thumbnail", "python", "token"]),
      });
    else if (command === "inspect")
      result = await recordInspection({
        ...word,
        receipt: input.receipt || input,
      });
    else if (command === "begin-generation")
      result = await beginGeneration({
        ...word,
        ...select(input, ["prompt", "expectedCue", "templateId"]),
      });
    else if (command === "fail-generation")
      result = await failGeneration({
        ...word,
        ...select(input, ["token", "reason"]),
      });
    else if (command === "reconcile-attempts")
      result = await reconcileAttempts({
        ...word,
        ...select(input, ["used", "evidence"]),
      });
    else if (command === "template")
      result = await registerTemplate({
        ...word,
        ...select(input, ["templateId", "usageNotes"]),
      });
    else if (["prepare-group", "prepare-image-correction"].includes(command))
      result = await prepareGroup({
        ...common,
        ...select(input, ["groupId", "releaseId", "runId", "wordIds"]),
        ...(command === "prepare-image-correction"
          ? { kind: "existing-image-correction" }
          : {}),
      });
    else throw new Error("Unknown command. " + usage);
  }
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}
main().catch((error) => {
  process.stderr.write("Vocabulary production: " + error.message + "\n");
  process.exitCode = 1;
});
