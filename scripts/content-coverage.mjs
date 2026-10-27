import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadPublishedRelease } from "./build-locales.mjs";

export function validateExpansionPlan(plan, domains) {
  if (
    plan?.schemaVersion !== 1 ||
    !Array.isArray(plan.categoryOrder) ||
    !Array.isArray(plan.modules)
  )
    throw new Error("Invalid category expansion plan");
  const ids = new Set(domains.map((domain) => domain.id));
  if (
    plan.categoryOrder.length !== ids.size ||
    new Set(plan.categoryOrder).size !== ids.size ||
    plan.categoryOrder.some((id) => !ids.has(id))
  )
    throw new Error("Expansion order must cover every category exactly once");
  if (!ids.has(plan.currentCategoryId) || !ids.has(plan.nextCategoryId))
    throw new Error("Unknown current or next expansion category");
  if (
    !Array.isArray(plan.milestones) ||
    !plan.milestones.length ||
    plan.milestones.some(
      (stage) =>
        !Number.isInteger(stage.targetWordsPerCategory) ||
        stage.targetWordsPerCategory < 1,
    )
  )
    throw new Error("Expansion milestones need positive word targets");
  const modules = new Set();
  for (const module of plan.modules) {
    if (
      !module.id ||
      modules.has(module.id) ||
      !ids.has(module.categoryId) ||
      !["planned", "published-preview"].includes(module.status)
    )
      throw new Error("Invalid or duplicate expansion module");
    modules.add(module.id);
    if (
      !Array.isArray(module.entryIds) ||
      !module.entryIds.length ||
      new Set(module.entryIds).size !== module.entryIds.length
    )
      throw new Error(`Invalid module vocabulary: ${module.id}`);
    const unitIds = module.units?.flatMap((unit) => unit.entryIds) ?? [];
    if (
      unitIds.length !== module.entryIds.length ||
      new Set(unitIds).size !== unitIds.length ||
      unitIds.some((id) => !module.entryIds.includes(id))
    )
      throw new Error(
        `Module units must cover its vocabulary exactly once: ${module.id}`,
      );
    if (module.review?.humanReviewed !== false)
      throw new Error(
        `Preview module cannot claim independent human approval: ${module.id}`,
      );
  }
}

export function categoryCoverage(published, plan) {
  const domains = published.manifest.taxonomy.domains;
  validateExpansionPlan(plan, domains);
  const entries = new Map(published.entries.map((entry) => [entry.id, entry]));
  for (const module of plan.modules.filter(
    (module) => module.status === "published-preview",
  )) {
    for (const id of module.entryIds) {
      const entry = entries.get(id);
      if (!entry || entry.topic !== module.categoryId)
        throw new Error(
          `Published module has an unavailable or misplaced word: ${id}`,
        );
    }
  }
  const target = plan.milestones[0].targetWordsPerCategory;
  return {
    releaseId: published.manifest.release.id,
    words: entries.size,
    meanings: [...entries.values()].reduce(
      (total, entry) => total + entry.senses.length,
      0,
    ),
    activePassId: plan.activePassId ?? null,
    currentCategoryId: plan.currentCategoryId,
    nextCategoryId: plan.nextCategoryId,
    categories: plan.categoryOrder.map((id) => {
      const domain = domains.find((domain) => domain.id === id);
      return {
        id,
        label: domain.labelEn,
        words: [...entries.values()].filter((entry) =>
          (entry.domainIds ?? [entry.topic]).includes(id),
        ).length,
        foundationTarget: target,
      };
    }),
  };
}

export function loadCategoryCoverage({ root = process.cwd() } = {}) {
  return categoryCoverage(
    loadPublishedRelease({ root }),
    JSON.parse(
      fs.readFileSync(
        path.join(root, "content/category-expansion.json"),
        "utf8",
      ),
    ),
  );
}

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  try {
    const result = loadCategoryCoverage();
    if (process.argv.includes("--json"))
      console.log(JSON.stringify(result, null, 2));
    else {
      console.log(
        `${result.words} unique English words; ${result.meanings} meanings; ${result.categories.length} categories. Release ${result.releaseId}.`,
      );
      if (result.activePassId)
        console.log(`Current expansion pass: ${result.activePassId}.`);
      console.table(
        result.categories.map(({ label, words, foundationTarget }) => ({
          category: label,
          published: words,
          foundationTarget,
        })),
      );
      console.log(
        `Next category: ${result.categories.find((category) => category.id === result.nextCategoryId).label}. Category memberships overlap and must not be summed as unique words.`,
      );
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
