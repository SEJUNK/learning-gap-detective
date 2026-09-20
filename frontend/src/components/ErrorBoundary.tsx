import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/Button";
import { EmptyState } from "./ui/EmptyState";
import "./ErrorBoundary.css";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Last-resort safety net: an uncaught render error anywhere in the tree
 * (a malformed AI response that slipped past validation, a bad route
 * param, anything unforeseen) must never leave the student staring at a
 * blank white page with no way forward. Logs the technical error safely
 * to the console (never shown to the user) and offers one clear escape
 * hatch back to a known-good screen.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="error-boundary-shell">
        <EmptyState
          icon={AlertTriangle}
          title="Something went wrong"
          description="An unexpected error occurred. Your progress up to this point should still be saved."
          action={
            <Button variant="primary" onClick={this.handleReload}>
              Return to Overview
            </Button>
          }
        />
      </div>
    );
  }
}
