import type { CapacitorConfig } from "@capacitor/cli";

// L'app charge le site déployé (les parties passent par PartyKit en temps réel).
// En dev : CAP_DEV_URL=http://localhost:3000 npx cap sync ios
const devUrl = process.env.CAP_DEV_URL;

const config: CapacitorConfig = {
  appId: "fr.zinzin.app",
  appName: "Zinzin",
  webDir: "cap-www",
  backgroundColor: "#0E0828",
  // Permet au site de savoir qu'il tourne dans l'app (accueil /app, jeux phares…)
  appendUserAgent: "ZinzinApp",
  server: {
    url: `${devUrl ?? "https://cbgames.vercel.app"}/app`,
    cleartext: Boolean(devUrl),
    errorPath: "index.html",
  },
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
