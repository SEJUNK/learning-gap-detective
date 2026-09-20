import type { ReactNode } from "react";
import "./SectionHeader.css";

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Header for a content section within a page (not the page itself — see PageHeader). */
export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div>
        <h2 className="section-header-title">{title}</h2>
        {description && <p className="section-header-description">{description}</p>}
      </div>
      {action}
    </div>
  );
}
