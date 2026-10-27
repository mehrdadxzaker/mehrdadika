import { useSyncExternalStore } from "react";
import type { Accent } from "../atlas/types";
import type { CardState, Grade } from "./srs";
import { persistOperation, readProgress } from "../lib/persistence";
import { readingSnapshot, restoreReading } from "../reading/state";

export type QuizKind = "meaning" | "picture" | "listen" | "spell";
export type Step =
  | { id: string; kind: "intro" }
  | { id: string; kind: QuizKind; retry?: boolean; options?: string[] };

export interface ActiveSession {
  id: string;
  started: number;
  releaseId?: string;
  manifestPath?: string;
  manifestHash?: string;
  steps: Step[];
  index: number;
  /** First-attempt grade per word; retries never change it. */
  graded: Record<string, Grade>;
  newIds: string[];
  reviewIds: string[];
  /** Answer shown but not yet continued; survives reload without double counting. */
  pending?: { correct: boolean; value: string };
  finished?: number;
}

export interface DayStat {
  n: number; // new words met
  r: number; // graded reviews (first attempts)
  c: number; // correct first attempts
  t: number; // active seconds
}

export interface TypingRound {
  at: number;
  mode: "word" | "sentence" | "dictation";
  items: number;
  wpm: number;
  accuracy: number;
}

export interface Progress {
  version: 2;
  datasetId: string;
  cards: Record<string, CardState>;
  bookmarks: string[];
  days: Record<string, DayStat>;
  typing: TypingRound[];
  session: ActiveSession | null;
  /** Rolling list of recent mistakes, newest first. */
  mistakes: string[];
}

export interface Settings {
  accent: Accent;
  autoplay: boolean;
  dailyNew: number;
  retention: number;
  theme: "system" | "light" | "dark";
  sfx: boolean;
  spell: boolean;
  startLevel: number;
  onboarded: boolean;
  dataset: "open" | "private";
  ambience:
    "off" | "stars" | "rain" | "sea" | "forest" | "fire" | "voyage" | "cafe";
  ambienceVolume: number;
  splash: boolean;
  topic: string;
  examDate: string;
  targetScore: number;
}

export const defaultSettings: Settings = {
  accent: "uk",
  autoplay: true,
  dailyNew: 10,
  retention: 0.9,
  theme: "light",
  sfx: true,
  spell: true,
  startLevel: 0,
  onboarded: false,
  dataset: "open",
  ambience: "off",
  ambienceVolume: 0.45,
  splash: true,
  topic: "all",
  examDate: "",
  targetScore: 6.5,
};

export const emptyProgress = (datasetId: string): Progress => ({
  version: 2,
  datasetId,
  cards: {},
  bookmarks: [],
  days: {},
  typing: [],
  session: null,
  mistakes: [],
});

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const SETTINGS_KEY = "mehrdadika:settings";
const progressKey = (id: string) => `mehrdadika:v2:${id}`;

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown) {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/* ---------- validation (backups and stored data are untrusted) ---------- */

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const safeKey = (key: string) =>
  key.length > 0 &&
  key.length <= 160 &&
  !["__proto__", "constructor", "prototype"].includes(key);
const num = (v: unknown, lo = -Infinity, hi = Infinity) =>
  typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;

function validCard(v: unknown): v is CardState {
  return (
    isObj(v) &&
    num(v.due, 0) &&
    num(v.s, 0) &&
    num(v.d, 0, 11) &&
    num(v.el, 0) &&
    num(v.sd, 0) &&
    num(v.ls, 0) &&
    num(v.reps, 0) &&
    num(v.lapses, 0) &&
    [0, 1, 2, 3].includes(v.st as number) &&
    (v.last === undefined || num(v.last, 0)) &&
    num(v.seen, 0)
  );
}

export function sanitizeProgress(v: unknown, datasetId: string): Progress {
  const out = emptyProgress(datasetId);
  if (!isObj(v) || v.version !== 2) return out;
  if (isObj(v.cards))
    for (const [k, c] of Object.entries(v.cards))
      if (safeKey(k) && validCard(c)) out.cards[k] = c;
  if (Array.isArray(v.bookmarks))
    out.bookmarks = v.bookmarks
      .filter((x): x is string => typeof x === "string" && safeKey(x))
      .slice(0, 20000);
  if (Array.isArray(v.mistakes))
    out.mistakes = v.mistakes
      .filter((x): x is string => typeof x === "string" && safeKey(x))
      .slice(0, 300);
  if (isObj(v.days))
    for (const [k, d] of Object.entries(v.days))
      if (
        /^\d{4}-\d{2}-\d{2}$/.test(k) &&
        isObj(d) &&
        num(d.n, 0) &&
        num(d.r, 0) &&
        num(d.c, 0) &&
        num(d.t, 0)
      )
        out.days[k] = {
          n: d.n as number,
          r: d.r as number,
          c: d.c as number,
          t: d.t as number,
        };
  if (Array.isArray(v.typing))
    out.typing = v.typing
      .filter(
        (t): t is TypingRound =>
          isObj(t) &&
          num(t.at, 0) &&
          ["word", "sentence", "dictation"].includes(t.mode as string) &&
          num(t.items, 0) &&
          num(t.wpm, 0, 400) &&
          num(t.accuracy, 0, 100),
      )
      .slice(-500);
  const session = v.session;
  const validStep = (step: unknown): step is Step =>
    isObj(step) &&
    typeof step.id === "string" &&
    safeKey(step.id) &&
    ["intro", "meaning", "picture", "listen", "spell"].includes(
      step.kind as string,
    ) &&
    (step.options === undefined ||
      (Array.isArray(step.options) &&
        step.options.length <= 20 &&
        step.options.every((id) => typeof id === "string" && safeKey(id))));
  if (
    isObj(session) &&
    typeof session.id === "string" &&
    safeKey(session.id) &&
    num(session.started, 0) &&
    Array.isArray(session.steps) &&
    session.steps.length <= 2000 &&
    session.steps.every(validStep) &&
    num(session.index, 0, session.steps.length) &&
    isObj(session.graded) &&
    Object.entries(session.graded).every(
      ([key, grade]) => safeKey(key) && [1, 2, 3, 4].includes(grade as number),
    ) &&
    Array.isArray(session.newIds) &&
    session.newIds.every((id) => typeof id === "string" && safeKey(id)) &&
    Array.isArray(session.reviewIds) &&
    session.reviewIds.every((id) => typeof id === "string" && safeKey(id))
  ) {
    const clean: ActiveSession = {
      id: session.id,
      started: session.started as number,
      steps: session.steps,
      index: Math.floor(session.index as number),
      graded: { ...session.graded } as Record<string, Grade>,
      newIds: session.newIds as string[],
      reviewIds: session.reviewIds as string[],
    };
    if (typeof session.releaseId === "string" && safeKey(session.releaseId))
      clean.releaseId = session.releaseId;
    if (
      typeof session.manifestPath === "string" &&
      /^content\/releases\/[a-zA-Z0-9._-]+\/manifest\.json$/.test(
        session.manifestPath,
      )
    )
      clean.manifestPath = session.manifestPath;
    if (
      typeof session.manifestHash === "string" &&
      /^[a-f0-9]{64}$/.test(session.manifestHash)
    )
      clean.manifestHash = session.manifestHash;
    if (
      isObj(session.pending) &&
      typeof session.pending.correct === "boolean" &&
      typeof session.pending.value === "string"
    )
      clean.pending = {
        correct: session.pending.correct,
        value: session.pending.value.slice(0, 2000),
      };
    if (num(session.finished, 0)) clean.finished = session.finished as number;
    out.session = clean;
  }
  return out;
}

export function sanitizeSettings(v: unknown): Settings {
  const s = { ...defaultSettings };
  if (!isObj(v)) return s;
  if (v.accent === "uk" || v.accent === "us") s.accent = v.accent;
  if (typeof v.autoplay === "boolean") s.autoplay = v.autoplay;
  if (num(v.dailyNew, 0, 100)) s.dailyNew = Math.round(v.dailyNew as number);
  if (num(v.retention, 0.7, 0.97)) s.retention = v.retention as number;
  if (v.theme === "system" || v.theme === "light" || v.theme === "dark")
    s.theme = v.theme;
  if (typeof v.sfx === "boolean") s.sfx = v.sfx;
  if (typeof v.spell === "boolean") s.spell = v.spell;
  if (num(v.startLevel, 0, 5))
    s.startLevel = Math.round(v.startLevel as number);
  if (typeof v.onboarded === "boolean") s.onboarded = v.onboarded;
  if (v.dataset === "open" || v.dataset === "private") s.dataset = v.dataset;
  if (
    [
      "off",
      "stars",
      "rain",
      "sea",
      "forest",
      "fire",
      "voyage",
      "cafe",
    ].includes(v.ambience as string)
  )
    s.ambience = v.ambience as Settings["ambience"];
  if (num(v.ambienceVolume, 0, 1))
    s.ambienceVolume = v.ambienceVolume as number;
  if (typeof v.splash === "boolean") s.splash = v.splash;
  if (
    typeof v.topic === "string" &&
    (v.topic === "all" || /^[a-z0-9-]{1,80}$/.test(v.topic))
  )
    s.topic = v.topic;
  if (
    typeof v.examDate === "string" &&
    (v.examDate === "" || /^\d{4}-\d{2}-\d{2}$/.test(v.examDate))
  )
    s.examDate = v.examDate;
  if (num(v.targetScore, 0, 9)) s.targetScore = v.targetScore as number;
  return s;
}

/* ---------- store ---------- */

interface State {
  progress: Progress;
  settings: Settings;
  saveError: boolean;
}

let state: State = {
  progress: emptyProgress("mehrdadika-en-fa"),
  settings: sanitizeSettings(read(SETTINGS_KEY)),
  saveError: false,
};
const listeners = new Set<() => void>();
let saveTimer: number | undefined;
/** Only write when this tab changed something, so idle tabs never clobber newer data. */
let dirty = false;
/** Progress is written only after it has been read from storage for this dataset. */
let loadedId: string | null = null;
let pendingWrites: Promise<unknown> = Promise.resolve();
let loadingVersion = 0;
let mutationVersion = 0;
let idbFailed = false;
const channel =
  typeof window !== "undefined" && typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("mehrdadika-progress")
    : null;
channel?.addEventListener("message", async (event) => {
  if (event.data?.datasetId !== state.progress.datasetId) return;
  const version = mutationVersion;
  try {
    await pendingWrites;
    const saved = await readProgress(state.progress.datasetId);
    if (saved && mutationVersion === version) {
      state = {
        ...state,
        progress: sanitizeProgress(saved, state.progress.datasetId),
      };
      emit();
    }
  } catch {
    /* this tab will retry on its next save */
  }
});
function enqueueProgress(before: Progress, after: Progress, replace = false) {
  const gradedId =
    after.session && before.session?.id === after.session.id
      ? Object.keys(after.session.graded).find(
          (id) => !(id in (before.session?.graded ?? {})),
        )
      : undefined;
  const id = gradedId
    ? `${after.session!.id}:${gradedId}`
    : `change-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const version = ++mutationVersion;
  pendingWrites = pendingWrites
    .catch(() => null)
    .then(() => persistOperation({ id, before, after, replace }))
    .then((saved) => {
      idbFailed = false;
      if (
        state.progress.datasetId === saved.datasetId &&
        mutationVersion === version
      ) {
        state = {
          ...state,
          progress: sanitizeProgress(saved, saved.datasetId),
          saveError: false,
        };
        emit();
      }
      channel?.postMessage({ datasetId: saved.datasetId });
    })
    .catch(() => {
      idbFailed = true;
      state = { ...state, saveError: true };
      emit();
    });
}

function emit() {
  listeners.forEach((l) => l());
}

function scheduleSave() {
  dirty = true;
  if (typeof window !== "undefined") {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(flush, 250);
  }
}

export function flush() {
  if (typeof window !== "undefined") window.clearTimeout(saveTimer);
  if (!dirty) return;
  dirty = false;
  const progressOk =
    loadedId !== state.progress.datasetId ||
    write(progressKey(state.progress.datasetId), state.progress);
  const ok = progressOk && write(SETTINGS_KEY, state.settings) && !idbFailed;
  if (ok === state.saveError) {
    state = { ...state, saveError: !ok };
    emit();
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flush);
  document.addEventListener(
    "visibilitychange",
    () => document.visibilityState === "hidden" && flush(),
  );
  // Another tab saved: adopt its data instead of keeping a stale copy.
  window.addEventListener("storage", (e) => {
    if (!e.newValue) return;
    try {
      if (e.key === SETTINGS_KEY)
        state = {
          ...state,
          settings: sanitizeSettings(JSON.parse(e.newValue)),
        };
      else if (
        typeof indexedDB === "undefined" &&
        e.key === progressKey(state.progress.datasetId)
      )
        state = {
          ...state,
          progress: sanitizeProgress(
            JSON.parse(e.newValue),
            state.progress.datasetId,
          ),
        };
      else return;
      emit();
    } catch {
      /* ignore malformed writes */
    }
  });
}

export const store = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  async useDataset(datasetId: string) {
    flush();
    await pendingWrites;
    const generation = ++loadingVersion;
    const local = sanitizeProgress(read(progressKey(datasetId)), datasetId);
    try {
      const persisted = await readProgress(datasetId);
      if (generation !== loadingVersion) return;
      state = {
        ...state,
        progress: sanitizeProgress(persisted ?? local, datasetId),
      };
      if (!persisted && Object.keys(local.cards).length)
        enqueueProgress(emptyProgress(datasetId), local, true);
    } catch {
      idbFailed = true;
      state = { ...state, progress: local, saveError: true };
    }
    loadedId = datasetId;
    emit();
  },
  settled: () => pendingWrites,
  progress(fn: (p: Progress) => Progress) {
    const before = state.progress;
    const after = fn(before);
    if (after === before) return;
    state = { ...state, progress: after };
    enqueueProgress(before, after);
    emit();
    scheduleSave();
  },
  settings(patch: Partial<Settings>) {
    state = { ...state, settings: { ...state.settings, ...patch } };
    emit();
    scheduleSave();
  },
};

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => select(state),
    () => select(state),
  );
}

export function bumpDay(p: Progress, patch: Partial<DayStat>): Progress {
  const k = dayKey();
  const d = p.days[k] ?? { n: 0, r: 0, c: 0, t: 0 };
  return {
    ...p,
    days: {
      ...p.days,
      [k]: {
        n: d.n + (patch.n ?? 0),
        r: d.r + (patch.r ?? 0),
        c: d.c + (patch.c ?? 0),
        t: d.t + (patch.t ?? 0),
      },
    },
  };
}

export function toggleBookmark(id: string) {
  store.progress((p) => ({
    ...p,
    bookmarks: p.bookmarks.includes(id)
      ? p.bookmarks.filter((x) => x !== id)
      : [id, ...p.bookmarks],
  }));
}

/* ---------- backup ---------- */

export function exportBackup() {
  flush();
  const { progress, settings } = state;
  return JSON.stringify(
    {
      app: "mehrdadika",
      version: 2,
      exported: new Date().toISOString(),
      reading: readingSnapshot(),
      progress: { ...progress, session: null },
      settings,
    },
    null,
    1,
  );
}

function markDirty() {
  dirty = true;
}

export function importBackup(
  text: string,
): { ok: true; cards: number } | { ok: false; error: string } {
  let data: unknown;
  if (text.length > 10 * 1024 * 1024)
    return { ok: false, error: "فایل پشتیبان بیش از حد بزرگ است." };
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "ساختار فایل پشتیبان معتبر نیست." };
  }
  if (
    !isObj(data) ||
    data.app !== "mehrdadika" ||
    data.version !== 2 ||
    !isObj(data.progress)
  )
    return { ok: false, error: "این فایل، پشتیبان مهردادیکا نیست." };
  const id = state.progress.datasetId;
  if (data.progress.datasetId !== id)
    return {
      ok: false,
      error: "این پشتیبان متعلق به مجموعهٔ واژگان دیگری است.",
    };
  const progress = sanitizeProgress({ ...data.progress, session: null }, id);
  const before = state.progress;
  state = {
    ...state,
    progress,
    settings: { ...sanitizeSettings(data.settings), onboarded: true },
  };
  enqueueProgress(before, progress, true);
  if (data.reading !== undefined) restoreReading(data.reading);
  emit();
  markDirty();
  flush();
  return { ok: true, cards: Object.keys(progress.cards).length };
}

export function resetProgress() {
  const before = state.progress;
  const progress = emptyProgress(state.progress.datasetId);
  state = { ...state, progress };
  enqueueProgress(before, progress, true);
  restoreReading(null);
  emit();
  markDirty();
  flush();
}
