// Les jeux lisent ce flag au rendu (pas à l'import) : il suffit qu'il soit posé avant render().
(globalThis as { __ZINZIN_OFFLINE__?: boolean }).__ZINZIN_OFFLINE__ = true;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";
import { App } from "./App";
import { initPremium } from "./premium";

initPremium();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
