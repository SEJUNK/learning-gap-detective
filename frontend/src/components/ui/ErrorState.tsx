import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import "./StateView.css";

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function ErrorState({ title = "Something went wrong", description, action }: ErrorStateProps) {
  return (
    <div className="state-view" role="alert">
      <span className="state-view-icon state-view-icon-error">
        <AlertCircle size={22} strokeWidth={2} />
      </span>
      <span className="state-view-title">{title}</span>
      {description && <span className="state-view-description">{description}</span>}
      {action}
    </div>
  );
}
