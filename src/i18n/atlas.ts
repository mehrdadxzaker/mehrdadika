import type { Atlas, Entry, WordRef } from "../atlas/types";
import { resolveSessionAtlas } from "../atlas/data";
import type { ActiveSession } from "../store/store";
import type { PortugueseCatalog } from "../locales/types";
import { datasetForLocale, type UiLocale } from "./locale";
import { localizeReadingCatalog } from "./reading";

export type VocabularyLocale = Exclude<UiLocale, "fa">;
export type VocabularyCatalog = Omit<PortugueseCatalog, "locale"> & {
  locale: VocabularyLocale;
};
const catalogs = new Map<VocabularyLocale, Promise<VocabularyCatalog>>();
export async function loadVocabularyLocale(locale: VocabularyLocale) {
  let task = catalogs.get(locale);
  if (!task) {
    task = (
      locale === "pt-BR"
        ? import("../locales/published/pt-BR.json")
        : import("../locales/published/es-419.json")
    )
      .then((module) => module.default as unknown as VocabularyCatalog)
      .catch((error) => {
        catalogs.delete(locale);
        throw error;
      });
    catalogs.set(locale, task);
  }
  return task;
}

/** Translate display fields while keeping the English learning identity and media contract intact. */
export function localizeAtlas(
  base: Atlas,
  locale: UiLocale,
  catalog?: VocabularyCatalog,
): Atlas {
  if (locale === "fa") return base;
  if (!catalog || catalog.locale !== locale)
    throw new Error("A matching published translation snapshot is required");
  const translated = new Map<string, Entry>();
  const cachedSources = new Map<string, Entry>();
  const translateEntry = (source: Entry): Entry => {
    if (cachedSources.get(source.id) === source)
      return translated.get(source.id)!;
    const lexical =
      source.lexicalId ?? base.senseToLexical?.get(source.id) ?? source.id;
    const overlay = catalog.entries[lexical];
    if (!overlay || overlay.sourceWord !== source.w)
      throw new Error("This word is not published in this edition");
    const senses = source.senses
      .filter((sense) => !!sense.id && !!overlay.senses[sense.id])
      .map((sense) => ({ ...sense, fa: overlay.senses[sense.id!].gloss }));
    if (!senses.length)
      throw new Error("This meaning is not published in this edition");
    const native: Entry = {
      ...source,
      senses,
      ex: source.ex.flatMap((example) => {
        const translation = overlay.examples.find(
          (pair) => pair.en === example.en,
        );
        return translation ? [{ ...example, fa: translation.translation }] : [];
      }),
      col: source.col.flatMap((pair) => {
        const english = pair.split(/[｜|]/)[0].trim();
        const translation = overlay.collocations.find(
          (item) => item.en === english,
        );
        return translation ? [`${english}｜${translation.translation}`] : [];
      }),
      tip: overlay.tip,
      note: undefined,
    };
    cachedSources.set(source.id, source);
    translated.set(source.id, native);
    return native;
  };
  const localizePart = (part: Atlas): Atlas => {
    const words = part.words
      .flatMap((word) => {
        const lexical =
          word.lexicalId ?? base.senseToLexical?.get(word.id) ?? word.id;
        const overlay = catalog.entries[lexical];
        if (!overlay || overlay.sourceWord !== word.word) return [];
        const ids = (word.senseIds ?? []).filter((id) => !!overlay.senses[id]);
        if (!ids.length) return [];
        return [
          {
            ...word,
            senseIds: ids,
            fa: ids.map((id) => overlay.senses[id].gloss).join("; "),
          },
        ];
      })
      .map((word, order) => ({ ...word, order }));
    const allowed = new Set(words.map((word) => word.id));
    return {
      ...part,
      id: datasetForLocale(base.id, locale),
      name: "Mehrdadika",
      words,
      count: words.length,
      illustrated: words.filter((word) => word.media & 1).length,
      byId: new Map(words.map((word) => [word.id, word])),
      topics: part.topics.map(([id, english]) => [
        id,
        catalog.categories[id]?.label ??
          base.domains?.find((d) => d.id === id)?.labelEn ??
          english,
      ]),
      domains: part.domains?.map((domain) => ({
        ...domain,
        labelFa: catalog.categories[domain.id]?.label ?? domain.labelEn,
        subcategoryLabelsFa:
          catalog.categories[domain.id]?.subcategoryLabels ??
          domain.subcategories,
      })),
      discoveryGroups: part.discoveryGroups?.map((group) => ({
        ...group,
        labelFa: catalog.groupLabels[group.id] ?? group.labelEn,
      })),
      readings: part.readings
        ? localizeReadingCatalog(part.readings, locale)
        : part.readings,
      peek: (id) => {
        // The context also serves sense IDs from lexical/public components.
        const source = part.peek(id);
        if (!source) return undefined;
        try {
          return translateEntry(source);
        } catch {
          return undefined;
        }
      },
      entry: async (id) => {
        const lexical = base.senseToLexical?.get(id) ?? id;
        if (!allowed.has(id) && !base.byId.has(lexical))
          throw new Error("This word is not published in this edition");
        return translateEntry(await part.entry(id));
      },
      learning: undefined,
    };
  };
  const atlas = localizePart(base);
  if (base.learning) atlas.learning = localizePart(base.learning);
  return atlas;
}

export function translatedLexicalIds(
  catalog: VocabularyCatalog,
  words: WordRef[],
) {
  return new Set(
    words
      .filter((word) => catalog.entries[word.id]?.sourceWord === word.word)
      .map((word) => word.id),
  );
}

/** Resolve the pinned English release before adding the edition's progress namespace. */
export async function resolveLocalizedSessionAtlas(
  base: Atlas,
  session: ActiveSession | null,
  locale: UiLocale,
  catalog?: VocabularyCatalog,
) {
  const restored = await resolveSessionAtlas(base, session);
  const atlas = localizeAtlas(restored.atlas, locale, catalog);
  const eligible = (atlas.learning ?? atlas).byId;
  const missingNativeBinding =
    session &&
    !session.finished &&
    session.steps
      .slice(session.index)
      .some(
        (step) =>
          !eligible.has(step.id) ||
          ("options" in step && step.options?.some((id) => !eligible.has(id))),
      );
  if (restored.unavailable || missingNativeBinding) {
    return {
      atlas:
        restored.atlas === base ? atlas : localizeAtlas(base, locale, catalog),
      unavailable: true,
    };
  }
  return {
    atlas,
    unavailable: false,
  };
}
