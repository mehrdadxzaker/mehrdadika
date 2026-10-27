import { currentUiLocale, uiIntlLocale, type UiLocale } from "./i18n/locale";
export const faNumber = (n: number) => n.toLocaleString(uiIntlLocale());
export function wordCount(count: number, locale: UiLocale = currentUiLocale()) {
  const number = count.toLocaleString(uiIntlLocale(locale));
  return locale === "fa"
    ? `${number} واژه`
    : locale === "pt-BR"
      ? `${number} ${count === 1 ? "palavra" : "palavras"}`
      : `${number} ${count === 1 ? "palabra" : "palabras"}`;
}
export function minuteUnit(
  count: number,
  locale: UiLocale = currentUiLocale(),
) {
  return locale === "fa" ? "دقیقه" : count === 1 ? "minuto" : "minutos";
}
export function minuteCount(
  count: number,
  locale: UiLocale = currentUiLocale(),
) {
  return `${count.toLocaleString(uiIntlLocale(locale))} ${minuteUnit(count, locale)}`;
}
export function streakCount(
  count: number,
  locale: UiLocale = currentUiLocale(),
) {
  const number = count.toLocaleString(uiIntlLocale(locale));
  return locale === "fa"
    ? `${number} روز پیوسته`
    : locale === "pt-BR"
      ? `${number} ${count === 1 ? "dia seguido" : "dias seguidos"}`
      : `${number} ${count === 1 ? "día seguido" : "días seguidos"}`;
}
export const normalizeSearch = (text: string) =>
  (currentUiLocale() === "fa"
    ? text.normalize("NFKC")
    : text.normalize("NFKD").replace(/\p{M}/gu, "")
  )
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[\u200c\u200d\s]+/g, " ")
    .trim();
export const levelNames = [
  "آغازین",
  "پایه",
  "متوسط",
  "فراتر از متوسط",
  "پیشرفته",
  "تسلط",
];
