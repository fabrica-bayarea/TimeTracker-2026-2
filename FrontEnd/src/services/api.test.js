import { describe, expect, it } from "vitest";
import { getPreviousDateKeys, getReportUrl } from "./api";

describe("api service", () => {
  it("generates correct previous date keys without offset errors", () => {
    const dates = getPreviousDateKeys("2026-09-11", 7);
    expect(dates).toHaveLength(7);
    expect(dates[6]).toBe("2026-09-11");
    expect(dates[5]).toBe("2026-09-10");
    expect(dates[0]).toBe("2026-09-05");
  });

  it("handles month boundary transitions correctly", () => {
    const dates = getPreviousDateKeys("2026-03-02", 4);
    expect(dates).toEqual([
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
    ]);
  });

  it("builds clean report URLs with and without username filter", () => {
    const urlAll = getReportUrl("csv", "2026-09-11", "");
    expect(urlAll).toContain("/dashboard/export/csv?date=2026-09-11");
    expect(urlAll).not.toContain("&username=");

    const urlUser = getReportUrl("pdf", "2026-09-11", "ana clara");
    expect(urlUser).toContain("/dashboard/export/pdf?date=2026-09-11&username=ana%20clara");
  });
});

