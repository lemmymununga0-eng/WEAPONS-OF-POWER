import { describe, it, expect, vi, afterEach } from "vitest";
import { formatNextService, msUntil, formatCountdown } from "../liveFormat.js";

describe("formatNextService", () => {
  it("formats an ISO datetime as weekday + Lusaka time", () => {
    // 2026-01-06T16:00:00+02:00 is a Tuesday at 16:00 Lusaka time.
    const result = formatNextService({ label: "Tuesday Intercessory Prayer", starts_at: "2026-01-06T16:00:00+02:00" });
    expect(result).toBe("Tue 16:00");
  });

  it("returns an empty string when there's no next service", () => {
    expect(formatNextService(null)).toBe("");
    expect(formatNextService(undefined)).toBe("");
  });

  it("displays Lusaka time regardless of a UTC input", () => {
    // Same instant as above, expressed in UTC — should still read 16:00, not 14:00.
    const result = formatNextService({ starts_at: "2026-01-06T14:00:00Z" });
    expect(result).toBe("Tue 16:00");
  });
});

describe("msUntil", () => {
  afterEach(() => vi.useRealTimers());

  it("returns a positive number for a future time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-06T15:00:00+02:00"));
    expect(msUntil("2026-01-06T16:00:00+02:00")).toBe(60 * 60 * 1000);
  });

  it("returns a negative number for a past time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-06T17:00:00+02:00"));
    expect(msUntil("2026-01-06T16:00:00+02:00")).toBeLessThan(0);
  });
});

describe("formatCountdown", () => {
  it("shows 'starting now' for zero or negative ms", () => {
    expect(formatCountdown(0)).toBe("starting now");
    expect(formatCountdown(-1000)).toBe("starting now");
  });

  it("formats minutes only under an hour", () => {
    expect(formatCountdown(45 * 60 * 1000)).toBe("45m");
  });

  it("formats hours and minutes under a day", () => {
    expect(formatCountdown((2 * 60 + 15) * 60 * 1000)).toBe("2h 15m");
  });

  it("formats days, hours and minutes", () => {
    expect(formatCountdown((26 * 60 + 5) * 60 * 1000)).toBe("1d 2h 5m");
  });
});
