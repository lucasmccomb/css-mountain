import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders with text content", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("fires click handler", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Click</Button>);

    await user.click(screen.getByText("Click"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire click when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button onClick={onClick} disabled>
        Disabled
      </Button>,
    );

    await user.click(screen.getByText("Disabled"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("has type button by default", () => {
    render(<Button>Test</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("type", "button");
  });

  it("applies variant classes", () => {
    const { container } = render(<Button variant="primary">Primary</Button>);
    const btn = container.querySelector("button");
    expect(btn?.className).toContain("primary");
  });

  it("applies custom className", () => {
    const { container } = render(<Button className="custom">Custom</Button>);
    const btn = container.querySelector("button");
    expect(btn?.className).toContain("custom");
  });
});
