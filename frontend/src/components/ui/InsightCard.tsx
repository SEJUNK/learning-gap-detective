import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "./Card";
import { GAP_STATUS_CONFIG, type GapStatus } from "../../constants/gapStatus";
import "./InsightCard.css";

interface InsightCardProps {
  title: string;
  description?: string;
  paragraphs?: string[];
  status?: GapStatus;
  eyebrow?: string;
  actionLabel?: string;
  actionRoute?: string;
}

/** An AI-generated explanation surfaced with a subtle severity accent — the AI explains, it never scores. */
export function InsightCard({ title, description, paragraphs, status, eyebrow, actionLabel, actionRoute }: InsightCardProps) {
  const config = status ? GAP_STATUS_CONFIG[status] : null;
  const Icon = config?.icon ?? Sparkles;

  return (
    <Card className="insight-card" style={{ borderLeft: `3px solid ${config?.color ?? "var(--color-accent)"}` }}>
      <div
        className="insight-card-icon"
        style={{ background: config?.softColor ?? "var(--color-accent-soft)", color: config?.color ?? "var(--color-accent)" }}
      >
        <Icon size={16} strokeWidth={2.2} />
      </div>
      <div className="insight-card-body">
        {eyebrow && <span className="insight-card-eyebrow">{eyebrow}</span>}
        <h3 className="insight-card-title">{title}</h3>
        {paragraphs
          ? paragraphs.map((paragraph, index) => (
              <p className="insight-card-description" key={index}>
                {paragraph}
              </p>
            ))
          : description && <p className="insight-card-description">{description}</p>}
        {actionLabel && actionRoute && (
          <Link to={actionRoute} className="insight-card-action">
            {actionLabel} <ArrowRight size={14} strokeWidth={2.4} />
          </Link>
        )}
      </div>
    </Card>
  );
}
