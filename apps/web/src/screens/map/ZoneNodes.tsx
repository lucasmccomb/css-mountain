import { useCallback } from "react";
import type { ZoneUnlockState, NodeUnlockState } from "./data/unlock-algorithm";
import type { NodePosition } from "./data/node-layout";
import type { ZoneDefinition } from "./data/zones";
import { getZoneLayout } from "./data/node-layout";
import styles from "./ZoneNodes.module.css";

interface ZoneNodesProps {
  zone: ZoneDefinition;
  unlockState: ZoneUnlockState;
  onSelectChallenge: (challengeId: string) => void;
}

export function ZoneNodes({ zone, unlockState, onSelectChallenge }: ZoneNodesProps) {
  const layout = getZoneLayout(zone.id);
  if (!layout) return null;

  const nodeMap = new Map<string, NodeUnlockState>();
  for (const node of unlockState.nodes) {
    nodeMap.set(node.challengeId, node);
  }

  return (
    <div
      className={styles.zone}
      data-testid={`zone-${zone.id}`}
      style={{ borderLeft: `2px solid ${zone.color}` }}
    >
      <div className={styles.zoneLabel}>
        {zone.name} ({zone.subtitle})
      </div>

      {layout.nodes.map((nodePos) => {
        const unlock = nodeMap.get(nodePos.id);
        if (!unlock) return null;

        return (
          <MapNode
            key={nodePos.id}
            position={nodePos}
            unlock={unlock}
            zoneColor={zone.color}
            onSelect={onSelectChallenge}
          />
        );
      })}
    </div>
  );
}

interface MapNodeProps {
  position: NodePosition;
  unlock: NodeUnlockState;
  zoneColor: string;
  onSelect: (challengeId: string) => void;
}

function MapNode({ position, unlock, onSelect }: MapNodeProps) {
  const isClickable = unlock.status === "unlocked" || unlock.status === "attempted";

  const handleClick = useCallback(() => {
    if (isClickable) {
      onSelect(unlock.challengeId);
    }
  }, [isClickable, onSelect, unlock.challengeId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isClickable && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onSelect(unlock.challengeId);
      }
    },
    [isClickable, onSelect, unlock.challengeId],
  );

  const statusClass = styles[`node${capitalize(unlock.status)}`] ?? "";
  const isBoss = position.track === "boss";

  const icon = getNodeIcon(unlock.status, isBoss);
  const starDisplay = getStarDisplay(unlock.stars);

  return (
    <div
      className={`${styles.node} ${statusClass} ${isClickable ? styles.nodeClickable : ""} ${isBoss ? styles.nodeBoss : ""}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : -1}
      role="button"
      aria-label={`Challenge ${unlock.challengeId} - ${unlock.status}${unlock.stars > 0 ? ` - ${unlock.stars} stars` : ""}`}
      aria-disabled={!isClickable}
      data-testid={`node-${unlock.challengeId}`}
      data-status={unlock.status}
    >
      <div className={styles.nodeIcon}>{icon}</div>
      {unlock.stars > 0 && <div className={styles.stars}>{starDisplay}</div>}
    </div>
  );
}

function getNodeIcon(status: string, isBoss: boolean): string {
  if (isBoss) {
    switch (status) {
      case "completed":
        return "\u2605"; // filled star
      case "locked":
        return "\u2610"; // ballot box empty
      default:
        return "\u2620"; // skull (boss icon)
    }
  }

  switch (status) {
    case "locked":
      return "\u25CB"; // white circle
    case "unlocked":
      return "\u25C9"; // fisheye (filled ring)
    case "attempted":
      return "\u25D0"; // half circle
    case "completed":
      return "\u25CF"; // filled circle
    default:
      return "\u25CB";
  }
}

function getStarDisplay(stars: 0 | 1 | 2 | 3): string {
  const filled = "\u2605"; // filled star
  const empty = "\u2606"; // empty star
  return filled.repeat(stars) + empty.repeat(3 - stars);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
