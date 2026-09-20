import {
  LayoutGrid,
  ClipboardCheck,
  Map,
  Route as RouteIcon,
  TrendingUp,
  Sparkles,
  AlertCircle,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "../routes/paths";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface NavSection {
  label: string | null;
  items: NavItem[];
}

/**
 * Single source of truth for desktop sidebar navigation, grouped into the
 * sections the sidebar renders (MAIN / INSIGHTS / unlabeled bottom group).
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Main",
    items: [
      { label: "Overview", path: ROUTES.overview, icon: LayoutGrid },
      { label: "Diagnostic Assessment", path: ROUTES.assessment, icon: ClipboardCheck },
      { label: "Learning Map", path: ROUTES.learningMap, icon: Map },
      { label: "Recovery Path", path: ROUTES.recoveryPath, icon: RouteIcon },
      { label: "Progress", path: ROUTES.progress, icon: TrendingUp },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "AI Insights", path: ROUTES.aiInsights, icon: Sparkles },
      { label: "Mistake Patterns", path: ROUTES.mistakePatterns, icon: AlertCircle },
    ],
  },
  {
    label: null,
    items: [{ label: "Settings", path: ROUTES.settings, icon: Settings }],
  },
];

/**
 * Mobile keeps only the five primary destinations — secondary nav
 * (Insights, Settings) is reachable from within those screens instead of
 * competing for space in the bottom bar.
 */
export const MOBILE_NAV_ITEMS: NavItem[] = [
  { label: "Home", path: ROUTES.overview, icon: LayoutGrid },
  { label: "Assess", path: ROUTES.assessment, icon: ClipboardCheck },
  { label: "Map", path: ROUTES.learningMap, icon: Map },
  { label: "Path", path: ROUTES.recoveryPath, icon: RouteIcon },
  { label: "Progress", path: ROUTES.progress, icon: TrendingUp },
];
