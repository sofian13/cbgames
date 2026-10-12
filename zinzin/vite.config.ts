import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// App mobile Zinzin : bundle 100 % hors-ligne, embarqué dans Capacitor.
// Réutilise les jeux du site via l'alias "@" → ../src.
// En build uniquement (le dev a besoin du WebSocket HMR) : l'interface ne peut joindre
// AUCUN serveur. Les achats passent par le SDK natif (Apple / RevenueCat), hors webview.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' data: blob:",
  "connect-src 'self'",
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
