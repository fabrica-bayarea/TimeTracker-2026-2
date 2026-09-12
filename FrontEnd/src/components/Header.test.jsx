import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./Header";

describe("Header", () => {
  const defaultProps = {
    formattedDate: "SEXTA-FEIRA, 11 DE SETEMBRO",
    dark: false,
    toggleTheme: vi.fn(),
    selectedDate: "2026-09-11",
    setSelectedDate: vi.fn(),
    apiStatus: "online",
    selectedUsername: "",
    setSelectedUsername: vi.fn(),
    users: [
      { username: "ana", full_name: "Ana Carolina" },
      { username: "bruno", full_name: "Bruno Mendes" },
    ],
    refreshing: false,
    onRefresh: vi.fn(),
    updatedAt: new Date(2026, 8, 11, 14, 30),
  };

  it("renders heading, formatted date and user options", () => {
    render(<Header {...defaultProps} />);

    expect(screen.getByText(/SEXTA-FEIRA, 11 DE SETEMBRO/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Visão geral da operação" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Filtrar colaborador" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Toda a equipe" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Ana Carolina" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Bruno Mendes" })).toBeInTheDocument();
  });

  it("calls toggleTheme when the theme button is clicked", () => {
    const toggleTheme = vi.fn();
    render(<Header {...defaultProps} toggleTheme={toggleTheme} />);

    const themeButton = screen.getByRole("button", { name: "Ativar tema escuro" });
    fireEvent.click(themeButton);
    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });

  it("calls onRefresh when refresh button is clicked", () => {
    const onRefresh = vi.fn();
    render(<Header {...defaultProps} onRefresh={onRefresh} />);

    const refreshButton = screen.getByRole("button", { name: "Atualizar dados agora" });
    fireEvent.click(refreshButton);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("disables refresh button during refreshing state", () => {
    render(<Header {...defaultProps} refreshing={true} />);

    const refreshButton = screen.getByRole("button", { name: "Atualizando dados" });
    expect(refreshButton).toBeDisabled();
  });

  it("triggers setSelectedDate when date input changes", () => {
    const setSelectedDate = vi.fn();
    render(<Header {...defaultProps} setSelectedDate={setSelectedDate} />);

    const dateInput = screen.getByLabelText("Data do relatório");
    fireEvent.change(dateInput, { target: { value: "2026-09-10" } });
    expect(setSelectedDate).toHaveBeenCalledWith("2026-09-10");
  });

  it("triggers setSelectedUsername when user select changes", () => {
    const setSelectedUsername = vi.fn();
    render(<Header {...defaultProps} setSelectedUsername={setSelectedUsername} />);

    const select = screen.getByRole("combobox", { name: "Filtrar colaborador" });
    fireEvent.change(select, { target: { value: "ana" } });
    expect(setSelectedUsername).toHaveBeenCalledWith("ana");
  });

  it("displays correct API status text", () => {
    const { rerender } = render(<Header {...defaultProps} apiStatus="online" />);
    expect(screen.getByText("API online")).toBeInTheDocument();

    rerender(<Header {...defaultProps} apiStatus="offline" />);
    expect(screen.getByText("API offline")).toBeInTheDocument();

    rerender(<Header {...defaultProps} apiStatus="loading" />);
    expect(screen.getByText("Conectando à API")).toBeInTheDocument();
  });

  it("renders last updated timestamp when provided", () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText(/Atualizado às/i)).toBeInTheDocument();
  });
});

