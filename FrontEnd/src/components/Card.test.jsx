import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "./Card";

describe("Card", () => {
  it("renders children correctly within an article element", () => {
    render(
      <Card id="test-card" className="custom-class">
        <span>Conteúdo de teste</span>
      </Card>,
    );

    const content = screen.getByText("Conteúdo de teste");
    expect(content).toBeInTheDocument();

    const article = screen.getByRole("article");
    expect(article).toBeInTheDocument();
    expect(article).toHaveAttribute("id", "test-card");
    expect(article).toHaveClass("custom-class");
  });
});

