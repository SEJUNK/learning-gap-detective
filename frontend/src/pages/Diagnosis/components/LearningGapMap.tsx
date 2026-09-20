import { useMemo, useState } from "react";
import { ArrowDown, ArrowRight, GitBranch, Link2 } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { GAP_STATUS_CONFIG, type GapStatus } from "../../../constants/gapStatus";
import { CONCEPT_DISPLAY_NAMES, computeConceptLevels } from "../../../constants/conceptGraph";
import { CRITICAL_GAP_THRESHOLD, STRONG_THRESHOLD } from "../../../constants/diagnosisThresholds";
import { useIsMobile } from "../../../hooks/useViewport";
import type { ConceptId } from "../../../types/assessment";
import "./LearningGapMap.css";

interface ConceptFindingSummary {
  status: GapStatus;
  evidence: string[];
}

interface LearningGapMapProps {
  conceptMastery: Record<string, number>;
  prerequisiteGraph: Record<string, ConceptId[]>;
  rootGapConcept: ConceptId | null;
  affectedConcepts: ConceptId[];
  findingsByConcept: Partial<Record<ConceptId, ConceptFindingSummary>>;
}

function deriveStatus(
  concept: ConceptId,
  mastery: number | undefined,
  rootGapConcept: ConceptId | null,
  affectedConcepts: ConceptId[],
  findingsByConcept: Partial<Record<ConceptId, ConceptFindingSummary>>,
): GapStatus | null {
  if (findingsByConcept[concept]) return findingsByConcept[concept]!.status;
  if (concept === rootGapConcept) return "root";
  if (affectedConcepts.includes(concept)) return "application";
  if (mastery === undefined) return null;
  if (mastery >= STRONG_THRESHOLD) return "strength";
  if (mastery < CRITICAL_GAP_THRESHOLD) return "practice";
  return null;
}

/**
 * Section 4 — the concept dependency visualization. Desktop renders
 * prerequisite levels as columns flowing left-to-right; mobile renders
 * the same levels stacked top-to-bottom — never the desktop graph
 * squeezed into a small viewport. Clicking any node shows its detail
 * (mastery, status, evidence, prerequisites, affected concepts) below.
 */
export function LearningGapMap({ conceptMastery, prerequisiteGraph, rootGapConcept, affectedConcepts, findingsByConcept }: LearningGapMapProps) {
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState<ConceptId | null>(rootGapConcept);
  const levels = useMemo(() => computeConceptLevels(prerequisiteGraph), [prerequisiteGraph]);

  const selectedConcept = selected;
  const selectedMastery = selectedConcept ? conceptMastery[selectedConcept] : undefined;
  const selectedStatus = selectedConcept
    ? deriveStatus(selectedConcept, selectedMastery, rootGapConcept, affectedConcepts, findingsByConcept)
    : null;
  const selectedPrereqs = selectedConcept ? prerequisiteGraph[selectedConcept] ?? [] : [];
  const selectedDependents = selectedConcept
    ? (Object.entries(prerequisiteGraph) as [string, ConceptId[]][])
        .filter(([, prereqs]) => prereqs.includes(selectedConcept))
        .map(([concept]) => concept as ConceptId)
    : [];

  const ArrowIcon = isMobile ? ArrowDown : ArrowRight;

  return (
    <section aria-labelledby="learning-map-heading">
      <SectionHeader title="Learning Gap Map" description="How concepts in this assessment build on each other." />
      <Card className="gap-map-card">
        <div className={`gap-map-flow${isMobile ? " gap-map-flow-vertical" : ""}`}>
          {levels.map((level, levelIndex) => (
            <div className="gap-map-level-group" key={levelIndex}>
              <div className="gap-map-level">
                {level.map((concept) => {
                  const mastery = conceptMastery[concept];
                  const status = deriveStatus(concept, mastery, rootGapConcept, affectedConcepts, findingsByConcept);
                  const config = status ? GAP_STATUS_CONFIG[status] : null;
                  const isSelected = selected === concept;

                  return (
                    <button
                      key={concept}
                      type="button"
                      className={`gap-map-node${isSelected ? " selected" : ""}${concept === rootGapConcept ? " is-root" : ""}`}
                      style={{ borderColor: config?.color ?? "var(--color-border-strong)" }}
                      onClick={() => setSelected(concept)}
                      aria-pressed={isSelected}
                    >
                      <span className="gap-map-node-name">{CONCEPT_DISPLAY_NAMES[concept]}</span>
                      <span className="gap-map-node-mastery" style={{ color: config?.color ?? "var(--color-text-secondary)" }}>
                        {mastery !== undefined ? `${mastery}%` : "—"}
                      </span>
                      {status && (
                        <span className="gap-map-node-dot" style={{ background: config!.color }} aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
              {levelIndex < levels.length - 1 && (
                <div className="gap-map-arrow" aria-hidden="true">
                  <ArrowIcon size={18} strokeWidth={2} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {selectedConcept && (
        <Card className="gap-map-detail">
          <div className="gap-map-detail-header">
            <div>
              <h3 className="gap-map-detail-title">{CONCEPT_DISPLAY_NAMES[selectedConcept]}</h3>
              {selectedStatus && <StatusBadge status={selectedStatus} />}
            </div>
            {selectedMastery !== undefined && (
              <span className="gap-map-detail-mastery" style={{ color: selectedStatus ? GAP_STATUS_CONFIG[selectedStatus].color : "var(--color-text-primary)" }}>
                {selectedMastery}%
              </span>
            )}
          </div>

          {selectedMastery !== undefined && (
            <ProgressBar value={selectedMastery} color={selectedStatus ? GAP_STATUS_CONFIG[selectedStatus].color : undefined} />
          )}

          {findingsByConcept[selectedConcept] && findingsByConcept[selectedConcept]!.evidence.length > 0 && (
            <ul className="gap-map-detail-evidence">
              {findingsByConcept[selectedConcept]!.evidence.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}

          <dl className="gap-map-detail-grid">
            <div>
              <dt>
                <Link2 size={13} strokeWidth={2.2} /> Prerequisites
              </dt>
              <dd>{selectedPrereqs.length > 0 ? selectedPrereqs.map((c) => CONCEPT_DISPLAY_NAMES[c]).join(", ") : "None — a starting concept"}</dd>
            </div>
            <div>
              <dt>
                <GitBranch size={13} strokeWidth={2.2} /> Affects
              </dt>
              <dd>{selectedDependents.length > 0 ? selectedDependents.map((c) => CONCEPT_DISPLAY_NAMES[c]).join(", ") : "No concepts in this assessment depend on it"}</dd>
            </div>
          </dl>
        </Card>
      )}
    </section>
  );
}
