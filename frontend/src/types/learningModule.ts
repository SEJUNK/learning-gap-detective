import type { ConceptId } from "./assessment";

/**
 * The Interactive Learning Module's data model. A "micro-learning
 * recovery session" — content lives entirely here, separate from
 * pages/LearningModule/ presentation, and is looked up by concept id
 * (data/lessons/index.ts) so the same module shell is reusable for any
 * concept a lesson exists for, not just Conditional Logic.
 */

/**
 * The shape shared by every interactive moment in a lesson (practice
 * questions, the application challenge, and understanding-check
 * questions): one correct answer, positive feedback for it, and
 * per-wrong-answer misconception feedback — never a bare "Incorrect."
 */
export interface InteractiveQuestion {
  id: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctAnswer: number;
  correctFeedback: string;
  /** index (of a wrong option) → the specific misconception it reveals. */
  misconceptionFeedback: Record<number, string>;
}

export interface LessonExample {
  code: string;
  /** 1-indexed line numbers to visually highlight. */
  highlightLines?: number[];
  explanation: string;
}

export interface LessonExplanation {
  intro: string;
  bullets: string[];
  example: LessonExample;
}

export interface WorkedExample {
  scenario: string;
  setupCode: string;
  solutionCode: string;
  solutionHighlightLines?: number[];
  steps: string[];
}

export interface Lesson {
  conceptId: ConceptId;
  title: string;
  estimatedMinutes: number;
  objective: string;
  explanation: LessonExplanation;
  workedExample: WorkedExample;
  /** Exactly 3: conceptual, code-output, application (per the module spec). */
  practiceQuestions: InteractiveQuestion[];
  applicationChallenge: InteractiveQuestion & { scenario: string };
  /** Exactly 2, specifically targeting the misconception this lesson addresses. */
  understandingCheck: InteractiveQuestion[];
  /** Shown once, between practice Q1 and Q2, only if Q1 was answered incorrectly — simple deterministic adaptation. */
  adaptiveReinforcement: string;
}
