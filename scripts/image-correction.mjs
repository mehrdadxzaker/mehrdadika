#!/usr/bin/env node
import { parseArgs } from "node:util";
import {
  captureCorrectionBaseline,
  integrateImageCorrection,
  auditImageCorrection,
} from "./lib/image-correction.mjs";
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    batch: { type: "string" },
    group: { type: "string" },
    baseline: { type: "string" },
    root: { type: "string" },
    apply: { type: "boolean" },
    "write-report": { type: "boolean" },
  },
});
const options = {
  root: values.root || process.cwd(),
  batchId: values.batch,
  groupId: values.group,
  baseline: values.baseline,
  apply: values.apply,
  writeReport: values["write-report"],
};
try {
  if (positionals.length !== 1)
    throw Error("Choose baseline, integrate or audit");
  const fn = {
    baseline: captureCorrectionBaseline,
    integrate: integrateImageCorrection,
    audit: auditImageCorrection,
  }[positionals[0]];
  if (!fn) throw Error("Choose baseline, integrate or audit");
  console.log(JSON.stringify(await fn(options), null, 2));
} catch (e) {
  console.error("Image correction: " + e.message);
  process.exitCode = 1;
}
