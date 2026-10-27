import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  ChevronDown,
  Compass,
  Github,
  Languages,
  Search,
  Volume2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useAtlas } from "../atlas/context";
import type { Atlas, Entry, WordRef } from "../atlas/types";
import { REPO_URL, UPSTREAM_URL } from "../config";
import { play, stopAudio } from "../lib/audio";
import {
  availablePortugueseWords,
  matchesPortugueseSearch,
  portugueseCatalog,
  portugueseCategoryLabel,
  portugueseGloss,
} from "../locales/portuguese";
import {
  localeRegistry,
  normalizePortugueseSearch,
  parsePortugueseBookmarks,
  parsePortugueseRoute,
  PORTUGUESE_BOOKMARK_KEY,
  portugueseHref,
  serializePortugueseBookmarks,
  type PortugueseRoute,
} from "../locales/registry";
import { Illustration } from "../ui/Illustration";
import "../styles/portuguese.css";

const subscribeLocation = (listener: () => void) => {
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  return () => {
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
  };
};

function navigatePortuguese(patch: Partial<PortugueseRoute>, replace = false) {
  const href = portugueseHref({
    ...parsePortugueseRoute(location.hash),
    ...patch,
  });
  if (replace) history.replaceState(null, "", href);
  else history.pushState(null, "", href);
  window.dispatchEvent(new Event("hashchange"));
}

function usePortugueseMetadata() {
  useEffect(() => {
    const root = document.documentElement;
    const skip = document.querySelector<HTMLAnchorElement>(".skip-link");
    const previous = {
      lang: root.lang,
      dir: root.dir,
      title: document.title,
      locale: root.getAttribute("data-interface-locale"),
      skip: skip?.textContent,
    };
    root.lang = "pt-BR";
    root.dir = "ltr";
    root.setAttribute("data-interface-locale", "pt-BR");
    document.title = "Mehrdadika · Atlas visual de inglês";
    const focusMain = (event: MouseEvent) => {
      event.preventDefault();
      document.getElementById("main")?.focus({ preventScroll: true });
      window.scrollTo({ top: 0 });
    };
    if (skip) {
      skip.textContent = "Ir para o conteúdo principal";
      skip.addEventListener("click", focusMain);
    }
    return () => {
      stopAudio();
      root.lang = previous.lang;
      root.dir = previous.dir;
      document.title = previous.title;
      if (previous.locale)
        root.setAttribute("data-interface-locale", previous.locale);
      else root.removeAttribute("data-interface-locale");
      if (skip) {
        skip.textContent = previous.skip ?? "";
        skip.removeEventListener("click", focusMain);
      }
    };
  }, []);
}

function readSaved(eligibleIds: ReadonlySet<string>) {
  try {
    return parsePortugueseBookmarks(
      localStorage.getItem(PORTUGUESE_BOOKMARK_KEY),
      eligibleIds,
    );
  } catch {
    return [];
  }
}

export function Portuguese() {
  const atlas = useAtlas();
  usePortugueseMetadata();
  const hash = useSyncExternalStore(
    subscribeLocation,
    () => location.hash,
    () => "#/pt-BR",
  );
  const route = parsePortugueseRoute(hash);
  const words = useMemo(() => availablePortugueseWords(atlas.words), [atlas]);
  const eligibleIds = useMemo(
    () => new Set(words.map((word) => word.id)),
    [words],
  );
  const [saved, setSaved] = useState(() => readSaved(eligibleIds));
  const [message, setMessage] = useState("");
  const [level, setLevel] = useState("all");
  const [categoryQuery, setCategoryQuery] = useState("");
  const categories = useRef<HTMLDetailsElement>(null);
  const savedIds = useMemo(() => new Set(saved), [saved]);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const word of words)
      for (const id of word.domainIds ?? [])
        map.set(id, (map.get(id) ?? 0) + 1);
    return map;
  }, [words]);
  const visible = useMemo(
    () =>
      words.filter(
        (word) =>
          (route.topic === "all" || word.domainIds?.includes(route.topic)) &&
          (level === "all" || atlas.cefr[word.cefr] === level) &&
          (!route.saved || savedIds.has(word.id)) &&
          matchesPortugueseSearch(word, route.query),
      ),
    [words, route.topic, route.saved, route.query, savedIds, level, atlas.cefr],
  );
  const selectedWord = route.word
    ? words.find((word) => word.id === route.word)
    : null;
  const close = useCallback(() => navigatePortuguese({ word: null }, true), []);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === PORTUGUESE_BOOKMARK_KEY || event.key === null)
        setSaved(readSaved(eligibleIds));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [eligibleIds]);

  const toggleSaved = (id: string) => {
    const current = new Set(message ? saved : readSaved(eligibleIds));
    if (current.has(id)) current.delete(id);
    else current.add(id);
    const next = [...current];
    setSaved(next);
    try {
      localStorage.setItem(
        PORTUGUESE_BOOKMARK_KEY,
        serializePortugueseBookmarks(next),
      );
      setMessage("");
    } catch {
      setMessage(
        "Não foi possível salvar neste navegador. As alterações desta visita podem não ser mantidas.",
      );
    }
  };
  const chooseCategory = (id: string) => {
    navigatePortuguese({ topic: id, word: null });
    if (categories.current) {
      categories.current.open = false;
      categories.current.querySelector("summary")?.focus();
    }
  };
  const categoryMatches = (id: string) =>
    !categoryQuery ||
    normalizePortugueseSearch(portugueseCategoryLabel(id)).includes(
      normalizePortugueseSearch(categoryQuery),
    );

  return (
    <div className="pt-edition" lang="pt-BR" dir="ltr">
      <header className="pt-topbar">
        <a
          className="pt-brand"
          href="#/pt-BR"
          aria-label="Mehrdadika, início da edição em português"
        >
          <Compass size={28} strokeWidth={1.3} />
          <span>
            <strong>Mehrdadika</strong>
            <small>Atlas visual de inglês</small>
          </span>
        </a>
        <nav className="pt-topnav" aria-label="Navegação principal">
          <a href="#/pt-BR" aria-current="page">
            <BookOpen size={16} /> Atlas
          </a>
          <a href={portugueseHref({ saved: true })}>
            <Bookmark size={15} /> Salvas <span>{saved.length}</span>
          </a>
        </nav>
        <details className="pt-languages">
          <summary>
            <Languages size={16} />
            <span>Português (Brasil)</span>
            <ChevronDown size={14} />
          </summary>
          <div>
            {localeRegistry.map((locale) =>
              locale.id === "pt-BR" ? (
                <span key={locale.id} aria-current="true">
                  {locale.nativeName} · prévia
                </span>
              ) : locale.href ? (
                <a
                  key={locale.id}
                  href={locale.href}
                  lang={locale.id}
                  dir={locale.direction}
                >
                  {locale.nativeName}
                </a>
              ) : (
                <span key={locale.id} aria-disabled="true">
                  {locale.nativeName} · em preparação
                </span>
              ),
            )}
          </div>
        </details>
      </header>
      <main id="main" className="pt-main" tabIndex={-1}>
        <div className="pt-preview-note">
          <span className="pt-preview-badge">Português · prévia</span>
          <p>
            Uma nova edição, em construção. Explore as palavras em inglês com
            traduções em português brasileiro.
          </p>
        </div>
        <section className="pt-atlas-intro">
          <div>
            <p className="pt-eyebrow">CADA PALAVRA, UMA IMAGEM</p>
            <h1>
              Veja as palavras.
              <br />
              <em>Encontre-as na vida.</em>
            </h1>
            <p>
              Inglês e português, lado a lado. Uma coleção que cresce com você.
            </p>
          </div>
          <form
            className="pt-search"
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <Search size={19} />
            <input
              type="search"
              aria-label="Buscar palavras em inglês ou português"
              placeholder="Busque em inglês ou português"
              value={route.query}
              onChange={(event) =>
                navigatePortuguese(
                  { query: event.target.value, word: null },
                  true,
                )
              }
            />
            {route.query && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => navigatePortuguese({ query: "" }, true)}
              >
                <X size={16} />
              </button>
            )}
          </form>
        </section>
        <div className="pt-coverage">
          <span>
            <strong>{words.length}</strong> palavras na prévia
          </span>
          <span>
            <strong>32</strong> categorias em expansão
          </span>
          <span>Pronúncia britânica e americana</span>
        </div>
        <details className="pt-category-picker" ref={categories}>
          <summary>
            <span>
              {route.topic === "all"
                ? "Explore todas as categorias"
                : portugueseCategoryLabel(route.topic)}
              <small>32 áreas para descobrir</small>
            </span>
            <ChevronDown size={19} />
          </summary>
          <div className="pt-category-content">
            <label className="pt-category-search">
              <Search size={17} />
              <input
                aria-label="Buscar categorias"
                placeholder="Buscar uma categoria"
                value={categoryQuery}
                onChange={(event) => setCategoryQuery(event.target.value)}
              />
            </label>
            <button
              className="pt-all-categories"
              onClick={() => chooseCategory("all")}
            >
              Todas as palavras publicadas
            </button>
            {(atlas.discoveryGroups ?? []).map((group) => {
              const ids = group.domainIds.filter(categoryMatches);
              if (!ids.length) return null;
              return (
                <section className="pt-category-group" key={group.id}>
                  <h2>
                    {portugueseCatalog.groupLabels[group.id] ??
                      "Mais categorias"}
                  </h2>
                  <div>
                    {ids.map((id) => (
                      <button
                        key={id}
                        onClick={() => chooseCategory(id)}
                        aria-pressed={route.topic === id}
                      >
                        <strong>{portugueseCategoryLabel(id)}</strong>
                        <span>
                          {counts.get(id)
                            ? `${counts.get(id)} ${counts.get(id) === 1 ? "palavra" : "palavras"}`
                            : "Em preparação"}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
            {categoryQuery &&
              !(atlas.domains ?? []).some((domain) =>
                categoryMatches(domain.id),
              ) && <p>Nenhuma categoria encontrada. Tente outra palavra.</p>}
          </div>
        </details>
        <div className="pt-filters">
          <div className="pt-tabs" aria-label="Filtrar palavras">
            <button
              aria-pressed={!route.saved}
              className={!route.saved ? "is-selected" : ""}
              onClick={() => navigatePortuguese({ saved: false })}
            >
              Todas
            </button>
            <button
              aria-pressed={route.saved}
              className={route.saved ? "is-selected" : ""}
              onClick={() => navigatePortuguese({ saved: true })}
            >
              <Bookmark size={14} /> Salvas
            </button>
          </div>
          <label>
            Nível{" "}
            <select
              aria-label="Nível de inglês"
              value={level}
              onChange={(event) => setLevel(event.target.value)}
            >
              <option value="all">Todos os níveis</option>
              {atlas.cefr.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <p aria-live="polite">
            {visible.length} {visible.length === 1 ? "palavra" : "palavras"}
          </p>
        </div>
        {route.topic !== "all" && (
          <div className="pt-selected-category">
            <h2>{portugueseCategoryLabel(route.topic)}</h2>
            <button onClick={() => chooseCategory("all")}>
              Ver todas as categorias <X size={14} />
            </button>
          </div>
        )}
        {message && (
          <p role="status" className="pt-message">
            {message}
          </p>
        )}
        {route.word && !selectedWord && (
          <p role="status" className="pt-message">
            Esta palavra ainda não está disponível nesta edição.{" "}
            <a href={portugueseHref({ ...route, word: null })}>
              Voltar ao atlas
            </a>
          </p>
        )}
        {visible.length ? (
          <ul className="pt-word-grid">
            {visible.map((word) => (
              <li key={word.id}>
                <a
                  className="pt-word-tile"
                  href={portugueseHref({ ...route, word: word.id })}
                  aria-label={`Abrir ${word.word}: ${portugueseGloss(word)}`}
                >
                  <div className="pt-tile-art">
                    <Illustration
                      src={atlas.img(word, "thumb")}
                      word={word.word}
                      topic={word.topic}
                    />
                    {savedIds.has(word.id) && (
                      <span className="pt-saved-dot" aria-label="Palavra salva">
                        <Bookmark size={14} fill="currentColor" />
                      </span>
                    )}
                  </div>
                  <div className="pt-tile-caption">
                    <span className="pt-word" lang="en">
                      {word.word}
                    </span>
                    <span className="pt-cefr">{atlas.cefr[word.cefr]}</span>
                    <p>{portugueseGloss(word)}</p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <section className="pt-empty">
            <img src={`${import.meta.env.BASE_URL}brand/empty.webp`} alt="" />
            <h2>
              {route.saved
                ? "Suas próximas descobertas ficam aqui."
                : (counts.get(route.topic) ?? 0) === 0 && route.topic !== "all"
                  ? "Esta coleção está ganhando forma."
                  : "Nenhuma palavra por aqui ainda."}
            </h2>
            <p>
              {route.saved
                ? "Abra uma palavra e toque no marcador para guardá-la."
                : "O conteúdo é publicado aos poucos. Explore outras categorias ou ajuste a busca."}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setLevel("all");
                navigatePortuguese({ topic: "all", query: "", saved: false });
              }}
            >
              Explorar a coleção
            </button>
          </section>
        )}
        <section className="pt-preview-details">
          <h2>Um começo em português.</h2>
          <p>
            Esta prévia oferece busca, categorias, cartões bilíngues, pronúncia
            e palavras salvas neste navegador. As traduções tiveram apoio de IA
            e ainda aguardam revisão humana. As aulas com revisão espaçada e a
            biblioteca em português virão em etapas posteriores.
          </p>
          <p>
            Vocabulário de medicina e engenharia também é uma prévia editorial.
            As palavras salvas desta edição ficam separadas do histórico da
            edição em persa.
          </p>
        </section>
      </main>
      <footer className="pt-footer">
        <a className="pt-footer-brand" href="#/pt-BR">
          Mehrdadika
        </a>
        <p>
          Imagens, áudio e vocabulário adaptados de{" "}
          <a href={UPSTREAM_URL}>Word Atlas contributors</a> ·{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.
          Traduções modificadas.
        </p>
        {REPO_URL.startsWith("https://") && (
          <a href={REPO_URL}>
            <Github size={16} /> Código aberto e contribuições
          </a>
        )}
      </footer>
      {selectedWord && (
        <PortugueseWordDialog
          key={selectedWord.id}
          atlas={atlas}
          word={selectedWord}
          saved={savedIds.has(selectedWord.id)}
          onSave={() => toggleSaved(selectedWord.id)}
          onClose={close}
        />
      )}
    </div>
  );
}

function PortugueseWordDialog({
  atlas,
  word,
  saved,
  onSave,
  onClose,
}: {
  atlas: Atlas;
  word: WordRef;
  saved: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [entry, setEntry] = useState<Entry | undefined>(() =>
    atlas.peek(word.id),
  );
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const translation = portugueseCatalog.entries[word.id];
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    document.documentElement.classList.add("is-locked");
    return () => {
      element?.close();
      document.documentElement.classList.remove("is-locked");
      previous?.focus?.({ preventScroll: true });
      stopAudio();
    };
  }, []);
  useEffect(() => {
    let live = true;
    setError(false);
    atlas.entry(word.id).then(
      (value) => {
        if (live) setEntry(value);
      },
      () => {
        if (live) setError(true);
      },
    );
    return () => {
      live = false;
    };
  }, [atlas, word.id, retry]);
  return (
    <dialog
      className="pt-word-dialog"
      ref={dialog}
      aria-label={`Palavra: ${word.word}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom
        )
          onClose();
      }}
    >
      <button
        className="pt-dialog-close"
        aria-label="Fechar palavra"
        onClick={onClose}
      >
        <X size={20} />
      </button>
      <div className="pt-word-layout">
        <div className="pt-dialog-art">
          <Illustration
            src={atlas.img(word, "full")}
            word={word.word}
            topic={word.topic}
            alt={`Ilustração educativa de ${word.word}`}
            eager
          />
          <p>Mehrdadika · {String(word.order + 1).padStart(4, "0")}</p>
        </div>
        <div className="pt-word-body">
          <div className="pt-word-meta">
            <span className="pt-cefr">{atlas.cefr[word.cefr]}</span>
            <span>
              {portugueseCategoryLabel(atlas.domains?.[word.topic]?.id ?? "")}
            </span>
            <span className="pt-preview-badge">Prévia</span>
            <button
              className={`pt-save ${saved ? "is-saved" : ""}`}
              aria-label={saved ? "Remover dos salvos" : "Salvar palavra"}
              aria-pressed={saved}
              onClick={onSave}
            >
              <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
          <h2 className="pt-headword" lang="en">
            {word.word}
          </h2>
          {entry ? (
            <>
              <div className="pt-pronunciation">
                <PortugueseAudio
                  url={atlas.audio(entry, "uk")}
                  text={entry.w}
                  accent="uk"
                  ipa={entry.uk}
                />
                <PortugueseAudio
                  url={atlas.audio(entry, "us")}
                  text={entry.w}
                  accent="us"
                  ipa={entry.us}
                />
              </div>
              <ul className="pt-senses">
                {entry.senses.map((sense) => {
                  const localized = sense.id
                    ? translation.senses[sense.id]
                    : null;
                  return localized ? (
                    <li key={sense.id}>
                      <span className="pt-pos" lang="en">
                        {sense.pos}
                      </span>
                      <div>
                        <h3>{localized.gloss}</h3>
                        <p>{localized.definition}</p>
                        <p className="pt-definition-en" lang="en">
                          {sense.en}
                        </p>
                        {entry.senses.length > 1 && (
                          <small>
                            {(sense.domainIds ?? [])
                              .map(portugueseCategoryLabel)
                              .join(" · ")}
                          </small>
                        )}
                      </div>
                    </li>
                  ) : null;
                })}
              </ul>
              {translation.examples.length > 0 && (
                <section className="pt-word-examples">
                  <h3>Exemplos</h3>
                  {entry.ex.map((example, index) => {
                    const localized = translation.examples.find(
                      (pair) => pair.en === example.en,
                    );
                    if (!localized) return null;
                    return (
                      <div
                        className="pt-example"
                        key={`${example.en}:${index}`}
                      >
                        <div>
                          <p lang="en">{example.en}</p>
                          <PortugueseAudio
                            url={
                              index === 0 || index === 1
                                ? atlas.audio(entry, index === 0 ? "ex" : "ex2")
                                : null
                            }
                            text={example.en}
                            accent="uk"
                            compact
                          />
                        </div>
                        <p>{localized.translation}</p>
                      </div>
                    );
                  })}
                </section>
              )}
              {translation.collocations.length > 0 && (
                <section className="pt-collocations">
                  <h3>Combinações frequentes</h3>
                  <ul>
                    {entry.col.map((pair, index) => {
                      const english = pair.split(/[｜|]/)[0].trim();
                      const localized = translation.collocations.find(
                        (item) => item.en === english,
                      );
                      return localized ? (
                        <li key={`${english}:${index}`}>
                          <span lang="en">{english}</span>
                          <span>{localized.translation}</span>
                        </li>
                      ) : null;
                    })}
                  </ul>
                </section>
              )}
              {entry.fam.length > 0 && (
                <section className="pt-word-family">
                  <h3>Família de palavras</h3>
                  <p lang="en">{entry.fam.join(" · ")}</p>
                </section>
              )}
              {translation.tip && (
                <aside className="pt-usage-tip">
                  <BookOpen size={18} />
                  <p>{translation.tip}</p>
                </aside>
              )}
              <p className="pt-review-note">
                Prévia editorial com apoio de IA. A revisão humana independente
                ainda não foi registrada.
              </p>
            </>
          ) : error ? (
            <div className="pt-load-state" role="alert">
              <p>
                Não foi possível carregar esta palavra. Verifique a conexão e
                tente novamente.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setRetry((value) => value + 1)}
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <div className="pt-load-state" role="status">
              <span className="spinner" /> Carregando a palavra…
            </div>
          )}
          <button className="pt-dialog-back" onClick={onClose}>
            <ArrowLeft size={16} /> Voltar ao atlas
          </button>
        </div>
      </div>
    </dialog>
  );
}

function PortugueseAudio({
  url,
  text,
  accent,
  ipa,
  compact = false,
}: {
  url: string | null;
  text: string;
  accent: "uk" | "us";
  ipa?: string;
  compact?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const [notice, setNotice] = useState("");
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  const run = async () => {
    const token = ++request.current;
    if (playing) {
      stopAudio();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    setNotice("");
    try {
      const result = await play(url, text, accent);
      if (token !== request.current) return;
      if (result === "unsupported")
        setNotice("O áudio não está disponível neste navegador.");
      else if (result === "device")
        setNotice("Reproduzido com a voz de inglês disponível no dispositivo.");
    } catch {
      if (token === request.current)
        setNotice("Não foi possível reproduzir o áudio.");
    } finally {
      if (token === request.current) setPlaying(false);
    }
  };
  const label = accent === "uk" ? "Pronúncia britânica" : "Pronúncia americana";
  return (
    <span className="pt-audio-wrap">
      <button
        className={`pt-audio ${playing ? "is-playing" : ""} ${compact ? "is-compact" : ""}`}
        onClick={run}
        aria-label={
          playing ? "Parar áudio" : compact ? `Ouvir exemplo: ${text}` : label
        }
        aria-pressed={playing}
      >
        <Volume2 size={compact ? 16 : 17} />
        {!compact && (
          <>
            <span>{accent === "uk" ? "Britânica" : "Americana"}</span>
            <span className="pt-ipa" lang="en">
              {ipa}
            </span>
          </>
        )}
      </button>
      {notice && <small role="status">{notice}</small>}
    </span>
  );
}
