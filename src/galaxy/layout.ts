import type { Atlas } from "../atlas/types";
import { hashSeed } from "../lib/text";

/** Reference palette, assigned by stable domain identity rather than list order. */
export const TOPIC_COLORS = [
  "#f2c46d",
  "#ef8f6b",
  "#8fd0c8",
  "#9fb8ff",
  "#9be38f",
  "#ff9fa8",
  "#f7d9a8",
  "#c6a7ff",
  "#ffd36b",
  "#7fc4ff",
  "#ffb38a",
  "#86e0b5",
  "#d8c3a5",
  "#b5e48c",
  "#ffe6b0",
  "#ff8fc3",
  "#a8d8ff",
  "#ffcf7a",
  "#e0b0ff",
];

const rgb = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const topicAngle = (id: string) => (hashSeed(id) / 4294967296) * Math.PI * 2;
export const topicColor = (id: string) =>
  TOPIC_COLORS[hashSeed(id) % TOPIC_COLORS.length];

function rand(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export interface GalaxyLayout {
  n: number;
  positions: Float32Array;
  colors: Float32Array;
  seeds: Float32Array;
  ids: string[];
  index: Map<string, number>;
  /** Aligned to atlas.topics for the existing floating-label renderer. */
  topicCenters: [number, number, number][];
}

/**
 * Preserve the reference spiral. Each stable domain owns an arm, while lexical
 * identity seeds each star. Corpus size, category order and population counts
 * never influence an existing star's coordinates or colour.
 */
export function layoutGalaxy(atlas: Atlas): GalaxyLayout {
  const words = atlas.words;
  const seen = new Set<string>();
  for (const word of words) {
    if (!word.id || seen.has(word.id))
      throw new Error("شناسهٔ واژه در آسمان خالی یا تکراری است.");
    seen.add(word.id);
  }
  const n = words.length;
  const positions = new Float32Array(n * 3);
  const colors = new Float32Array(n * 3);
  const seeds = new Float32Array(n);
  words.forEach((word, i) => {
    const random = rand(hashSeed(word.id));
    const gauss = () => (random() + random() + random() - 1.5) / 1.5;
    const domain =
      atlas.topics[word.topic]?.[0] ?? word.domainIds?.[0] ?? "uncategorized";
    const level = Number.isFinite(word.cefr)
      ? Math.max(0, Math.min(5, word.cefr))
      : 0;
    const radius = 0.1 + (level / 5) * 0.72 + random() * 0.16;
    const angle =
      topicAngle(domain) + radius * 3.4 + gauss() * (0.05 + 0.03 / radius);
    const thickness = 0.05 * (1 - radius * 0.6);
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = gauss() * thickness;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    colors.set(rgb(topicColor(domain)), i * 3);
    seeds[i] = random();
  });
  const mid = 0.62;
  return {
    n,
    positions,
    colors,
    seeds,
    ids: words.map((word) => word.id),
    index: new Map(words.map((word, i) => [word.id, i])),
    topicCenters: atlas.topics.map(([id]) => {
      const angle = topicAngle(id) + mid * 3.4;
      return [Math.cos(angle) * mid, 0, Math.sin(angle) * mid];
    }),
  };
}
