import { describe, it, expect } from "vitest";
import { distanceKm, formatDistance } from "../geo.js";

describe("distanceKm", () => {
  it("returns 0 for identical points", () => {
    expect(distanceKm(-15.4067, 28.2871, -15.4067, 28.2871)).toBeCloseTo(0, 5);
  });

  it("computes the approximate distance between Lusaka and Kitwe", () => {
    // Lusaka (-15.4067, 28.2871) to Kitwe (-12.8024, 28.2132) is ~290km
    const km = distanceKm(-15.4067, 28.2871, -12.8024, 28.2132);
    expect(km).toBeGreaterThan(270);
    expect(km).toBeLessThan(310);
  });
});

describe("formatDistance", () => {
  it("formats sub-kilometer distances in meters", () => {
    expect(formatDistance(0.45)).toBe("450 m away");
  });

  it("formats kilometer distances to one decimal place", () => {
    expect(formatDistance(3.2)).toBe("3.2 km away");
  });

  it("rounds meters cleanly", () => {
    expect(formatDistance(0.999)).toBe("999 m away");
  });
});
