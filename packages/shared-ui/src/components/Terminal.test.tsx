import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Terminal } from "./Terminal";

describe("Terminal", () => {
  it("renders with title and content", () => {
    render(
      <Terminal title="Test Terminal">
        <div>Hello, DOS!</div>
      </Terminal>,
    );

    expect(screen.getByText("Test Terminal", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Hello, DOS!")).toBeInTheDocument();
  });

  it("has correct aria role and label", () => {
    render(
      <Terminal title="System Info">
        <div>Content</div>
      </Terminal>,
    );

    const region = screen.getByRole("region", { name: "System Info" });
    expect(region).toBeInTheDocument();
  });

  it("renders double-line border characters", () => {
    const { container } = render(
      <Terminal title="Borders">
        <div>Test</div>
      </Terminal>,
    );

    // Check for double-line box drawing chars
    expect(container.textContent).toContain("\u2554"); // ╔
    expect(container.textContent).toContain("\u2557"); // ╗
    expect(container.textContent).toContain("\u255A"); // ╚
    expect(container.textContent).toContain("\u255D"); // ╝
    expect(container.textContent).toContain("\u2550"); // ═
    expect(container.textContent).toContain("\u2551"); // ║
  });

  it("applies custom className", () => {
    const { container } = render(
      <Terminal title="Custom" className="my-custom-class">
        <div>Content</div>
      </Terminal>,
    );

    const terminal = container.firstElementChild;
    expect(terminal?.className).toContain("my-custom-class");
  });
});
