import { useCallback } from "react";
import { Menu, ASCIIBorder } from "@css-mountain/shared-ui";
import { hasSavedData } from "@css-mountain/core";
import { DonationBanner } from "@/components/DonationBanner";
import { authClient, type AuthState } from "@/services/auth-client";
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
  authState?: AuthState;
}

export function MainMenu({ onNavigate, authState }: MainMenuProps) {
  const savedDataExists = hasSavedData();
  const isAuthenticated = authState?.status === "authenticated";

  const menuItems = [
    ...(savedDataExists
      ? [{ id: "continue", label: "Continue" }]
      : []),
    { id: "new-game", label: "New Game" },
    { id: "settings", label: "Settings" },
    { id: "achievements", label: "Achievements", disabled: true },
    ...(isAuthenticated
      ? [{ id: "sign-out", label: `Sign Out (${authState.user?.displayName ?? "User"})` }]
      : [
          { id: "sign-in-google", label: "Sign In (Google)" },
          { id: "sign-in-github", label: "Sign In (GitHub)" },
        ]),
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
        case "sign-in-google":
          authClient.login("google");
          break;
        case "sign-in-github":
          authClient.login("github");
          break;
        case "sign-out":
          authClient.logout().then(() => {
            window.location.reload();
          });
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

      <div className={styles.donationArea}>
        <DonationBanner />
      </div>

      <div className={styles.version}>v1.0 - DOS Edition</div>

      <div className={styles.prompt}>
        {"C:\\CSS_MOUNTAIN> "}
        <span className={styles.cursor}>_</span>
      </div>
    </div>
  );
}
