import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// App mobile Zinzin : bundle 100 % hors-ligne, embarqué dans Capacitor.
// Réutilise les jeux du site via l'alias "@" → ../src.
// En build uniquement (le dev a besoin du WebSocket HMR) : l'interface ne peut joindre
// AUCUN serveur. Les achats passent par le SDK natif (Apple / RevenueCat), hors webview.
// L'origine de l'app est capacitor://localhost (iOS) ou https://localhost (Android) :
// on la cite explicitement, la webview ne l'associe pas toujours à 'self'.
const APP = "'self' capacitor://localhost https://localhost http://localhost";
const CSP = [
  `default-src ${APP}`,
  `script-src ${APP}`,
  `style-src ${APP} 'unsafe-inline'`,
  `img-src ${APP} data: blob:`,
  `font-src ${APP} data:`,
  `media-src ${APP} data: blob:`,
  `connect-src ${APP}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");

export default defineConfig({
  root: __dirname,
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    {
      // Les polices du site sont chargées depuis Internet : dans l'app elles sont embarquées
      name: "zinzin-no-remote-fonts",
      apply: "build",
      generateBundle(_opts: unknown, bundle: Record<string, { type: string; fileName: string; source?: string | Uint8Array }>) {
        for (const asset of Object.values(bundle)) {
          if (asset.type === "asset" && asset.fileName.endsWith(".css") && typeof asset.source === "string") {
            asset.source = asset.source.replace(/@import\s*(?:url\(\s*)?(["'])https:[^"']*\1\s*\)?\s*;?/g, "");
          }
        }
      },
    },
    {
      name: "zinzin-csp",
      apply: "build",
      transformIndexHtml: (html: string) =>
        html.replace("<head>", `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src"),
    },
    dedupe: ["react", "react-dom"],
  },
  define: {
    // Le code partagé lit process.env.NEXT_PUBLIC_* (inutile hors-ligne)
    "process.env": {},
  },
  server: { port: 5174, host: true },
  build: { outDir: "dist", emptyOutDir: true, target: "es2020" },
});
