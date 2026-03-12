import type { ChallengeProgress } from "@css-mountain/core";
import { ZONES, getZoneChallengeIds, type ZoneDefinition } from "./zones";

/**
 * Status of a challenge node on the map.
 */
export type NodeStatus = "locked" | "unlocked" | "attempted" | "completed";

/**
 * Result of the unlock algorithm for a single node.
 */
export interface NodeUnlockState {
  challengeId: string;
  status: NodeStatus;
  stars: 0 | 1 | 2 | 3;
}

/**
 * Result of zone-level unlock computation.
 */
export interface ZoneUnlockState {
  zoneId: number;
  isUnlocked: boolean;
  completedCount: number;
  totalCount: number;
  nodes: NodeUnlockState[];
}

/**
 * Determine which zones are unlocked based on progress.
 *
 * - Zone 1 is always unlocked.
 * - Zone N is unlocked when the player has completed 7/10 challenges
 *   in zone N-1 (at any score, just completed status).
 */
export function computeZoneUnlocks(
  progress: Record<string, ChallengeProgress>,
): ZoneUnlockState[] {
  const results: ZoneUnlockState[] = [];

  for (let i = 0; i < ZONES.length; i++) {
    const zone = ZONES[i];
    const challengeIds = getZoneChallengeIds(zone);

    const completedCount = challengeIds.filter((id) => {
      const cp = progress[id];
      return cp && cp.status === "completed";
    }).length;

    // Zone 1 always unlocked; others require previous zone threshold
    let isUnlocked = i === 0;
    if (i > 0) {
      const prevResult = results[i - 1];
      isUnlocked = prevResult.completedCount >= ZONES[i - 1].requiredToAdvance;
    }

    const nodes = computeNodeUnlocks(zone, progress, isUnlocked);

    results.push({
      zoneId: zone.id,
      isUnlocked,
      completedCount,
      totalCount: zone.totalChallenges + 1, // +1 for boss
      nodes,
    });
  }

  return results;
}

/**
 * Compute unlock state for each node within a zone.
 *
 * Rules:
 * - If the zone is locked, all nodes are locked.
 * - Within a zone, track positions unlock sequentially:
 *   position N unlocks when position N-1 is completed (or attempted).
 *   Position 0 (first in each track) is always unlocked if zone is unlocked.
 * - The boss node unlocks when all 10 track challenges are completed.
 * - The player always has at least 2 unlocked challenges in the active zone.
 */
function computeNodeUnlocks(
  zone: ZoneDefinition,
  progress: Record<string, ChallengeProgress>,
  zoneUnlocked: boolean,
): NodeUnlockState[] {
  if (!zoneUnlocked) {
    const allIds = getZoneChallengeIds(zone);
    return allIds.map((id) => ({
      challengeId: id,
      status: "locked" as const,
      stars: 0 as const,
    }));
  }

  const nodeStates: NodeUnlockState[] = [];

  // Process each track
  for (const track of zone.tracks) {
    for (let i = 0; i < track.length; i++) {
      const id = track[i];
      const cp = progress[id];

      if (cp && (cp.status === "completed" || cp.status === "attempted")) {
        // Already interacted with
        nodeStates.push({
          challengeId: id,
          status: cp.status,
          stars: cp.stars,
        });
      } else if (i === 0) {
        // First node in each track is always available
        nodeStates.push({
          challengeId: id,
          status: "unlocked",
          stars: 0,
        });
      } else {
        // Check if previous node in this track is completed or attempted
        const prevId = track[i - 1];
        const prevCp = progress[prevId];
        const prevDone =
          prevCp && (prevCp.status === "completed" || prevCp.status === "attempted");

        nodeStates.push({
          challengeId: id,
          status: prevDone ? "unlocked" : "locked",
          stars: 0,
        });
      }
    }
  }

  // Boss node: unlocks when all 10 track challenges are completed
  const trackIds = [...zone.tracks[0], ...zone.tracks[1]];
  const allTrackCompleted = trackIds.every((id) => {
    const cp = progress[id];
    return cp && cp.status === "completed";
  });

  const bossProgress = progress[zone.bossId];
  nodeStates.push({
    challengeId: zone.bossId,
    status: bossProgress?.status === "completed"
      ? "completed"
      : bossProgress?.status === "attempted"
        ? "attempted"
        : allTrackCompleted
          ? "unlocked"
          : "locked",
    stars: bossProgress?.stars ?? 0,
  });

  // Safety check: ensure at least 2 unlocked/attempted challenges
  const availableCount = nodeStates.filter(
    (n) => n.status === "unlocked" || n.status === "attempted",
  ).length;

  if (availableCount < 2) {
    // Find locked nodes and unlock them (prefer earlier positions)
    const lockedNodes = nodeStates.filter((n) => n.status === "locked" && n.challengeId !== zone.bossId);
    const needed = 2 - availableCount;
    for (let i = 0; i < Math.min(needed, lockedNodes.length); i++) {
      const node = nodeStates.find((n) => n.challengeId === lockedNodes[i].challengeId);
      if (node) {
        node.status = "unlocked";
      }
    }
  }

  return nodeStates;
}

/**
 * Get the current player position (first unlocked, non-completed challenge).
 */
export function getPlayerPosition(
  zoneStates: ZoneUnlockState[],
): { zoneId: number; challengeId: string } | null {
  for (const zone of zoneStates) {
    if (!zone.isUnlocked) continue;
    const firstAvailable = zone.nodes.find(
      (n) => n.status === "unlocked" || n.status === "attempted",
    );
    if (firstAvailable) {
      return { zoneId: zone.zoneId, challengeId: firstAvailable.challengeId };
    }
  }
  return null;
}

/**
 * Get zone progress as a percentage.
 */
export function getZoneProgress(zoneState: ZoneUnlockState): number {
  if (zoneState.totalCount === 0) return 0;
  return Math.round((zoneState.completedCount / zoneState.totalCount) * 100);
}
