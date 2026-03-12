import challengeSchema from "./challenge.schema.json";

/**
 * Result of a schema validation check.
 */
export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a challenge definition against the JSON schema.
 * This is a lightweight runtime validator that checks required fields,
 * types, and constraints without a full JSON Schema library dependency.
 */
export function validateChallenge(data: unknown): SchemaValidationResult {
  const errors: string[] = [];

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { valid: false, errors: ["Challenge must be a non-null object"] };
  }

  const obj = data as Record<string, unknown>;

  // Check required fields
  const required = challengeSchema.required;
  for (const field of required) {
    if (!(field in obj)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Type checks
  if (typeof obj.id !== "string" || (obj.id as string).length < 1) {
    errors.push("id must be a non-empty string");
  }

  if (typeof obj.slug === "string" && !/^[a-z0-9-]+$/.test(obj.slug as string)) {
    errors.push("slug must contain only lowercase letters, numbers, and hyphens");
  }

  if (typeof obj.title === "string") {
    const title = obj.title as string;
    if (title.length < 3 || title.length > 80) {
      errors.push("title must be between 3 and 80 characters");
    }
  }

  if (typeof obj.description === "string" && (obj.description as string).length < 10) {
    errors.push("description must be at least 10 characters");
  }

  // Enum checks
  const validTypes = ["match", "fix", "optimize", "build", "quiz"];
  if (typeof obj.type === "string" && !validTypes.includes(obj.type as string)) {
    errors.push(`type must be one of: ${validTypes.join(", ")}`);
  }

  const validDifficulties = ["junior", "mid-level", "senior", "staff", "principal"];
  if (typeof obj.difficulty === "string" && !validDifficulties.includes(obj.difficulty as string)) {
    errors.push(`difficulty must be one of: ${validDifficulties.join(", ")}`);
  }

  // Zone check
  if (typeof obj.zone === "number") {
    if (!Number.isInteger(obj.zone) || (obj.zone as number) < 1 || (obj.zone as number) > 5) {
      errors.push("zone must be an integer between 1 and 5");
    }
  }

  // isBoss check
  if ("isBoss" in obj && typeof obj.isBoss !== "boolean") {
    errors.push("isBoss must be a boolean");
  }

  // referenceSolutions check
  if (Array.isArray(obj.referenceSolutions)) {
    if ((obj.referenceSolutions as unknown[]).length < 2) {
      errors.push("referenceSolutions must have at least 2 entries");
    }
  }

  // validationRules check
  if (Array.isArray(obj.validationRules)) {
    const rules = obj.validationRules as unknown[];
    if (rules.length < 1) {
      errors.push("validationRules must have at least 1 rule");
    }
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i] as Record<string, unknown>;
      if (typeof rule !== "object" || rule === null) {
        errors.push(`validationRules[${i}] must be an object`);
        continue;
      }
      const validRuleTypes = ["computed-style", "layout-bounds", "property-check"];
      if (typeof rule.type === "string" && !validRuleTypes.includes(rule.type as string)) {
        errors.push(`validationRules[${i}].type must be one of: ${validRuleTypes.join(", ")}`);
      }
      if (!rule.selector) {
        errors.push(`validationRules[${i}] is missing required field: selector`);
      }
      if (!("expected" in rule)) {
        errors.push(`validationRules[${i}] is missing required field: expected`);
      }
      if (typeof rule.weight !== "number") {
        errors.push(`validationRules[${i}].weight must be a number`);
      }
      if (typeof rule.message !== "string") {
        errors.push(`validationRules[${i}].message must be a string`);
      }
    }
  }

  // hints check
  if (Array.isArray(obj.hints)) {
    const hints = obj.hints as unknown[];
    if (hints.length !== 3) {
      errors.push("hints must have exactly 3 entries (nudge, clue, solution)");
    }
    const validLevels = ["nudge", "clue", "solution"];
    for (let i = 0; i < hints.length; i++) {
      const hint = hints[i] as Record<string, unknown>;
      if (typeof hint !== "object" || hint === null) {
        errors.push(`hints[${i}] must be an object`);
        continue;
      }
      if (typeof hint.level === "string" && !validLevels.includes(hint.level as string)) {
        errors.push(`hints[${i}].level must be one of: ${validLevels.join(", ")}`);
      }
      if (typeof hint.text !== "string" || (hint.text as string).length < 1) {
        errors.push(`hints[${i}].text must be a non-empty string`);
      }
    }
  }

  // maxScore check
  if ("maxScore" in obj && obj.maxScore !== 1000) {
    errors.push("maxScore must be exactly 1000");
  }

  // metadata check
  if (typeof obj.metadata === "object" && obj.metadata !== null) {
    const meta = obj.metadata as Record<string, unknown>;
    if (!Array.isArray(meta.topics) || (meta.topics as unknown[]).length < 1) {
      errors.push("metadata.topics must be a non-empty array");
    }
    if (typeof meta.estimatedMinutes !== "number" || (meta.estimatedMinutes as number) < 1) {
      errors.push("metadata.estimatedMinutes must be a positive number");
    }
    if (typeof meta.difficulty !== "number" ||
        !Number.isInteger(meta.difficulty) ||
        (meta.difficulty as number) < 1 ||
        (meta.difficulty as number) > 10) {
      errors.push("metadata.difficulty must be an integer between 1 and 10");
    }
  }

  return { valid: errors.length === 0, errors };
}
