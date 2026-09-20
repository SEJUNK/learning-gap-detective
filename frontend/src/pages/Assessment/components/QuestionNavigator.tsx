import { Check } from "lucide-react";
import "./QuestionNavigator.css";

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  answeredIndices: Set<number>;
  onNavigate: (index: number) => void;
}

/**
 * Desktop: a full grid of numbered question buttons. Mobile: the same
 * buttons in a horizontally scrollable strip instead of consuming
 * vertical space — see QuestionNavigator.css.
 */
export function QuestionNavigator({ totalQuestions, currentIndex, answeredIndices, onNavigate }: QuestionNavigatorProps) {
  return (
    <nav className="question-navigator" aria-label="Question navigator">
      <ul>
        {Array.from({ length: totalQuestions }, (_, index) => {
          const isAnswered = answeredIndices.has(index);
          const isCurrent = index === currentIndex;
          return (
            <li key={index}>
              <button
                type="button"
                className={`question-navigator-item${isCurrent ? " current" : ""}${isAnswered ? " answered" : ""}`}
                onClick={() => onNavigate(index)}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Question ${index + 1}${isAnswered ? ", answered" : ", unanswered"}${isCurrent ? ", current" : ""}`}
              >
                {isAnswered && !isCurrent ? <Check size={13} strokeWidth={2.6} /> : index + 1}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
