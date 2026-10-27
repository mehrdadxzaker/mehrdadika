import { toast } from "../ui/Toast";
const FONT = '"Vazirmatn Variable", sans-serif';

export async function shareGalaxy(
  source: HTMLCanvasElement,
  lit: number,
  total: number,
) {
  try {
    const W = 1080,
      H = 1350,
      pad = 72;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    await document.fonts.load(`600 64px ${FONT}`);
    ctx.fillStyle = "#090c18";
    ctx.fillRect(0, 0, W, H);
    const scale = Math.max(W / source.width, 1020 / source.height),
      sw = W / scale,
      sh = 1020 / scale;
    ctx.drawImage(
      source,
      (source.width - sw) / 2,
      (source.height - sh) / 2,
      sw,
      sh,
      0,
      0,
      W,
      1020,
    );
    const fade = ctx.createLinearGradient(0, 760, 0, 1080);
    fade.addColorStop(0, "rgba(9,12,24,0)");
    fade.addColorStop(1, "rgba(9,12,24,1)");
    ctx.fillStyle = fade;
    ctx.fillRect(0, 760, W, 330);
    ctx.direction = "rtl";
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(243,236,223,.62)";
    ctx.font = `500 28px ${FONT}`;
    ctx.fillText("آسمان واژگان من", W - pad, 1100);
    ctx.fillStyle = "#f3ecdf";
    ctx.font = `600 66px ${FONT}`;
    ctx.fillText(
      `${lit.toLocaleString("fa-IR")} ستاره روشن شده`,
      W - pad,
      1184,
      W - pad * 2,
    );
    ctx.font = `400 28px ${FONT}`;
    ctx.fillStyle = "rgba(243,236,223,.6)";
    ctx.fillText(
      `از ${total.toLocaleString("fa-IR")} واژهٔ منتشرشده · هر واژه، یک ستاره`,
      W - pad,
      1240,
      W - pad * 2,
    );
    ctx.fillStyle = "rgba(243,236,223,.16)";
    ctx.fillRect(pad, H - 72, W - pad * 2, 1);
    ctx.fillStyle = "#f3ecdf";
    ctx.font = `600 28px ${FONT}`;
    ctx.fillText("مهردادیکا · یک واژه، یک تصویر", W - pad, H - 30);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("Export failed");
    const file = new File([blob], "mehrdadika-galaxy.png", {
      type: "image/png",
    });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] });
      return;
    }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = file.name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 2000);
    toast("تصویر آسمان ذخیره شد.", "ok");
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return;
    toast("ساخت تصویر آسمان ممکن نشد.", "warn");
  }
}
