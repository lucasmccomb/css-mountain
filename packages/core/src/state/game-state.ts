import { createStore } from "zustand/vanilla";
import type {
  GameScreen,
  Challenge,
  QuizChallenge,
  ValidationResult,
} from "../types";

/**
 * Main game state: current screen, loaded challenge, loading states, results.
 */
export interface GameState {
  /** Current screen being displayed */
  currentScreen: GameScreen;
  /** Currently loaded challenge (null when not in a challenge) */
  currentChallenge: Challenge | QuizChallenge | null;
  /** Whether a challenge is currently loading */
  isLoading: boolean;
  /** Error message, if any */
  error: string | null;
  /** Validation result from the last submission */
  lastResult: ValidationResult | null;
  /** Timestamp when the current challenge was started */
  challengeStartedAt: number | null;

  // Actions
  setScreen: (screen: GameScreen) => void;
  loadChallenge: (challenge: Challenge | QuizChallenge) => void;
  clearChallenge: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastResult: (result: ValidationResult | null) => void;
  startChallengeTimer: () => void;
  getElapsedMs: () => number;
}

/**
 * Create the main game state store.
 * Uses vanilla Zustand (framework-agnostic) so it can be used from React
 * via useStore() or from non-React code directly.
 */
export const gameStore = createStore<GameState>()((set, get) => ({
  currentScreen: "boot",
  currentChallenge: null,
  isLoading: false,
  error: null,
  lastResult: null,
  challengeStartedAt: null,

  setScreen: (screen) => set({ currentScreen: screen }),

  loadChallenge: (challenge) =>
    set({
      currentChallenge: challenge,
      lastResult: null,
      error: null,
      challengeStartedAt: Date.now(),
    }),

  clearChallenge: () =>
    set({
      currentChallenge: null,
      lastResult: null,
      challengeStartedAt: null,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setLastResult: (result) => set({ lastResult: result }),

  startChallengeTimer: () => set({ challengeStartedAt: Date.now() }),

  getElapsedMs: () => {
    const started = get().challengeStartedAt;
    if (started === null) return 0;
    return Date.now() - started;
  },
}));
