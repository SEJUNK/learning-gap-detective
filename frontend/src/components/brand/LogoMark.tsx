import { Search, GraduationCap } from "lucide-react";
import "./LogoMark.css";

interface LogoMarkProps {
  size?: number;
}

/**
 * The brand mark: a magnifying glass (diagnosis) with a small
 * graduation-cap badge (learning) docked at its corner. Built entirely
 * from Lucide icons layered in CSS — no custom SVG artwork.
 */
export function LogoMark({ size = 32 }: LogoMarkProps) {
  return (
    <span className="logo-mark" style={{ width: size, height: size }} aria-hidden="true">
      <Search size={Math.round(size * 0.58)} strokeWidth={2.4} />
      <span className="logo-mark-badge" style={{ width: size * 0.44, height: size * 0.44 }}>
        <GraduationCap size={Math.round(size * 0.28)} strokeWidth={2.4} />
      </span>
    </span>
  );
}
