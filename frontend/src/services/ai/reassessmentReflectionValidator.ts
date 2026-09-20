import type { ReassessmentReflection } from "../../types/aiReassessment";

/** Same trust boundary as diagnosisValidator.ts — a real provider's response is never rendered without passing this. */
export function isValidReassessmentReflection(value: unknown): value is ReassessmentReflection {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;

  if (typeof v.headline !== "string" || v.headline.trim() === "") return false;
  if (typeof v.narrative !== "string" || v.narrative.trim() === "") return false;
  if (!["ai", "mock", "fallback"].includes(v.source as string)) return false;

  return true;
}
