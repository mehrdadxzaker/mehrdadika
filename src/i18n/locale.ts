export type UiLocale = "fa" | "pt-BR" | "es-419";
export const supportedUiLocales: readonly UiLocale[] = [
  "fa",
  "pt-BR",
  "es-419",
];

export function localeFromHash(hash: string): UiLocale {
  const first = hash.replace(/^#\/?/, "").split(/[/?]/, 1)[0];
  return first === "pt-BR" || first === "es-419" ? first : "fa";
}
export function currentUiLocale(): UiLocale {
  return typeof location === "undefined" ? "fa" : localeFromHash(location.hash);
}
export function uiIntlLocale(locale: UiLocale = currentUiLocale()) {
  return locale === "fa" ? "fa-IR" : locale;
}
export function uiDirection(
  locale: UiLocale = currentUiLocale(),
): "rtl" | "ltr" {
  return locale === "fa" ? "rtl" : "ltr";
}
export function datasetForLocale(id: string, locale: UiLocale) {
  return locale === "fa" ? id : `${id}:${locale}`;
}
/** Keep explicit edition links intact; ordinary in-app links remain inside the selected edition. */
export function localizedHref(
  href: string,
  locale: UiLocale = currentUiLocale(),
  explicit = false,
) {
  if (
    explicit ||
    locale === "fa" ||
    !href.startsWith("#/") ||
    /^#\/(?:pt-BR|es-419)(?:[/?]|$)/.test(href)
  )
    return href;
  return `#/${locale}${href.slice(1)}`;
}
export function stripLocaleHash(hash: string) {
  return hash
    .replace(/^#\/(?:pt-BR|es-419)(?=\/|\?|$)/, "#")
    .replace(/^#(?=\?|$)/, "#/");
}
