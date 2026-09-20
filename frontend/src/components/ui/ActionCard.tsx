import { Target, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "./Card";
import "./ActionCard.css";

interface ActionCardProps {
  eyebrow: string;
  title: string;
  rationale: string;
  actionLabel: string;
  route: string;
}

/** A single prominent "what to do next" panel — the dashboard's answer to "what should I do next?". */
export function ActionCard({ eyebrow, title, rationale, actionLabel, route }: ActionCardProps) {
  return (
    <Card className="action-card">
      <div className="action-card-icon">
        <Target size={20} strokeWidth={2.2} />
      </div>
      <div className="action-card-body">
        <span className="action-card-eyebrow">{eyebrow}</span>
        <h3 className="action-card-title">{title}</h3>
        <p className="action-card-rationale">{rationale}</p>
      </div>
      <Link to={route} className="action-card-cta">
        {actionLabel} <ArrowRight size={16} strokeWidth={2.4} />
      </Link>
    </Card>
  );
}
