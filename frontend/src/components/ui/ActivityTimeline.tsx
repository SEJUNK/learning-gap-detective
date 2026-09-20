import { CheckCircle2 } from "lucide-react";
import "./ActivityTimeline.css";

interface ActivityTimelineProps {
  items: { id: string; description: string; timeLabel: string }[];
}

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  return (
    <ul className="activity-timeline">
      {items.map((item) => (
        <li className="activity-timeline-item" key={item.id}>
          <CheckCircle2 size={16} strokeWidth={2.2} className="activity-timeline-icon" />
          <div className="activity-timeline-text">
            <span className="activity-timeline-description">{item.description}</span>
            <span className="activity-timeline-time">{item.timeLabel}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
