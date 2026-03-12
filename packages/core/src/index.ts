// Types
export type {
  ChallengeType,
  Difficulty,
  ValidationRule,
  HintTier,
  ChallengeMetadata,
  Challenge,
  QuizOption,
  QuizChallenge,
  ScoreBreakdown,
  ChallengeProgress,
  PlayerSettings,
  PlayerProfile,
  RuleResult,
  ValidationResult,
  ChallengeRunner,
  GameScreen,
} from "./types";

// Challenge Runner
export type { ChallengeRunnerFactory } from "./challenge-runner";

// Technology Registry
export { technologyRegistry } from "./technology-registry";

// Scoring
export { calculateScore, calculateStars } from "./scoring";
export type { ScoreParams } from "./scoring";

// Validation
export { runValidation, validateComputedStyle, validateLayoutBounds } from "./validation";
export type { ValidationParams } from "./validation";

// Impossible-to-Lose
export {
  SAFETY_NET,
  calculatePartialCredit,
  applySolutionPenalty,
  getEncouragementMessage,
} from "./impossible-to-lose";
export type { SafetyNet } from "./impossible-to-lose";

// State Stores
export {
  gameStore,
  progressStore,
  settingsStore,
  DEFAULT_SETTINGS,
} from "./state";
export type { GameState, ProgressState, SettingsState } from "./state";

// Save System
export {
  saveProfile,
  loadProfile,
  saveSettings,
  loadSettings,
  saveProgress,
  loadProgress,
  hasSavedData,
  clearAllData,
  createDefaultProfile,
} from "./save-system";

// Guest Store
export { createGuestProgressStore } from "./guest-store";
export type { GuestProgressStore, MergePayload } from "./guest-store";
