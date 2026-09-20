import "./CodeBlock.css";

interface CodeBlockProps {
  code: string;
  /** 1-indexed line numbers to visually highlight — for calling out the line a concept applies to. */
  highlightLines?: number[];
}

/**
 * Shared monospace code panel. `overflow-x: auto` is scoped to this
 * element alone, so a long line scrolls within the block, never the
 * page — this is what keeps code readable on mobile without causing
 * page-level horizontal overflow.
 */
export function CodeBlock({ code, highlightLines = [] }: CodeBlockProps) {
  const lines = code.split("\n");
  const highlighted = new Set(highlightLines);

  return (
    <pre className="code-block">
      <code>
        {lines.map((line, index) => (
          <span key={index} className={`code-block-line${highlighted.has(index + 1) ? " highlighted" : ""}`}>
            {line || " "}
          </span>
        ))}
      </code>
    </pre>
  );
}
