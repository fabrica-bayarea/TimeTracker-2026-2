import { describe, expect, it } from "vitest";
import {
  formatDuration,
  formatRelativeActivityTime,
  getProductiveSeconds,
  getSummaryTotalSeconds,
  safeIsoDate,
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

  it("formats relative activity time appropriately", () => {
    expect(formatRelativeActivityTime(0)).toBe("há 0s");
    expect(formatRelativeActivityTime(15)).toBe("há 15s");
    expect(formatRelativeActivityTime(59)).toBe("há 59s");
    expect(formatRelativeActivityTime(60)).toBe("há 1min");
    expect(formatRelativeActivityTime(150)).toBe("há 2min");
    expect(formatRelativeActivityTime(3600)).toBe("há 1h");
    expect(formatRelativeActivityTime(3720)).toBe("há 1h 2min");
    expect(formatRelativeActivityTime(7200)).toBe("há 2h");
  });

  it("validates and sanitizes ISO dates safely", () => {
    expect(safeIsoDate("2026-09-11")).toBe("2026-09-11");
    // Datas inválidas retornam o formato YYYY-MM-DD da data atual
    const fallbackRegex = /^\d{4}-\d{2}-\d{2}$/;
    expect(safeIsoDate("")).toMatch(fallbackRegex);
    expect(safeIsoDate(null)).toMatch(fallbackRegex);
    expect(safeIsoDate("invalid-date")).toMatch(fallbackRegex);
    expect(safeIsoDate("2026-02-31")).toMatch(fallbackRegex);
  });
});

