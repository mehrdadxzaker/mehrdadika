import { currentUiLocale, uiIntlLocale, type UiLocale } from "../i18n/locale";

function readingCount(
  count: number,
  unit: "minute" | "chapter",
  locale: UiLocale,
) {
  const one =
    new Intl.PluralRules(uiIntlLocale(locale)).select(count) === "one";
  const label =
    locale === "fa"
      ? unit === "minute"
        ? "دقیقه"
        : "فصل"
      : unit === "minute"
        ? one
          ? "minuto"
          : "minutos"
        : one
          ? "capítulo"
          : "capítulos";
  return `${count.toLocaleString(uiIntlLocale(locale))} ${label}`;
}

export function readingMinutes(count: number, locale = currentUiLocale()) {
  return readingCount(count, "minute", locale);
}
export function readingChapterCount(count: number, locale = currentUiLocale()) {
  return readingCount(count, "chapter", locale);
}
