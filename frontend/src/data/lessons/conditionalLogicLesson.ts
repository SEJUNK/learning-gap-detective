import type { Lesson } from "../../types/learningModule";

/**
 * The first demonstration lesson. Manually reviewed (matching the data-
 * quality bar set in Phase 3's question bank): every interactive
 * question has exactly one unambiguous correct answer, and every
 * distractor represents a distinct, real misconception rather than a
 * throwaway wrong option.
 *
 * One thing worth documenting: an early draft of the application
 * challenge had two options that were *logically identical* in Python
 * (`a and b or c` parses the same as `(a and b) or c`, since `and`
 * binds tighter than `or`) — caught during review and fixed by making
 * the unparenthesized form the single correct option and redesigning
 * the distractors around genuinely different (wrong) groupings/logic,
 * rather than a precedence trivia trap.
 */
export const CONDITIONAL_LOGIC_LESSON: Lesson = {
  conceptId: "conditions",
  title: "Conditional Logic",
  estimatedMinutes: 8,
  objective: "Correctly combine conditions with and/or so compound rules behave the way you intend.",

  explanation: {
    intro:
      "Conditional logic lets your program make decisions using boolean expressions — expressions that evaluate to True or False.",
    bullets: [
      "Comparison operators (==, !=, >, <, >=, <=) always produce True or False.",
      "and requires every joined condition to be True.",
      "or requires at least one joined condition to be True.",
      "not flips True to False and False to True.",
      "You can combine multiple conditions to express real-world rules.",
    ],
    example: {
      code: "if age >= 18 and has_id:\n    allow_entry()",
      highlightLines: [1],
      explanation:
        "Both age >= 18 and has_id must be True at the same time for allow_entry() to run. If either one is False, the whole condition is False.",
    },
  },

  workedExample: {
    scenario: "A customer receives a discount if they are a premium member AND their order exceeds ₹5,000.",
    setupCode: "premium_member = True\norder_total = 6500",
    solutionCode: "if premium_member and order_total > 5000:\n    discount = 20",
    solutionHighlightLines: [1],
    steps: [
      "premium_member is True.",
      "order_total > 5000 → 6500 > 5000 → True.",
      "Both sides of and are True, so the whole condition is True.",
      "discount is set to 20.",
    ],
  },

  practiceQuestions: [
    {
      id: "practice-1-conceptual",
      question: "What does and require to make a compound condition True?",
      options: [
        "Only one of the conditions needs to be True",
        "Every condition must be True",
        "The conditions must be equal to each other",
        "At least one condition must be False",
      ],
      correctAnswer: 1,
      correctFeedback: "Exactly — and only produces True when every joined condition is True.",
      misconceptionFeedback: {
        0: "Almost there. You treated and as if either condition could be true. With and, both conditions must be satisfied — that behavior belongs to or, not and.",
        2: "Not quite. and doesn't compare the conditions to each other — it just requires both to independently be True.",
        3: "Not quite. If a condition is False, and immediately makes the whole expression False — the opposite of what's needed here.",
      },
    },
    {
      id: "practice-2-code-output",
      question: "What will this print?",
      codeSnippet: "x = 7\nprint(x > 5 and x < 10)",
      options: ["True", "False", "7", "Error"],
      correctAnswer: 0,
      correctFeedback: "Right — 7 > 5 is True and 7 < 10 is True, so and of two Trues is True.",
      misconceptionFeedback: {
        1: "Almost there. Check each side separately: is 7 > 5? Is 7 < 10? Both are True, so and gives True overall.",
        2: "Not quite — comparisons like x > 5 always evaluate to True or False, never to the number itself.",
        3: "Not quite — this is valid Python. Nothing here raises an error.",
      },
    },
    {
      id: "practice-3-application",
      question: "A student passes a course if their score is at least 60 AND they attended at least 80% of classes. Which condition is correct?",
      options: [
        "score >= 60 or attendance >= 80",
        "score >= 60 and attendance >= 80",
        "score >= 60 and attendance <= 80",
        "score == 60 and attendance == 80",
      ],
      correctAnswer: 1,
      correctFeedback: "Correct — both requirements must hold at once, so and with >= on each is right.",
      misconceptionFeedback: {
        0: "Almost there. You used or, which would pass a student who meets only one requirement. The rule needs both, so and is what's needed.",
        2: "Not quite — attendance needs to be at least 80%, not at most, so this version would pass students who barely showed up.",
        3: "Not quite — == requires an exact match. A score of 95 wouldn't pass this check, which isn't the intended rule.",
      },
    },
  ],

  adaptiveReinforcement:
    "Quick reinforcement before the next question: and is satisfied only when every single condition joined by it is True — if even one is False, the whole expression is False. Think of it as a checklist where every box must be checked, not just one.",

  applicationChallenge: {
    id: "application-challenge",
    scenario:
      "A delivery company gives priority delivery when: the customer is a premium member AND their order value is over ₹5,000 — OR the customer has an emergency flag set. Which condition correctly implements this rule?",
    question: "Which condition correctly implements this rule?",
    options: [
      "(premium_member and order_value > 5000) or emergency_flag",
      "premium_member and (order_value > 5000 or emergency_flag)",
      "premium_member or order_value > 5000 and emergency_flag",
      "premium_member and order_value > 5000 and emergency_flag",
    ],
    correctAnswer: 0,
    correctFeedback:
      "Exactly — grouping (premium_member and order_value > 5000) first, then combining with or emergency_flag, matches the rule: normal priority needs both conditions, but an emergency alone is enough.",
    misconceptionFeedback: {
      1: "Almost there. This groups order_value > 5000 or emergency_flag together first, so a non-premium customer with the emergency flag would NOT get priority — but the rule says an emergency flag should count on its own, regardless of membership.",
      2: "Not quite. Because and binds tighter than or, this actually means 'premium OR (order over 5000 AND emergency)' — so any premium member would qualify even with a tiny order, which isn't the intended rule.",
      3: "Not quite — this requires all three conditions at once, but the rule says an emergency flag alone should be enough, without also needing a large order.",
    },
  },

  understandingCheck: [
    {
      id: "check-1",
      question: "What does and require?",
      options: ["At least one condition to be True", "Every condition to be True", "Exactly one condition to be True", "No conditions to be True"],
      correctAnswer: 1,
      correctFeedback: "Right — and only evaluates to True when every joined condition is True.",
      misconceptionFeedback: {
        0: "That's the rule for or, not and. and needs every condition to be True.",
        2: "and doesn't count how many are True — it just requires all of them to be True at once.",
        3: "That would make and always False, which isn't how it works — it's True exactly when every condition is True.",
      },
    },
    {
      id: "check-2",
      question: "Which condition correctly requires BOTH being a premium member AND spending over ₹5,000?",
      options: ["premium_member or total > 5000", "premium_member and total > 5000", "not premium_member and total > 5000", "premium_member and total < 5000"],
      correctAnswer: 1,
      correctFeedback: "Right — and with both comparisons correctly requires both conditions together.",
      misconceptionFeedback: {
        0: "or would let either condition alone satisfy the rule — the rule needs both together, so and is required.",
        2: "not premium_member means NOT a premium member, which is the opposite of what the rule needs.",
        3: "total < 5000 checks for spending under ₹5,000, not over — that's the reverse of the intended rule.",
      },
    },
  ],
};
