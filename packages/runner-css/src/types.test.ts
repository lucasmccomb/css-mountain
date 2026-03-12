import { describe, it, expect } from "vitest";
import { calculateStars } from "./types";

describe("calculateStars", () => {
  it("returns 3 stars for score >= 900", () => {
    expect(calculateStars(900)).toBe(3);
    expect(calculateStars(950)).toBe(3);
    expect(calculateStars(1000)).toBe(3);
  });

  it("returns 2 stars for score 700-899", () => {
    expect(calculateStars(700)).toBe(2);
    expect(calculateStars(800)).toBe(2);
    expect(calculateStars(899)).toBe(2);
  });

  it("returns 1 star for score 400-699", () => {
    expect(calculateStars(400)).toBe(1);
    expect(calculateStars(500)).toBe(1);
    expect(calculateStars(699)).toBe(1);
  });

  it("returns 0 stars for score < 400", () => {
    expect(calculateStars(0)).toBe(0);
    expect(calculateStars(199)).toBe(0);
    expect(calculateStars(399)).toBe(0);
  });
});
