import { MOCK_DASHBOARD_DATA } from "../data/dashboardMockData";
import { getMasteryOverrides } from "./studentStateService";
import { STRONG_THRESHOLD } from "../constants/diagnosisThresholds";
import type { ConceptMastery, DashboardData } from "../types/dashboard";

/**
 * Mock-backed today, but async and typed exactly like a real API call so
 * swapping in `apiGet<DashboardData>("/dashboard")` later requires no
 * change to any component. No artificial delay is added — the promise
 * resolves on the next microtask, which is enough for components to
 * exercise their real loading state without a fake spinner-for-show.
 *
 * `studentStateService` is the single write path for "what has changed
 * since the seed data" — both the original assessment and a later
 * reassessment write mastery overrides there, and this function is the
 * only place they're merged onto the static mock, at read time. The
 * static mock object itself is never mutated, and no other module keeps
 * its own copy of "current mastery" — this is what keeps Dashboard,
 * Diagnosis, Recovery Path, and Reassessment from ever disagreeing about
 * the same concept's score.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const overrides = getMasteryOverrides();
  if (Object.keys(overrides).length === 0) return MOCK_DASHBOARD_DATA;

  const applyOverride = (mastery: number, override: { mastery: number } | undefined): number => override?.mastery ?? mastery;

  const conceptMastery: ConceptMastery[] = MOCK_DASHBOARD_DATA.conceptMastery.map((concept) => {
    const override = overrides[concept.id];
    if (!override) return concept;

    const promotedToStrength = override.mastery >= STRONG_THRESHOLD;
    // An original assessment carries a full status classification from
    // the real diagnostic engine (root/application/practice/strength) —
    // trust it directly. A reassessment override only ever proves ONE
    // concept crossed (or didn't cross) the strength line; anything below
    // that keeps its prior gap-type label, since a single before/after
    // number isn't enough context to safely reclassify *which kind* of
    // gap a concept still has — that judgment belongs to the diagnostic
    // engine, not this merge.
    const status = override.source === "assessment" && override.status ? override.status : promotedToStrength ? "strength" : concept.status;
    const recentPerformanceLabel = override.source === "assessment" ? "Updated after your diagnostic assessment" : "Updated after targeted reassessment";

    return { ...concept, mastery: override.mastery, status, recentPerformanceLabel };
  });

  const learningGaps = MOCK_DASHBOARD_DATA.learningGaps.map((gap) => {
    // The mock's LearningGap.conceptName ("Conditional Logic") doesn't
    // always match ConceptMastery.name ("Conditions") for the same
    // concept — a pre-existing naming inconsistency in the Phase 2 mock
    // data. gap.id reliably encodes the concept id itself ("gap-conditions"
    // -> "conditions"), so join on that instead of the display name.
    const conceptId = gap.id.replace(/^gap-/, "");
    const override = overrides[conceptId];
    if (!override) return gap;

    const matchingConcept = conceptMastery.find((c) => c.id === conceptId);
    return { ...gap, mastery: applyOverride(gap.mastery, override), status: matchingConcept?.status ?? gap.status };
  });

  // Aggregate cards (Learning Health) are derived from the same
  // per-concept numbers just merged above, never a separately hardcoded
  // total — so "12 strong concepts" and "4 gaps" can't drift out of sync
  // with what the concept list actually shows.
  const strongConceptsCount = conceptMastery.filter((c) => c.status === "strength").length;
  const gapsCount = conceptMastery.length - strongConceptsCount;
  const gapsNeedingAttention = conceptMastery.filter((c) => c.status === "root").length;
  const overallMastery = Math.round(conceptMastery.reduce((sum, c) => sum + c.mastery, 0) / conceptMastery.length);

  const learningHealth = {
    ...MOCK_DASHBOARD_DATA.learningHealth,
    overallMastery,
    strongConceptsCount,
    totalConceptsCount: conceptMastery.length,
    gapsCount,
    gapsNeedingAttention,
  };

  return { ...MOCK_DASHBOARD_DATA, learningHealth, conceptMastery, learningGaps };
}
