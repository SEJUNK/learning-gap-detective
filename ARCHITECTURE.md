# Architecture

## Overview

Learning Gap Detective is a two-tier application: a React + TypeScript
frontend that owns essentially all of the product's real logic today,
and a small, separate FastAPI backend that proves the two tiers can talk
(a health check and a static subjects/concepts catalog) but doesn't yet
carry the diagnostic pipeline — see "Planned data flow" near the bottom
of this document for the documented path to moving that server-side.
There is no database or auth; student state lives in the browser
(`localStorage`/`sessionStorage`), explicitly and consistently labeled
as synthetic/demo data throughout the code.

### The core loop, end to end

```
┌──────────────┐   ┌───────────────┐   ┌──────────────────┐
│  Assessment  │──▶│  Scoring +    │──▶│  Diagnostic       │
│  (12 Qs)     │   │  Evidence     │   │  Engine           │
└──────────────┘   │  (deterministic) │  (deterministic — │
                    └───────────────┘   walks the concept  │
                                         prerequisite graph)│
                                         └─────────┬────────┘
                                                    │
                              ┌─────────────────────┴─────────────────────┐
                              ▼                                           ▼
                    ┌──────────────────┐                        ┌──────────────────┐
                    │  AI narration     │                        │  Recovery Path    │
                    │  (optional,       │                        │  generation       │
                    │  explains the     │                        │  (deterministic)  │
                    │  finding — never  │                        └─────────┬─────────┘
                    │  decides it)      │                                  ▼
                    └──────────────────┘                        ┌──────────────────┐
                                                                  │ Learning Module   │
                                                                  │ (targeted lesson) │
                                                                  └─────────┬─────────┘
                                                                            ▼
                                                                  ┌──────────────────┐
                                                                  │ Reassessment      │
                                                                  │ (new questions,   │
                                                                  │ same scoring)     │
                                                                  └─────────┬─────────┘
                                                                            ▼
                                                                  ┌──────────────────┐
                                                                  │ Before/After +    │
                                                                  │ centralized state │
                                                                  │ → Dashboard       │
                                                                  └──────────────────┘
```

Every arrow above is a real function call in `frontend/src/services/`,
each independently unit-tested — not a conceptual diagram describing
something aspirational. The detailed section for each stage below names
the exact file.

## Frontend architecture (`frontend/`)

- **React + Vite + TypeScript**, no Tailwind — hand-written CSS using
  design tokens (CSS custom properties) defined in `src/styles/tokens.css`.
- **Folder structure**, by responsibility rather than by feature:
  - `api/` — a thin `fetch` wrapper (`client.ts`) plus one module per
    backend resource (`health.ts`, `subjects.ts`), each responsible for
    mapping backend DTOs (snake_case) to frontend types (camelCase). No
    component ever calls `fetch` directly.
  - `components/brand/` — `LogoMark` and `Logo` (full/compact), the
    visual identity.
  - `components/layout/` — navigation shell pieces: `DesktopSidebar`,
    `TopBar` (desktop), `MobileHeader`, `MobileNavigation` (mobile).
  - `components/ui/` — the reusable design-system primitives (full list
    below).
  - `layouts/AppShell.tsx` — chooses which shell to render based on
    viewport (see Responsive strategy below).
  - `pages/` — route-level screens: `Dashboard/` (the real Student
    Intelligence Dashboard — see below), `ComingSoonPage` (shared
    placeholder for every nav destination not yet built), `DesignSystemPage`
    (component showcase, dev-only).
  - `routes/paths.ts` — centralized route path constants, consumed by
    `App.tsx` and the nav components so paths are never duplicated.
  - `types/` — shared TypeScript interfaces: `subject.ts` mirrors backend
    Pydantic models; `dashboard.ts` is the frontend-owned contract for
    the dashboard's mock data, shaped so a real API response can drop in
    without touching components.
  - `constants/` — `navigation.ts` (sectioned desktop nav + mobile nav
    config), `gapStatus.ts` (the root/application/practice/strength
    severity vocabulary), `mockUser.ts`, API base URL.
  - `data/` — `dashboardMockData.ts`: the seed/starting-state dataset a
    fresh student sees before ever taking a real assessment. No
    component embeds mock values directly.
  - `services/` — `dashboardService.ts`: an async `getDashboardData()`,
    shaped exactly like a future real fetch, that merges the seed data
    above with real per-concept mastery overrides written by an actual
    assessment or reassessment (see "End-to-End Integration + Product
    Hardening" further down this document for how that merge works —
    it's the mechanism that keeps the Dashboard from ever showing a
    different number than Diagnosis/Recovery Path/Reassessment for the
    same concept). `getDashboardData()` itself is the seam where a
    backend `/dashboard` endpoint would plug in later.
  - `hooks/useViewport.ts` — `useIsMobile()` via `matchMedia`, the single
    source of truth for the responsive breakpoint.

### Component hierarchy

```
App
└─ AppShell (per-route wrapper, picks shell by viewport)
   ├─ Desktop: DesktopSidebar (Logo, sectioned NavLinks, collapse toggle)
   │           + TopBar (title, notification IconButton, Avatar, profile menu)
   └─ Mobile:  MobileHeader (compact Logo, notification, Avatar)
               + MobileNavigation (5-item bottom bar)
   └─ <page content>
      ├─ PageHeader (page title + description)
      ├─ SectionHeader (per-section title within a page)
      └─ Card-based primitives: StatCard, ConceptCard, InsightCard,
         Badge/StatusBadge, ProgressBar/ProgressRing, Tabs, Modal,
         EmptyState/LoadingState/ErrorState, Input, Avatar, Tooltip
```

Every UI primitive lives in `components/ui/` and is composed by pages —
pages never redefine visual patterns inline.

### Design system approach

- **Tokens, not hardcoded values.** `src/styles/tokens.css` defines every
  color, spacing step, radius, shadow, and duration as a CSS custom
  property, including a dedicated four-color **gap-severity** scale
  (`--color-gap-root/application/practice/strength`) with light- and
  dark-mode values. Components reference tokens, never literals.
- **Status is never color-only.** `constants/gapStatus.ts` is the single
  source of truth pairing each severity with an icon (`AlertOctagon` /
  `AlertTriangle` / `RotateCcw` / `CheckCircle2`) and a label alongside
  its color. `StatusBadge`, `ConceptCard`, and `InsightCard` all read
  from this one config so the pairing can't drift.
- **Brand**: `LogoMark` composes two Lucide icons (a magnifying glass
  with a small graduation-cap badge) rather than custom SVG artwork;
  `Logo` wraps it with the wordmark and exposes a `compact` variant for
  the collapsed sidebar and mobile header.
- **Motion is decorative, never load-bearing.** Verified during this
  phase: an early version of the page-transition animation started
  content at `opacity: 0`, and in a headless-browser check that
  animation never ticked, leaving real content invisible even though it
  was correctly in the DOM. Fixed by animating `transform` only —
  content's default state is always fully visible; animation is layered
  on top, never a prerequisite for visibility. The same principle is
  applied to the modal's entrance animation.
- Global `prefers-reduced-motion: reduce` handling in `tokens.css`
  collapses all animation/transition durations to near-zero.
- **Flex containers holding wide/scrollable content need explicit
  `min-width: 0` on every item in the chain.** This phase's mobile
  verification caught real horizontal overflow on the assessment screen,
  traced to `.app-content-mobile` in `layouts/AppShell.css`: it's a
  `flex: 1` item of the mobile shell's flex column, but it also carries
  the shared `.app-content` class (`margin: 0 auto`, meant for the
  desktop-centered layout), whose auto margins made it opt out of flex
  stretch and shrink-to-fit its widest descendant instead — invisible
  until a page had a wide-enough child (the question navigator's
  horizontal scroll strip) to expose it. Fixed by giving
  `.app-content-mobile` its own `min-width: 0; width: 100%; max-width:
  100%; margin: 0;`, overriding the shared class for the mobile case.
  The lesson generalizes: a horizontally-scrollable strip inside a flex
  layout is silently safe only if every flex-item ancestor between it
  and the viewport has `min-width: 0`.

### The Student Intelligence Dashboard (`pages/Dashboard/`)

The first real product screen. Structure:

```
DashboardPage.tsx            assembles all 8 sections, owns load state
sections/
  LearningMapSection.tsx      concept grid + click-to-inspect detail panel
  RecoveryPathSection.tsx     vertical stepper
```

Simpler sections (Learning Health, Detected Gaps, AI Insight, Next Best
Action, Performance, Activity) are composed inline in `DashboardPage.tsx`
from existing/new `components/ui/` primitives rather than given their own
files — they're each a single reusable component mapped over data, not
enough distinct layout logic to warrant a section file. `LearningMapSection`
and `RecoveryPathSection` got their own files because they own local
interaction state (selected concept; step completion) and nontrivial
layout (connector lines, detail panel).

**New reusable primitives added this phase** (extending, not duplicating,
the Phase 1 set):
- `GapCard` — status kicker + concept + mastery + explanation + CTA. New
  because no existing component matched this diagnostic-card shape.
- `ActionCard` — a single prominent "what to do next" panel (icon,
  eyebrow, title, rationale, CTA button). New for the same reason.
- `TrendChart` — a small hand-rolled inline-SVG line/area chart (no
  charting library added, to avoid an unnecessary dependency for one
  small chart). The area fill and data-point dots render immediately;
  only the connecting line's draw-in is animated, and if that animation
  never ticks the dots and area still communicate the trend — applying
  the "motion is never load-bearing" rule from Phase 1 to a chart.
- `ActivityTimeline` — a compact icon + text + timestamp list.

**Extended, not forked**: `ConceptCard` gained optional `isFoundational`,
`selected`, and `onSelect` props (keyboard-accessible: `role="button"`,
`tabIndex`, Enter/Space handling, `aria-pressed`) instead of a new
"SelectableConceptCard" component. `InsightCard` gained optional
`eyebrow`, `paragraphs` (multi-paragraph alternative to `description`),
and `actionLabel`/`actionRoute` instead of a new "CtaInsightCard".
`StatCard` gained an optional plain `subLabel` (e.g. "of 20 concepts")
for metrics that aren't a directional trend, alongside its existing
`trend` prop. All three extensions are backward compatible — every
Phase 1 call site (the `/design-system` showcase) still works unchanged.

**Data flow**: `DashboardPage` calls `services/dashboardService
.getDashboardData()` (async, mock-backed) in a `useEffect`, with real
`loading` / `error` / `ready` states — no artificial delay. Every number
on the page traces back to one typed object in
`data/dashboardMockData.ts`; no section hardcodes a value in JSX.

**Concept detail interaction**: clicking (or Enter/Space-selecting) a
`ConceptCard` in the Learning Map toggles an inline detail panel below
the grid — recent performance, prerequisites, and affected concepts —
rather than a hover-only tooltip, so the same interaction works on
touch devices with no hover state.

**Visual hierarchy**: sections are rendered in one fixed order — Learning
Health → Detected Gaps → AI Insight → Next Best Action → Learning Map →
Recovery Path → Performance/Activity — because the product's stated
priority ranking and its required mobile ordering are the same sequence.
That meant no per-breakpoint section-reordering logic was needed;
responsiveness instead comes from each section's own grid collapsing
(4 stat columns → 2 → 1; 3 gap-card columns → 2 → 1) and the
Performance/Activity two-column row stacking to one column at ≤768px.
The top four sections also carry a slightly larger section-title type
size (`.dashboard-section-primary`) so importance reads through
typography, not just position.

### Responsive strategy

The desktop and mobile shells are **structurally different components**,
not one layout resized with media queries:

- Desktop (`≥769px`): persistent, collapsible `DesktopSidebar`
  (sectioned nav: Main / Insights / Settings, collapse state persisted to
  `localStorage`) + `TopBar` (page title, notifications, avatar + profile
  dropdown), content constrained to a max width and centered.
- Mobile (`≤768px`): compact `MobileHeader` (mark + notifications +
  avatar) + fixed `MobileNavigation` bottom bar with exactly 5 primary
  destinations (Home/Assess/Map/Path/Progress — Insights and Settings are
  reachable from within screens, not competing for bottom-bar space),
  content full-width with padding reserved for the bottom bar and
  `env(safe-area-inset-bottom)` respected.

`AppShell` picks the shell at render time via `useIsMobile()`. Desktop
and mobile navigation are both driven by `constants/navigation.ts`
(`NAV_SECTIONS` / `MOBILE_NAV_ITEMS`) so entries never drift apart.
Verified with headless-browser checks at 1440/1280/768/390/375px: zero
horizontal overflow, correct shell rendered at every width, zero console
errors.

### PWA architecture

- `vite-plugin-pwa` is configured in `vite.config.ts` with
  `registerType: "autoUpdate"`, generating a service worker
  (`sw.js`) and `manifest.webmanifest` on every production build.
  Verified in this phase by inspecting the built
  `dist/manifest.webmanifest`: correct `name`/`short_name`, `description`,
  `display: "standalone"`, `theme_color: "#4338ca"`,
  `background_color: "#fafafa"`, and both 192×192 and 512×512 PNG icons
  (the 512 also registered with `purpose: "maskable"`).
- `index.html` carries the required `<meta name="viewport">` and
  `<meta name="theme-color">` tags.
- Icons are currently a generated placeholder mark
  (`frontend/scripts/generate_icons.py`) — swap for real brand assets
  before shipping; regenerate by re-running that script.
- Not yet done: actual "Add to Home Screen" install-flow testing in a
  real browser (only the technical prerequisites were verified), offline
  fallback page, background sync for assessment submissions taken
  offline, install-prompt UI.

## Backend architecture (`backend/`)

- **FastAPI**, versioned API under `/api/v1`.
- `app/main.py` — app instance, CORS (origins from env), router
  registration.
- `app/core/config.py` — `pydantic-settings`-based config read from
  environment variables / `.env` (see `.env.example`). No hardcoded
  environment-specific values in application code.
- `app/models/` — Pydantic schemas that double as the API's typed
  contract (e.g. `Subject`, `Concept`).
- `app/data/` — static/mock domain data (`python_subject.py` seeds the
  Python subject's 9 concepts with prerequisite edges). This is the seam
  where a real database would plug in later — services should depend on
  an interface this module satisfies, not on the module directly, once
  persistence is introduced.
- `app/services/` — placeholder package for the deterministic business
  logic layer described below. Empty in this phase.
- `app/api/v1/` — route handlers only; no business logic lives here.

### Why concepts carry `prerequisite_ids` already

The core product value is root-cause tracing ("you're struggling with
loops because conditions aren't solid"). Modeling prerequisite edges into
the concept graph from day one — even before any scoring logic exists —
means the gap-detection service can be built directly on this data
without a schema migration later.

## Data flow (current, foundation-only)

```
Browser (React)
  → GET /api/v1/health         → renders connectivity status
  → GET /api/v1/subjects       → renders seeded concept counts
```

Both calls hit FastAPI directly; there is no auth, no database, no
external service. This is intentionally minimal — it exists to prove the
two tiers can talk to each other, not to demonstrate product features.

## The Diagnostic Assessment (`frontend/src/pages/Assessment/`, `services/`)

This phase built the assessment end-to-end **on the frontend only** —
scoring and evidence generation are deterministic TypeScript, not a
backend call, so the pipeline below runs entirely client-side today:

```
AssessmentPage (question-by-question UI, local state)
  → on submit: scoreAssessment(questions, responses)      [services/scoringService.ts]
      - deterministic, pure function — no LLM, no randomness
      - per-question correctness, per-concept %, per-difficulty %,
        confidence-pattern detection (high-confidence-wrong,
        low-confidence-right, etc.)
  → buildAssessmentEvidence(state, questions, scoring)     [services/evidenceService.ts]
      - assembles the structured AssessmentEvidence object: overall
        score, concept scores, correct/incorrect/unanswered question
        lists (each carrying its explanation + prerequisite concepts),
        confidence patterns, and a concept → prerequisite map
      - purely a restructuring of scoring output + question metadata;
        no interpretation or "why" is added at this layer
  → evidence handed to /diagnosis via router state, and mirrored into
    sessionStorage (services/assessmentStateService.ts) so a refresh on
    the diagnosis screen doesn't lose it
```

**Why this lives in `services/`, not inside `AssessmentPage.tsx`**: the
spec requires scoring to be a reusable, independently testable function,
never logic embedded in a component. `scoringService.ts` and
`evidenceService.ts` take plain data in and return plain data out — they
import nothing from React — which is also what makes them portable to a
future backend endpoint (`POST /api/v1/assessments/submit`) essentially
unchanged, just moved server-side and wired to persistence.

**State persistence**: `services/assessmentStateService.ts` wraps
`localStorage` (in-progress `AssessmentState`, keyed so a page refresh
mid-assessment resumes rather than restarts) and `sessionStorage` (the
completed evidence object, as a fallback to router state). All reads/
writes are try/caught — a storage failure degrades to in-memory state
rather than crashing the assessment. This is the seam a real backend
persistence layer replaces later; nothing else in the assessment depends
on *how* state is stored, only on the load/save/clear function shapes.

**The concept prerequisite graph** (`constants/conceptGraph.ts`) is the
canonical source every question's `prerequisiteConcepts` field derives
from — the same relationships (Variables → Data Types → Conditions →
Loops → Functions → OOP; Lists/Dictionaries support Functions;
Exceptions associates with Functions) that the dashboard's mock concept
mastery data already encodes. The two aren't yet unified into one
shared module (dashboard mock data predates this phase); that's a
natural follow-up once a backend owns this data.

**Question bank quality**: all 12 questions
(`data/assessmentQuestions.ts`) were manually reviewed — see the
distribution rationale documented in that file's header comment — for
exactly one unambiguous correct answer, an explanation that actually
matches that answer, and a concept/prerequisite/difficulty mapping
consistent with the graph, rather than generated and trusted blindly.

## AI Learning Diagnosis (`frontend/src/services/`, `pages/Diagnosis/`)

The core differentiating feature. Entirely frontend, continuing the
pattern from Phases 2–3. The pipeline:

```
AssessmentEvidence (Phase 3's output)
  → analyzeDiagnosticEvidence(evidence)          [services/diagnosticEngine.ts]
      - 100% deterministic, no LLM call anywhere in this file
      - root-gap detection: a concept below CRITICAL_GAP_THRESHOLD is only
        ever called a root gap if at least one dependent concept (per the
        prerequisite graph) is ALSO not solid, using question-level
        evidence (incorrect questions in the dependent that explicitly
        list the weak concept as a prerequisite) to strengthen the case —
        never inferred from one low score alone
      - concept-gap detection: a weak concept whose OWN prerequisites are
        fine — the problem doesn't trace to an earlier concept
      - application-gap detection: conceptual-question accuracy vs.
        application-question accuracy compared per concept (only when
        both buckets have evidence — no claim without both data points)
      - strength detection, confidence-pattern detection (high-confidence
        wrong answers)
      - every finding carries a confidence score (0-1, always < 1 — the
        engine never claims certainty) and hedged evidence strings
        ("Evidence suggests…", "This pattern may indicate…")
      → DiagnosticEvidence (rootGaps, conceptGaps, applicationGaps,
        strengths, confidenceInsight, prerequisiteGraph)
  → toAIInputEvidence(diagnosticEvidence)         [services/ai/aiInputMapper.ts]
      - sanitizes/bounds what the AI layer is allowed to see: concept
        names, mastery numbers, already-computed findings and their
        evidence strings — never raw question text, answer selections,
        or student identifiers beyond a label
  → AIProvider.generateDiagnosis(aiInput)         [services/ai/]
      - MockAIProvider (default — no API key needed) or RemoteAIProvider
        (real LLM, env-configured) — see AI provider abstraction below
      → StructuredDiagnosis (headline, summary, rootCause, applicationGaps,
        strengths, recommendations, learningSequence, confidenceInsight,
        source: "ai" | "mock" | "fallback")
  → validated (isValidStructuredDiagnosis) — invalid or failed calls fall
    back to the same deterministic template MockAIProvider uses, tagged
    "fallback" instead of "mock"
  → DiagnosisPage renders both DiagnosticEvidence (facts: which concept,
    what mastery, what's affected — decided deterministically) and
    StructuredDiagnosis (narrative: why, framed in plain language —
    decided by AI where available, template-generated otherwise)
```

**Centralized thresholds** (`constants/diagnosisThresholds.ts`):
`CRITICAL_GAP_THRESHOLD` (55), `DEVELOPING_THRESHOLD` (75),
`STRONG_THRESHOLD` (85), plus the application-gap split constants and
question-type bucketing (`conceptual`/`code_output` = conceptual;
`application`/`debugging`/`reasoning` = application). Nothing in the
engine compares a mastery number against a magic literal.

**Why deterministic engine and AI layer are separate files, not one
service**: the engine is the thing this codebase can unit-test
exhaustively and trust completely (28 tests). The AI layer is the thing
that might fail, return nonsense, or not be configured at all — keeping
it a separate, swappable, validated boundary is what makes "the app must
still work without an API key" actually true rather than aspirational.

### AI provider abstraction (`services/ai/`)

- `AIProvider` — one-method interface (`generateDiagnosis`), so nothing
  outside this folder knows or cares which implementation is active.
- `MockAIProvider` — the default. No network call; templates a genuinely
  evidence-grounded `StructuredDiagnosis` from the real deterministic
  findings it's given (`templatedDiagnosis.ts`) — every sentence
  references the actual concept/mastery/affected-concepts for *this*
  evidence, never a hardcoded example. This is what runs in this repo
  today (no `VITE_AI_API_KEY` configured) and what all verification in
  this phase exercised.
- `RemoteAIProvider` — a real OpenAI-compatible chat-completions call,
  configured entirely via `VITE_AI_API_KEY` / `VITE_AI_API_URL` /
  `VITE_AI_MODEL` (see `frontend/.env.example`). No key is hardcoded
  anywhere. Its system prompt explicitly tells the model it does not
  compute scores or decide gaps — only explains conclusions already
  reached — and demands a JSON-only response matching
  `StructuredDiagnosis`.
- `aiProviderFactory.getAIProvider()` — the single place that decides
  Mock vs. Remote, based purely on whether an API key is configured.
- `diagnosisValidator.isValidStructuredDiagnosis()` — checked against
  every provider response before it's trusted, real or mock.
- `services/diagnosisService.getDiagnosis()` — the orchestrator. Wraps
  the provider call in try/catch; a network failure, non-2xx response,
  malformed JSON, or a shape that fails validation all fall through to
  the exact same template generator `MockAIProvider` uses (tagged
  `source: "fallback"` instead of `"mock"` so the UI can be transparent
  about which happened). **Known limitation, documented rather than
  worked around**: calling an LLM directly from the browser means the
  API key would ship to every client — acceptable for this hackathon-
  speed MVP (opt-in via env, never committed) but the documented next
  step is routing this same request shape through a backend proxy
  instead of removing the abstraction.

### Diagnosis UI (`pages/Diagnosis/`)

```
DiagnosisPage.tsx                 orchestrates load state, assembles all 7 sections
components/
  DiagnosisLoadingState.tsx       real stage checklist (services/diagnosisService's onStep callback — not a fake timer)
  RootFindingPanel.tsx            Section 2 hero: the single most important finding, unmissable
  EvidenceList.tsx                Section 3: hedged evidence bullets
  LearningGapMap.tsx              Section 4: prerequisite graph, desktop columns / mobile vertical flow, click-to-inspect
```

Simpler sections (Diagnostic Summary, Other Findings, AI Explanation,
confidence callout, Recommendation) are composed inline in
`DiagnosisPage.tsx` by reusing Phase 1–3 primitives directly —
**`StatCard`, `GapCard`, `InsightCard`, and `ActionCard` map almost
exactly onto what the spec asked for**, so nothing new was built for
them. Only `RootFindingPanel` (nothing existing is built to be a page's
visual centerpiece at hero scale) and `LearningGapMap` (a genuinely new
graph/flow visualization) are new components.

**Which concept leads the page** is decided by `DiagnosisPage`, from
`DiagnosticEvidence` alone (deterministic): the top root gap, else the
top concept gap, else the top application gap, else "no major gaps."
The AI's `StructuredDiagnosis` supplies the narrative explanation for
whichever finding that is — the AI never chooses *what* the main finding
is, only *how to explain it in words*.

**Confidence is surfaced, not just computed** (added in the final
polish phase): every finding has always carried a 0-1 confidence score,
but `RootFindingPanel` didn't receive or show it until this fix. Below a
0.6 threshold, the kicker label itself switches from a definite claim
("Root Gap Detected") to a hedged one ("Possible Root Gap") — the
component's `KIND_CONFIG` carries both phrasings — and a plain-language
tier ("High confidence" / "Moderate confidence" / "Preliminary signal")
sits next to it always, with the raw percentage available as a tooltip.
This is what actually makes the evidence-vs-interpretation distinction
visible on the page, rather than only implied by the hedged prose in the
evidence bullets below it.

**Loading experience**: `DiagnosisLoadingState` subscribes to
`getDiagnosis`'s real `onStep` callback (`reviewing` → `mapping` →
`patterns` → `building`), not a `setTimeout` sequence. Since the
deterministic stages are near-instant and the mock AI call resolves
immediately too, the whole checklist can complete in well under a
second — that's honest behavior, not a bug; a real `RemoteAIProvider`
call would naturally make the "Finding patterns" step visible for as
long as the network call actually takes.

**A content-coverage limitation, documented rather than routed around**:
the current 12-question bank (Phase 3) gives most concepts only 1
question, so the application-gap detector (which needs both a
conceptual-type and an application-type question for the same concept)
can only be organically triggered by a live user on **Loops**
(`code_output` + `debugging`). The algorithm itself is general-purpose
and fully verified against richer synthetic fixtures in
`diagnosticEngine.test.ts`; this is a question-bank content gap, not an
engine limitation.

## Personalized Recovery Path (`frontend/src/services/learningPathService.ts`, `pages/LearningPath/`, `pages/LearningModule/`)

The product's answer to "don't just tell me what's wrong — give me the
shortest path to fix it." Fully deterministic, no AI call:

```
DiagnosticEvidence (Phase 4's output)
  → generateLearningPath(diagnosticEvidence)     [services/learningPathService.ts]
      - anchors on the primary finding: the top root gap, else the top
        concept gap, else the top application gap, else none — same
        precedence DiagnosisPage already uses for its Main Finding
      - if the primary is a root gap, its affectedConcepts become
        supporting steps, reordered foundational-first via
        computeConceptLevelIndex (the same prerequisite-graph topology
        util the Learning Gap Map uses — extracted this phase from
        pages/Diagnosis/components/LearningGapMap.tsx into
        constants/conceptGraph.ts so both consumers share one
        implementation instead of two copies of a level-computation
        algorithm)
      - deduplicates concepts (a concept already covered by an earlier
        step is never added again, even if it also shows up as an
        application gap)
      - capped at MAX_SUPPORTING_STEPS (2) supporting steps, so the
        total path — primary + supporting + a final challenge step —
        stays at 3-5 steps by construction, never a full curriculum
      - every step's `reason` is evidence-specific (pulled from the
        underlying finding's own evidence bullets), while the path's
        overall `rationale` is the macro "why this path" explanation —
        deliberately two different sentences, not the same paragraph
        shown twice
      → LearningPath (steps, time breakdown, expected outcomes, rationale)
  → computeStepStatuses(steps, completedIds, inProgressId)   [same file, pure]
      - "completed" if the step id is in completedIds, "in_progress" if
        it's the currently active step, "available" if every
        prerequisite id is completed, "locked" otherwise
      - reapplied to a freshly generated path on every page load —
        progress lives in localStorage (services/learningPathStateService.ts,
        keyed by pathId so a new assessment naturally starts fresh
        progress rather than inheriting an old path's completed steps)
        while the path's shape itself is always regenerated from the
        latest diagnosis, never persisted stale
```

**Why this needs no AI call today**: every piece of text the spec asks
for (reason, objective, description) is already fully determined by the
finding it's built from — there's no open-ended judgment call an LLM
would add value to yet. The `AIProvider` abstraction from Phase 4
remains available for a future enhancement (e.g. varying the encouragement
tone, or generating a worked application-scenario example per step) —
see "AI role" in `DEVELOPMENT_STATUS.md` — but nothing in this phase's
scope required it, and the hard rule holds regardless: an AI layer would
only ever reword `reason`/`objective`, never touch step order,
prerequisites, duration, or status.

### Route rename (Phase 5)

`ROUTES.recoveryPath` changed value from `/recovery-path` to
`/learning-path` (the spec's required URL for the real page). Confirmed
via grep that the URL was referenced only through the `ROUTES` constant
everywhere in the codebase (no hardcoded string literals), so every
existing CTA (dashboard, diagnosis screen, sidebar nav) correctly lands
on the real `LearningPathPage` with no separate/dangling route needed.

## Interactive Learning Module (`pages/LearningModule/`, `data/lessons/`)

`/learning/:conceptId` — one dynamic route, still, but now a real
"micro-learning recovery session" rather than a functional-but-content-
light shell. Structure:

```
Recovery Path step "Start Learning"
  → /learning/:conceptId (router state carries { stepId, pathId })
  → LearningModulePage
      1. loads AssessmentEvidence independently (router state →
         sessionStorage fallback, same pattern as every other page) and
         runs analyzeDiagnosticEvidence itself — the "why this matters"
         evidence (related-mistake count, affected concepts) is computed
         live from the real diagnosis, never hardcoded lesson content;
         a direct visit with no prior assessment still renders the
         lesson, just without fabricated evidence numbers
      2. looks up Lesson content via getLesson(conceptId)             [data/lessons/]
      3. runs a 6-stage state machine: why → learn → practice →
         challenge → check → complete (ModuleProgressIndicator renders
         the 5 visible stages; "complete" is the terminal screen)
      4. every interactive moment (3 practice questions, 1 application
         challenge, 2 understanding-check questions) is one shared
         shape — InteractiveQuestion (options, correctAnswer,
         correctFeedback, misconceptionFeedback keyed by wrong-option
         index) — rendered by one InteractiveQuestionCard, backed by the
         pure checkAnswer() function                                  [services/learningModuleService.ts]
      5. on reaching "complete", calls markStepCompleted(pathId, stepId)
         — the same Phase 5 progress store — so the recovery path's
         step-unlocking is exercised by finishing a real lesson now,
         not just a placeholder "mark complete" button
```

**Lesson content is data, not JSX** (`data/lessons/conditionalLogicLesson.ts`,
looked up via `data/lessons/index.ts`'s `getLesson()`): explanation,
worked example, and all six interactive questions are one typed `Lesson`
object. Adding a second concept's lesson is one new content file plus
one new entry in the lookup map — `LearningModulePage` and every
component under `pages/LearningModule/components/` are concept-agnostic
already, since the Conditional Logic lesson is the only thing that
mentions "Conditional Logic."

**Manually reviewed for correctness**, matching the Phase 3 question-
bank bar: every `InteractiveQuestion` has exactly one unambiguous
correct answer and a misconception message for every wrong option. One
real content bug was caught and fixed during authoring — a draft
application-challenge option (`premium_member and order_value > 5000 or
emergency_flag`) was *logically identical* in Python to the intended
correct answer, since `and` binds tighter than `or`, making
`a and b or c` parse identically to `(a and b) or c`. Fixed by making
the explicit-parens form the single correct option and redesigning the
distractors around genuinely different (wrong) groupings, not a
precedence trivia trap.

**Simple deterministic adaptation** (no algorithm, just one rule, per
the spec's explicit "keep it simple" instruction): if practice question
1 is answered incorrectly, one `adaptiveReinforcement` screen (lesson
data, not generated) is shown before question 2; if all three practice
questions are answered correctly, a brief "you got all 3 right" note
replaces the neutral transition line before the Application Challenge.
Both branches are plain `if` statements on already-tracked answer
state — no scoring model, no adaptive engine.

**AI's role**: none, by design, same rule as Phase 5 — the base module
must work with zero network calls (hackathon reliability), and nothing
here required an LLM. The `AIProvider` abstraction remains available for
a future enhancement (personalizing explanations, generating additional
worked examples), but every word in the current lesson is authored data.

**Design-system promotions this phase**: `AnswerOptions` (previously
Assessment-only) moved to `components/ui/` and gained an optional
`revealAnswer`/`disabled` mode, since the module needs to show
correct/incorrect coloring after an answer while the Assessment must
never reveal correctness — same component, two call sites, no
duplication. A new `components/ui/CodeBlock` (with optional highlighted
lines) replaced `AssessmentPage`'s inline `<pre>` and is now the one
code-rendering treatment app-wide; its `overflow-x: auto` is scoped to
the block itself, which is what keeps a long code line from ever causing
page-level horizontal overflow on mobile.

## Targeted Reassessment + Improvement Measurement (`pages/Reassessment/`, `services/reassessmentService.ts`)

This is the phase that closes the loop the rest of this document
describes in pieces: Assessment → Diagnosis → Recovery Path → Learning
→ **Reassessment → Improvement Measurement → Next Action**. Every step
in that loop up to this one produces evidence; this step is the first
one that has to *compare* evidence across time and say, honestly,
whether it moved.

```
LearningModulePage completion screen "Verify My Improvement"
  → /reassessment (router state carries { evidence })
  → ReassessmentPage, 3-phase state machine: intro → in-progress → results
      1. loads the ORIGINAL AssessmentEvidence (router state →
         sessionStorage fallback, same pattern as every other page) and
         runs analyzeDiagnosticEvidence() on it — the reassessment is
         built FROM the original diagnosis, it does not repeat it
      2. pickPrimaryFinding(diagnostic)                                 [services/reassessmentService.ts]
           root gap concept > affected concept > application gap
           → null when there's nothing left to target (explicit empty
             state: "No targeted gap to reassess," not a blank screen)
      3. buildReassessmentQuestions(diagnostic)                         [services/reassessmentService.ts]
           3 root-concept questions + 1 affected-concept question +
           1 application/transfer question, capped at 5, deduplicated,
           pulled from data/reassessmentQuestions.ts — a SEPARATE
           question bank from the original assessment (same skills
           tested via different scenarios, never the exact same
           question twice)
      4. student answers, in-progress phase reuses AnswerOptions/
         CodeBlock/ProgressBar from the design system — no duplicate
         question-rendering component was created for this phase, and
         correctness is never revealed mid-assessment, same rule as the
         original Assessment
      5. submit confirmation ("Ready to see how you improved?") →
         computeReassessmentResult(context)                             [services/reassessmentService.ts]
           - pure function: original evidence + diagnostic evidence +
             reassessment questions + responses → ReassessmentResult
           - scoring is the SAME deterministic scoring already used for
             the original assessment — reassessment is never scored by
             the AI layer
      6. applyReassessmentResult(result) + saveLastReassessment(result)
           - persistence and dashboard update, see below
      7. results phase renders the before/after comparison and reflection
```

**The classification rule is centralized, not scattered**
(`classifyComparisonStatus(before, after)` in `services/reassessmentService.ts`,
reusing `STRONG_THRESHOLD` / `CRITICAL_GAP_THRESHOLD` from Phase 3's
`diagnosisThresholds.ts` rather than inventing parallel numbers):

```
difference = after - before

difference > 0 AND (after >= STRONG_THRESHOLD OR difference >= 20 points)
  → "improved"
after < CRITICAL_GAP_THRESHOLD
  → "needs_more_practice"
otherwise (flat score, small gain, or any regression)
  → "still_developing"
```

This is the one place in the codebase that decides whether a score
change counts as real improvement, and it is deliberately built to
support **both outcomes** — the test suite includes an explicit
regression case proving a score that goes *down* can never be
classified `"improved"`. The `ImprovementSummaryBanner`'s wording
(`"Your learning gap is closing."` / `"...improving, but there's more to
practice."` / `"...still developing."`) is driven entirely by this
result; there is no code path that upgrades the wording independent of
the classification.

**Application transfer is evidence-gated, not inferred**: the transfer
card only renders when `computeApplicationTransfer()` finds at least one
application-type question on *both* the original and the reassessment
side for the target concept. Either side missing → `applicationTransfer`
is `null` and the whole section is omitted — "your improvement carried
over to a new problem" is never claimed without a real before/after
application score to point to.

**Deterministic next action** (`determineNextAction()`, private to
`reassessmentService.ts`, same file as the classification rule so the
two stay in sync):

```
no primary finding at all         → recommend a full diagnostic
root gap still needs practice     → repeat the recovery path
root improved, transfer didn't    → practice application challenges
every targeted concept now strong → recommend a full diagnostic
otherwise                          → advance to the next weak affected concept
```

**Dashboard update is a read-time merge, not a second source of truth**
(`services/studentStateService.ts` + `services/dashboardService.ts`):
`applyReassessmentResult()` writes a small `{ concept: { mastery,
updatedAt } }` override map to `localStorage`. `dashboardService.
getDashboardData()` merges those overrides into the mock dataset at read
time — overridden concepts get the new mastery number and a "Updated
after targeted reassessment" label, and are only promoted to `strength`
status if the new score actually clears `STRONG_THRESHOLD`. Concepts
untouched by any reassessment are returned byte-for-byte unchanged. This
is the mechanism the spec's "centralized state/data layer, not
duplicated values" requirement maps to — there is exactly one place
mastery numbers live, and the dashboard reads through it rather than
keeping its own copy.

**AI's role**: identical shape to Phase 4's diagnosis reflection — the
`AIProvider` interface gained a second method,
`generateReassessmentReflection`, implemented by both `MockAIProvider`
and `RemoteAIProvider` (which now share one private `chatJSON()` helper
instead of duplicating the HTTP call). The reflection service receives
only `ReassessmentReflectionInput` — structured before/after numbers,
never raw question text — and can only narrate; it cannot change a
score, a status, or the next action. Every response is validated
(`reassessmentReflectionValidator.ts`) before use, with a guaranteed
deterministic fallback (`templatedReassessmentReflection.ts`) that
finds the strongest/weakest comparison by point difference and
describes it factually, including describing a regression honestly if
one exists — it is structurally incapable of inventing a concept or a
number that wasn't in its input.

**Known limitation carried into this phase**: the results *view* itself
is not resumable across a page reload (`phase` is local component
state) — refreshing mid-results returns to the intro screen, even
though the underlying `ReassessmentResult` and the dashboard override
are both already persisted. A future phase could rehydrate
`phase="results"` from `loadLastReassessment()` on mount.

## End-to-End Integration + Product Hardening (`services/studentStateService.ts`, `services/dashboardService.ts`)

Every phase above was built and verified in isolation. This phase's job
was to confirm — and where it didn't hold, fix — that they behave as one
product with one source of truth, rather than several correct pieces
that happen to disagree with each other.

### The one real bug: the Dashboard never heard about the original assessment

Before this phase, the mastery-override mechanism (`studentStateService.ts`,
built in the Reassessment phase) had exactly one writer:
`applyReassessmentResult()`. Nothing ever called it after the *original*
diagnostic assessment. The practical effect:

```
Student completes a real assessment
  → Diagnosis page:      shows the REAL score        (reads AssessmentEvidence directly)
  → Recovery Path page:  shows the REAL score          (reads AssessmentEvidence directly)
  → Dashboard:           shows the Phase 2 SEED score  (reads only MOCK_DASHBOARD_DATA)
```

Diagnosis and Recovery Path were never the problem — both independently
call the same pure `analyzeDiagnosticEvidence(evidence)` on the same
`AssessmentEvidence` object, so they could never disagree with each
other. The Dashboard was the one screen with a second, static source of
truth that nothing ever invalidated.

**Fix**: `studentStateService.applyAssessmentEvidence(evidence, diagnostic)`
writes every concept the original assessment scored into the *same*
override store a reassessment already writes to, tagging each entry
`source: "assessment"` and computing a full status classification
(root/application/practice/strength) from the real `DiagnosticEvidence`
— not just a threshold check, which is all a reassessment override alone
can safely claim (see the Reassessment section above for why that
distinction matters). `AssessmentPage.handleSubmit` calls it right next
to the existing `saveLastEvidence`:

```
scoreAssessment() → buildAssessmentEvidence()
  → applyAssessmentEvidence(evidence, analyzeDiagnosticEvidence(evidence))   [NEW]
  → saveLastEvidence(evidence)                                              [existing]
```

`dashboardService.getDashboardData()` now branches on `override.source`:
an assessment-sourced override's `status` is trusted directly (it came
from the real diagnostic engine); a reassessment-sourced override keeps
the more conservative "promoted to strength only if it actually crosses
the threshold, otherwise keep the prior gap-type label" rule from the
Reassessment phase — a single before/after number still isn't enough
context to safely reclassify *which kind* of gap a concept has. The
Dashboard's Learning Health aggregate cards (Overall Mastery, Strong
Concepts, Learning Gaps, Gaps Needing Attention) are now derived from
the same merged concept list at read time, not left as separately
hardcoded totals that could silently drift from what the concept cards
below them actually show.

**Not fixed, and explicitly out of scope**: the Dashboard's "AI Insight"
paragraph and its `nextBestAction`/`recoveryPath` arrays are still
static mock copy. Wiring the *numbers* to real evidence was this phase's
mandate; regenerating narrative text from live diagnosis on the
Dashboard is additional product surface, not a hardening fix, and is
listed as a next-phase candidate in DEVELOPMENT_STATUS.md.

### AI hardening: timeout and full failure-mode coverage

`RemoteAIProvider.chatJSON()` previously had no timeout — a hung request
could block the diagnosis or reflection pipeline indefinitely rather
than falling through to the deterministic template. Added a 10-second
`AbortController` timeout, plus explicit, distinctly-messaged errors for
every other failure mode a real HTTP call can produce: non-2xx status, a
non-JSON response body, a response missing the expected message-content
field, non-JSON message content, and a network failure (`fetch`
rejecting outright). None of this required touching
`diagnosisService.getDiagnosis` or `reassessmentAIService.getReassessmentReflection`
— their try/catch-and-fallback already existed and already worked; the
gap was that some failure modes weren't guaranteed to actually *reach*
that catch block before this phase's fix.

### Navigation hardening: no more blank pages

Two additions, both purely defensive:
- A catch-all `path="*"` route → `NotFoundPage`, so a mistyped or stale
  URL gets a real screen with a way back to Overview instead of nothing.
- A top-level React `ErrorBoundary` (`components/ErrorBoundary.tsx`,
  wrapping the whole app in `main.tsx`) so an uncaught render error —
  anywhere in the tree — shows a recovery screen instead of leaving the
  student staring at a blank white page.

### Demo Reset (`services/resetService.ts`, `pages/Settings/`)

A single `resetDemoState()` function clears every storage key any
service in this app writes: in-progress + last-submitted assessment
(`assessmentStateService`), recovery-path step progress
(`learningPathStateService`), the last computed reassessment result
(`reassessmentStateService`), and every mastery override
(`studentStateService`). Exposed from a real `SettingsPage` (previously
a `ComingSoonPage` placeholder) as "Reset Demo Data" behind a
confirmation modal — explicitly documented in its own copy as a local
development/demo convenience rather than a real account-deletion
feature, since there is no account system for it to operate on.

### Demo data (`data/demoScript.ts`)

A documented, clearly-labeled **synthetic demonstration** answer key for
the 12-question assessment — not consumed by any runtime code path,
purely a reference for running a repeatable, compelling demo. Every
number in its comments (Conditions 0%, Loops 50%, Functions 50%, every
other concept 100%, overall 78%; and the post-reassessment 100%/100%
"closing" story) was verified against a real, live run of the actual
scoring/diagnostic/reassessment engines rather than asserted from
theory. The file is explicit about why it doesn't hit arbitrary
round-number targets: the assessment bank's 1-2-questions-per-concept
granularity caps achievable percentages at coarse increments, and
expanding it purely for demo-digit cosmetics was judged out of
proportion for a hardening-only phase.

### Diagnostic reliability: insufficient evidence is not the same as a demonstrated weakness

Found via a new test, not by inspection: `detectRootGaps()` in
`diagnosticEngine.ts` could flag a concept as a root gap — or count it as
a "weak dependent" justifying someone *else's* root-gap claim — purely
because it scored 0%, without checking whether that 0% came from being
answered wrong or from never being answered at all (an unattempted
concept scores 0% by construction, since `scoringService` counts its
points as "possible" but never "earned"). Fixed by requiring at least
one actually-answered question (correct or incorrect) on both the
candidate concept and each dependent concept before either can
contribute to a root-gap finding — the same rule `detectConceptGaps`
already applied, now applied consistently across the whole engine. This
is precisely the "insufficient evidence vs. demonstrated weakness"
distinction the diagnostic engine is supposed to honor.

### Accessibility: a skip link past the persistent sidebar

`AppShell` renders a "Skip to main content" link as the very first
focusable element on every page (visually hidden until it receives
keyboard focus, then slides into view) — without it, a keyboard user had
to tab through all 8 sidebar destinations on every single page load
before reaching that page's actual content. Confirmed live: it's the
first tab stop, and activating it moves focus directly into
`#main-content`.

### Backend testing

The backend had zero tests before this phase. Added `pytest` + `httpx`
as dev-only dependencies (`backend/requirements-dev.txt` — the
production `requirements.txt` is untouched) and `backend/tests/test_api.py`:
health check, subjects list, single-subject lookup, a clean JSON 404 for
an unknown subject, and — a real security-relevant check, not just
"does it respond" — that CORS actually allows the configured frontend
origin and actually rejects an arbitrary unlisted one.

### What this phase deliberately did not touch

Per its own explicit scope: no new product features, no changes to
already-tested scoring/diagnosis/reassessment decision logic beyond the
one insufficient-evidence bug fix above, no backend-hosted AI proxy (the
browser-exposed API key tradeoff remains, documented, in
`remoteAIProvider.ts`), and no CI pipeline — everything in this phase
was verified by actually running it in this environment, not by adding
automation to run it elsewhere.

## Final Polish + Deployment Readiness

A dedicated phase after the hardening phase above, scoped to: fix
specific, verified gaps (not redesign), and make the project genuinely
deployable without actually deploying it. Two config files were added
because their absence would have broken the deployed product on day
one, not as speculative infrastructure:

- **`frontend/vercel.json`** — a Vite SPA served statically needs an
  explicit rewrite rule (`/(.*) → /index.html`) so React Router's
  client-side routes resolve on a hard refresh or a direct link. Without
  it, sharing a direct link to `/reassessment` — exactly the kind of
  link a hackathon demo or a judge revisiting the app would use — 404s
  on Vercel, since there's no real file at that path.
- **`backend/Procfile`** — `web: uvicorn app.main:app --host 0.0.0.0 --port $PORT`,
  the standard pattern most Python PaaS hosts (Render, Railway, Heroku-
  compatible platforms) auto-detect. The backend's CORS configuration
  was already environment-driven (`pydantic-settings` reads
  `CORS_ORIGINS` from the process environment, not just `.env`), so
  pointing it at a deployed frontend's real origin requires no code
  change — only setting the variable.

`README.md` was rewritten in full — it had not been updated since the
project's very first phase and still described a "foundation phase"
with no product built, which would have been actively misleading to
anyone (a judge, a future contributor) using it as an entry point.

## Planned data flow (future phases)

```
Diagnostic Assessment evidence (built this phase, frontend-only)
  → (future) POST /api/v1/assessments/submit
      → Scoring Service moves server-side (same logic, now backend)
      → Gap Detection Service (deterministic, backend)
          - recurring mistake patterns across assessment history
          - prerequisite-graph traversal → root-cause candidates
      → AI Diagnosis Service (LLM-backed, backend)
          - turns the deterministic gap/root-cause output into a
            human-readable explanation + misconception narrative
          - LLM never computes scores or decides mastery; it only
            explains conclusions the deterministic layer already reached
  → Learning Path Service (backend)
      - deterministic sequencing of remediation concepts (by
        prerequisite graph), AI-generated content/explanations per step
  → Reassessment → Scoring Service again → Before/After comparison (deterministic diff)
      - already built frontend-only this phase (services/reassessmentService.ts);
        moving the scoring/classification logic server-side later is a
        relocation, not a redesign, since it's already pure and deterministic
```

The hard rule carried through every future phase: **the LLM explains, it
never scores.** Correctness, mastery percentages, trend calculations, and
gap classification are always deterministic Python, so results are
reproducible, auditable, and don't drift between runs.

## Planned AI architecture

- **Built this phase, frontend-only**: `frontend/src/services/ai/` — see
  "AI Learning Diagnosis" above. The provider interface, mock/remote
  implementations, validation, and fallback described there are the real
  implementation, not a plan.
- **Still planned, backend-side**: moving this same pipeline server-side
  once a backend owns assessment history — a dedicated `app/services/ai/`
  package wrapping LLM calls behind an interface, so the request never
  ships an API key to the browser. The frontend `AIProvider` interface
  was deliberately designed to make this swap mechanical: a backend
  `RemoteAIProvider` equivalent would proxy the identical `AIInputEvidence`
  → `StructuredDiagnosis` shape, and the frontend would call an internal
  `/api/v1/diagnosis` endpoint instead of an LLM URL directly — no
  change to `DiagnosisPage` or the diagnostic engine.
- Inputs to the AI layer are always the deterministic engine's structured
  output (scores, gap classifications, prerequisite chains) — never raw
  student answers — keeping prompts small and grounded. This rule is
  enforced today by `aiInputMapper.ts`, not just documented as an intent.
- Responses are treated as explanatory text/content only; nothing an AI
  service returns is allowed to override a score or mastery value
  computed deterministically. Enforced today: `StructuredDiagnosis` has
  no field an AI response could use to override a number — mastery
  values in the UI always come from `DiagnosticEvidence`, never from the
  AI's JSON.

## Multi-subject extensibility

Nothing in the routing, models, or frontend types is Python-specific.
Adding a new subject means adding another `Subject`/`Concept` data module
under `app/data/` (or, later, database rows) with its own concept graph —
no changes to services, API contracts, or frontend components.
