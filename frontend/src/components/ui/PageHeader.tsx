import type { ReactNode } from "react";
import "./PageHeader.css";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Page-level header: the largest heading on a screen, sits above all section content. */
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-header-title">{title}</h1>
        {description && <p className="page-header-description">{description}</p>}
      </div>
      {action}
    </div>
  );
}
