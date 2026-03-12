import { describe, it, expect, beforeEach } from "vitest";
import { QuizRunner } from "./quiz-runner";
import type { QuizChallenge } from "./types";

const sampleQuiz: QuizChallenge = {
  id: "quiz-001",
  title: "CSS Box Model",
  type: "quiz",
  difficulty: "base-camp",
  description: "Which property sets the space between an element's border and its content?",
  options: ["margin", "padding", "border-spacing", "gap"],
  correctOptionIndex: 1, // "padding"
  explanation: "Padding is the space between the element's border and its content.",
  tags: ["box-model"],
  maxPoints: 1000,
};

describe("QuizRunner", () => {
  let runner: QuizRunner;

  beforeEach(() => {
    runner = new QuizRunner();
  });

  it("has technology set to css-quiz", () => {
    expect(runner.technology).toBe("css-quiz");
  });

  describe("loadChallenge", () => {
    it("loads a quiz challenge without error", async () => {
      await expect(runner.loadChallenge(sampleQuiz)).resolves.not.toThrow();
    });

    it("resets selected option when loading new quiz", async () => {
      await runner.loadChallenge(sampleQuiz);
      runner.selectOption(0);
      expect(runner.getSelectedOption()).toBe(0);

      await runner.loadChallenge(sampleQuiz);
      expect(runner.getSelectedOption()).toBeNull();
    });
  });

  describe("selectOption", () => {
    it("stores the selected option", async () => {
      await runner.loadChallenge(sampleQuiz);
      runner.selectOption(2);
      expect(runner.getSelectedOption()).toBe(2);
    });

    it("throws when no quiz is loaded", () => {
      expect(() => runner.selectOption(0)).toThrow("No quiz loaded");
    });

    it("throws for negative index", async () => {
      await runner.loadChallenge(sampleQuiz);
      expect(() => runner.selectOption(-1)).toThrow("Invalid option index");
    });

    it("throws for out-of-bounds index", async () => {
      await runner.loadChallenge(sampleQuiz);
      expect(() => runner.selectOption(4)).toThrow("Invalid option index");
    });
  });

  describe("validate", () => {
    it("gives 1000 score and 3 stars for correct answer", async () => {
      await runner.loadChallenge(sampleQuiz);
      runner.selectOption(1); // correct answer: "padding"
      const result = await runner.validate();

      expect(result.passed).toBe(true);
      expect(result.score).toBe(1000);
      expect(result.stars).toBe(3);
      expect(result.ruleResults).toHaveLength(1);
      expect(result.ruleResults[0].passed).toBe(true);
      expect(result.ruleResults[0].message).toContain("Correct");
    });

    it("gives 0 score and 0 stars for wrong answer", async () => {
      await runner.loadChallenge(sampleQuiz);
      runner.selectOption(0); // wrong answer: "margin"
      const result = await runner.validate();

      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
      expect(result.stars).toBe(0);
      expect(result.ruleResults).toHaveLength(1);
      expect(result.ruleResults[0].passed).toBe(false);
      expect(result.ruleResults[0].message).toContain("Incorrect");
    });

    it("gives 0 score when no option is selected", async () => {
      await runner.loadChallenge(sampleQuiz);
      const result = await runner.validate();

      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
      expect(result.stars).toBe(0);
      expect(result.ruleResults[0].message).toContain("No answer selected");
    });

    it("gives 0 score when no quiz is loaded", async () => {
      const result = await runner.validate();

      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
      expect(result.stars).toBe(0);
    });

    it("wrong answer message includes selected and correct option text", async () => {
      await runner.loadChallenge(sampleQuiz);
      runner.selectOption(2); // "border-spacing"
      const result = await runner.validate();

      expect(result.ruleResults[0].message).toContain("border-spacing");
      expect(result.ruleResults[0].message).toContain("padding");
    });
  });

  describe("destroy", () => {
    it("clears state", async () => {
      await runner.loadChallenge(sampleQuiz);
      runner.selectOption(1);
      runner.destroy();

      expect(runner.getSelectedOption()).toBeNull();
      // After destroy, validate should return empty result
      const result = await runner.validate();
      expect(result.score).toBe(0);
    });
  });
});
