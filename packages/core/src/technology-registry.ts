import type { ChallengeRunnerFactory } from "./challenge-runner";

/**
 * Registry for challenge runner factories, keyed by technology name.
 * Allows the game engine to support multiple challenge technologies
 * (CSS, future: SCSS, Tailwind, etc.) via a plugin pattern.
 */
class TechnologyRegistry {
  private runners: Map<string, ChallengeRunnerFactory> = new Map();

  /**
   * Register a runner factory for a technology.
   * Overwrites any existing factory for the same technology.
   */
  register(technology: string, factory: ChallengeRunnerFactory): void {
    this.runners.set(technology, factory);
  }

  /**
   * Get the runner factory for a technology.
   * Returns undefined if the technology is not registered.
   */
  get(technology: string): ChallengeRunnerFactory | undefined {
    return this.runners.get(technology);
  }

  /**
   * Check if a technology has a registered runner.
   */
  has(technology: string): boolean {
    return this.runners.has(technology);
  }

  /**
   * List all registered technology names.
   */
  list(): string[] {
    return Array.from(this.runners.keys());
  }
}

/** Singleton technology registry instance. */
export const technologyRegistry = new TechnologyRegistry();
