import { useMemo } from "react";
import { getZoneLayout } from "./data/node-layout";
import styles from "./PlayerMarker.module.css";

interface PlayerMarkerProps {
  /** Zone the player is currently in */
  zoneId: number;
  /** Challenge the player is positioned at */
  challengeId: string;
}

export function PlayerMarker({ zoneId, challengeId }: PlayerMarkerProps) {
  const position = useMemo(() => {
    const layout = getZoneLayout(zoneId);
    if (!layout) return null;
    return layout.nodes.find((n) => n.id === challengeId) ?? null;
  }, [zoneId, challengeId]);

  if (!position) return null;

  return (
    <div
      className={styles.marker}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
      }}
      aria-label="Your position"
      data-testid="player-marker"
    >
      <div className={styles.icon}>{"\u25B2"}</div>
      <div className={styles.label}>YOU</div>
    </div>
  );
}
