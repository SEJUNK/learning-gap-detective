import { describe, expect, it } from "vitest";
import { generateLearningPath, computeStepStatuses } from "./learningPathService";
import type { DiagnosticEvidence } from "../types/diagnosis";
import type { ConceptId } from "../types/assessment";
import { CONCEPT_PREREQUISITES } from "../constants/conceptGraph";

function buildEvidence(overrides: Partial<DiagnosticEvidence>): DiagnosticEvidence {
  return {
    assessmentId: "assessment-test",
    studentId: "student-test",
    subject: "Python",
    overallScore: { totalScore: 6, totalQuestions: 12, percentage: 50 },
    conceptMasteryAverage: 50,
    conceptMastery: {},
    rootGaps: [],
    conceptGaps: [],
    applicationGaps: [],
    strengths: [],
    confidenceInsight: null,
    prerequisiteGraph: CONCEPT_PREREQUISITES,
    generatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("generateLearningPath", () => {
  it("1. one root gap: builds root step + ordered supporting steps + challenge", () => {
    const evidence = buildEvidence({
      rootGaps: [
        {
          type: "root_gap",
          concept: "conditions",
          mastery: 42,
          confidence: 0.8,
          affectedConcepts: ["loops", "functions"],
          evidence: ["evidence"],
        },
      ],
    });

    const path = generateLearningPath(evidence);

    expect(path.steps[0].type).toBe("root_gap");
    expect(path.steps[0].concept).toBe("conditions");
    expect(path.steps.at(-1)?.type).toBe("challenge");
    expect(path.rootConcept).toBe("conditions");
    expect(path.steps.length).toBeGreaterThanOrEqual(3);
    expect(path.steps.length).toBeLessThanOrEqual(5);
  });

  it("2. multiple root gaps: only the strongest (first) root gap anchors the path", () => {
    const evidence = buildEvidence({
      rootGaps: [
        { type: "root_gap", concept: "conditions", mastery: 30, confidence: 0.9, affectedConcepts: ["loops"], evidence: [] },
        { type: "root_gap", concept: "data_types", mastery: 45, confidence: 0.6, affectedConcepts: ["lists"], evidence: [] },
      ],
    });

    const path = generateLearningPath(evidence);

    expect(path.steps[0].concept).toBe("conditions");
    // The second root gap's concept should not silently vanish from consideration,
    // but the path stays anchored on the primary (first/strongest) finding.
    expect(path.rootConcept).toBe("conditions");
  });

  it("3. prerequisite chain: supporting steps are ordered foundational-first, not evidence-array order", () => {
    const evidence = buildEvidence({
      rootGaps: [
        {
          type: "root_gap",
          concept: "conditions",
          mastery: 40,
          confidence: 0.8,
          // Deliberately listed with the deeper concept first to prove the
          // generator reorders by the prerequisite graph, not input order.
          affectedConcepts: ["functions", "loops"],
          evidence: [],
        },
      ],
    });

    const path = generateLearningPath(evidence);
    const supportingConcepts = path.steps.filter((s) => s.type === "concept_reinforcement").map((s) => s.concept);

    // loops (level 3) comes before functions (level 4) in the prerequisite graph.
    expect(supportingConcepts.indexOf("loops")).toBeLessThan(supportingConcepts.indexOf("functions"));
  });

  it("4. duplicate concepts: a concept is never added to the path twice", () => {
    const evidence = buildEvidence({
      rootGaps: [
        { type: "root_gap", concept: "conditions", mastery: 40, confidence: 0.8, affectedConcepts: ["loops", "functions"], evidence: [] },
      ],
      applicationGaps: [
        { type: "application_gap", concept: "loops", conceptualAccuracy: 100, applicationAccuracy: 0, confidence: 0.6, evidence: [] },
      ],
    });

    const path = generateLearningPath(evidence);
    const concepts = path.steps.map((s) => s.concept).filter((c): c is ConceptId => c !== null);

    expect(new Set(concepts).size).toBe(concepts.length);
  });

  it("5. no gaps: returns an empty path with an honest rationale, not a fabricated curriculum", () => {
    const evidence = buildEvidence({ strengths: [{ type: "strength", concept: "variables", mastery: 100, evidence: [] }] });

    const path = generateLearningPath(evidence);

    expect(path.steps).toEqual([]);
    expect(path.rationale.length).toBeGreaterThan(0);
    expect(path.totalDurationMinutes).toBe(0);
  });

  it("6. strong student: many strengths and zero gaps still yields a clean empty path, no throw", () => {
    const evidence = buildEvidence({
      strengths: [
        { type: "strength", concept: "variables", mastery: 100, evidence: [] },
        { type: "strength", concept: "loops", mastery: 95, evidence: [] },
        { type: "strength", concept: "functions", mastery: 90, evidence: [] },
      ],
    });

    expect(() => generateLearningPath(evidence)).not.toThrow();
    expect(generateLearningPath(evidence).steps).toHaveLength(0);
  });

  it("7. missing diagnosis data: an evidence object with empty findings arrays does not throw", () => {
    const evidence = buildEvidence({});

    expect(() => generateLearningPath(evidence)).not.toThrow();
    const path = generateLearningPath(evidence);
    expect(path.steps).toEqual([]);
  });

  it("8. path ordering: step.order is sequential starting at 1", () => {
    const evidence = buildEvidence({
      rootGaps: [
        { type: "root_gap", concept: "conditions", mastery: 40, confidence: 0.8, affectedConcepts: ["loops", "functions"], evidence: [] },
      ],
    });

    const path = generateLearningPath(evidence);

    path.steps.forEach((step, index) => expect(step.order).toBe(index + 1));
  });

  it("keeps the path within the 3-5 step target even with many affected concepts", () => {
    const evidence = buildEvidence({
      rootGaps: [
        {
          type: "root_gap",
          concept: "variables",
          mastery: 30,
          confidence: 0.9,
          affectedConcepts: ["data_types", "conditions", "loops", "functions", "oop"],
          evidence: [],
        },
      ],
    });

    const path = generateLearningPath(evidence);

    expect(path.steps.length).toBeLessThanOrEqual(5);
  });

  it("application gap only (no root/concept gap) anchors the path on the application finding", () => {
    const evidence = buildEvidence({
      applicationGaps: [
        { type: "application_gap", concept: "functions", conceptualAccuracy: 100, applicationAccuracy: 0, confidence: 0.7, evidence: [] },
      ],
    });

    const path = generateLearningPath(evidence);

    expect(path.steps[0].type).toBe("application");
    expect(path.steps[0].concept).toBe("functions");
  });
});

describe("computeStepStatuses", () => {
  const steps = generateLearningPath(
    buildEvidence({
      rootGaps: [
        { type: "root_gap", concept: "conditions", mastery: 40, confidence: 0.8, affectedConcepts: ["loops", "functions"], evidence: [] },
      ],
    }),
  ).steps;

  it("9. correct step status: step 1 is available and every later step is locked with no progress", () => {
    const result = computeStepStatuses(steps, new Set(), null);

    expect(result[0].status).toBe("available");
    expect(result.slice(1).every((s) => s.status === "locked")).toBe(true);
  });

  it("10. step unlocking: completing step 1 makes step 2 available, later steps stay locked", () => {
    const afterStep1 = computeStepStatuses(steps, new Set([steps[0].id]), null);

    expect(afterStep1[0].status).toBe("completed");
    expect(afterStep1[1].status).toBe("available");
    expect(afterStep1.slice(2).every((s) => s.status === "locked")).toBe(true);
  });

  it("marks a step in_progress when it's the currently active step", () => {
    const result = computeStepStatuses(steps, new Set(), steps[0].id);

    expect(result[0].status).toBe("in_progress");
  });

  it("a step only becomes available once ALL of its prerequisites are completed", () => {
    // step[2] (if present) depends on step[1], which depends on step[0].
    if (steps.length < 3) return;
    const onlyFirstDone = computeStepStatuses(steps, new Set([steps[0].id]), null);
    expect(onlyFirstDone[2].status).toBe("locked");

    const firstTwoDone = computeStepStatuses(steps, new Set([steps[0].id, steps[1].id]), null);
    expect(firstTwoDone[2].status).toBe("available");
  });

  it("completing every step results in every step marked completed", () => {
    const allIds = new Set(steps.map((s) => s.id));
    const result = computeStepStatuses(steps, allIds, null);

    expect(result.every((s) => s.status === "completed")).toBe(true);
  });
});
