import type { ReassessmentReflection, ReassessmentReflectionInput } from "../../types/aiReassessment";

/**
 * Generates a "what changed?" reflection purely by describing the
 * structured before/after data it's given — no invented numbers, no
 * invented improvement. Used by MockAIProvider (default) and as the
 * fallback when a real provider fails or returns an invalid shape.
 */
export function generateTemplatedReflection(input: ReassessmentReflectionInput, source: "mock" | "fallback"): ReassessmentReflection {
  if (input.comparisons.length === 0) {
    return {
      headline: "What changed?",
      narrative: "There isn't enough reassessment data yet to describe what changed.",
      source,
    };
  }

  const sorted = [...input.comparisons].sort((a, b) => b.difference - a.difference);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  let narrative = `Your strongest change was in ${strongest.concept}, moving from ${strongest.beforeScore}% to ${strongest.afterScore}%`;
  narrative +=
    strongest.difference > 0 ? " — a real improvement." : strongest.difference === 0 ? ", essentially unchanged." : ", a step back worth reviewing.";

  if (input.applicationTransfer) {
    narrative += input.applicationTransfer.transferred
      ? ` Your improvement in ${input.applicationTransfer.concept} carried over to a new problem, going from ${input.applicationTransfer.beforeAccuracy}% to ${input.applicationTransfer.afterAccuracy}% on application-style questions.`
      : ` Applying ${input.applicationTransfer.concept} in a new scenario is still catching up — ${input.applicationTransfer.afterAccuracy}% now versus ${input.applicationTransfer.beforeAccuracy}% before.`;
  }

  if (sorted.length > 1 && weakest.concept !== strongest.concept && weakest.difference < 0) {
    narrative += ` ${weakest.concept} moved in the other direction (${weakest.beforeScore}% to ${weakest.afterScore}%) and may be worth another look.`;
  }

  return { headline: "What changed?", narrative, source };
}
