import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Gauge, BarChart3, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { StatCard } from "../../components/ui/StatCard";
import { GapCard } from "../../components/ui/GapCard";
import { InsightCard } from "../../components/ui/InsightCard";
import { ActionCard } from "../../components/ui/ActionCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { DiagnosisLoadingState } from "./components/DiagnosisLoadingState";
import { RootFindingPanel, type MainFindingKind } from "./components/RootFindingPanel";
import { EvidenceList } from "./components/EvidenceList";
import { LearningGapMap } from "./components/LearningGapMap";
import { getDiagnosis, type DiagnosisResult, type DiagnosisStep } from "../../services/diagnosisService";
import { loadLastEvidence } from "../../services/assessmentStateService";
import { CONCEPT_DISPLAY_NAMES } from "../../constants/conceptGraph";
import type { GapStatus } from "../../constants/gapStatus";
import { ROUTES } from "../../routes/paths";
import type { AssessmentEvidence, ConceptId } from "../../types/assessment";
import "./DiagnosisPage.css";

type PageState = "loading" | "ready" | "error" | "empty";

function displayName(concept: string): string {
  return CONCEPT_DISPLAY_NAMES[concept as ConceptId] ?? concept;
}

export function DiagnosisPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [step, setStep] = useState<DiagnosisStep>("reviewing");
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const evidence = useMemo<AssessmentEvidence | null>(() => {
    const fromNav = (location.state as { evidence?: AssessmentEvidence } | null)?.evidence;
    return fromNav ?? loadLastEvidence<AssessmentEvidence>();
  }, [location.state]);

  useEffect(() => {
    if (!evidence) {
      setPageState("empty");
      return;
    }

    let cancelled = false;
    setPageState("loading");

    getDiagnosis(evidence, (nextStep) => {
      if (!cancelled) setStep(nextStep);
    })
      .then((diagnosisResult) => {
        if (cancelled) return;
        setResult(diagnosisResult);
        setPageState("ready");
      })
      .catch(() => {
        if (!cancelled) setPageState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [evidence]);

  if (pageState === "empty") {
    return (
      <>
        <PageHeader title="Your Learning Diagnosis" description="We analyzed your answers, mistakes and concept relationships." />
        <Card>
          <EmptyState
            icon={Sparkles}
            title="No assessment evidence yet"
            description="Take a diagnostic assessment first — your diagnosis is built entirely from that evidence."
            action={
              <Button variant="primary" onClick={() => navigate(ROUTES.assessment)}>
                Start Diagnostic Assessment
              </Button>
            }
          />
        </Card>
      </>
    );
  }

  if (pageState === "loading") {
    return (
      <>
        <PageHeader title="Your Learning Diagnosis" description="We analyzed your answers, mistakes and concept relationships." />
        <DiagnosisLoadingState currentStep={step} />
      </>
    );
  }

  if (pageState === "error" || !result) {
    return (
      <>
        <PageHeader title="Your Learning Diagnosis" description="We analyzed your answers, mistakes and concept relationships." />
        <Card>
          <ErrorState
            title="We couldn't generate the personalized explanation right now."
            description="You can still continue — try again, or head back to your overview."
            action={
              <Button variant="secondary" onClick={() => navigate(ROUTES.overview)}>
                Back to Overview
              </Button>
            }
          />
        </Card>
      </>
    );
  }

  const { diagnosticEvidence, diagnosis } = result;
  const learningGapsCount = diagnosticEvidence.rootGaps.length + diagnosticEvidence.conceptGaps.length + diagnosticEvidence.applicationGaps.length;

  const primaryRootGap = diagnosticEvidence.rootGaps[0] ?? null;
  const primaryConceptGap = diagnosticEvidence.conceptGaps[0] ?? null;
  const primaryApplicationGap = diagnosticEvidence.applicationGaps[0] ?? null;

  let mainFindingKind: MainFindingKind = "none";
  let mainFindingConcept: string | null = null;
  let mainFindingMastery: number | null = null;
  let mainFindingAffected: string[] = [];
  let mainFindingConfidence: number | null = null;

  if (primaryRootGap) {
    mainFindingKind = "root_gap";
    mainFindingConcept = displayName(primaryRootGap.concept);
    mainFindingMastery = primaryRootGap.mastery;
    mainFindingAffected = primaryRootGap.affectedConcepts.map(displayName);
    mainFindingConfidence = primaryRootGap.confidence;
  } else if (primaryConceptGap) {
    mainFindingKind = "concept_gap";
    mainFindingConcept = displayName(primaryConceptGap.concept);
    mainFindingMastery = primaryConceptGap.mastery;
    mainFindingConfidence = primaryConceptGap.confidence;
  } else if (primaryApplicationGap) {
    mainFindingKind = "application_gap";
    mainFindingConcept = displayName(primaryApplicationGap.concept);
    mainFindingMastery = primaryApplicationGap.conceptualAccuracy;
    mainFindingConfidence = primaryApplicationGap.confidence;
  }

  const mainFindingExplanation = diagnosis.rootCause?.explanation ?? diagnosis.summary;
  const evidenceItems = diagnosis.rootCause?.evidence ?? primaryApplicationGap?.evidence ?? [];

  // Build a lookup the Learning Gap Map uses to color/annotate every node consistently with the findings above.
  const findingsByConcept: Partial<Record<ConceptId, { status: GapStatus; evidence: string[] }>> = {};
  diagnosticEvidence.rootGaps.forEach((f) => (findingsByConcept[f.concept] = { status: "root", evidence: f.evidence }));
  diagnosticEvidence.conceptGaps.forEach((f) => (findingsByConcept[f.concept] ??= { status: "practice", evidence: f.evidence }));
  diagnosticEvidence.applicationGaps.forEach((f) => (findingsByConcept[f.concept] ??= { status: "application", evidence: f.evidence }));
  diagnosticEvidence.strengths.forEach((f) => (findingsByConcept[f.concept] ??= { status: "strength", evidence: f.evidence }));

  return (
    <div className="diagnosis-page">
      <PageHeader title="Your Learning Diagnosis" description="We analyzed your answers, mistakes and concept relationships." />

      {/* Section 1 — Diagnostic Summary */}
      <section aria-labelledby="summary-heading">
        <SectionHeader title="Diagnostic Summary" />
        <div className="diagnosis-summary-grid">
          <StatCard label="Diagnostic Score" value={`${diagnosticEvidence.overallScore.percentage}%`} icon={Gauge} />
          <StatCard label="Concept Mastery" value={`${diagnosticEvidence.conceptMasteryAverage}%`} icon={BarChart3} />
          <StatCard
            label="Learning Gaps"
            value={String(learningGapsCount)}
            icon={AlertTriangle}
            subLabel={primaryRootGap ? "1 root gap detected" : undefined}
            emphasis={learningGapsCount > 0 ? "warning" : undefined}
          />
          <StatCard label="Strong Concepts" value={String(diagnosticEvidence.strengths.length)} icon={CheckCircle2} />
        </div>
      </section>

      {/* Section 2 — Main Finding */}
      <section aria-labelledby="main-finding-heading">
        <RootFindingPanel
          kind={mainFindingKind}
          conceptName={mainFindingConcept}
          mastery={mainFindingMastery}
          explanation={mainFindingExplanation}
          affectedConcepts={mainFindingAffected}
          confidence={mainFindingConfidence}
        />
      </section>

      {/* Section 3 — Why we think this */}
      <EvidenceList items={evidenceItems} />

      {/* Section 4 — Learning Gap Map */}
      <LearningGapMap
        conceptMastery={diagnosticEvidence.conceptMastery}
        prerequisiteGraph={diagnosticEvidence.prerequisiteGraph}
        rootGapConcept={primaryRootGap?.concept ?? null}
        affectedConcepts={primaryRootGap?.affectedConcepts ?? []}
        findingsByConcept={findingsByConcept}
      />

      {/* Section 5 — Other Findings */}
      {(diagnosis.applicationGaps.length > 0 || diagnosis.strengths.length > 0) && (
        <section aria-labelledby="other-findings-heading">
          <SectionHeader title="Other Findings" />
          <div className="diagnosis-other-findings-grid">
            {diagnosis.applicationGaps.map((finding) => {
              const rawFinding = diagnosticEvidence.applicationGaps.find((f) => displayName(f.concept) === finding.concept);
              return (
                <GapCard
                  key={`app-${finding.concept}`}
                  status="application"
                  conceptName={finding.concept}
                  mastery={rawFinding ? diagnosticEvidence.conceptMastery[rawFinding.concept] : 0}
                  explanation={finding.explanation}
                  actionLabel="Practice"
                  route={ROUTES.recoveryPath}
                />
              );
            })}
            {diagnosis.strengths.map((finding) => (
              <GapCard
                key={`strength-${finding.concept}`}
                status="strength"
                conceptName={finding.concept}
                mastery={diagnosticEvidence.strengths.find((f) => displayName(f.concept) === finding.concept)?.mastery ?? 0}
                explanation={finding.explanation}
                actionLabel="View Evidence"
                route={ROUTES.learningMap}
              />
            ))}
          </div>
        </section>
      )}

      {/* Section 6 — AI Explanation */}
      <section aria-labelledby="ai-explanation-heading">
        <SectionHeader title="AI Insight" />
        <InsightCard
          eyebrow="Here's what may be happening"
          title={diagnosis.headline}
          paragraphs={[diagnosis.summary]}
          status={primaryRootGap ? "root" : undefined}
        />
        {diagnosis.source !== "ai" && (
          <p className="diagnosis-source-note">
            {diagnosis.source === "mock"
              ? "No AI provider configured — this explanation was generated from your deterministic assessment evidence."
              : "AI explanation temporarily unavailable. The diagnosis above is based entirely on deterministic assessment evidence, computed with no AI involved."}
          </p>
        )}
      </section>

      {/* Confidence signal */}
      {diagnosis.confidenceInsight && (
        <InsightCard eyebrow="Interesting pattern" title="Worth a second look" description={diagnosis.confidenceInsight} />
      )}

      {/* Section 7 — Recommendation */}
      {diagnosis.recommendations.length > 0 && (
        <section aria-labelledby="recommendation-heading">
          <SectionHeader title="Recommended Next Step" />
          <ActionCard
            eyebrow="Recommended"
            title={mainFindingConcept ? `Strengthen ${mainFindingConcept} first.` : diagnosis.recommendations[0]}
            rationale={diagnosis.recommendations[0]}
            actionLabel="Build My Recovery Path"
            route={ROUTES.recoveryPath}
          />
        </section>
      )}
    </div>
  );
}
