import { useEffect } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import "./CompletionTransition.css";

interface CompletionTransitionProps {
  onDone: () => void;
}

const TRANSITION_MS = 1800;

/**
 * The deliberate interstitial between submission and the (future)
 * diagnosis screen. This is intentional product UX the spec asked for
 * explicitly — not a fake loading delay standing in for real work, since
 * scoring/evidence generation already completed synchronously before
 * this screen renders.
 */
export function CompletionTransition({ onDone }: CompletionTransitionProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="completion-transition">
      <CheckCircle2 size={48} strokeWidth={1.75} className="completion-transition-check" />
      <h1 className="completion-transition-title">Assessment complete.</h1>
      <p className="completion-transition-subtitle">
        <Loader2 size={16} strokeWidth={2.2} className="completion-transition-spinner" />
        Analyzing your learning patterns…
      </p>
    </div>
  );
}
