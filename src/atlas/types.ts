import type { ReadingCatalog } from "../reading/types";

export type Accent = "uk" | "us";
export type IndexRow = [string, string, string, string, number, number, number];
export interface ContentReview {
  status: "preview" | "approved" | "draft";
  human?: boolean;
  humanReviewed?: boolean;
  reviewer?: string;
  domainReviewer?: string;
  domainQualified?: boolean;
  contentHash?: string;
}
export interface Sense {
  id?: string;
  pos: string;
  fa: string;
  en: string;
  domainIds?: string[];
  review?: ContentReview;
}
export interface Example {
  en: string;
  fa: string;
  senseId?: string;
  context?: string;
}
export interface Entry {
  id: string;
  w: string;
  uk: string;
  us: string;
  senses: Sense[];
  ex: Example[];
  col: string[];
  fam: string[];
  syn: string[];
  ant: string[];
  tip: string;
  cefr: string;
  topic: string;
  domainIds?: string[];
  lexicalId?: string;
  note?: string;
  m: number;
  media?: {
    img?: string | null;
    uk?: string | null;
    us?: string | null;
    ex?: string | null;
    ex2?: string | null;
  };
  provenance?: { license?: string; source?: string; aiAssisted?: boolean };
}
export const MEDIA = { img: 1, uk: 2, us: 4, ex: 8, ex2: 16 } as const;
export interface WordRef {
  id: string;
  word: string;
  fa: string;
  ipa: string;
  cefr: number;
  topic: number;
  media: number;
  order: number;
  lexicalId?: string;
  senseIds?: string[];
  domainIds?: string[];
}
export interface Domain {
  id: string;
  labelEn: string;
  labelFa: string;
  subcategories: string[];
  subcategoryLabelsFa?: string[];
  discoveryGroupId: string;
  publicationStatus?: string;
}
export interface DiscoveryGroup {
  id: string;
  labelEn: string;
  labelFa: string;
  domainIds: string[];
}
export interface ReleaseInfo {
  id: string;
  channel: "preview" | "stable";
  schemaVersion: number;
  createdAt: string;
  manifestPath?: string;
  manifestHash?: string;
}
export interface Atlas {
  id: string;
  name: string;
  kind: "open" | "private";
  count: number;
  examples: number;
  illustrated: number;
  topics: [string, string][];
  cefr: string[];
  words: WordRef[];
  byId: Map<string, WordRef>;
  entry: (id: string) => Promise<Entry>;
  peek: (id: string) => Entry | undefined;
  img: (ref: WordRef | Entry, size?: "thumb" | "full") => string | null;
  audio: (
    ref: WordRef | Entry,
    kind: "uk" | "us" | "ex" | "ex2",
  ) => string | null;
  domains?: Domain[];
  discoveryGroups?: DiscoveryGroup[];
  release?: ReleaseInfo;
  learning?: Atlas;
  senseToLexical?: Map<string, string>;
  readings?: ReadingCatalog;
}
