/**
 * Domain contracts shared with the backend (see backend/app/models).
 * These describe data shape only — no scoring/gap-detection logic lives
 * on the frontend; that stays server-side.
 */
export interface Concept {
  id: string;
  name: string;
  description: string;
  prerequisiteIds: string[];
}

export interface Subject {
  id: string;
  name: string;
  concepts: Concept[];
}
