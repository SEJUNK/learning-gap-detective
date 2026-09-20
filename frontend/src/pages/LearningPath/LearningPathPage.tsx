import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles, CheckCircle2, PartyPopper } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { InsightCard } from "../../components/ui/InsightCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { JourneyStepCard } from "./components/JourneyStepCard";
import { CurrentStepCard } from "./components/CurrentStepCard";
import { TimeEstimateBreakdown } from "./components/TimeEstimateBreakdown";
import { analyzeDiagnosticEvidence } from "../../services/diagnosticEngine";
import { generateLearningPath, computeStepStatuses } from "../../services/learningPathService";
import { getProgress, markStepInProgress } from "../../services/learningPathStateService";
import { loadLastEvidence } from "../../services/assessmentStateService";
import { ROUTES, learningModuleRoute } from "../../routes/paths";
import type { AssessmentEvidence } from "../../types/assessment";
import type { LearningPath, LearningPathStep } from "../../types/learningPath";
import "./LearningPathPage.css";

export function LearningPathPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [progressVersion, setProgressVersion] = useState(0);

  const evidence = useMemo<AssessmentEvidence | null>(() => {
    const fromNav = (location.state as { evidence?: AssessmentEvidence } | null)?.evidence;
    return fromNav ?? loadLastEvidence<AssessmentEvidence>();
  }, [location.state]);

  const path = useMemo<LearningPath | "error" | null>(() => {
    if (!evidence) return null;
    try {
      const diagnosticEvidence = analyzeDiagnosticEvidence(evidence);
      return generateLearningPath(diagnosticEvidence);
    } catch {
      return "error";
    }
  }, [evidence]);

  // progressVersion is a deliberately-unused dependency trigger: bumping it
  // forces this memo (and the derived steps below) to recompute after a
  // localStorage write, since localStorage itself isn't reactive state.
  const liveSteps = useMemo(() => {
    if (!path || path === "error" || path.steps.length === 0) return [];
    const { completedStepIds, inProgressStepId } = getProgress(path.id);
    return computeStepStatuses(path.steps, completedStepIds, inProgressStepId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, progressVersion]);

  const handleStart = (step: LearningPathStep) => {
    if (path && path !== "error" && step.status !== "completed") {
      markStepInProgress(path.id, step.id);
      setProgressVersion((v) => v + 1);
    }
    navigate(learningModuleRoute(step.concept ?? "application-challenge"), {
      state: { stepId: step.id, pathId: path !== "error" ? path?.id : undefined },
    });
  };

  if (!evidence) {
    return (
      <>
        <PageHeader title="Your Recovery Path" description="We found the gaps. Now let's close them." />
        <Card>
          <EmptyState
            icon={Sparkles}
            title="We need your diagnostic results before we can build your recovery path."
            action={
              <Button variant="primary" onClick={() => navigate(ROUTES.assessment)}>
                Take Diagnostic Assessment
              </Button>
            }
          />
        </Card>
      </>
    );
  }

  if (path === "error") {
    return (
      <>
        <PageHeader title="Your Recovery Path" description="We found the gaps. Now let's close them." />
        <Card>
          <EmptyState
            icon={Sparkles}
            title="We couldn't build a detailed path right now"
            description="Head back to your diagnosis for the full breakdown of your learning gaps."
            action={
              <Button variant="secondary" onClick={() => navigate(ROUTES.diagnosis)}>
                View Diagnosis
              </Button>
            }
          />
        </Card>
      </>
    );
  }

  if (!path || path.steps.length === 0) {
    return (
      <>
        <PageHeader title="Your Recovery Path" description="We found the gaps. Now let's close them." />
        <Card>
          <EmptyState
            icon={CheckCircle2}
            title="No significant gaps to address"
            description={path?.rationale ?? "Your latest diagnosis didn't surface a learning gap worth building a path for."}
            action={
              <Button variant="secondary" onClick={() => navigate(ROUTES.diagnosis)}>
                View Diagnosis
              </Button>
            }
          />
        </Card>
      </>
    );
  }

  const completedCount = liveSteps.filter((s) => s.status === "completed").length;
  const allCompleted = completedCount === liveSteps.length;
  const currentStep = liveSteps.find((s) => s.status === "available" || s.status === "in_progress") ?? null;
  const progressPercent = Math.round((completedCount / liveSteps.length) * 100);

  return (
    <div className="learning-path-page">
      <PageHeader
        title="Your Recovery Path"
        description="We found the gaps. Now let's close them."
        action={<span className="learning-path-based-on">Based on your latest diagnosis</span>}
      />

      <div className="learning-path-summary-row">
        <span>
          <strong>{path.rootGapCount}</strong> Root Gap
        </span>
        <span>
          <strong>{path.supportingGapCount}</strong> Supporting Gaps
        </span>
        <span>
          <strong>{liveSteps.length}</strong> Recommended Steps
        </span>
      </div>

      {/* Section 1 — Why this path? */}
      <InsightCard eyebrow="Why this path?" title="Personalized to your evidence" description={path.rationale} status="root" />

      {/* Section 3 — Current step (placed high, per spec's emphasis, right after the rationale) */}
      {allCompleted ? (
        <Card className="learning-path-complete-banner">
          <PartyPopper size={28} strokeWidth={2} />
          <div>
            <h3>You've completed every step in this path.</h3>
            <p>You'll be ready to reassess these concepts whenever you're ready.</p>
          </div>
        </Card>
      ) : (
        currentStep && <CurrentStepCard step={currentStep} progressPercent={progressPercent} onStart={handleStart} />
      )}

      {/* Section 2 — Visual learning journey */}
      <section aria-labelledby="journey-heading">
        <SectionHeader title="Your Learning Journey" />
        <ol className="learning-path-journey">
          {liveSteps.map((step, index) => (
            <JourneyStepCard key={step.id} step={step} isLast={index === liveSteps.length - 1} onStart={handleStart} />
          ))}
        </ol>
      </section>

      {/* Section 4 — Expected outcome */}
      <section aria-labelledby="outcome-heading">
        <SectionHeader title="After completing this path" />
        <Card>
          <ul className="learning-path-outcomes">
            {path.expectedOutcomes.map((outcome, index) => (
              <li key={index}>
                <CheckCircle2 size={16} strokeWidth={2.2} />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
          <p className="learning-path-outcome-note">You'll be ready to reassess these concepts.</p>
        </Card>
      </section>

      {/* Section 5 — Time estimate */}
      <section aria-labelledby="time-heading">
        <SectionHeader title="Time Estimate" />
        <TimeEstimateBreakdown totalMinutes={path.totalDurationMinutes} breakdown={path.timeBreakdown} />
      </section>
    </div>
  );
}
