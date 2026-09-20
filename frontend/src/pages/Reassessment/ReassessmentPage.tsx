import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Sparkles, Clock, ClipboardList, Timer, Zap } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { AnswerOptions } from "../../components/ui/AnswerOptions";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { InsightCard } from "../../components/ui/InsightCard";
import { ActionCard } from "../../components/ui/ActionCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { ReassessmentSubmitModal } from "./components/ReassessmentSubmitModal";
import { ComparisonCard } from "./components/ComparisonCard";
import { TransferResultCard } from "./components/TransferResultCard";
import { ImprovementSummaryBanner } from "./components/ImprovementSummaryBanner";
import { JourneyTimeline } from "./components/JourneyTimeline";
import { analyzeDiagnosticEvidence } from "../../services/diagnosticEngine";
import { buildReassessmentQuestions, computeReassessmentResult, pickPrimaryFinding } from "../../services/reassessmentService";
import { getReassessmentReflection } from "../../services/reassessmentAIService";
import { applyReassessmentResult } from "../../services/studentStateService";
import { loadLastEvidence } from "../../services/assessmentStateService";
import { saveLastReassessment } from "../../services/reassessmentStateService";
import { buildDemoReassessmentResponses, isDemoModeEnabled } from "../../services/demoModeService";
import { getLesson } from "../../data/lessons";
import { CONCEPT_DISPLAY_NAMES } from "../../constants/conceptGraph";
import { REASSESSMENT_SECONDS_PER_QUESTION } from "../../constants/reassessmentThresholds";
import { ROUTES } from "../../routes/paths";
import type { AssessmentEvidence, AssessmentQuestion, AssessmentResponse } from "../../types/assessment";
import type { ReassessmentResult } from "../../types/reassessment";
import type { ReassessmentReflection } from "../../types/aiReassessment";
import "./ReassessmentPage.css";

type Phase = "intro" | "in-progress" | "results";

const DIFFICULTY_LABEL: Record<string, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

export function ReassessmentPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const evidence = useMemo<AssessmentEvidence | null>(() => {
    const fromNav = (location.state as { evidence?: AssessmentEvidence } | null)?.evidence;
    return fromNav ?? loadLastEvidence<AssessmentEvidence>();
  }, [location.state]);

  const diagnosticEvidence = useMemo(() => (evidence ? analyzeDiagnosticEvidence(evidence) : null), [evidence]);
  const primary = useMemo(() => (diagnosticEvidence ? pickPrimaryFinding(diagnosticEvidence) : null), [diagnosticEvidence]);
  const questions = useMemo<AssessmentQuestion[]>(() => (diagnosticEvidence ? buildReassessmentQuestions(diagnosticEvidence) : []), [diagnosticEvidence]);

  const [phase, setPhase] = useState<Phase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, AssessmentResponse>>({});
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [result, setResult] = useState<ReassessmentResult | null>(null);
  const [reflection, setReflection] = useState<ReassessmentReflection | null>(null);
  const [reflectionLoading, setReflectionLoading] = useState(false);

  useEffect(() => {
    if (phase !== "results" || !result) return;
    let cancelled = false;
    setReflectionLoading(true);
    getReassessmentReflection(result).then((r) => {
      if (!cancelled) {
        setReflection(r);
        setReflectionLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, result?.reassessmentId]);

  if (!evidence || !diagnosticEvidence) {
    return (
      <>
        <PageHeader title="Ready to verify your progress?" description="We'll check the concepts you just practiced." />
        <Card>
          <EmptyState
            icon={Sparkles}
            title="We need your original diagnosis first"
            description="A targeted reassessment is built from your original assessment — take that first."
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

  if (!primary || questions.length === 0) {
    return (
      <>
        <PageHeader title="Ready to verify your progress?" description="We'll check the concepts you just practiced." />
        <Card>
          <EmptyState
            icon={Sparkles}
            title="No targeted gap to reassess"
            description="Your latest diagnosis didn't identify a specific gap to verify — a full diagnostic assessment is the next useful step."
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

  const rootConceptName = CONCEPT_DISPLAY_NAMES[primary.concept] ?? primary.concept;
  const rootMastery = evidence.conceptScores[primary.concept] ?? 0;
  const lesson = getLesson(primary.concept);
  const practiceMinutes = lesson?.estimatedMinutes ?? 8;
  const estimatedMinutes = Math.max(1, Math.round((questions.length * REASSESSMENT_SECONDS_PER_QUESTION) / 60));

  const handleSelect = (optionIndex: number) => {
    const question = questions[currentIndex];
    setResponses((prev) => ({
      ...prev,
      [question.id]: { questionId: question.id, selectedAnswer: optionIndex, isAnswered: true, confidence: null, timeSpent: 0 },
    }));
  };

  const handleSubmit = () => {
    const computed = computeReassessmentResult({
      originalEvidence: evidence,
      diagnosticEvidence,
      reassessmentQuestions: questions,
      responses,
      reassessmentId: `reassessment-${Date.now()}`,
    });
    applyReassessmentResult(computed);
    saveLastReassessment(computed);
    setResult(computed);
    setSubmitModalOpen(false);
    setPhase("results");
  };

  if (phase === "intro") {
    return (
      <div className="reassessment-page">
        <PageHeader title="Ready to verify your progress?" description="We'll check the concepts you just practiced." />
        <Card className="reassessment-intro-card">
          <div className="reassessment-intro-row">
            <span className="reassessment-intro-label">Original performance</span>
            <span className="reassessment-intro-value">
              {rootConceptName} — {rootMastery}%
            </span>
          </div>
          <div className="reassessment-intro-row">
            <span className="reassessment-intro-label">
              <Clock size={13} strokeWidth={2.2} /> Practice completed
            </span>
            <span className="reassessment-intro-value">{practiceMinutes} minutes</span>
          </div>
          <div className="reassessment-intro-row">
            <span className="reassessment-intro-label">
              <ClipboardList size={13} strokeWidth={2.2} /> Questions
            </span>
            <span className="reassessment-intro-value">{questions.length}</span>
          </div>
          <div className="reassessment-intro-row">
            <span className="reassessment-intro-label">
              <Timer size={13} strokeWidth={2.2} /> Estimated time
            </span>
            <span className="reassessment-intro-value">{estimatedMinutes} minutes</span>
          </div>
        </Card>
        <Button variant="primary" onClick={() => setPhase("in-progress")}>
          Start Reassessment
        </Button>
      </div>
    );
  }

  if (phase === "in-progress") {
    const question = questions[currentIndex];
    const currentResponse = responses[question.id];
    const isLast = currentIndex === questions.length - 1;

    const handleFillDemoAnswers = () => {
      setResponses(buildDemoReassessmentResponses(questions));
      setCurrentIndex(questions.length - 1);
    };

    return (
      <div className="reassessment-page">
        <PageHeader title="Targeted Reassessment" description={`Verifying ${rootConceptName}`} />

        <div className="reassessment-progress-row">
          <span className="reassessment-progress-label">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className="reassessment-progress-bar">
            <ProgressBar value={currentIndex + 1} max={questions.length} />
          </div>
          {isDemoModeEnabled() && (
            <Button
              variant="secondary"
              className="reassessment-demo-fill-btn"
              onClick={handleFillDemoAnswers}
              title="Demo Mode: instantly answers every question correctly and jumps to Submit — scoring still runs normally."
            >
              <Zap size={14} /> Fill Demo Answers
            </Button>
          )}
        </div>

        <Card className="reassessment-question-card">
          <div className="reassessment-question-meta">
            <span>
              Concept: <strong>{CONCEPT_DISPLAY_NAMES[question.concept]}</strong>
            </span>
            <span>
              Difficulty: <strong>{DIFFICULTY_LABEL[question.difficulty]}</strong>
            </span>
          </div>

          <p className="reassessment-question-text">{question.question}</p>
          {question.codeSnippet && <CodeBlock code={question.codeSnippet} />}

          <AnswerOptions options={question.options} selectedIndex={currentResponse?.selectedAnswer ?? null} onSelect={handleSelect} />
        </Card>

        <div className="reassessment-footer-nav">
          <Button variant="secondary" onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0}>
            <ChevronLeft size={16} /> Previous
          </Button>
          {isLast ? (
            <Button variant="primary" onClick={() => setSubmitModalOpen(true)}>
              Submit Reassessment
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}>
              Next <ChevronRight size={16} />
            </Button>
          )}
        </div>

        <ReassessmentSubmitModal open={submitModalOpen} onContinue={() => setSubmitModalOpen(false)} onSubmit={handleSubmit} />
      </div>
    );
  }

  // phase === "results"
  if (!result) return null;
  const secondaryComparisons = result.comparison.filter((c) => c.concept !== result.rootGapComparison?.concept);

  return (
    <div className="reassessment-page">
      <PageHeader
        title="Your Progress"
        description="Original Assessment vs. Targeted Reassessment"
        action={
          <div className="reassessment-overall-result">
            <span className="reassessment-overall-label">Overall Result</span>
            <span className="reassessment-overall-value">
              {result.totalScore}/{result.totalQuestions} ({result.percentage}%)
            </span>
          </div>
        }
      />

      <section aria-labelledby="comparison-heading">
        <SectionHeader title="Before vs. After" />
        <div className="reassessment-comparison-stack">
          {result.rootGapComparison && <ComparisonCard comparison={result.rootGapComparison} emphasized />}
          {secondaryComparisons.map((c) => (
            <ComparisonCard key={c.concept} comparison={c} />
          ))}
        </div>
      </section>

      <ImprovementSummaryBanner tier={result.overallImprovementTier} message={result.overallImprovementMessage} />

      {result.applicationTransfer && result.rootGapComparison && (
        <TransferResultCard transfer={result.applicationTransfer} conceptName={result.rootGapComparison.conceptName} />
      )}

      <section aria-labelledby="reflection-heading">
        <SectionHeader title="AI Reflection" />
        {reflectionLoading || !reflection ? (
          <Card>
            <LoadingState label="Generating your reflection…" />
          </Card>
        ) : (
          <>
            <InsightCard eyebrow="What changed?" title={reflection.headline} description={reflection.narrative} status="strength" />
            {reflection.source !== "ai" && (
              <p className="reassessment-source-note">
                {reflection.source === "mock"
                  ? "No AI provider configured — this reflection was generated from your deterministic before/after results."
                  : "AI reflection temporarily unavailable. The comparison above is based entirely on deterministic scoring, computed with no AI involved."}
              </p>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="next-action-heading">
        <SectionHeader title="What should you do next?" />
        <ActionCard eyebrow="Recommended" title={result.nextAction.title} rationale={result.nextAction.rationale} actionLabel={result.nextAction.title} route={result.nextAction.route} />
      </section>

      <JourneyTimeline />
    </div>
  );
}
