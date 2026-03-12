import type { QuizChallenge, ValidationResult } from "./types";

/**
 * Handles CSS Quiz challenges (multiple-choice questions).
 *
 * Quiz validation is straightforward: if the selected option matches
 * the correctOptionIndex, the score is 1000 (3 stars). Otherwise, 0.
 */
export class QuizRunner {
  private currentQuiz: QuizChallenge | null = null;
  private selectedOption: number | null = null;

  readonly technology = "css-quiz";

  /**
   * Initialize the quiz runner.
   */
  async initialize(): Promise<void> {
    // No initialization needed for quiz runner
  }

  /**
   * Load a quiz challenge.
   */
  async loadChallenge(quiz: QuizChallenge): Promise<void> {
    this.currentQuiz = quiz;
    this.selectedOption = null;
  }

  /**
   * Select an answer option by index.
   */
  selectOption(index: number): void {
    if (!this.currentQuiz) {
      throw new Error("No quiz loaded");
    }
    if (index < 0 || index >= this.currentQuiz.options.length) {
      throw new Error(`Invalid option index: ${index}`);
    }
    this.selectedOption = index;
  }

  /**
   * Get the currently selected option index, or null if none selected.
   */
  getSelectedOption(): number | null {
    return this.selectedOption;
  }

  /**
   * Validate the selected answer.
   * Correct answer: 1000 points, 3 stars.
   * Wrong answer: 0 points, 0 stars.
   */
  async validate(): Promise<ValidationResult> {
    if (!this.currentQuiz) {
      return {
        passed: false,
        score: 0,
        stars: 0,
        ruleResults: [],
      };
    }

    if (this.selectedOption === null) {
      return {
        passed: false,
        score: 0,
        stars: 0,
        ruleResults: [
          {
            rule: { type: "quiz", description: "Select an answer" },
            passed: false,
            message: "No answer selected",
          },
        ],
      };
    }

    const isCorrect = this.selectedOption === this.currentQuiz.correctOptionIndex;

    return {
      passed: isCorrect,
      score: isCorrect ? 1000 : 0,
      stars: isCorrect ? 3 : 0,
      ruleResults: [
        {
          rule: { type: "quiz", description: this.currentQuiz.description },
          passed: isCorrect,
          message: isCorrect
            ? "Correct answer!"
            : `Incorrect. You selected '${this.currentQuiz.options[this.selectedOption]}', ` +
              `the correct answer is '${this.currentQuiz.options[this.currentQuiz.correctOptionIndex]}'`,
        },
      ],
    };
  }

  /**
   * Render the quiz UI into the given container.
   * Creates a simple multiple-choice display in DOS aesthetic.
   */
  async renderPreview(container: HTMLElement): Promise<void> {
    if (!this.currentQuiz) {
      container.innerHTML = "<p>No quiz loaded</p>";
      return;
    }

    const quiz = this.currentQuiz;
    const selected = this.selectedOption;

    const optionsHtml = quiz.options
      .map((option, index) => {
        const isSelected = selected === index;
        const letter = String.fromCharCode(65 + index); // A, B, C, D...
        const selectedClass = isSelected ? ' style="color: #00ff00; font-weight: bold;"' : "";
        return `<div class="quiz-option" data-index="${index}"${selectedClass}>
          [${letter}] ${option}
        </div>`;
      })
      .join("\n");

    container.innerHTML = `
      <div class="quiz-container" style="font-family: monospace; padding: 1rem;">
        <div class="quiz-question" style="margin-bottom: 1rem; font-weight: bold;">
          ${quiz.description}
        </div>
        <div class="quiz-options">
          ${optionsHtml}
        </div>
      </div>
    `;

    // Attach click handlers to options
    const optionElements = container.querySelectorAll(".quiz-option");
    optionElements.forEach((el) => {
      el.addEventListener("click", () => {
        const index = parseInt(el.getAttribute("data-index") || "0", 10);
        this.selectOption(index);
        // Re-render to show selection
        this.renderPreview(container);
      });
    });
  }

  /**
   * Clean up the quiz runner state.
   */
  destroy(): void {
    this.currentQuiz = null;
    this.selectedOption = null;
  }
}
