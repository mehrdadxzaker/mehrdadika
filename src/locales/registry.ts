export type InterfaceLocale = "fa" | "pt-BR";
export type PlannedLocale = "pt-PT";

export interface LocaleDefinition {
  id: InterfaceLocale | PlannedLocale;
  nativeName: string;
  englishName: string;
  direction: "rtl" | "ltr";
  href: string | null;
  status: "available" | "preview" | "planned";
}

/** Add a reviewed pt-PT overlay and edition route before making its registry entry selectable. */
export const localeRegistry: readonly LocaleDefinition[] = [
  {
    id: "fa",
    nativeName: "فارسی",
    englishName: "Persian",
    direction: "rtl",
    href: "#/",
    status: "available",
  },
  {
    id: "pt-BR",
    nativeName: "Português (Brasil)",
    englishName: "Brazilian Portuguese",
    direction: "ltr",
    href: "#/pt-BR",
    status: "preview",
  },
  {
    id: "pt-PT",
    nativeName: "Português (Portugal)",
    englishName: "European Portuguese",
    direction: "ltr",
    href: null,
    status: "planned",
  },
];

export function resolveInterfaceLocale(value: unknown): InterfaceLocale {
  if (typeof value !== "string") return "fa";
  const normalized = value.replace(/_/g, "-").toLowerCase();
  return normalized === "pt" || normalized === "pt-br" ? "pt-BR" : "fa";
}

export function normalizePortugueseSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}

export interface PortugueseRoute {
  topic: string;
  query: string;
  word: string | null;
  saved: boolean;
}

export function parsePortugueseRoute(hash: string): PortugueseRoute {
  const query = hash.split("?", 2)[1] ?? "";
  const params = new URLSearchParams(query);
  return {
    topic: params.get("topic")?.slice(0, 100) || "all",
    query: params.get("q")?.slice(0, 200) || "",
    word: params.get("w")?.slice(0, 120) || null,
    saved: params.get("saved") === "1",
  };
}

export function portugueseHref(route: Partial<PortugueseRoute> = {}): string {
  const query = new URLSearchParams();
  if (route.topic && route.topic !== "all") query.set("topic", route.topic);
  if (route.query) query.set("q", route.query);
  if (route.word) query.set("w", route.word);
  if (route.saved) query.set("saved", "1");
  return `#/pt-BR${query.size ? `?${query}` : ""}`;
}

export const PORTUGUESE_BOOKMARK_KEY = "mehrdadika:pt-BR:bookmarks:v1";

export function parsePortugueseBookmarks(
  raw: string | null,
  eligibleIds: ReadonlySet<string>,
): string[] {
  if (!raw || raw.length > 100_000) return [];
  try {
    const value = JSON.parse(raw);
    if (
      value?.version !== 1 ||
      value.locale !== "pt-BR" ||
      !Array.isArray(value.ids)
    )
      return [];
    const ids: unknown[] = value.ids;
    return [
      ...new Set(
        ids.filter(
          (id): id is string => typeof id === "string" && eligibleIds.has(id),
        ),
      ),
    ].slice(0, 10_000);
  } catch {
    return [];
  }
}

export function serializePortugueseBookmarks(ids: readonly string[]): string {
  return JSON.stringify({
    version: 1,
    locale: "pt-BR",
    ids: [...new Set(ids)].slice(0, 10_000),
  });
}
