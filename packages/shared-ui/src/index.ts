/**
 * Shared DOS-styled UI components for CSS Mountain.
 *
 * This package provides the retro DOS terminal aesthetic
 * used across the application.
 */

// ── Styles (import for side effects) ──
// Consumers should import these in their entry point:
//   import "@css-mountain/shared-ui/styles/fonts.css";
//   import "@css-mountain/shared-ui/styles/tokens.css";
//   import "@css-mountain/shared-ui/styles/reset.css";
//   import "@css-mountain/shared-ui/styles/breakpoints.css";

// ── Components ──
export { ASCIIBorder } from "./components/ASCIIBorder";
export { Terminal } from "./components/Terminal";
export { Menu } from "./components/Menu";
export { Dialog } from "./components/Dialog";
export { Button } from "./components/Button";
export { ProgressBar } from "./components/ProgressBar";
export { TextInput } from "./components/TextInput";
export { CRTOverlay } from "./components/CRTOverlay";

// ── Hooks ──
export { useKeyboardNav } from "./hooks/useKeyboardNav";
export { useCRTMode } from "./hooks/useCRTMode";
