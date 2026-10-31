import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadPublishedRelease, compileLocale } from "./build-locales.mjs";
import {
  validateVisualRegistry,
  visualLanguageHash,
} from "./check-visual-languages.mjs";

const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};
const nonempty = (value) =>
  typeof value === "string" && value.trim().length > 0;
export function validateCampaign(campaign, domains) {
  const ids = new Set(domains.map((domain) => domain.id));
  requireValue(
    campaign?.schemaVersion === 1 &&
      campaign.id === "specialist-500" &&
      ["active", "complete"].includes(campaign.status),
    "Invalid vocabulary campaign",
  );
  requireValue(
    Array.isArray(campaign.priorityTargets) &&
      campaign.priorityTargets.length === 2,
    "Expected two priority category targets",
  );
  const priority = new Set();
  for (const target of campaign.priorityTargets) {
    requireValue(
      ids.has(target.categoryId) &&
        !priority.has(target.categoryId) &&
        target.targetWords === 500,
      "Invalid or repeated 500-word target",
    );
    priority.add(target.categoryId);
  }
  requireValue(
    priority.has("medicine-healthcare") && priority.has("engineering"),
    "Medicine and engineering must remain the first priorities",
  );
  const remaining = campaign.remainingCategoryOrder;
  requireValue(
    Array.isArray(remaining) &&
      new Set(remaining).size === remaining.length &&
      remaining.length === ids.size - priority.size &&
      remaining.every((id) => ids.has(id) && !priority.has(id)),
    "Remaining queue must cover other categories exactly once",
  );
  const p = campaign.production;
  requireValue(
    p?.maxNewEntriesPerAutomaticRun === 24 &&
      p.preferredEntriesPerPriorityCategory === 12 &&
      Number.isInteger(p.maxConcurrentAgents) &&
      p.maxConcurrentAgents <= 3 &&
      p.maxConcurrentAgents >= 1 &&
      Number.isInteger(p.maxOutboundRequests) &&
      p.maxOutboundRequests <= 8 &&
      p.maxOutboundRequests >= 1,
    "Campaign resource bounds are missing or widened",
  );
  requireValue(
    JSON.stringify(p.requiredLocales) ===
      JSON.stringify(["fa", "pt-BR", "es-419"]) &&
      JSON.stringify(p.requiredImageSizes) === JSON.stringify([512, 120]) &&
      p.publicationChannel === "preview" &&
      p.independentHumanReviewRecorded === false,
    "Unsupported publication/review or localization claim",
  );
  for (const id of priority) {
    const topics = campaign.editorialCoverage?.[id];
    requireValue(
      Array.isArray(topics) &&
        topics.length > 0 &&
        new Set(topics.map((topic) => topic.id)).size === topics.length &&
        topics.every(
          (topic) =>
            nonempty(topic.id) &&
            nonempty(topic.label) &&
            Number.isInteger(topic.plannedVocabularySlots) &&
            topic.plannedVocabularySlots > 0,
        ) &&
        topics.reduce(
          (total, topic) => total + topic.plannedVocabularySlots,
          0,
        ) === 500,
      `Editorial allocation must total 500 planned slots: ${id}`,
    );
  }
  const milestones = campaign.remainingCategoryMilestones;
  requireValue(
    Array.isArray(milestones) &&
      milestones.length > 0 &&
      milestones.every(
        (n, i) =>
          Number.isInteger(n) && n > 0 && (i === 0 || n > milestones[i - 1]),
      ),
    "Invalid remaining category milestones",
  );
  requireValue(
    Array.isArray(campaign.batches),
    "Missing campaign publication ledger",
  );
  requireValue(
    nonempty(campaign.baseline?.manifest) &&
      /^[a-f0-9]{64}$/.test(campaign.baseline.manifestSha256 ?? "") &&
      Number.isInteger(campaign.baseline.words) &&
      campaign.baseline.words > 0,
    "Missing immutable campaign baseline",
  );
  const batchIds = new Set(),
    entryIds = new Set();
  for (const batch of campaign.batches) {
    requireValue(
      nonempty(batch.id) &&
        !batchIds.has(batch.id) &&
        ["draft", "published-preview"].includes(batch.status) &&
        batch.review?.humanReviewed === false,
      "Invalid campaign batch or human approval claim",
    );
    batchIds.add(batch.id);
    const imageCorrection = batch.kind === "existing-image-correction";
    requireValue(
      Array.isArray(batch.modules) &&
        (imageCorrection
          ? batch.modules.length === 0 && batch.newEnglishWords === 0
          : batch.modules.length > 0),
      "Missing campaign category modules or invalid zero-addition correction",
    );
    const batchSize = batch.modules.reduce(
      (total, module) => total + (module.entryIds?.length ?? 0),
      0,
    );
    const initialException =
      batch.id === "specialist-500-foundation-1" &&
      batch.initialManualMilestone === true &&
      batchSize === 67 &&
      batch.modules.length === 2 &&
      batch.modules.some(
        (m) =>
          m.categoryId === "medicine-healthcare" && m.entryIds?.length === 34,
      ) &&
      batch.modules.some(
        (m) => m.categoryId === "engineering" && m.entryIds?.length === 33,
      );
    requireValue(
      batchSize <= p.maxNewEntriesPerAutomaticRun || initialException,
      "Automatic campaign batches must contain at most 24 additions",
    );
    const refresh = batch.imageRefreshEntryIds ?? [];
    const additions = new Set(
      batch.modules.flatMap((module) => module.entryIds ?? []),
    );
    requireValue(
      Array.isArray(refresh) &&
        refresh.length <= 2 &&
        new Set(refresh).size === refresh.length &&
        refresh.every((id) => nonempty(id) && !additions.has(id)),
      "Image refreshes must be at most two existing lexical identities, separate from additions",
    );
    if (imageCorrection)
      requireValue(
        refresh.length >= 1 &&
          nonempty(batch.baseline?.releaseId) &&
          nonempty(batch.baseline?.manifest) &&
          /^[a-f0-9]{64}$/.test(batch.baseline?.manifestSha256 ?? "") &&
          Number.isInteger(batch.baseline?.words) &&
          batch.baseline.words > 0,
        "Image-only correction needs one or two refreshes and a pinned baseline",
      );
    for (const module of batch.modules) {
      requireValue(
        ids.has(module.categoryId) &&
          module.visualLanguageId === module.categoryId &&
          Array.isArray(module.entryIds) &&
          module.entryIds.length > 0,
        "Invalid campaign module",
      );
      for (const id of module.entryIds) {
        requireValue(
          nonempty(id) && !entryIds.has(id),
          "Repeated campaign lexical identity",
        );
        entryIds.add(id);
      }
    }
  }
  const drafts = campaign.batches.filter((batch) => batch.status === "draft");
  requireValue(
    drafts.length <= 1 &&
      (drafts.length === 0
        ? campaign.activeWorkBatchId == null
        : campaign.activeWorkBatchId === drafts[0].id),
    "The active work pointer must identify the sole resumable draft batch",
  );
}

export function campaignProgress(published, campaign) {
  validateCampaign(campaign, published.manifest.taxonomy.domains);
  const words = new Map(published.entries.map((entry) => [entry.id, entry]));
  const headwords = new Set();
  for (const entry of words.values()) {
    const normalized = entry.w
      ?.normalize("NFKC")
      .trim()
      .toLocaleLowerCase("en")
      .replace(/\s+/g, " ");
    requireValue(
      nonempty(normalized) && !headwords.has(normalized),
      "Duplicate or missing English headword; add meanings to the existing lexical identity",
    );
    headwords.add(normalized);
  }
  const count = (id) =>
    [...words.values()].filter((entry) =>
      (entry.domainIds ?? [entry.topic]).includes(id),
    ).length;
  const targets = campaign.priorityTargets.map((target) => ({
    ...target,
    publishedWords: count(target.categoryId),
    remainingWords: Math.max(0, target.targetWords - count(target.categoryId)),
  }));
  const prioritiesComplete = targets.every(
    (target) => target.remainingWords === 0,
  );
  const next = [];
  if (!prioritiesComplete) {
    for (const target of targets)
      if (target.remainingWords > 0)
        next.push({
          categoryId: target.categoryId,
          targetWords: target.targetWords,
          newEntries: Math.min(
            campaign.production.preferredEntriesPerPriorityCategory,
            target.remainingWords,
          ),
        });
  } else {
    for (const milestone of campaign.remainingCategoryMilestones) {
      const id = campaign.remainingCategoryOrder.find(
        (id) => count(id) < milestone,
      );
      if (id) {
        next.push({
          categoryId: id,
          targetWords: milestone,
          newEntries: Math.min(
            campaign.production.maxNewEntriesPerAutomaticRun,
            milestone - count(id),
          ),
        });
        break;
      }
    }
  }
  requireValue(
    campaign.status !== "complete" || (prioritiesComplete && next.length === 0),
    "Campaign cannot be complete before every configured published target is met",
  );
  return {
    releaseId: published.manifest.release.id,
    uniqueEnglishEntries: words.size,
    priorityTargets: targets,
    prioritiesComplete,
    nextBatch: next,
    allConfiguredTargetsComplete: prioritiesComplete && next.length === 0,
  };
}

export function validateCampaignCoverage(campaign, published, baseline) {
  const entries = new Map(published.entries.map((entry) => [entry.id, entry]));
  const oldIds = new Set(baseline.entries.map((entry) => entry.id));
  const covered = new Set(
    campaign.batches
      .filter((batch) => batch.status === "published-preview")
      .flatMap((batch) => batch.modules.flatMap((module) => module.entryIds)),
  );
  for (const old of baseline.entries) {
    const current = entries.get(old.id);
    requireValue(
      current?.w === old.w &&
        old.senses.every((sense) =>
          current.senses.some((s) => s.id === sense.id),
        ),
      `Lost baseline lexical/sense identity: ${old.id}`,
    );
  }
  for (const entry of entries.values())
    requireValue(
      oldIds.has(entry.id) || covered.has(entry.id),
      `Published addition has no completed campaign ledger: ${entry.id}`,
    );
  for (const id of covered)
    requireValue(
      !oldIds.has(id) && entries.has(id),
      `Campaign addition reuses a baseline word or is unavailable: ${id}`,
    );
}

export function loadCampaignBaseline(campaign, { root = process.cwd() } = {}) {
  const b = campaign.baseline;
  const baseline = loadPublishedRelease({
    root,
    pointer: {
      schemaVersion: 1,
      manifest: b.manifest,
      sha256: b.manifestSha256,
    },
  });
  requireValue(
    baseline.manifest.release.id === b.releaseId &&
      baseline.entries.length === b.words,
    "Campaign baseline metadata differs from immutable release",
  );
  return baseline;
}

export function validateCampaignAssets(
  campaign,
  published,
  registry,
  audit,
  provenance,
  overlays,
  baseline,
  { root = process.cwd() } = {},
) {
  validateCampaign(campaign, published.manifest.taxonomy.domains);
  validateCampaignCoverage(campaign, published, baseline);
  const profiles = validateVisualRegistry(
    registry,
    published.manifest.taxonomy.domains,
  );
  const entries = new Map(published.entries.map((entry) => [entry.id, entry])),
    assessments = new Map(audit.entries.map((item) => [item.entryId, item]));
  const native = Object.fromEntries(
    ["pt-BR", "es-419"].map((locale) => [
      locale,
      compileLocale(overlays[locale], published),
    ]),
  );
  let checkedWords = 0,
    checkedRefreshImages = 0;
  const refreshBaselines = new Map();
  for (const batch of campaign.batches.filter(
    (batch) => batch.status === "published-preview",
  )) {
    const refreshIds = batch.imageRefreshEntryIds ?? [];
    if (refreshIds.length) {
      const key = JSON.stringify(batch.baseline);
      if (!refreshBaselines.has(key))
        refreshBaselines.set(key, loadCampaignBaseline(batch, { root }));
      const pinned = refreshBaselines.get(key);
      const previous = new Map(
        pinned.entries.map((entry) => [entry.id, entry]),
      );
      for (const id of refreshIds) {
        const old = previous.get(id),
          current = entries.get(id);
        requireValue(
          old && current && old.w === current.w,
          "Image refresh did not exist in its pinned batch baseline: " + id,
        );
        requireValue(
          old.media?.img &&
            current.media?.img &&
            old.media.img !== current.media.img,
          "Image refresh must change the baseline image: " + id,
        );
      }
    }
    for (const module of [
      ...batch.modules,
      ...(batch.imageRefreshEntryIds ?? []).map((id) => ({
        categoryId: entries.get(id)?.topic,
        entryIds: [id],
        imageRefresh: true,
      })),
    ]) {
      requireValue(
        profiles.has(module.categoryId),
        "Unknown category or missing word in image refresh",
      );
      const profile = profiles.get(module.categoryId),
        sha = visualLanguageHash(profile);
      for (const id of module.entryIds) {
        const entry = entries.get(id),
          item = assessments.get(id);
        requireValue(
          entry && entry.topic === module.categoryId,
          `Unavailable campaign word: ${id}`,
        );
        requireValue(
          item?.visual?.languageId === profile.id &&
            item.visual.languageSha256 === sha &&
            nonempty(item.visual.styleInspection) &&
            item.review?.humanReviewed === false,
          `Stale or missing campaign style inspection: ${id}`,
        );
        const second = item.review.secondaryInspection;
        requireValue(
          second?.method === "Second AI visual inspection" &&
            second.humanReviewed === false &&
            second.assetSha256 === item.asset.sha256 &&
            Array.isArray(second.inspectedSizes) &&
            second.inspectedSizes.includes(120) &&
            nonempty(second.finding),
          `Missing or stale second AI image assessment: ${id}`,
        );
        const rights = provenance.assets.filter(
          (asset) =>
            asset.entryId === id &&
            asset.kind === "img" &&
            asset.path === item.asset.path,
        );
        requireValue(
          rights.length === 1 &&
            rights[0].visualLanguage?.id === profile.id &&
            rights[0].visualLanguage?.sha256 === sha,
          `Stale campaign media provenance: ${id}`,
        );
        requireValue(
          entry.ex.length >= 2 && entry.col.length >= 3 && nonempty(entry.tip),
          `Incomplete Persian source text: ${id}`,
        );
        for (const locale of ["pt-BR", "es-419"]) {
          const translated = native[locale].entries[id];
          requireValue(
            translated?.sourceWord === entry.w &&
              Object.keys(translated.senses).length === entry.senses.length &&
              translated.examples.length === entry.ex.length &&
              translated.collocations.length === entry.col.length &&
              nonempty(translated.tip),
            `Incomplete campaign native edition ${locale}: ${id}`,
          );
        }
        if (module.imageRefresh) checkedRefreshImages++;
        else checkedWords++;
      }
    }
  }
  return {
    publishedCampaignWords: checkedWords,
    refreshedCampaignImages: checkedRefreshImages,
    review: "AI-assisted editorial preview",
  };
}

export function loadCampaign({
  root = process.cwd(),
  checkAssets = true,
} = {}) {
  const read = (relative) =>
    JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
  const campaign = read("content/expansion-campaign.json"),
    published = loadPublishedRelease({ root });
  const report = campaignProgress(published, campaign);
  const baseline = loadCampaignBaseline(campaign, { root });
  validateCampaignCoverage(campaign, published, baseline);
  if (checkAssets)
    Object.assign(
      report,
      validateCampaignAssets(
        campaign,
        published,
        read("content/visual-languages.json"),
        read("content/illustration-audit.json"),
        read("content/media-provenance.json"),
        {
          "pt-BR": read("content/locales/pt-BR.json"),
          "es-419": read("content/locales/es-419.json"),
        },
        baseline,
        { root },
      ),
    );
  return report;
}
if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  try {
    const report = loadCampaign({
      checkAssets: true,
    });
    if (process.argv.includes("--json"))
      console.log(JSON.stringify(report, null, 2));
    else {
      console.table(report.priorityTargets);
      console.log("Next complete batch:", JSON.stringify(report.nextBatch));
      if (report.publishedCampaignWords !== undefined)
        console.log(
          `Campaign bindings current for ${report.publishedCampaignWords} published additions. Human/domain approval remains pending.`,
        );
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
