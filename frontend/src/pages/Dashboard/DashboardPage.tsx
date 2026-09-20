import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gauge, TrendingUp, Sparkles as SparklesIcon, AlertTriangle, BookOpen } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { StatCard } from "../../components/ui/StatCard";
import { GapCard } from "../../components/ui/GapCard";
import { InsightCard } from "../../components/ui/InsightCard";
import { ActionCard } from "../../components/ui/ActionCard";
import { TrendChart } from "../../components/ui/TrendChart";
import { ActivityTimeline } from "../../components/ui/ActivityTimeline";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { HowItWorksStrip } from "../../components/ui/HowItWorksStrip";
import { LearningMapSection } from "./sections/LearningMapSection";
import { RecoveryPathSection } from "./sections/RecoveryPathSection";
import { getDashboardData } from "../../services/dashboardService";
import { ROUTES } from "../../routes/paths";
import type { DashboardData } from "../../types/dashboard";
import "./DashboardPage.css";

type LoadState = "loading" | "ready" | "error";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let cancelled = false;

    getDashboardData()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <Card>
        <LoadingState label="Loading your learning data…" />
      </Card>
    );
  }

  if (state === "error" || !data) {
    return (
      <Card>
        <ErrorState description="Could not load your dashboard. Please try again." />
      </Card>
    );
  }

  const { studentProfile, learningHealth, conceptMastery, learningGaps, aiInsight, recoveryPath, assessmentHistory, recentActivity, nextBestAction } =
    data;

  const improvement = assessmentHistory.length > 1 ? assessmentHistory[assessmentHistory.length - 1].score - assessmentHistory[0].score : 0;

  return (
    <div className="dashboard-page">
      <PageHeader
        title={`${getGreeting()}, ${studentProfile.name} 👋`}
        description="Here's what your learning data is telling you."
        action={
          <div className="dashboard-header-actions">
            <span className="dashboard-last-assessment">Last assessment: {studentProfile.lastAssessmentLabel}</span>
            <Button variant="primary" onClick={() => navigate(ROUTES.assessment)}>
              Start Diagnostic Assessment
            </Button>
          </div>
        }
      />

      <HowItWorksStrip />

      {/* 1. Learning Health — highest priority: answers "how am I doing overall?" */}
      <section aria-labelledby="learning-health-heading" className="dashboard-section dashboard-section-primary">
        <SectionHeader title="Learning Health" />
        <div className="stat-grid">
          <StatCard
            label="Overall Mastery"
            value={`${learningHealth.overallMastery}%`}
            icon={Gauge}
            trend={{ direction: "up", label: learningHealth.overallMasteryDeltaLabel.replace("↑ ", "") }}
          />
          <StatCard
            label="Learning Momentum"
            value={learningHealth.momentumLabel}
            icon={TrendingUp}
            trend={{ direction: "up", label: learningHealth.momentumDescription }}
          />
          <StatCard
            label="Strong Concepts"
            value={String(learningHealth.strongConceptsCount)}
            icon={BookOpen}
            subLabel={`of ${learningHealth.totalConceptsCount} concepts`}
          />
          <StatCard
            label="Learning Gaps"
            value={String(learningHealth.gapsCount)}
            icon={AlertTriangle}
            subLabel={`${learningHealth.gapsNeedingAttention} require attention`}
            emphasis="warning"
          />
        </div>
      </section>

      {/* 2. Detected Learning Gaps */}
      <section aria-labelledby="learning-gaps-heading" className="dashboard-section dashboard-section-primary">
        <SectionHeader title="Detected Learning Gaps" />
        {learningGaps.length === 0 ? (
          <Card>
            <EmptyState title="No gaps detected" description="Take a diagnostic assessment to surface learning gaps." />
          </Card>
        ) : (
          <div className="gap-grid">
            {learningGaps.map((gap) => (
              <GapCard
                key={gap.id}
                status={gap.status}
                conceptName={gap.conceptName}
                mastery={gap.mastery}
                explanation={gap.explanation}
                actionLabel={gap.actionLabel}
                route={gap.route}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. AI Insight — root-cause reasoning */}
      <section aria-labelledby="ai-insight-heading" className="dashboard-section dashboard-section-primary">
        <SectionHeader title="AI Insight" />
        <InsightCard
          eyebrow={aiInsight.eyebrow}
          title="Why this is happening"
          paragraphs={aiInsight.paragraphs}
          actionLabel={aiInsight.actionLabel}
          actionRoute={aiInsight.route}
          status="root"
        />
      </section>

      {/* 4. Next Best Action — the single most important instruction on the page */}
      <section aria-labelledby="next-action-heading" className="dashboard-section dashboard-section-primary">
        <SectionHeader title="Your next best step" />
        <ActionCard
          eyebrow="Recommended"
          title={nextBestAction.title}
          rationale={nextBestAction.rationale}
          actionLabel={`${nextBestAction.actionLabel} →`}
          route={nextBestAction.route}
        />
      </section>

      {/* 5. Learning Map */}
      <div className="dashboard-section">
        <LearningMapSection concepts={conceptMastery} />
      </div>

      {/* 6. Recovery Path */}
      <div className="dashboard-section">
        <RecoveryPathSection steps={recoveryPath} />
      </div>

      {/* 7 & 8. Performance + Activity — lowest visual priority, compact side-by-side */}
      <div className="dashboard-lower-grid">
        <section aria-labelledby="performance-heading">
          <SectionHeader title="Recent Performance" />
          <Card>
            <TrendChart points={assessmentHistory} />
            {improvement > 0 && (
              <p className="dashboard-performance-summary">
                <SparklesIcon size={14} strokeWidth={2.2} /> +{improvement}% improvement over {assessmentHistory.length} assessments
              </p>
            )}
          </Card>
        </section>

        <section aria-labelledby="activity-heading">
          <SectionHeader title="Recent Activity" />
          <Card>
            {recentActivity.length === 0 ? (
              <EmptyState title="No recent activity" description="Your activity will show up here." />
            ) : (
              <ActivityTimeline items={recentActivity} />
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
