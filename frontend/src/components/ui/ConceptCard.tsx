import type { KeyboardEvent } from "react";
import { GitBranch } from "lucide-react";
import { Card } from "./Card";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { GAP_STATUS_CONFIG, type GapStatus } from "../../constants/gapStatus";
import "./ConceptCard.css";

interface ConceptCardProps {
  name: string;
  description: string;
  mastery: number;
  status: GapStatus;
  isFoundational?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

/** A single concept's mastery + gap classification — the building block of the Learning Map. */
export function ConceptCard({ name, description, mastery, status, isFoundational, selected, onSelect }: ConceptCardProps) {
  const config = GAP_STATUS_CONFIG[status];
  const interactive = Boolean(onSelect);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  };

  return (
    <Card
      className={`concept-card${interactive ? " concept-card-interactive" : ""}${selected ? " concept-card-selected" : ""}`}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? selected : undefined}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
    >
      <div className="concept-card-header">
        <h3 className="concept-card-title">{name}</h3>
        <StatusBadge status={status} />
      </div>
      <p className="concept-card-description">{description}</p>
      {isFoundational && (
        <span className="concept-card-foundational">
          <GitBranch size={12} strokeWidth={2.4} />
          Foundational concept
        </span>
      )}
      <ProgressBar value={mastery} color={config.color} label={`${mastery}% mastery`} />
    </Card>
  );
}
