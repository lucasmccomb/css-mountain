import { describe, it, expect, vi, beforeEach } from "vitest";
import { AudioManager } from "./audio-manager";

// Mock the Web Audio API
class MockOscillatorNode {
  type: OscillatorType = "sine";
  frequency = { setValueAtTime: vi.fn() };
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockGainNode {
  gain = {
    value: 1,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  };
  connect = vi.fn();
}

class MockAudioContext {
  state = "running";
  currentTime = 0;
  destination = {};

  createOscillator = vi.fn(() => new MockOscillatorNode());
  createGain = vi.fn(() => new MockGainNode());
  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
}

vi.stubGlobal("AudioContext", MockAudioContext);

describe("AudioManager", () => {
  let audio: AudioManager;

  beforeEach(() => {
    audio = new AudioManager();
  });

  it("should start uninitialized", () => {
    expect(audio.initialized).toBe(false);
    expect(audio.muted).toBe(false);
    expect(audio.volume).toBe(0.5);
  });

  it("should initialize audio context", async () => {
    await audio.init();
    expect(audio.initialized).toBe(true);
  });

  it("should not re-initialize", async () => {
    await audio.init();
    await audio.init(); // Second call should be a no-op
    expect(audio.initialized).toBe(true);
  });

  it("should set volume", async () => {
    await audio.init();
    audio.setVolume(0.8);
    expect(audio.volume).toBe(0.8);
  });

  it("should clamp volume to 0-1", async () => {
    await audio.init();

    audio.setVolume(-0.5);
    expect(audio.volume).toBe(0);

    audio.setVolume(1.5);
    expect(audio.volume).toBe(1);
  });

  it("should toggle mute", async () => {
    await audio.init();

    const result1 = audio.toggleMute();
    expect(result1).toBe(true);
    expect(audio.muted).toBe(true);

    const result2 = audio.toggleMute();
    expect(result2).toBe(false);
    expect(audio.muted).toBe(false);
  });

  it("should set muted directly", async () => {
    await audio.init();

    audio.setMuted(true);
    expect(audio.muted).toBe(true);

    audio.setMuted(false);
    expect(audio.muted).toBe(false);
  });

  it("should not play tones when not initialized", () => {
    // Should not throw
    audio.playTone(440, 0.1);
  });

  it("should play a tone when initialized", async () => {
    await audio.init();
    // Should not throw
    audio.playTone(440, 0.1, "square", 0.5);
  });

  it("should play a sequence when initialized", async () => {
    await audio.init();
    // Should not throw
    audio.playSequence([
      [440, 0.1],
      [880, 0.1],
    ]);
  });

  it("should clean up on destroy", async () => {
    await audio.init();
    audio.destroy();
    expect(audio.initialized).toBe(false);
  });
});
