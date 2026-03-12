import { useState, useMemo, useCallback } from "react";
import { useStore } from "zustand";
import { progressStore } from "@css-mountain/core";
import { Button } from "@css-mountain/shared-ui";
import { ZONES } from "./data/zones";
import { computeZoneUnlocks, getPlayerPosition } from "./data/unlock-algorithm";
import { MountainMap } from "./MountainMap";
import { ZoneInfo } from "./ZoneInfo";
import styles from "./MapScreen.module.css";

interface MapScreenProps {
  onSelectChallenge: (challengeId: string) => void;
  onBack: () => void;
}

export function MapScreen({ onSelectChallenge, onBack }: MapScreenProps) {
  const progress = useStore(progressStore, (s) => s.challengeProgress);
  const totalStars = useStore(progressStore, (s) => s.totalStars);
  const totalScore = useStore(progressStore, (s) => s.totalScore);

  const zoneStates = useMemo(() => computeZoneUnlocks(progress), [progress]);
  const playerPosition = useMemo(() => getPlayerPosition(zoneStates), [zoneStates]);

  // Track which zone is selected for the info panel
  const [selectedZoneId, setSelectedZoneId] = useState<number>(
    playerPosition?.zoneId ?? 1,
  );

  const selectedZone = ZONES.find((z) => z.id === selectedZoneId) ?? ZONES[0];
  const selectedZoneState = zoneStates.find((zs) => zs.zoneId === selectedZoneId) ?? zoneStates[0];

  const handleSelectChallenge = useCallback(
    (challengeId: string) => {
      // Determine which zone this challenge is in and update the info panel
      const zone = ZONES.find((z) => {
        const allIds = [...z.tracks[0], ...z.tracks[1], z.bossId];
        return allIds.includes(challengeId);
      });
      if (zone) {
        setSelectedZoneId(zone.id);
      }
      onSelectChallenge(challengeId);
    },
    [onSelectChallenge],
  );

  return (
    <div className={styles.container} data-testid="map-screen">
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>Mountain Map</div>
        <div className={styles.playerStats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Stars:</span>
            <span className={styles.statValue}>{totalStars}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Score:</span>
            <span className={styles.statValue}>{totalScore}</span>
          </div>
        </div>
      </div>

      {/* Body: Map + Info */}
      <div className={styles.body}>
        <div className={styles.mapColumn}>
          <MountainMap
            zoneStates={zoneStates}
            playerPosition={playerPosition}
            onSelectChallenge={handleSelectChallenge}
          />
        </div>

        <div className={styles.infoColumn}>
          <ZoneInfo zone={selectedZone} unlockState={selectedZoneState} />

          <div className={styles.backButton}>
            <Button onClick={onBack}>Back to Menu</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
