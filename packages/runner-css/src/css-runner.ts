import { sanitizeCSS } from "./css-sanitizer";
import { IframeSandbox } from "./iframe-sandbox";
import { validateComputedStyle } from "./validators/computed-style";
import { validateLayoutBounds } from "./validators/layout-bounds";
import { validatePropertyExists } from "./validators/property-check";
import type { Challenge, ValidationResult, RuleResult } from "./types";
import { calculateStars } from "./types";

/**
 * The main ChallengeRunner implementation for CSS challenges.
 *
 * Manages the lifecycle of a CSS challenge: loading the challenge,
 * executing user CSS in a sandboxed iframe, and running validation
 * rules against the rendered output.
 */
export class CSSRunner {
  private sandbox: IframeSandbox;
  private currentChallenge: Challenge | null = null;
  private currentCss: string = "";

  readonly technology = "css";

  constructor() {
    this.sandbox = new IframeSandbox();
  }

  /**
   * Initialize the runner. Creates internal state.
   */
  async initialize(): Promise<void> {
    // Runner is ready after construction; sandbox is created in renderPreview
  }

  /**
   * Load a challenge definition. Stores the challenge data and resets state.
   */
  async loadChallenge(challenge: Challenge): Promise<void> {
    this.currentChallenge = challenge;
    this.currentCss = challenge.starterCss || "";
  }

  /**
   * Execute user-submitted CSS. Sanitizes the CSS and updates the iframe.
   */
  async executeUserCode(css: string): Promise<void> {
    if (!this.currentChallenge) {
      throw new Error("No challenge loaded");
    }

    const { sanitized } = sanitizeCSS(css);
    this.currentCss = sanitized;
    this.sandbox.updateContent(this.currentChallenge.html, sanitized);
  }

  /**
   * Run all validation rules against the current iframe state.
   * Returns a ValidationResult with score and per-rule results.
   */
  async validate(): Promise<ValidationResult> {
    if (!this.currentChallenge) {
      return {
        passed: false,
        score: 0,
        stars: 0,
        ruleResults: [],
      };
    }

    const rules = this.currentChallenge.validationRules;
    if (rules.length === 0) {
      return {
        passed: true,
        score: 1000,
        stars: 3,
        ruleResults: [],
      };
    }

    const ruleResults: RuleResult[] = [];

    for (const rule of rules) {
      const result = await this.evaluateRule(rule);
      ruleResults.push(result);
    }

    const passedCount = ruleResults.filter((r) => r.passed).length;
    const score = Math.round((passedCount / rules.length) * 1000);
    const allPassed = passedCount === rules.length;

    return {
      passed: allPassed,
      score,
      stars: calculateStars(score),
      ruleResults,
    };
  }

  /**
   * Create or update the sandbox iframe in the given container.
   */
  async renderPreview(container: HTMLElement): Promise<void> {
    this.sandbox.create(container);
    if (this.currentChallenge) {
      this.sandbox.updateContent(this.currentChallenge.html, this.currentCss);
    }
  }

  /**
   * Clean up the runner and its sandbox.
   */
  destroy(): void {
    this.sandbox.destroy();
    this.currentChallenge = null;
    this.currentCss = "";
  }

  /**
   * Get the underlying sandbox instance (for direct validator access).
   */
  getSandbox(): IframeSandbox {
    return this.sandbox;
  }

  /** Evaluate a single validation rule against the current iframe state */
  private async evaluateRule(
    rule: Challenge["validationRules"][number],
  ): Promise<RuleResult> {
    const ruleType = rule.type;

    try {
      switch (ruleType) {
        case "computed-style": {
          if (!rule.property || !rule.expected) {
            return {
              rule,
              passed: false,
              message: `Invalid computed-style rule: missing property or expected value`,
            };
          }
          // Extract selector from description or use a default
          const selector = this.extractSelector(rule);
          const result = await validateComputedStyle(this.sandbox, {
            selector,
            property: rule.property,
            expected: rule.expected,
          });
          return { rule, passed: result.passed, message: result.message };
        }

        case "layout-bounds": {
          if (!rule.property || !rule.expected) {
            return {
              rule,
              passed: false,
              message: `Invalid layout-bounds rule: missing property or expected value`,
            };
          }
          const selector = this.extractSelector(rule);
          const expected = JSON.parse(rule.expected) as {
            min?: number;
            max?: number;
            property: "width" | "height" | "top" | "left";
          };
          const result = await validateLayoutBounds(this.sandbox, {
            selector,
            expected,
          });
          return { rule, passed: result.passed, message: result.message };
        }

        case "property-check": {
          if (!rule.property) {
            return {
              rule,
              passed: false,
              message: `Invalid property-check rule: missing property`,
            };
          }
          const selector = this.extractSelector(rule);
          const result = await validatePropertyExists(this.sandbox, {
            selector,
            property: rule.property,
          });
          return { rule, passed: result.passed, message: result.message };
        }

        default:
          return {
            rule,
            passed: false,
            message: `Unknown rule type: ${ruleType}`,
          };
      }
    } catch (error) {
      return {
        rule,
        passed: false,
        message: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Extract a CSS selector from a validation rule.
   * The rule's description may contain a selector in the format "selector: .foo"
   * or the property field may be formatted as "selector|property".
   * Falls back to "body" if no selector can be determined.
   */
  private extractSelector(rule: Challenge["validationRules"][number]): string {
    // Check if description contains "selector: ..." pattern
    const selectorMatch = rule.description.match(/selector:\s*([^\s,]+)/i);
    if (selectorMatch) {
      return selectorMatch[1];
    }

    // Check if property contains a pipe-separated selector
    if (rule.property && rule.property.includes("|")) {
      return rule.property.split("|")[0];
    }

    // Default to body
    return "body";
  }
}
