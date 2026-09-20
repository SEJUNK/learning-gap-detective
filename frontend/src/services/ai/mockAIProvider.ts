import type { AIProvider } from "./aiProvider";
import type { AIInputEvidence, StructuredDiagnosis } from "../../types/aiDiagnosis";
import type { ReassessmentReflection, ReassessmentReflectionInput } from "../../types/aiReassessment";
import { generateTemplatedDiagnosis } from "./templatedDiagnosis";
import { generateTemplatedReflection } from "./templatedReassessmentReflection";

/**
 * The always-available provider. No network call, no API key — it
 * templates genuinely evidence-grounded output from the real
 * deterministic findings it's given. This is what makes the product
 * work reliably without any external dependency: hackathon judges (or
 * anyone without an API key configured) see the full experience, not a
 * degraded one.
 */
export class MockAIProvider implements AIProvider {
  async generateDiagnosis(input: AIInputEvidence): Promise<StructuredDiagnosis> {
    return generateTemplatedDiagnosis(input, "mock");
  }

  async generateReassessmentReflection(input: ReassessmentReflectionInput): Promise<ReassessmentReflection> {
    return generateTemplatedReflection(input, "mock");
  }
}
