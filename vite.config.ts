import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
  base: process.env.ATLAS_BASE || "/",
  plugins: [
    react({ jsxImportSource: "@mehrdadika/i18n" }),
    {
      name: "mehrdadika-local-jsx-runtime",
      enforce: "post",
      config(config) {
        // plugin-react explicitly includes its importSource runtimes in dependency optimization.
        // Remove our application runtimes after that hook so the loader and JSX share one catalog.
        config.optimizeDeps ??= {};
        config.optimizeDeps.include = [
          ...(config.optimizeDeps.include ?? []).filter(
            (id) => !id.startsWith("@mehrdadika/i18n"),
          ),
          "react/jsx-runtime",
          "react/jsx-dev-runtime",
        ];
      },
    },
  ],
  resolve: {
    alias: {
      "@mehrdadika/i18n": fileURLToPath(new URL("./src/i18n", import.meta.url)),
    },
  },
  // This is application code, not a dependency: prebundling would duplicate its catalog state.
  optimizeDeps: {
    exclude: [
      "@mehrdadika/i18n",
      "@mehrdadika/i18n/jsx-runtime",
      "@mehrdadika/i18n/jsx-dev-runtime",
    ],
  },
  server: { host: "127.0.0.1", port: 5188, strictPort: true },
  preview: { host: "127.0.0.1", port: 5188, strictPort: true },
  build: { manifest: "app-manifest.json", chunkSizeWarningLimit: 600 },
});
