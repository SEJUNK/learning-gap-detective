import "./AnswerOptions.css";

interface AnswerOptionsProps {
  options: string[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  /** When set, options render right/wrong once answered (used by the Learning Module — Assessment never sets this). */
  revealAnswer?: { correctIndex: number };
  disabled?: boolean;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/** Large, touch-friendly, keyboard-accessible single-select answer list. Shared by the Assessment and the Learning Module. */
export function AnswerOptions({ options, selectedIndex, onSelect, revealAnswer, disabled }: AnswerOptionsProps) {
  return (
    <div className="answer-options" role="radiogroup" aria-label="Answer options">
      {options.map((option, index) => {
        const selected = selectedIndex === index;
        const isCode = /^(def |return |for |if |print\(|#)/.test(option.trim());

        let state = "";
        if (revealAnswer) {
          if (index === revealAnswer.correctIndex) state = " correct";
          else if (selected) state = " incorrect";
        } else if (selected) {
          state = " selected";
        }

        return (
          <button
            key={index}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            className={`answer-option${state}`}
            onClick={() => onSelect(index)}
          >
            <span className="answer-option-letter">{LETTERS[index]}</span>
            <span className={`answer-option-text${isCode ? " answer-option-code" : ""}`}>{option}</span>
          </button>
        );
      })}
    </div>
  );
}
