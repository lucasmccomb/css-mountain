import { useCallback } from "react";
import { useStore } from "zustand";
import { settingsStore } from "@css-mountain/core";
import { Terminal, Button } from "@css-mountain/shared-ui";
import styles from "./SettingsScreen.module.css";

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const crtMode = useStore(settingsStore, (s) => s.crtMode);
  const audioEnabled = useStore(settingsStore, (s) => s.audioEnabled);
  const audioVolume = useStore(settingsStore, (s) => s.audioVolume);
  const theme = useStore(settingsStore, (s) => s.theme);

  const setCrtMode = useStore(settingsStore, (s) => s.setCrtMode);
  const setAudioEnabled = useStore(settingsStore, (s) => s.setAudioEnabled);
  const setAudioVolume = useStore(settingsStore, (s) => s.setAudioVolume);
  const setTheme = useStore(settingsStore, (s) => s.setTheme);
  const resetToDefaults = useStore(settingsStore, (s) => s.resetToDefaults);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAudioVolume(Number(e.target.value));
    },
    [setAudioVolume],
  );

  const handleThemeToggle = useCallback(() => {
    setTheme(theme === "vga" ? "cga" : "vga");
  }, [theme, setTheme]);

  return (
    <div className={styles.container} data-testid="settings-screen">
      <div className={styles.content}>
        <Terminal title="Settings">
          <div className={styles.settingGroup}>
            {/* CRT Mode */}
            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>CRT Scanlines</span>
              <button
                className={`${styles.toggle} ${crtMode ? styles.toggleOn : styles.toggleOff}`}
                onClick={() => setCrtMode(!crtMode)}
                data-testid="crt-toggle"
              >
                {crtMode ? "ON" : "OFF"}
              </button>
            </div>

            {/* Audio */}
            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Sound Effects</span>
              <button
                className={`${styles.toggle} ${audioEnabled ? styles.toggleOn : styles.toggleOff}`}
                onClick={() => setAudioEnabled(!audioEnabled)}
                data-testid="audio-toggle"
              >
                {audioEnabled ? "ON" : "OFF"}
              </button>
            </div>

            {/* Volume */}
            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Volume</span>
              <div className={styles.volumeSlider}>
                <input
                  type="range"
                  className={styles.slider}
                  min={0}
                  max={1}
                  step={0.1}
                  value={audioVolume}
                  onChange={handleVolumeChange}
                  aria-label="Audio volume"
                  data-testid="volume-slider"
                />
                <span className={styles.volumeLabel}>
                  {Math.round(audioVolume * 100)}%
                </span>
              </div>
            </div>

            {/* Theme */}
            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Color Theme</span>
              <button
                className={styles.toggle}
                onClick={handleThemeToggle}
                data-testid="theme-toggle"
              >
                {theme.toUpperCase()}
              </button>
            </div>
          </div>

          <div className={styles.actions}>
            <Button onClick={resetToDefaults} variant="danger">
              Reset Defaults
            </Button>
            <Button onClick={onBack} variant="primary">
              Back
            </Button>
          </div>
        </Terminal>
      </div>
    </div>
  );
}
