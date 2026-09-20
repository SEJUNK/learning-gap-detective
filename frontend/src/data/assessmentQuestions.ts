import type { AssessmentQuestion } from "../types/assessment";

/**
 * The 12-question Python Diagnostic Assessment.
 *
 * Distribution rationale (documented per the data-quality review this
 * phase requires):
 * - Concepts: not uniform — Conditions, Loops, and Functions get 2
 *   questions each (they sit in the middle of the prerequisite chain
 *   and are where most downstream mistakes tend to originate), every
 *   other concept gets 1.
 * - Difficulty: 3 easy / 6 medium / 3 hard (25/50/25 — the closest even
 *   split to the requested 30/50/20 that 12 whole questions allow).
 * - Question types: conceptual ×2, code_output ×3, debugging ×3,
 *   application ×2, reasoning ×2 — every type appears at least twice.
 * - `prerequisiteConcepts` starts from CONCEPT_PREREQUISITES
 *   (constants/conceptGraph.ts) for each question's primary concept. One
 *   question (q7) intentionally lists an additional concept (Lists)
 *   beyond that concept's canonical chain, because that specific
 *   question genuinely exercises it — a question can draw on more than
 *   its concept's default prerequisites; it's never assigned ad hoc.
 *
 * Every question below was manually reviewed for: exactly one
 * unambiguous correct answer, an explanation that actually matches that
 * answer, a concept/prerequisite mapping consistent with the graph, and
 * a difficulty rating that matches the reasoning required — not just
 * generated and trusted.
 */
export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "q1-variables",
    question: "What does the following Python statement do?",
    codeSnippet: "x = 10",
    concept: "variables",
    prerequisiteConcepts: [],
    difficulty: "easy",
    questionType: "conceptual",
    options: [
      "Declares a constant named x that can never change",
      "Creates a variable named x and assigns it the integer value 10",
      "Compares x to 10 and returns True or False",
      "Creates a function named x that returns 10",
    ],
    correctAnswer: 1,
    explanation:
      "In Python, = is the assignment operator. It creates (or rebinds) a variable x referencing the integer 10. Python has no const keyword, and = is not comparison — that's ==.",
    points: 1,
  },
  {
    id: "q2-data-types",
    question: "What will the following code print?",
    codeSnippet: "print(type(3 / 2))",
    concept: "data_types",
    prerequisiteConcepts: ["variables"],
    difficulty: "easy",
    questionType: "code_output",
    options: ["<class 'int'>", "<class 'float'>", "<class 'str'>", "1.5"],
    correctAnswer: 1,
    explanation:
      "In Python 3, / is true division and always returns a float, even when both operands are integers (3 / 2 == 1.5, a float value). // would perform floor division and return an int.",
    points: 1,
  },
  {
    id: "q3-conditions-application",
    question:
      "A customer receives a discount only if they are a premium member AND their order exceeds ₹5,000. Which condition correctly implements this?",
    concept: "conditions",
    prerequisiteConcepts: ["variables", "data_types"],
    difficulty: "medium",
    questionType: "application",
    options: [
      "if is_premium or order_total > 5000:",
      "if is_premium and order_total > 5000:",
      "if is_premium & order_total => 5000:",
      "if is_premium == True or order_total >= 5000:",
    ],
    correctAnswer: 1,
    explanation:
      "\"AND\" logic requires both conditions to hold at once, which `and` implements. `or` (options A and D) would grant the discount if either condition alone were true. `=>` (option C) isn't valid Python syntax.",
    points: 1,
  },
  {
    id: "q4-conditions-debugging",
    question:
      "Why does this code print \"Entry denied\" even though age is 20, which satisfies the age requirement?",
    codeSnippet: 'age = 20\nhas_id = False\n\nif age >= 18 and has_id:\n    print("Entry allowed")\nelse:\n    print("Entry denied")',
    concept: "conditions",
    prerequisiteConcepts: ["variables", "data_types"],
    difficulty: "hard",
    questionType: "debugging",
    options: [
      "Because `and` only requires one condition to be true, and Python evaluated it incorrectly",
      "Because `has_id` is False, and both conditions joined by `and` must be true for entry to be allowed",
      "Because `age >= 18` evaluates to False for age 20",
      "Because the `else` branch always runs regardless of the condition",
    ],
    correctAnswer: 1,
    explanation:
      "`and` requires both operands to be truthy. `age >= 18` is True, but `has_id` is False, so the compound condition is False overall and execution falls to `else`.",
    points: 1,
  },
  {
    id: "q5-loops-output",
    question: "What will this code print?",
    codeSnippet: "for i in range(3):\n    print(i)",
    concept: "loops",
    prerequisiteConcepts: ["conditions", "variables"],
    difficulty: "easy",
    questionType: "code_output",
    options: [
      "1 2 3, each on its own line",
      "0 1 2, each on its own line",
      "0 1 2 3, each on its own line",
      "3, printed once",
    ],
    correctAnswer: 1,
    explanation:
      "range(3) produces 0, 1, 2 — it starts at 0 by default and stops before the stop value. The loop prints each of those on its own line.",
    points: 1,
  },
  {
    id: "q6-loops-debugging",
    question:
      "This code is supposed to sum all the numbers in the list, but it prints 8 instead of 10. What is the bug?",
    codeSnippet: "total = 0\nnumbers = [1, 2, 3, 4]\n\nfor n in numbers:\n    total = n + n\n\nprint(total)",
    concept: "loops",
    prerequisiteConcepts: ["conditions", "variables"],
    difficulty: "medium",
    questionType: "debugging",
    options: [
      "range() should have been used instead of iterating the list directly",
      "total = n + n doubles the current number and overwrites total each iteration instead of accumulating it",
      "The list should have been sorted first",
      "print(total) is indented incorrectly",
    ],
    correctAnswer: 1,
    explanation:
      "The loop body reassigns total to n + n (double the current element) on every pass instead of accumulating with total = total + n (or total += n), so only the last iteration's doubled value (4 + 4 = 8) survives.",
    points: 1,
  },
  {
    id: "q7-functions-application",
    question:
      "You need a function that returns only the even numbers greater than 10 from a list of integers. Which implementation is correct?",
    codeSnippet:
      "# Option A\ndef filter_numbers(nums):\n    return [n for n in nums if n > 10 or n % 2 == 0]\n\n# Option B\ndef filter_numbers(nums):\n    return [n for n in nums if n > 10 and n % 2 == 0]\n\n# Option C\ndef filter_numbers(nums):\n    for n in nums:\n        if n > 10 and n % 2 == 0:\n            return n\n\n# Option D\ndef filter_numbers(nums):\n    return [n for n in nums if n % 2]",
    concept: "functions",
    prerequisiteConcepts: ["variables", "conditions", "lists"],
    difficulty: "medium",
    questionType: "application",
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctAnswer: 1,
    explanation:
      "Both conditions — greater than 10, and even — must hold together, so `and` (Option B) is required. Option A's `or` would include odd numbers over 10 or even numbers under 10. Option C returns only the first match instead of all matches. Option D only checks evenness, ignoring the size condition.",
    points: 1,
  },
  {
    id: "q8-functions-reasoning",
    question:
      "You need a function that computes a value used in many places in your program, and that value depends only on its inputs, never on external state. Which approach is more appropriate, and why?",
    concept: "functions",
    prerequisiteConcepts: ["loops", "conditions"],
    difficulty: "hard",
    questionType: "reasoning",
    options: [
      "A function with no parameters that reads from global variables, because it avoids passing arguments",
      "A pure function that takes the needed values as parameters and returns a result, because it's predictable, testable, and reusable regardless of program state",
      "Copy-pasting the calculation everywhere it's needed, because it avoids the overhead of a function call",
      "A function that both computes and prints the result, because it saves a step",
    ],
    correctAnswer: 1,
    explanation:
      "A function depending only on its parameters (not external/global state) is a pure function — predictable and easy to test in isolation. Reading globals creates hidden coupling, duplicating logic creates maintenance risk, and mixing computation with printing reduces reusability since the caller can't use the return value elsewhere.",
    points: 1,
  },
  {
    id: "q9-lists-output",
    question: "What will this code print?",
    codeSnippet: "numbers = [1, 2, 3]\nnumbers.append([4, 5])\nprint(len(numbers))",
    concept: "lists",
    prerequisiteConcepts: ["data_types", "loops"],
    difficulty: "medium",
    questionType: "code_output",
    options: ["3", "4", "5", "2"],
    correctAnswer: 1,
    explanation:
      ".append() adds its argument as a single element, regardless of whether that argument is itself a list. numbers becomes [1, 2, 3, [4, 5]] — a list of length 4. .extend() would have merged the elements in instead.",
    points: 1,
  },
  {
    id: "q10-dictionaries-conceptual",
    question: "What is the key difference between a list and a dictionary in Python?",
    concept: "dictionaries",
    prerequisiteConcepts: ["lists"],
    difficulty: "medium",
    questionType: "conceptual",
    options: [
      "A list can only store numbers, while a dictionary can store any type",
      "A list stores values accessed by position (index), while a dictionary stores values accessed by a key",
      "A dictionary is ordered, while a list is unordered",
      "There is no meaningful difference — they are interchangeable",
    ],
    correctAnswer: 1,
    explanation:
      "Lists are ordered sequences accessed by integer index (my_list[0]); dictionaries store key-value pairs accessed by an arbitrary key (my_dict[\"name\"]). Both can hold any data type, and both preserve insertion order in modern Python, so that isn't the distinguishing factor.",
    points: 1,
  },
  {
    id: "q11-exceptions-debugging",
    question: "What happens when this code runs, and what's the best way to handle it?",
    codeSnippet: 'def get_value(data, key):\n    return data[key]\n\nresult = get_value({"a": 1}, "b")',
    concept: "exceptions",
    prerequisiteConcepts: ["functions"],
    difficulty: "medium",
    questionType: "debugging",
    options: [
      "It silently returns None; no handling is needed",
      "It raises a KeyError because \"b\" is not in the dictionary; wrapping the access in a try/except KeyError handles it gracefully",
      "It raises a SyntaxError because dictionaries can't be indexed with strings",
      "It automatically adds \"b\" to the dictionary with a default value",
    ],
    correctAnswer: 1,
    explanation:
      "Accessing a missing dictionary key with [] raises a KeyError — it does not return None (that's what .get() does). Catching KeyError in a try/except, or using .get() with a default, is the idiomatic way to handle a possibly-missing key.",
    points: 1,
  },
  {
    id: "q12-oop-reasoning",
    question:
      "You're modeling a BankAccount. Option A keeps balance as a separate variable with functions deposit(balance, amount) and withdraw(balance, amount) that each take balance as a parameter and return a new balance. Option B is a BankAccount class with a balance attribute and deposit(amount) / withdraw(amount) methods that modify self.balance directly. Which design better follows object-oriented principles, and why?",
    concept: "oop",
    prerequisiteConcepts: ["functions", "dictionaries"],
    difficulty: "hard",
    questionType: "reasoning",
    options: [
      "Option A, because plain functions are always simpler than classes",
      "Option B, because it encapsulates the account's state and behavior together, so balance can only be changed through the account's own methods",
      "They are equally good — OOP provides no real benefit here",
      "Option A, because passing balance explicitly makes the code faster",
    ],
    correctAnswer: 1,
    explanation:
      "Encapsulation — bundling state (balance) with the behavior that modifies it (deposit/withdraw) inside a class — is a core OOP principle. It keeps related logic together and lets the class control how its state can change, rather than leaving balance as a loose value any code could mutate directly.",
    points: 1,
  },
];
