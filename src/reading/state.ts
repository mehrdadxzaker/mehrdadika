import { useSyncExternalStore } from "react";
import {
  freshReadingState,
  READING_STATE_KEY,
  sanitizeReadingState,
  type ReadingState,
} from "./model";

function load() {
  try {
    if (typeof window === "undefined") return freshReadingState();
    return sanitizeReadingState(
      JSON.parse(window.localStorage.getItem(READING_STATE_KEY) || "null"),
    );
  } catch {
    return freshReadingState();
  }
}
let state = typeof window === "undefined" ? freshReadingState() : load();
let saveError = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
export function updateReading(update: (current: ReadingState) => ReadingState) {
  state = sanitizeReadingState(update(state));
  try {
    if (typeof window !== "undefined")
      window.localStorage.setItem(READING_STATE_KEY, JSON.stringify(state));
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
    if (event.key !== READING_STATE_KEY) return;
    state = load();
    emit();
  });
