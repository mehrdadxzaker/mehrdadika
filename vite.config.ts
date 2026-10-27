import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: process.env.ATLAS_BASE || "/",
  plugins: [react()],
  server: { host: "127.0.0.1", port: 5188, strictPort: true },
  preview: { host: "127.0.0.1", port: 5188, strictPort: true },
  build: { manifest: "app-manifest.json", chunkSizeWarningLimit: 600 },
});
