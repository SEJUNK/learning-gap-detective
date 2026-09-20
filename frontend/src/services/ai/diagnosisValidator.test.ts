import { describe, expect, it } from "vitest";
import { isValidStructuredDiagnosis } from "./diagnosisValidator";
import type { StructuredDiagnosis } from "../../types/aiDiagnosis";

const VALID: StructuredDiagnosis = {
  headline: "Your main learning gap is Conditions",
  summary: "Evidence suggests a prerequisite weakness.",
  rootCause: {
    concept: "Conditions",
    mastery: 42,
    explanation: "Explanation text.",
    evidence: ["3 related mistakes"],
  },
  applicationGaps: [{ concept: "Functions", explanation: "text" }],
  strengths: [{ concept: "Lists", explanation: "text" }],
  recommendations: ["Strengthen Conditions first."],
  learningSequence: ["Conditions", "Loops"],
  confidenceInsight: null,
  source: "ai",
};

describe("isValidStructuredDiagnosis", () => {
  it("accepts a well-formed diagnosis", () => {
    expect(isValidStructuredDiagnosis(VALID)).toBe(true);
  });

  it("accepts a well-formed diagnosis with rootCause: null", () => {
    expect(isValidStructuredDiagnosis({ ...VALID, rootCause: null })).toBe(true);
  });

  it("rejects null and non-objects", () => {
    expect(isValidStructuredDiagnosis(null)).toBe(false);
    expect(isValidStructuredDiagnosis(undefined)).toBe(false);
    expect(isValidStructuredDiagnosis("a diagnosis")).toBe(false);
    expect(isValidStructuredDiagnosis(42)).toBe(false);
  });

  it("rejects a missing headline", () => {
    const { headline, ...rest } = VALID;
    expect(isValidStructuredDiagnosis(rest)).toBe(false);
  });

  it("rejects an empty headline", () => {
    expect(isValidStructuredDiagnosis({ ...VALID, headline: "" })).toBe(false);
  });

  it("rejects a non-array recommendations field", () => {
    expect(isValidStructuredDiagnosis({ ...VALID, recommendations: "Strengthen Conditions" })).toBe(false);
  });

  it("rejects an invalid source value", () => {
    expect(isValidStructuredDiagnosis({ ...VALID, source: "chatgpt" })).toBe(false);
  });

  it("rejects a rootCause missing required fields", () => {
    expect(isValidStructuredDiagnosis({ ...VALID, rootCause: { concept: "Conditions" } })).toBe(false);
  });

  it("rejects a confidenceInsight that is neither string nor null", () => {
    expect(isValidStructuredDiagnosis({ ...VALID, confidenceInsight: 42 })).toBe(false);
  });
});
