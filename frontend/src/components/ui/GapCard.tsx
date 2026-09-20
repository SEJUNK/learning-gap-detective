import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "./Card";
import { StatusBadge } from "./StatusBadge";
import { GAP_STATUS_CONFIG, type GapStatus } from "../../constants/gapStatus";
import "./GapCard.css";

interface GapCardProps {
  status: GapStatus;
  conceptName: string;
  mastery: number;
  explanation: string;
  actionLabel: string;
  route: string;
}

/** A diagnostic card for one detected learning gap: severity, mastery, plain-language explanation, and a next action. */
export function GapCard({ status, conceptName, mastery, explanation, actionLabel, route }: GapCardProps) {
  const config = GAP_STATUS_CONFIG[status];

  return (
    <Card className="gap-card" style={{ borderTop: `3px solid ${config.color}` }}>
      <StatusBadge status={status} />
      <h3 className="gap-card-title">{conceptName}</h3>
      <span className="gap-card-mastery" style={{ color: config.color }}>
        {mastery}% mastery
      </span>
      <p className="gap-card-explanation">{explanation}</p>
      <Link to={route} className="gap-card-action">
        {actionLabel} <ArrowRight size={14} strokeWidth={2.4} />
      </Link>
    </Card>
  );
}
