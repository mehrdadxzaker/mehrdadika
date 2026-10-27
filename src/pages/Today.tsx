import { uiIntlLocale } from "../i18n/locale";
import { ArrowLeft, BookOpen, Flame, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useAtlas, useEntry, useLearningAtlas } from "../atlas/context";
import { aggregateWordProgress } from "../atlas/progress";
import { Galaxy } from "../galaxy/Galaxy";
import { faNumber, levelNames, minuteCount, streakCount } from "../i18n";
import { go, openWord } from "../lib/router";
import { hashSeed } from "../lib/text";
import { buildSession, todayPlan } from "../store/session";
import { isMastered } from "../store/srs";
import { dayKey, store, useStore } from "../store/store";
import { Categories } from "../ui/Categories";
import { Highlight, Pronounce } from "../ui/EntryView";
import { Illustration } from "../ui/Illustration";

export function streakOf(days: Record<string, { r: number }>) {
  let n = 0;
  const d = new Date();
  if (!(days[dayKey(d)]?.r > 0)) d.setDate(d.getDate() - 1);
  while (days[dayKey(d)]?.r > 0) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
export function Today() {
  const atlas = useAtlas(),
    learning = useLearningAtlas();
  const progress = useStore((s) => s.progress),
    settings = useStore((s) => s.settings);
  const plan = useMemo(
    () => todayPlan(learning, progress, settings),
    [learning, progress, settings],
  );
  const publicProgress = useMemo(
    () => aggregateWordProgress(atlas, progress),
    [atlas, progress],
  );
  const active =
    progress.session && !progress.session.finished ? progress.session : null;
  const start = () => {
    if (!active) {
      const session = buildSession(learning, progress, settings);
      if (!session.steps.length) return;
      store.progress((p) => ({ ...p, session }));
    }
    go({ page: "learn" });
  };
  const hour = new Date().getHours();
  const greeting =
    hour < 5
      ? "شب‌تان آرام"
      : hour < 12
        ? "صبح‌به‌خیر"
        : hour < 18
          ? "روزتان به‌خیر"
          : "عصرتان به‌خیر";
  const wordIds = (active?.newIds ?? plan.fresh).slice(0, 5);
  const passage = atlas.readings?.passages[0];
  const learned = Object.keys(publicProgress.cards).length;
  const familiar = Object.values(publicProgress.cards).filter(
    isMastered,
  ).length;
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return {
      key: dayKey(d),
      label: d.toLocaleDateString(uiIntlLocale(), { weekday: "narrow" }),
      value: progress.days[dayKey(d)]?.r ?? 0,
    };
  });
  return (
    <div className="page today">
      <header className="greet">
        <p className="eyebrow">
          {new Date().toLocaleDateString(uiIntlLocale(), {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="display">{greeting}</h1>
      </header>
      <button className="exam-link" onClick={() => go({ page: "me" })}>
        {settings.examDate
          ? `برنامهٔ شما تا ${new Date(settings.examDate + "T12:00:00").toLocaleDateString(uiIntlLocale())}`
          : "برای یادگیری‌تان یک ریتم بسازید؛ هر روز، کمی بیشتر."}
        <ArrowLeft size={17} />
      </button>
      <section
        className={`journey ${!active && !plan.fresh.length && !plan.due.length ? "is-clear" : ""}`}
      >
        <img
          className="journey-art"
          src={`${import.meta.env.BASE_URL}brand/hero.webp`}
          alt="کتابی باز که به دنیایی از سفر، داستان و کشف تبدیل شده است"
          fetchPriority="high"
        />
        <div className="journey-body">
          <p className="eyebrow eyebrow-light">
            {active ? "ادامهٔ مسیر شما" : "یادگیری امروز"}
          </p>
          <h2>
            {active ? (
              <>
                فقط <b>{faNumber(active.steps.length - active.index)}</b> قدم
                دیگر
              </>
            ) : plan.due.length || plan.fresh.length ? (
              <>
                {plan.due.length > 0 && (
                  <>
                    مرور <b>{faNumber(plan.due.length)}</b> <i>·</i>{" "}
                  </>
                )}
                واژه‌های تازه <b>{faNumber(plan.fresh.length)}</b>
              </>
            ) : plan.dailyTargetMet ? (
              "هدف واژه‌های تازهٔ امروز کامل شد"
            ) : (
              "برای قدم بعدی آماده‌اید؟"
            )}
          </h2>
          <p className="journey-lede">
            {active ? (
              "از همان‌جایی که مانده بودید، ادامه دهید."
            ) : plan.fresh.length || plan.due.length ? (
              <>
                حدود {minuteCount(plan.minutes)}؛ اول مرور، بعد واژه‌های تازه.
              </>
            ) : plan.dailyTargetMet ? (
              "هدف روزانهٔ واژه‌های تازه را کامل کرده‌اید. فردا ادامه دهید؛ امروز می‌توانید بخوانید یا اطلس را کشف کنید."
            ) : (
              "در این موضوع واژهٔ تازه‌ای نمانده است. موضوع دیگری را کشف کنید."
            )}
          </p>
          {!!wordIds.length && (
            <div className="teaser">
              {wordIds.map((id) => {
                const w = learning.byId.get(id);
                return (
                  w && (
                    <Illustration
                      key={id}
                      src={learning.img(w)}
                      word={w.word}
                      topic={w.topic}
                    />
                  )
                );
              })}
              <span>امروز با این‌ها آشنا می‌شوید</span>
            </div>
          )}
          <div className="journey-actions">
            {active || plan.due.length || plan.fresh.length ? (
              <button className="btn btn-primary btn-xl" onClick={start}>
                {active ? "ادامهٔ یادگیری" : "شروع یادگیری"}
                <ArrowLeft size={20} />
              </button>
            ) : (
              <button
                className="btn btn-primary btn-xl"
                onClick={() => go({ page: "atlas" })}
              >
                کشف موضوع‌ها <Sparkles size={20} />
              </button>
            )}
          </div>
        </div>
      </section>
      <div className="today-adjust">
        <button onClick={() => go({ page: "me" })}>
          از {atlas.cefr[settings.startLevel]} · تنظیم سطح
        </button>
        <button
          onClick={() =>
            go({
              page: "atlas",
              topic: settings.topic === "all" ? undefined : settings.topic,
            })
          }
        >
          {atlas.domains?.find((d) => d.id === settings.topic)?.labelFa ??
            "همهٔ موضوع‌ها"}{" "}
          · کشف موضوع
        </button>
      </div>
      <div className="today-grid">
        <WordOfDay />
        <a
          className="panel reading-teaser"
          href={passage ? `#/read?id=${passage.id}` : "#/read"}
        >
          <div className="panel-head">
            <h3 className="eyebrow">
              <BookOpen size={16} /> خواندنی امروز
            </h3>
            <span className="chip">{passage?.level ?? "داستان"}</span>
          </div>
          <h2 lang="en" dir="ltr">
            {passage?.titleEn ?? "A little reading, a little discovery."}
          </h2>
          <p>{passage?.titleFa ?? "انگلیسی را در دل یک داستان کشف کنید."}</p>
          <span className="link">
            شروع خواندن <ArrowLeft size={16} />
          </span>
        </a>
        <section className="panel streak-panel">
          <div className="panel-head">
            <h3 className="eyebrow">این هفته</h3>
            <span className="streak">
              <Flame size={17} /> {streakCount(streakOf(progress.days))}
            </span>
          </div>
          <ol className="week">
            {week.map((day) => (
              <li key={day.key} className={day.value ? "is-on" : ""}>
                <span>{day.label}</span>
                <b>{faNumber(day.value)}</b>
              </li>
            ))}
          </ol>
          <dl className="mini-stats">
            <div>
              <dt>آموخته</dt>
              <dd>{faNumber(learned)}</dd>
            </div>
            <div>
              <dt>آشنا</dt>
              <dd>{faNumber(familiar)}</dd>
            </div>
            <div>
              <dt>واژه در اطلس</dt>
              <dd>{faNumber(atlas.count)}</dd>
            </div>
          </dl>
        </section>
        <section className="panel path-panel">
          <div className="panel-head">
            <h3 className="eyebrow">مسیر یادگیری · از A1 تا C2</h3>
          </div>
          <ol className="route">
            {atlas.cefr.map((level, i) => {
              const words = atlas.words.filter((w) => w.cefr === i),
                seen = words.filter((w) => publicProgress.cards[w.id]).length;
              return (
                <li
                  key={level}
                  className={i === settings.startLevel ? "is-start" : ""}
                >
                  <button onClick={() => go({ page: "atlas", level })}>
                    <span
                      className="station"
                      style={
                        {
                          "--seen": seen / Math.max(1, words.length),
                        } as React.CSSProperties
                      }
                    >
                      <b>{level}</b>
                    </span>
                    <span className="station-name">{levelNames[i]}</span>
                    <span className="station-count">
                      {faNumber(seen)}
                      <small>/{faNumber(words.length)}</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
      <a className="home-galaxy" href="#/atlas?view=galaxy">
        <Galaxy mode="mini" />
        <div>
          <p className="eyebrow">آسمان واژه‌های شما</p>
          <h2>{faNumber(learned)} ستاره روشن شده</h2>
          <p>هر واژه، یک ستاره. هر بار یادگیری، کمی روشن‌تر.</p>
          <span className="link">
            ورود به آسمان <ArrowLeft size={17} />
          </span>
        </div>
      </a>
      <section className="topics-panel">
        <div className="panel-head">
          <h3>دنیایی از موضوع‌ها</h3>
          <span className="muted">۳۲ حوزه، مجموعه‌هایی در حال رشد</span>
        </div>
        <Categories
          onSelect={(id) => go({ page: "atlas", topic: id })}
          expanded
        />
      </section>
    </div>
  );
}
function WordOfDay() {
  const atlas = useAtlas();
  const pick =
    atlas.words[hashSeed(dayKey()) % Math.max(1, atlas.words.length)];
  const { entry } = useEntry(pick?.id);
  if (!pick) return null;
  return (
    <section className="panel wotd">
      <div className="panel-head">
        <h3 className="eyebrow">واژهٔ امروز</h3>
        <span className="chip">{atlas.cefr[pick.cefr]}</span>
      </div>
      <div className="daily-word-body">
        <button
          className="daily-word-image"
          onClick={() => openWord(pick.id)}
          aria-label={`واژهٔ ${pick.word}`}
        >
          <Illustration src={atlas.img(pick)} word={pick.word} />
        </button>
        <div>
          <button
            className="wotd-word"
            lang="en"
            dir="ltr"
            onClick={() => openWord(pick.id)}
          >
            {pick.word}
          </button>
          {entry && <Pronounce entry={entry} refw={pick} />}
          <p>{pick.fa}</p>
        </div>
      </div>
      {entry?.ex[0] && (
        <p className="wotd-ex" lang="en" dir="ltr">
          <Highlight text={entry.ex[0].en} word={entry.w} />
        </p>
      )}
    </section>
  );
}
