import type { AIInputEvidence, StructuredDiagnosis } from "../../types/aiDiagnosis";

/**
 * Generates a realistic, evidence-grounded StructuredDiagnosis purely by
 * templating AIInputEvidence — no network call. This is used both by
 * MockAIProvider (when no API key is configured — the default,
 * always-works path) and as the fallback when a real provider's call
 * fails or returns an invalid shape. Both cases must produce output that
 * reads as genuinely diagnostic, not a generic placeholder — every
 * sentence below is built from the actual finding it describes, never a
 * hardcoded example concept.
 */

export function generateTemplatedDiagnosis(input: AIInputEvidence, source: "mock" | "fallback"): StructuredDiagnosis {
  const primaryRootGap = input.rootGaps[0] ?? null;
  const primaryConceptGap = input.conceptGaps[0] ?? null;
  const primaryApplicationGap = input.applicationGaps[0] ?? null;

  const leadFinding = primaryRootGap ?? primaryConceptGap;

  let headline: string;
  let summary: string;
  let rootCause: StructuredDiagnosis["rootCause"] = null;
  const recommendations: string[] = [];
  const learningSequence: string[] = [];

  if (primaryRootGap) {
    const affected = primaryRootGap.affectedConcepts ?? [];
    const affectedList = affected.join(" and ");

    headline = `Your main learning gap is ${primaryRootGap.concept}`;
    rootCause = {
      concept: primaryRootGap.concept,
      mastery: primaryRootGap.mastery ?? 0,
      explanation: `Evidence suggests that difficulty with ${primaryRootGap.concept} may be affecting your performance in ${affectedList || "related concepts"}. This pattern may indicate ${primaryRootGap.concept} is a prerequisite weakness rather than an isolated issue in those later concepts.`,
      evidence: primaryRootGap.evidence,
    };
    summary =
      affected.length > 0
        ? `Your ${affected[0]} score alone doesn't tell the full story. Several of your mistakes in ${affectedList} involved reasoning that depends on ${primaryRootGap.concept}. Strengthening ${primaryRootGap.concept} first may help improve your performance across multiple areas.`
        : `${primaryRootGap.concept} appears to be a foundational weak point worth addressing directly.`;
    recommendations.push(`Strengthen ${primaryRootGap.concept} first — it appears to be a prerequisite for ${affectedList || "areas where you're currently struggling"}.`);
    learningSequence.push(primaryRootGap.concept, ...affected);
  } else if (primaryConceptGap) {
    headline = `Your main learning gap is ${primaryConceptGap.concept}`;
    rootCause = {
      concept: primaryConceptGap.concept,
      mastery: primaryConceptGap.mastery ?? 0,
      explanation: `Your current evidence suggests a direct gap in ${primaryConceptGap.concept}, rather than a knock-on effect from an earlier concept.`,
      evidence: primaryConceptGap.evidence,
    };
    summary = `${primaryConceptGap.concept} stands out as the area with the most consistent incorrect answers, and the evidence doesn't point to an earlier concept as the underlying cause.`;
    recommendations.push(`Focus on ${primaryConceptGap.concept} directly with targeted practice.`);
    learningSequence.push(primaryConceptGap.concept);
  } else if (primaryApplicationGap) {
    headline = `Your main pattern is an application gap in ${primaryApplicationGap.concept}`;
    summary = `You performed well on conceptual ${primaryApplicationGap.concept} questions (${primaryApplicationGap.conceptualAccuracy}%) but struggled when applying it in context (${primaryApplicationGap.applicationAccuracy}%). This suggests the concept itself is understood — it's applying it in unfamiliar situations that needs work.`;
    recommendations.push(`Practice applying ${primaryApplicationGap.concept} in varied, scenario-based problems rather than reviewing syntax again.`);
    learningSequence.push(primaryApplicationGap.concept);
  } else if (input.strengths.length > 0) {
    headline = "No major learning gaps detected";
    summary = `Your performance shows consistent strength across the concepts assessed, especially ${input.strengths.map((s) => s.concept).join(", ")}. Keep reinforcing these with periodic review.`;
    recommendations.push("Keep reinforcing your current concepts with periodic review, and consider a more advanced assessment.");
  } else {
    headline = "Not enough evidence yet for a confident diagnosis";
    summary = "There isn't enough answered evidence yet to identify a clear pattern. Completing a full assessment will produce a more reliable diagnosis.";
    recommendations.push("Complete a full diagnostic assessment so there's enough evidence to analyze.");
  }

  if (primaryApplicationGap && leadFinding?.concept !== primaryApplicationGap.concept) {
    recommendations.push(`Separately, ${primaryApplicationGap.concept} shows an application gap — practice applying it in new scenarios.`);
  }

  const applicationGaps = input.applicationGaps.map((finding) => ({
    concept: finding.concept,
    explanation: `You appear comfortable with the basics of ${finding.concept} (${finding.conceptualAccuracy}% on conceptual questions), but application questions remain challenging (${finding.applicationAccuracy}%).`,
  }));

  const strengths = input.strengths.map((finding) => ({
    concept: finding.concept,
    explanation: `${finding.concept} appears to be a current strength — consistently correct across the questions assessed.`,
  }));

  return {
    headline,
    summary,
    rootCause,
    applicationGaps,
    strengths,
    recommendations,
    learningSequence,
    confidenceInsight: input.confidenceNote,
    source,
  };
}
