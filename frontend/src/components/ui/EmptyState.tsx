import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import "./StateView.css";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="state-view">
      <span className="state-view-icon">
        <Icon size={22} strokeWidth={2} />
      </span>
      <span className="state-view-title">{title}</span>
      {description && <span className="state-view-description">{description}</span>}
      {action}
    </div>
  );
}
