import type { AIInputEvidence, StructuredDiagnosis } from "../../types/aiDiagnosis";
import type { ReassessmentReflectionInput, ReassessmentReflection } from "../../types/aiReassessment";

/**
 * The provider abstraction the rest of the app depends on. Nothing
 * outside this folder knows or cares whether a diagnosis/reflection came
 * from a real LLM or the mock provider — both implement the same
 * interface.
 */
export interface AIProvider {
  generateDiagnosis(input: AIInputEvidence): Promise<StructuredDiagnosis>;
  generateReassessmentReflection(input: ReassessmentReflectionInput): Promise<ReassessmentReflection>;
}
