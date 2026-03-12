import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ZoneNodes } from "./ZoneNodes";
import { ZONES } from "./data/zones";
import type { ZoneUnlockState, NodeUnlockState } from "./data/unlock-algorithm";

function makeZoneUnlockState(overrides: Partial<ZoneUnlockState> = {}): ZoneUnlockState {
  const zone = ZONES[0];
  const nodes: NodeUnlockState[] = [
    // Track A
    { challengeId: "zone-1-a-1", status: "unlocked", stars: 0 },
    { challengeId: "zone-1-a-2", status: "locked", stars: 0 },
    { challengeId: "zone-1-a-3", status: "locked", stars: 0 },
    { challengeId: "zone-1-a-4", status: "locked", stars: 0 },
    { challengeId: "zone-1-a-5", status: "locked", stars: 0 },
    // Track B
    { challengeId: "zone-1-b-1", status: "unlocked", stars: 0 },
    { challengeId: "zone-1-b-2", status: "locked", stars: 0 },
    { challengeId: "zone-1-b-3", status: "locked", stars: 0 },
    { challengeId: "zone-1-b-4", status: "locked", stars: 0 },
    { challengeId: "zone-1-b-5", status: "locked", stars: 0 },
    // Boss
    { challengeId: "zone-1-boss", status: "locked", stars: 0 },
  ];

  return {
    zoneId: zone.id,
    isUnlocked: true,
    completedCount: 0,
    totalCount: 11,
    nodes,
    ...overrides,
  };
}

describe("ZoneNodes", () => {
  it("should render zone container", () => {
    const onSelect = vi.fn();
    const unlockState = makeZoneUnlockState();

    render(
      <ZoneNodes zone={ZONES[0]} unlockState={unlockState} onSelectChallenge={onSelect} />,
    );

    expect(screen.getByTestId("zone-1")).toBeInTheDocument();
  });

  it("should render nodes for the zone", () => {
    const onSelect = vi.fn();
    const unlockState = makeZoneUnlockState();

    render(
      <ZoneNodes zone={ZONES[0]} unlockState={unlockState} onSelectChallenge={onSelect} />,
    );

    expect(screen.getByTestId("node-zone-1-a-1")).toBeInTheDocument();
    expect(screen.getByTestId("node-zone-1-b-1")).toBeInTheDocument();
    expect(screen.getByTestId("node-zone-1-boss")).toBeInTheDocument();
  });

  it("should mark unlocked nodes as clickable", () => {
    const onSelect = vi.fn();
    const unlockState = makeZoneUnlockState();

    render(
      <ZoneNodes zone={ZONES[0]} unlockState={unlockState} onSelectChallenge={onSelect} />,
    );

    const unlockedNode = screen.getByTestId("node-zone-1-a-1");
    expect(unlockedNode).toHaveAttribute("data-status", "unlocked");
    expect(unlockedNode).not.toHaveAttribute("aria-disabled", "true");
  });

  it("should mark locked nodes as non-clickable", () => {
    const onSelect = vi.fn();
    const unlockState = makeZoneUnlockState();

    render(
      <ZoneNodes zone={ZONES[0]} unlockState={unlockState} onSelectChallenge={onSelect} />,
    );

    const lockedNode = screen.getByTestId("node-zone-1-a-2");
    expect(lockedNode).toHaveAttribute("data-status", "locked");
  });

  it("should call onSelectChallenge when unlocked node is clicked", () => {
    const onSelect = vi.fn();
    const unlockState = makeZoneUnlockState();

    render(
      <ZoneNodes zone={ZONES[0]} unlockState={unlockState} onSelectChallenge={onSelect} />,
    );

    fireEvent.click(screen.getByTestId("node-zone-1-a-1"));
    expect(onSelect).toHaveBeenCalledWith("zone-1-a-1");
  });

  it("should NOT call onSelectChallenge when locked node is clicked", () => {
    const onSelect = vi.fn();
    const unlockState = makeZoneUnlockState();

    render(
      <ZoneNodes zone={ZONES[0]} unlockState={unlockState} onSelectChallenge={onSelect} />,
    );

    fireEvent.click(screen.getByTestId("node-zone-1-a-2"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("should display stars for completed nodes", () => {
    const onSelect = vi.fn();
    const unlockState = makeZoneUnlockState({
      nodes: [
        { challengeId: "zone-1-a-1", status: "completed", stars: 3 },
        { challengeId: "zone-1-a-2", status: "unlocked", stars: 0 },
        { challengeId: "zone-1-a-3", status: "locked", stars: 0 },
        { challengeId: "zone-1-a-4", status: "locked", stars: 0 },
        { challengeId: "zone-1-a-5", status: "locked", stars: 0 },
        { challengeId: "zone-1-b-1", status: "unlocked", stars: 0 },
        { challengeId: "zone-1-b-2", status: "locked", stars: 0 },
        { challengeId: "zone-1-b-3", status: "locked", stars: 0 },
        { challengeId: "zone-1-b-4", status: "locked", stars: 0 },
        { challengeId: "zone-1-b-5", status: "locked", stars: 0 },
        { challengeId: "zone-1-boss", status: "locked", stars: 0 },
      ],
    });

    render(
      <ZoneNodes zone={ZONES[0]} unlockState={unlockState} onSelectChallenge={onSelect} />,
    );

    const completedNode = screen.getByTestId("node-zone-1-a-1");
    expect(completedNode).toHaveAttribute("data-status", "completed");
    // Stars should contain star characters
    expect(completedNode.textContent).toContain("\u2605");
  });
});
