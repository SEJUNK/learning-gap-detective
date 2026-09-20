import { LogoMark } from "./LogoMark";
import "./Logo.css";

interface LogoProps {
  variant?: "full" | "compact";
}

/**
 * Full wordmark (mark + name) for expanded surfaces, or a compact
 * mark-only version for the collapsed sidebar and mobile header.
 */
export function Logo({ variant = "full" }: LogoProps) {
  if (variant === "compact") {
    return (
      <span className="logo logo-compact">
        <LogoMark size={28} />
      </span>
    );
  }

  return (
    <span className="logo logo-full">
      <LogoMark size={32} />
      <span className="logo-wordmark">
        <span className="logo-wordmark-line">Learning Gap</span>
        <span className="logo-wordmark-line logo-wordmark-accent">Detective</span>
      </span>
    </span>
  );
}
