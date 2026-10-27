import type { Atlas, Entry } from "../atlas/types";
import { toast } from "./Toast";

const SERIF = '"Fraunces Variable", Georgia, serif';
const SANS = '"Vazirmatn Variable", sans-serif';

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const timer = window.setTimeout(() => {
      image.onload = null;
      image.onerror = null;
      image.src = "";
      reject(new Error("Image timed out"));
    }, 15000);
    image.onload = () => {
      clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      clearTimeout(timer);
      reject(new Error("Image unavailable"));
    };
    image.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const token of text.split(/(\s+)/)) {
    const next = line + token;
    if (ctx.measureText(next).width > width && line.trim()) {
      lines.push(line.trim());
      line = token.trimStart();
    } else line = next;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

export async function renderWordCard(atlas: Atlas, entry: Entry) {
  const W = 1080,
    H = 1440,
    pad = 72,
    width = W - pad * 2;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  await Promise.all([
    document.fonts.load(`600 100px ${SERIF}`),
    document.fonts.load(`500 36px ${SANS}`),
  ]);
  ctx.fillStyle = "#f6f1e7";
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(pad, pad, width, 640, 36);
  ctx.clip();
  ctx.fillStyle = "#eae1d0";
  ctx.fillRect(pad, pad, width, 640);
  const src = atlas.img(entry);
  if (src) {
    const image = await loadImage(src);
    const scale = Math.max(width / image.width, 640 / image.height);
    const sw = width / scale,
      sh = 640 / scale;
    ctx.drawImage(
      image,
      (image.width - sw) / 2,
      (image.height - sh) / 2,
      sw,
      sh,
      pad,
      pad,
      width,
      640,
    );
  }
  ctx.restore();
  ctx.direction = "ltr";
  ctx.textAlign = "left";
  ctx.fillStyle = "#1e2640";
  ctx.font = `600 ${entry.w.length > 15 ? 82 : 108}px ${SERIF}`;
  ctx.fillText(entry.w, pad, 840, width);
  ctx.fillStyle = "#6b6f80";
  ctx.font = `400 30px ${SANS}`;
  ctx.fillText(`UK ${entry.uk}    US ${entry.us}`, pad, 900, width);
  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.fillStyle = "#1e2640";
  ctx.font = `600 38px ${SANS}`;
  let y = 970;
  for (const line of wrap(
    ctx,
    entry.senses
      .slice(0, 2)
      .map((sense) => sense.fa)
      .join("؛ "),
    width,
  ).slice(0, 2)) {
    ctx.fillText(line, W - pad, y);
    y += 52;
  }
  if (entry.ex[0]) {
    y += 28;
    ctx.direction = "ltr";
    ctx.textAlign = "left";
    ctx.font = `400 34px ${SERIF}`;
    ctx.fillStyle = "#3c4560";
    for (const line of wrap(ctx, entry.ex[0].en, width).slice(0, 2)) {
      ctx.fillText(line, pad, y);
      y += 45;
    }
    y += 12;
    ctx.direction = "rtl";
    ctx.textAlign = "right";
    ctx.font = `400 30px ${SANS}`;
    ctx.fillStyle = "#6b6f80";
    for (const line of wrap(ctx, entry.ex[0].fa, width).slice(0, 2)) {
      ctx.fillText(line, W - pad, y);
      y += 42;
    }
  }
  ctx.fillStyle = "rgba(30,38,64,.14)";
  ctx.fillRect(pad, H - 136, width, 1);
  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.fillStyle = "#1e2640";
  ctx.font = `600 32px ${SANS}`;
  ctx.fillText("مهردادیکا · یک واژه، یک تصویر", W - pad, H - 82);
  ctx.direction = "ltr";
  ctx.textAlign = "left";
  ctx.fillStyle = "#7a7c88";
  ctx.font = `400 21px ${SANS}`;
  ctx.fillText(
    "Adapted from Word Atlas contributors · CC BY 4.0",
    pad,
    H - 38,
    width,
  );
  return canvas;
}

export async function shareWord(atlas: Atlas, entry: Entry) {
  try {
    const canvas = await renderWordCard(atlas, entry);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("Canvas export failed");
    const file = new File(
      [blob],
      `mehrdadika-${entry.lexicalId ?? entry.id}.png`,
      { type: "image/png" },
    );
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: entry.w });
      return;
    }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = file.name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 2000);
    toast("کارت تصویری ذخیره شد.", "ok");
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return;
    toast("ساخت کارت ممکن نشد؛ دوباره امتحان کنید.", "warn");
  }
}
