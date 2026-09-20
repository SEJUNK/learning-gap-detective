/** Centralized route paths. Add new feature routes here, not inline in JSX. */
export const ROUTES = {
  overview: "/",
  assessment: "/assessment",
  learningMap: "/learning-map",
  /** The personalized recovery path — was "/recovery-path" through Phase 4; renamed for Phase 5's real page. */
  recoveryPath: "/learning-path",
  progress: "/progress",
  aiInsights: "/insights",
  mistakePatterns: "/mistake-patterns",
  diagnosis: "/diagnosis",
  reassessment: "/reassessment",
  settings: "/settings",
  designSystem: "/design-system",
} as const;

/** Dynamic learning-module route builder — /learning/:conceptId. */
export function learningModuleRoute(conceptId: string): string {
  return `/learning/${conceptId}`;
}
export const LEARNING_MODULE_ROUTE_PATTERN = "/learning/:conceptId";
