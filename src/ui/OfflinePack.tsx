import { uiIntlLocale } from "../i18n/locale";
import { Download, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAtlas } from "../atlas/context";
import {
  downloadOfflinePack,
  offlinePackInfo,
  removeOfflinePacks,
} from "../atlas/offline";
import { faNumber } from "../i18n";

export function OfflinePack() {
  const atlas = useAtlas();
  const [info, setInfo] = useState(offlinePackInfo);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [message, setMessage] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const download = async () => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    setProgress({ done: 0, total: 0 });
    const abort = new AbortController();
    controller.current = abort;
    try {
      setInfo(
        await downloadOfflinePack(
          atlas,
          (done, total) => setProgress({ done, total }),
          abort.signal,
        ),
      );
      setMessage("بسته با موفقیت برای مطالعهٔ آفلاین ذخیره شد.");
    } catch (error) {
      setMessage(
        error instanceof Error && error.name === "AbortError"
          ? "دریافت بسته متوقف شد؛ بستهٔ قبلی حفظ شده است."
          : error instanceof Error
            ? error.message
            : "دریافت بسته ناموفق بود. فضای مرورگر و اتصال را بررسی کنید.",
      );
    } finally {
      setBusy(false);
      controller.current = null;
    }
  };
  const remove = async () => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await removeOfflinePacks();
      setInfo(null);
      setMessage("فایل‌های بستهٔ آفلاین پاک شدند؛ سابقهٔ یادگیری حفظ شده است.");
    } catch {
      setMessage("پاک کردن بسته ممکن نشد؛ دوباره امتحان کنید.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="panel offline-panel">
      <h3 className="eyebrow">مطالعهٔ آفلاین</h3>
      <p className="muted">
        واژه‌ها، تصویرها و صدای نسخهٔ فعلی را یک‌جا ذخیره کنید. آماده شدن بسته
        پس از دریافت و بررسی همهٔ فایل‌ها اعلام می‌شود.
      </p>
      {info && (
        <p>
          {faNumber(info.files)} فایل ·{" "}
          {(info.bytes / 1048576).toLocaleString(uiIntlLocale(), {
            maximumFractionDigits: 1,
          })}{" "}
          مگابایت · ذخیره‌شده در{" "}
          {new Date(info.savedAt).toLocaleDateString(uiIntlLocale())}
        </p>
      )}
      {busy && (
        <p role="status" aria-live="polite">
          {progress.total
            ? `${faNumber(progress.done)} از ${faNumber(progress.total)} فایل`
            : "در حال آماده‌سازی…"}
        </p>
      )}
      {busy && progress.total > 0 && (
        <progress
          max={progress.total}
          value={progress.done}
          aria-label="پیشرفت دریافت بستهٔ آفلاین"
        />
      )}
      <div className="data-actions">
        <button className="btn btn-ghost" disabled={busy} onClick={download}>
          <Download size={18} />
          {info ? "دریافت دوبارهٔ نسخهٔ فعلی" : "دریافت بستهٔ آفلاین"}
        </button>
        {busy && controller.current && (
          <button
            className="btn btn-ghost"
            onClick={() => controller.current?.abort()}
          >
            <X size={18} />
            توقف دریافت
          </button>
        )}
        {info && (
          <button className="btn btn-ghost" disabled={busy} onClick={remove}>
            <Trash2 size={18} />
            پاک کردن فایل‌های آفلاین
          </button>
        )}
      </div>
      {message && (
        <p className="muted" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
