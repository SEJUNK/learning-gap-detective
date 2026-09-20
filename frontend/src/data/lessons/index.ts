import type { ConceptId } from "../../types/assessment";
import type { Lesson } from "../../types/learningModule";
import { CONDITIONAL_LOGIC_LESSON } from "./conditionalLogicLesson";

/**
 * Lesson lookup by concept id. Adding a new concept's lesson is exactly
 * one new entry here plus one new content file — the module shell
 * (pages/LearningModule/) and every service that consumes a Lesson
 * never change.
 */
const LESSONS: Partial<Record<ConceptId, Lesson>> = {
  conditions: CONDITIONAL_LOGIC_LESSON,
};

export function getLesson(conceptId: string | undefined): Lesson | null {
  if (!conceptId) return null;
  return LESSONS[conceptId as ConceptId] ?? null;
}
