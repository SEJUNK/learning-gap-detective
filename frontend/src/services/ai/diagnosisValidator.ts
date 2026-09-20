import type { StructuredDiagnosis } from "../../types/aiDiagnosis";

/**
 * Validates that an unknown value (e.g. parsed JSON from a real LLM
 * response) actually matches StructuredDiagnosis before the app trusts
 * it. A real provider's output is never rendered without passing this —
 * an LLM that returns malformed JSON, missing fields, or wrong types
 * gets treated exactly like a failed call and triggers the deterministic
 * fallback, never a broken screen.
 */
export function isValidStructuredDiagnosis(value: unknown): value is StructuredDiagnosis {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;

  if (typeof v.headline !== "string" || v.headline.trim() === "") return false;
  if (typeof v.summary !== "string" || v.summary.trim() === "") return false;
  if (!Array.isArray(v.applicationGaps)) return false;
  if (!Array.isArray(v.strengths)) return false;
  if (!Array.isArray(v.recommendations)) return false;
  if (!Array.isArray(v.learningSequence)) return false;
  if (v.confidenceInsight !== null && typeof v.confidenceInsight !== "string") return false;
  if (!["ai", "mock", "fallback"].includes(v.source as string)) return false;

  if (v.rootCause !== null) {
    if (typeof v.rootCause !== "object") return false;
    const rc = v.rootCause as Record<string, unknown>;
    if (typeof rc.concept !== "string") return false;
    if (typeof rc.mastery !== "number") return false;
    if (typeof rc.explanation !== "string") return false;
    if (!Array.isArray(rc.evidence)) return false;
  }

  return true;
}
