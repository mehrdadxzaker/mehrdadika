import { useSyncExternalStore } from "react";
import { transition } from "./motion";
import {
  currentUiLocale,
  localeFromHash,
  localizedHref,
  stripLocaleHash,
  type UiLocale,
} from "../i18n/locale";

export type Route =
  | { page: "today" }
  | {
      page: "atlas";
      topic?: string;
      level?: string;
      q?: string;
      view?: string;
      status?: string;
    }
  | { page: "learn" }
  | { page: "practice" }
  | { page: "me" }
  | { page: "about" }
  | { page: "portuguese" }
  | { page: "read"; id?: string; tab?: "short" | "books" }
  | { page: "books"; book: string; chapter?: number }
  | { page: "paraphrase"; id?: string }
  | { page: "confuse"; id?: string };
export interface Location {
  route: Route;
  word: string | null;
  locale: UiLocale;
}
const decode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};
export function parseRouteLocation(hash: string): Location {
  const locale = localeFromHash(hash);
  const [path, query = ""] = stripLocaleHash(hash).replace(/^#/, "").split("?");
  const params = new URLSearchParams(query);
  const word = params.get("w")?.slice(0, 160) || null;
  const seg = path.split("/").filter(Boolean);
  let route: Route = { page: "today" };
  if (
    seg[0] === "atlas" ||
    (!seg.length &&
      locale !== "fa" &&
      (params.has("q") || params.has("topic") || params.has("saved")))
  )
    route = {
      page: "atlas",
      topic: params.get("topic") || undefined,
      level: params.get("level") || undefined,
      q: params.get("q")?.slice(0, 200) || undefined,
      view: params.get("view") || undefined,
      status:
        params.get("saved") === "1"
          ? "saved"
          : params.get("status") || undefined,
    };
  else if (seg[0] === "learn") route = { page: "learn" };
  else if (seg[0] === "practice") route = { page: "practice" };
  else if (seg[0] === "me") route = { page: "me" };
  else if (seg[0] === "about") route = { page: "about" };
  else if (seg[0] === "read")
    route = {
      page: "read",
      id: params.get("id") || undefined,
      tab: params.get("tab") === "books" ? "books" : "short",
    };
  else if (seg[0] === "books" && seg[1])
    route = {
      page: "books",
      book: decode(seg[1]),
      chapter: seg[2] && /^\d+$/.test(seg[2]) ? Number(seg[2]) : undefined,
    };
  else if (seg[0] === "paraphrase" || seg[0] === "confuse")
    route = { page: seg[0], id: params.get("id") || undefined };
  else if (seg[0] === "w" && seg[1])
    return { route: { page: "atlas" }, word: decode(seg[1]), locale };
  return { route, word, locale };
}
export function href(
  route: Route,
  word?: string | null,
  locale: UiLocale = currentUiLocale(),
) {
  if (route.page === "portuguese") return "#/pt-BR";
  const params = new URLSearchParams();
  if (route.page === "atlas") {
    if (route.topic) params.set("topic", route.topic);
    if (route.level) params.set("level", route.level);
    if (route.q) params.set("q", route.q);
    if (route.view) params.set("view", route.view);
    if (route.status) params.set("status", route.status);
  }
  if (route.page === "read") {
    if (route.id) params.set("id", route.id);
    if (route.tab) params.set("tab", route.tab);
  }
  if ((route.page === "paraphrase" || route.page === "confuse") && route.id)
    params.set("id", route.id);
  if (word) params.set("w", word);
  const path =
    route.page === "today"
      ? ""
      : route.page === "books"
        ? `books/${encodeURIComponent(route.book)}${route.chapter ? `/${route.chapter}` : ""}`
        : route.page;
  return localizedHref(`#/${path}${params.size ? `?${params}` : ""}`, locale);
}
let loc = parseRouteLocation(
  typeof location === "undefined" ? "#/" : location.hash,
);
const subs = new Set<() => void>();
const syncLocation = () => {
  const next = parseRouteLocation(location.hash);
  const changed =
    next.route.page !== loc.route.page || next.locale !== loc.locale;
  const update = () => {
    loc = next;
    subs.forEach((f) => f());
  };
  if (changed && !next.word) transition(update);
  else update();
};
if (typeof window !== "undefined") {
  window.addEventListener("hashchange", syncLocation);
  window.addEventListener("popstate", syncLocation);
}
export const useLocation = () =>
  useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => loc,
    () => loc,
  );
export function go(route: Route, word?: string | null, replace = false) {
  const h = href(route, word);
  if (replace) history.replaceState(null, "", h);
  else history.pushState(null, "", h);
  const next = parseRouteLocation(h);
  const changed =
    next.route.page !== loc.route.page || next.locale !== loc.locale;
  const update = () => {
    loc = next;
    subs.forEach((f) => f());
  };
  if (changed && !replace) transition(update);
  else update();
}
export const openWord = (id: string) => go(loc.route, id);
export const closeWord = () => go(loc.route, null);
export const currentLocation = () => loc;
