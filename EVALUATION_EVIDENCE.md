# Evaluation Evidence

This document maps the hackathon's stated evaluation criteria to
concrete, locatable evidence in this repository. It is a navigation aid
for a judge — it does not assign ourselves a score, and it does not
claim the project is complete or flawless. Every "Evidence" line below
points at a real file or a live-verifiable behavior; nothing here is
asserted without something a judge can independently check.

---

## 1. Problem Understanding & Relevance

**Claim**: A test score shows what a student got wrong, not why — and
not whether today's mistake is a symptom of an earlier, unresolved
concept.

**Evidence**:
- [README.md § 1 (Problem)](README.md#1-problem) and
  [§ 3 (Why This Matters)](README.md#3-why-this-matters) state the
  problem and its relevance to students, teachers, and learning
  platforms without unsupported impact claims.
- The concept prerequisite graph
  (`frontend/src/constants/conceptGraph.ts`) is the concrete artifact
  that makes "an earlier concept explains a later mistake" checkable in
  code, not just asserted in prose.

**Relevant implementation/document**: `README.md`, `conceptGraph.ts`.

---

## 2. Innovation & Uniqueness

**Claim**: An assessment-driven approach that attempts to trace
downstream performance issues to possible prerequisite learning gaps,
distinguishing root gaps from isolated concept gaps and
understood-but-can't-apply application gaps.

**Evidence**:
- `frontend/src/services/diagnosticEngine.ts` — `detectRootGaps()`
  requires a concept to be independently weak, have a weak dependent,
  and (when available) a question-level link between them before it's
  ever flagged as a root gap — a single low score is never sufficient.
  `detectConceptGaps()` and `detectApplicationGaps()` implement the two
  other finding types with their own distinct rules.
- Every finding carries a clamped confidence score (0.3-0.95,
  `MIN_FINDING_CONFIDENCE`/`MAX_FINDING_CONFIDENCE` in
  `diagnosisThresholds.ts`) and hedged evidence strings — verified live:
  a lower-confidence finding on the Diagnosis screen shows "Possible
  Root Gap" instead of "Root Gap Detected"
  (`pages/Diagnosis/components/RootFindingPanel.tsx`).
- `frontend/src/services/reassessmentService.ts` — reassessment uses a
  *separate* question bank (`data/reassessmentQuestions.ts`) and a
  centralized `classifyComparisonStatus()` rule that can produce
  `improved`, `still_developing`, or `needs_more_practice` — regression
  can never be classified as improvement (test:
  `reassessmentService.test.ts`).
- This is explicitly not presented as unprecedented — see
  [README.md § 4](README.md#4-what-makes-it-different)'s framing.

**Relevant implementation/document**: `diagnosticEngine.ts`,
`diagnosticEngine.test.ts`, `reassessmentService.ts`,
`reassessmentService.test.ts`, `RootFindingPanel.tsx`.

---

## 3. Technical Implementation

**Claim**: A deterministic-first architecture where scoring, gap
detection, path generation, and reassessment measurement are pure,
independently-tested functions; an AI layer only narrates conclusions
those functions already reached, with a guaranteed deterministic
fallback.

**Evidence**:
- Deterministic core: `scoringService.ts`, `evidenceService.ts`,
  `diagnosticEngine.ts`, `learningPathService.ts`,
  `reassessmentService.ts` — none of these files import or call
  anything network-related; each has a matching `*.test.ts`.
- AI abstraction: `services/ai/aiProvider.ts` (interface),
  `mockAIProvider.ts` (default, zero network calls),
  `remoteAIProvider.ts` (real LLM call, 10s timeout, explicit handling
  for bad status / malformed JSON / missing fields / network failure —
  `remoteAIProvider.test.ts`, 8 tests), `diagnosisValidator.ts` /
  `reassessmentReflectionValidator.ts` (structural validation of any
  real AI response before it's trusted), `templatedDiagnosis.ts` /
  `templatedReassessmentReflection.ts` (the deterministic fallback both
  Mock and a failed Remote call use).
- Centralized state: `studentStateService.ts` is the single write path
  for "what has the student's mastery become"; `dashboardService.ts` is
  the only reader that merges it — documented and tested
  (`studentStateService.test.ts`, `dashboardService.test.ts`) to keep
  every screen showing the same number for the same concept.
- 120 frontend tests (`npx vitest run` from `frontend/`) + 6 backend
  tests (`pytest` from `backend/`) — both currently passing (verified
  in this session, see `DEVELOPMENT_STATUS.md`'s most recent entries).
- PWA: complete manifest + generated service worker
  (`vite-plugin-pwa`), verified against a real production preview
  server (service worker registers and activates, not just configured).

**Relevant implementation/document**: `frontend/src/services/`,
`frontend/src/services/ai/`, `ARCHITECTURE.md`.

---

## 4. Working Prototype / Deployment

**Claim**: The full journey — Assessment → Scoring → Evidence →
Diagnosis → Recovery Path → Learning Module → Reassessment → Updated
Dashboard — runs end to end, using real computed values throughout, and
the project is configured for straightforward deployment.

**Evidence**:
- `DEMO_GUIDE.md` documents the exact click-through script and the
  actual (not illustrative) numbers it produces.
- Demo Mode (`services/demoModeService.ts`, off by default) provides a
  reproducible answer key that still runs through real scoring —
  verified by `demoModeService.test.ts`'s assertion that running the
  demo answers through the real `scoreAssessment()` produces the
  documented per-concept percentages, not a hardcoded result.
- `frontend/vercel.json` (SPA build/rewrite config) and
  `backend/Procfile` (PaaS start command) make deployment a
  configuration step, not an architecture change — see
  [README.md § 18](README.md#18-deployment).

**How to verify**: `cd frontend && npm install && npm run dev`, then
`cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000`
(the frontend works without the backend running — see
[README.md § 9](README.md#9-architecture)). Then follow
`DEMO_GUIDE.md`, or `npm run build` for a production build.

---

## 5. Impact & Scalability

**Current capability**: A working, testable diagnostic loop scoped to
Python fundamentals (9 concepts), for a single synthetic student, with
no persistence beyond the browser.

**Future capability** (explicitly unbuilt — see
[README.md § 20](README.md#20-scalability) for the full list): additional
subjects (the data model is already subject-parametrized), a
teacher/classroom aggregate view (the per-student evidence already
exists in structured form), LMS integration (behind the documented
server-side move of the diagnostic pipeline), a larger question bank for
finer-grained diagnosis, adaptive question selection, and longitudinal
analytics.

---

## 6. Presentation & Documentation

**Evidence**:
- `README.md` — problem, solution, architecture, AI role, setup,
  testing, deployment, scalability, and limitations in one document,
  including a **Judge Quick Start** section.
- `ARCHITECTURE.md` — a top-level flow diagram plus a phase-by-phase
  implementation history, including design rationale and specific bugs
  found and fixed.
- `DEVELOPMENT_STATUS.md` — the full build history, phase by phase,
  including what was verified and how.
- `DEMO_GUIDE.md` — the exact live-demo script, expected results, reset
  instructions, and AI fallback behavior.
- This document.

---

## A note on claims

Every "AI-powered," "personalized," "automated," or similar phrase used
elsewhere in this repository's documentation is scoped to what's
actually implemented and named above — e.g. "personalized" refers
specifically to the recovery path being generated from a given
student's own diagnostic evidence (`generateLearningPath()`), not a
general claim about adaptive learning. Terms like "production-ready,"
"accurate," or "secure" are deliberately avoided; see
[README.md § 21 (Current Limitations)](README.md#21-current-limitations)
for what this project explicitly does not claim.
