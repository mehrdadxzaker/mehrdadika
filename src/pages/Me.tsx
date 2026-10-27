import { tr } from "../i18n/messages";
import { uiIntlLocale } from "../i18n/locale";
import { Download, RotateCcw, Upload } from "lucide-react";
import { useMemo, useRef } from "react";
import { useAtlas } from "../atlas/context";
import { aggregateWordProgress } from "../atlas/progress";
import { OfflinePack } from "../ui/OfflinePack";
import { faNumber } from "../i18n";
import { isMastered } from "../store/srs";
import {
  dayKey,
  exportBackup,
  importBackup,
  resetProgress,
  store,
  useStore,
  type Settings,
} from "../store/store";
import { toast } from "../ui/Toast";
import { streakOf } from "./Today";

export function Me({ privateAvailable }: { privateAvailable: boolean }) {
  const atlas = useAtlas();
  const progress = useStore((s) => s.progress);
  const settings = useStore((s) => s.settings);
  const saveError = useStore((s) => s.saveError);
  const file = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const cards = Object.values(progress.cards);
    const lexicalCards = Object.values(
      aggregateWordProgress(atlas, progress).cards,
    );
    const days = Object.values(progress.days);
    const r = days.reduce((n, d) => n + d.r, 0);
    const c = days.reduce((n, d) => n + d.c, 0);
    const t = days.reduce((n, d) => n + d.t, 0);
    const now = Date.now();
    const forecast = Array.from({ length: 7 }, (_, i) => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      end.setDate(end.getDate() + i);
      const start = new Date(end);
      start.setHours(0, 0, 0, 0);
      return cards.filter((x) =>
        i === 0
          ? x.due <= end.getTime()
          : x.due >= start.getTime() && x.due <= end.getTime(),
      ).length;
    });
    void now;
    return {
      learned: lexicalCards.length,
      meanings: cards.length,
      mastered: lexicalCards.filter(isMastered).length,
      reviews: r,
      accuracy: r ? Math.round((c / r) * 100) : 0,
      minutes: Math.round(t / 60),
      forecast,
    };
  }, [atlas, progress]);

  const set = (patch: Partial<Settings>) => store.settings(patch);
  const download = () => {
    const blob = new Blob([exportBackup()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mehrdadika-backup-${dayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const restore = async (f: File) => {
    if (f.size > 30 * 1024 * 1024)
      return toast("فایل برای نسخهٔ پشتیبان بیش از اندازه بزرگ است.", "warn");
    try {
      const text = await f.text();
      const preview = JSON.parse(text) as {
        progress?: { cards?: Record<string, unknown> };
      };
      const count = Object.keys(preview?.progress?.cards ?? {}).length;
      if (
        !confirm(tr(
          `نسخهٔ پشتیبان با ${faNumber(count)} سابقهٔ معنی بررسی و وارد شود؟ در صورت معتبر بودن، سابقهٔ فعلی جایگزین می‌شود. پیش از ادامه می‌توانید از وضعیت فعلی نسخهٔ پشتیبان بگیرید.`,
        ))
      )
        return;
      const r = await importBackup(text);
      toast(
        r.ok ? `سابقهٔ ${faNumber(r.cards)} معنی بازیابی شد.` : r.error,
        r.ok ? "ok" : "warn",
      );
    } catch {
      toast("فایل نسخهٔ پشتیبان قابل خواندن نیست.", "warn");
    }
  };
  const maxF = Math.max(1, ...stats.forecast);

  return (
    <div className="page me">
      <header className="page-head">
        <p className="eyebrow">من</p>
        <h1 className="display">آسمان یادگیری من</h1>
      </header>

      <section className="stat-strip">
        <div>
          <dt>روزهای پیوسته</dt>
          <dd>
            {streakOf(progress.days)}
            <small>روز</small>
          </dd>
        </div>
        <div>
          <dt>واژه‌های روشن</dt>
          <dd>{stats.learned.toLocaleString(uiIntlLocale())}</dd>
        </div>
        <div>
          <dt>واژه‌های آشنا</dt>
          <dd>{stats.mastered.toLocaleString(uiIntlLocale())}</dd>
        </div>
        <div>
          <dt>درستیِ پاسخ نخست</dt>
          <dd>
            {stats.accuracy}
            <small>%</small>
          </dd>
        </div>
        <div>
          <dt>زمان مطالعه</dt>
          <dd>
            {stats.minutes}
            <small>دقیقه</small>
          </dd>
        </div>
      </section>

      <div className="me-grid">
        <section className="panel">
          <h3 className="eyebrow">۲۰ هفتهٔ گذشته</h3>
          <Heatmap days={progress.days} />
          <p className="muted">
            هر خانه یک روز است؛ رنگ پررنگ‌تر یعنی پاسخ‌های بیشتر. «آشنا» برآوردی
            از سابقهٔ مرور است و به مرور منظم نیاز دارد.
          </p>
        </section>

        <section className="panel">
          <h3 className="eyebrow">مرورهای هفت روز آینده</h3>
          <ol className="forecast">
            {stats.forecast.map((n, i) => (
              <li key={i}>
                <span style={{ height: `${(n / maxF) * 100}%` }} />
                <b>{n}</b>
                <small>{i === 0 ? "امروز" : i === 1 ? "فردا" : `+${i}`}</small>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel settings">
          <h3 className="eyebrow">تنظیمات یادگیری</h3>
          <Field
            label="معنی‌های تازه در روز"
            hint="مرورهای سررسیدشده جدا از این تعداد هستند."
          >
            <div className="segmented">
              {[5, 10, 15, 20, 30].map((n) => (
                <button
                  key={n}
                  className={settings.dailyNew === n ? "is-on" : ""}
                  onClick={() => set({ dailyNew: n })}
                >
                  {n}
                </button>
              ))}
            </div>
          </Field>
          <Field
            label="سطح شروع"
            hint="فقط انتخاب مطالب تازه تغییر می‌کند؛ سابقهٔ مرور حفظ می‌شود."
          >
            <div className="segmented">
              {atlas.cefr.map((l, i) => (
                <button
                  key={l}
                  className={settings.startLevel === i ? "is-on" : ""}
                  onClick={() => set({ startLevel: i })}
                >
                  {l}
                </button>
              ))}
            </div>
          </Field>
          <Field
            label="موضوع یادگیری"
            hint="همهٔ ۳۲ دسته در فهرست هستند؛ مطالب هر دسته به‌تدریج منتشر می‌شوند."
          >
            <select
              value={settings.topic}
              aria-label="موضوع یادگیری"
              onChange={(e) => set({ topic: e.target.value })}
            >
              <option value="all">همهٔ موضوع‌ها</option>
              {(atlas.domains ?? []).map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.labelFa}
                  {atlas.words.some((w) => w.domainIds?.includes(domain.id))
                    ? ""
                    : " · به‌زودی"}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="تاریخ آزمون (اختیاری)"
            hint="برای برآورد برنامهٔ مطالعه؛ هر زمان می‌توانید آن را پاک کنید."
          >
            <input
              type="date"
              dir="ltr"
              value={settings.examDate}
              aria-label="تاریخ آزمون"
              onChange={(e) => set({ examDate: e.target.value })}
            />
          </Field>
          <Field
            label="نمرهٔ هدف آزمون"
            hint="یک ترجیح مطالعاتی است و تضمین نمره نیست."
          >
            <input
              type="number"
              dir="ltr"
              min="0"
              max="9"
              step="0.5"
              value={settings.targetScore}
              aria-label="نمرهٔ هدف آزمون"
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n))
                  set({ targetScore: Math.max(0, Math.min(9, n)) });
              }}
            />
          </Field>
          <Field
            label="هدف یادآوری"
            hint="عدد بالاتر معمولاً مرور بیشتری می‌خواهد. مقدار پیش‌فرض ۹۰٪ است."
          >
            <div className="segmented">
              {[0.85, 0.9, 0.95].map((n) => (
                <button
                  key={n}
                  className={settings.retention === n ? "is-on" : ""}
                  onClick={() => set({ retention: n })}
                >
                  {Math.round(n * 100)}%
                </button>
              ))}
            </div>
          </Field>
          <Field label="تلفظ">
            <div className="segmented">
              <button
                className={settings.accent === "uk" ? "is-on" : ""}
                onClick={() => set({ accent: "uk" })}
              >
                بریتانیایی
              </button>
              <button
                className={settings.accent === "us" ? "is-on" : ""}
                onClick={() => set({ accent: "us" })}
              >
                آمریکایی
              </button>
            </div>
          </Field>
          <Field label="ظاهر">
            <div className="segmented">
              {(
                [
                  ["system", "همراه دستگاه"],
                  ["light", "روشن"],
                  ["dark", "تیره"],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  className={settings.theme === k ? "is-on" : ""}
                  onClick={() => set({ theme: k })}
                >
                  {l}
                </button>
              ))}
            </div>
          </Field>
          <Toggle
            label="پخش خودکار تلفظ"
            on={settings.autoplay}
            set={(v) => set({ autoplay: v })}
          />
          <Toggle
            label="صدای رابط"
            on={settings.sfx}
            set={(v) => set({ sfx: v })}
          />
          <Toggle
            label="نمایش آغازین (روزی یک بار)"
            on={settings.splash}
            set={(v) => set({ splash: v })}
          />
          <Toggle
            label="افزودن پرسش املا به مرور"
            on={settings.spell}
            set={(v) => set({ spell: v })}
          />
          {privateAvailable && (
            <Field
              label="مجموعهٔ واژگان"
              hint="مجموعهٔ خصوصی فقط روی سرور محلی در دسترس است."
            >
              <div className="segmented">
                <button
                  className={settings.dataset === "open" ? "is-on" : ""}
                  onClick={() => set({ dataset: "open" })}
                >
                  اطلس عمومی
                </button>
                <button
                  className={settings.dataset === "private" ? "is-on" : ""}
                  onClick={() => set({ dataset: "private" })}
                >
                  مجموعهٔ خصوصی
                </button>
              </div>
            </Field>
          )}
        </section>

        <OfflinePack />
        <section className="panel">
          <h3 className="eyebrow">داده‌ها</h3>
          <p className="muted">
            پیشرفت در مرورگر همین دستگاه نگهداری می‌شود و خودکار همگام نمی‌شود.
            برای انتقال به دستگاه دیگر، نسخهٔ پشتیبان را ذخیره و سپس وارد کنید.
          </p>
          {saveError && (
            <p className="warn-text">
              مرورگر نتوانست داده‌ها را ذخیره کند؛ ممکن است فضا پر باشد یا مرور
              خصوصی فعال باشد. نسخهٔ پشتیبان بگیرید.
            </p>
          )}
          <div className="data-actions">
            <button className="btn btn-ghost" onClick={download}>
              <Download size={18} /> ذخیرهٔ نسخهٔ پشتیبان
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => file.current?.click()}
            >
              <Upload size={18} /> وارد کردن نسخهٔ پشتیبان
            </button>
            <input
              ref={file}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) =>
                e.target.files?.[0] &&
                restore(e.target.files[0]).finally(() => (e.target.value = ""))
              }
            />
            <button
              className="btn btn-ghost btn-danger"
              onClick={() => {
                if (
                  confirm(tr(
                    "همهٔ سابقهٔ یادگیری این مجموعه پاک شود؟ این کار برگشت‌پذیر نیست. ابتدا نسخهٔ پشتیبان بگیرید.",
                  ))
                ) {
                  resetProgress();
                  toast("سابقهٔ یادگیری پاک شد.");
                }
              }}
            >
              <RotateCcw size={18} /> پاک کردن سابقه
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <div>
        <b>{label}</b>
        {hint && <small>{hint}</small>}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  label,
  on,
  set,
}: {
  label: string;
  on: boolean;
  set: (v: boolean) => void;
}) {
  return (
    <label className="field toggle">
      <b>{label}</b>
      <input
        type="checkbox"
        role="switch"
        checked={on}
        onChange={(e) => set(e.target.checked)}
      />
      <span className="switch" aria-hidden="true" />
    </label>
  );
}

function Heatmap({ days }: { days: Record<string, { r: number }> }) {
  const weeks = 20;
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (weeks * 7 - 1) - end.getDay());
  const cells: { k: string; v: number; future: boolean }[] = [];
  const d = new Date(start);
  for (let i = 0; i < (weeks + 1) * 7; i++) {
    const k = dayKey(d);
    cells.push({ k, v: days[k]?.r ?? 0, future: d > end });
    d.setDate(d.getDate() + 1);
  }
  const lvl = (v: number) =>
    v === 0 ? 0 : v < 10 ? 1 : v < 25 ? 2 : v < 50 ? 3 : 4;
  return (
    <div className="heatmap" role="img" aria-label="نمودار فعالیت یادگیری">
      {cells.map((c) => (
        <span
          key={c.k}
          className={`h${c.future ? "x" : lvl(c.v)}`}
          title={`${c.k} · ${c.v} پاسخ`}
        />
      ))}
    </div>
  );
}
