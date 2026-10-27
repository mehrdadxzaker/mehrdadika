export type Publication = "draft" | "preview" | "published";
export interface EditorialReview {
  status: string;
  humanReviewed: boolean;
  reviewer?: string;
  reviewedAt?: string;
  domainReviewer?: string;
  domainQualified?: boolean;
  contentHash?: string;
}
export interface Sentence {
  id: string;
  en: string;
  fa: string;
}
export interface Paragraph {
  id: string;
  sentences: Sentence[];
}
export type TruthAnswer = "true" | "false" | "not-given";
export interface ComprehensionQuestion {
  id: string;
  statement: string;
  answer: TruthAnswer;
  explanationFa: string;
}
export interface ReadingItem {
  id: string;
  titleEn: string;
  titleFa: string;
  level: string;
  domainId: string;
  minutes: number;
  targetWords: string[];
  paragraphs: Paragraph[];
  questions: ComprehensionQuestion[];
  publication: Publication;
  review: EditorialReview;
}
export interface BookChapter extends ReadingItem {
  number: number;
}
export interface ReadingBook {
  id: string;
  titleEn: string;
  titleFa: string;
  author: string;
  summaryFa: string;
  level: string;
  chapters: BookChapter[];
  publication: Publication;
  review: EditorialReview;
}
export interface ParaphraseQuestion {
  id: string;
  source: string;
  target: string;
  prompt: string;
  options: string[];
  answer: number;
  explanationFa: string;
}
export interface ParaphraseLevel {
  id: string;
  titleFa: string;
  level: string;
  questions: ParaphraseQuestion[];
  publication: Publication;
  review: EditorialReview;
}
export interface ConfusableWord {
  word: string;
  meaningFa: string;
  explanationFa: string;
  exampleEn: string;
  exampleFa: string;
}
export interface ConfusableQuestion {
  id: string;
  sentence: string;
  answer: number;
  explanationFa: string;
}
export interface ConfusableGroup {
  id: string;
  level: string;
  differenceFa: string;
  tipFa: string;
  words: ConfusableWord[];
  questions: ConfusableQuestion[];
  publication: Publication;
  review: EditorialReview;
}
export interface ReadingCatalog {
  schemaVersion: number;
  channel: "preview" | "stable";
  provenance: { license: string; aiAssisted: boolean; [key: string]: unknown };
  passages: ReadingItem[];
  books: ReadingBook[];
  paraphrases: ParaphraseLevel[];
  confusables: ConfusableGroup[];
}
export type ReadingRoute =
  | { page: "read"; id?: string; tab?: "short" | "books" }
  | { page: "books"; book: string; chapter?: number };
export const emptyReadingCatalog: ReadingCatalog = {
  schemaVersion: 1,
  channel: "preview",
  provenance: { license: "CC-BY-4.0", aiAssisted: true },
  passages: [],
  books: [],
  paraphrases: [],
  confusables: [],
};
