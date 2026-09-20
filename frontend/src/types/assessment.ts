/**
 * Diagnostic Assessment data model. This is the evidence pipeline's
 * foundation: Question + Response → ScoringResult → AssessmentEvidence.
 * Nothing here calls an LLM — every value is deterministic.
 */

export type Difficulty = "easy" | "medium" | "hard";

export type QuestionType = "conceptual" | "code_output" | "debugging" | "application" | "reasoning";

export type ConfidenceLevel = "guessing" | "somewhat_confident" | "very_confident";

/** Concept id — matches the ids used by the dashboard's concept graph (see constants/conceptGraph.ts). */
export type ConceptId =
  | "variables"
  | "data_types"
  | "conditions"
  | "loops"
  | "functions"
  | "lists"
  | "dictionaries"
  | "exceptions"
  | "oop";

export interface AssessmentQuestion {
  id: string;
  question: string;
  /** Optional code block shown in a distinct monospace panel below the question text. */
  codeSnippet?: string;
  concept: ConceptId;
  /** Concepts this question implicitly draws on — never shown to the student, only used as diagnostic evidence. */
  prerequisiteConcepts: ConceptId[];
  difficulty: Difficulty;
  questionType: QuestionType;
  options: string[];
  /** Index into `options`. */
  correctAnswer: number;
  explanation: string;
  points: number;
}

export interface AssessmentResponse {
  questionId: string;
  selectedAnswer: number | null;
  isAnswered: boolean;
  confidence: ConfidenceLevel | null;
  /** Seconds spent on this question. */
  timeSpent: number;
}

export interface AssessmentState {
  assessmentId: string;
  studentId: string;
  subject: string;
  startedAt: string;
  completedAt: string | null;
  currentQuestionIndex: number;
  responses: Record<string, AssessmentResponse>;
}

// ---- Scoring ----------------------------------------------------------

export interface QuestionResult {
  questionId: string;
  concept: ConceptId;
  difficulty: Difficulty;
  isAnswered: boolean;
  isCorrect: boolean;
  confidence: ConfidenceLevel | null;
}

export interface ConfidencePatterns {
  highConfidenceCorrect: number;
  highConfidenceIncorrect: number;
  lowConfidenceCorrect: number;
  lowConfidenceIncorrect: number;
  /** Answered but no confidence rating was given. */
  unrated: number;
}

export interface ScoringResult {
  totalScore: number;
  totalQuestions: number;
  percentage: number;
  answeredCount: number;
  unansweredCount: number;
  conceptPerformance: Record<string, number>;
  difficultyPerformance: Partial<Record<Difficulty, number>>;
  questionResults: QuestionResult[];
  confidencePatterns: ConfidencePatterns;
}

// ---- Diagnostic evidence -----------------------------------------------

export interface EvidenceQuestion {
  questionId: string;
  question: string;
  concept: ConceptId;
  prerequisiteConcepts: ConceptId[];
  difficulty: Difficulty;
  questionType: QuestionType;
  selectedAnswer: number | null;
  correctAnswer: number;
  explanation: string;
  confidence: ConfidenceLevel | null;
  timeSpent: number;
}

/**
 * The structured record handed to the (future) AI diagnosis engine. This
 * phase only produces it — nothing here calls an LLM or infers a root
 * cause; that's the next phase, built entirely from this object.
 */
export interface AssessmentEvidence {
  assessmentId: string;
  studentId: string;
  subject: string;
  startedAt: string;
  completedAt: string;
  overallScore: {
    totalScore: number;
    totalQuestions: number;
    percentage: number;
  };
  conceptScores: Record<string, number>;
  difficultyPerformance: Partial<Record<Difficulty, number>>;
  correctQuestions: EvidenceQuestion[];
  incorrectQuestions: EvidenceQuestion[];
  unansweredQuestions: EvidenceQuestion[];
  confidencePatterns: ConfidencePatterns;
  /** concept → the prerequisite concepts this question set associated with it. */
  prerequisiteRelationships: Record<string, ConceptId[]>;
  generatedAt: string;
}
