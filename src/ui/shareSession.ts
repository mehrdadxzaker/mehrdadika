import { tr } from "../i18n/messages";
import { uiIntlLocale, uiDirection } from "../i18n/locale";
import type { Atlas } from "../atlas/types";
import { sessionStats } from "../store/session";
import { Rating } from "../store/srs";
import type { ActiveSession } from "../store/store";
import { toast } from "./Toast";

const SERIF = '"Fraunces Variable", Georgia, serif';
const SANS = '"Vazirmatn Variable", sans-serif';
const load = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    const timer = window.setTimeout(() => {
      image.onload = null;
      image.onerror = null;
      image.src = "";
      resolve(null);
    }, 15000);
    image.onload = () => {
      clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    image.src = src;
  });

export async function shareSession(atlas: Atlas, session: ActiveSession) {
  try {
    const W = 1080,
      H = 1350,
      pad = 64,
      gap = 16,
      cell = (W - pad * 2 - gap * 2) / 3;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    await Promise.all([
      document.fonts.load(`600 60px ${SERIF}`),
      document.fonts.load(`500 36px ${SANS}`),
    ]);
    const seen = new Set<string>();
    const refs = session.steps
      .map((step) => atlas.byId.get(step.id))
      .filter((ref) => {
        if (!ref) return false;
        const id = ref.lexicalId ?? ref.id;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    const tiles = refs
      .filter((ref): ref is NonNullable<typeof ref> => !!ref)
      .slice(0, 9);
    const images: (HTMLImageElement | null)[] = new Array(tiles.length).fill(
      null,
    );
    let cursor = 0;
    await Promise.all(
      Array.from({ length: Math.min(3, tiles.length) }, async () => {
        while (cursor < tiles.length) {
          const i = cursor++;
          const src = atlas.img(tiles[i], "thumb");
          if (src) images[i] = await load(src);
        }
      }),
    );
    ctx.fillStyle = "#f6f1e7";
    ctx.fillRect(0, 0, W, H);
    tiles.forEach((ref, i) => {
      const x = pad + (i % 3) * (cell + gap),
        y = pad + Math.floor(i / 3) * (cell + gap);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, cell, cell, 24);
      ctx.clip();
      ctx.fillStyle = "#eae1d0";
      ctx.fillRect(x, y, cell, cell);
      if (images[i]) ctx.drawImage(images[i]!, x, y, cell, cell);
      const shade = ctx.createLinearGradient(0, y + cell / 2, 0, y + cell);
      shade.addColorStop(0, "transparent");
      shade.addColorStop(1, "rgba(0,0,0,.55)");
      ctx.fillStyle = shade;
      ctx.fillRect(x, y, cell, cell);
      ctx.restore();
      ctx.direction = "ltr";
      ctx.textAlign = "left";
      ctx.font = `600 30px ${SERIF}`;
      ctx.fillStyle = "#fbf8f2";
      ctx.fillText(ref.word, x + 20, y + cell - 22, cell - 40);
    });
    const stats = sessionStats(session),
      wrong = Object.values(session.graded).filter(
        (grade) => grade === Rating.Again,
      ).length;
    const y = pad + 3 * cell + 2 * gap + 92;
    ctx.direction = uiDirection();
    ctx.textAlign = uiDirection() === "rtl" ? "right" : "left";
    ctx.fillStyle = "#8a8c96";
    ctx.font = `500 28px ${SANS}`;
    ctx.fillText(new Date().toLocaleDateString(uiIntlLocale()), uiDirection() === "rtl" ? W - pad : pad, y - 24);
    ctx.fillStyle = "#1e2640";
    ctx.font = `600 52px ${SANS}`;
    ctx.fillText(
      tr(`${seen.size.toLocaleString(uiIntlLocale())} واژه، ${stats.accuracy.toLocaleString(uiIntlLocale())}٪ پاسخ نخست درست`),
      uiDirection() === "rtl" ? W - pad : pad,
      y + 52,
      W - 2 * pad,
    );
    ctx.font = `400 28px ${SANS}`;
    ctx.fillStyle = "#5a6075";
    ctx.fillText(
      tr(`معنی تازه: ${session.newIds.length.toLocaleString(uiIntlLocale())} · مرور: ${session.reviewIds.length.toLocaleString(uiIntlLocale())} · تمرین بیشتر: ${wrong.toLocaleString(uiIntlLocale())}`),
      uiDirection() === "rtl" ? W - pad : pad,
      y + 110,
      W - pad * 2,
    );
    ctx.fillStyle = "rgba(30,38,64,.14)";
    ctx.fillRect(pad, H - 126, W - 2 * pad, 1);
    ctx.fillStyle = "#1e2640";
    ctx.font = `600 30px ${SANS}`;
    ctx.fillText(tr("مهردادیکا · آسمان یادگیری من"), uiDirection() === "rtl" ? W - pad : pad, H - 74);
    ctx.direction = "ltr";
    ctx.textAlign = "left";
    ctx.font = `400 20px ${SANS}`;
    ctx.fillStyle = "#8a8c96";
    ctx.fillText(
      "Illustrations: Word Atlas contributors · CC BY 4.0",
      pad,
      H - 34,
      W - pad * 2,
    );
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("Export failed");
    const file = new File(
      [blob],
      `mehrdadika-session-${new Date().toISOString().slice(0, 10)}.png`,
      { type: "image/png" },
    );
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] });
      return;
    }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = file.name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 2000);
    toast("کارت پیشرفت ذخیره شد.", "ok");
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return;
    toast("ساخت کارت پیشرفت ممکن نشد.", "warn");
  }
}
