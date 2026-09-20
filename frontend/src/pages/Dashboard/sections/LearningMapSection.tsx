import { useState } from "react";
import { GitBranch, Link2 } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { ConceptCard } from "../../../components/ui/ConceptCard";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { GAP_STATUS_CONFIG } from "../../../constants/gapStatus";
import type { ConceptMastery } from "../../../types/dashboard";
import "./LearningMapSection.css";

interface LearningMapSectionProps {
  concepts: ConceptMastery[];
}

const STATUS_DESCRIPTIONS: Record<string, string> = {
  variables: "Naming and storing values.",
  data_types: "int, float, str, bool and how Python represents values.",
  conditions: "Branching logic with if / elif / else.",
  loops: "Repeating logic with for and while.",
  functions: "Packaging reusable logic with def, parameters, and return values.",
  lists: "Ordered, mutable collections of values.",
  dictionaries: "Key-value collections for structured lookups.",
  exceptions: "Handling runtime errors with try / except.",
  oop: "Classes, objects, attributes, and methods.",
};

export function LearningMapSection({ concepts }: LearningMapSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = concepts.find((concept) => concept.id === selectedId) ?? null;

  const prerequisiteNames = (concept: ConceptMastery) =>
    concept.prerequisiteIds
      .map((id) => concepts.find((c) => c.id === id)?.name)
      .filter((name): name is string => Boolean(name));

  return (
    <section aria-labelledby="learning-map-heading">
      <SectionHeader title="Your Learning Map" description="Python — click any concept for detail." />
      <div className="learning-map-grid">
        {concepts.map((concept) => (
          <ConceptCard
            key={concept.id}
            name={concept.name}
            description={STATUS_DESCRIPTIONS[concept.id] ?? ""}
            mastery={concept.mastery}
            status={concept.status}
            isFoundational={concept.isFoundational}
            selected={selectedId === concept.id}
            onSelect={() => setSelectedId((current) => (current === concept.id ? null : concept.id))}
          />
        ))}
      </div>

      {selected && (
        <Card className="learning-map-detail">
          <div className="learning-map-detail-header">
            <div>
              <h3 className="learning-map-detail-title">{selected.name}</h3>
              <StatusBadge status={selected.status} />
            </div>
            <span className="learning-map-detail-mastery" style={{ color: GAP_STATUS_CONFIG[selected.status].color }}>
              {selected.mastery}%
            </span>
          </div>

          <ProgressBar value={selected.mastery} color={GAP_STATUS_CONFIG[selected.status].color} />

          <dl className="learning-map-detail-grid">
            <div>
              <dt>Recent performance</dt>
              <dd>{selected.recentPerformanceLabel}</dd>
            </div>
            <div>
              <dt>
                <Link2 size={13} strokeWidth={2.2} /> Prerequisites
              </dt>
              <dd>{prerequisiteNames(selected).length > 0 ? prerequisiteNames(selected).join(", ") : "None — this is a starting concept"}</dd>
            </div>
            <div>
              <dt>
                <GitBranch size={13} strokeWidth={2.2} /> Affects
              </dt>
              <dd>{selected.affectedConceptNames.length > 0 ? selected.affectedConceptNames.join(", ") : "No downstream concepts tracked yet"}</dd>
            </div>
          </dl>
        </Card>
      )}
    </section>
  );
}
