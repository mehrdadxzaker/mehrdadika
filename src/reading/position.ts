import { sentenceList } from "./model";
import type { BookChapter } from "./types";

/** Scrolling tracks paragraphs, but must not discard an exact sentence resume point inside one. */
export function observedParagraphPosition(
  chapter: BookChapter,
  paragraphId: string,
  currentPosition: number,
): number | undefined {
  const paragraph = chapter.paragraphs.find((item) => item.id === paragraphId);
  const sentences = sentenceList(chapter);
  const current = sentences[currentPosition];
  if (
    !paragraph?.sentences.length ||
    paragraph.sentences.some((sentence) => sentence.id === current?.id)
  )
    return;
  const next = sentences.findIndex(
    (sentence) => sentence.id === paragraph.sentences[0].id,
  );
  return next >= 0 ? next : undefined;
}
