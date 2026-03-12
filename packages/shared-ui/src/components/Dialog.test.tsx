import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Dialog } from "./Dialog";

describe("Dialog", () => {
  it("renders nothing when not open", () => {
    const { container } = render(
      <Dialog title="Test" open={false}>
        <div>Content</div>
      </Dialog>,
    );

    expect(container.innerHTML).toBe("");
  });

  it("renders when open", () => {
    render(
      <Dialog title="Confirm" open={true}>
        <div>Are you sure?</div>
      </Dialog>,
    );

    expect(screen.getByText("Confirm", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("shows OK and Cancel buttons by default", () => {
    render(
      <Dialog title="Test" open={true}>
        <div>Content</div>
      </Dialog>,
    );

    expect(screen.getByText("OK")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("calls onConfirm when OK is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <Dialog title="Test" open={true} onConfirm={onConfirm}>
        <div>Content</div>
      </Dialog>,
    );

    await user.click(screen.getByText("OK"));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <Dialog title="Test" open={true} onCancel={onCancel}>
        <div>Content</div>
      </Dialog>,
    );

    await user.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onCancel when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <Dialog title="Test" open={true} onCancel={onCancel}>
        <div>Content</div>
      </Dialog>,
    );

    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalled();
  });

  it("hides cancel button when hideCancel is true", () => {
    render(
      <Dialog title="Alert" open={true} hideCancel>
        <div>Alert message</div>
      </Dialog>,
    );

    expect(screen.getByText("OK")).toBeInTheDocument();
    expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
  });

  it("uses custom button labels", () => {
    render(
      <Dialog title="Test" open={true} confirmLabel="Yes" cancelLabel="No">
        <div>Content</div>
      </Dialog>,
    );

    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });
});
