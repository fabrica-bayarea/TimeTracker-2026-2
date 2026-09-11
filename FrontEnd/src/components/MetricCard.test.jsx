import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetricCard } from "./MetricCard";

describe("MetricCard", () => {
  it("renders the metric with an accessible label and value", () => {
    render(
      <MetricCard
        icon="◷"
        tone="bg-violet-100 text-violet-600"
        label="Tempo monitorado"
        value="6h 42min"
        detail="dados da API"
      />,
    );

    expect(screen.getByText("Tempo monitorado")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "6h 42min" })).toBeInTheDocument();
    expect(screen.getByText("dados da API")).toBeInTheDocument();
  });
});
