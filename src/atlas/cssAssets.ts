/** Read complete CSS url() tokens, so nested SVG paint references stay inside data URLs. */
export function cssAssetReferences(css: string): string[] {
  const urls =
    /url\(\s*(?:"((?:\\[\s\S]|[^"\\])*)"|'((?:\\[\s\S]|[^'\\])*)'|((?:\\[\s\S]|[^)\\\s])*))\s*\)/gi;
  const references: string[] = [];
  for (const match of css.matchAll(urls)) {
    const value = (match[1] ?? match[2] ?? match[3] ?? "").trim();
    if (!value || /^(?:data:|#)/i.test(value)) continue;
    // CSS escaped punctuation is part of the URL, not a token delimiter.
    references.push(value.replace(/\\(["'()\\ ])/g, "$1"));
  }
  return [...new Set(references)];
}
