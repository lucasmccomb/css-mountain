import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MobileToolbar } from "./MobileToolbar";

describe("MobileToolbar", () => {
  it("renders toolbar with CSS shortcut keys", () => {
    render(<MobileToolbar onInsert={vi.fn()} />);
    const toolbar = screen.getByTestId("mobile-toolbar");
    expect(toolbar).toBeInTheDocument();

    // Check some key buttons exist
    expect(screen.getByText("{")).toBeInTheDocument();
    expect(screen.getByText("}")).toBeInTheDocument();
    expect(screen.getByText(":")).toBeInTheDocument();
    expect(screen.getByText(";")).toBeInTheDocument();
    expect(screen.getByText("px")).toBeInTheDocument();
    expect(screen.getByText("em")).toBeInTheDocument();
    expect(screen.getByText("flex")).toBeInTheDocument();
    expect(screen.getByText("grid")).toBeInTheDocument();
  });

  it("calls onInsert with correct text when key is pressed", async () => {
    const user = userEvent.setup();
    const onInsert = vi.fn();

    render(<MobileToolbar onInsert={onInsert} />);

    await user.click(screen.getByText("px"));
    expect(onInsert).toHaveBeenCalledWith("px");

    await user.click(screen.getByText("flex"));
    expect(onInsert).toHaveBeenCalledWith("flex");
  });

  it("inserts with proper formatting for structural chars", async () => {
    const user = userEvent.setup();
    const onInsert = vi.fn();

    render(<MobileToolbar onInsert={onInsert} />);

    await user.click(screen.getByText("{"));
    expect(onInsert).toHaveBeenCalledWith("{ ");

    await user.click(screen.getByText(":"));
    expect(onInsert).toHaveBeenCalledWith(": ");

    await user.click(screen.getByText(";"));
    expect(onInsert).toHaveBeenCalledWith(";\n");
  });

  it("has accessible toolbar role", () => {
    render(<MobileToolbar onInsert={vi.fn()} />);
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });

  it("has aria-labels on keys", () => {
    render(<MobileToolbar onInsert={vi.fn()} />);
    expect(screen.getByLabelText("Insert {")).toBeInTheDocument();
    expect(screen.getByLabelText("Insert px")).toBeInTheDocument();
  });
});
