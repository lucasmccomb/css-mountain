import { ZONES } from "./data/zones";
import type { ZoneUnlockState } from "./data/unlock-algorithm";
import { ZoneNodes } from "./ZoneNodes";
import { PlayerMarker } from "./PlayerMarker";
import styles from "./MountainMap.module.css";

interface MountainMapProps {
  /** Unlock states for all zones */
  zoneStates: ZoneUnlockState[];
  /** Player's current position (zone + challenge) */
  playerPosition: { zoneId: number; challengeId: string } | null;
  /** Called when a challenge node is clicked */
  onSelectChallenge: (challengeId: string) => void;
}

export function MountainMap({ zoneStates, playerPosition, onSelectChallenge }: MountainMapProps) {
  const zoneStateMap = new Map<number, ZoneUnlockState>();
  for (const zs of zoneStates) {
    zoneStateMap.set(zs.zoneId, zs);
  }

  // Render zones bottom-to-top (reversed in CSS with column-reverse)
  return (
    <div className={styles.mapContainer} data-testid="mountain-map">
      {ZONES.map((zone, index) => {
        const unlockState = zoneStateMap.get(zone.id);
        if (!unlockState) return null;

        return (
          <div key={zone.id} style={{ position: "relative" }}>
            {/* Zone separator line */}
            {index < ZONES.length - 1 && (
              <div className={styles.zoneSeparator}>
                {"\u2550".repeat(40)}
              </div>
            )}

            {/* Zone nodes */}
            <ZoneNodes
              zone={zone}
              unlockState={unlockState}
              onSelectChallenge={onSelectChallenge}
            />

            {/* Player marker */}
            {playerPosition && playerPosition.zoneId === zone.id && (
              <PlayerMarker
                zoneId={playerPosition.zoneId}
                challengeId={playerPosition.challengeId}
              />
            )}

            {/* Locked overlay */}
            {!unlockState.isUnlocked && (
              <div className={styles.lockedOverlay}>
                <div className={styles.lockedText}>
                  {"\u26BF"} LOCKED - Complete Zone {zone.id - 1} first
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
