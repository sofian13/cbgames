import type { CapacitorConfig } from "@capacitor/cli";

// App 100 % hors-ligne : les jeux (un seul téléphone) sont embarqués (zinzin/dist).
// Build : npm run app:build && npx cap sync ios
// Dev à chaud : CAP_DEV_URL=http://localhost:5174 npx cap sync ios (+ npm run app:dev)
const devUrl = process.env.CAP_DEV_URL;

const config: CapacitorConfig = {
  appId: "fr.zinzin.app",
  appName: "Zinzin",
  webDir: "zinzin/dist",
  backgroundColor: "#0E0828",
  appendUserAgent: "ZinzinApp",
  server: devUrl ? { url: devUrl, cleartext: true } : undefined,
  ios: {
    contentInset: "never",
    backgroundColor: "#0E0828",
    scrollEnabled: true,
  },
  android: {
    backgroundColor: "#0E0828",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      backgroundColor: "#0E0828",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      overlaysWebView: true,
    },
  },
};

export default config;
