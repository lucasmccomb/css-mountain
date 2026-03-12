export type { ChallengeRunner } from "./types";

/**
 * Factory function that creates a new ChallengeRunner instance.
 * Each call should return a fresh, uninitialized runner.
 */
export type ChallengeRunnerFactory = () => Promise<
  import("./types").ChallengeRunner
>;
