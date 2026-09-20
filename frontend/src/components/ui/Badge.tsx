import type { ReactNode } from "react";
import "./Badge.css";

interface BadgeProps {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
}

/** Generic pill label for counts/tags. For gap severity, use StatusBadge instead. */
export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
