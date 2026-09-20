import { ROUTES } from "../routes/paths";
import type { DashboardData } from "../types/dashboard";

/**
 * Realistic synthetic data for the Student Intelligence Dashboard. Shaped
 * exactly like a future `GET /api/v1/dashboard` response so swapping this
 * module for a real fetch later is a one-line change in
 * `services/dashboardService.ts` — no component changes needed.
 */
export const MOCK_DASHBOARD_DATA: DashboardData = {
  studentProfile: {
    name: "Alex",
    lastAssessmentLabel: "Today",
  },

  learningHealth: {
    overallMastery: 68,
    overallMasteryDeltaLabel: "↑ 8% from last assessment",
    momentumLabel: "+14%",
    momentumDescription: "Improving steadily",
    strongConceptsCount: 12,
    totalConceptsCount: 20,
    gapsCount: 4,
    gapsNeedingAttention: 2,
  },

  conceptMastery: [
    {
      id: "variables",
      name: "Variables",
      mastery: 94,
      status: "strength",
      isFoundational: true,
      prerequisiteIds: [],
      recentPerformanceLabel: "8 of 8 correct on last attempt",
      affectedConceptNames: ["Data Types", "Conditions"],
    },
    {
      id: "data_types",
      name: "Data Types",
      mastery: 88,
      status: "strength",
      isFoundational: true,
      prerequisiteIds: ["variables"],
      recentPerformanceLabel: "7 of 8 correct on last attempt",
      affectedConceptNames: ["Conditions", "Lists"],
    },
    {
      id: "conditions",
      name: "Conditions",
      mastery: 48,
      status: "root",
      isFoundational: true,
      prerequisiteIds: ["data_types"],
      recentPerformanceLabel: "4 of 9 correct — compound conditions missed most",
      affectedConceptNames: ["Loops", "Functions", "Exceptions"],
    },
    {
      id: "loops",
      name: "Loops",
      mastery: 56,
      status: "practice",
      isFoundational: false,
      prerequisiteIds: ["conditions"],
      recentPerformanceLabel: "5 of 9 correct — inconsistent across attempts",
      affectedConceptNames: ["Lists", "Functions"],
    },
    {
      id: "functions",
      name: "Functions",
      mastery: 61,
      status: "application",
      isFoundational: false,
      prerequisiteIds: ["loops"],
      recentPerformanceLabel: "6 of 10 correct — struggles on unfamiliar problems",
      affectedConceptNames: ["Exceptions", "Object-Oriented Programming"],
    },
    {
      id: "lists",
      name: "Lists",
      mastery: 91,
      status: "strength",
      isFoundational: false,
      prerequisiteIds: ["data_types", "loops"],
      recentPerformanceLabel: "9 of 10 correct on last attempt",
      affectedConceptNames: ["Dictionaries"],
    },
    {
      id: "dictionaries",
      name: "Dictionaries",
      mastery: 79,
      status: "practice",
      isFoundational: false,
      prerequisiteIds: ["lists"],
      recentPerformanceLabel: "6 of 8 correct on last attempt",
      affectedConceptNames: ["Object-Oriented Programming"],
    },
    {
      id: "exceptions",
      name: "Exceptions",
      mastery: 66,
      status: "practice",
      isFoundational: false,
      prerequisiteIds: ["functions"],
      recentPerformanceLabel: "5 of 8 correct on last attempt",
      affectedConceptNames: [],
    },
    {
      id: "oop",
      name: "Object-Oriented Programming",
      mastery: 58,
      status: "application",
      isFoundational: false,
      prerequisiteIds: ["functions", "dictionaries"],
      recentPerformanceLabel: "5 of 9 correct — class design questions weakest",
      affectedConceptNames: [],
    },
  ],

  learningGaps: [
    {
      id: "gap-conditions",
      status: "root",
      conceptName: "Conditional Logic",
      mastery: 48,
      explanation:
        "Several mistakes across Loops and Functions appear to originate from difficulty with compound conditions.",
      actionLabel: "Investigate",
      route: ROUTES.diagnosis,
    },
    {
      id: "gap-functions",
      status: "application",
      conceptName: "Functions",
      mastery: 61,
      explanation: "You understand the syntax but struggle to apply functions in unfamiliar problems.",
      actionLabel: "Practice",
      route: ROUTES.recoveryPath,
    },
    {
      id: "gap-lists",
      status: "strength",
      conceptName: "Lists",
      mastery: 91,
      explanation: "Your performance is consistently strong across conceptual and application questions.",
      actionLabel: "View Evidence",
      route: ROUTES.learningMap,
    },
  ],

  aiInsight: {
    eyebrow: "Your biggest opportunity",
    paragraphs: [
      "Your Functions performance may not be the root problem.",
      "2 of your recent Function mistakes involved conditional logic inside functions.",
      "Strengthening Conditional Logic first could improve your performance across multiple concepts.",
    ],
    actionLabel: "View Full Diagnosis",
    route: ROUTES.diagnosis,
  },

  recoveryPath: [
    { id: "step-conditions", order: 1, title: "Conditional Logic", durationMinutes: 8, tag: "Root Gap", completed: true },
    { id: "step-loops", order: 2, title: "Loops", durationMinutes: 10, tag: "Application", completed: false },
    { id: "step-functions", order: 3, title: "Functions", durationMinutes: 12, tag: "Reinforcement", completed: false },
    { id: "step-challenge", order: 4, title: "Application Challenge", durationMinutes: 10, tag: "Challenge", completed: false },
  ],

  assessmentHistory: [
    { label: "Assessment 1", score: 52 },
    { label: "Assessment 2", score: 57 },
    { label: "Assessment 3", score: 62 },
    { label: "Assessment 4", score: 68 },
  ],

  recentActivity: [
    { id: "activity-1", description: "Completed Python Diagnostic", timeLabel: "2 hours ago" },
    { id: "activity-2", description: "Completed Conditional Logic practice", timeLabel: "Yesterday" },
    { id: "activity-3", description: "Improved Functions mastery", timeLabel: "2 days ago" },
  ],

  nextBestAction: {
    title: "Strengthen Conditional Logic",
    rationale: "Improving this prerequisite may positively affect your Loop and Function performance.",
    actionLabel: "Start 8-minute recovery",
    durationMinutes: 8,
    route: ROUTES.recoveryPath,
  },
};
