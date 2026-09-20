/**
 * The AI interpretation layer's input and output contracts.
 *
 * AIInputEvidence is deliberately narrow: it's a sanitized, structured
 * summary of DiagnosticEvidence, never the raw AssessmentEvidence or any
 * other application state. The AI explains conclusions the deterministic
 * engine already reached — it receives those conclusions, not raw
 * answers to reinterpret from scratch.
 */

export interface AIInputFinding {
  concept: string;
  mastery?: number;
  affectedConcepts?: string[];
  conceptualAccuracy?: number;
  applicationAccuracy?: number;
  evidence: string[];
}

export interface AIInputEvidence {
  subject: string;
  overallScore: { totalScore: number; totalQuestions: number; percentage: number };
  conceptMasteryAverage: number;
  conceptMastery: Record<string, number>;
  rootGaps: AIInputFinding[];
  conceptGaps: AIInputFinding[];
  applicationGaps: AIInputFinding[];
  strengths: AIInputFinding[];
  confidenceNote: string | null;
  prerequisiteGraph: Record<string, string[]>;
}

/**
 * Structured diagnosis output. This — not free-form prose — is the
 * primary contract the diagnosis UI renders. `source` is always present
 * so the UI (and this codebase's own trust story) can tell whether a
 * real AI call produced this, the mock provider did (no API key
 * configured, by design), or a real call failed and this is the
 * deterministic fallback.
 */
export interface StructuredDiagnosis {
  headline: string;
  summary: string;
  rootCause: {
    concept: string;
    mastery: number;
    explanation: string;
    evidence: string[];
  } | null;
  applicationGaps: { concept: string; explanation: string }[];
  strengths: { concept: string; explanation: string }[];
  recommendations: string[];
  learningSequence: string[];
  confidenceInsight: string | null;
  source: "ai" | "mock" | "fallback";
}
