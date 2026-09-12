import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionHeading } from "./SectionHeading";

describe("SectionHeading", () => {
  it("renders title and description correctly", () => {
    render(
      <SectionHeading
        title="Título da Seção"
        description="Descrição detalhada"
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Título da Seção" })).toBeInTheDocument();
    expect(screen.getByText("Descrição detalhada")).toBeInTheDocument();
  });

  it("renders action element when provided", () => {
    render(
      <SectionHeading
        title="Título com Ação"
        description="Descrição"
        action={<button type="button">Ação Extra</button>}
      />,
    );

    expect(screen.getByRole("button", { name: "Ação Extra" })).toBeInTheDocument();
  });
});

