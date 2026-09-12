import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReportsAndAgent } from "./ReportsAndAgent";

describe("ReportsAndAgent", () => {
  it("renders export links and auto-refresh toggle", () => {
    const setAutoRefresh = vi.fn();

    render(
      <ReportsAndAgent
        selectedDate="2026-09-11"
        selectedUsername=""
        autoRefresh={true}
        setAutoRefresh={setAutoRefresh}
        realtimePeople={[]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Relatório diário" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Atualização do painel" })).toBeInTheDocument();

    const csvLink = screen.getByRole("link", { name: /CSV/i });
    expect(csvLink).toHaveAttribute("download");
    expect(csvLink.getAttribute("href")).toContain("/dashboard/export/csv?date=2026-09-11");

    const pdfLink = screen.getByRole("link", { name: /PDF/i });
    expect(pdfLink).toHaveAttribute("download");
    expect(pdfLink.getAttribute("href")).toContain("/dashboard/export/pdf?date=2026-09-11");

    const checkbox = screen.getByRole("checkbox", { name: "Atualização automática" });
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(setAutoRefresh).toHaveBeenCalledWith(false);
  });

  it("handles instant client-side CSV download when realtimePeople has items", () => {
    window.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    window.URL.revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const realtimePeople = [
      {
        username: "ana",
        hostname: "DESK-01",
        process_name: "Code.exe",
        window_title: "App.jsx",
        category: "Desenvolvimento",
        status: "online",
      },
    ];

    render(
      <ReportsAndAgent
        selectedDate="2026-09-11"
        selectedUsername="ana"
        autoRefresh={false}
        setAutoRefresh={vi.fn()}
        realtimePeople={realtimePeople}
      />,
    );

    const csvLink = screen.getByRole("link", { name: /CSV/i });
    fireEvent.click(csvLink);

    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");

    clickSpy.mockRestore();
  });
});

