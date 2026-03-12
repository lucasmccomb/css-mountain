import { useState, useCallback } from "react";
import {
  Terminal,
  Menu,
  Dialog,
  Button,
  ProgressBar,
  TextInput,
  ASCIIBorder,
  CRTOverlay,
  useCRTMode,
} from "@css-mountain/shared-ui";
import styles from "./ComponentDemo.module.css";

export function ComponentDemo() {
  const { enabled: crtEnabled, toggle: toggleCRT } = useCRTMode(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [menuSelection, setMenuSelection] = useState<string | null>(null);
  const [progress, setProgress] = useState(65);

  const handleMenuSelect = useCallback((id: string) => {
    setMenuSelection(id);
  }, []);

  const handleInputSubmit = useCallback((value: string) => {
    setInputValue("");
    setMenuSelection(`Submitted: ${value}`);
  }, []);

  return (
    <div className={styles.page}>
      <CRTOverlay enabled={crtEnabled} />

      <pre className={styles.title}>
        {`\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551  Component Library Demo   \u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D`}
      </pre>

      {/* Terminal */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Terminal</div>
        <Terminal title="System Information">
          <div>CSS Mountain v0.0.0</div>
          <div>DOS Design System loaded.</div>
          <div>VGA 16-color palette active.</div>
          <div style={{ color: "var(--dos-success)" }}>All systems operational.</div>
        </Terminal>
      </div>

      {/* Buttons */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Buttons</div>
        <div className={styles.row}>
          <Button>Default</Button>
          <Button variant="primary">Primary</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>

      {/* Menu */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Menu (use arrow keys)</div>
        {menuSelection && (
          <div className={styles.label}>Selected: {menuSelection}</div>
        )}
        <ASCIIBorder double>
          <Menu
            items={[
              { id: "new", label: "New Game" },
              { id: "continue", label: "Continue" },
              { id: "options", label: "Options" },
              { id: "credits", label: "Credits", disabled: true },
              { id: "quit", label: "Quit" },
            ]}
            onSelect={handleMenuSelect}
          />
        </ASCIIBorder>
      </div>

      {/* Progress Bar */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Progress Bar</div>
        <div className={styles.label}>Mountain Progress</div>
        <ProgressBar value={progress} width={30} />
        <div className={styles.row} style={{ marginTop: "var(--dos-space-1)" }}>
          <Button onClick={() => setProgress((p) => Math.max(0, p - 10))}>-10%</Button>
          <Button onClick={() => setProgress((p) => Math.min(100, p + 10))}>+10%</Button>
        </div>
      </div>

      {/* Text Input */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Text Input</div>
        <TextInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleInputSubmit}
          prompt="C:\CSS_MOUNTAIN> "
          autoFocus
        />
      </div>

      {/* ASCII Border */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>ASCII Borders</div>
        <div className={styles.row}>
          <ASCIIBorder>
            <div style={{ padding: "4px 8px" }}>Single border</div>
          </ASCIIBorder>
          <ASCIIBorder double>
            <div style={{ padding: "4px 8px" }}>Double border</div>
          </ASCIIBorder>
          <ASCIIBorder borderColor="var(--dos-light-cyan)">
            <div style={{ padding: "4px 8px" }}>Colored border</div>
          </ASCIIBorder>
        </div>
      </div>

      {/* Color Palette */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>VGA 16-Color Palette</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
          {[
            ["Black", "--dos-black", "--dos-white"],
            ["Blue", "--dos-blue", "--dos-white"],
            ["Green", "--dos-green", "--dos-white"],
            ["Cyan", "--dos-cyan", "--dos-white"],
            ["Red", "--dos-red", "--dos-white"],
            ["Magenta", "--dos-magenta", "--dos-white"],
            ["Brown", "--dos-brown", "--dos-white"],
            ["Lt Gray", "--dos-light-gray", "--dos-black"],
            ["Dk Gray", "--dos-dark-gray", "--dos-white"],
            ["Lt Blue", "--dos-light-blue", "--dos-black"],
            ["Lt Green", "--dos-light-green", "--dos-black"],
            ["Lt Cyan", "--dos-light-cyan", "--dos-black"],
            ["Lt Red", "--dos-light-red", "--dos-black"],
            ["Lt Mag", "--dos-light-magenta", "--dos-black"],
            ["Yellow", "--dos-yellow", "--dos-black"],
            ["White", "--dos-white", "--dos-black"],
          ].map(([name, bg, fg]) => (
            <div
              key={name}
              style={{
                backgroundColor: `var(${bg})`,
                color: `var(${fg})`,
                padding: "4px 8px",
                minWidth: "9ch",
                textAlign: "center",
              }}
            >
              {name}
            </div>
          ))}
        </div>
      </div>

      {/* Dialog */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Dialog</div>
        <Button variant="primary" onClick={() => setDialogOpen(true)}>
          Open Dialog
        </Button>
        <Dialog
          title="Confirm Action"
          open={dialogOpen}
          onConfirm={() => setDialogOpen(false)}
          onCancel={() => setDialogOpen(false)}
        >
          <div>Are you sure you want to climb the mountain?</div>
          <div style={{ color: "var(--dos-warning)", marginTop: "var(--dos-space-1)" }}>
            Warning: It may be steep.
          </div>
        </Dialog>
      </div>

      {/* CRT Toggle */}
      <div className={styles.crtToggle}>
        <Button onClick={toggleCRT}>{crtEnabled ? "CRT: ON" : "CRT: OFF"}</Button>
      </div>
    </div>
  );
}
