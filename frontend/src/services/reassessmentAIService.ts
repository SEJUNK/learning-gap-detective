import type { ReassessmentResult } from "../types/reassessment";
import type { ReassessmentReflection, ReassessmentReflectionInput } from "../types/aiReassessment";
import { getAIProvider } from "./ai/aiProviderFactory";
import { isValidReassessmentReflection } from "./ai/reassessmentReflectionValidator";
import { generateTemplatedReflection } from "./ai/templatedReassessmentReflection";

function toReflectionInput(result: ReassessmentResult): ReassessmentReflectionInput {
  return {
    overallImprovementTier: result.overallImprovementTier,
    comparisons: result.comparison.map((c) => ({
      concept: c.conceptName,
      beforeScore: c.beforeScore,
      afterScore: c.afterScore,
      difference: c.difference,
      status: c.status,
    })),
    applicationTransfer: result.applicationTransfer
      ? {
          concept: result.comparison.find((c) => c.concept === result.applicationTransfer!.concept)?.conceptName ?? result.applicationTransfer.concept,
          beforeAccuracy: result.applicationTransfer.beforeApplicationAccuracy,
          afterAccuracy: result.applicationTransfer.afterApplicationAccuracy,
          transferred: result.applicationTransfer.transferred,
        }
      : null,
  };
}

/**
 * Optional AI reflection layer, added on top of the deterministic
 * ReassessmentResult. Same guaranteed-safe pattern as
 * diagnosisService.getDiagnosis: any provider failure (network, bad
 * JSON, invalid shape) falls through to the same deterministic template
 * MockAIProvider uses, tagged "fallback" instead of "mock." The
 * deterministic result itself is never touched by this — the results
 * screen already has everything it needs before this is even called.
 */
export async function getReassessmentReflection(result: ReassessmentResult): Promise<ReassessmentReflection> {
  const input = toReflectionInput(result);

  try {
    const provider = getAIProvider();
    const reflection = await provider.generateReassessmentReflection(input);
    return isValidReassessmentReflection(reflection) ? reflection : generateTemplatedReflection(input, "fallback");
  } catch {
    return generateTemplatedReflection(input, "fallback");
  }
}
