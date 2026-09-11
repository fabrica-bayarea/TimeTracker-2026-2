import { describe, expect, it } from "vitest";
import {
  formatDuration,
  getProductiveSeconds,
  getSummaryTotalSeconds,
} from "./dashboard";

describe("dashboard utilities", () => {
  it("formats durations consistently", () => {
    expect(formatDuration(0)).toBe("0h 00min");
    expect(formatDuration(3661)).toBe("1h 01min");
    expect(formatDuration(-10)).toBe("0h 00min");
  });

  it("sums monitored time from users", () => {
    expect(
      getSummaryTotalSeconds({
        users: [{ total_seconds: 3600 }, { total_seconds: "120" }],
      }),
    ).toBe(3720);
  });

  it("excludes non-productive categories", () => {
    expect(
      getProductiveSeconds({
        users: [
          {
            by_category: [
              { category: "Desenvolvimento", total_seconds: 1800 },
              { category: "Social", total_seconds: 600 },
              { category: "Outros", total_seconds: 300 },
            ],
          },
        ],
      }),
    ).toBe(1800);
  });
});
