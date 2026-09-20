import type { AssessmentQuestion, ConceptId } from "../types/assessment";
import { CONCEPT_PREREQUISITES } from "../constants/conceptGraph";

/**
 * The Targeted Reassessment question bank — deliberately separate from
 * `data/assessmentQuestions.ts` (the original 12): every question here
 * tests the same underlying skill as the original bank using a
 * different scenario, per the spec's explicit "do not reuse the exact
 * original assessment questions" instruction.
 *
 * Distribution rationale: Conditions, Loops, and Functions (the
 * concepts most likely to be flagged as a root gap or its dependents,
 * given the prerequisite graph and this app's recurring demo scenario)
 * get 3 questions each so a root-gap reassessment can always draw its
 * full 3-question allocation from one concept. Every other concept gets
 * 2 questions (one conceptual/code-reasoning, one application) — enough
 * to serve as a secondary/affected concept, and enough that even an
 * unusual root gap still has real, reviewed questions available. See
 * `services/reassessmentService.ts` for how a thinner pool degrades
 * gracefully instead of crashing or duplicating a question.
 *
 * Every question below was manually reviewed for exactly one
 * unambiguous correct answer, matching the same discipline applied to
 * the original bank and the Learning Module's lesson content.
 */
export const REASSESSMENT_QUESTION_BANK: Record<ConceptId, AssessmentQuestion[]> = {
  conditions: [
    {
      id: "r-conditions-1",
      question: "Which statement about the or operator is true?",
      concept: "conditions",
      prerequisiteConcepts: CONCEPT_PREREQUISITES.conditions,
      difficulty: "easy",
      questionType: "conceptual",
      options: [
        "or requires both conditions to be True",
        "or is True if at least one condition is True",
        "or is only usable with numbers",
        "or always returns False when combined with and",
      ],
      correctAnswer: 1,
      explanation: "or evaluates to True when at least one side is True; it's only False when every side is False.",
      points: 1,
    },
    {
      id: "r-conditions-2",
      question: 'Why does this print "Store open" even though is_holiday is True?',
      codeSnippet: 'is_weekend = False\nis_holiday = True\n\nif is_weekend and is_holiday:\n    print("Store closed")\nelse:\n    print("Store open")',
      concept: "conditions",
      prerequisiteConcepts: CONCEPT_PREREQUISITES.conditions,
      difficulty: "medium",
      questionType: "debugging",
      options: [
        "Because and only checks the first condition",
        "Because is_weekend is False, and both conditions joined by and must be True for the store to be closed",
        "Because is_holiday should have been checked first",
        "Because print statements always run the else branch",
      ],
      correctAnswer: 1,
      explanation: "and requires every joined condition to be True. is_weekend is False, so the whole condition is False and execution falls to else.",
      points: 1,
    },
    {
      id: "r-conditions-3",
      question: "A user can access the admin panel only if they are an admin AND their session has not expired. Which condition is correct?",
      concept: "conditions",
      prerequisiteConcepts: CONCEPT_PREREQUISITES.conditions,
      difficulty: "medium",
      questionType: "application",
      options: [
        "if is_admin or not session_expired:",
        "if is_admin and not session_expired:",
        "if not is_admin and session_expired:",
        "if is_admin and session_expired:",
      ],
      correctAnswer: 1,
      explanation:
        "Both must hold: is_admin True AND the session not expired (not session_expired True). or would grant access if either alone held; the other options check the wrong condition or polarity.",
      points: 1,
    },
  ],

  loops: [
    {
      id: "r-loops-1",
      question: "What will this print?",
      codeSnippet: "for i in range(1, 4):\n    print(i * 2)",
      concept: "loops",
      prerequisiteConcepts: CONCEPT_PREREQUISITES.loops,
      difficulty: "easy",
      questionType: "code_output",
      options: [
        "2 4 6, each on its own line",
        "1 2 3, each on its own line",
        "2 4 6 8, each on its own line",
        "0 2 4, each on its own line",
      ],
      correctAnswer: 0,
      explanation: "range(1, 4) yields 1, 2, 3; doubling each gives 2, 4, 6, each printed on its own line.",
      points: 1,
    },
    {
      id: "r-loops-2",
      question: "What does this code print, and why?",
      codeSnippet: 'count = 0\nfor word in ["a", "bb", "ccc"]:\n    if len(word) > 1:\n        count = count + 1\nprint(count)',
      concept: "loops",
      prerequisiteConcepts: CONCEPT_PREREQUISITES.loops,
      difficulty: "medium",
      questionType: "debugging",
      options: [
        "3, because every word is counted",
        "2, because two of the three words have length greater than 1",
        "1, because only the last word counts",
        "0, because len() doesn't work inside loops",
      ],
      correctAnswer: 1,
      explanation: '"a" has length 1 (not > 1, skipped); "bb" and "ccc" both satisfy len(word) > 1, so count becomes 2.',
      points: 1,
    },
    {
      id: "r-loops-3",
      question: "You need to process a list of orders and stop as soon as you find one over ₹10,000. Which loop construct is most appropriate?",
      concept: "loops",
      prerequisiteConcepts: CONCEPT_PREREQUISITES.loops,
      difficulty: "medium",
      questionType: "application",
      options: [
        "A for loop with no way to stop early",
        "A for loop using break once the condition is met",
        "A while loop that never checks a condition",
        "Calling the loop body once manually for each order",
      ],
      correctAnswer: 1,
      explanation: "break exits a for loop as soon as the target condition is found, avoiding unnecessary further iterations.",
      points: 1,
    },
  ],

  functions: [
    {
      id: "r-functions-1",
      question: "What is returned by a Python function that has no explicit return statement?",
      concept: "functions",
      prerequisiteConcepts: CONCEPT_PREREQUISITES.functions,
      difficulty: "easy",
      questionType: "conceptual",
      options: ["An empty string", "None", "0", "An error is raised"],
      correctAnswer: 1,
      explanation: "A function without a return statement implicitly returns None.",
      points: 1,
    },
    {
      id: "r-functions-2",
      question: "You need a function that returns True only for numbers that are both positive and even. Which implementation is correct?",
      codeSnippet:
        "# Option A\ndef check(n):\n    return n > 0 or n % 2 == 0\n\n# Option B\ndef check(n):\n    return n > 0 and n % 2 == 0\n\n# Option C\ndef check(n):\n    if n > 0:\n        return True\n\n# Option D\ndef check(n):\n    return n % 2 == 0",
      concept: "functions",
      prerequisiteConcepts: CONCEPT_PREREQUISITES.functions,
      difficulty: "medium",
      questionType: "application",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: 1,
      explanation:
        "Both conditions (positive AND even) must hold, so and (Option B) is correct. Option A's or accepts negative even numbers or positive odd numbers; Option C returns None for non-positive n instead of False; Option D ignores positivity.",
      points: 1,
    },
    {
      id: "r-functions-3",
      question:
        "A teammate suggests writing one large function that reads input, processes it, and prints the result, instead of three smaller functions. What's the main downside of the large function?",
      concept: "functions",
      prerequisiteConcepts: CONCEPT_PREREQUISITES.functions,
      difficulty: "hard",
      questionType: "reasoning",
      options: [
        "It runs slower because Python optimizes small functions more",
        "It's harder to test and reuse individual parts, since the responsibilities are mixed together",
        "Python doesn't allow functions longer than a few lines",
        "There is no real downside — it's simpler to have one function",
      ],
      correctAnswer: 1,
      explanation: "Mixing unrelated responsibilities into one function makes each part harder to test, reuse, or reason about independently.",
      points: 1,
    },
  ],

  variables: [
    {
      id: "r-variables-1",
      question: "What happens to y after y = x, if x is later reassigned to a new value (both are integers)?",
      concept: "variables",
      prerequisiteConcepts: CONCEPT_PREREQUISITES.variables,
      difficulty: "easy",
      questionType: "conceptual",
      options: [
        "y automatically updates to match the new x",
        "y keeps its original value — y and x are independent after the assignment",
        "This causes a Python error",
        "x and y become linked forever",
      ],
      correctAnswer: 1,
      explanation: "y = x copies the current value at assignment time; reassigning x afterward does not affect y for immutable types like integers.",
      points: 1,
    },
    {
      id: "r-variables-2",
      question: "What will this print?",
      codeSnippet: "score = 5\nscore = score + 3\nprint(score)",
      concept: "variables",
      prerequisiteConcepts: CONCEPT_PREREQUISITES.variables,
      difficulty: "easy",
      questionType: "code_output",
      options: ["5", "8", "3", "Error"],
      correctAnswer: 1,
      explanation: "score starts at 5; score + 3 evaluates to 8, which is assigned back to score.",
      points: 1,
    },
  ],

  data_types: [
    {
      id: "r-data-types-1",
      question: "What will this print?",
      codeSnippet: "print(type(10 // 3))",
      concept: "data_types",
      prerequisiteConcepts: CONCEPT_PREREQUISITES.data_types,
      difficulty: "easy",
      questionType: "code_output",
      options: ["<class 'float'>", "<class 'int'>", "<class 'str'>", "3.33"],
      correctAnswer: 1,
      explanation: "// is floor division; dividing two ints with // yields an int in Python 3.",
      points: 1,
    },
    {
      id: "r-data-types-2",
      question: "A user enters '10' in one field and '10.5' in another. If both are converted with float(), what type will each become?",
      concept: "data_types",
      prerequisiteConcepts: CONCEPT_PREREQUISITES.data_types,
      difficulty: "medium",
      questionType: "application",
      options: ["int and int", "float and float", "int and float", "str and str"],
      correctAnswer: 1,
      explanation: "float() always converts its argument to a float, regardless of whether the original looked like a whole number.",
      points: 1,
    },
  ],

  lists: [
    {
      id: "r-lists-1",
      question: "What will this print?",
      codeSnippet: "nums = [10, 20, 30]\nnums.remove(20)\nprint(nums)",
      concept: "lists",
      prerequisiteConcepts: CONCEPT_PREREQUISITES.lists,
      difficulty: "easy",
      questionType: "code_output",
      options: ["[10, 20, 30]", "[10, 30]", "[20]", "Error"],
      correctAnswer: 1,
      explanation: ".remove(value) deletes the first matching value from the list; nums becomes [10, 30].",
      points: 1,
    },
    {
      id: "r-lists-2",
      question: "You need to add a single new item to the end of an existing list. Which method should you use?",
      concept: "lists",
      prerequisiteConcepts: CONCEPT_PREREQUISITES.lists,
      difficulty: "medium",
      questionType: "application",
      options: [".extend(item)", ".append(item)", ".insert(item)", ".remove(item)"],
      correctAnswer: 1,
      explanation: ".append(item) adds exactly one item to the end. .extend() merges in multiple items from an iterable, and .insert() requires a position argument.",
      points: 1,
    },
  ],

  dictionaries: [
    {
      id: "r-dictionaries-1",
      question: 'Which correctly retrieves the value for the key "name" from a dictionary called person, returning None if the key is missing instead of raising an error?',
      concept: "dictionaries",
      prerequisiteConcepts: CONCEPT_PREREQUISITES.dictionaries,
      difficulty: "easy",
      questionType: "conceptual",
      options: ['person["name"]', 'person.get("name")', "person.name", 'person("name")'],
      correctAnswer: 1,
      explanation: ".get() returns None (or a provided default) when the key is missing, unlike [] which raises a KeyError.",
      points: 1,
    },
    {
      id: "r-dictionaries-2",
      question: "You want to count how many times each word appears in a list of words. Which data structure is the natural fit for the result?",
      concept: "dictionaries",
      prerequisiteConcepts: CONCEPT_PREREQUISITES.dictionaries,
      difficulty: "medium",
      questionType: "application",
      options: ["A list of the words in order", "A dictionary mapping each word to its count", "A single string of all words", "A boolean for each word"],
      correctAnswer: 1,
      explanation: "A dictionary naturally maps each unique word (key) to its running count (value) — exactly this problem's shape.",
      points: 1,
    },
  ],

  exceptions: [
    {
      id: "r-exceptions-1",
      question: "What happens when this code runs?",
      codeSnippet: "def divide(a, b):\n    return a / b\n\nresult = divide(10, 0)",
      concept: "exceptions",
      prerequisiteConcepts: CONCEPT_PREREQUISITES.exceptions,
      difficulty: "medium",
      questionType: "debugging",
      options: ["It prints None", "It raises a ZeroDivisionError", "It silently returns 0", "It raises a SyntaxError"],
      correctAnswer: 1,
      explanation: "Dividing by zero in Python raises a ZeroDivisionError at runtime.",
      points: 1,
    },
    {
      id: "r-exceptions-2",
      question: "You're converting user input with int(), but the user might type letters instead of digits. What's the safest way to handle this?",
      concept: "exceptions",
      prerequisiteConcepts: CONCEPT_PREREQUISITES.exceptions,
      difficulty: "medium",
      questionType: "application",
      options: [
        "Ignore it — int() never fails",
        "Wrap the conversion in a try/except ValueError and handle the invalid input gracefully",
        "Use a while loop that never checks for errors",
        "Convert with float() instead, which never raises errors",
      ],
      correctAnswer: 1,
      explanation: "int() raises a ValueError on non-numeric input; try/except ValueError is the standard way to handle it gracefully.",
      points: 1,
    },
  ],

  oop: [
    {
      id: "r-oop-1",
      question: "In a Python class, what does self refer to inside a method?",
      concept: "oop",
      prerequisiteConcepts: CONCEPT_PREREQUISITES.oop,
      difficulty: "medium",
      questionType: "conceptual",
      options: ["The class itself", "The specific object instance the method is being called on", "A global variable", "Nothing — it's optional syntax"],
      correctAnswer: 1,
      explanation: "self refers to the particular instance the method is invoked on.",
      points: 1,
    },
    {
      id: "r-oop-2",
      question:
        "You're deciding between a plain dictionary {'x': 0, 'y': 0} and a Point class with x/y attributes plus a distance_to() method. When does the class become the better choice?",
      concept: "oop",
      prerequisiteConcepts: CONCEPT_PREREQUISITES.oop,
      difficulty: "hard",
      questionType: "reasoning",
      options: [
        "Never — dictionaries are always simpler",
        "When you need behavior (like distance_to()) bundled with the data, not just the data itself",
        "Only when the program has no functions at all",
        "Classes are always slower, so avoid them",
      ],
      correctAnswer: 1,
      explanation: "A class earns its complexity when you need methods (behavior) tied to the data — a dictionary can hold values but has no natural place for behavior.",
      points: 1,
    },
  ],
};
