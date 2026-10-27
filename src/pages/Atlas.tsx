import { uiDirection } from "../i18n/locale";
import { Grid3x3, List, Search, Sparkles, X } from "lucide-react";
import { Galaxy } from "../galaxy/Galaxy";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAtlas } from "../atlas/context";
import { aggregateWordProgress } from "../atlas/progress";
import type { WordRef } from "../atlas/types";
import { faNumber, wordCount } from "../i18n";
import { morphFrom } from "../lib/motion";
import { go, openWord, type Route } from "../lib/router";
import { isMastered } from "../store/srs";
import { store, useStore } from "../store/store";
import { Categories } from "../ui/Categories";
import { Illustration } from "../ui/Illustration";
import { searchAtlas } from "../ui/Palette";
import { Speak } from "../ui/Speak";

type Status = "all" | "new" | "learning" | "mastered" | "saved";
const STATUS: [Status,string][] = [["all","همه"],["new","تازه"],["learning","در حال یادگیری"],["mastered","آشنا"],["saved","نشان‌شده"]];
type View = "grid" | "list" | "galaxy";
function readView(): View { try { const v = localStorage.getItem("mehrdadika:view"); return v === "list" || v === "galaxy" ? v : "grid"; } catch { return "grid"; } }
export function AtlasPage({ route }: { route: Extract<Route,{page:"atlas"}> }) {
  const atlas = useAtlas();
  const progress = useStore(s => s.progress);
  const aggregate = useMemo(() => aggregateWordProgress(atlas,progress,route.topic ?? "all"),[atlas,progress,route.topic]);
  const cards = aggregate.cards, bookmarks = aggregate.bookmarks;
  const [q,setQ] = useState(route.q ?? "");
  const [view,setViewState] = useState<View>(() => route.view === "galaxy" || route.view === "list" ? route.view : readView());
  const status: Status = STATUS.some(([id]) => id === route.status) ? route.status as Status : "all";
  const topic = route.topic, level = route.level;
  useEffect(() => setQ(route.q ?? ""),[route.q]);
  useEffect(() => { if (route.view === "grid" || route.view === "list" || route.view === "galaxy") setViewState(route.view); },[route.view]);
  useEffect(() => { try { localStorage.setItem("mehrdadika:view",view); } catch { /* optional */ } },[view]);
  const setFilter = (patch: Partial<Extract<Route,{page:"atlas"}>>) => go({page:"atlas",topic,level,q: q || undefined,view,status:status === "all" ? undefined : status,...patch},null,true);
  const setView = (next: View) => { setViewState(next); setFilter({view:next}); };
  const list = useMemo(() => {
    const base = q.trim() ? searchAtlas(atlas,q,100000) : atlas.words;
    return base.filter(w => {
      if (topic && !(w.domainIds ?? [atlas.topics[w.topic]?.[0]]).includes(topic)) return false;
      if (level && atlas.cefr[w.cefr] !== level) return false;
      const card = cards[w.id];
      if (status === "new") return !card;
      if (status === "learning") return !!card && !isMastered(card);
      if (status === "mastered") return isMastered(card);
      if (status === "saved") return bookmarks.includes(w.id);
      return true;
    });
  },[atlas,q,topic,level,status,cards,bookmarks]);
  const domain = atlas.domains?.find(d => d.id === topic);
  const available = domain && atlas.words.some(w => w.domainIds?.includes(domain.id));
  return <div className={`page atlas ${view === "galaxy" ? "is-galaxy" : ""}`}>
    <header className="atlas-head"><div><p className="eyebrow">اطلس · {faNumber(atlas.count)} واژه و عبارت</p><h1 className="display">واژه‌ها را ببینید،<br className="br-sm"/> در زندگی بشناسید.</h1><p className="lede">{faNumber(atlas.examples)} مثال دوزبانه · تلفظ بریتانیایی و آمریکایی · ۳۲ دنیای متفاوت</p></div>
      <label className="search"><Search size={19}/><input value={q} onChange={e => {setQ(e.target.value);setFilter({q:e.target.value || undefined});}} placeholder="جست‌وجوی واژه یا معنی فارسی" aria-label="جست‌وجو در اطلس" dir="auto" spellCheck={false} autoComplete="off"/>{q && <button className="icon-btn" onClick={() => {setQ('');setFilter({q:undefined});}} aria-label="پاک‌کردن جست‌وجو"><X size={16}/></button>}</label>
    </header>
    <div className="filters">
      {view !== "galaxy" && <><div className="chips chips-scroll" role="group" aria-label="سطح انگلیسی"><button className={`chip-btn ${!level ? 'is-on' : ''}`} onClick={() => setFilter({level:undefined})}>همهٔ سطح‌ها</button>{atlas.cefr.map(l => <button key={l} className={`chip-btn lv lv-${l} ${level === l ? 'is-on' : ''}`} onClick={() => setFilter({level:level === l ? undefined : l})} dir="ltr">{l}</button>)}</div><Categories selected={topic} onSelect={id => setFilter({topic:id})}/></>}
      <div className="filters-row">{view !== "galaxy" && <div className="segmented" role="group" aria-label="وضعیت یادگیری">{STATUS.map(([id,label]) => <button key={id} className={status === id ? 'is-on' : ''} onClick={() => setFilter({status:id === 'all' ? undefined : id})} aria-pressed={status === id}>{label}</button>)}</div>}<span className="result-count">{view === "galaxy" ? 'واژه‌ای را جست‌وجو کنید؛ ستاره‌اش را پیدا کنید.' : wordCount(list.length)}</span><div className="segmented segmented-icons" role="group" aria-label="نمای اطلس"><button className={view === 'grid' ? 'is-on' : ''} onClick={() => setView('grid')} aria-label="نمای تصویری" aria-pressed={view === 'grid'}><Grid3x3 size={17}/></button><button className={view === 'list' ? 'is-on' : ''} onClick={() => setView('list')} aria-label="نمای فهرست" aria-pressed={view === 'list'}><List size={17}/></button><button className={view === 'galaxy' ? 'is-on' : ''} onClick={() => setView('galaxy')} aria-label="آسمان واژه‌ها" aria-pressed={view === 'galaxy'}><Sparkles size={17}/></button></div></div>
    </div>
    {domain && <section className="domain-detail"><div><h2>{domain.labelFa}</h2><p className="muted" lang="en" dir="ltr">{domain.labelEn}</p></div>{available && <button className="btn btn-ghost" onClick={() => {store.settings({topic:domain.id});go({page:'today'});}}>یادگیری این موضوع</button>}<p className="domain-subcategories">{(domain.subcategoryLabelsFa ?? domain.subcategories).join(' · ')}</p></section>}
    {view === 'galaxy' ? <Galaxy mode="full" focus={q.trim() ? list[0]?.id : null}/> : list.length === 0 ? <div className="empty"><Sparkles size={34}/><h2>{domain ? 'این بخش از اطلس در حال شکل‌گرفتن است.' : 'واژه‌ای پیدا نشد.'}</h2><p>{domain ? 'مجموعه‌های این حوزه به‌مرور آماده و منتشر می‌شوند. تا آن زمان، موضوع‌های دیگر را کشف کنید.' : 'عبارت جست‌وجو یا فیلترها را تغییر دهید.'}</p><button className="btn btn-ghost" onClick={() => {setQ('');go({page:'atlas'},null,true);}}>دیدن مجموعه‌های در دسترس</button></div> : view === 'grid' ? <VirtualGrid items={list} cards={cards}/> : <VirtualList items={list} cards={cards}/>}
  </div>;
}

function useWindowRange(
  container: React.RefObject<HTMLDivElement | null>,
  rowHeight: number,
  rows: number,
  overscan = 4,
) {
  const [range, setRange] = useState<[number, number]>([0, 12]);
  useLayoutEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = container.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      const first = Math.min(rows, Math.max(0, Math.floor(-top / rowHeight) - overscan));
      const last = Math.min(
        rows,
        Math.max(0, Math.ceil((window.innerHeight - top) / rowHeight) + overscan),
      );
      setRange((r) => (r[0] === first && r[1] === last ? r : [first, last]));
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    const observer = new ResizeObserver(on);
    observer.observe(document.body);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [container, rowHeight, rows, overscan]);
  return rows <= 100 ? [0, rows] as [number, number] : range;
}

function useWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    setW(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

function VirtualGrid({
  items,
  cards,
}: {
  items: WordRef[];
  cards: Record<string, { s: number; st: number }>;
}) {
  const atlas = useAtlas();
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box);
  const gap = width < 560 ? 10 : 16;
  const cols = Math.max(
    2,
    Math.floor((width + gap) / ((width < 560 ? 150 : 188) + gap)),
  );
  const cell = (width - gap * (cols - 1)) / cols;
  const rowH = cell + (width < 560 ? 62 : 74) + gap;
  const rows = Math.ceil(items.length / cols);
  const [a, b] = useWindowRange(box, rowH, rows);
  const visible: React.ReactNode[] = [];
  if (width > 0)
    for (let r = a; r < b; r++)
      for (let c = 0; c < cols; c++) {
        const w = items[r * cols + c];
        if (!w) break;
        const card = cards[w.id];
        const st = card
          ? card.st === 2 && card.s >= 21
            ? "is-mastered"
            : "is-learning"
          : "";
        visible.push(
          <button
            key={w.id}
            className={`tile ${st}`}
            style={{
              transform: `translate(${(uiDirection() === "rtl" ? cols - 1 - c : c) * (cell + gap)}px, ${r * rowH}px)`,
              width: cell,
              height: rowH - gap,
            }}
            onClick={(e) => morphFrom(e.currentTarget.querySelector<HTMLElement>(".illo"), () => openWord(w.id))}
          >
            <Illustration
              src={atlas.img(w, "thumb")}
              word={w.word}
              topic={w.topic}
            />
            <span className="tile-no">
              № {String(w.order + 1).padStart(4, "0")}
            </span>
            <span className="tile-text">
              <span className="tile-word" lang="en">
                {w.word}
              </span>
              <span className={`tile-lv lv-${atlas.cefr[w.cefr]}`}>
                {atlas.cefr[w.cefr]}
              </span>
              <span className="tile-fa">{w.fa}</span>
            </span>
          </button>,
        );
      }
  return (
    <div ref={box} className="vgrid" style={{ height: rows * rowH }}>
      {visible}
    </div>
  );
}

function VirtualList({
  items,
  cards,
}: {
  items: WordRef[];
  cards: Record<string, { s: number; st: number }>;
}) {
  const atlas = useAtlas();
  const accent = useStore((s) => s.settings.accent);
  const box = useRef<HTMLDivElement>(null);
  const rowH = 68;
  const [a, b] = useWindowRange(box, rowH, items.length, 8);
  return (
    <div ref={box} className="vlist" style={{ height: items.length * rowH }}>
      {items.slice(a, b).map((w, i) => {
        const card = cards[w.id];
        return (
          <div
            key={w.id}
            className="row"
            style={{ transform: `translateY(${(a + i) * rowH}px)` }}
            onClick={() => openWord(w.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && openWord(w.id)}
          >
            <Illustration
              src={atlas.img(w, "thumb")}
              word={w.word}
              topic={w.topic}
              className="row-art"
            />
            <span className="row-word" lang="en">
              {w.word}
            </span>
            <span className="row-ipa ipa">{w.ipa}</span>
            <span className="row-fa">{w.fa}</span>
            <span
              className={`row-dot ${card ? (card.st === 2 && card.s >= 21 ? "is-mastered" : "is-learning") : ""}`}
            />
            <Speak
              url={atlas.audio(w, accent)}
              text={w.word}
              accent={accent}
              size="sm"
            />
          </div>
        );
      })}
    </div>
  );
}
