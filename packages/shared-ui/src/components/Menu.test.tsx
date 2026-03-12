import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Menu } from "./Menu";

const defaultItems = [
  { id: "new", label: "New Game" },
  { id: "continue", label: "Continue" },
  { id: "options", label: "Options" },
];

describe("Menu", () => {
  it("renders all menu items", () => {
    render(<Menu items={defaultItems} onSelect={vi.fn()} />);

    expect(screen.getByText(/New Game/)).toBeInTheDocument();
    expect(screen.getByText(/Continue/)).toBeInTheDocument();
    expect(screen.getByText(/Options/)).toBeInTheDocument();
  });

  it("calls onSelect when Enter is pressed", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<Menu items={defaultItems} onSelect={onSelect} />);

    // Menu auto-focuses; press Enter on first item
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("new");
  });

  it("navigates with arrow keys", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<Menu items={defaultItems} onSelect={onSelect} />);

    // Move down to "Continue"
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledWith("continue");
  });

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<Menu items={defaultItems} onSelect={vi.fn()} onClose={onClose} />);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("skips disabled items during navigation", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    const items = [
      { id: "a", label: "Item A" },
      { id: "b", label: "Item B", disabled: true },
      { id: "c", label: "Item C" },
    ];

    render(<Menu items={items} onSelect={onSelect} />);

    // Move down should skip disabled "Item B" and land on "Item C"
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledWith("c");
  });

  it("highlights the active item with an arrow indicator", () => {
    render(<Menu items={defaultItems} onSelect={vi.fn()} initialIndex={0} />);

    // First item should have the pointer
    const firstItem = screen.getByText(/New Game/);
    expect(firstItem.textContent).toContain("\u25B8");
  });

  it("selects item on click", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<Menu items={defaultItems} onSelect={onSelect} />);

    await user.click(screen.getByText(/Options/));
    expect(onSelect).toHaveBeenCalledWith("options");
  });
});
