import type { BookChapter, ReadingItem, TruthAnswer } from "./types";

export const READING_STATE_KEY = "mehrdadika:reading:v1";
export interface ReadingState {
  version: 1;
  bilingual: boolean;
  fontScale: number;
  bookmarks: string[];
  positions: Record<string, number>;
  sentenceAnchors: Record<string, string>;
  lastBookChapters: Record<string, string>;
  completed: string[];
  answers: Record<string, string>;
  practiceAnswers: Record<string, number>;
  lastPassage?: string;
}
export const freshReadingState = (): ReadingState => ({
  version: 1,
  bilingual: true,
  fontScale: 1,
  bookmarks: [],
  positions: {},
  sentenceAnchors: {},
  lastBookChapters: {},
  completed: [],
  answers: {},
  practiceAnswers: {},
});
const plainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const safeId = (id: string) =>
  /^[a-zA-Z0-9:._/-]{1,180}$/.test(id) &&
  !["__proto__", "constructor", "prototype"].includes(id);

export function sanitizeReadingState(value: unknown): ReadingState {
  const out = freshReadingState();
  if (!plainObject(value) || value.version !== 1) return out;
  if (typeof value.bilingual === "boolean") out.bilingual = value.bilingual;
  if (typeof value.fontScale === "number" && Number.isFinite(value.fontScale))
    out.fontScale = Math.min(1.5, Math.max(0.85, value.fontScale));
  for (const key of ["bookmarks", "completed"] as const)
    if (Array.isArray(value[key]))
      out[key] = value[key]
        .filter((id): id is string => typeof id === "string" && safeId(id))
        .slice(-1000);
  for (const key of ["positions", "practiceAnswers"] as const) {
    if (plainObject(value[key]))
      for (const [id, n] of Object.entries(value[key]).slice(-3000))
        if (
          safeId(id) &&
          typeof n === "number" &&
          Number.isInteger(n) &&
          n >= 0 &&
          n < 10000
        )
          out[key][id] = n;
  }
  if (plainObject(value.answers))
    for (const [id, answer] of Object.entries(value.answers).slice(-3000))
      if (safeId(id) && ["true", "false", "not-given"].includes(String(answer)))
        out.answers[id] = String(answer);
  for (const key of ["sentenceAnchors", "lastBookChapters"] as const)
    if (plainObject(value[key]))
      for (const [id, anchor] of Object.entries(value[key]).slice(-1000))
        if (safeId(id) && typeof anchor === "string" && safeId(anchor))
          out[key][id] = anchor;
  if (typeof value.lastPassage === "string" && safeId(value.lastPassage))
    out.lastPassage = value.lastPassage;
  return out;
}

export function recordComprehension(
  state: ReadingState,
  passage: ReadingItem,
  questionId: string,
  answer: TruthAnswer,
): ReadingState {
  const question = passage.questions.find((q) => q.id === questionId);
  if (!question || state.answers[`${passage.id}:${questionId}`]) return state;
  const answers = { ...state.answers, [`${passage.id}:${questionId}`]: answer };
  const finished =
    passage.questions.length > 0 &&
    passage.questions.every((q) => answers[`${passage.id}:${q.id}`]);
  return {
    ...state,
    answers,
    completed: finished
      ? [...new Set([...state.completed, passage.id])].slice(-1000)
      : state.completed,
  };
}

export function sentenceList(item: ReadingItem | BookChapter) {
  return item.paragraphs.flatMap((p) => p.sentences);
}
export function chapterPosition(state: ReadingState, chapter: BookChapter) {
  const sentences = sentenceList(chapter);
  const anchor = state.sentenceAnchors[chapter.id];
  const anchored = anchor
    ? sentences.findIndex((sentence) => sentence.id === anchor)
    : -1;
  return anchored >= 0
    ? anchored
    : Math.max(
        0,
        Math.min(sentences.length - 1, state.positions[chapter.id] ?? 0),
      );
}
export function rememberParagraph(
  state: ReadingState,
  chapter: BookChapter,
  paragraphId: string,
): ReadingState {
  const paragraph = chapter.paragraphs.find((item) => item.id === paragraphId);
  const sentenceId = paragraph?.sentences[0]?.id;
  if (!sentenceId) return state;
  const position = sentenceList(chapter).findIndex(
    (sentence) => sentence.id === sentenceId,
  );
  return {
    ...state,
    positions: { ...state.positions, [chapter.id]: position },
    sentenceAnchors: { ...state.sentenceAnchors, [chapter.id]: sentenceId },
  };
}
export function practiceScore(
  answers: Record<string, number>,
  scope: string,
  questions: { id: string; answer: number }[],
) {
  const answered = questions.filter((q) =>
    Number.isInteger(answers[`${scope}:${q.id}`]),
  );
  return {
    answered: answered.length,
    correct: answered.filter((q) => answers[`${scope}:${q.id}`] === q.answer)
      .length,
    total: questions.length,
  };
}
