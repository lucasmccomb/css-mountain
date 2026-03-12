import { ASCIIBorder, ProgressBar } from "@css-mountain/shared-ui";
import type { ZoneDefinition } from "./data/zones";
import type { ZoneUnlockState } from "./data/unlock-algorithm";
import { getZoneProgress } from "./data/unlock-algorithm";
import styles from "./ZoneInfo.module.css";

interface ZoneInfoProps {
  zone: ZoneDefinition;
  unlockState: ZoneUnlockState;
}

export function ZoneInfo({ zone, unlockState }: ZoneInfoProps) {
  const progress = getZoneProgress(unlockState);
  const completedStars = unlockState.nodes.reduce((sum, n) => sum + n.stars, 0);
  const maxStars = unlockState.nodes.length * 3;

  return (
    <ASCIIBorder double borderColor={zone.color}>
      <div className={styles.panel} data-testid="zone-info">
        <div className={styles.zoneName} style={{ color: zone.color }}>
          {zone.name}
        </div>
        <div className={styles.subtitle}>{zone.subtitle}</div>

        <div className={styles.stats}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Completed:</span>
            <span className={styles.statValue}>
              {unlockState.completedCount}/{unlockState.totalCount}
            </span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Stars:</span>
            <span className={styles.statValue}>
              {completedStars}/{maxStars}
            </span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Difficulty:</span>
            <span className={styles.statValue}>{zone.difficulty}</span>
          </div>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressLabel}>Zone Progress:</div>
          <ProgressBar value={progress} width={20} filledColor={zone.color} />
        </div>
      </div>
    </ASCIIBorder>
  );
}
