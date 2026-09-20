import type { ConceptId } from "../types/assessment";
import type { DiagnosticEvidence } from "../types/diagnosis";
import type { LearningPath, LearningPathStep, LearningPathStepStatus, LearningPathStepType } from "../types/learningPath";
import { CONCEPT_DISPLAY_NAMES, computeConceptLevelIndex } from "../constants/conceptGraph";
import { MAX_SUPPORTING_STEPS, STEP_DURATION_MINUTES } from "../constants/learningPathConstants";

/**
 * Deterministic recovery-path generator. Input: DiagnosticEvidence
 * (Phase 4's output). Output: LearningPath. No LLM call anywhere in this
 * file — step order, prerequisites, and count are all decided here, by
 * rule, from the prerequisite graph and the diagnosed findings. An AI
 * layer may later reword `reason`/`objective`, but it never touches
 * ordering, duration, or status.
 *
 * The step-type descriptions below are the exact phrases the spec
 * defines for each type — used verbatim as `description`.
 */
const STEP_TYPE_DESCRIPTION: Record<LearningPathStepType, string> = {
  root_gap: "Fix the foundation.",
  concept_reinforcement: "Strengthen your understanding.",
  application: "Use the concept in a realistic problem.",
  challenge: "Prove you can apply what you learned.",
};

function name(concept: ConceptId): string {
  return CONCEPT_DISPLAY_NAMES[concept] ?? concept;
}

function objectiveFor(type: LearningPathStepType, concepts: ConceptId[]): string {
  const label = concepts.map(name).join(" and ");
  switch (type) {
    case "root_gap":
      return `Understand ${label}`;
    case "concept_reinforcement":
      return `Strengthen your ${label} reasoning`;
    case "application":
      return `Apply ${label} correctly in new problems`;
    case "challenge":
      return `Prove you can combine ${label}`;
  }
}

function makeStep(params: {
  order: number;
  type: LearningPathStepType;
  concept: ConceptId | null;
  title: string;
  reason: string;
  prerequisites: string[];
  objectiveConcepts: ConceptId[];
}): LearningPathStep {
  return {
    id: `step-${params.order}-${params.concept ?? "challenge"}`,
    order: params.order,
    type: params.type,
    concept: params.concept,
    title: params.title,
    description: STEP_TYPE_DESCRIPTION[params.type],
    reason: params.reason,
    objective: objectiveFor(params.type, params.objectiveConcepts),
    durationMinutes: STEP_DURATION_MINUTES[params.type],
    prerequisites: params.prerequisites,
    status: "locked", // finalized by computeStepStatuses before the path is returned
  };
}

function buildEmptyPath(evidence: DiagnosticEvidence, rationale: string): LearningPath {
  return {
    id: `path-${evidence.assessmentId}`,
    generatedAt: new Date().toISOString(),
    rootConcept: null,
    rootGapCount: 0,
    supportingGapCount: 0,
    steps: [],
    totalDurationMinutes: 0,
    timeBreakdown: { conceptLearningMinutes: 0, practiceMinutes: 0, challengeMinutes: 0 },
    expectedOutcomes: [],
    rationale,
  };
}

export function generateLearningPath(evidence: DiagnosticEvidence): LearningPath {
  const rootGap = evidence.rootGaps[0] ?? null;
  const conceptGap = rootGap ? null : evidence.conceptGaps[0] ?? null;
  const applicationGap = evidence.applicationGaps[0] ?? null;
  const primary = rootGap ?? conceptGap ?? applicationGap ?? null;

  if (!primary) {
    return buildEmptyPath(
      evidence,
      "Your assessment didn't surface a significant learning gap, so there's no remediation path to build right now.",
    );
  }

  const steps: LearningPathStep[] = [];
  const usedConcepts = new Set<ConceptId>();
  let order = 1;

  // Step 1: the primary finding — this is always where the path starts.
  const primaryType: LearningPathStepType = rootGap ? "root_gap" : conceptGap ? "concept_reinforcement" : "application";

  // Two distinct pieces of text, deliberately: `rationale` is the
  // macro "why this path" explanation (page-level, sets overall
  // expectations); `primary`'s step-level `reason` is the specific
  // evidence for why THIS step comes first — pulled from the finding's
  // own evidence bullets rather than restating the macro sentence, so
  // the "Why this path?" panel and the "Start Here" card never read as
  // the same paragraph twice.
  const primaryReason = rootGap
    ? `Your assessment suggests that ${name(rootGap.concept)} is affecting your performance in ${rootGap.affectedConcepts.map(name).join(" and ")}. We've placed it first because strengthening the prerequisite may make the later concepts easier.`
    : conceptGap
      ? `Your assessment shows a direct gap in ${name(conceptGap.concept)}, with no earlier concept explaining it — so we're starting there.`
      : `You understand ${name(applicationGap!.concept)} conceptually (${applicationGap!.conceptualAccuracy}% on conceptual questions), but applying it was harder (${applicationGap!.applicationAccuracy}%) — this step closes that gap directly.`;

  const primaryStepReason = primary.evidence[0] ?? primaryReason;

  const primaryStep = makeStep({
    order: order++,
    type: primaryType,
    concept: primary.concept,
    title: name(primary.concept),
    reason: primaryStepReason,
    prerequisites: [],
    objectiveConcepts: [primary.concept],
  });
  steps.push(primaryStep);
  usedConcepts.add(primary.concept);

  // Steps 2..N: supporting concepts. Only meaningful when the primary
  // finding is a root gap with known affected concepts — order them
  // foundational-first using the prerequisite graph, dedupe, and cap so
  // the path stays short (the product promise: shortest path to close
  // the gap, not a full curriculum).
  let previousStepId = primaryStep.id;

  if (rootGap && rootGap.affectedConcepts.length > 0) {
    const levelIndex = computeConceptLevelIndex(evidence.prerequisiteGraph);
    const orderedSupporting = [...rootGap.affectedConcepts]
      .filter((concept) => !usedConcepts.has(concept))
      .sort((a, b) => (levelIndex.get(a) ?? 0) - (levelIndex.get(b) ?? 0))
      .slice(0, MAX_SUPPORTING_STEPS);

    for (const concept of orderedSupporting) {
      const step = makeStep({
        order: order++,
        type: "concept_reinforcement",
        concept,
        title: name(concept),
        reason: `${name(concept)} depends on ${name(rootGap.concept)} — now that you've strengthened the prerequisite, this concept should be easier to apply.`,
        prerequisites: [previousStepId],
        objectiveConcepts: [concept],
      });
      steps.push(step);
      usedConcepts.add(concept);
      previousStepId = step.id;
    }
  }

  // Optionally fold in the top application gap, if its concept isn't
  // already covered and there's still room in the "shortest path" budget.
  if (applicationGap && !usedConcepts.has(applicationGap.concept) && steps.length < MAX_SUPPORTING_STEPS + 1) {
    const step = makeStep({
      order: order++,
      type: "application",
      concept: applicationGap.concept,
      title: name(applicationGap.concept),
      reason: `You understand ${name(applicationGap.concept)} conceptually (${applicationGap.conceptualAccuracy}% on conceptual questions), but application questions were harder (${applicationGap.applicationAccuracy}%) — this step focuses on using it in realistic problems.`,
      prerequisites: [previousStepId],
      objectiveConcepts: [applicationGap.concept],
    });
    steps.push(step);
    usedConcepts.add(applicationGap.concept);
    previousStepId = step.id;
  }

  // Final step: a combined challenge across everything covered above.
  const challengeConcepts = Array.from(usedConcepts);
  const challengeStep = makeStep({
    order: order++,
    type: "challenge",
    concept: null,
    title: "Application Challenge",
    reason: `A final combined problem that draws on ${challengeConcepts.map(name).join(", ")} — the best way to confirm the gap is actually closed.`,
    prerequisites: [previousStepId],
    objectiveConcepts: challengeConcepts,
  });
  steps.push(challengeStep);

  const finalizedSteps = computeStepStatuses(steps, new Set(), null);

  const conceptLearningMinutes = finalizedSteps
    .filter((s) => s.type === "root_gap" || s.type === "concept_reinforcement")
    .reduce((sum, s) => sum + s.durationMinutes, 0);
  const practiceMinutes = finalizedSteps.filter((s) => s.type === "application").reduce((sum, s) => sum + s.durationMinutes, 0);
  const challengeMinutes = finalizedSteps.filter((s) => s.type === "challenge").reduce((sum, s) => sum + s.durationMinutes, 0);

  return {
    id: `path-${evidence.assessmentId}`,
    generatedAt: new Date().toISOString(),
    rootConcept: primary.concept,
    rootGapCount: rootGap ? 1 : 0,
    supportingGapCount: steps.length - 1, // every step except the primary counts as "supporting" the fix
    steps: finalizedSteps,
    totalDurationMinutes: conceptLearningMinutes + practiceMinutes + challengeMinutes,
    timeBreakdown: { conceptLearningMinutes, practiceMinutes, challengeMinutes },
    expectedOutcomes: finalizedSteps.map((s) => s.objective),
    rationale: primaryReason,
  };
}

/**
 * Deterministic status computation, kept pure and separate from
 * generation so progress (loaded from localStorage) can be reapplied to
 * a freshly generated path without regenerating it. A step is:
 * - "completed" if its id is in completedIds
 * - "in_progress" if it's the id currently being worked on
 * - "available" if every prerequisite id is in completedIds
 * - "locked" otherwise
 */
export function computeStepStatuses(steps: LearningPathStep[], completedIds: Set<string>, inProgressId: string | null): LearningPathStep[] {
  return steps.map((step): LearningPathStep => {
    let status: LearningPathStepStatus;
    if (completedIds.has(step.id)) {
      status = "completed";
    } else if (step.id === inProgressId) {
      status = "in_progress";
    } else if (step.prerequisites.every((id) => completedIds.has(id))) {
      status = "available";
    } else {
      status = "locked";
    }
    return { ...step, status };
  });
}
