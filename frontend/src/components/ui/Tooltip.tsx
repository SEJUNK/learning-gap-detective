import { useId, useState, type ReactNode } from "react";
import "./Tooltip.css";

interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom";
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <span
      className="tooltip-wrap"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={visible ? id : undefined}>{children}</span>
      {visible && (
        <span role="tooltip" id={id} className={`tooltip tooltip-${side}`}>
          {content}
        </span>
      )}
    </span>
  );
}
