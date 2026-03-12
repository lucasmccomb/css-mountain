/**
 * Re-export the challenge schema path for programmatic use.
 * Import the JSON schema directly for validation:
 *
 *   import challengeSchema from "@css-mountain/schemas/challenge.schema.json";
 */
export const CHALLENGE_SCHEMA_PATH = "./challenge.schema.json";

export { validateChallenge } from "./validate-challenge";
export type { SchemaValidationResult } from "./validate-challenge";
