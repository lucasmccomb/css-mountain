import { describe, it, expect, beforeEach } from "vitest";
import { settingsStore, DEFAULT_SETTINGS } from "./settings-store";

describe("settingsStore", () => {
  beforeEach(() => {
    settingsStore.getState().resetToDefaults();
  });

  it("starts with default settings", () => {
    const state = settingsStore.getState();
    expect(state.crtMode).toBe(true);
    expect(state.audioEnabled).toBe(true);
    expect(state.audioVolume).toBe(0.7);
    expect(state.showBootSequence).toBe(true);
    expect(state.theme).toBe("vga");
  });

  it("toggles CRT mode", () => {
    settingsStore.getState().setCrtMode(false);
    expect(settingsStore.getState().crtMode).toBe(false);
  });

  it("toggles audio", () => {
    settingsStore.getState().setAudioEnabled(false);
    expect(settingsStore.getState().audioEnabled).toBe(false);
  });

  it("sets audio volume clamped to 0-1", () => {
    settingsStore.getState().setAudioVolume(0.5);
    expect(settingsStore.getState().audioVolume).toBe(0.5);

    settingsStore.getState().setAudioVolume(-0.5);
    expect(settingsStore.getState().audioVolume).toBe(0);

    settingsStore.getState().setAudioVolume(1.5);
    expect(settingsStore.getState().audioVolume).toBe(1);
  });

  it("toggles boot sequence", () => {
    settingsStore.getState().setShowBootSequence(false);
    expect(settingsStore.getState().showBootSequence).toBe(false);
  });

  it("sets theme", () => {
    settingsStore.getState().setTheme("cga");
    expect(settingsStore.getState().theme).toBe("cga");
  });

  it("loads partial settings", () => {
    settingsStore
      .getState()
      .loadSettings({ crtMode: false, audioVolume: 0.3 });

    const state = settingsStore.getState();
    expect(state.crtMode).toBe(false);
    expect(state.audioVolume).toBe(0.3);
    // Other settings remain
    expect(state.audioEnabled).toBe(true);
  });

  it("resets to defaults", () => {
    settingsStore.getState().setCrtMode(false);
    settingsStore.getState().setTheme("cga");
    settingsStore.getState().setAudioVolume(0.1);

    settingsStore.getState().resetToDefaults();

    const state = settingsStore.getState();
    expect(state.crtMode).toBe(DEFAULT_SETTINGS.crtMode);
    expect(state.theme).toBe(DEFAULT_SETTINGS.theme);
    expect(state.audioVolume).toBe(DEFAULT_SETTINGS.audioVolume);
  });
});
