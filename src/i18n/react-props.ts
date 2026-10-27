import {
  currentUiLocale,
  localizedHref,
  uiDirection,
  type UiLocale,
} from "./locale";
import { tr } from "./messages";

const textProps = [
  "title",
  "alt",
  "placeholder",
  "aria-label",
  "aria-description",
  "label",
] as const;
function children(value: unknown, locale: UiLocale): unknown {
  if (typeof value === "string") return tr(value, locale);
  if (Array.isArray(value))
    return value.map((child) => children(child, locale));
  return value;
}
/** A small JSX runtime boundary: no DOM rewriting, input-value mutation, or translated data keys. */
export function localizeReactProps<P>(
  props: P,
  locale: UiLocale = currentUiLocale(),
): P {
  if (!props || typeof props !== "object") return props;
  const original = props as Record<string, unknown>;
  const next = { ...original };
  if (!original["data-native-copy"]) {
    if (locale !== "fa" && "children" in next)
      next.children = children(next.children, locale);
    for (const key of textProps)
      if (typeof next[key] === "string") next[key] = tr(next[key], locale);
  }
  if (typeof next.href === "string")
    next.href = localizedHref(
      next.href,
      locale,
      !!original["data-locale-link"],
    );
  if (locale !== "fa" && !original["data-native-copy"]) {
    if (next.lang === "fa") next.lang = locale;
    if (next.dir === "rtl") next.dir = uiDirection(locale);
  }
  return next as P;
}
