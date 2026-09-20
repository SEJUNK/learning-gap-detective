import { GAP_STATUS_CONFIG, type GapStatus } from "../../constants/gapStatus";
import "./Badge.css";

interface StatusBadgeProps {
  status: GapStatus;
}

/**
 * Renders a learning-gap severity as icon + label + color together, so
 * the status is never conveyed by color alone.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const config = GAP_STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span className="status-badge" style={{ background: config.softColor, color: config.color }} title={config.description}>
      <Icon size={14} strokeWidth={2.4} />
      {config.label}
    </span>
  );
}
