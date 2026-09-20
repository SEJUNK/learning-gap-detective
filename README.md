# Learning Gap Detective

> Understand what you know. Discover what you don't. Fix it.

An assessment-driven diagnostic system for Python fundamentals. It analyzes
a student's assessment answers as **evidence** — not just a score — and
traces wrong answers through a concept prerequisite graph to identify a
**possible root learning gap**: the earliest concept whose weakness
plausibly explains difficulty in the concepts built on top of it. It then
generates a personalized recovery path, delivers a targeted interactive
lesson, and re-measures the same concepts with new questions to check
whether the intervention actually helped.

**Marks tell you what you got wrong. Learning Gap Detective helps
identify why you got it wrong — and what to learn next.**

---

## Judge Quick Start

1. **What this solves**: a test score shows *what* a student got wrong,
   not *why* — and not whether today's mistake is actually a symptom of
   an earlier, unresolved concept.
2. **Run it**: see [Local Setup](#local-setup) below — two commands, no
   database, no signup, no API key required.
3. **Where to start**: open the app, go to **Settings → Demo Controls →
   Start Demo Journey**. This resets to a clean state and drops you on
   the Diagnostic Assessment.
4. **What to look for**: the **Diagnosis** screen (root-gap panel with a
   visible confidence tier and a "Conditions → Loops, Functions"
   dependency chain) and the **Reassessment results** screen
   (before/after bars with an honest "Improved" / "Needs More Practice"
   classification — not a single congratulatory message regardless of
   outcome).
5. **Reproduce the demo**: on the Assessment and Reassessment screens, a
   **"Fill Demo Answers"** button appears (Demo Mode is on after Start
   Demo Journey) — it fills in a documented answer key and jumps to
   Submit; the real scoring/diagnosis/reassessment engine still runs on
   submission. Full script: [DEMO_GUIDE.md](DEMO_GUIDE.md).
6. **Reset**: **Settings → Demo Controls → Reset Demo Data**.
7. **Core diagnostic logic**: `frontend/src/services/diagnosticEngine.ts`
   (root/concept/application gap detection) and
   `frontend/src/constants/conceptGraph.ts` (the prerequisite graph it
   walks) — both pure TypeScript, zero network calls, unit-tested.
8. **AI layer**: `frontend/src/services/ai/` — narrates a diagnosis the
   deterministic engine already computed; never decides a score or a
   gap. See [AI Role](#10-ai-role) below.
9. **Evidence this is real, not a mock UI**: `frontend/src/services/*.test.ts`
   (120 tests) exercise the actual scoring/diagnosis/reassessment
   functions with assertions on their output, not snapshot placeholders.

---

## 1. Problem

A score report tells a student *that* they missed a question about
Functions. It rarely tells them *why*. Often the real gap sits one
concept earlier: a shaky grasp of Conditions quietly breaks Loops, which
then breaks Functions — and practicing Functions in isolation doesn't
fix that. Students (and the tools recommending what to study next) end
up treating the symptom, not the cause.

## 2. Solution

```
Assessment → Evidence → Diagnosis → Possible Root Gap
  → Personalized Recovery → Targeted Learning → Reassessment
  → Measured Improvement
```

A 12-question diagnostic assessment is scored deterministically into
structured evidence (per-concept mastery, which questions were missed,
confidence patterns). A rule-based engine walks a concept prerequisite
graph over that evidence to identify a possible root gap and the
concepts it affects. A recovery path is generated from that specific
finding — root gap first, then its affected concepts, then a combined
challenge. After a short interactive lesson, a **targeted reassessment**
(new questions, same concepts) is scored the same way the original
assessment was, and the before/after difference is classified
(`improved` / `still_developing` / `needs_more_practice`) by the same
rule, never eyeballed or hardcoded.

## 3. Why This Matters

- **Students** get pointed at the concept most likely to unblock several
  weak areas at once, instead of a flat list of "things you got wrong."
- **Teachers / tutors** get a legible chain — finding → evidence →
  interpretation → recommendation — instead of a black-box score, which
  matters if they need to explain *why* a recommendation was made.
- **Learning platforms** get a worked example of separating "what is
  true" (deterministic evidence) from "how to explain it" (AI narration)
  — a pattern that stays auditable even as the explanation layer changes.

No claim is made here about measured learning outcomes at scale — this
is a working diagnostic mechanism, not a longitudinal study.

## 4. What Makes It Different

An assessment-driven approach that attempts to trace downstream
performance issues to possible prerequisite learning gaps, rather than
reporting per-topic scores in isolation. Concretely, what's implemented:

- **Concept-level analysis** — every question is tagged with a concept
  and the concepts it implicitly draws on, not just scored pass/fail.
- **Prerequisite relationships** — a real concept dependency graph
  (`conceptGraph.ts`), not a flat topic list.
- **Possible root-gap detection** — a concept is only flagged as a root
  gap if it's itself weak *and* has a dependent concept that's also
  weak *and* (when available) a question-level link between them —
  never from a single low score alone.
- **Evidence-based, hedged diagnosis** — every finding carries a
  clamped 0.3-0.95 confidence score and hedged language ("evidence
  suggests," "this pattern may indicate"); low-confidence findings are
  labeled "Possible Root Gap" rather than presented as certain.
- **Personalized recovery path** — generated per-student from their own
  diagnosis, not a fixed curriculum order.
- **Targeted learning** — one interactive module (explanation, worked
  example, practice with misconception-specific feedback, an
  application challenge, understanding checks) aimed at the diagnosed
  concept.
- **Reassessment with new questions** — a separate question bank, not a
  repeat of the original assessment.
- **Before/after measurement** — a deterministic classification of
  whether the specific gap actually improved, including the honest case
  where it didn't.

This is not presented as an unprecedented technique — concept-mapped
adaptive assessment exists in the broader EdTech literature. What's
implemented here is a working, testable version of that idea scoped to
Python fundamentals, with a clear deterministic/AI boundary.

## 5. Key Features

Only what's actually implemented and demonstrable end-to-end today:

- 12-question diagnostic assessment across 9 Python concepts
- Deterministic scoring engine (concept mastery, difficulty breakdown,
  confidence patterns)
- Root-gap / concept-gap / application-gap / strength classification
- A visual concept dependency map and an explicit root-gap chain
  ("Conditions → Loops, Functions")
- AI-narrated explanation with a validated, guaranteed deterministic
  fallback (works fully with zero AI configured)
- Personalized recovery path generation from the diagnosis
- One fully authored interactive learning module (Conditional Logic)
- Targeted reassessment with a separate question bank
- Before/after comparison with an honest improvement classification
- A dashboard that reflects real assessment/reassessment state, not
  static numbers, once a student has actually gone through the flow
- Demo Mode (documented, reversible, off by default) for a repeatable
  live walkthrough
- Installable PWA (manifest + service worker)
- 120 frontend tests + 6 backend tests

## 6. How It Works

```
AssessmentPage (12 questions)
  → scoreAssessment()                    deterministic — services/scoringService.ts
  → buildAssessmentEvidence()            deterministic — services/evidenceService.ts
  → analyzeDiagnosticEvidence()          deterministic — services/diagnosticEngine.ts
       walks CONCEPT_PREREQUISITES (constants/conceptGraph.ts)
       → root gaps / concept gaps / application gaps / strengths,
         each with a confidence score and hedged evidence strings
  → AIProvider.generateDiagnosis()       optional — services/ai/
       Mock (default) or Remote (env-configured), validated,
       guaranteed deterministic fallback on any failure
  → DiagnosisPage renders both: the deterministic finding (fact)
    and the AI narrative (explanation of that fact)
  → generateLearningPath()               deterministic — services/learningPathService.ts
  → LearningModulePage                   interactive lesson for the root gap
  → buildReassessmentQuestions() + computeReassessmentResult()
       deterministic — services/reassessmentService.ts
       new questions, same scoring engine, before/after comparison
  → studentStateService writes the result to one centralized store
  → dashboardService merges it into what the Dashboard renders
```

Full detail, including design rationale and bugs found/fixed along the
way, is in [ARCHITECTURE.md](ARCHITECTURE.md).

## 7. Example

The documented demo answer key (`frontend/src/data/demoScript.ts`),
when actually run through the scoring engine, produces:

| Concept | Mastery | Diagnosis |
|---|---|---|
| Conditions | 0% | **Possible Root Gap** |
| Loops | 50% | Also below the critical threshold — a second, independent weak signal |
| Functions | 50% | Needs Practice |
| Lists | 100% | Strength |
| Everything else | 100% | Strength |

**Possible Root Gap: Conditions** — affected concepts: **Loops,
Functions**. Confidence: **High** (shown directly on the Diagnosis
screen).

> A note on precision: an earlier design draft used illustrative
> figures (e.g. "Conditional Logic 48%, Loops 56%") to describe the
> intended shape of the demo story. The current 12-question assessment
> bank has only 1-2 questions per concept, which caps achievable
> percentages at coarse increments — so the table above is the actual,
> verified output of the real engine on the real demo answer key, not a
> rounded restatement of those illustrative numbers. See
> [DEMO_GUIDE.md](DEMO_GUIDE.md) for the full explanation.

## 8. Before / After

After completing the recovery path's learning module and a targeted
reassessment (verified live, not asserted from documentation):

| Concept | Before | After | Status |
|---|---|---|---|
| Conditions (root gap) | 0% | 100% | **Improved** |
| Loops (the one affected concept this reassessment retests) | 50% | 100% | **Improved** |
| Functions | 50% | *unchanged — not retested this cycle* | Needs Practice |
| Lists | 100% | 100% | Strength (never touched — already strong) |

A single reassessment cycle tests the root gap plus exactly one
affected concept (3 root + 1 affected + 1 application-transfer
question) — Functions genuinely wasn't re-measured in this cycle, and
the app's "Next Best Action" says so rather than claiming an
improvement it didn't measure.

## 9. Architecture

- **Frontend-first, deterministic-first.** Scoring, gap detection,
  recovery-path generation, and reassessment comparison are pure
  TypeScript functions in `frontend/src/services/` — no network call,
  no AI, each with its own test file.
- **Backend is a small, separate foundation.** A FastAPI service
  exposing a health check and a static subjects/concepts catalog —
  proof the two tiers can talk, not where the product's core logic
  lives today (see ARCHITECTURE.md's "Planned data flow" for the
  documented future move of scoring/diagnosis server-side).
- **One centralized state layer** (`studentStateService.ts`) is the
  single source of truth for "what has the student's mastery become" —
  both the original assessment and a later reassessment write to it,
  and the Dashboard is the only reader, which is what keeps every
  screen showing the same number for the same concept.
- **No auth, no database, no payments** — explicitly out of scope.
  State lives in `localStorage`/`sessionStorage`, clearly labeled as
  synthetic/demo data throughout the code.

Full detail: [ARCHITECTURE.md](ARCHITECTURE.md).

## 10. AI Role

**Deterministic logic handles:**
- Scoring (`scoringService.ts`)
- Concept mastery computation
- Prerequisite/root-gap analysis (`diagnosticEngine.ts`)
- Gap classification (root / concept / application / strength)
- Recovery-path ordering (`learningPathService.ts`)
- Reassessment before/after measurement and status classification
  (`reassessmentService.ts`)

**AI handles, when configured:**
- Turning an already-computed finding into plain-language explanation
- A short natural-language reflection on a before/after comparison
- Nothing else — the AI layer receives a sanitized summary of findings
  (concept names, mastery numbers, evidence strings), never raw
  question text or the power to change a route, score, or gap
  classification.

The AI is not responsible for and cannot override any deterministic
score, gap, or recommendation.

## 11. AI Reliability / Fallback

The `AIProvider` abstraction (`frontend/src/services/ai/`) has two
implementations behind one interface:

- **Mock** (default, no API key configured) — template-based, zero
  network calls, always works.
- **Remote** — a real LLM call with a 10-second timeout and explicit
  handling for every realistic failure mode (bad HTTP status, malformed
  JSON, missing fields, network failure).

Any Remote failure — or a response that doesn't validate against the
expected shape — falls through to the *same* deterministic template the
Mock provider uses, tagged so the UI can disclose it honestly: *"No AI
provider configured — this explanation was generated from your
deterministic assessment evidence"* or *"AI explanation temporarily
unavailable. The diagnosis above is based entirely on deterministic
assessment evidence."* This was verified live against a genuinely
unreachable endpoint, not just written into the code — see
[DEMO_GUIDE.md](DEMO_GUIDE.md#ai-fallback).

## 12. Technology Stack

| Layer | Stack |
|---|---|
| Frontend | React 19, Vite, TypeScript, plain CSS (design tokens, no Tailwind), React Router v7 |
| Backend | Python, FastAPI, Pydantic |
| Testing | Vitest (frontend, 120 tests), pytest (backend, 6 tests), Playwright (manual end-to-end verification) |
| PWA | `vite-plugin-pwa` — installable, app-shell caching |

## 13. Project Structure

```
frontend/
  src/
    pages/           route-level screens (Dashboard, Assessment, Diagnosis, LearningPath, LearningModule, Reassessment, Settings)
    services/        deterministic engines (scoring, diagnosticEngine, learningPathService, reassessmentService, dashboardService, studentStateService) + services/ai/
    components/ui/   shared design-system components
    data/            question banks, lessons, the documented demo answer key
    constants/       thresholds, the concept prerequisite graph
    types/           shared TypeScript contracts
  vercel.json        SPA deployment config
backend/
  app/
    api/v1/          health, subjects endpoints
    core/            environment-driven settings (CORS, etc.)
    data/, models/   the static Python subject/concept catalog
  tests/             pytest suite
  Procfile           PaaS start command
README.md, ARCHITECTURE.md, DEVELOPMENT_STATUS.md, DEMO_GUIDE.md, EVALUATION_EVIDENCE.md
```

## 14. Local Setup

Prerequisites: Node 20+, Python 3.11+.

### Backend
```bash
cd backend
python -m venv venv
source venv/Scripts/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API at `http://localhost:8000/api/v1` (`/health`, `/subjects`).

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App at `http://localhost:5173`. The core product (Assessment → Diagnosis
→ Recovery Path → Learning → Reassessment → Dashboard) works fully
without the backend running — it's frontend-only/mock-based by design at
this stage (see [Architecture](#9-architecture)).

## 15. Environment Variables

Copy each `.env.example` to `.env` — **no real values are committed
anywhere in this repository.**

**Frontend** (`frontend/.env`):

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | Backend base URL |
| `VITE_AI_API_KEY` | *(empty)* | Leave unset to run entirely on the deterministic Mock AI provider |
| `VITE_AI_API_URL` | `https://api.openai.com/v1/chat/completions` | Any OpenAI-compatible chat-completions endpoint |
| `VITE_AI_MODEL` | `gpt-4o-mini` | Model name passed to that endpoint |

**Backend** (`backend/.env`):

| Variable | Default | Purpose |
|---|---|---|
| `APP_NAME` | `Learning Gap Detective API` | Returned by `/health` |
| `ENVIRONMENT` | `development` | Returned by `/health` |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed origins — set to your deployed frontend URL in production |

## 16. Testing

```bash
# Frontend — 120 tests
cd frontend && npx vitest run

# Backend — 6 tests
cd backend && venv/Scripts/python.exe -m pip install -r requirements-dev.txt
cd backend && venv/Scripts/python.exe -m pytest tests/
```

Tests exercise real function output (scoring math, gap classification
thresholds, reassessment status logic, AI fallback behavior) — not
placeholder assertions.

## 17. Demo

See [DEMO_GUIDE.md](DEMO_GUIDE.md) for the full script. Short version:
**Settings → Demo Controls → Start Demo Journey**, then **Fill Demo
Answers** on the Assessment and Reassessment screens. Target duration:
3-5 minutes for the full journey.

## 18. Deployment

**Nothing is deployed by default — this documents how to.**

### Frontend → Vercel
Root directory `frontend/`. Build command `npm run build`, output
`dist` (already codified in `frontend/vercel.json`, including the SPA
rewrite rule every client-routed page needs). Set `VITE_API_BASE_URL`
and, optionally, the `VITE_AI_*` variables as Vercel environment
variables.

### Backend → any Python host (Render, Railway, Fly.io, etc.)
Root directory `backend/`, `pip install -r requirements.txt`, start
command `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (codified in
`backend/Procfile`). Set `CORS_ORIGINS` to the deployed frontend's exact
URL. `/api/v1/health` is a valid platform health-check target.

There are no secrets to provision on the backend — it holds a static
concepts catalog, nothing sensitive.

## 19. PWA

Installable on desktop and mobile: a complete manifest (name, icons,
standalone display, theme/background color), a generated service worker
that precaches the app shell, and a correct viewport configuration —
verified against a real production preview server, not just config
inspection. No custom offline data-sync was added; the goal is a
reliable installable shell, not offline-first data.

## 20. Scalability

Realistic, currently-unbuilt extension points:

- **Additional subjects** — the concept-graph/question-bank/lesson
  structure is already subject-parametrized (`subject: "Python"` is a
  field, not a hardcoded assumption); adding a second subject is
  primarily a content-authoring task, not an architecture change.
- **Teacher/classroom dashboard** — the per-student diagnostic evidence
  already exists in a structured form; aggregating it across a class is
  a new read view, not new diagnostic logic.
- **LMS integration** — the backend's API surface is intentionally
  minimal today; the documented "Planned data flow" in
  ARCHITECTURE.md describes moving scoring/diagnosis server-side, which
  is the natural prerequisite for LMS interop.
- **Richer, larger question banks** — would improve percentage
  granularity (see the honesty note in [Example](#7-example)) and let
  application-gap detection run on more concepts.
- **Adaptive assessment** (question selection responding to answers in
  real time) — not implemented; today's assessment is a fixed set.
- **Classroom/longitudinal analytics** — would require persisting
  assessment history server-side; today's state is per-browser.

These are explicitly future items, not implied current capabilities.

## 21. Current Limitations

- **Synthetic/demo data.** No real student accounts; state lives in
  browser storage, clearly labeled as demo data throughout the code.
- **Python only**, and only 9 concepts, currently.
- **Limited question bank** — 1-2 questions per concept in the original
  assessment, which caps diagnostic percentage granularity (see
  [Example](#7-example)).
- **No production authentication** — by design, out of scope for this
  build.
- **No LMS integration.**
- **AI is optional and narrative-only** — richer, more varied
  explanations depend on a configured AI provider; the deterministic
  product is fully functional without one.
- **A single reassessment cycle retests the root gap plus only one
  affected concept** — a second affected concept needs a second cycle
  (see [Before/After](#8-before--after)).
- **The Dashboard's "AI Insight" narrative text and `nextBestAction`
  copy are still static** — only the numeric mastery/status data is
  wired to real evidence today.
- **The backend's endpoints aren't yet consumed by the real product
  flow** — the core loop is frontend-only/mock-based by design at this
  stage (see [Architecture](#9-architecture)).
- **No CI pipeline** runs the test suite automatically yet.
- **Only one concept (Conditional Logic) has a fully authored
  interactive lesson**; the module shell is concept-agnostic.

---

See [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md) for the full
phase-by-phase build history, [ARCHITECTURE.md](ARCHITECTURE.md) for
implementation detail, [DEMO_GUIDE.md](DEMO_GUIDE.md) for the live demo
script, and [EVALUATION_EVIDENCE.md](EVALUATION_EVIDENCE.md) for where
to find evidence for each hackathon evaluation criterion.
