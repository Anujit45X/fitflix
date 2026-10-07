import { describe, it, expect, vi } from "vitest";
import { shiftDate, today } from "./date";
describe("Calendar ranges", () => {
  it("uses the profile timezone across a UTC date boundary", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-10-07T00:30:00Z"));
      expect(today("Asia/Kolkata")).toBe("2026-10-07");
      expect(today("America/Los_Angeles")).toBe("2026-10-06");
    } finally {
      vi.useRealTimers();
    }
  });
  it("crosses months and leap days in UTC", () => {
    expect(shiftDate("2024-03-01", -1)).toBe("2024-02-29");
    expect(shiftDate("2026-01-01", -1)).toBe("2025-12-31");
  });
  it("keeps inclusive 7-day windows", () =>
    expect(shiftDate("2026-09-28", -6)).toBe("2026-09-22"));
});
