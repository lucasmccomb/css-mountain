import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MainMenu } from "./MainMenu";

describe("MainMenu", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should render the main menu", () => {
    const onNavigate = vi.fn();
    render(<MainMenu onNavigate={onNavigate} />);

    expect(screen.getByTestId("main-menu")).toBeInTheDocument();
  });

  it("should display ASCII mountain art", () => {
    const onNavigate = vi.fn();
    render(<MainMenu onNavigate={onNavigate} />);

    // The ASCII art contains "Mountain"
    expect(screen.getByText(/Mountain/)).toBeInTheDocument();
  });

  it("should show New Game option", () => {
    const onNavigate = vi.fn();
    render(<MainMenu onNavigate={onNavigate} />);

    expect(screen.getByText(/New Game/)).toBeInTheDocument();
  });

  it("should show Settings option", () => {
    const onNavigate = vi.fn();
    render(<MainMenu onNavigate={onNavigate} />);

    expect(screen.getByText(/Settings/)).toBeInTheDocument();
  });

  it("should navigate to map on New Game click", () => {
    const onNavigate = vi.fn();
    render(<MainMenu onNavigate={onNavigate} />);

    const newGameItem = screen.getByText(/New Game/);
    fireEvent.click(newGameItem);

    expect(onNavigate).toHaveBeenCalledWith("/map");
  });

  it("should navigate to settings on Settings click", () => {
    const onNavigate = vi.fn();
    render(<MainMenu onNavigate={onNavigate} />);

    const settingsItem = screen.getByText(/Settings/);
    fireEvent.click(settingsItem);

    expect(onNavigate).toHaveBeenCalledWith("/settings");
  });

  it("should show version number", () => {
    const onNavigate = vi.fn();
    render(<MainMenu onNavigate={onNavigate} />);

    expect(screen.getByText(/v1\.0/)).toBeInTheDocument();
  });
});
