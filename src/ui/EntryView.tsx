import { Bookmark, BookmarkCheck, Lightbulb, Share2 } from "lucide-react";
import { useMemo } from "react";
import type { Entry, WordRef } from "../atlas/types";
import { useAtlas } from "../atlas/context";
import { aggregateWordProgress, lexicalId } from "../atlas/progress";
import { splitHighlight, splitPair } from "../lib/text";
import { formatInterval, isMastered } from "../store/srs";
import { toggleBookmark, useStore } from "../store/store";
import { faNumber } from "../i18n";
import { Illustration } from "./Illustration";
import { InlineLookupText } from "./InlineLookup";
import { Speak } from "./Speak";
import { shareWord } from "./share";
import { openWord } from "../lib/router";

export function Highlight({ text, word }: { text: string; word: string }) {
  const parts = splitHighlight(text, word);
  return parts ? (
    <>
      <InlineLookupText text={parts[0]} />
      <mark><InlineLookupText text={parts[1]} /></mark>
      <InlineLookupText text={parts[2]} />
    </>
  ) : (
    <InlineLookupText text={text} />
  );
}

export function Pronounce({
  entry,
  refw,
}: {
  entry: Entry;
  refw: WordRef | Entry;
}) {
  const atlas = useAtlas();
  const accent = useStore((s) => s.settings.accent);
  const items: ["uk" | "us", string, string][] = [
    ["uk", "بریتانیایی", entry.uk],
    ["us", "آمریکایی", entry.us],
  ];
  return (
    <div className="pron">
      {(accent === "us" ? [...items].reverse() : items).map(
        ([acc, label, ipa]) => (
          <Speak
            key={acc}
            url={atlas.audio(refw, acc)}
            text={entry.w}
            accent={acc}
            size="sm"
            label={
              <>
                <em>{label}</em>
                <span className="ipa" dir="ltr" lang="en">
                  {ipa}
                </span>
              </>
            }
          />
        ),
      )}
    </div>
  );
}

export function EntryView({
  entry,
  mode = "detail",
  eager = true,
}: {
  entry: Entry;
  mode?: "detail" | "intro" | "reveal";
  eager?: boolean;
}) {
  const atlas = useAtlas();
  const progress = useStore((s) => s.progress);
  const aggregated = useMemo(
    () => aggregateWordProgress(atlas, progress),
    [atlas, progress],
  );
  const id = lexicalId(atlas, entry.id);
  const ref = atlas.byId.get(id);
  const card =
    mode === "detail" ? aggregated.cards[id] : progress.cards[entry.id];
  const saved = aggregated.bookmarks.includes(id);
  const accent = useStore((s) => s.settings.accent);
  const topicIdx = atlas.topics.findIndex((t) => t[0] === entry.topic);
  const topic = atlas.topics[topicIdx];
  const exUrls = [atlas.audio(entry, "ex"), atlas.audio(entry, "ex2")];
  const famLinks = entry.fam.map((f) => {
    const w = f
      .replace(/\s*\(.*\)\s*$/, "")
      .trim()
      .toLowerCase();
    return {
      label: f,
      id: atlas.words.find((x) => x.word.toLowerCase() === w)?.id,
    };
  });
  const mastered = !!card && isMastered(card);
  const status = card ? (mastered ? "آشنا" : "در حال یادگیری") : null;
  return (
    <article className={`entry entry-${mode}`}>
      <div className="entry-art">
        <Illustration
          src={atlas.img(entry)}
          word={entry.w}
          topic={topicIdx}
          eager={eager}
          alt={`تصویر آموزشی ${entry.w}`}
        />
      </div>
      <div className="entry-body">
        <header className="entry-head">
          <div className="entry-tags">
            <span className={`chip chip-level lv-${entry.cefr}`} dir="ltr">
              {entry.cefr}
            </span>
            {topic && <span className="chip">{topic[1]}</span>}
            {entry.senses.some(s => s.review?.status === "preview") && <span className="chip chip-preview">آزمایشی</span>}
            {status && (
              <span className={`chip chip-status ${mastered ? "is-done" : ""}`}>
                {status}
              </span>
            )}
          </div>
          {mode === "detail" && (
            <div className="entry-actions">
              <button
                className={`icon-btn ${saved ? "is-on" : ""}`}
                onClick={() => toggleBookmark(id)}
                aria-pressed={saved}
                aria-label={saved ? "حذف از نشان‌شده‌ها" : "نشان کردن واژه"}
                title={saved ? "حذف نشان" : "نشان کردن"}
              >
                {saved ? <BookmarkCheck size={19} /> : <Bookmark size={19} />}
              </button>
              <button
                className="icon-btn"
                onClick={() => shareWord(atlas, entry)}
                aria-label="ساخت کارت تصویری واژه"
                title="ساخت کارت تصویری"
              >
                <Share2 size={19} />
              </button>
            </div>
          )}
        </header>
        {ref && (
          <p className="specimen">
            <bdi>№ {String(ref.order + 1).padStart(4, "0")}</bdi>
            <i />
            مهردادیکا
          </p>
        )}
        <h2 className="headword" lang="en" dir="ltr">
          {entry.w}
        </h2>
        <Pronounce
          entry={entry}
          refw={entry.lexicalId ? entry : (ref ?? entry)}
        />
        <ol className="senses">
          {entry.senses.map((sense, i) => (
            <li key={sense.id ?? i}>
              <span className="pos" dir="ltr" lang="en">
                {sense.pos}
              </span>
              <span className="fa">{sense.fa}</span>
              {sense.en && (
                <span className="en" lang="en" dir="ltr">
                  {sense.en}
                </span>
              )}
              {entry.senses.length > 1 && sense.domainIds?.length ? (
                <small className="muted">
                  {sense.domainIds
                    .map(
                      (domain) =>
                        atlas.domains?.find((d) => d.id === domain)?.labelFa,
                    )
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              ) : null}
            </li>
          ))}
        </ol>
        {entry.ex.length > 0 && (
          <section className="block">
            <h3 className="eyebrow">مثال‌ها</h3>
            <ul className="examples">
              {entry.ex.map((x, i) => (
                <li key={`${x.senseId ?? id}-${i}`}>
                  {entry.ex.length > 1 && (
                    <span className="ex-tag">
                      {x.context ?? `مثال ${faNumber(i + 1)}`}
                    </span>
                  )}
                  <p className="ex-en" lang="en" dir="ltr">
                    <Highlight text={x.en} word={entry.w} />
                    <Speak
                      url={exUrls[i] ?? null}
                      text={x.en}
                      accent={i === 1 && exUrls[1] ? "us" : accent}
                      size="sm"
                      className="ex-speak"
                    />
                  </p>
                  <p className="ex-fa">{x.fa}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
        {entry.col.length > 0 && (
          <section className="block">
            <h3 className="eyebrow">ترکیب‌های پرکاربرد</h3>
            <ul className="collocations">
              {entry.col.map((c) => {
                const { en, fa } = splitPair(c);
                return (
                  <li key={c}>
                    <span lang="en" dir="ltr">
                      {en}
                    </span>
                    {fa && <small>{fa}</small>}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        {(famLinks.length > 0 ||
          entry.syn.length > 0 ||
          entry.ant.length > 0) && (
          <section className="block relations">
            {famLinks.length > 0 && (
              <div>
                <h3 className="eyebrow">واژه‌های هم‌خانواده</h3>
                <p dir="ltr" lang="en">
                  {famLinks.map((f) =>
                    f.id && mode === "detail" ? (
                      <button
                        key={f.label}
                        className="link"
                        onClick={() => openWord(f.id!)}
                      >
                        {f.label}
                      </button>
                    ) : (
                      <span key={f.label}>{f.label}</span>
                    ),
                  )}
                </p>
              </div>
            )}
            {entry.syn.length > 0 && (
              <div>
                <h3 className="eyebrow">هم‌معنی‌ها</h3>
                <p dir="ltr" lang="en">
                  {entry.syn.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </p>
              </div>
            )}
            {entry.ant.length > 0 && (
              <div>
                <h3 className="eyebrow">متضادها</h3>
                <p dir="ltr" lang="en">
                  {entry.ant.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </p>
              </div>
            )}
          </section>
        )}
        {entry.tip && (
          <aside className="tip">
            <Lightbulb size={17} strokeWidth={1.8} />
            <p>{entry.tip}</p>
          </aside>
        )}
        {entry.note && (
          <p className="usage-note">نکتهٔ کاربردی: {entry.note}</p>
        )}
        {entry.senses.some((s) => s.review?.status === "preview") && (
          <p className="usage-note">
            پیش‌نمایش ویرایشی · بازبینی مستقل انسانی هنوز ثبت نشده است.
          </p>
        )}
        {mode === "detail" && card && (
          <p className="memory-note">
            {card.due <= Date.now()
              ? "زمان مرور رسیده است"
              : `مرور بعدی: ${formatInterval(card.due - Date.now())} دیگر`}{" "}
            · {faNumber(card.reps)} مرور
            {entry.senses.length > 1
              ? " · وضعیت، جمع‌بندی معنی‌های منتشرشده است."
              : ""}
          </p>
        )}
      </div>
    </article>
  );
}
