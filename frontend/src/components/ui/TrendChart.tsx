import { useId } from "react";
import "./TrendChart.css";

interface TrendChartProps {
  points: { label: string; score: number }[];
  color?: string;
}

const WIDTH = 320;
const HEIGHT = 120;
const PADDING = 16;

/**
 * A small, deliberately simple inline-SVG line/area chart — no charting
 * library. The area fill and dots render immediately (never gated behind
 * an animation); only the line's draw-in is animated as a decorative
 * flourish, and respects prefers-reduced-motion via tokens.css.
 */
export function TrendChart({ points, color = "var(--color-accent)" }: TrendChartProps) {
  const gradientId = useId();
  const max = Math.max(...points.map((p) => p.score), 100);
  const min = Math.min(...points.map((p) => p.score), 0);
  const range = max - min || 1;
  const step = (WIDTH - PADDING * 2) / (points.length - 1 || 1);

  const coords = points.map((point, index) => ({
    x: PADDING + step * index,
    y: PADDING + (1 - (point.score - min) / range) * (HEIGHT - PADDING * 2),
    ...point,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${HEIGHT - PADDING} L ${coords[0].x} ${HEIGHT - PADDING} Z`;

  return (
    <div className="trend-chart">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="trend-chart-svg" role="img" aria-label="Mastery trend across recent assessments">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="trend-chart-line" />
        {coords.map((c) => (
          <circle key={c.label} cx={c.x} cy={c.y} r="3.5" fill="var(--color-surface)" stroke={color} strokeWidth="2" />
        ))}
      </svg>
      <div className="trend-chart-labels">
        {points.map((point) => (
          <div className="trend-chart-label" key={point.label}>
            <span className="trend-chart-label-score">{point.score}%</span>
            <span className="trend-chart-label-text">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
