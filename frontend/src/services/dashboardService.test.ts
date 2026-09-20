import { afterEach, describe, expect, it } from "vitest";
import { getDashboardData } from "./dashboardService";
import { applyReassessmentResult } from "./studentStateService";
import { MOCK_DASHBOARD_DATA } from "../data/dashboardMockData";
import type { ReassessmentResult } from "../types/reassessment";

// This suite runs in Vitest's default Node environment (no jsdom), which
// has no `localStorage` — a minimal in-memory polyfill is simpler than
// pulling in a full DOM environment dependency for one test file.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}
(globalThis as unknown as { localStorage: MemoryStorage }).localStorage = new MemoryStorage();

function buildResult(comparison: ReassessmentResult["comparison"]): ReassessmentResult {
  return {
    reassessmentId: "reassessment-1",
    originalAssessmentId: "assessment-1",
    studentId: "student-1",
    completedAt: new Date().toISOString(),
    totalScore: comparison.length,
    totalQuestions: comparison.length,
    percentage: 100,
    conceptPerformance: {},
    comparison,
    rootGapComparison: comparison[0] ?? null,
    applicationTransfer: null,
    overallImprovementTier: "closing",
    overallImprovementMessage: "Your learning gap is closing.",
    nextAction: { type: "advance_to_affected", title: "Move to Loops", rationale: "because", route: "/learning-path" },
  };
}

describe("dashboardService with reassessment overrides", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("returns the untouched mock when no reassessment has ever run", async () => {
    const data = await getDashboardData();
    expect(data).toEqual(MOCK_DASHBOARD_DATA);
  });

  it("updates a concept's dashboard mastery after a reassessment targets it", async () => {
    applyReassessmentResult(
      buildResult([{ concept: "conditions", conceptName: "Conditions", beforeScore: 48, afterScore: 82, difference: 34, status: "improved" }]),
    );

    const data = await getDashboardData();
    const conditions = data.conceptMastery.find((c) => c.id === "conditions");

    expect(conditions?.mastery).toBe(82);
    expect(conditions?.recentPerformanceLabel).toBe("Updated after targeted reassessment");
  });

  it("relabels a concept as a strength once its mastery crosses the strong threshold", async () => {
    applyReassessmentResult(
      buildResult([{ concept: "conditions", conceptName: "Conditions", beforeScore: 48, afterScore: 90, difference: 42, status: "improved" }]),
    );

    const data = await getDashboardData();
    const conditions = data.conceptMastery.find((c) => c.id === "conditions");

    expect(conditions?.status).toBe("strength");
  });

  it("keeps the original gap label when the new mastery hasn't reached strength yet", async () => {
    applyReassessmentResult(
      buildResult([{ concept: "conditions", conceptName: "Conditions", beforeScore: 48, afterScore: 65, difference: 17, status: "still_developing" }]),
    );

    const data = await getDashboardData();
    const conditions = data.conceptMastery.find((c) => c.id === "conditions");

    expect(conditions?.status).toBe("root"); // unchanged from the mock's original label
    expect(conditions?.mastery).toBe(65);
  });

  it("also updates the matching entry in the Detected Learning Gaps list", async () => {
    applyReassessmentResult(
      buildResult([{ concept: "conditions", conceptName: "Conditions", beforeScore: 48, afterScore: 82, difference: 34, status: "improved" }]),
    );

    const data = await getDashboardData();
    // Note: the mock's LearningGap.conceptName ("Conditional Logic") differs
    // from ConceptMastery.name ("Conditions") for the same concept — find by id instead.
    const gap = data.learningGaps.find((g) => g.id === "gap-conditions");

    expect(gap?.mastery).toBe(82);
  });

  it("leaves untargeted concepts completely unchanged", async () => {
    applyReassessmentResult(
      buildResult([{ concept: "conditions", conceptName: "Conditions", beforeScore: 48, afterScore: 82, difference: 34, status: "improved" }]),
    );

    const data = await getDashboardData();
    const lists = data.conceptMastery.find((c) => c.id === "lists");

    expect(lists).toEqual(MOCK_DASHBOARD_DATA.conceptMastery.find((c) => c.id === "lists"));
  });
});
