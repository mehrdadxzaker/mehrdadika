import { ArrowLeft, BookOpen, Headphones, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAtlas } from "../atlas/context";
import { faNumber, levelNames } from "../i18n";
import { localeRegistry } from "../locales/registry";
import { store } from "../store/store";
import { Logo } from "../ui/Logo";

export function Onboarding() {
  const atlas = useAtlas();
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = dialog.current;
    const focusable = () =>
      [
        ...(node?.querySelectorAll<HTMLElement>(
          "button, input, select, a[href]",
        ) ?? []),
      ].filter((el) => !el.hasAttribute("disabled"));
    focusable()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusable();
      const index = items.indexOf(document.activeElement as HTMLElement);
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        items.at(-1)?.focus();
      } else if (!event.shiftKey && index === items.length - 1) {
        event.preventDefault();
        items[0]?.focus();
      }
    };
    node?.addEventListener("keydown", trap);
    return () => {
      node?.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, []);
  const [step, setStep] = useState(0),
    [level, setLevel] = useState(0),
    [daily, setDaily] = useState(10),
    [date, setDate] = useState("");
  const slides = [
    {
      icon: BookOpen,
      title: "هر واژه، یک تصویر",
      body: "با تصویر و مثال، واژه‌ها را در دل زندگی بشناسید؛ از آشپزی تا علم و حرفه.",
    },
    {
      icon: Headphones,
      title: "بشنوید. به یاد بیاورید.",
      body: "تلفظ را بشنوید، خودتان پاسخ را پیدا کنید و با مرور فاصله‌دار، آن را به خاطر بسپارید.",
    },
    {
      icon: Sparkles,
      title: "آسمان واژه‌های شما",
      body: "با هر قدم، ستاره‌ای روشن می‌شود. در داستان‌ها بخوانید و میان ۳۲ دنیای متفاوت کشف کنید.",
    },
  ];
  const finish = () =>
    store.settings({
      onboarded: true,
      startLevel: level,
      dailyNew: daily,
      examDate: date,
    });
  const slide = slides[step];
  return (
    <div
      className="welcome-root"
      role="dialog"
      aria-modal="true"
      aria-label="به مهردادیکا خوش آمدید"
    >
      <div className="welcome-card" ref={dialog}>
        <div className="welcome-head">
          <Logo compact />
          <button
            className="link"
            onClick={() => (step < 3 ? setStep(3) : finish())}
          >
            {step < 3 ? "رد کردن معرفی" : "شروع با تنظیمات فعلی"}
          </button>
        </div>
        <nav className="welcome-language" aria-label="زبان برنامه">
          {localeRegistry
            .filter((item) => item.href)
            .map((item) => (
              <a
                className="language-link"
                key={item.id}
                href={item.href!}
                lang={item.id}
                dir={item.direction}
                data-locale-link
                data-native-copy
              >
                {item.nativeName}
              </a>
            ))}
        </nav>
        {slide ? (
          <>
            <div className="welcome-art">
              <img
                src={`${import.meta.env.BASE_URL}brand/hero.webp`}
                alt="دنیایی از داستان‌ها در یک کتاب باز"
              />
              <slide.icon size={38} />
            </div>
            <h1>{slide.title}</h1>
            <p className="lede">{slide.body}</p>
            <div className="welcome-dots">
              {slides.map((_, i) => (
                <button
                  key={i}
                  aria-label={`بخش ${faNumber(i + 1)}`}
                  className={i === step ? "is-on" : ""}
                  onClick={() => setStep(i)}
                />
              ))}
            </div>
            <button
              className="btn btn-primary btn-xl"
              onClick={() => setStep(step + 1)}
            >
              {step === 2 ? "نقطهٔ شروع من" : "ادامه"}
              <ArrowLeft size={19} />
            </button>
          </>
        ) : (
          <>
            <h1>از اینجا شروع کنیم.</h1>
            <p className="muted">
              سطح و ریتم خودتان را انتخاب کنید. هر زمان می‌توانید تغییرشان دهید.
            </p>
            <fieldset>
              <legend>سطح انگلیسی شما</legend>
              <div className="level-choices">
                {atlas.cefr.map((name, i) => (
                  <button
                    key={name}
                    className={level === i ? "is-on" : ""}
                    aria-pressed={level === i}
                    onClick={() => setLevel(i)}
                  >
                    <b dir="ltr">{name}</b>
                    <span>{levelNames[i]}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>هر روز چند معنی تازه؟</legend>
              <div className="segmented">
                {[5, 10, 20, 30].map((n) => (
                  <button
                    key={n}
                    className={daily === n ? "is-on" : ""}
                    onClick={() => setDaily(n)}
                  >
                    {faNumber(n)}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="date-field">
              تاریخ هدف یا آزمون <small>اختیاری</small>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <button className="btn btn-primary btn-xl" onClick={finish}>
              شروع یادگیری <ArrowLeft size={19} />
            </button>
            <p className="onboard-local">
              بدون حساب کاربری. پیشرفت در همین مرورگر ذخیره می‌شود.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
