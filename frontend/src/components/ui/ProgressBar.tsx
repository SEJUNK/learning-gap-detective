import "./Progress.css";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  color?: string;
}

export function ProgressBar({ value, max = 100, label, color = "var(--color-accent)" }: ProgressBarProps) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className="progress-bar-wrap">
      {label && <span className="progress-bar-label">{label}</span>}
      <div className="progress-bar-track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <div className="progress-bar-fill" style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  );
}
