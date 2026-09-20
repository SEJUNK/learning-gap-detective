# Demo Guide — Learning Gap Detective

## Demo Objective

Within 3-5 minutes, the judge should understand:

1. **What this product does** — diagnoses *why* a student is struggling, not just *what* they got wrong.
2. **Why normal test results are insufficient** — a raw score treats every wrong answer as equally important; it doesn't trace a mistake in Loops back to a shakier prerequisite in Conditions.
3. **What Learning Gap Detective discovers** — a deterministic engine identifies a *possible root gap*: one concept whose weakness plausibly explains weakness in the concepts built on top of it.
4. **Why the identified root gap matters** — fixing the root gap first is a shorter path to fixing everything downstream of it than practicing each symptom separately.
5. **What the student should do next** — a personalized recovery path targets the root gap, then its affected concepts.
6. **Whether the intervention actually helped** — a targeted reassessment (new questions, same concepts) measures a real, honestly-computed before/after, not a hardcoded "you improved!" message.

Core message to land: **"Marks tell you what you got wrong. Learning Gap Detective helps identify why you got it wrong — and what to learn next."**

## Demo Student

**Alex** — the fixed mock student throughout the app (no login/accounts exist; this is by design, not a placeholder).

## Starting State (after running the demo assessment)

The demo assessment produces this real, engine-computed result — see "Honesty note" below for why these are the actual numbers rather than round targets:

| Concept | Mastery | Status |
|---|---|---|
| Conditions | 0% | Possible Root Gap |
| Loops | 50% | (also below the critical threshold — a second, independent weak signal) |
| Functions | 50% | Needs Practice |
| Lists | 100% | Strength |
| Everything else (Variables, Data Types, Dictionaries, Exceptions, OOP) | 100% | Strength |

## Expected Diagnosis

**Possible Root Gap: Conditions**
Affected concepts: **Loops, Functions**
Confidence: **High** (shown directly on the Diagnosis screen, next to the finding)

The Diagnosis screen shows the full chain — Finding → Evidence → Interpretation → Recommendation — including a visual "Conditions → Loops, Functions" prerequisite chain in the hero panel, not just a list of weak topics.

## Demo Flow (Fast Demo Path — 3-5 minutes)

**Before you start**: go to **Settings → Demo Controls → Start Demo Journey**. This resets all state, turns on Demo Mode, and drops you on the Diagnostic Assessment.

| # | Screen | What to do | What to say |
|---|---|---|---|
| 1 | Dashboard | (Skipped by Start Demo Journey — visit `/` first if you want to show the seed state before resetting) | "Here's the student's baseline." |
| 2 | Diagnostic Assessment | Click **Fill Demo Answers** (top right, only visible in Demo Mode), then **Submit Assessment** → confirm | "I'm using a demo-fill so we don't spend five minutes clicking through questions live — but every answer still runs through the real scoring engine when I hit Submit." |
| 3 | Diagnosis | Point at the red "ROOT GAP DETECTED · High confidence" panel and the Conditions → Loops, Functions chain | "This is the product's core insight: it's not just flagging weak topics, it's tracing a prerequisite dependency." Scroll to Evidence, then AI Insight (note the source line if no AI key is configured). |
| 4 | Recovery Path | Click **Build My Recovery Path** | "The path is generated from that diagnosis — root gap first, then the concepts it affects, then a combined challenge." |
| 5 | Learning Module | Click **Start Learning** → **Start Learning** → **Continue to Practice** → answer a couple of questions (misconception feedback shows on a wrong answer) → **Continue to Challenge** → **Continue to Quick Check** → finish | "Notice the opening line — it names the root gap and the concepts it affects, computed live from the diagnosis, not hardcoded." |
| 6 | Reassessment | Click **Verify My Improvement** → **Start Reassessment** → **Fill Demo Answers** → **Submit Reassessment** → confirm | "New questions, not a repeat of the original assessment — and I'm demo-filling correct answers, but the comparison you're about to see is computed by the same scoring engine as everything else." |
| 7 | Reassessment Results | Point at the before/after bars and "Your learning gap is closing." | "Conditions and Loops — the two concepts this reassessment actually tested — both improved. Functions wasn't retested this cycle, so it honestly stays at 50% and the recommended next step says so." |
| 8 | Dashboard | Navigate back to Overview | "The dashboard now reflects the same numbers we just watched get computed — Conditions and Loops updated, nothing double-entered." |

## Expected Improvement (after the Reassessment step above)

| Concept | Before | After | Status |
|---|---|---|---|
| Conditions (root gap) | 0% | 100% | **Improved** |
| Loops (the one affected concept this reassessment retests) | 50% | 100% | **Improved** |
| Functions | 50% | *unchanged — not retested this cycle* | Needs Practice (honestly reported, not silently marked improved) |
| Lists | 100% | 100% | Strength (never touched — already strong) |

**Honesty note on the numbers**: the product's own documentation
(`DEVELOPMENT_STATUS.md`, `frontend/src/data/demoScript.ts`) is explicit
that the current 12-question assessment bank has only 1-2 questions per
concept, which caps achievable percentages at coarse increments (0/50/100).
The figures above are the actual, verified output of the real scoring
engine on the documented demo answer key — not the round illustrative
numbers (e.g. "48% → 82%") sometimes used as a narrative example. If
asked, this is a good moment to note the product deliberately reports
real computed numbers rather than fabricating precision.

**Why only Conditions + Loops show "Improved"**: a single reassessment
tests the root gap plus exactly one affected concept (3 root + 1
affected + 1 transfer questions, by design). Functions would need a
second recovery + reassessment cycle to also show a measured
improvement — the app's "Next Best Action" after this cycle correctly
recommends a fresh full assessment rather than claiming Functions
already improved.

## Reset Instructions

**Settings → Demo Controls → Reset Demo Data** (confirm in the dialog).
Clears the assessment, diagnosis-derived mastery, recovery-path
progress, and reassessment results, and reloads the app. Use this
between rehearsals or between live demo runs. **Start Demo Journey**
also resets automatically before navigating to the assessment, so you
rarely need to call Reset separately.

## Demo Mode controls (Settings page)

- **Start Demo Journey** — one click: reset + enable Demo Mode + jump to the assessment.
- **Demo Mode** toggle — while on, a small **"Fill Demo Answers"** button appears on the Assessment and Reassessment screens (next to the progress bar). It fills in the documented demo answers and jumps to the last question so you can hit Submit immediately — it does **not** precompute or inject a score; `scoreAssessment`/`computeReassessmentResult` still run normally on submit. Off by default so the real student experience stays clean.
- **Reset Demo Data** — clears everything, independent of the toggle above.

## AI Fallback

The product does not require an AI provider to function. With no
`VITE_AI_API_KEY` configured (the default), every AI-authored screen —
Diagnosis's "AI Insight" and Reassessment's "AI Reflection" — shows a
deterministic, template-generated explanation with a visible note: *"No
AI provider configured — this explanation was generated from your
deterministic assessment evidence."*

This was also verified against a genuinely broken AI endpoint (wrong
URL, unreachable): the message becomes *"AI explanation temporarily
unavailable. The diagnosis above is based entirely on deterministic
assessment evidence, computed with no AI involved."* — the root gap,
evidence, and recommendation are completely unaffected either way. If a
judge asks "what happens if the AI fails," this is safe to demonstrate
live by describing this behavior; the root finding never depends on it.

## Recommended Demo Duration

**3-5 minutes** for the Fast Demo Path above. If time is very tight, the
minimum "wow moment" sequence is: Diagnosis (root gap chain) →
Reassessment Results (before/after) — under 90 seconds using Demo Mode's
fill buttons throughout.
