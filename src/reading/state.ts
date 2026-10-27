import { useSyncExternalStore } from "react";
import {
  freshReadingState,
  READING_STATE_KEY,
  sanitizeReadingState,
  type ReadingState,
} from "./model";

export type ReadingLocale = "fa" | "pt-BR" | "es-419";
let locale: ReadingLocale = "fa";
export function readingStorageKey(value: ReadingLocale) {
  return value === "fa" ? READING_STATE_KEY : `mehrdadika:reading:${value}:v1`;
}
const cachedStates = new Map<ReadingLocale, ReadingState>();
const saveErrors = new Map<ReadingLocale, boolean>();

function load() {
  if (saveErrors.get(locale) && cachedStates.has(locale))
    return cachedStates.get(locale)!;
  try {
    if (typeof window === "undefined")
      return cachedStates.get(locale) ?? freshReadingState();
    return sanitizeReadingState(
      JSON.parse(
        window.localStorage.getItem(readingStorageKey(locale)) || "null",
      ),
    );
  } catch {
    return cachedStates.get(locale) ?? freshReadingState();
  }
}
let state = typeof window === "undefined" ? freshReadingState() : load();
let saveError = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

/** Switch reader/quiz state with the interface edition; existing Persian data stays under its original key. */
export function setReadingLocale(next: ReadingLocale) {
  if (!["fa", "pt-BR", "es-419"].includes(next) || next === locale) return;
  cachedStates.set(locale, state);
  saveErrors.set(locale, saveError);
  locale = next;
  state = load();
  saveError = saveErrors.get(locale) ?? false;
  emit();
}
export function updateReading(update: (current: ReadingState) => ReadingState) {
  state = sanitizeReadingState(update(state));
  cachedStates.set(locale, state);
  try {
    if (typeof window !== "undefined")
      window.localStorage.setItem(
        readingStorageKey(locale),
        JSON.stringify(state),
      );
    saveError = false;
  } catch {
    saveError = true;
  }
  emit();
}
export function useReadingState() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state,
  );
}
export function readingSaveError() {
  return saveError;
}
export function readingSnapshot() {
  return state;
}
export function restoreReading(value: unknown) {
  updateReading(() => sanitizeReadingState(value));
}
if (typeof window !== "undefined")
  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== readingStorageKey(locale)) return;
    if (event.key === null) cachedStates.clear();
    saveErrors.delete(locale);
    state = load();
    saveError = false;
    cachedStates.set(locale, state);
    emit();
  });
