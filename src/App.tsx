import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  Github,
  Keyboard,
  Library,
  Moon,
  Search,
  Sun,
  User,
} from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AtlasContext, useAtlas, useEntry } from "./atlas/context";
import { loadOpenAtlas, loadPrivateAtlas } from "./atlas/data";
import type { Atlas } from "./atlas/types";
import { REPO_URL } from "./config";
import { datasetForLocale, uiDirection, type UiLocale } from "./i18n/locale";
import { loadUiMessages } from "./i18n/messages";
import {
  loadVocabularyLocale,
  resolveLocalizedSessionAtlas,
} from "./i18n/atlas";
import {
  localeRegistry,
  parsePortugueseBookmarks,
  PORTUGUESE_BOOKMARK_KEY,
} from "./locales/registry";
import { setReadingLocale } from "./reading/state";
import "./i18n/localized.css";
import {
  closeWord,
  currentLocation,
  go,
  openWord,
  useLocation,
  type Route,
} from "./lib/router";
import { AtlasPage } from "./pages/Atlas";
import { About } from "./pages/About";
import { Learn } from "./pages/Learn";
import { Me } from "./pages/Me";
import { Onboarding } from "./pages/Onboarding";
import { Practice } from "./pages/Practice";
import { Today } from "./pages/Today";
import { cue } from "./lib/sound";
import { flush, store, useStore } from "./store/store";
import { EntryView } from "./ui/EntryView";
import { AmbienceController, AmbiencePicker } from "./ui/Ambience";
import { Logo } from "./ui/Logo";
import { Palette } from "./ui/Palette";
import { Sheet } from "./ui/Sheet";
import { shouldShowSplash, Splash } from "./ui/Splash";
import { Toasts, toast } from "./ui/Toast";

const NAV: { page: Route["page"]; label: string; icon: typeof Compass }[] = [
  { page: "today", label: "امروز", icon: Compass },
  { page: "atlas", label: "اطلس", icon: BookOpen },
  { page: "read", label: "کتابخانه", icon: Library },
  { page: "practice", label: "تمرین", icon: Keyboard },
  { page: "me", label: "من", icon: User },
];
const Reading = lazy(() =>
  import("./pages/Reading").then((m) => ({ default: m.Reading })),
);
const Paraphrase = lazy(() =>
  import("./pages/Paraphrase").then((m) => ({ default: m.Paraphrase })),
);
const Confusables = lazy(() =>
  import("./pages/Confusables").then((m) => ({ default: m.Confusables })),
);

function useTheme() {
  const theme = useStore((s) => s.settings.theme);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    const dark =
      theme === "dark" ||
      (theme === "system" &&
        matchMedia("(prefers-color-scheme: dark)").matches);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#0D1120" : "#F6F1E7");
  }, [theme]);
  return theme;
}

export default function App() {
  const { locale } = useLocation();
  const [loadedLocale, setLoadedLocale] = useState<UiLocale | null>(null);
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const [open, setOpen] = useState<Atlas | null>(null);
  const [priv, setPriv] = useState<Atlas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dataset = useStore((s) => s.settings.dataset);
  useTheme();

  useEffect(() => {
    loadOpenAtlas().then(
      (a) => {
        setOpen(a);
        if (import.meta.env.DEV) loadPrivateAtlas(a).then(setPriv, () => null);
      },
      (e: Error) => setError(e.message),
    );
  }, []);

  useEffect(() => {
    const next = dataset === "private" && priv ? priv : open;
    if (!next) return;
    let live = true;
    setError(null);
    void (async () => {
      await loadUiMessages(locale);
      const vocabulary =
        locale === "fa" ? undefined : await loadVocabularyLocale(locale);
      if (!live) return;
      await store.useDataset(datasetForLocale(next.id, locale));
      if (!live) return;
      const restored = await resolveLocalizedSessionAtlas(
        next,
        store.get().progress.session,
        locale,
        vocabulary,
      );
      if (!live) return;
      if (restored.unavailable) {
        store.progress((p) => ({ ...p, session: null }));
        toast(
          "محتوای مسیر قبلی در دسترس نیست؛ پاسخ‌های ثبت‌شدهٔ شما حفظ شده‌اند.",
        );
      }
      setReadingLocale(locale);
      const localized = restored.atlas;
      if (locale === "pt-BR") await migratePortugueseBookmarks(localized);
      if (!live) return;
      setAtlas(localized);
      setLoadedLocale(locale);
    })().catch((error) => {
      if (live)
        setError(
          error instanceof Error ? error.message : "Content unavailable",
        );
    });
    return () => {
      live = false;
    };
  }, [dataset, open, priv, locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = uiDirection(locale);
    document.documentElement.setAttribute("data-interface-locale", locale);
    document.title =
      locale === "fa"
        ? "مهردادیکا · اطلس تصویری واژه‌ها"
        : locale === "pt-BR"
          ? "Mehrdadika · Atlas visual de inglês"
          : "Mehrdadika · Atlas visual de inglés";
  }, [locale]);

  if (error)
    return (
      <div className="boot">
        <Logo />
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => location.reload()}>
          تلاش دوباره
        </button>
      </div>
    );
  if (!atlas || loadedLocale !== locale)
    return (
      <div className="boot" aria-busy="true">
        <Logo />
        <span className="spinner" />
      </div>
    );
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus({ preventScroll: true });
          window.scrollTo({ top: 0 });
        }}
      >
        رفتن به محتوای اصلی
      </a>
      <AtlasContext.Provider value={atlas}>
        <Shell key={locale} privateAvailable={!!priv} />
      </AtlasContext.Provider>
    </>
  );
}

function Shell({ privateAvailable }: { privateAvailable: boolean }) {
  const { route, word, locale } = useLocation();
  const onboarded = useStore((s) => s.settings.onboarded);
  const theme = useStore((s) => s.settings.theme);
  const [palette, setPalette] = useState(false);
  const [splash, setSplash] = useState(shouldShowSplash);
  const focus =
    route.page === "learn" || (route.page === "books" && !!route.chapter);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.tagName === "INPUT" || t.tagName === "TEXTAREA";
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      } else if (e.key === "/" && !typing && !focus) {
        e.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [focus]);

  useEffect(() => {
    if (!word) window.scrollTo({ top: 0 });
  }, [route.page]); // eslint-disable-line react-hooks/exhaustive-deps

  const dark =
    theme === "dark" ||
    (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div className={`app ${focus ? "is-focus" : ""}`}>
      {!focus && (
        <header className="topbar">
          <a
            className="topbar-logo"
            href="#/"
            aria-label="مهردادیکا، صفحهٔ اصلی"
          >
            <Logo />
          </a>
          <nav className="topnav" aria-label="راهبری اصلی">
            {NAV.map(({ page, label }) => (
              <a
                key={page}
                href={page === "today" ? "#/" : `#/${page}`}
                className={route.page === page ? "is-on" : ""}
                aria-current={route.page === page ? "page" : undefined}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="topbar-tools">
            <details className="edition-switch">
              <summary
                className="language-link"
                aria-label={
                  locale === "fa"
                    ? "زبان"
                    : locale === "pt-BR"
                      ? "Idioma"
                      : "Idioma"
                }
              >
                {locale === "fa" ? "FA" : locale === "pt-BR" ? "PT" : "ES"}
              </summary>
              <div>
                {localeRegistry
                  .filter((item) => item.href)
                  .map((item) => (
                    <a
                      key={item.id}
                      href={item.href!}
                      lang={item.id}
                      dir={item.direction}
                      data-locale-link
                      data-native-copy
                      aria-current={item.id === locale ? "true" : undefined}
                    >
                      {item.nativeName}
                    </a>
                  ))}
              </div>
            </details>
            <button
              className="search-pill"
              onClick={() => setPalette(true)}
              aria-label="جست‌وجوی واژه"
            >
              <Search size={17} />
              <span>جست‌وجوی واژه</span>
              <kbd>⌘K</kbd>
            </button>
            <AmbiencePicker />
            <button
              className="icon-btn"
              onClick={() => store.settings({ theme: dark ? "light" : "dark" })}
              aria-label={dark ? "نمای روشن" : "نمای تیره"}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <a
              className="icon-btn hide-sm"
              href="#/about"
              aria-label="درباره و متن‌باز"
              title="درباره و متن‌باز"
            >
              <Github size={19} />
            </a>
          </div>
        </header>
      )}

      <main className="main" id="main" tabIndex={-1}>
        <Suspense
          fallback={
            <div className="boot" aria-label="در حال بارگذاری">
              <span className="spinner" />
            </div>
          }
        >
          {route.page === "today" && <Today />}
          {route.page === "atlas" && <AtlasPage route={route} />}
          {route.page === "learn" && <Learn />}
          {route.page === "practice" && <Practice />}
          {route.page === "me" && <Me privateAvailable={privateAvailable} />}
          {route.page === "about" && <About />}
          {(route.page === "read" || route.page === "books") && (
            <Reading route={route} />
          )}
          {route.page === "paraphrase" && <Paraphrase id={route.id} />}
          {route.page === "confuse" && <Confusables id={route.id} />}
        </Suspense>
      </main>

      {!focus && (
        <footer className="footer">
          <Logo compact />
          <p>
            هر واژه، یک تصویر · آزاد و متن‌باز ·{" "}
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              کد و مشارکت
            </a>{" "}
            · <a href="#/about">درباره</a>
          </p>
        </footer>
      )}

      {!focus && (
        <nav className="tabbar" aria-label="راهبری اصلی">
          {NAV.map(({ page, label, icon: Icon }) => (
            <a
              key={page}
              href={page === "today" ? "#/" : `#/${page}`}
              className={route.page === page ? "is-on" : ""}
              aria-current={route.page === page ? "page" : undefined}
            >
              <Icon size={22} strokeWidth={route.page === page ? 2.1 : 1.7} />
              <span>{label}</span>
            </a>
          ))}
        </nav>
      )}

      <WordSheet id={word} />
      <Palette open={palette} onClose={() => setPalette(false)} />
      {!onboarded && route.page !== "about" && !splash && <Onboarding />}
      {splash && <Splash onDone={() => setSplash(false)} />}
      <Toasts />
      <AmbienceController />
    </div>
  );
}

function WordSheet({ id }: { id: string | null }) {
  const atlas = useAtlas();
  const opened = id !== null;
  useEffect(() => {
    if (opened && store.get().settings.sfx) void cue("page");
  }, [opened]);
  const { entry, error } = useEntry(id);
  const ref = id ? atlas.byId.get(id) : undefined;
  const neighbor = useCallback(
    (d: number) => {
      if (!ref) return;
      const n = atlas.words[ref.order + d];
      if (n) go(currentLocation().route, n.id, true);
    },
    [atlas, ref],
  );
  useEffect(() => {
    if (!id) return;
    const on = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowLeft") neighbor(-1);
      if (e.key === "ArrowRight") neighbor(1);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [id, neighbor]);
  return (
    <Sheet
      open={!!id}
      onClose={closeWord}
      label={ref ? `واژهٔ ${ref.word}` : "واژه"}
      wide
    >
      {entry ? (
        <EntryView key={entry.id} entry={entry} />
      ) : error ? (
        <p className="sheet-error">{error}</p>
      ) : (
        <span className="spinner" />
      )}
      {ref && (
        <nav className="sheet-nav" aria-label="جابه‌جایی بین واژه‌ها">
          <button
            className="icon-btn"
            onClick={() => neighbor(-1)}
            disabled={ref.order === 0}
            aria-label="واژهٔ قبلی"
          >
            <ChevronLeft size={20} />
          </button>
          <span>
            {(ref.order + 1).toLocaleString()} / {atlas.count.toLocaleString()}
          </span>
          <button
            className="icon-btn"
            onClick={() => neighbor(1)}
            disabled={ref.order >= atlas.count - 1}
            aria-label="واژهٔ بعدی"
          >
            <ChevronRight size={20} />
          </button>
        </nav>
      )}
    </Sheet>
  );
}

export { openWord };

async function migratePortugueseBookmarks(atlas: Atlas) {
  const marker = `mehrdadika:pt-BR:bookmarks-migrated:${atlas.id}`;
  try {
    if (localStorage.getItem(marker) === "1") return;
    const ids = parsePortugueseBookmarks(
      localStorage.getItem(PORTUGUESE_BOOKMARK_KEY),
      new Set(atlas.words.map((word) => word.id)),
    );
    if (ids.length)
      store.progress((p) => ({
        ...p,
        bookmarks: [...new Set([...p.bookmarks, ...ids])],
      }));
    await store.settled();
    flush();
    if (!store.get().saveError) localStorage.setItem(marker, "1");
  } catch {
    /* Original preview data remains available if migration storage is unavailable. */
  }
}
