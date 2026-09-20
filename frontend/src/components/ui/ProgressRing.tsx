import "./Progress.css";

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export function ProgressRing({
  value,
  max = 100,
  size = 72,
  strokeWidth = 7,
  color = "var(--color-accent)",
  label,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="progress-ring" style={{ width: size, height: size }} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="progress-ring-fill"
        />
      </svg>
      <span className="progress-ring-value">{label ?? `${Math.round(percent)}%`}</span>
    </div>
  );
}
