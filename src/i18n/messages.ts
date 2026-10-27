import { currentUiLocale, type UiLocale } from "./locale";

type Messages = Record<string, string>;
const loaded = new Map<UiLocale, Messages>();
const pending = new Map<UiLocale, Promise<void>>();
const fragments = new Map<UiLocale, RegExp>();
const arabic = /[\u0600-\u06ff]/;
const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function loadUiMessages(locale: UiLocale) {
  if (locale === "fa" || loaded.has(locale)) return;
  let task = pending.get(locale);
  if (!task) {
    task = (
      locale === "pt-BR"
        ? import("./messages.pt-BR.json")
        : import("./messages.es-419.json")
    )
      .then((module) => {
        const catalog = module.default as Messages;
        loaded.set(locale, catalog);
        const keys = Object.keys(catalog)
          .sort((a, b) => b.length - a.length)
          .map(escape);
        fragments.set(locale, new RegExp(keys.join("|"), "g"));
      })
      .catch((error) => {
        pending.delete(locale);
        throw error;
      });
    pending.set(locale, task);
  }
  await task;
}

/** Persian source copy acts as a gettext-style message ID. Translation happens before React renders. */
export function tr(
  value: string,
  locale: UiLocale = currentUiLocale(),
): string {
  if (locale === "fa" || !arabic.test(value)) return value;
  const catalog = loaded.get(locale);
  if (!catalog) return value;
  const source = clean(value);
  const exact = catalog[source];
  if (exact !== undefined)
    return `${value.match(/^\s*/)?.[0] ?? ""}${exact}${value.match(/\s*$/)?.[0] ?? ""}`;
  const expression = fragments.get(locale)!;
  return value
    .replace(expression, (match) => catalog[match] ?? match)
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/؛/g, ";")
    .replace(/،/g, ",")
    .replace(/٪/g, "%");
}

export function isUiCatalogLoaded(locale: UiLocale) {
  return locale === "fa" || loaded.has(locale);
}
