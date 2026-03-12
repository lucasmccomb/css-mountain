import { describe, it, expect } from "vitest";
import {
  STORY_BEATS,
  getBeatsForZone,
  getBeat,
  VILLAIN_NAME,
  GUIDE_NAME,
} from "./story-beats";

describe("Story Beats", () => {
  it("should have story beats for all 5 zones plus intro", () => {
    const zones = new Set(STORY_BEATS.map((b) => b.zone));
    expect(zones.has(0)).toBe(true); // intro
    expect(zones.has(1)).toBe(true);
    expect(zones.has(2)).toBe(true);
    expect(zones.has(3)).toBe(true);
    expect(zones.has(4)).toBe(true);
    expect(zones.has(5)).toBe(true);
  });

  it("should have zone-enter beats for zones 1-5", () => {
    for (let zone = 1; zone <= 5; zone++) {
      const beat = getBeat(zone, "zone-enter");
      expect(beat).toBeDefined();
      expect(beat?.dialog.length).toBeGreaterThan(0);
    }
  });

  it("should have boss-defeat beats for zones 1-4", () => {
    for (let zone = 1; zone <= 4; zone++) {
      const beat = getBeat(zone, "boss-defeat");
      expect(beat).toBeDefined();
      expect(beat?.dialog.length).toBeGreaterThan(0);
    }
  });

  it("should have a summit victory beat", () => {
    const beat = getBeat(5, "summit");
    expect(beat).toBeDefined();
    expect(beat?.id).toBe("summit-victory");
  });

  it("should include dialog from all speaker types", () => {
    const speakers = new Set(
      STORY_BEATS.flatMap((b) => b.dialog.map((d) => d.speaker)),
    );
    expect(speakers.has("narrator")).toBe(true);
    expect(speakers.has("player")).toBe(true);
    expect(speakers.has("villain")).toBe(true);
    expect(speakers.has("guide")).toBe(true);
  });

  it("should define villain and guide names", () => {
    expect(VILLAIN_NAME).toBe("Master of Mischief");
    expect(GUIDE_NAME).toBe("Professor Cascade");
  });

  it("should return correct beats for a specific zone", () => {
    const zone1Beats = getBeatsForZone(1);
    expect(zone1Beats.length).toBeGreaterThanOrEqual(2); // enter + boss
    expect(zone1Beats.every((b) => b.zone === 1)).toBe(true);
  });

  it("should return undefined for non-existent beats", () => {
    const beat = getBeat(99, "zone-enter");
    expect(beat).toBeUndefined();
  });

  it("should have unique beat ids", () => {
    const ids = STORY_BEATS.map((b) => b.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
