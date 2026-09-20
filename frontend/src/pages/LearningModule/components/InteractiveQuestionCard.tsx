import { useState } from "react";
import { CheckCircle2, Lightbulb, ArrowRight } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { AnswerOptions } from "../../../components/ui/AnswerOptions";
import { CodeBlock } from "../../../components/ui/CodeBlock";
import { Button } from "../../../components/ui/Button";
import { checkAnswer } from "../../../services/learningModuleService";
import type { InteractiveQuestion } from "../../../types/learningModule";
import "./InteractiveQuestionCard.css";

interface InteractiveQuestionCardProps {
  question: InteractiveQuestion;
  /** Shown above the question text — e.g. a scenario paragraph for the application challenge. */
  intro?: string;
  nextLabel: string;
  onAnswered: (isCorrect: boolean) => void;
  onNext: () => void;
}

/**
 * The one interaction shape shared by practice questions, the
 * application challenge, and understanding-check questions: select an
 * answer, get immediate feedback (never a bare "Incorrect" — always the
 * specific misconception), then continue. Correctness is tracked via
 * onAnswered so the page can compute the session's accuracy summary and
 * branch adaptively.
 */
export function InteractiveQuestionCard({ question, intro, nextLabel, onAnswered, onNext }: InteractiveQuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelected(index);
    setAnswered(true);
    onAnswered(index === question.correctAnswer);
  };

  const result = answered && selected !== null ? checkAnswer(question, selected) : null;

  return (
    <Card className="interactive-question-card">
      {intro && <p className="interactive-question-intro">{intro}</p>}
      <p className="interactive-question-text">{question.question}</p>
      {question.codeSnippet && <CodeBlock code={question.codeSnippet} />}

      <AnswerOptions
        options={question.options}
        selectedIndex={selected}
        onSelect={handleSelect}
        disabled={answered}
        revealAnswer={answered ? { correctIndex: question.correctAnswer } : undefined}
      />

      {result && (
        <div className={`interactive-question-feedback${result.isCorrect ? " correct" : " incorrect"}`}>
          {result.isCorrect ? <CheckCircle2 size={18} strokeWidth={2.2} /> : <Lightbulb size={18} strokeWidth={2.2} />}
          <p>{result.feedback}</p>
        </div>
      )}

      {answered && (
        <Button variant="primary" className="interactive-question-next" onClick={onNext}>
          {nextLabel} <ArrowRight size={16} strokeWidth={2.4} />
        </Button>
      )}
    </Card>
  );
}
