import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PeopleCard } from "./PeopleCard";

describe("PeopleCard", () => {
  it("renders real-time team members correctly", () => {
    const realtimePeople = [
      {
        username: "carlos",
        hostname: "WORK-01",
        process_name: "Code.exe",
        window_title: "PeopleCard.jsx - Visual Studio Code",
        category: "Desenvolvimento",
        status: "online",
        seconds_since_last_activity: 45,
      },
    ];

    render(<PeopleCard realtimePeople={realtimePeople} useDemoData={false} />);

    expect(screen.getByText("carlos")).toBeInTheDocument();
    expect(screen.getByText("CA")).toBeInTheDocument();
    expect(screen.getByText("WORK-01")).toBeInTheDocument();
    expect(screen.getByText("Code.exe")).toBeInTheDocument();
    expect(screen.getByText("Desenvolvimento")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.getByText("há 45s")).toBeInTheDocument();
  });

  it("renders demo people when realtime list is empty and useDemoData is true", () => {
    render(<PeopleCard realtimePeople={[]} useDemoData={true} />);

    expect(screen.getByText("Ana Carolina")).toBeInTheDocument();
    expect(screen.getByText("Bruno Mendes")).toBeInTheDocument();
  });

  it("renders empty state message when realtime list is empty and useDemoData is false", () => {
    render(<PeopleCard realtimePeople={[]} useDemoData={false} />);

    expect(
      screen.getByText("Nenhuma atividade em tempo real encontrada."),
    ).toBeInTheDocument();
  });
});

