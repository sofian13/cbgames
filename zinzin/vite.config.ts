import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// App mobile Zinzin : bundle 100 % hors-ligne, embarqué dans Capacitor.
// Réutilise les jeux du site via l'alias "@" → ../src.
export default defineConfig({
  root: __dirname,
  base: "./",
  plugins: [react(), tailwindcss()],
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
