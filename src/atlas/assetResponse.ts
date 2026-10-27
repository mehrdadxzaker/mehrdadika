export class AssetResponseError extends Error {
  constructor(
    public kind: "http" | "partial" | "integrity",
    public path: string,
    public status: number,
  ) {
    super(
      kind === "http"
        ? "دریافت فایل آفلاین ناموفق بود. دوباره تلاش کنید."
        : "فایل آفلاین کامل دریافت یا تأیید نشد. دوباره تلاش کنید.",
    );
    this.name = "AssetResponseError";
  }
}
async function checksum(data: ArrayBuffer) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", data))]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}
/** Cache API cannot store206. Normalize only a demonstrably complete representation. */
export async function verifiedAssetResponse(
  response: Response,
  expectedHash: string | undefined,
  path: string,
): Promise<{ response: Response; data: ArrayBuffer }> {
  if (response.status !== 200 && response.status !== 206)
    throw new AssetResponseError("http", path, response.status);
  if (response.status === 206 && !expectedHash)
    throw new AssetResponseError("partial", path, response.status);
  const data = await response.arrayBuffer();
  if (expectedHash && (await checksum(data)) !== expectedHash)
    throw new AssetResponseError("integrity", path, response.status);
  const headers = new Headers(response.headers);
  // Fetch has already decoded transport encoding; these bytes are the full verified body.
  headers.delete("Vary");
  headers.delete("Content-Range");
  headers.delete("Content-Encoding");
  headers.delete("Transfer-Encoding");
  headers.set("Content-Length", String(data.byteLength));
  return { data, response: new Response(data, { status: 200, headers }) };
}
