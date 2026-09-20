import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import "./IconButton.css";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  variant?: "ghost" | "surface";
  size?: number;
}

/** Icon-only button. `label` is required and becomes the aria-label — there is no silent icon-only control. */
export function IconButton({ icon: Icon, label, variant = "ghost", size = 18, className = "", ...rest }: IconButtonProps) {
  return (
    <button type="button" className={`icon-btn icon-btn-${variant} ${className}`.trim()} aria-label={label} {...rest}>
      <Icon size={size} strokeWidth={2} />
    </button>
  );
}
