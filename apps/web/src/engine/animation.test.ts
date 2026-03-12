import { describe, it, expect, vi } from "vitest";
import { AnimationController } from "./animation";
import { SpriteSheet } from "./sprite-sheet";

function createMockSpriteSheet(): SpriteSheet {
  return new SpriteSheet({
    src: "test.png",
    frameWidth: 16,
    frameHeight: 16,
    columns: 4,
    rows: 4,
  });
}

describe("AnimationController", () => {
  it("should start with frame 0", () => {
    const sheet = createMockSpriteSheet();
    const controller = new AnimationController(sheet);

    expect(controller.currentFrame).toBe(0);
    expect(controller.currentState).toBeNull();
  });

  it("should play a registered sequence", () => {
    const sheet = createMockSpriteSheet();
    const controller = new AnimationController(sheet);

    controller.addSequence({
      name: "idle",
      frames: [0, 1],
      frameDuration: 500,
      loop: true,
    });

    controller.play("idle");

    expect(controller.currentState).toBe("idle");
    expect(controller.currentFrame).toBe(0);
  });

  it("should advance frames over time", () => {
    const sheet = createMockSpriteSheet();
    const controller = new AnimationController(sheet);

    controller.addSequence({
      name: "walk",
      frames: [4, 5, 6, 7],
      frameDuration: 100,
      loop: true,
    });

    controller.play("walk");
    expect(controller.currentFrame).toBe(4);

    controller.update(100); // Advance one frame
    expect(controller.currentFrame).toBe(5);

    controller.update(100); // Advance another
    expect(controller.currentFrame).toBe(6);
  });

  it("should loop when loop is true", () => {
    const sheet = createMockSpriteSheet();
    const controller = new AnimationController(sheet);

    controller.addSequence({
      name: "walk",
      frames: [0, 1],
      frameDuration: 100,
      loop: true,
    });

    controller.play("walk");
    controller.update(100);
    expect(controller.currentFrame).toBe(1);

    controller.update(100);
    expect(controller.currentFrame).toBe(0); // Looped back
  });

  it("should stop at last frame when loop is false", () => {
    const sheet = createMockSpriteSheet();
    const controller = new AnimationController(sheet);

    const onComplete = vi.fn();

    controller.addSequence({
      name: "celebrate",
      frames: [0, 1, 2],
      frameDuration: 100,
      loop: false,
      onComplete,
    });

    controller.play("celebrate");
    controller.update(100);
    controller.update(100);
    controller.update(100); // Past the end

    expect(controller.currentFrame).toBe(2);
    expect(controller.isFinished).toBe(true);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("should pause and resume", () => {
    const sheet = createMockSpriteSheet();
    const controller = new AnimationController(sheet);

    controller.addSequence({
      name: "walk",
      frames: [0, 1, 2, 3],
      frameDuration: 100,
      loop: true,
    });

    controller.play("walk");
    controller.update(100);
    expect(controller.currentFrame).toBe(1);

    controller.pause();
    controller.update(100); // Should not advance
    expect(controller.currentFrame).toBe(1);

    controller.resume();
    controller.update(100);
    expect(controller.currentFrame).toBe(2);
  });

  it("should not restart if same animation is already playing", () => {
    const sheet = createMockSpriteSheet();
    const controller = new AnimationController(sheet);

    controller.addSequence({
      name: "walk",
      frames: [0, 1, 2, 3],
      frameDuration: 100,
      loop: true,
    });

    controller.play("walk");
    controller.update(200); // Advance to frame 2
    expect(controller.currentFrame).toBe(2);

    controller.play("walk"); // Same animation - should not reset
    expect(controller.currentFrame).toBe(2);
  });
});
