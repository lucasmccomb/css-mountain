import { describe, it, expect } from "vitest";
import type { ChallengeProgress } from "@css-mountain/core";
import {
  computeZoneUnlocks,
  getPlayerPosition,
  getZoneProgress,
} from "./unlock-algorithm";
import { ZONES, getZoneChallengeIds } from "./zones";

function makeCompleted(challengeId: string): ChallengeProgress {
  return {
    challengeId,
    status: "completed",
    bestScore: 800,
    stars: 2,
    attempts: 1,
    bestSolution: "/* solved */",
    hintsUsed: 0,
    solutionViewed: false,
    timeSpentMs: 30000,
    completedAt: new Date().toISOString(),
  };
}

function makeAttempted(challengeId: string): ChallengeProgress {
  return {
    challengeId,
    status: "attempted",
    bestScore: 200,
    stars: 0,
    attempts: 1,
    bestSolution: "/* partial */",
    hintsUsed: 1,
    solutionViewed: false,
    timeSpentMs: 15000,
    completedAt: null,
  };
}

describe("computeZoneUnlocks", () => {
  it("should unlock zone 1 with no progress", () => {
    const states = computeZoneUnlocks({});
    expect(states[0].isUnlocked).toBe(true);
    expect(states[1].isUnlocked).toBe(false);
    expect(states[2].isUnlocked).toBe(false);
    expect(states[3].isUnlocked).toBe(false);
    expect(states[4].isUnlocked).toBe(false);
  });

  it("should unlock zone 2 when 7/10 zone 1 challenges completed", () => {
    const progress: Record<string, ChallengeProgress> = {};
    const zone1Ids = getZoneChallengeIds(ZONES[0]);

    // Complete 7 challenges in zone 1
    for (let i = 0; i < 7; i++) {
      progress[zone1Ids[i]] = makeCompleted(zone1Ids[i]);
    }

    const states = computeZoneUnlocks(progress);
    expect(states[0].isUnlocked).toBe(true);
    expect(states[0].completedCount).toBe(7);
    expect(states[1].isUnlocked).toBe(true);
  });

  it("should NOT unlock zone 2 when only 6/10 zone 1 challenges completed", () => {
    const progress: Record<string, ChallengeProgress> = {};
    const zone1Ids = getZoneChallengeIds(ZONES[0]);

    for (let i = 0; i < 6; i++) {
      progress[zone1Ids[i]] = makeCompleted(zone1Ids[i]);
    }

    const states = computeZoneUnlocks(progress);
    expect(states[0].completedCount).toBe(6);
    expect(states[1].isUnlocked).toBe(false);
  });

  it("should have first node in each track unlocked in zone 1", () => {
    const states = computeZoneUnlocks({});
    const zone1 = states[0];

    // First node in track A
    const trackAFirst = zone1.nodes.find((n) => n.challengeId === "zone-1-a-1");
    expect(trackAFirst?.status).toBe("unlocked");

    // First node in track B
    const trackBFirst = zone1.nodes.find((n) => n.challengeId === "zone-1-b-1");
    expect(trackBFirst?.status).toBe("unlocked");
  });

  it("should unlock next track node when previous is completed", () => {
    const progress: Record<string, ChallengeProgress> = {
      "zone-1-a-1": makeCompleted("zone-1-a-1"),
    };

    const states = computeZoneUnlocks(progress);
    const zone1 = states[0];

    const nodeA2 = zone1.nodes.find((n) => n.challengeId === "zone-1-a-2");
    expect(nodeA2?.status).toBe("unlocked");
  });

  it("should unlock next track node when previous is attempted", () => {
    const progress: Record<string, ChallengeProgress> = {
      "zone-1-a-1": makeAttempted("zone-1-a-1"),
    };

    const states = computeZoneUnlocks(progress);
    const zone1 = states[0];

    const nodeA2 = zone1.nodes.find((n) => n.challengeId === "zone-1-a-2");
    expect(nodeA2?.status).toBe("unlocked");
  });

  it("should keep boss locked until all 10 track challenges are completed", () => {
    const progress: Record<string, ChallengeProgress> = {};
    const zone1 = ZONES[0];

    // Complete 9 of 10 track challenges
    for (let i = 0; i < 5; i++) {
      progress[zone1.tracks[0][i]] = makeCompleted(zone1.tracks[0][i]);
    }
    for (let i = 0; i < 4; i++) {
      progress[zone1.tracks[1][i]] = makeCompleted(zone1.tracks[1][i]);
    }

    const states = computeZoneUnlocks(progress);
    const bossNode = states[0].nodes.find((n) => n.challengeId === zone1.bossId);
    expect(bossNode?.status).toBe("locked");
  });

  it("should unlock boss when all 10 track challenges are completed", () => {
    const progress: Record<string, ChallengeProgress> = {};
    const zone1 = ZONES[0];

    for (const trackId of [...zone1.tracks[0], ...zone1.tracks[1]]) {
      progress[trackId] = makeCompleted(trackId);
    }

    const states = computeZoneUnlocks(progress);
    const bossNode = states[0].nodes.find((n) => n.challengeId === zone1.bossId);
    expect(bossNode?.status).toBe("unlocked");
  });

  it("should ensure at least 2 unlocked challenges in active zone", () => {
    // Empty progress should give at least 2 unlocked in zone 1
    const states = computeZoneUnlocks({});
    const zone1 = states[0];

    const availableNodes = zone1.nodes.filter(
      (n) => n.status === "unlocked" || n.status === "attempted",
    );
    expect(availableNodes.length).toBeGreaterThanOrEqual(2);
  });

  it("should have all nodes locked in a locked zone", () => {
    const states = computeZoneUnlocks({});
    const zone2 = states[1]; // Zone 2 should be locked

    expect(zone2.isUnlocked).toBe(false);
    const allLocked = zone2.nodes.every((n) => n.status === "locked");
    expect(allLocked).toBe(true);
  });
});

describe("getPlayerPosition", () => {
  it("should return first unlocked challenge in zone 1 with no progress", () => {
    const states = computeZoneUnlocks({});
    const position = getPlayerPosition(states);

    expect(position).not.toBeNull();
    expect(position?.zoneId).toBe(1);
    expect(position?.challengeId).toBe("zone-1-a-1");
  });

  it("should return first available challenge when some are completed", () => {
    const progress: Record<string, ChallengeProgress> = {
      "zone-1-a-1": makeCompleted("zone-1-a-1"),
    };
    const states = computeZoneUnlocks(progress);
    const position = getPlayerPosition(states);

    expect(position).not.toBeNull();
    // Should point to the next available, which could be a-2 or b-1
    expect(position?.zoneId).toBe(1);
  });
});

describe("getZoneProgress", () => {
  it("should return 0 for empty progress", () => {
    const states = computeZoneUnlocks({});
    expect(getZoneProgress(states[0])).toBe(0);
  });

  it("should calculate correct percentage", () => {
    const progress: Record<string, ChallengeProgress> = {};
    const zone1Ids = getZoneChallengeIds(ZONES[0]);

    // Complete 5 of 11 (10 track + 1 boss)
    for (let i = 0; i < 5; i++) {
      progress[zone1Ids[i]] = makeCompleted(zone1Ids[i]);
    }

    const states = computeZoneUnlocks(progress);
    const pct = getZoneProgress(states[0]);
    expect(pct).toBe(Math.round((5 / 11) * 100));
  });
});
