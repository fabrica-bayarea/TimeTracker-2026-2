import { describe, expect, it } from "vitest";
import {
  calculatePercentage,
  convertRowsToCsv,
  createDailyReport,
  formatTime,
} from "./report";

describe("report utilities", () => {
  it("formats time correctly from minutes", () => {
    expect(formatTime(60)).toBe("1h");
    expect(formatTime(142)).toBe("2h 22min");
    expect(formatTime(0)).toBe("0h");
  });

  it("calculates percentage accurately", () => {
    expect(calculatePercentage(25, 100)).toBe("25.0%");
    expect(calculatePercentage(1, 3, 2)).toBe("33.33%");
    expect(calculatePercentage(10, 0)).toBe("0%");
  });

  it("creates daily report structure and escapes CSV fields", () => {
    const rawData = [
      [
        'Ana "Dev"',
        "AD",
        "DESK-01",
        "VS Code",
        "App.jsx, Line 1",
        "Desenvolvimento",
        "Online",
      ],
    ];

    const report = createDailyReport(rawData);
    expect(report).toHaveLength(2);
    expect(report[0]).toEqual([
      "Colaborador",
      "Máquina",
      "Aplicativo",
      "Janela",
      "Categoria",
      "Status",
    ]);
    expect(report[1][0]).toBe('Ana "Dev"');

    const csv = convertRowsToCsv(report);
    // Deve escapar aspas duplas dobrando-as
    expect(csv).toContain('"Ana ""Dev"""');
    // Deve envolver campos com vírgula entre aspas
    expect(csv).toContain('"App.jsx, Line 1"');
  });
});

