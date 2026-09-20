import { FileSearch } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "./EvidenceList.css";

interface EvidenceListProps {
  items: string[];
}

/** Section 3 — "Why we think this." Every item is a hedged, evidence-backed statement, never an unsupported claim. */
export function EvidenceList({ items }: EvidenceListProps) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="evidence-heading">
      <SectionHeader title="Evidence" description="Why we think this — every finding traces back to something specific in your answers." />
      <Card>
        <ul className="evidence-list">
          {items.map((item, index) => (
            <li className="evidence-list-item" key={index}>
              <FileSearch size={16} strokeWidth={2.2} className="evidence-list-icon" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
