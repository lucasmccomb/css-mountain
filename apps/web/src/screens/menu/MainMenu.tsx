import { useCallback } from "react";
import { Menu, ASCIIBorder } from "@css-mountain/shared-ui";
import { hasSavedData } from "@css-mountain/core";
import styles from "./MainMenu.module.css";

const ASCII_MOUNTAIN = `
       /\\
      /  \\
     / CSS\\
    /Mountain\\
   /    /\\    \\
  /   /    \\   \\
 /  /   /\\   \\  \\
/  / __/  \\__ \\  \\
\\_/____________\\_/
`;

interface MainMenuProps {
  onNavigate: (route: string) => void;
}

export function MainMenu({ onNavigate }: MainMenuProps) {
  const savedDataExists = hasSavedData();

  const menuItems = [
    ...(savedDataExists
      ? [{ id: "continue", label: "Continue" }]
      : []),
    { id: "new-game", label: "New Game" },
    { id: "settings", label: "Settings" },
    { id: "achievements", label: "Achievements", disabled: true },
  ];

  const handleSelect = useCallback(
    (id: string) => {
      switch (id) {
        case "continue":
          onNavigate("/map");
          break;
        case "new-game":
          onNavigate("/map");
          break;
        case "settings":
          onNavigate("/settings");
          break;
        case "achievements":
          onNavigate("/achievements");
          break;
      }
    },
    [onNavigate],
  );

  return (
    <div className={styles.container} data-testid="main-menu">
      <pre className={styles.logo} aria-hidden="true">
        {ASCII_MOUNTAIN}
      </pre>

      <div className={styles.menuWrapper}>
        <ASCIIBorder double>
          <Menu items={menuItems} onSelect={handleSelect} />
        </ASCIIBorder>
      </div>

      <div className={styles.version}>v1.0 - DOS Edition</div>

      <div className={styles.prompt}>
        {"C:\\CSS_MOUNTAIN> "}
        <span className={styles.cursor}>_</span>
      </div>
    </div>
  );
}
