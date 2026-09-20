import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Sparkles, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, Clock, PartyPopper } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { EmptyState } from "../../components/ui/EmptyState";
import { ModuleProgressIndicator, type ModuleStage } from "./components/ModuleProgressIndicator";
import { InteractiveQuestionCard } from "./components/InteractiveQuestionCard";
import { getLesson } from "../../data/lessons";
import { analyzeDiagnosticEvidence } from "../../services/diagnosticEngine";
import { computeModuleAccuracy } from "../../services/learningModuleService";
import { loadLastEvidence } from "../../services/assessmentStateService";
import { markStepCompleted } from "../../services/learningPathStateService";
import { CONCEPT_DISPLAY_NAMES } from "../../constants/conceptGraph";
import { ROUTES } from "../../routes/paths";
import type { AssessmentEvidence, ConceptId } from "../../types/assessment";
import "./LearningModulePage.css";

interface NavState {
  stepId?: string;
  pathId?: string;
}

export function LearningModulePage() {
  const { conceptId } = useParams<{ conceptId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as NavState | null;

  const lesson = useMemo(() => getLesson(conceptId), [conceptId]);

  const evidence = useMemo<AssessmentEvidence | null>(() => {
    const fromNav = (location.state as { evidence?: AssessmentEvidence } | null)?.evidence;
    return fromNav ?? loadLastEvidence<AssessmentEvidence>();
  }, [location.state]);

  // Evidence-driven "why this matters" context — computed live from the
  // actual diagnosis, never hardcoded into lesson content. `isRootGap`
  // and `affectedConcepts` in particular are what let the subheading
  // below say something concept-specific and evidence-true instead of a
  // single hardcoded sentence that would silently be wrong for any
  // concept other than the one it was originally written for.
  const context = useMemo(() => {
    if (!evidence || !conceptId) return null;
    const diagnostic = analyzeDiagnosticEvidence(evidence);
    const relatedMistakes = evidence.incorrectQuestions.filter(
      (q) => q.concept === conceptId || q.prerequisiteConcepts.includes(conceptId as ConceptId),
    ).length;
    const rootGap = diagnostic.rootGaps.find((f) => f.concept === conceptId);
    const affectedConcepts = rootGap?.affectedConcepts.map((c) => CONCEPT_DISPLAY_NAMES[c] ?? c) ?? [];
    return { relatedMistakes, affectedConcepts, isRootGap: Boolean(rootGap) };
  }, [evidence, conceptId]);

  const [stage, setStage] = useState<ModuleStage>("why");
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceResults, setPracticeResults] = useState<boolean[]>([]);
  const [showReinforcement, setShowReinforcement] = useState(false);
  const [challengeResult, setChallengeResult] = useState<boolean | null>(null);
  const [checkIndex, setCheckIndex] = useState(0);
  const [checkResults, setCheckResults] = useState<boolean[]>([]);

  useEffect(() => {
    if (stage === "complete" && navState?.pathId && navState?.stepId) {
      markStepCompleted(navState.pathId, navState.stepId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  if (!conceptId) {
    return (
      <>
        <PageHeader title="Learning Module" description="Micro-learning recovery session." />
        <Card>
          <EmptyState icon={AlertTriangle} title="No concept specified" description="This page needs a concept to teach — navigate here from your recovery path." />
        </Card>
      </>
    );
  }

  if (!lesson) {
    const displayName = CONCEPT_DISPLAY_NAMES[conceptId as ConceptId] ?? conceptId;
    return (
      <>
        <PageHeader title={displayName} description="Learning module" />
        <Card>
          <EmptyState
            icon={Sparkles}
            title="This lesson isn't built yet"
            description={`The full ${displayName} lesson content ships in a later phase.`}
            action={
              <Button variant="secondary" onClick={() => navigate(ROUTES.recoveryPath)}>
                <ArrowLeft size={16} /> Back to Recovery Path
              </Button>
            }
          />
        </Card>
      </>
    );
  }

  // Evidence-true, concept-generic "why this matters" message — never a
  // single hardcoded sentence that would silently be wrong once a second
  // concept's lesson exists. Explicitly uses "possible root gap" (the
  // same hedged vocabulary as the Diagnosis screen) rather than
  // presenting the inference as settled fact.
  const whyThisMattersCopy = (() => {
    if (!context) return `A focused, evidence-driven session on ${lesson.title}.`;
    if (context.isRootGap && context.affectedConcepts.length > 0) {
      return `You're starting here because ${lesson.title} was identified as a possible root gap affecting your performance in ${context.affectedConcepts.join(" and ")}.`;
    }
    if (context.isRootGap) {
      return `You're starting here because ${lesson.title} was identified as a possible root gap in your recent assessment.`;
    }
    if (context.relatedMistakes > 0) {
      return `This session reinforces ${lesson.title}, based on ${context.relatedMistakes} related mistake${context.relatedMistakes === 1 ? "" : "s"} in your recent assessment.`;
    }
    return `A focused, evidence-driven session on ${lesson.title}.`;
  })();

  const allResults = [...practiceResults, ...(challengeResult !== null ? [challengeResult] : []), ...checkResults];
  const practiceAllCorrectSoFar = practiceResults.length > 0 && practiceResults.every(Boolean);

  const handlePracticeAnswered = (isCorrect: boolean) => {
    setPracticeResults((prev) => {
      const next = [...prev];
      next[practiceIndex] = isCorrect;
      return next;
    });
  };

  const handlePracticeNext = () => {
    // Simple deterministic adaptation: only after Q1, only if it was wrong, show one reinforcement screen.
    if (practiceIndex === 0 && practiceResults[0] === false && !showReinforcement) {
      setShowReinforcement(true);
      return;
    }
    setShowReinforcement(false);
    if (practiceIndex < lesson.practiceQuestions.length - 1) {
      setPracticeIndex((i) => i + 1);
    } else {
      setStage("challenge");
    }
  };

  const handleCheckNext = () => {
    if (checkIndex < lesson.understandingCheck.length - 1) {
      setCheckIndex((i) => i + 1);
    } else {
      setStage("complete");
    }
  };

  return (
    <div className="learning-module-page">
      <ModuleProgressIndicator currentStage={stage} />

      {stage === "why" && (
        <section className="module-section">
          <h1 className="module-heading">Let's strengthen {lesson.title}</h1>
          <p className="module-subheading">{whyThisMattersCopy}</p>

          <Card className="module-why-card">
            {context && context.relatedMistakes > 0 && (
              <div className="module-why-row">
                <span className="module-why-label">Detected evidence</span>
                <span className="module-why-value">{context.relatedMistakes} related mistakes</span>
              </div>
            )}
            {context && context.affectedConcepts.length > 0 && (
              <div className="module-why-row">
                <span className="module-why-label">Affected concepts</span>
                <span className="module-why-value">{context.affectedConcepts.join(", ")}</span>
              </div>
            )}
            <div className="module-why-row">
              <span className="module-why-label">
                <Clock size={13} strokeWidth={2.2} /> Estimated time
              </span>
              <span className="module-why-value">{lesson.estimatedMinutes} minutes</span>
            </div>
          </Card>

          <Button variant="primary" onClick={() => setStage("learn")}>
            Start Learning <ArrowRight size={16} strokeWidth={2.4} />
          </Button>
        </section>
      )}

      {stage === "learn" && (
        <section className="module-section">
          <h2 className="module-heading">{lesson.title}</h2>

          <Card className="module-explanation-card">
            <p className="module-body-text">{lesson.explanation.intro}</p>
            <ul className="module-bullets">
              {lesson.explanation.bullets.map((bullet, index) => (
                <li key={index}>{bullet}</li>
              ))}
            </ul>
            <CodeBlock code={lesson.explanation.example.code} highlightLines={lesson.explanation.example.highlightLines} />
            <p className="module-body-text module-example-explanation">{lesson.explanation.example.explanation}</p>
          </Card>

          <Card className="module-worked-example-card">
            <span className="module-section-label">Worked Example</span>
            <p className="module-body-text">{lesson.workedExample.scenario}</p>
            <CodeBlock code={lesson.workedExample.setupCode} />
            <CodeBlock code={lesson.workedExample.solutionCode} highlightLines={lesson.workedExample.solutionHighlightLines} />
            <ol className="module-steps">
              {lesson.workedExample.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </Card>

          <Button variant="primary" onClick={() => setStage("practice")}>
            Continue to Practice <ArrowRight size={16} strokeWidth={2.4} />
          </Button>
        </section>
      )}

      {stage === "practice" && !showReinforcement && (
        <section className="module-section">
          <span className="module-section-label">
            Practice {practiceIndex + 1} of {lesson.practiceQuestions.length}
          </span>
          <InteractiveQuestionCard
            key={lesson.practiceQuestions[practiceIndex].id}
            question={lesson.practiceQuestions[practiceIndex]}
            nextLabel={practiceIndex < lesson.practiceQuestions.length - 1 ? "Next Question" : "Continue to Challenge"}
            onAnswered={handlePracticeAnswered}
            onNext={handlePracticeNext}
          />
        </section>
      )}

      {stage === "practice" && showReinforcement && (
        <section className="module-section">
          <Card className="module-reinforcement-card">
            <span className="module-section-label">Quick reinforcement</span>
            <p className="module-body-text">{lesson.adaptiveReinforcement}</p>
            <Button variant="primary" onClick={handlePracticeNext}>
              Got it, continue <ArrowRight size={16} strokeWidth={2.4} />
            </Button>
          </Card>
        </section>
      )}

      {stage === "challenge" && (
        <section className="module-section">
          <span className="module-section-label">Application Challenge</span>
          {practiceAllCorrectSoFar ? (
            <p className="module-transition-note">You got all 3 right — let's put it to the test.</p>
          ) : (
            <p className="module-transition-note">Let's apply this to a new scenario.</p>
          )}
          <InteractiveQuestionCard
            question={lesson.applicationChallenge}
            intro={lesson.applicationChallenge.scenario}
            nextLabel="Continue to Quick Check"
            onAnswered={setChallengeResult}
            onNext={() => setStage("check")}
          />
        </section>
      )}

      {stage === "check" && (
        <section className="module-section">
          <span className="module-section-label">
            Quick Check {checkIndex + 1} of {lesson.understandingCheck.length}
          </span>
          <InteractiveQuestionCard
            key={lesson.understandingCheck[checkIndex].id}
            question={lesson.understandingCheck[checkIndex]}
            nextLabel={checkIndex < lesson.understandingCheck.length - 1 ? "Next Question" : "Finish"}
            onAnswered={(isCorrect) =>
              setCheckResults((prev) => {
                const next = [...prev];
                next[checkIndex] = isCorrect;
                return next;
              })
            }
            onNext={handleCheckNext}
          />
        </section>
      )}

      {stage === "complete" && (
        <CompletionSection allResults={allResults} conceptTitle={lesson.title} onVerify={() => navigate(ROUTES.reassessment)} onBackToPath={() => navigate(ROUTES.recoveryPath)} />
      )}
    </div>
  );
}

interface CompletionSectionProps {
  allResults: boolean[];
  conceptTitle: string;
  onVerify: () => void;
  onBackToPath: () => void;
}

function CompletionSection({ allResults, conceptTitle, onVerify, onBackToPath }: CompletionSectionProps) {
  const summary = computeModuleAccuracy(allResults);

  return (
    <section className="module-section">
      <Card className="module-completion-card">
        <PartyPopper size={36} strokeWidth={1.75} className="module-completion-icon" />
        <h2 className="module-heading">Nice work.</h2>
        <p className="module-body-text">{conceptTitle} practice complete.</p>

        <div className="module-completion-stats">
          <div>
            <span className="module-completion-stat-label">Practice accuracy</span>
            <span className="module-completion-stat-value">{summary.accuracyLabel}</span>
          </div>
          <div>
            <span className="module-completion-stat-label">Concept confidence</span>
            <span className="module-completion-stat-value">
              <CheckCircle2 size={16} strokeWidth={2.2} /> {summary.confidenceLabel}
            </span>
          </div>
        </div>

        <p className="module-completion-note">You're ready to verify your understanding with a targeted reassessment.</p>

        <div className="module-completion-actions">
          <Button variant="secondary" onClick={onBackToPath}>
            <ArrowLeft size={16} /> Back to Recovery Path
          </Button>
          <Button variant="primary" onClick={onVerify}>
            Verify My Improvement <ArrowRight size={16} strokeWidth={2.4} />
          </Button>
        </div>
      </Card>
    </section>
  );
}
