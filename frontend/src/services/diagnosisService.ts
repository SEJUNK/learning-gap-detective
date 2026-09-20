import type { AssessmentEvidence } from "../types/assessment";
import type { DiagnosticEvidence } from "../types/diagnosis";
import type { StructuredDiagnosis } from "../types/aiDiagnosis";
import { analyzeDiagnosticEvidence } from "./diagnosticEngine";
import { toAIInputEvidence } from "./ai/aiInputMapper";
import { getAIProvider } from "./ai/aiProviderFactory";
import { isValidStructuredDiagnosis } from "./ai/diagnosisValidator";
import { generateTemplatedDiagnosis } from "./ai/templatedDiagnosis";

export interface DiagnosisResult {
  diagnosticEvidence: DiagnosticEvidence;
  diagnosis: StructuredDiagnosis;
}

/**
 * The real stages this pipeline actually goes through, in order. The
 * diagnosis-loading UI subscribes to these via `onStep` rather than
 * faking a timer — each step fires exactly when that stage of work
 * genuinely starts, so the checklist reflects real progress even though
 * most stages are fast (deterministic) and only the AI call may take
 * meaningful time.
 */
export type DiagnosisStep = "reviewing" | "mapping" | "patterns" | "building";

/**
 * The full pipeline: AssessmentEvidence → deterministic diagnostic
 * engine → AI interpretation, with a guaranteed-safe fallback.
 *
 * The AI call is never allowed to break this function: a network
 * failure, a non-2xx response, malformed JSON, or a shape that fails
 * `isValidStructuredDiagnosis` all fall through to the exact same
 * deterministic template used by MockAIProvider — the only difference
 * is the resulting `source` tag ("fallback" vs "mock"), so the UI can
 * be transparent about which happened without ever showing a broken
 * screen.
 */
export async function getDiagnosis(evidence: AssessmentEvidence, onStep?: (step: DiagnosisStep) => void): Promise<DiagnosisResult> {
  onStep?.("reviewing");
  onStep?.("mapping");
  const diagnosticEvidence = analyzeDiagnosticEvidence(evidence);
  const aiInput = toAIInputEvidence(diagnosticEvidence);

  onStep?.("patterns");
  let diagnosis: StructuredDiagnosis;
  try {
    const provider = getAIProvider();
    const result = await provider.generateDiagnosis(aiInput);
    diagnosis = isValidStructuredDiagnosis(result) ? result : generateTemplatedDiagnosis(aiInput, "fallback");
  } catch {
    diagnosis = generateTemplatedDiagnosis(aiInput, "fallback");
  }

  onStep?.("building");
  return { diagnosticEvidence, diagnosis };
}
