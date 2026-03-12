import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// DOS design system styles (order matters)
import "@css-mountain/shared-ui/styles/fonts.css";
import "@css-mountain/shared-ui/styles/tokens.css";
import "@css-mountain/shared-ui/styles/reset.css";
import "@css-mountain/shared-ui/styles/breakpoints.css";

import { App } from "./app";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
