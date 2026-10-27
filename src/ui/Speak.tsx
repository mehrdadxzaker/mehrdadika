import { Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { play, stopAudio } from "../lib/audio";
import { toast } from "./Toast";

export function Speak({
  url,
  text,
  accent = "uk",
  label,
  size = "md",
  rate = 1,
  className = "",
  kbd,
}: {
  url: string | null;
  text: string;
  accent?: "uk" | "us";
  label?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  rate?: number;
  className?: string;
  kbd?: string;
}) {
  const [on, setOn] = useState(false);
  const mounted = useRef(true);
  const request = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current++; };
  }, []);
  const run = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const token = ++request.current;
    if (on) {
      stopAudio();
      setOn(false);
      return;
    }
    setOn(true);
    try {
      const result = await play(url, text, accent, rate);
      if (mounted.current && token === request.current && result === "unsupported")
        toast("پخش این صدا در مرورگر فعلی در دسترس نیست.", "warn");
    } catch {
      if (mounted.current && token === request.current)
        toast("پخش صدا ممکن نشد؛ دوباره امتحان کنید.", "warn");
    } finally {
      if (mounted.current && token === request.current) setOn(false);
    }
  };
  return (
    <button
      type="button"
      className={`speak speak-${size} ${on ? "is-on" : ""} ${label ? "has-label" : ""} ${className}`}
      onClick={run}
      aria-label={
        on
          ? "توقف پخش"
          : typeof label === "string"
            ? `پخش ${label}`
            : `پخش تلفظ ${accent === "uk" ? "بریتانیایی" : "آمریکایی"} ${text}`
      }
      aria-pressed={on}
      title={kbd ? `پخش صدا (${kbd})` : "پخش صدا"}
    >
      <span className="speak-icon">
        <Volume2
          size={size === "lg" ? 22 : size === "sm" ? 15 : 18}
          strokeWidth={1.8}
        />
        <span className="speak-waves" />
      </span>
      {label && <span className="speak-label">{label}</span>}
    </button>
  );
}
