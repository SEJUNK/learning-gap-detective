import type { InteractiveQuestion } from "../types/learningModule";

/**
 * Deterministic, pure module logic — no LLM anywhere in this file. The
 * base learning module must work fully without an AI service (hackathon
 * reliability requirement); this is that guarantee made concrete.
 */

export interface AnswerCheckResult {
  isCorrect: boolean;
  feedback: string;
}

/**
 * Checks a selected answer against an InteractiveQuestion and returns
 * the right feedback for it — positive feedback if correct, the
 * specific misconception feedback for that wrong option if incorrect
 * (falling back to a generic-but-still-constructive message if a
 * particular wrong index has no authored misconception text, which
 * should not normally happen for a well-authored lesson).
 */
export function checkAnswer(question: InteractiveQuestion, selectedIndex: number): AnswerCheckResult {
  if (selectedIndex === question.correctAnswer) {
    return { isCorrect: true, feedback: question.correctFeedback };
  }
  const misconception = question.misconceptionFeedback[selectedIndex];
  return {
    isCorrect: false,
    feedback: misconception ?? "Not quite — take another look at how the conditions combine, then try the next question.",
  };
}

export interface ModuleAccuracySummary {
  correctCount: number;
  totalCount: number;
  accuracyLabel: string;
  /** Deterministic, hedged framing — never claims mastery from a single mini-session. */
  confidenceLabel: "Improving" | "Solid progress" | "Needs another look";
}

/**
 * Summarizes correctness across every interactive item in the session
 * (practice + challenge + understanding check) for the completion
 * screen. Never converted into a claimed mastery increase — see
 * confidenceLabel's deliberately modest wording.
 */
export function computeModuleAccuracy(results: boolean[]): ModuleAccuracySummary {
  const totalCount = results.length;
  const correctCount = results.filter(Boolean).length;
  const ratio = totalCount === 0 ? 0 : correctCount / totalCount;

  const confidenceLabel: ModuleAccuracySummary["confidenceLabel"] = ratio >= 0.8 ? "Solid progress" : ratio >= 0.5 ? "Improving" : "Needs another look";

  return {
    correctCount,
    totalCount,
    accuracyLabel: `${correctCount}/${totalCount}`,
    confidenceLabel,
  };
}
