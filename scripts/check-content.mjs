import { buildContent } from "./build-content.mjs";
try {
  const release = buildContent({ write: false });
  console.log(
    `Content valid: ${release.manifest.counts.words} illustrated words, ${release.manifest.counts.meanings} meanings, ${release.manifest.counts.domains} categories; channel ${release.manifest.release.channel}.`,
  );
  if (release.manifest.release.channel === "preview")
    console.log(
      "Preview content is AI-assisted. Stable publication requires recorded human approval.",
    );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
