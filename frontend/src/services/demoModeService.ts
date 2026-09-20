import { ASSESSMENT_QUESTIONS } from "../data/assessmentQuestions";
import { DEMO_INCORRECT_QUESTION_IDS } from "../data/demoScript";
import { resetDemoState } from "./resetService";
import type { AssessmentQuestion, AssessmentResponse } from "../types/assessment";

/**
 * Demo Mode is a presenter-facing convenience, not a shortcut around the
 * product's real logic. It does exactly two things:
 *   1. Persists an on/off flag so a "Fill Demo Answers" control can show
 *      up on the Assessment and Reassessment screens without cluttering
 *      the real student experience the rest of the time.
 *   2. Pre-fills the same `responses` map a student clicking through the
 *      UI would produce, using the documented answer key in
 *      `data/demoScript.ts`.
 *
 * Nothing here calls `scoreAssessment`, touches `conceptScores`, or
 * writes a result directly — it only prepares *inputs*. The presenter
 * still clicks Submit, and the exact same `scoreAssessment` /
 * `buildAssessmentEvidence` / `computeReassessmentResult` pipeline every
 * real student goes through is what actually produces the outcome.
 */

const DEMO_MODE_KEY = "lgd-demo-mode";

export function isDemoModeEnabled(): boolean {
  try {
    return localStorage.getItem(DEMO_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setDemoModeEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(DEMO_MODE_KEY, "1");
    else localStorage.removeItem(DEMO_MODE_KEY);
  } catch {
    // best-effort — worst case the demo-fill controls just don't appear
  }
}

/** Resets all demo state, turns Demo Mode on, and returns the route to navigate to next. */
export function startDemoJourney(): string {
  resetDemoState();
  setDemoModeEnabled(true);
  return "/assessment";
}

function response(questionId: string, selectedAnswer: number): AssessmentResponse {
  return { questionId, selectedAnswer, isAnswered: true, confidence: "somewhat_confident", timeSpent: 14 };
}

/**
 * The full 12-question response set matching `demoScript.ts`'s documented
 * answer key — correct on every question except the four that produce
 * the demo's weak-Conditions/Loops/Functions, strong-everything-else
 * story once real scoring runs on it.
 */
export function buildDemoAssessmentResponses(): Record<string, AssessmentResponse> {
  const responses: Record<string, AssessmentResponse> = {};
  for (const question of ASSESSMENT_QUESTIONS) {
    const isWrong = DEMO_INCORRECT_QUESTION_IDS.includes(question.id);
    responses[question.id] = response(question.id, isWrong ? (question.correctAnswer === 0 ? 1 : 0) : question.correctAnswer);
  }
  return responses;
}

/**
 * All-correct responses for whatever reassessment questions were
 * actually selected for this student (built fresh from the real
 * diagnosis by `buildReassessmentQuestions`, not a fixed list) — this is
 * what produces the demo's "genuine improvement" story once scored.
 */
export function buildDemoReassessmentResponses(questions: AssessmentQuestion[]): Record<string, AssessmentResponse> {
  const responses: Record<string, AssessmentResponse> = {};
  for (const question of questions) {
    responses[question.id] = response(question.id, question.correctAnswer);
  }
  return responses;
}
