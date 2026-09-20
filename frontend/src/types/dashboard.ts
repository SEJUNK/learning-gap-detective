import type { GapStatus } from "../constants/gapStatus";

/** Typed contracts for the Student Intelligence Dashboard. Mock-backed today; shaped to match a future API response 1:1. */

export interface StudentProfile {
  name: string;
  lastAssessmentLabel: string;
}

export interface LearningHealth {
  overallMastery: number;
  overallMasteryDeltaLabel: string;
  momentumLabel: string;
  momentumDescription: string;
  strongConceptsCount: number;
  totalConceptsCount: number;
  gapsCount: number;
  gapsNeedingAttention: number;
}

export interface ConceptMastery {
  id: string;
  name: string;
  mastery: number;
  status: GapStatus;
  isFoundational: boolean;
  prerequisiteIds: string[];
  recentPerformanceLabel: string;
  affectedConceptNames: string[];
}

export interface LearningGap {
  id: string;
  status: GapStatus;
  conceptName: string;
  mastery: number;
  explanation: string;
  actionLabel: string;
  route: string;
}

export interface AiInsight {
  eyebrow: string;
  paragraphs: string[];
  actionLabel: string;
  route: string;
}

export interface RecoveryStep {
  id: string;
  order: number;
  title: string;
  durationMinutes: number;
  tag: string;
  completed: boolean;
}

export interface AssessmentHistoryPoint {
  label: string;
  score: number;
}

export interface RecentActivityItem {
  id: string;
  description: string;
  timeLabel: string;
}

export interface NextBestAction {
  title: string;
  rationale: string;
  actionLabel: string;
  durationMinutes: number;
  route: string;
}

export interface DashboardData {
  studentProfile: StudentProfile;
  learningHealth: LearningHealth;
  conceptMastery: ConceptMastery[];
  learningGaps: LearningGap[];
  aiInsight: AiInsight;
  recoveryPath: RecoveryStep[];
  assessmentHistory: AssessmentHistoryPoint[];
  recentActivity: RecentActivityItem[];
  nextBestAction: NextBestAction;
}
