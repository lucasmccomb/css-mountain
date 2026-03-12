// ─── Challenge Types ──────────────────────────────────────────────────────────

/**
 * Challenge types supported by CSS Mountain.
 *
 * - match: Reproduce a target visual using CSS
 * - fix: Fix broken CSS to match the expected output
 * - optimize: Reduce CSS while maintaining the same visual
 * - build: Build a component from scratch with CSS
 * - quiz: Multiple-choice CSS knowledge questions
 */
export type ChallengeType = "match" | "fix" | "optimize" | "build" | "quiz";

/**
 * Difficulty tiers mapped to the mountain zones.
 * Each zone corresponds to a career level and progressively harder challenges.
 */
export type Difficulty =
  | "junior"
  | "mid-level"
  | "senior"
  | "staff"
  | "principal";

/**
 * A single validation rule applied to a challenge submission.
 */
export interface ValidationRule {
  /** Rule type identifier */
  type: "computed-style" | "layout-bounds" | "property-check";
  /** CSS selector to target the element */
  selector: string;
  /** CSS property to validate, if applicable */
  property?: string;
  /** Expected value - string, number, or a numeric range */
  expected: string | number | { min: number; max: number };
  /** Points awarded for passing this rule (totals should sum to correctness portion) */
  weight: number;
  /** Human-readable feedback message on failure */
  message: string;
}

/**
 * A hint tier for progressive hint reveal.
 */
export interface HintTier {
  /** Hint level - nudge is vague, clue is helpful, solution is direct */
  level: "nudge" | "clue" | "solution";
  /** Hint text */
  text: string;
  /** Optional code snippet */
  code?: string;
}

/**
 * Metadata for a challenge, used for filtering and display.
 */
export interface ChallengeMetadata {
  /** CSS topics covered (e.g., ["flexbox", "grid", "colors"]) */
  topics: string[];
  /** Estimated time to complete in minutes */
  estimatedMinutes: number;
  /** Granular difficulty within the zone (1-10) */
  difficulty: number;
}

/**
 * A CSS challenge definition.
 */
export interface Challenge {
  /** Unique challenge identifier */
  id: string;
  /** URL-safe slug */
  slug: string;
  /** Display title */
  title: string;
  /** Brief description shown to the player */
  description: string;
  /** Challenge type */
  type: ChallengeType;
  /** Difficulty tier / zone */
  difficulty: Difficulty;
  /** Mountain zone number (1-5) */
  zone: number;
  /** Whether this is a boss challenge for the zone */
  isBoss: boolean;
  /** HTML template the CSS applies to */
  html: string;
  /** Starting CSS code provided to the player */
  starterCss: string;
  /** At least 2 reference solutions (hidden from player) */
  referenceSolutions: string[];
  /** Validation rules for grading */
  validationRules: ValidationRule[];
  /** Three tiers of hints: nudge, clue, solution */
  hints: [HintTier, HintTier, HintTier];
  /** Maximum score is always 1000 */
  maxScore: 1000;
  /** Additional metadata for filtering and display */
  metadata: ChallengeMetadata;
}

/**
 * A quiz option for multiple-choice questions.
 */
export interface QuizOption {
  /** Option text */
  text: string;
  /** Optional code snippet */
  code?: string;
}

/**
 * A quiz-type challenge with multiple-choice questions instead of CSS coding.
 */
export interface QuizChallenge
  extends Omit<
    Challenge,
    "html" | "starterCss" | "referenceSolutions" | "validationRules"
  > {
  type: "quiz";
  /** The quiz question */
  question: string;
  /** Multiple-choice options */
  options: QuizOption[];
  /** Index of the correct option */
  correctOptionIndex: number;
  /** Explanation shown after answering */
  explanation: string;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

/**
 * Breakdown of a challenge score across all dimensions.
 */
export interface ScoreBreakdown {
  /** Correctness score: max 600 */
  correctness: number;
  /** Code quality score: max 200 */
  codeQuality: number;
  /** Efficiency score: max 100 */
  efficiency: number;
  /** Speed bonus: max 100 */
  speedBonus: number;
  /** Total score: max 1000 */
  total: number;
  /** Stars earned: 0-3 */
  stars: 0 | 1 | 2 | 3;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

/**
 * A player's progress on a single challenge.
 */
export interface ChallengeProgress {
  /** Challenge ID this progress belongs to */
  challengeId: string;
  /** Current status of the challenge */
  status: "locked" | "unlocked" | "attempted" | "completed";
  /** Best score achieved */
  bestScore: number;
  /** Stars earned (0-3) */
  stars: 0 | 1 | 2 | 3;
  /** Number of attempts */
  attempts: number;
  /** Best CSS solution submitted */
  bestSolution: string | null;
  /** Number of hints used (0-3) */
  hintsUsed: number;
  /** Whether the full solution was viewed */
  solutionViewed: boolean;
  /** Total time spent in milliseconds */
  timeSpentMs: number;
  /** ISO timestamp of completion, or null */
  completedAt: string | null;
}

/**
 * Player settings for the game experience.
 */
export interface PlayerSettings {
  /** CRT scanline effect */
  crtMode: boolean;
  /** Sound effects enabled */
  audioEnabled: boolean;
  /** Audio volume 0-1 */
  audioVolume: number;
  /** Show boot sequence animation on startup */
  showBootSequence: boolean;
  /** Color theme */
  theme: "vga" | "cga";
}

/**
 * Complete player profile with progress and settings.
 */
export interface PlayerProfile {
  /** User ID, null for guest players */
  userId: string | null;
  /** Display name */
  displayName: string;
  /** Avatar URL, null for guests */
  avatarUrl: string | null;
  /** Current zone/difficulty the player is on */
  currentZone: Difficulty;
  /** Total stars earned across all challenges */
  totalStars: number;
  /** Total score across all challenges */
  totalScore: number;
  /** Per-challenge progress keyed by challenge ID */
  challengeProgress: Record<string, ChallengeProgress>;
  /** Achievement IDs earned */
  achievements: string[];
  /** Player settings */
  settings: PlayerSettings;
}

// ─── Runner Interface ─────────────────────────────────────────────────────────

/**
 * Result of a single validation rule check.
 */
export interface RuleResult {
  /** The rule that was checked */
  rule: ValidationRule;
  /** Whether the rule passed */
  passed: boolean;
  /** Actual value found (null if element not found) */
  actual: string | number | null;
  /** Human-readable result message */
  message: string;
}

/**
 * Full validation result for a challenge submission.
 */
export interface ValidationResult {
  /** Whether all rules passed */
  passed: boolean;
  /** Score breakdown */
  score: ScoreBreakdown;
  /** Per-rule results */
  ruleResults: RuleResult[];
  /** Feedback messages for the player */
  feedback: string[];
}

/**
 * Interface for running and validating challenge submissions.
 * Implementations handle specific technologies (CSS, etc.)
 */
export interface ChallengeRunner {
  /** Technology identifier (e.g., "css") */
  readonly technology: string;
  /** Initialize the runner (set up sandbox, etc.) */
  initialize(): Promise<void>;
  /** Load a challenge into the runner */
  loadChallenge(challenge: Challenge | QuizChallenge): Promise<void>;
  /** Execute user-submitted code */
  executeUserCode(code: string): Promise<void>;
  /** Validate the current state against loaded challenge rules */
  validate(): Promise<ValidationResult>;
  /** Render a preview into a container element */
  renderPreview(container: HTMLElement): Promise<void>;
  /** Clean up resources */
  destroy(): void;
}

// ─── Game State ───────────────────────────────────────────────────────────────

/**
 * Screens available in the game.
 */
export type GameScreen =
  | "boot"
  | "title"
  | "menu"
  | "zone-select"
  | "challenge"
  | "results"
  | "profile"
  | "settings";
