import { useState } from "react";
import { Plus, Download, Trash2, BookOpen, Sparkles } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { SectionHeader } from "../components/ui/SectionHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { Badge } from "../components/ui/Badge";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ProgressBar } from "../components/ui/ProgressBar";
import { ProgressRing } from "../components/ui/ProgressRing";
import { StatCard } from "../components/ui/StatCard";
import { Avatar } from "../components/ui/Avatar";
import { Tooltip } from "../components/ui/Tooltip";
import { Modal } from "../components/ui/Modal";
import { Tabs } from "../components/ui/Tabs";
import { Input } from "../components/ui/Input";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { ErrorState } from "../components/ui/ErrorState";
import { InsightCard } from "../components/ui/InsightCard";
import { ConceptCard } from "../components/ui/ConceptCard";
import { Logo } from "../components/brand/Logo";
import { GAP_STATUS_CONFIG, type GapStatus } from "../constants/gapStatus";
import "./DesignSystemPage.css";

const GAP_STATUSES = Object.keys(GAP_STATUS_CONFIG) as GapStatus[];

const COLOR_SWATCHES = [
  { name: "Accent", varName: "--color-accent" },
  { name: "Success", varName: "--color-success" },
  { name: "Warning", varName: "--color-warning" },
  { name: "Danger", varName: "--color-danger" },
  { name: "Text primary", varName: "--color-text-primary" },
  { name: "Text secondary", varName: "--color-text-secondary" },
  { name: "Border", varName: "--color-border" },
];

/**
 * Internal, dev-only showcase of every reusable component in the design
 * system. Not part of the product's user journey — a verification tool.
 */
export function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="ds-page">
      <PageHeader
        title="Design System"
        description="Internal reference for every reusable component. Not part of the user-facing product."
      />

      <section className="ds-section">
        <SectionHeader title="Brand" description="Logo mark, full wordmark, and compact variant." />
        <Card className="ds-row">
          <Logo variant="full" />
          <Logo variant="compact" />
        </Card>
      </section>

      <section className="ds-section">
        <SectionHeader title="Typography" description="Type scale used across the product." />
        <Card className="ds-stack">
          <p className="ds-type-sample" style={{ fontSize: "var(--font-size-3xl)", fontWeight: 700 }}>
            Page title
          </p>
          <p className="ds-type-sample" style={{ fontSize: "var(--font-size-xl)", fontWeight: 600 }}>
            Section title
          </p>
          <p className="ds-type-sample" style={{ fontSize: "var(--font-size-base)", fontWeight: 600 }}>
            Card title
          </p>
          <p className="ds-type-sample" style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
            Supporting text — used for descriptions and body copy inside cards.
          </p>
          <p className="ds-type-sample" style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
            METADATA / MICROCOPY
          </p>
        </Card>
      </section>

      <section className="ds-section">
        <SectionHeader title="Colors" description="Core palette plus the four learning-gap severities." />
        <Card>
          <div className="ds-swatch-grid">
            {COLOR_SWATCHES.map((swatch) => (
              <div className="ds-swatch" key={swatch.varName}>
                <span className="ds-swatch-color" style={{ background: `var(${swatch.varName})` }} />
                <span className="ds-swatch-label">{swatch.name}</span>
              </div>
            ))}
          </div>
          <div className="ds-swatch-grid" style={{ marginTop: "var(--space-5)" }}>
            {GAP_STATUSES.map((status) => (
              <div className="ds-swatch" key={status}>
                <span className="ds-swatch-color" style={{ background: GAP_STATUS_CONFIG[status].color }} />
                <span className="ds-swatch-label">{GAP_STATUS_CONFIG[status].label}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="ds-section">
        <SectionHeader title="Buttons & icon buttons" />
        <Card className="ds-row">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary">
            <Plus size={16} /> With icon
          </Button>
          <IconButton icon={Download} label="Download" variant="surface" />
          <IconButton icon={Trash2} label="Delete" />
        </Card>
      </section>

      <section className="ds-section">
        <SectionHeader title="Badges & status" description="Learning-gap severity always pairs icon + label + color." />
        <Card className="ds-row">
          <Badge tone="neutral">Neutral</Badge>
          <Badge tone="accent">Accent</Badge>
          <Badge tone="success">Success</Badge>
          <Badge tone="warning">Warning</Badge>
          <Badge tone="danger">Danger</Badge>
        </Card>
        <Card className="ds-row" style={{ marginTop: "var(--space-4)" }}>
          {GAP_STATUSES.map((status) => (
            <StatusBadge status={status} key={status} />
          ))}
        </Card>
      </section>

      <section className="ds-section">
        <SectionHeader title="Progress indicators" />
        <Card className="ds-row ds-row-align-start">
          <div style={{ width: 220 }}>
            <ProgressBar value={72} label="72% mastery" />
          </div>
          <ProgressRing value={72} />
          <ProgressRing value={40} color="var(--color-gap-application)" />
        </Card>
      </section>

      <section className="ds-section">
        <SectionHeader title="Stat cards" />
        <div className="ds-grid">
          <StatCard label="Concepts Assessed" value="24" icon={BookOpen} trend={{ direction: "up", label: "+3 this week" }} />
          <StatCard label="Root Gaps Found" value="2" icon={Sparkles} trend={{ direction: "down", label: "-1 since last check" }} />
          <StatCard label="Avg. Mastery" value="68%" icon={BookOpen} />
        </div>
      </section>

      <section className="ds-section">
        <SectionHeader title="Concept & insight cards" />
        <div className="ds-grid">
          <ConceptCard name="Loops" description="Repeating logic with for and while." mastery={38} status="root" />
          <ConceptCard name="Functions" description="Packaging reusable logic." mastery={64} status="application" />
          <ConceptCard name="Variables" description="Naming and storing values." mastery={95} status="strength" />
        </div>
        <div className="ds-stack" style={{ marginTop: "var(--space-4)" }}>
          <InsightCard
            status="root"
            title="Loops are breaking down at the Conditions prerequisite"
            description="Most incorrect answers on loop questions also missed conditional-logic questions, suggesting the root cause sits one level earlier."
          />
          <InsightCard
            status="strength"
            title="Variables are fully solid"
            description="Consistently correct across every assessment attempt — no remediation needed here."
          />
        </div>
      </section>

      <section className="ds-section">
        <SectionHeader title="Avatars & tooltips" />
        <Card className="ds-row">
          <Avatar name="Alex Carter" />
          <Avatar name="Jordan Lee" size={48} />
          <Tooltip content="Hover or focus to see this tooltip">
            <Button variant="secondary">Hover me</Button>
          </Tooltip>
        </Card>
      </section>

      <section className="ds-section">
        <SectionHeader title="Inputs" />
        <Card style={{ maxWidth: 360 }}>
          <Input label="Student name" placeholder="e.g. Alex Carter" helpText="Used for personalizing your recovery path." />
        </Card>
      </section>

      <section className="ds-section">
        <SectionHeader title="Tabs" />
        <Card>
          <Tabs
            tabs={[
              { id: "one", label: "Overview", content: <p className="ds-tab-copy">Overview tab content.</p> },
              { id: "two", label: "Details", content: <p className="ds-tab-copy">Details tab content.</p> },
              { id: "three", label: "History", content: <p className="ds-tab-copy">History tab content.</p> },
            ]}
          />
        </Card>
      </section>

      <section className="ds-section">
        <SectionHeader title="Modal" />
        <Card>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
        </Card>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Example modal">
          <p>This is example modal content. Press Escape, click outside, or use the close button to dismiss it.</p>
        </Modal>
      </section>

      <section className="ds-section">
        <SectionHeader title="Loading, empty & error states" />
        <div className="ds-grid">
          <Card>
            <LoadingState />
          </Card>
          <Card>
            <EmptyState title="No assessments yet" description="Take your first diagnostic assessment to see results here." />
          </Card>
          <Card>
            <ErrorState description="Could not load this data. Please try again." />
          </Card>
        </div>
      </section>
    </div>
  );
}
