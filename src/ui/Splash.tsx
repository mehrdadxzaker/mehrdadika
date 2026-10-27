import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { currentUiLocale } from "../i18n/locale";
import { cue, duck } from "../lib/sound";
import { dayKey, store } from "../store/store";

const SEEN_KEY = "mehrdadika:splash";
const TAU = Math.PI * 2;
const colors = ["243,236,223", "230,180,87", "151,184,142"];
const seenKey = () => currentUiLocale() === "fa" ? SEEN_KEY : `${SEEN_KEY}:${currentUiLocale()}`;

export function shouldShowSplash() {
  if (!store.get().settings.splash) return false;
  const segments = location.hash.replace(/^#/, "").split("?")[0].split("/").filter(Boolean);
  if (["pt-BR", "es-419"].includes(segments[0])) segments.shift();
  if (segments.length) return false;
  try { return localStorage.getItem(seenKey()) !== dayKey(); }
  catch { return true; }
}

interface Particle {
  sx: number; sy: number; tx: number; ty: number;
  x: number; y: number; vx: number; vy: number;
  delay: number; radius: number; phase: number; color: string;
}

/** A compact vector mask keeps glimmers on the compass, never on small text. */
function compassPoints(width: number, height: number) {
  const mask = document.createElement("canvas");
  mask.width = Math.max(1, Math.ceil(width)); mask.height = Math.max(1, Math.ceil(height));
  const context = mask.getContext("2d");
  if (!context) return [];
  const size = Math.min(width, height), center = size / 2;
  context.strokeStyle = "white"; context.lineWidth = Math.max(1.3, size / 70);
  context.beginPath(); context.arc(center, center, size * .4, 0, TAU); context.stroke();
  context.beginPath();
  context.moveTo(size * .61, size * .25); context.lineTo(size * .57, size * .57);
  context.lineTo(size * .39, size * .75); context.lineTo(size * .43, size * .43);
  context.closePath(); context.stroke();
  const pixels = context.getImageData(0, 0, mask.width, mask.height).data;
  const points: [number, number][] = [];
  for (let y = 0; y < mask.height; y += 1.5)
    for (let x = 0; x < mask.width; x += 1.5)
      if (pixels[(Math.floor(y) * mask.width + Math.floor(x)) * 4 + 3] > 100) points.push([x, y]);
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [points[i], points[j]] = [points[j], points[i]];
  }
  return points.slice(0, 1000);
}

export function Splash({ onDone }: { onDone: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null), icon = useRef<SVGSVGElement>(null);
  const finish = useRef(onDone), opening = useRef(false);
  const burst = useRef<() => void>(() => {}), timers = useRef<number[]>([]);
  const [phase, setPhase] = useState<"gather" | "ready" | "open">("gather");
  const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => { finish.current = onDone; }, [onDone]);
  useEffect(() => {
    const timer = window.setTimeout(() => setPhase(value => value === "gather" ? "ready" : value), reduce ? 0 : 1300);
    return () => window.clearTimeout(timer);
  }, [reduce]);
  useEffect(() => () => { timers.current.forEach(window.clearTimeout); duck(false); }, []);

  useEffect(() => {
    const element = canvas.current;
    if (!element || reduce) return;
    const context = element.getContext("2d");
    if (!context) return;
    let live = true, animation = 0, width = 0, height = 0;
    let started = performance.now(), lastDraw = 0, openedAt: number | null = null;
    let particles: Particle[] = [];
    let stars: { x: number; y: number; radius: number; phase: number }[] = [];
    const schedule = () => { if (live && !animation && !document.hidden) animation = requestAnimationFrame(frame); };
    function frame(now: number) {
      animation = 0;
      if (!live || document.hidden) return;
      const elapsed = (now - started) / 1000;
      if (now - lastDraw < 1000 / (elapsed < 2 ? 60 : 24)) { schedule(); return; }
      lastDraw = now;
      context!.clearRect(0, 0, width, height);
      for (const star of stars) {
        context!.fillStyle = `rgba(243,236,223,${.12 + .12 * (1 + Math.sin(elapsed + star.phase)) / 2})`;
        context!.beginPath(); context!.arc(star.x, star.y, star.radius, 0, TAU); context!.fill();
      }
      if (opening.current && openedAt === null) {
        openedAt = now;
        for (const particle of particles) {
          const angle = Math.atan2(particle.ty - height * .35, particle.tx - width / 2);
          const speed = 1.5 + Math.random() * 3;
          particle.vx = Math.cos(angle) * speed; particle.vy = Math.sin(angle) * speed;
        }
      }
      const openAge = openedAt === null ? 0 : (now - openedAt) / 1000;
      const fade = Math.max(0, 1 - openAge / 1.1);
      for (const particle of particles) {
        if (openedAt !== null) { particle.x += particle.vx; particle.y += particle.vy; }
        else {
          const progress = Math.min(1, Math.max(0, (elapsed - particle.delay) / 1.15));
          const eased = 1 - Math.pow(1 - progress, 3);
          particle.x = particle.sx + (particle.tx - particle.sx) * eased;
          particle.y = particle.sy + (particle.ty - particle.sy) * eased;
        }
        const alpha = (.4 + .35 * (1 + Math.sin(elapsed * 2 + particle.phase)) / 2) * fade;
        context!.fillStyle = `rgba(${particle.color},${alpha})`;
        context!.beginPath(); context!.arc(particle.x, particle.y, particle.radius, 0, TAU); context!.fill();
      }
      // Stop after the flourish; resume once if the user opens the doors later.
      if (openedAt !== null ? openAge < 1.1 : elapsed < 7) schedule();
    }
    const resize = () => {
      if (!live) return;
      if (animation) cancelAnimationFrame(animation);
      animation = 0;
      const bounds = element.getBoundingClientRect(), compass = icon.current?.getBoundingClientRect();
      width = bounds.width; height = bounds.height;
      if (!width || !height || !compass) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      element.width = Math.round(width * dpr); element.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = compassPoints(compass.width, compass.height).map(([x, y], index) => {
        const sx = Math.random() * width, sy = Math.random() * height;
        return { sx, sy, x: sx, y: sy, tx: compass.left - bounds.left + x, ty: compass.top - bounds.top + y,
          vx: 0, vy: 0, radius: index % 17 === 0 ? 1.25 : .65 + Math.random() * .4,
          color: colors[index % colors.length], delay: Math.random() * .25, phase: Math.random() * TAU };
      });
      stars = Array.from({ length: Math.min(80, Math.round(width * height / 18000)) }, () => ({
        x: Math.random() * width, y: Math.random() * height, radius: .3 + Math.random() * .55, phase: Math.random() * TAU,
      }));
      started = performance.now(); lastDraw = 0; openedAt = null;
      schedule();
    };
    const visibility = () => {
      if (document.hidden) { if (animation) cancelAnimationFrame(animation); animation = 0; }
      else schedule();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element); if (icon.current) observer.observe(icon.current);
    document.addEventListener("visibilitychange", visibility);
    burst.current = schedule; resize();
    void document.fonts.ready.then(() => { if (live && !opening.current) resize(); });
    return () => {
      live = false; if (animation) cancelAnimationFrame(animation);
      observer.disconnect(); document.removeEventListener("visibilitychange", visibility); burst.current = () => {};
    };
  }, [reduce]);

  const open = useCallback((sound = true) => {
    if (opening.current) return;
    opening.current = true;
    try { localStorage.setItem(seenKey(), dayKey()); } catch { /* Intro preferences are optional. */ }
    if (sound && store.get().settings.sfx) { void cue("twinkle"); duck(true); }
    setPhase("open"); burst.current();
    timers.current.push(window.setTimeout(() => finish.current(), reduce ? 220 : 1350));
  }, [reduce]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); open(false); return; }
      if ((event.target as HTMLElement)?.closest("a, button, input, select, textarea")) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); }
    };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  }, [open]);

  return <div className={`splash is-${phase} ${reduce ? "is-reduced" : ""}`} role="dialog" aria-modal="true" aria-label="به دنیای واژه‌ها خوش آمدید؛ برای ورود انتخاب کنید">
    <div className="door door-l" /><div className="door door-r" /><div className="splash-light" />
    <canvas ref={canvas} className="splash-canvas" aria-hidden="true" />
    <nav className="splash-languages" aria-label="زبان برنامه">
      <a className="language-link" href="#/" lang="fa" dir="rtl" data-locale-link data-native-copy>فارسی</a>
      <a className="language-link" href="#/pt-BR" lang="pt-BR" dir="ltr" data-locale-link data-native-copy>Português</a>
      <a className="language-link" href="#/es-419" lang="es-419" dir="ltr" data-locale-link data-native-copy>Español</a>
    </nav>
    <div className="splash-brand">
      <svg ref={icon} className="splash-compass" viewBox="0 0 128 128" aria-hidden="true">
        <circle cx="64" cy="64" r="51.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M78.08 32 72.96 72.96 49.92 96 55.04 55.04Z" fill="currentColor" fillOpacity=".16" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="64" cy="64" r="3" fill="currentColor" />
      </svg>
      <h1 className="splash-name">مهردادیکا</h1>
      <p className="splash-wordmark" lang="en" dir="ltr">VISUAL ENGLISH ATLAS</p>
    </div>
    <div className="splash-copy">
      <p className="splash-tag">هر واژه، دری به یک دنیا</p>
      <button className="splash-enter" onClick={() => open()} autoFocus>ورود به اطلس <ArrowLeft size={18} /></button>
      <p className="splash-hint"><kbd>Enter</kbd><span>یا دکمهٔ ورود را انتخاب کنید</span></p>
    </div>
    <button className="splash-skip" onClick={() => open(false)}>رد کردن</button>
  </div>;
}
