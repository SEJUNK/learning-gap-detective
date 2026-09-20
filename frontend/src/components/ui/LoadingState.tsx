import { Loader2 } from "lucide-react";
import "./StateView.css";

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Loading…" }: LoadingStateProps) {
  return (
    <div className="state-view" role="status" aria-live="polite">
      <Loader2 className="state-view-spinner" size={28} />
      <span className="state-view-title">{label}</span>
    </div>
  );
}
