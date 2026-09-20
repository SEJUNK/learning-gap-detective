import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, PlayCircle } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { resetDemoState } from "../../services/resetService";
import { isDemoModeEnabled, setDemoModeEnabled, startDemoJourney } from "../../services/demoModeService";
import { ROUTES } from "../../routes/paths";
import "./SettingsPage.css";

/**
 * A real Settings page would hold account/notification preferences —
 * out of scope for this project (no auth, no accounts). What lives here
 * instead is what a hackathon demo genuinely needs: a way to restore a
 * clean starting state and reliably re-run the full journey, without
 * manually clearing browser storage or editing files. See
 * resetService.ts / demoModeService.ts for exactly what each control
 * does — nothing here bypasses real scoring or writes a result directly.
 */
export function SettingsPage() {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(() => isDemoModeEnabled());

  const handleReset = () => {
    resetDemoState();
    setConfirmOpen(false);
    navigate(ROUTES.overview);
    window.location.reload();
  };

  const handleToggleDemoMode = () => {
    const next = !demoMode;
    setDemoModeEnabled(next);
    setDemoMode(next);
  };

  const handleStartDemoJourney = () => {
    const nextRoute = startDemoJourney();
    setDemoMode(true);
    navigate(nextRoute);
  };

  return (
    <div className="settings-page">
      <PageHeader title="Settings" description="Account and preference settings." />

      <section aria-labelledby="demo-controls-heading">
        <SectionHeader title="Demo Controls" description="Tools for running a live, repeatable product demonstration." />

        <Card className="settings-demo-journey-card">
          <div className="settings-reset-text">
            <p className="settings-reset-title">Start Demo Journey</p>
            <p className="settings-reset-description">
              Resets to a clean state, turns on Demo Mode, and takes you straight to the Diagnostic Assessment — the start of
              the full Assess → Diagnose → Recover → Reassess journey.
            </p>
          </div>
          <Button variant="primary" onClick={handleStartDemoJourney}>
            <PlayCircle size={16} /> Start Demo Journey
          </Button>
        </Card>

        <Card className="settings-toggle-card">
          <div className="settings-reset-text">
            <p className="settings-reset-title">Demo Mode</p>
            <p className="settings-reset-description">
              While on, the Assessment and Reassessment screens show a "Fill Demo Answers" button that instantly fills in
              the documented demo answers and jumps to Submit — real scoring still runs on submission, nothing is
              pre-computed. Off by default so the ordinary student experience stays clean.
            </p>
          </div>
          <label className="settings-toggle">
            <input type="checkbox" checked={demoMode} onChange={handleToggleDemoMode} />
            <span className="settings-toggle-track">
              <span className="settings-toggle-thumb" />
            </span>
            <span className="settings-toggle-label">{demoMode ? "On" : "Off"}</span>
          </label>
        </Card>

        <Card className="settings-reset-card">
          <div className="settings-reset-text">
            <p className="settings-reset-title">Reset Demo Data</p>
            <p className="settings-reset-description">
              Clears your assessment, diagnosis-derived mastery, recovery-path progress, and reassessment results, restoring
              the initial demo state so you can run the full walkthrough again from a clean start. This is a local
              development/demo convenience — there's no account system here, so nothing else is affected.
            </p>
          </div>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            <RotateCcw size={16} /> Reset Demo Data
          </Button>
        </Card>
      </section>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Reset all demo progress?">
        <p className="settings-reset-copy">
          This clears every assessment, learning, and reassessment result stored in this browser and reloads the app. This
          can't be undone.
        </p>
        <div className="settings-reset-actions">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleReset}>
            Reset Everything
          </Button>
        </div>
      </Modal>
    </div>
  );
}
