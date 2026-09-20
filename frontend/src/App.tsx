import { Route, Routes } from "react-router-dom";
import { Map, TrendingUp, Sparkles, AlertCircle } from "lucide-react";
import { AppShell } from "./layouts/AppShell";
import { DashboardPage } from "./pages/Dashboard/DashboardPage";
import { AssessmentPage } from "./pages/Assessment/AssessmentPage";
import { DiagnosisPage } from "./pages/Diagnosis/DiagnosisPage";
import { LearningPathPage } from "./pages/LearningPath/LearningPathPage";
import { LearningModulePage } from "./pages/LearningModule/LearningModulePage";
import { ReassessmentPage } from "./pages/Reassessment/ReassessmentPage";
import { SettingsPage } from "./pages/Settings/SettingsPage";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { DesignSystemPage } from "./pages/DesignSystemPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ROUTES, LEARNING_MODULE_ROUTE_PATTERN } from "./routes/paths";

function App() {
  return (
    <Routes>
      <Route
        path={ROUTES.overview}
        element={
          <AppShell title="Overview">
            <DashboardPage />
          </AppShell>
        }
      />
      <Route
        path={ROUTES.assessment}
        element={
          <AppShell title="Diagnostic Assessment">
            <AssessmentPage />
          </AppShell>
        }
      />
      <Route
        path={ROUTES.learningMap}
        element={
          <AppShell title="Learning Map">
            <ComingSoonPage
              title="Learning Map"
              description="A visual map of every concept you've been assessed on and how solid it is."
              icon={Map}
            />
          </AppShell>
        }
      />
      <Route
        path={ROUTES.recoveryPath}
        element={
          <AppShell title="Your Recovery Path">
            <LearningPathPage />
          </AppShell>
        }
      />
      <Route
        path={LEARNING_MODULE_ROUTE_PATTERN}
        element={
          <AppShell title="Learning Module">
            <LearningModulePage />
          </AppShell>
        }
      />
      <Route
        path={ROUTES.progress}
        element={
          <AppShell title="Progress">
            <ComingSoonPage
              title="Progress"
              description="Before/after comparisons showing whether a learning gap actually improved."
              icon={TrendingUp}
            />
          </AppShell>
        }
      />
      <Route
        path={ROUTES.aiInsights}
        element={
          <AppShell title="AI Insights">
            <ComingSoonPage
              title="AI Insights"
              description="Plain-language explanations of why you're struggling with a concept."
              icon={Sparkles}
            />
          </AppShell>
        }
      />
      <Route
        path={ROUTES.mistakePatterns}
        element={
          <AppShell title="Mistake Patterns">
            <ComingSoonPage
              title="Mistake Patterns"
              description="Recurring mistake types detected across your assessment history."
              icon={AlertCircle}
            />
          </AppShell>
        }
      />
      <Route
        path={ROUTES.diagnosis}
        element={
          <AppShell title="Your Learning Diagnosis">
            <DiagnosisPage />
          </AppShell>
        }
      />
      <Route
        path={ROUTES.reassessment}
        element={
          <AppShell title="Reassessment">
            <ReassessmentPage />
          </AppShell>
        }
      />
      <Route
        path={ROUTES.settings}
        element={
          <AppShell title="Settings">
            <SettingsPage />
          </AppShell>
        }
      />
      <Route path={ROUTES.designSystem} element={<DesignSystemPage />} />
      <Route
        path="*"
        element={
          <AppShell title="Not Found">
            <NotFoundPage />
          </AppShell>
        }
      />
    </Routes>
  );
}

export default App;
