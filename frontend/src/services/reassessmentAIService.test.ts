import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./ai/aiProviderFactory", () => ({
  getAIProvider: vi.fn(),
}));

import { getAIProvider } from "./ai/aiProviderFactory";
import { getReassessmentReflection } from "./reassessmentAIService";
import { isValidReassessmentReflection } from "./ai/reassessmentReflectionValidator";
import type { ReassessmentResult } from "../types/reassessment";

function buildResult(overrides: Partial<ReassessmentResult> = {}): ReassessmentResult {
  return {
    reassessmentId: "reassessment-1",
    originalAssessmentId: "assessment-1",
    studentId: "student-1",
    completedAt: new Date().toISOString(),
    totalScore: 4,
    totalQuestions: 5,
    percentage: 80,
    conceptPerformance: { conditions: 85 },
    comparison: [{ concept: "conditions", conceptName: "Conditions", beforeScore: 48, afterScore: 85, difference: 37, status: "improved" }],
    rootGapComparison: { concept: "conditions", conceptName: "Conditions", beforeScore: 48, afterScore: 85, difference: 37, status: "improved" },
    applicationTransfer: null,
    overallImprovementTier: "closing",
    overallImprovementMessage: "Your learning gap is closing.",
    nextAction: { type: "advance_to_affected", title: "Move to Loops", rationale: "because", route: "/learning-path" },
    ...overrides,
  };
}

describe("getReassessmentReflection", () => {
  beforeEach(() => {
    vi.mocked(getAIProvider).mockReset();
  });

  it("returns the provider's reflection when the call succeeds", async () => {
    vi.mocked(getAIProvider).mockReturnValue({
      generateDiagnosis: vi.fn(),
      generateReassessmentReflection: vi.fn().mockResolvedValue({
        headline: "Custom headline",
        narrative: "Custom narrative describing the change.",
        source: "ai",
      }),
    });

    const reflection = await getReassessmentReflection(buildResult());

    expect(reflection.source).toBe("ai");
    expect(reflection.headline).toBe("Custom headline");
  });

  it("falls back to a deterministic, evidence-grounded reflection when the provider call fails", async () => {
    vi.mocked(getAIProvider).mockReturnValue({
      generateDiagnosis: vi.fn(),
      generateReassessmentReflection: vi.fn().mockRejectedValue(new Error("network error")),
    });

    const reflection = await getReassessmentReflection(buildResult());

    expect(reflection.source).toBe("fallback");
    expect(isValidReassessmentReflection(reflection)).toBe(true);
    expect(reflection.narrative.toLowerCase()).toContain("conditions");
  });

  it("falls back when the provider resolves with an invalid shape", async () => {
    vi.mocked(getAIProvider).mockReturnValue({
      generateDiagnosis: vi.fn(),
      generateReassessmentReflection: vi.fn().mockResolvedValue({ headline: "" }),
    });

    const reflection = await getReassessmentReflection(buildResult());

    expect(reflection.source).toBe("fallback");
    expect(isValidReassessmentReflection(reflection)).toBe(true);
  });

  it("never invents a concept or number not present in the input", async () => {
    vi.mocked(getAIProvider).mockReturnValue({
      generateDiagnosis: vi.fn(),
      generateReassessmentReflection: vi.fn().mockRejectedValue(new Error("boom")),
    });

    const reflection = await getReassessmentReflection(buildResult());

    expect(reflection.narrative).toContain("48%");
    expect(reflection.narrative).toContain("85%");
  });
});
