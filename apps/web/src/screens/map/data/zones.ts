import type { Difficulty } from "@css-mountain/core";

/**
 * Zone definition for the mountain map.
 * Each zone represents a career level with 10 challenges
 * arranged in 2 parallel tracks of 5.
 */
export interface ZoneDefinition {
  /** Zone index (1-5) */
  id: number;
  /** Display name */
  name: string;
  /** Subtitle shown in zone info */
  subtitle: string;
  /** Difficulty tier */
  difficulty: Difficulty;
  /** Color for the zone on the map (CSS variable name) */
  color: string;
  /** Challenge IDs in this zone - 2 tracks of 5 */
  tracks: [string[], string[]];
  /** Boss challenge ID (last challenge in the zone) */
  bossId: string;
  /** Total challenges in this zone */
  totalChallenges: number;
  /** Challenges needed to unlock next zone */
  requiredToAdvance: number;
}

/**
 * Generate challenge IDs for a zone.
 * Format: zone-{zoneId}-{track}-{position} (e.g., "zone-1-a-1")
 */
function generateTrackIds(zoneId: number): [string[], string[]] {
  const trackA = Array.from({ length: 5 }, (_, i) => `zone-${zoneId}-a-${i + 1}`);
  const trackB = Array.from({ length: 5 }, (_, i) => `zone-${zoneId}-b-${i + 1}`);
  return [trackA, trackB];
}

/**
 * The five mountain zones, from base camp to summit.
 */
export const ZONES: ZoneDefinition[] = [
  {
    id: 1,
    name: "Base Camp",
    subtitle: "Junior Developer",
    difficulty: "junior",
    color: "var(--dos-light-green)",
    tracks: generateTrackIds(1),
    bossId: "zone-1-boss",
    totalChallenges: 10,
    requiredToAdvance: 7,
  },
  {
    id: 2,
    name: "The Foothills",
    subtitle: "Mid-Level Developer",
    difficulty: "mid-level",
    color: "var(--dos-light-cyan)",
    tracks: generateTrackIds(2),
    bossId: "zone-2-boss",
    totalChallenges: 10,
    requiredToAdvance: 7,
  },
  {
    id: 3,
    name: "The Ridge",
    subtitle: "Senior Developer",
    difficulty: "senior",
    color: "var(--dos-yellow)",
    tracks: generateTrackIds(3),
    bossId: "zone-3-boss",
    totalChallenges: 10,
    requiredToAdvance: 7,
  },
  {
    id: 4,
    name: "The Summit Approach",
    subtitle: "Staff Engineer",
    difficulty: "staff",
    color: "var(--dos-light-magenta)",
    tracks: generateTrackIds(4),
    bossId: "zone-4-boss",
    totalChallenges: 10,
    requiredToAdvance: 7,
  },
  {
    id: 5,
    name: "The Peak",
    subtitle: "Principal Engineer",
    difficulty: "principal",
    color: "var(--dos-light-red)",
    tracks: generateTrackIds(5),
    bossId: "zone-5-boss",
    totalChallenges: 10,
    requiredToAdvance: 7,
  },
];

/**
 * Get all challenge IDs for a zone (both tracks + boss).
 */
export function getZoneChallengeIds(zone: ZoneDefinition): string[] {
  return [...zone.tracks[0], ...zone.tracks[1], zone.bossId];
}

/**
 * Find the zone a challenge belongs to.
 */
export function findZoneForChallenge(challengeId: string): ZoneDefinition | undefined {
  return ZONES.find((zone) => getZoneChallengeIds(zone).includes(challengeId));
}
