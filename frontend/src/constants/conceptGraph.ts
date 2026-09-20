import type { ConceptId } from "../types/assessment";

/**
 * The canonical Python concept prerequisite graph. This is the single
 * source of truth for "what depends on what" — the Diagnostic
 * Assessment's `prerequisiteConcepts` field is derived from it, and it
 * mirrors the same relationships already encoded in the dashboard's
 * `conceptMastery` mock data (kept as two hand-written sources today
 * since they serve different phases; unifying them into one shared
 * module is a good follow-up once a real backend owns this data).
 *
 * Chain: Variables → Data Types → Conditions → Loops → Functions → OOP.
 * Lists and Dictionaries support Functions. Exceptions associate with
 * Functions and application logic (error handling shows up once code
 * does something, not in isolation).
 */
export const CONCEPT_DISPLAY_NAMES: Record<ConceptId, string> = {
  variables: "Variables",
  data_types: "Data Types",
  conditions: "Conditions",
  loops: "Loops",
  functions: "Functions",
  lists: "Lists",
  dictionaries: "Dictionaries",
  exceptions: "Exceptions",
  oop: "Object-Oriented Programming",
};

export const CONCEPT_PREREQUISITES: Record<ConceptId, ConceptId[]> = {
  variables: [],
  data_types: ["variables"],
  conditions: ["variables", "data_types"],
  loops: ["conditions", "variables"],
  functions: ["loops", "conditions"],
  lists: ["data_types", "loops"],
  dictionaries: ["lists"],
  exceptions: ["functions"],
  oop: ["functions", "dictionaries"],
};

/**
 * Topologically groups concepts into levels (0 = no prerequisites,
 * each subsequent level = 1 + the deepest prerequisite's level) —
 * "foundational → dependent" order. Shared by the diagnosis screen's
 * Learning Gap Map (rendered as columns/rows) and the recovery path
 * generator (used to order supporting steps foundational-first).
 */
export function computeConceptLevels(graph: Record<string, ConceptId[]>): ConceptId[][] {
  const concepts = Object.keys(graph) as ConceptId[];
  const levelOf = new Map<ConceptId, number>();

  function resolve(concept: ConceptId, seen: Set<ConceptId>): number {
    if (levelOf.has(concept)) return levelOf.get(concept)!;
    if (seen.has(concept)) return 0; // guard against accidental cycles
    seen.add(concept);
    const prereqs = graph[concept] ?? [];
    const level = prereqs.length === 0 ? 0 : 1 + Math.max(...prereqs.map((p) => resolve(p, seen)));
    levelOf.set(concept, level);
    return level;
  }

  for (const concept of concepts) resolve(concept, new Set());

  const maxLevel = Math.max(0, ...Array.from(levelOf.values()));
  const levels: ConceptId[][] = Array.from({ length: maxLevel + 1 }, () => []);
  for (const [concept, level] of levelOf.entries()) levels[level].push(concept);
  return levels;
}

/** Flat concept → level-index map, convenient for sorting a list of concepts foundational-first. */
export function computeConceptLevelIndex(graph: Record<string, ConceptId[]>): Map<ConceptId, number> {
  const levels = computeConceptLevels(graph);
  const index = new Map<ConceptId, number>();
  levels.forEach((concepts, levelNumber) => concepts.forEach((concept) => index.set(concept, levelNumber)));
  return index;
}
