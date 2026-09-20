import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Button } from "../../components/ui/Button";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { QuestionNavigator } from "./components/QuestionNavigator";
import { AnswerOptions } from "../../components/ui/AnswerOptions";
import { ConfidencePrompt } from "./components/ConfidencePrompt";
import { SubmitConfirmModal } from "./components/SubmitConfirmModal";
import { CompletionTransition } from "./components/CompletionTransition";
import { ASSESSMENT_QUESTIONS } from "../../data/assessmentQuestions";
import { CONCEPT_DISPLAY_NAMES } from "../../constants/conceptGraph";
import { scoreAssessment } from "../../services/scoringService";
import { buildAssessmentEvidence } from "../../services/evidenceService";
import { analyzeDiagnosticEvidence } from "../../services/diagnosticEngine";
import { applyAssessmentEvidence } from "../../services/studentStateService";
import { buildDemoAssessmentResponses, isDemoModeEnabled } from "../../services/demoModeService";
import {
  createAssessmentState,
  emptyResponse,
  loadInProgressAssessment,
  saveAssessmentState,
  clearAssessmentState,
  saveLastEvidence,
} from "../../services/assessmentStateService";
import { ROUTES } from "../../routes/paths";
import type { AssessmentEvidence, AssessmentState, ConfidenceLevel } from "../../types/assessment";
import "./AssessmentPage.css";

const DIFFICULTY_LABEL: Record<string, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

export function AssessmentPage() {
  const navigate = useNavigate();
  const [assessmentState, setAssessmentState] = useState<AssessmentState>(() => loadInProgressAssessment() ?? createAssessmentState("Python"));
  const [phase, setPhase] = useState<"in-progress" | "transition">("in-progress");
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [pendingEvidence, setPendingEvidence] = useState<AssessmentEvidence | null>(null);
  const questionStartRef = useRef(Date.now());

  useEffect(() => {
    saveAssessmentState(assessmentState);
  }, [assessmentState]);

  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [assessmentState.currentQuestionIndex]);

  const totalQuestions = ASSESSMENT_QUESTIONS.length;
  const currentQuestion = ASSESSMENT_QUESTIONS[assessmentState.currentQuestionIndex];
  const currentResponse = assessmentState.responses[currentQuestion.id] ?? emptyResponse(currentQuestion.id);

  const answeredIndices = new Set(
    ASSESSMENT_QUESTIONS.map((q, index) => (assessmentState.responses[q.id]?.isAnswered ? index : -1)).filter((i) => i >= 0),
  );
  const answeredCount = answeredIndices.size;

  const recordElapsedTime = useCallback(
    (state: AssessmentState): AssessmentState => {
      const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000);
      if (elapsed <= 0) return state;
      const questionId = ASSESSMENT_QUESTIONS[state.currentQuestionIndex].id;
      const existing = state.responses[questionId] ?? emptyResponse(questionId);
      return {
        ...state,
        responses: { ...state.responses, [questionId]: { ...existing, timeSpent: existing.timeSpent + elapsed } },
      };
    },
    [],
  );

  const goToQuestion = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(totalQuestions - 1, index));
      setAssessmentState((prev) => ({ ...recordElapsedTime(prev), currentQuestionIndex: clamped }));
    },
    [recordElapsedTime, totalQuestions],
  );

  const handleSelectAnswer = (optionIndex: number) => {
    setAssessmentState((prev) => {
      const existing = prev.responses[currentQuestion.id] ?? emptyResponse(currentQuestion.id);
      return {
        ...prev,
        responses: {
          ...prev.responses,
          [currentQuestion.id]: { ...existing, selectedAnswer: optionIndex, isAnswered: true },
        },
      };
    });
  };

  const handleSetConfidence = (confidence: ConfidenceLevel) => {
    setAssessmentState((prev) => {
      const existing = prev.responses[currentQuestion.id] ?? emptyResponse(currentQuestion.id);
      return {
        ...prev,
        responses: { ...prev.responses, [currentQuestion.id]: { ...existing, confidence } },
      };
    });
  };

  const handleSubmit = () => {
    const finalState = recordElapsedTime(assessmentState);
    const completedState: AssessmentState = { ...finalState, completedAt: new Date().toISOString() };

    const scoring = scoreAssessment(ASSESSMENT_QUESTIONS, completedState.responses);
    const evidence = buildAssessmentEvidence(completedState, ASSESSMENT_QUESTIONS, scoring);

    // Write the real scores into the same centralized mastery store the
    // Dashboard reads from — otherwise the Dashboard would keep showing
    // pre-assessment seed numbers after a student's very first real
    // assessment, while Diagnosis/Recovery Path already show the truth.
    applyAssessmentEvidence(evidence, analyzeDiagnosticEvidence(evidence));

    saveLastEvidence(evidence);
    clearAssessmentState();
    setAssessmentState(completedState);
    setPendingEvidence(evidence);
    setSubmitModalOpen(false);
    setPhase("transition");
  };

  if (phase === "transition") {
    return <CompletionTransition onDone={() => navigate(ROUTES.diagnosis, { state: { evidence: pendingEvidence } })} />;
  }

  const isLastQuestion = assessmentState.currentQuestionIndex === totalQuestions - 1;

  const handleFillDemoAnswers = () => {
    setAssessmentState((prev) => ({
      ...prev,
      responses: buildDemoAssessmentResponses(),
      currentQuestionIndex: totalQuestions - 1,
    }));
  };

  return (
    <div className="assessment-page">
      <header className="assessment-header">
        <div className="assessment-header-text">
          <h1 className="assessment-title">Diagnostic Assessment</h1>
          <p className="assessment-subtitle">This isn't about getting a perfect score. It's about discovering how you learn.</p>
        </div>
        <Button variant="ghost" onClick={() => setSubmitModalOpen(true)}>
          Submit Assessment
        </Button>
      </header>

      <div className="assessment-progress-row">
        <span className="assessment-progress-label">
          Question {assessmentState.currentQuestionIndex + 1} of {totalQuestions}
        </span>
        <div className="assessment-progress-bar">
          <ProgressBar value={assessmentState.currentQuestionIndex + 1} max={totalQuestions} />
        </div>
        {isDemoModeEnabled() && (
          <Button variant="secondary" className="assessment-demo-fill-btn" onClick={handleFillDemoAnswers} title="Demo Mode: instantly fills every answer using the documented demo script, then jumps to Submit — scoring still runs normally.">
            <Zap size={14} /> Fill Demo Answers
          </Button>
        )}
      </div>

      <QuestionNavigator
        totalQuestions={totalQuestions}
        currentIndex={assessmentState.currentQuestionIndex}
        answeredIndices={answeredIndices}
        onNavigate={goToQuestion}
      />

      <Card className="assessment-question-card">
        <div className="assessment-question-meta">
          <span>
            Concept: <strong>{CONCEPT_DISPLAY_NAMES[currentQuestion.concept]}</strong>
          </span>
          <span>
            Difficulty: <strong>{DIFFICULTY_LABEL[currentQuestion.difficulty]}</strong>
          </span>
        </div>

        <p className="assessment-question-text">{currentQuestion.question}</p>

        {currentQuestion.codeSnippet && <CodeBlock code={currentQuestion.codeSnippet} />}

        <AnswerOptions options={currentQuestion.options} selectedIndex={currentResponse.selectedAnswer} onSelect={handleSelectAnswer} />

        {currentResponse.isAnswered && <ConfidencePrompt value={currentResponse.confidence} onChange={handleSetConfidence} />}
      </Card>

      <div className="assessment-footer-nav">
        <Button variant="secondary" onClick={() => goToQuestion(assessmentState.currentQuestionIndex - 1)} disabled={assessmentState.currentQuestionIndex === 0}>
          <ChevronLeft size={16} /> Previous
        </Button>
        {isLastQuestion ? (
          <Button variant="primary" onClick={() => setSubmitModalOpen(true)}>
            Submit Assessment
          </Button>
        ) : (
          <Button variant="primary" onClick={() => goToQuestion(assessmentState.currentQuestionIndex + 1)}>
            Next <ChevronRight size={16} />
          </Button>
        )}
      </div>

      <SubmitConfirmModal
        open={submitModalOpen}
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
        onContinue={() => setSubmitModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
