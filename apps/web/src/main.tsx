import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// DOS design system styles (order matters)
import "@css-mountain/shared-ui/styles/fonts.css";
import "@css-mountain/shared-ui/styles/tokens.css";
import "@css-mountain/shared-ui/styles/reset.css";
import "@css-mountain/shared-ui/styles/breakpoints.css";

import { App } from "./app";
import { initErrorReporter } from "./services/error-reporter";
import { initSyncListeners } from "./services/sync-service";

// Initialize global error reporter
const cleanupErrors = initErrorReporter();

// Initialize offline sync listeners
const cleanupSync = initSyncListeners();

// Register service worker for PWA/offline support
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register("/sw.js").catch(() => {
    // SW registration failed - app still works without it
  });
}

// Cleanup on HMR dispose (dev only)
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanupErrors();
    cleanupSync();
  });
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
