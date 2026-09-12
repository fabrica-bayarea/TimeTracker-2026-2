import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("renders navigation links and highlights active section", () => {
    render(<Sidebar activeSection="atividade" />);

    const nav = screen.getByRole("navigation", { name: "Menu principal" });
    expect(nav).toBeInTheDocument();

    const activeLink = within(nav).getByRole("link", { name: /Atividades/i });
    expect(activeLink).toHaveAttribute("aria-current", "page");

    const inactiveLink = within(nav).getByRole("link", { name: /Visão geral/i });
    expect(inactiveLink).not.toHaveAttribute("aria-current");
  });

  it("renders user information and settings", () => {
    render(<Sidebar activeSection="visao-geral" />);

    expect(screen.getByText("Luan Menezes")).toBeInTheDocument();
    expect(screen.getByText("Administrador")).toBeInTheDocument();

    const configButton = screen.getByRole("button", {
      name: "Configurações — indisponível",
    });
    expect(configButton).toBeDisabled();
  });
});

