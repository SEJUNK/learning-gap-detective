import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "./Card";
import "./StatCard.css";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { direction: "up" | "down"; label: string };
  subLabel?: string;
  emphasis?: "warning" | "success";
}

export function StatCard({ label, value, icon: Icon, trend, subLabel, emphasis }: StatCardProps) {
  const TrendIcon = trend?.direction === "down" ? TrendingDown : TrendingUp;

  return (
    <Card className="stat-card">
      <div className="stat-card-icon">
        <Icon size={18} strokeWidth={2} />
      </div>
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-value">{value}</span>
      {trend && (
        <span className={`stat-card-trend stat-card-trend-${trend.direction}`}>
          <TrendIcon size={13} strokeWidth={2.4} />
          {trend.label}
        </span>
      )}
      {subLabel && <span className={`stat-card-sublabel${emphasis ? ` stat-card-sublabel-${emphasis}` : ""}`}>{subLabel}</span>}
    </Card>
  );
}
