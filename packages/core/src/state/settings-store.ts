import { createStore } from "zustand/vanilla";
import type { PlayerSettings } from "../types";

/**
 * Settings state with defaults for the DOS-styled experience.
 */
export interface SettingsState extends PlayerSettings {
  // Actions
  setCrtMode: (enabled: boolean) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setAudioVolume: (volume: number) => void;
  setShowBootSequence: (show: boolean) => void;
  setTheme: (theme: "vga" | "cga") => void;
  loadSettings: (settings: Partial<PlayerSettings>) => void;
  resetToDefaults: () => void;
}

/** Default player settings */
export const DEFAULT_SETTINGS: PlayerSettings = {
  crtMode: true,
  audioEnabled: true,
  audioVolume: 0.7,
  showBootSequence: true,
  theme: "vga",
};

/**
 * Create the settings store with sensible defaults.
 */
export const settingsStore = createStore<SettingsState>()((set) => ({
  ...DEFAULT_SETTINGS,

  setCrtMode: (enabled) => set({ crtMode: enabled }),

  setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),

  setAudioVolume: (volume) =>
    set({ audioVolume: Math.max(0, Math.min(1, volume)) }),

  setShowBootSequence: (show) => set({ showBootSequence: show }),

  setTheme: (theme) => set({ theme }),

  loadSettings: (settings) => set((state) => ({ ...state, ...settings })),

  resetToDefaults: () => set(DEFAULT_SETTINGS),
}));
